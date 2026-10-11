import { Ship, ShipType, SHIP_FLEET, Shot, BOARD_SIZE, Heading, HexCell } from './types';

export { BOARD_SIZE };

export const HEX_DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 0, r: 1 },
  { q: -1, r: 1 },
  { q: -1, r: 0 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
];

function offsetToCube(q: number, r: number): { x: number; y: number; z: number } {
  const x = q - (r - (r & 1)) / 2;
  const z = r;
  const y = -x - z;
  return { x, y, z };
}

export function hexDistance(q1: number, r1: number, q2: number, r2: number): number {
  const cube1 = offsetToCube(q1, r1);
  const cube2 = offsetToCube(q2, r2);
  return (Math.abs(cube1.x - cube2.x) + Math.abs(cube1.y - cube2.y) + Math.abs(cube1.z - cube2.z)) / 2;
}

export function getHeading(fromQ: number, fromR: number, toQ: number, toR: number): Heading {
  const dq = toQ - fromQ;
  const dr = toR - fromR;
  const angle = Math.atan2(dr, dq) * 180 / Math.PI;
  let normalizedAngle = angle < 0 ? angle + 360 : angle;
  const sector = Math.floor(normalizedAngle / 60) % 6;
  return sector as Heading;
}

export function generatePlayerShips(): Ship[] {
  const ships: Ship[] = [];
  let shipId = 1;
  const queue = SHIP_FLEET.flatMap(fleet =>
    Array(fleet.count).fill(null).map(() => ({
      type: fleet.type,
      name: fleet.name,
      hp: fleet.hp,
      accuracy: fleet.accuracy,
      damage: fleet.damage,
      speed: fleet.speed,
      range: fleet.range,
    }))
  );

  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }

  for (const shipDef of queue) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 500) {
      attempts++;
      const q = Math.floor(Math.random() * 8);
      const r = Math.floor(Math.random() * BOARD_SIZE);
      const occupied = ships.some(s => s.q === q && s.r === r);
      if (!occupied) {
        ships.push({
          id: shipId++,
          type: shipDef.type,
          name: shipDef.name,
          maxHP: shipDef.hp,
          currentHP: shipDef.hp,
          q, r,
          heading: 0,
          accuracy: shipDef.accuracy,
          damage: shipDef.damage,
          speed: shipDef.speed,
          range: shipDef.range,
          hasMoved: false,
          hasFired: false,
        });
        placed = true;
      }
    }
  }
  return ships;
}

export function generateEnemyShips(): Ship[] {
  const ships: Ship[] = [];
  let shipId = 100;
  const queue = SHIP_FLEET.flatMap(fleet =>
    Array(fleet.count).fill(null).map(() => ({
      type: fleet.type,
      name: fleet.name,
      hp: fleet.hp,
      accuracy: fleet.accuracy,
      damage: fleet.damage,
      speed: fleet.speed,
      range: fleet.range,
    }))
  );

  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }

  for (const shipDef of queue) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 500) {
      attempts++;
      const q = BOARD_SIZE - 1 - Math.floor(Math.random() * 8);
      const r = Math.floor(Math.random() * BOARD_SIZE);
      const occupied = ships.some(s => s.q === q && s.r === r);
      if (!occupied) {
        ships.push({
          id: shipId++,
          type: shipDef.type,
          name: shipDef.name,
          maxHP: shipDef.hp,
          currentHP: shipDef.hp,
          q, r,
          heading: 3,
          accuracy: shipDef.accuracy,
          damage: shipDef.damage,
          speed: shipDef.speed,
          range: shipDef.range,
          hasMoved: false,
          hasFired: false,
        });
        placed = true;
      }
    }
  }
  return ships;
}

export function getReachableHexes(ship: Ship, allShips: Ship[]): { q: number; r: number }[] {
  const reachable: { q: number; r: number }[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let q = 0; q < BOARD_SIZE; q++) {
      const distance = hexDistance(ship.q, ship.r, q, r);
      if (distance <= ship.speed && distance > 0) {
        const occupied = allShips.some(s => s.q === q && s.r === r && s.currentHP > 0 && s.id !== ship.id);
        if (!occupied) reachable.push({ q, r });
      }
    }
  }
  return reachable;
}

export function executeShots(
  shots: { shipId: number; targetQ: number; targetR: number }[],
  attackerShips: Ship[],
  defenderShips: Ship[]
): { shots: Shot[]; updatedShips: Ship[] } {
  let newShips = defenderShips.map(s => ({ ...s }));
  const executedShots: Shot[] = [];

  for (const shot of shots) {
    const attacker = attackerShips.find(s => s.id === shot.shipId);
    if (!attacker || attacker.currentHP <= 0) continue;

    const distance = hexDistance(attacker.q, attacker.r, shot.targetQ, shot.targetR);
    if (distance > attacker.range) continue;

    const targetShip = newShips.find(s => s.q === shot.targetQ && s.r === shot.targetR && s.currentHP > 0);
    const hitRoll = Math.random() * 100;
    const hit = hitRoll < attacker.accuracy;

    if (hit && targetShip) {
      newShips = newShips.map(ship => {
        if (ship.id === targetShip.id) {
          return { ...ship, currentHP: Math.max(0, ship.currentHP - attacker.damage) };
        }
        return ship;
      });

      executedShots.push({
        shipId: attacker.id,
        shipName: attacker.name,
        shipType: attacker.type,
        targetQ: shot.targetQ,
        targetR: shot.targetR,
        hit: true,
        damage: attacker.damage,
        targetShipId: targetShip.id,
        targetShipName: targetShip.name,
      });
    } else {
      executedShots.push({
        shipId: attacker.id,
        shipName: attacker.name,
        shipType: attacker.type,
        targetQ: shot.targetQ,
        targetR: shot.targetR,
        hit: false,
        damage: 0,
        targetShipId: null,
        targetShipName: null,
      });
    }
  }

  return { shots: executedShots, updatedShips: newShips };
}

export function allShipsSunk(ships: Ship[]): boolean {
  return ships.every(ship => ship.currentHP <= 0);
}
