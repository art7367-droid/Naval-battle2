import { useState, useRef } from 'react';
import { Ship, Compartment, CompartmentDeck, CompartmentPosition } from './types';

interface CompartmentLayerEditorProps {
  ship: Ship;
  backgroundImage: string | null;
  onBackgroundImageChange: (image: string | null) => void;
  compartments: Compartment[];
  onCompartmentsChange: (compartments: Compartment[]) => void;
}

interface CompartmentRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  deck: CompartmentDeck;
  position: CompartmentPosition;
  name: string;
}

export default function CompartmentLayerEditor({
  ship,
  backgroundImage,
  onBackgroundImageChange,
  compartments,
  onCompartmentsChange
}: CompartmentLayerEditorProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [selectedCompartment, setSelectedCompartment] = useState<string | null>(null);
  const [compartmentOpacity, setCompartmentOpacity] = useState(0.6);
  const [showCompartments, setShowCompartments] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const width = 478;
  const height = 220;
  const padding = 20;

  // Конвертируем отсеки в прямоугольники для отображения
  const compartmentRects: CompartmentRect[] = compartments.map((comp, idx) => {
    const shipLength = ship.length || 250;
    const numCompartments = Math.ceil(shipLength / 10);
    const compartmentWidth = (width - padding * 2) / numCompartments;
    
    const deckIndex = comp.deck === 'upper' ? 0 : comp.deck === 'middle' ? 1 : 2;
    const positionIndex = comp.positionFromBow ? comp.positionFromBow / 10 : idx % numCompartments;
    
    const superstructureOffset = ship.type === 'battleship' ? 60 : 0;
    const deckHeight = 10; // Уменьшено в 4 раза (было 40)
    const deckGap = 2;
    
    const x = padding + positionIndex * compartmentWidth;
    const y = 25 + superstructureOffset + deckIndex * (deckHeight + deckGap);
    
    return {
      id: comp.id,
      x,
      y,
      width: compartmentWidth - 1,
      height: deckHeight,
      deck: comp.deck,
      position: comp.position,
      name: comp.name
    };
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onBackgroundImageChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setDrawStart({ x, y });
    setDrawCurrent({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDrawCurrent({ x, y });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !drawStart || !drawCurrent) return;
    
    const newWidth = Math.abs(drawCurrent.x - drawStart.x);
    const newHeight = Math.abs(drawCurrent.y - drawStart.y);
    
    if (newWidth > 10 && newHeight > 10) {
      // Определяем палубу и позицию на основе координат
      const superstructureOffset = ship.type === 'battleship' ? 60 : 0;
      const deckHeight = 10; // Уменьшено в 4 раза (было 40)
      const deckGap = 2;
      
      const y = Math.min(drawStart.y, drawCurrent.y);
      let deck: CompartmentDeck = 'upper';
      
      if (y < 25 + superstructureOffset + deckHeight) {
        deck = 'upper';
      } else if (y < 25 + superstructureOffset + 2 * (deckHeight + deckGap)) {
        deck = ship.type === 'destroyer' ? 'lower' : 'middle';
      } else {
        deck = 'lower';
      }
      
      const x = Math.min(drawStart.x, drawCurrent.x);
      const shipLength = ship.length || 250;
      const numCompartments = Math.ceil(shipLength / 10);
      const compartmentWidth = (width - padding * 2) / numCompartments;
      const positionIndex = Math.floor((x - padding) / compartmentWidth);
      
      let position: CompartmentPosition = 'mid';
      const relativePos = positionIndex / numCompartments;
      
      if (relativePos < 0.15) position = 'bow';
      else if (relativePos < 0.35) position = 'forward';
      else if (relativePos < 0.65) position = 'mid';
      else if (relativePos < 0.85) position = 'aft';
      else position = 'stern';
      
      const newCompartment: Compartment = {
        id: `comp_${Date.now()}`,
        position,
        deck,
        side: 'center',
        name: `Отсек ${compartments.length + 1} - ${deck === 'upper' ? 'Верхняя' : deck === 'middle' ? 'Средняя' : 'Нижняя'} палуба`,
        maxHP: 20,
        currentHP: 20,
        status: 'intact',
        watertight: deck !== 'upper',
        armor: 50,
        flooded: 0,
        fire: 0,
        components: [],
        adjacentIds: [],
        lengthMeters: 10,
        positionFromBow: positionIndex * 10
      };
      
      onCompartmentsChange([...compartments, newCompartment]);
    }
    
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  };

  const handleCompartmentClick = (id: string) => {
    setSelectedCompartment(selectedCompartment === id ? null : id);
  };

  const deleteCompartment = (id: string) => {
    onCompartmentsChange(compartments.filter(c => c.id !== id));
    setSelectedCompartment(null);
  };

  const getCompartmentColor = (comp: Compartment) => {
    switch (comp.status) {
      case 'destroyed': return '#dc2626';
      case 'flooded': return '#2563eb';
      case 'on_fire': return '#f97316';
      case 'damaged': return '#ea580c';
      default: return '#16a34a';
    }
  };

  return (
    <div className="space-y-3">
      {/* Панель управления */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
        >
          📁 Загрузить изображение корабля
        </button>
        {backgroundImage && (
          <button
            onClick={() => onBackgroundImageChange(null)}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
          >
            ✕ Удалить изображение
          </button>
        )}
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showCompartments}
            onChange={(e) => setShowCompartments(e.target.checked)}
          />
          Показать отсеки
        </label>
        <label className="flex items-center gap-2 text-xs">
          Прозрачность:
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={compartmentOpacity}
            onChange={(e) => setCompartmentOpacity(parseFloat(e.target.value))}
            className="w-20"
          />
          {Math.round(compartmentOpacity * 100)}%
        </label>
        <div className="px-3 py-1 bg-cyan-900/50 border border-cyan-600 rounded text-xs font-bold text-cyan-300">
          📊 Отсеков на слое 2: {compartments.length}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* SVG редактор */}
      <svg
        width={width}
        height={height}
        className="border border-slate-600 rounded bg-slate-900/50 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* СЛОЙ 1: Фоновое изображение */}
        {backgroundImage && (
          <image
            href={backgroundImage}
            x={padding}
            y={20}
            width={width - padding * 2}
            height={height - 40}
            preserveAspectRatio="xMidYMid meet"
            opacity={0.8}
          />
        )}

        {/* СЛОЙ 2: Отсеки (полупрозрачные) */}
        <g opacity={showCompartments ? compartmentOpacity : 0}>
          {compartmentRects.map((rect) => {
            const comp = compartments.find(c => c.id === rect.id);
            if (!comp) return null;
            
            const isSelected = selectedCompartment === rect.id;
            const color = getCompartmentColor(comp);
            
            return (
              <g key={rect.id}>
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  fill={color}
                  stroke={isSelected ? '#fbbf24' : '#475569'}
                  strokeWidth={isSelected ? 2 : 0.5}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCompartmentClick(rect.id);
                  }}
                  className="cursor-pointer"
                />
                {comp.flooded > 0 && (
                  <text x={rect.x + rect.width / 2} y={rect.y + rect.height / 2}
                        fill="#60a5fa" fontSize="8" textAnchor="middle" dominantBaseline="middle">
                    💧
                  </text>
                )}
                {comp.fire > 0 && (
                  <text x={rect.x + rect.width / 2 + 8} y={rect.y + rect.height / 2}
                        fill="#f97316" fontSize="8" textAnchor="middle" dominantBaseline="middle">
                    🔥
                  </text>
                )}
              </g>
            );
          })}

          {/* Превью рисуемого отсека */}
          {isDrawing && drawStart && drawCurrent && (
            <rect
              x={Math.min(drawStart.x, drawCurrent.x)}
              y={Math.min(drawStart.y, drawCurrent.y)}
              width={Math.abs(drawCurrent.x - drawStart.x)}
              height={Math.abs(drawCurrent.y - drawStart.y)}
              fill="#06b6d4"
              opacity={0.3}
              stroke="#06b6d4"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          )}
        </g>

        {/* Метки */}
        <text x={padding} y={height - 5} fill="#94a3b8" fontSize="8" textAnchor="middle">НОС</text>
        <text x={width - padding} y={height - 5} fill="#94a3b8" fontSize="8" textAnchor="middle">КОРМА</text>
      </svg>

      {/* Панель свойств выбранного отсека */}
      {selectedCompartment && (
        <div className="bg-slate-900/50 border border-slate-700 rounded p-2 space-y-2">
          <div className="text-xs font-bold text-slate-300">Свойства отсека:</div>
          {(() => {
            const comp = compartments.find(c => c.id === selectedCompartment);
            if (!comp) return null;
            
            return (
              <>
                <div className="text-xs text-slate-400">{comp.name}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Палуба:</label>
                    <select
                      value={comp.deck}
                      onChange={(e) => {
                        const updated = compartments.map(c => 
                          c.id === comp.id ? { ...c, deck: e.target.value as CompartmentDeck } : c
                        );
                        onCompartmentsChange(updated);
                      }}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="upper">Верхняя</option>
                      <option value="middle">Средняя</option>
                      <option value="lower">Нижняя</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Позиция:</label>
                    <select
                      value={comp.position}
                      onChange={(e) => {
                        const updated = compartments.map(c => 
                          c.id === comp.id ? { ...c, position: e.target.value as CompartmentPosition } : c
                        );
                        onCompartmentsChange(updated);
                      }}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="bow">Нос</option>
                      <option value="forward">Носовая часть</option>
                      <option value="mid">Центр</option>
                      <option value="aft">Кормовая часть</option>
                      <option value="stern">Корма</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => deleteCompartment(comp.id)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-1 rounded"
                >
                  🗑️ Удалить отсек
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* Легенда */}
      <div className="flex gap-3 text-[9px] justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-600 rounded"></div>
          <span className="text-slate-400">Целый</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-600 rounded"></div>
          <span className="text-slate-400">Повреждён</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-600 rounded"></div>
          <span className="text-slate-400">Затоплен</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-600 rounded"></div>
          <span className="text-slate-400">Разрушен</span>
        </div>
      </div>
    </div>
  );
}
