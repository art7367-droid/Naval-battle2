import { useState, useRef, useEffect, useCallback } from 'react';
import { Ship, Compartment, CompartmentDeck, CompartmentPosition as CompartmentPositionType } from './types';

interface GridCompartmentEditorProps {
  ship: Ship;
  backgroundImage: string | null;
  onBackgroundImageChange: (image: string | null) => void;
  compartments: Compartment[];
  onCompartmentsChange: (compartments: Compartment[]) => void;
}

interface GridPosition {
  x: number;
  y: number;
}

interface CompartmentGridPosition {
  gridX: number;
  gridY: number;
}

export default function GridCompartmentEditor({
  ship,
  backgroundImage,
  onBackgroundImageChange,
  compartments,
  onCompartmentsChange
}: GridCompartmentEditorProps) {
  const [selectedCompartment, setSelectedCompartment] = useState<string | null>(null);
  const [selectedCompartments, setSelectedCompartments] = useState<Set<string>>(new Set());
  const [draggingCompartment, setDraggingCompartment] = useState<string | null>(null);
  const [draggingMultiple, setDraggingMultiple] = useState(false);
  const [dragOffset, setDragOffset] = useState<GridPosition>({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState<GridPosition>({ x: 0, y: 0 });
  const [compartmentOpacity, setCompartmentOpacity] = useState(0.7);
  const [showGrid, setShowGrid] = useState(true);
  const [showCompartments, setShowCompartments] = useState(true);
  
  // Позиция фонового изображения
  const [backgroundPosition, setBackgroundPosition] = useState<GridPosition>({ x: 0, y: 0 });
  const [draggingBackground, setDraggingBackground] = useState(false);
  const [backgroundDragOffset, setBackgroundDragOffset] = useState<GridPosition>({ x: 0, y: 0 });
  
  // Выделение мышкой
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<GridPosition | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<GridPosition | null>(null);
  
  // Позиции отсеков в сетке (1 отсек = 1 клетка)
  // Начинаем с пустого редактора - отсеки добавляются вручную
  const [compartmentPositions, setCompartmentPositions] = useState<Map<string, CompartmentGridPosition>>(new Map());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Параметры сетки (фиксированные)
  const cols = 56; // 56 ячеек в длину
  const rows = 23; // 23 ячейки в высоту
  const gridSize = 10; // 10px на ячейку
  const padding = 20; // увеличен padding для лучшего визуального разделения
  const width = cols * gridSize + padding * 2; // 600px
  const height = rows * gridSize + padding * 2; // 270px

  // Синхронизация compartments и compartmentPositions
  useEffect(() => {
    setCompartmentPositions(prevPositions => {
      const newPositions = new Map(prevPositions);
      
      // Добавляем позиции для новых отсеков
      compartments.forEach((comp, idx) => {
        if (!newPositions.has(comp.id)) {
          // Находим свободную клетку
          let foundPosition: CompartmentGridPosition | null = null;
          
          for (let y = rows - 1; y >= 0 && !foundPosition; y--) {
            for (let x = 0; x < cols && !foundPosition; x++) {
              const isOccupied = Array.from(newPositions.values()).some(
                pos => pos.gridX === x && pos.gridY === y
              );
              
              if (!isOccupied) {
                foundPosition = { gridX: x, gridY: y };
              }
            }
          }
          
          const position = foundPosition || { gridX: 0, gridY: rows - 1 };
          newPositions.set(comp.id, position);
        }
      });
      
      // Удаляем позиции для удалённых отсеков
      const compartmentIds = new Set(compartments.map(c => c.id));
      Array.from(newPositions.keys()).forEach(id => {
        if (!compartmentIds.has(id)) {
          newPositions.delete(id);
        }
      });
      
      return newPositions;
    });
  }, [compartments, rows, cols]);

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

  // Обработчики для перетаскивания фона
  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    // Если нажата клавиша Shift, начинаем выделение
    if (e.shiftKey) {
      e.preventDefault();
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) return;

      const mouseX = e.clientX - svgRect.left - padding;
      const mouseY = e.clientY - svgRect.top - padding;

      setIsSelecting(true);
      setSelectionStart({ x: mouseX, y: mouseY });
      setSelectionEnd({ x: mouseX, y: mouseY });
      return;
    }

    // Если нет изображения или не нажат Shift, начинаем перетаскивание фона
    if (!backgroundImage) return;
    e.preventDefault();
    
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;

    setDraggingBackground(true);
    setBackgroundDragOffset({
      x: mouseX - backgroundPosition.x,
      y: mouseY - backgroundPosition.y
    });
  };

  // Обработчики для перетаскивания отсеков
  const handleMouseDown = (e: React.MouseEvent, compId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    const pos = compartmentPositions.get(compId);
    if (!pos) return;

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const mouseX = e.clientX - svgRect.left - padding;
    const mouseY = e.clientY - svgRect.top - padding;
    
    const compX = pos.gridX * gridSize;
    const compY = pos.gridY * gridSize;

    setDraggingCompartment(compId);
    setDragOffset({
      x: mouseX - compX,
      y: mouseY - compY
    });
    setDragPosition({
      x: pos.gridX,
      y: pos.gridY
    });
    setSelectedCompartment(compId);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;

    if (isSelecting) {
      // Выделение мышкой
      const relX = mouseX - padding;
      const relY = mouseY - padding;
      setSelectionEnd({ x: relX, y: relY });
    } else if (draggingBackground) {
      // Перетаскивание фона
      const newX = mouseX - backgroundDragOffset.x;
      const newY = mouseY - backgroundDragOffset.y;
      setBackgroundPosition({ x: newX, y: newY });
    } else if (draggingCompartment) {
      // Перетаскивание отсека
      const relX = mouseX - padding;
      const relY = mouseY - padding;

      const newGridX = Math.round((relX - dragOffset.x) / gridSize);
      const newGridY = Math.round((relY - dragOffset.y) / gridSize);

      const clampedX = Math.max(0, Math.min(newGridX, cols - 1));
      const clampedY = Math.max(0, Math.min(newGridY, rows - 1));

      setDragPosition({ x: clampedX, y: clampedY });
    }
  }, [isSelecting, draggingBackground, draggingCompartment, backgroundDragOffset, dragOffset, gridSize, cols, rows]);

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionStart && selectionEnd) {
      // Завершение выделения
      const minX = Math.min(selectionStart.x, selectionEnd.x);
      const maxX = Math.max(selectionStart.x, selectionEnd.x);
      const minY = Math.min(selectionStart.y, selectionEnd.y);
      const maxY = Math.max(selectionStart.y, selectionEnd.y);

      // Находим отсеки в области выделения
      const selected = new Set<string>();
      compartmentPositions.forEach((pos, id) => {
        const compX = pos.gridX * gridSize;
        const compY = pos.gridY * gridSize;
        
        if (compX >= minX && compX <= maxX && compY >= minY && compY <= maxY) {
          selected.add(id);
        }
      });

      setSelectedCompartments(selected);
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    } else if (draggingCompartment) {
      // Сохраняем позицию отсека в Map
      const newPositions = new Map(compartmentPositions);
      newPositions.set(draggingCompartment, {
        gridX: dragPosition.x,
        gridY: dragPosition.y
      });
      setCompartmentPositions(newPositions);
      
      // Обновляем compartments с новой позицией
      const updatedCompartments = compartments.map(c => {
        if (c.id === draggingCompartment) {
          return {
            ...c,
            positionFromBow: dragPosition.x * 5 // 5 метров на клетку
          };
        }
        return c;
      });
      onCompartmentsChange(updatedCompartments);
    }
    
    setDraggingCompartment(null);
    setDraggingBackground(false);
  }, [isSelecting, selectionStart, selectionEnd, draggingCompartment, draggingBackground, dragPosition, compartmentPositions, compartments, onCompartmentsChange, gridSize]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleSvgClick = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as Element).tagName === 'rect') {
      setSelectedCompartment(null);
    }
  };

  const addCompartment = () => {
    const newCompartment: Compartment = {
      id: `comp_${Date.now()}_${Math.random()}`,
      position: 'mid',
      deck: 'lower',
      side: 'center',
      name: `Отсек ${compartments.length + 1}`,
      maxHP: 20,
      currentHP: 20,
      status: 'intact',
      watertight: true,
      armor: 50,
      flooded: 0,
      fire: 0,
      components: [],
      adjacentIds: [],
      lengthMeters: 5, // 5 метров на отсек
      positionFromBow: 0
    };

    // Находим свободную клетку в нижнем левом углу
    let targetPosition: CompartmentGridPosition = { gridX: 0, gridY: rows - 1 };
    
    // Проверяем, занята ли клетка (0, rows-1)
    const isOccupied = Array.from(compartmentPositions.values()).some(
      pos => pos.gridX === 0 && pos.gridY === rows - 1
    );
    
    if (isOccupied) {
      // Ищем следующую свободную клетку слева направо, снизу вверх
      for (let y = rows - 1; y >= 0; y--) {
        for (let x = 0; x < cols; x++) {
          const cellOccupied = Array.from(compartmentPositions.values()).some(
            pos => pos.gridX === x && pos.gridY === y
          );
          if (!cellOccupied) {
            targetPosition = { gridX: x, gridY: y };
            break;
          }
        }
        if (targetPosition.gridX !== 0 || targetPosition.gridY !== rows - 1) {
          break;
        }
      }
    }

    // Добавляем отсек с позицией
    const newPositions = new Map(compartmentPositions);
    newPositions.set(newCompartment.id, targetPosition);
    setCompartmentPositions(newPositions);
    
    onCompartmentsChange([...compartments, newCompartment]);
    setSelectedCompartment(newCompartment.id);
  };

  const deleteCompartment = (id: string) => {
    // Просто удаляем отсек - useEffect автоматически удалит позицию
    onCompartmentsChange(compartments.filter(c => c.id !== id));
    
    // Снимаем выделение, если удалили выбранный отсек
    if (selectedCompartment === id) {
      setSelectedCompartment(null);
    }
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

  const updateCompartment = (id: string, updates: Partial<Compartment>) => {
    const updatedCompartments = compartments.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    onCompartmentsChange(updatedCompartments);
  };

  return (
    <div className="space-y-3">
      {/* Панель управления */}
      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
        >
          📁 Загрузить изображение
        </button>
        {backgroundImage && (
          <>
            <button
              onClick={() => onBackgroundImageChange(null)}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
            >
              ✕ Удалить изображение
            </button>
            <button
              onClick={() => setBackgroundPosition({ x: 0, y: 0 })}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
            >
              🎯 Сбросить позицию фона
            </button>
          </>
        )}
        <button
          onClick={addCompartment}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
        >
          ➕ Добавить отсек
        </button>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
          />
          Сетка
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showCompartments}
            onChange={(e) => setShowCompartments(e.target.checked)}
          />
          Отсеки
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
          📊 Отсеков: {compartments.length}
        </div>
        {selectedCompartments.size > 0 && (
          <>
            <div className="px-3 py-1 bg-yellow-900/50 border border-yellow-600 rounded text-xs font-bold text-yellow-300">
              ✓ Выделено: {selectedCompartments.size}
            </div>
            <button
              onClick={() => {
                setSelectedCompartments(new Set());
                setSelectedCompartment(null);
              }}
              className="px-3 py-1 bg-slate-600 hover:bg-slate-700 rounded text-xs"
            >
              ✕ Снять выделение
            </button>
          </>
        )}
        <div className="text-xs text-slate-400">
          💡 Shift+клик для множественного выделения | Shift+перетаскивание для выделения рамкой
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* SVG редактор с сеткой */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-slate-600 rounded bg-slate-900/50 cursor-default"
        onClick={handleSvgClick}
        onMouseDown={handleBackgroundMouseDown}
      >
        {/* СЛОЙ 1: Фоновое изображение (перетаскиваемое) */}
        {backgroundImage && (
          <image
            href={backgroundImage}
            x={backgroundPosition.x}
            y={backgroundPosition.y}
            width={width}
            height={height}
            preserveAspectRatio="xMidYMid meet"
            opacity={0.8}
            className="cursor-move"
          />
        )}

        {/* СЕТКА */}
        {showGrid && (
          <g opacity={0.3}>
            {Array.from({ length: cols + 1 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={padding + i * gridSize}
                y1={padding}
                x2={padding + i * gridSize}
                y2={height - padding}
                stroke="#64748b"
                strokeWidth="0.5"
              />
            ))}
            {Array.from({ length: rows + 1 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={padding}
                y1={padding + i * gridSize}
                x2={width - padding}
                y2={padding + i * gridSize}
                stroke="#64748b"
                strokeWidth="0.5"
              />
            ))}
          </g>
        )}

        {/* СЛОЙ 2: Отсеки (1 клетка = 1 отсек) */}
        {showCompartments && compartments.map((comp) => {
          const pos = compartmentPositions.get(comp.id);
          if (!pos) return null;
          
          const isSelected = selectedCompartment === comp.id || selectedCompartments.has(comp.id);
          const isDragging = draggingCompartment === comp.id;
          const color = getCompartmentColor(comp);
          
          const displayX = isDragging ? dragPosition.x : pos.gridX;
          const displayY = isDragging ? dragPosition.y : pos.gridY;

          return (
            <g
              key={comp.id}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (e.shiftKey) {
                  // Добавляем/удаляем из множественного выделения
                  const newSelected = new Set(selectedCompartments);
                  if (newSelected.has(comp.id)) {
                    newSelected.delete(comp.id);
                  } else {
                    newSelected.add(comp.id);
                  }
                  setSelectedCompartments(newSelected);
                } else {
                  // Одиночное выделение и начало перетаскивания
                  setSelectedCompartments(new Set([comp.id]));
                  handleMouseDown(e, comp.id);
                }
              }}
              className="cursor-move"
            >
              <rect
                x={padding + displayX * gridSize}
                y={padding + displayY * gridSize}
                width={gridSize}
                height={gridSize}
                fill={color}
                opacity={compartmentOpacity}
                stroke={isSelected ? '#fbbf24' : isDragging ? '#06b6d4' : '#475569'}
                strokeWidth={isSelected || isDragging ? 2 : 1}
              />
              {comp.flooded > 0 && (
                <text
                  x={padding + displayX * gridSize + gridSize / 2}
                  y={padding + displayY * gridSize + gridSize / 2}
                  fill="#60a5fa"
                  fontSize="6"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  pointerEvents="none"
                >
                  💧
                </text>
              )}
              {comp.fire > 0 && (
                <text
                  x={padding + displayX * gridSize + gridSize / 2}
                  y={padding + displayY * gridSize + gridSize / 2}
                  fill="#f97316"
                  fontSize="6"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  pointerEvents="none"
                >
                  🔥
                </text>
              )}
            </g>
          );
        })}

        {/* Прямоугольник выделения мышкой */}
        {isSelecting && selectionStart && selectionEnd && (
          <rect
            x={padding + Math.min(selectionStart.x, selectionEnd.x)}
            y={padding + Math.min(selectionStart.y, selectionEnd.y)}
            width={Math.abs(selectionEnd.x - selectionStart.x)}
            height={Math.abs(selectionEnd.y - selectionStart.y)}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3b82f6"
            strokeWidth="1"
            strokeDasharray="4,4"
            pointerEvents="none"
          />
        )}

        {/* Метки */}
        <text x={padding} y={height - 2} fill="#94a3b8" fontSize="8">НОС</text>
        <text x={width - padding - 30} y={height - 2} fill="#94a3b8" fontSize="8">КОРМА</text>
      </svg>

      {/* Панель свойств выбранного отсека */}
      {selectedCompartments.size > 0 && (
        <div className="bg-slate-900/50 border border-slate-700 rounded p-3 space-y-2">
          <div className="text-xs font-bold text-slate-300">
            {selectedCompartments.size === 1 ? 'Свойства отсека:' : `Выбрано отсеков: ${selectedCompartments.size}`}
          </div>
          {selectedCompartments.size === 1 ? (
            // Одиночное выделение - показываем свойства
            (() => {
              const compId = Array.from(selectedCompartments)[0];
              const comp = compartments.find(c => c.id === compId);
              if (!comp) return null;

              return (
                <>
                  <div className="text-xs text-slate-400">{comp.name}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400">Палуба:</label>
                      <select
                        value={comp.deck}
                        onChange={(e) => updateCompartment(comp.id, { deck: e.target.value as CompartmentDeck })}
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
                        onChange={(e) => updateCompartment(comp.id, { position: e.target.value as CompartmentPositionType })}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                      >
                        <option value="bow">Нос</option>
                        <option value="forward">Носовая часть</option>
                        <option value="mid">Центр</option>
                        <option value="aft">Кормовая часть</option>
                        <option value="stern">Корма</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Статус:</label>
                      <select
                        value={comp.status}
                        onChange={(e) => updateCompartment(comp.id, { status: e.target.value as any })}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                      >
                        <option value="intact">Целый</option>
                        <option value="damaged">Повреждён</option>
                        <option value="flooded">Затоплен</option>
                        <option value="on_fire">Пожар</option>
                        <option value="destroyed">Разрушен</option>
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
            })()
          ) : (
            // Множественное выделение - показываем общие действия
            <div className="space-y-2">
              <div className="text-xs text-slate-400">
                Вы можете изменить статус для всех выбранных отсеков:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const updated = compartments.map(c => 
                      selectedCompartments.has(c.id) ? { ...c, status: 'intact' as const } : c
                    );
                    onCompartmentsChange(updated);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 rounded"
                >
                  ✓ Целый
                </button>
                <button
                  onClick={() => {
                    const updated = compartments.map(c => 
                      selectedCompartments.has(c.id) ? { ...c, status: 'damaged' as const } : c
                    );
                    onCompartmentsChange(updated);
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs py-1 rounded"
                >
                  ⚠ Повреждён
                </button>
                <button
                  onClick={() => {
                    const updated = compartments.map(c => 
                      selectedCompartments.has(c.id) ? { ...c, status: 'flooded' as const } : c
                    );
                    onCompartmentsChange(updated);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 rounded"
                >
                  💧 Затоплен
                </button>
                <button
                  onClick={() => {
                    const updated = compartments.map(c => 
                      selectedCompartments.has(c.id) ? { ...c, status: 'destroyed' as const } : c
                    );
                    onCompartmentsChange(updated);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 rounded"
                >
                  ✕ Разрушен
                </button>
              </div>
              <button
                onClick={() => {
                  const remaining = compartments.filter(c => !selectedCompartments.has(c.id));
                  onCompartmentsChange(remaining);
                  setSelectedCompartments(new Set());
                  setSelectedCompartment(null);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-1 rounded"
              >
                🗑️ Удалить все выбранные ({selectedCompartments.size})
              </button>
            </div>
          )}
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
