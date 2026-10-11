import { Ship } from './types';

interface ShipDetailViewProps {
  ship: Ship | null;
}

export default function ShipDetailView({ ship }: ShipDetailViewProps) {
  if (!ship) {
    return (
      <div className="w-[498px] h-full bg-slate-800/50 rounded-lg p-3 border border-slate-600 flex flex-col overflow-hidden">
        <div className="text-center text-slate-400 mt-20">
          <div className="text-4xl mb-2">🚢</div>
          <div>Выберите корабль для просмотра деталей</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[498px] bg-slate-800/50 rounded-lg p-3 border border-slate-600">
      <div className="text-center mb-3">
        <h3 className="text-base font-bold text-cyan-300">
          {ship.type === 'battleship' ? '🚢' : ship.type === 'cruiser' ? '⛴️' : '🚤'} {ship.name}
        </h3>
        <div className="text-xs text-slate-400">
          HP: {ship.currentHP}/{ship.maxHP}
        </div>
      </div>

      <div className="mb-3 p-2 bg-slate-900/50 rounded border border-slate-700">
        <div className="text-[10px] font-bold text-slate-300 mb-1">📊 ХАРАКТЕРИСТИКИ:</div>
        <div className="grid grid-cols-2 gap-1 text-[9px]">
          <div className="flex justify-between">
            <span className="text-slate-400">Скорость:</span>
            <span className="text-green-400">{ship.speed} гексов</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Дальность:</span>
            <span className="text-green-400">{ship.range} гексов</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Точность:</span>
            <span className="text-green-400">{ship.accuracy}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Урон:</span>
            <span className="text-green-400">{ship.damage}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700 pt-2">
        <h4 className="text-[10px] font-semibold text-slate-400 mb-1">⚠️ СОСТОЯНИЕ:</h4>
        <div className="text-[9px]">
          {ship.currentHP > 0 ? (
            <div className="text-green-400">✓ Корабль на ходу</div>
          ) : (
            <div className="text-red-400">✕ Корабль потоплен</div>
          )}
        </div>
      </div>
    </div>
  );
}
