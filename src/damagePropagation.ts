import { Ship, Compartment, BattleLogEntry } from './types';

// Генерация ID для записей журнала
let logIdCounter = 0;
function generateLogId(): string {
  return `log_${Date.now()}_${logIdCounter++}`;
}

// Создание записи журнала
function createLogEntry(
  turn: number,
  type: BattleLogEntry['type'],
  shipId: number,
  shipName: string,
  message: string,
  severity: BattleLogEntry['severity'],
  compartmentId?: string,
  compartmentName?: string
): BattleLogEntry {
  return {
    id: generateLogId(),
    turn,
    timestamp: Date.now(),
    type,
    shipId,
    shipName,
    compartmentId,
    compartmentName,
    message,
    severity
  };
}

// Распространение пожаров между отсеками
export function propagateFires(ships: Ship[], turn: number): { ships: Ship[]; newLogs: BattleLogEntry[] } {
  const newLogs: BattleLogEntry[] = [];
  
  const updatedShips = ships.map(ship => {
    if (ship.isSunk) return ship;
    
    const updatedCompartments = ship.compartments.map(comp => ({ ...comp }));
    const shipLogs: BattleLogEntry[] = [];
    
    // Находим отсеки с пожарами
    const burningCompartments = updatedCompartments.filter(c => c.fire > 0);
    
    burningCompartments.forEach(burningComp => {
      // Увеличиваем огонь в текущем отсеке (если есть топливо)
      const hasFuel = burningComp.components.some(c => c.type === 'fuel_tank');
      if (hasFuel && burningComp.fire < 1.0) {
        burningComp.fire = Math.min(1.0, burningComp.fire + 0.05);
      }
      
      // Распространение на соседние отсеки
      burningComp.adjacentIds.forEach(adjId => {
        const adjacentComp = updatedCompartments.find(c => c.id === adjId);
        if (!adjacentComp) return;
        
        // Вероятность распространения зависит от интенсивности пожара
        const spreadChance = burningComp.fire * 0.3; // 30% шанс при полном пожаре
        
        if (Math.random() < spreadChance) {
          // Распространение через водонепроницаемые переборки менее вероятно
          const watertightModifier = adjacentComp.watertight ? 0.5 : 1.0;
          
          if (Math.random() < watertightModifier) {
            if (adjacentComp.fire === 0) {
              // Новый пожар
              adjacentComp.fire = 0.2;
              adjacentComp.status = 'on_fire';
              
              shipLogs.push(createLogEntry(
                turn,
                'fire_spread',
                ship.id,
                ship.name,
                `🔥 Пожар распространился из "${burningComp.name}" в "${adjacentComp.name}"`,
                'warning',
                adjacentComp.id,
                adjacentComp.name
              ));
            } else {
              // Усиление существующего пожара
              adjacentComp.fire = Math.min(1.0, adjacentComp.fire + 0.1);
            }
          }
        }
      });
    });
    
    // Урон компонентам от пожаров
    updatedCompartments.forEach(comp => {
      if (comp.fire > 0) {
        comp.components = comp.components.map(component => {
          const damageChance = comp.fire * 0.2; // 20% шанс повреждения за ход
          if (Math.random() < damageChance) {
            const damage = Math.floor(component.maxHP * 0.1);
            const newHP = Math.max(0, component.currentHP - damage);
            
            if (newHP <= 0 && component.status !== 'destroyed') {
              shipLogs.push(createLogEntry(
                turn,
                'critical_damage',
                ship.id,
                ship.name,
                `💥 ${component.name} уничтожен пожаром в "${comp.name}"`,
                'critical',
                comp.id,
                comp.name
              ));
            }
            
            return {
              ...component,
              currentHP: newHP,
              status: newHP <= 0 ? 'destroyed' as const : newHP < component.maxHP * 0.5 ? 'damaged' as const : component.status
            };
          }
          return component;
        });
      }
    });
    
    return {
      ...ship,
      compartments: updatedCompartments,
      battleLog: [...ship.battleLog, ...shipLogs]
    };
  });
  
  return { ships: updatedShips, newLogs };
}

// Распространение затоплений между отсеками
export function propagateFlooding(ships: Ship[], turn: number): { ships: Ship[]; newLogs: BattleLogEntry[] } {
  const newLogs: BattleLogEntry[] = [];
  
  const updatedShips = ships.map(ship => {
    if (ship.isSunk) return ship;
    
    const updatedCompartments = ship.compartments.map(comp => ({ ...comp }));
    const shipLogs: BattleLogEntry[] = [];
    
    // Находим затопленные отсеки
    const floodedCompartments = updatedCompartments.filter(c => c.flooded > 0);
    
    floodedCompartments.forEach(floodedComp => {
      // Распространение на соседние отсеки
      floodedComp.adjacentIds.forEach(adjId => {
        const adjacentComp = updatedCompartments.find(c => c.id === adjId);
        if (!adjacentComp) return;
        
        // Вероятность распространения зависит от уровня затопления
        const spreadChance = floodedComp.flooded * 0.25; // 25% шанс при полном затоплении
        
        if (Math.random() < spreadChance) {
          // Водонепроницаемые переборки сильно замедляют распространение
          const watertightModifier = adjacentComp.watertight ? 0.2 : 1.0;
          
          if (Math.random() < watertightModifier) {
            if (adjacentComp.flooded === 0) {
              // Новое затопление
              adjacentComp.flooded = 0.15;
              if (adjacentComp.status === 'intact' || adjacentComp.status === 'damaged') {
                adjacentComp.status = 'flooded';
              }
              
              shipLogs.push(createLogEntry(
                turn,
                'flooding_spread',
                ship.id,
                ship.name,
                `🌊 Затопление распространилось из "${floodedComp.name}" в "${adjacentComp.name}"${adjacentComp.watertight ? ' (через повреждённую переборку)' : ''}`,
                'warning',
                adjacentComp.id,
                adjacentComp.name
              ));
            } else {
              // Усиление затопления
              adjacentComp.flooded = Math.min(1.0, adjacentComp.flooded + 0.08);
            }
          }
        }
      });
    });
    
    // Насосы замедляют затопление
    updatedCompartments.forEach(comp => {
      if (comp.flooded > 0) {
        const pump = comp.components.find(c => c.type === 'pump' && c.status === 'operational');
        if (pump) {
          comp.flooded = Math.max(0, comp.flooded - 0.05);
        }
      }
    });
    
    return {
      ...ship,
      compartments: updatedCompartments,
      battleLog: [...ship.battleLog, ...shipLogs]
    };
  });
  
  return { ships: updatedShips, newLogs };
}

// Проверка на взрыв боезапаса
export function checkAmmoDetonation(ships: Ship[], turn: number): { ships: Ship[]; newLogs: BattleLogEntry[] } {
  const newLogs: BattleLogEntry[] = [];
  
  const updatedShips = ships.map(ship => {
    if (ship.isSunk) return ship;
    
    const updatedCompartments = ship.compartments.map(comp => ({ ...comp }));
    const shipLogs: BattleLogEntry[] = [];
    
    updatedCompartments.forEach(comp => {
      if (comp.detonated) return;
      
      // Проверяем погреб боезапаса
      const ammoMag = comp.components.find(c => c.type === 'ammo_magazine');
      if (!ammoMag) return;
      
      // Условие детонации: погреб уничтожен + пожар или критическое повреждение
      const hasFire = comp.fire > 0.5;
      const ammoDestroyed = ammoMag.status === 'destroyed';
      const criticalDamage = comp.currentHP < comp.maxHP * 0.2;
      
      // Шанс детонации
      let detonationChance = 0;
      if (ammoDestroyed && hasFire) detonationChance = 0.4; // 40%
      else if (ammoDestroyed && criticalDamage) detonationChance = 0.25; // 25%
      else if (hasFire && criticalDamage) detonationChance = 0.1; // 10%
      
      if (detonationChance > 0 && Math.random() < detonationChance) {
        // ДЕтонация!
        comp.detonated = true;
        comp.fire = 1.0;
        comp.currentHP = 0;
        comp.status = 'destroyed';
        
        // Мгновенное уничтожение всех компонентов в отсеке
        comp.components = comp.components.map(c => ({
          ...c,
          currentHP: 0,
          status: 'destroyed' as const
        }));
        
        // Урон соседним отсекам
        comp.adjacentIds.forEach(adjId => {
          const adjacentComp = updatedCompartments.find(c => c.id === adjId);
          if (adjacentComp) {
            const damage = Math.floor(adjacentComp.maxHP * 0.6);
            adjacentComp.currentHP = Math.max(0, adjacentComp.currentHP - damage);
            adjacentComp.fire = Math.min(1.0, adjacentComp.fire + 0.5);
            
            if (adjacentComp.currentHP <= 0) {
              adjacentComp.status = 'destroyed';
            }
          }
        });
        
        shipLogs.push(createLogEntry(
          turn,
          'ammo_detonation',
          ship.id,
          ship.name,
          `💥💥💥 ВЗРЫВ БОЕЗАПАСА в "${comp.name}"! Корабль получил катастрофические повреждения!`,
          'critical',
          comp.id,
          comp.name
        ));
      }
    });
    
    return {
      ...ship,
      compartments: updatedCompartments,
      battleLog: [...ship.battleLog, ...shipLogs]
    };
  });
  
  return { ships: updatedShips, newLogs };
}

// Проверка гибели корабля
export function checkShipSinking(ships: Ship[], turn: number): { ships: Ship[]; newLogs: BattleLogEntry[] } {
  const newLogs: BattleLogEntry[] = [];
  
  const updatedShips = ships.map(ship => {
    if (ship.isSunk) return ship;
    
    // Пересчитываем статы
    const stats = calculateShipStatsForShip(ship);
    
    // Условия гибели:
    // 1. Плавучесть ≤ 5%
    // 2. Общее затопление ≥ 60%
    
    let sinkCause: 'flooding' | 'detonation' | 'buoyancy' | undefined;
    let isSunk = false;
    
    if (stats.buoyancy <= 0.05) {
      isSunk = true;
      sinkCause = 'buoyancy';
    } else if (stats.flooding >= 0.60) {
      isSunk = true;
      sinkCause = 'flooding';
    }
    
    // Проверка на детонацию всех погребов
    const allAmmoDetonated = ship.compartments
      .filter(c => c.components.some(comp => comp.type === 'ammo_magazine'))
      .every(c => c.detonated);
    
    if (allAmmoDetonated && ship.compartments.some(c => c.detonated)) {
      isSunk = true;
      sinkCause = 'detonation';
    }
    
    if (isSunk && !ship.isSunk) {
      const causeMessage = sinkCause === 'buoyancy' 
        ? 'Корабль потерял плавучесть и затонул'
        : sinkCause === 'flooding'
        ? 'Корабль затонул из-за критического затопления'
        : 'Корабль уничтожен взрывами боезапаса';
      
      newLogs.push(createLogEntry(
        turn,
        'ship_sunk',
        ship.id,
        ship.name,
        `☠️ ${causeMessage}!`,
        'critical'
      ));
    }
    
    return {
      ...ship,
      stats,
      isSunk,
      sinkCause: isSunk ? sinkCause : undefined,
      battleLog: [...ship.battleLog, ...newLogs.filter(l => l.shipId === ship.id)]
    };
  });
  
  return { ships: updatedShips, newLogs };
}

// Пересчёт статов для корабля
function calculateShipStatsForShip(ship: Ship) {
  const stats = {
    speed: 1.0,
    maneuverability: 1.0,
    mainGunFire: 1.0,
    aaFire: 1.0,
    detection: 1.0,
    buoyancy: 1.0,
    list: 0.0,
    trim: 0.0,
    fires: 0,
    flooding: 0.0
  };

  let totalFlooded = 0;
  let totalCompartments = 0;
  let portFlooded = 0;
  let starboardFlooded = 0;
  let bowFlooded = 0;
  let sternFlooded = 0;

  ship.compartments.forEach(comp => {
    totalCompartments++;
    
    if (comp.flooded > 0) {
      totalFlooded += comp.flooded;
      if (comp.side === 'port') portFlooded += comp.flooded;
      if (comp.side === 'starboard') starboardFlooded += comp.flooded;
      if (comp.position === 'bow' || comp.position === 'forward') bowFlooded += comp.flooded;
      if (comp.position === 'stern' || comp.position === 'aft') sternFlooded += comp.flooded;
    }

    if (comp.fire > 0) {
      stats.fires++;
    }

    comp.components.forEach(component => {
      const effectiveness = component.currentHP / component.maxHP;
      
      switch (component.type) {
        case 'engine':
        case 'boiler':
        case 'propeller':
          stats.speed *= (0.5 + effectiveness * 0.5);
          break;
        case 'rudder':
        case 'bridge':
          stats.maneuverability *= (0.3 + effectiveness * 0.7);
          break;
        case 'forward_turret':
        case 'aft_turret':
        case 'fire_control':
          stats.mainGunFire *= (0.4 + effectiveness * 0.6);
          break;
        case 'aa_gun':
          stats.aaFire *= (0.4 + effectiveness * 0.6);
          break;
        case 'radar':
          stats.detection *= (0.5 + effectiveness * 0.5);
          break;
      }
    });
  });

  if (totalCompartments > 0) {
    stats.flooding = totalFlooded / totalCompartments;
    stats.buoyancy = Math.max(0, 1.0 - stats.flooding * 0.8);
    stats.list = (starboardFlooded - portFlooded) / totalCompartments;
    stats.trim = (sternFlooded - bowFlooded) / totalCompartments;
  }

  return stats;
}

// Главная функция обработки хода - вызывает все системы повреждений
export function processDamagePropagation(ships: Ship[], turn: number): { ships: Ship[]; allLogs: BattleLogEntry[] } {
  let currentShips = ships;
  const allLogs: BattleLogEntry[] = [];
  
  // 1. Распространение пожаров
  const fireResult = propagateFires(currentShips, turn);
  currentShips = fireResult.ships;
  allLogs.push(...fireResult.newLogs);
  
  // 2. Распространение затоплений
  const floodResult = propagateFlooding(currentShips, turn);
  currentShips = floodResult.ships;
  allLogs.push(...floodResult.newLogs);
  
  // 3. Проверка взрывов боезапаса
  const detonationResult = checkAmmoDetonation(currentShips, turn);
  currentShips = detonationResult.ships;
  allLogs.push(...detonationResult.newLogs);
  
  // 4. Проверка гибели кораблей
  const sinkingResult = checkShipSinking(currentShips, turn);
  currentShips = sinkingResult.ships;
  allLogs.push(...sinkingResult.newLogs);
  
  return { ships: currentShips, allLogs };
}
