import { Ship, Compartment, CompartmentPosition, CompartmentDeck } from './types';

interface ShipSchematicProps {
  ship: Ship;
}

export default function ShipSchematic({ ship }: ShipSchematicProps) {
  const getCompartmentColor = (comp: Compartment) => {
    switch (comp.status) {
      case 'destroyed': return '#dc2626';
      case 'flooded': return '#2563eb';
      case 'damaged': return '#ea580c';
      default: return '#16a34a';
    }
  };

  const getCompartmentById = (position: CompartmentPosition, deck: CompartmentDeck) => {
    return ship.compartments.find(c => c.position === position && c.deck === deck && c.side === 'center');
  };

  const renderSideView = () => {
    const width = 478;
    const height = 120;
    const positions: CompartmentPosition[] = ['bow', 'forward', 'mid', 'aft', 'stern'];
    const decks: CompartmentDeck[] = ['upper', 'middle', 'lower', 'bottom'];
    
    const positionWidth = width / positions.length;
    const deckHeight = height / decks.length;

    return (
      <svg width={width} height={height} className="border border-slate-600 rounded bg-slate-900/50">
        <text x="10" y="15" fill="#94a3b8" fontSize="10" fontWeight="bold">ВИД СБОКУ</text>
        
        {positions.map((pos, pi) => {
          return decks.map((deck, di) => {
            const comp = getCompartmentById(pos, deck);
            if (!comp) return null;

            const x = pi * positionWidth;
            const y = di * deckHeight + 20;
            const color = getCompartmentColor(comp);

            return (
              <g key={`side-${pos}-${deck}`}>
                <rect
                  x={x + 1}
                  y={y + 1}
                  width={positionWidth - 2}
                  height={deckHeight - 2}
                  fill={color}
                  opacity={0.7}
                  stroke="#475569"
                  strokeWidth="0.5"
                />
                {comp.flooded > 0 && (
                  <text x={x + positionWidth / 2} y={y + deckHeight / 2} 
                        fill="#60a5fa" fontSize="8" textAnchor="middle" dominantBaseline="middle">
                    💧
                  </text>
                )}
                {comp.fire > 0 && (
                  <text x={x + positionWidth / 2 + 10} y={y + deckHeight / 2} 
                        fill="#f97316" fontSize="8" textAnchor="middle" dominantBaseline="middle">
                    🔥
                  </text>
                )}
              </g>
            );
          });
        })}

        {positions.map((pos, i) => (
          <text key={pos} x={i * positionWidth + positionWidth / 2} y={height - 2}
                fill="#94a3b8" fontSize="8" textAnchor="middle">
            {pos === 'bow' ? 'Нос' : pos === 'forward' ? 'Нос.' : pos === 'mid' ? 'Центр' : pos === 'aft' ? 'Корм.' : 'Корма'}
          </text>
        ))}

        {decks.map((deck, i) => (
          <text key={deck} x={5} y={i * deckHeight + 20 + deckHeight / 2}
                fill="#94a3b8" fontSize="7" dominantBaseline="middle">
            {deck === 'upper' ? 'Верх' : deck === 'middle' ? 'Сред' : deck === 'lower' ? 'Низ' : 'Дно'}
          </text>
        ))}
      </svg>
    );
  };

  const renderTopView = () => {
    const width = 478;
    const height = 100;
    const positions: CompartmentPosition[] = ['bow', 'forward', 'mid', 'aft', 'stern'];
    
    const positionWidth = width / positions.length;

    return (
      <svg width={width} height={height} className="border border-slate-600 rounded bg-slate-900/50">
        <text x="10" y="15" fill="#94a3b8" fontSize="10" fontWeight="bold">ВИД СВЕРХУ</text>
        
        {positions.map((pos, pi) => {
          const comp = getCompartmentById(pos, 'upper');
          if (!comp) return null;

          const x = pi * positionWidth;
          const y = 20;
          const color = getCompartmentColor(comp);

          return (
            <g key={`top-${pos}`}>
              <rect
                x={x + 1}
                y={y + 1}
                width={positionWidth - 2}
                height={height - 40}
                fill={color}
                opacity={0.7}
                stroke="#475569"
                strokeWidth="0.5"
              />
              {comp.flooded > 0 && (
                <text x={x + positionWidth / 2} y={y + (height - 40) / 2} 
                      fill="#60a5fa" fontSize="10" textAnchor="middle" dominantBaseline="middle">
                  💧
                </text>
              )}
              {comp.fire > 0 && (
                <text x={x + positionWidth / 2 + 15} y={y + (height - 40) / 2} 
                      fill="#f97316" fontSize="10" textAnchor="middle" dominantBaseline="middle">
                  🔥
                </text>
              )}
            </g>
          );
        })}

        {positions.map((pos, i) => (
          <text key={pos} x={i * positionWidth + positionWidth / 2} y={height - 2}
                fill="#94a3b8" fontSize="8" textAnchor="middle">
            {pos === 'bow' ? 'Нос' : pos === 'forward' ? 'Нос.' : pos === 'mid' ? 'Центр' : pos === 'aft' ? 'Корм.' : 'Корма'}
          </text>
        ))}
      </svg>
    );
  };

  return (
    <div className="space-y-2">
      {renderSideView()}
      {renderTopView()}
      
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
