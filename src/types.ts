export type ShipType = 'battleship' | 'cruiser' | 'destroyer';

export interface HexCell {
  q: number;
  r: number;
  isShip: boolean;
  isHit: boolean;
  isMiss: boolean;
  shipId: number | null;
  shipType: ShipType | null;
  currentHP: number | null;
}

export interface Ship {
  id: number;
  type: ShipType;
  name: string;
  maxHP: number;
  currentHP: number;
  q: number;
  r: number;
  heading: Heading;
  accuracy: number;
  damage: number;
  speed: number;
  range: number;
  hasMoved: boolean;
  hasFired: boolean;
}

export type Heading = 0 | 1 | 2 | 3 | 4 | 5;

export interface Shot {
  shipId: number;
  shipName: string;
  shipType: ShipType;
  targetQ: number;
  targetR: number;
  hit: boolean;
  damage: number;
  targetShipId: number | null;
  targetShipName: string | null;
}

export interface Trajectory {
  shipId: number;
  path: { q: number; r: number }[];
}

export type GamePhase = 'placement' | 'movement' | 'planning' | 'execution' | 'results' | 'gameOver';

export const SHIP_FLEET = [
  { type: 'battleship' as ShipType, count: 1, name: 'Линкор', hp: 100, accuracy: 75, damage: 35, speed: 2, range: 10 },
  { type: 'cruiser' as ShipType, count: 1, name: 'Крейсер', hp: 50, accuracy: 70, damage: 25, speed: 3, range: 7 },
  { type: 'destroyer' as ShipType, count: 2, name: 'Эсминец', hp: 25, accuracy: 65, damage: 20, speed: 4, range: 4 },
];

export const TOTAL_SHIPS = SHIP_FLEET.reduce((sum, s) => sum + s.count, 0);
export const BOARD_SIZE = 25;
