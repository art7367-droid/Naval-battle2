import { Ship } from './types';
import ShipSchematic from './ShipSchematic';

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

  const allEffects: { name: string; effect: string; severity: 'damaged' | 'destroyed' }[] = [];
  ship.compartments.forEach(comp => {
    comp.components.forEach(component => {
      if (component.status !== 'operational') {
        allEffects.push({
          name: component.name,
          effect: component.effect,
          severity: component.status
        });
      }
    });
    if (comp.status === 'flooded') {
      allEffects.push({
        name: `${comp.name} (затоплен)`,
        effect: 'Снижает плавучесть',
        severity: 'damaged'
      });
    }
  });

  return (
    <div className="w-[498px] bg-slate-800/50 rounded-lg p-3 border border-slate-600 flex flex-col overflow-hidden">
      <div className="text-center mb-2 flex-shrink-0">
        <h3 className="text-base font-bold text-cyan-300">
          {ship.type === 'battleship' ? '🚢' : ship.type === 'cruiser' ? '⛴️' : '🚤'} {ship.name}
        </h3>
        <div className="text-xs text-slate-400">
          HP: {ship.currentHP}/{ship.maxHP}
        </div>
      </div>

      <div className="mb-2 flex-shrink-0">
        <ShipSchematic ship={ship} />
      </div>

      <div className="mb-2 p-2 bg-slate-900/50 rounded border border-slate-700 flex-shrink-0">
        <div className="text-[10px] font-bold text-slate-300 mb-1">📊 ХАРАКТЕРИСТИКИ:</div>
        <div className="grid grid-cols-2 gap-1 text-[9px]">
          <div className="flex justify-between">
            <span className="text-slate-400">Скорость:</span>
            <span className={ship.stats.speed < 0.7 ? 'text-orange-400' : 'text-green-400'}>
              {Math.round(ship.stats.speed * 100)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Управл.:</span>
            <span className={ship.stats.maneuverability < 0.7 ? 'text-orange-400' : 'text-green-400'}>
              {Math.round(ship.stats.maneuverability * 100)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Огонь ГК:</span>
            <span className={ship.stats.mainGunFire < 0.7 ? 'text-orange-400' : 'text-green-400'}>
              {Math.round(ship.stats.mainGunFire * 100)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">ПВО:</span>
            <span className={ship.stats.aaFire < 0.7 ? 'text-orange-400' : 'text-green-400'}>
              {Math.round(ship.stats.aaFire * 100)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Обнаруж.:</span>
            <span className={ship.stats.detection < 0.7 ? 'text-orange-400' : 'text-green-400'}>
              {Math.round(ship.stats.detection * 100)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Плавуч.:</span>
            <span className={ship.stats.buoyancy < 0.7 ? 'text-red-400' : 'text-green-400'}>
              {Math.round(ship.stats.buoyancy * 100)}%
            </span>
          </div>
        </div>
        {(ship.stats.flooding > 0 || ship.stats.fires > 0 || ship.stats.list !== 0 || ship.stats.trim !== 0) && (
          <div className="mt-1 pt-1 border-t border-slate-700 grid grid-cols-2 gap-1 text-[9px]">
            {ship.stats.flooding > 0 && (
              <div className="flex justify-between">
                <span className="text-blue-400">💧 Затопление:</span>
                <span className="text-blue-300">{Math.round(ship.stats.flooding * 100)}%</span>
              </div>
            )}
            {ship.stats.fires > 0 && (
              <div className="flex justify-between">
                <span className="text-orange-400">🔥 Пожары:</span>
                <span className="text-orange-300">{ship.stats.fires}</span>
              </div>
            )}
            {ship.stats.list !== 0 && (
              <div className="flex justify-between">
                <span className="text-purple-400">⚖️ Крен:</span>
                <span className="text-purple-300">
                  {ship.stats.list > 0 ? '→' : '←'}{Math.round(Math.abs(ship.stats.list) * 100)}%
                </span>
              </div>
            )}
            {ship.stats.trim !== 0 && (
              <div className="flex justify-between">
                <span className="text-purple-400">📐 Дифферент:</span>
                <span className="text-purple-300">
                  {ship.stats.trim > 0 ? '↑' : '↓'}{Math.round(Math.abs(ship.stats.trim) * 100)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-700 pt-2 flex-shrink-0">
        <h4 className="text-[10px] font-semibold text-slate-400 mb-1">⚠️ КРИТИЧЕСКИЕ ПОВРЕЖДЕНИЯ:</h4>
        <div className="space-y-0.5 max-h-[80px] overflow-y-auto">
          {allEffects.length > 0 ? (
            allEffects.map((effect, idx) => (
              <div key={idx} className="text-[9px]">
                <span className={effect.severity === 'destroyed' ? 'text-red-400' : 'text-orange-400'}>
                  • {effect.name}:
                </span>
                <span className="text-slate-300 ml-1">{effect.effect}</span>
              </div>
            ))
          ) : (
            <div className="text-[9px] text-green-400">✓ Все системы работают нормально</div>
          )}
        </div>
      </div>
    </div>
  );
}
