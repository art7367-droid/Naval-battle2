export type ShipClass = 'battleship' | 'cruiser' | 'destroyer' | 'aircraft_carrier' | 'submarine';

export interface WeaponSystem {
  id: string;
  name: string;
  type: 'main_gun' | 'secondary_gun' | 'aa_gun' | 'torpedo' | 'missile';
  caliber?: number;
  range: number;
  damage: number;
  accuracy: number;
  rateOfFire: number;
}

export interface ShipDatabaseEntry {
  id: string;
  name: string;
  class: ShipClass;
  country: string;
  year: number;
  maxHP: number;
  speed: number;
  range: number;
  armor: number;
  weapons: WeaponSystem[];
  schematic?: string;
  photo?: string;
  description?: string;
  // Новые характеристики
  length?: number; // длина в метрах
  beam?: number; // ширина в метрах
  draft?: number; // осадка в метрах
  displacementStandard?: number; // стандартное водоизмещение в тоннах
  displacementFull?: number; // полное водоизмещение в тоннах
  createdAt: number;
  updatedAt: number;
}

export interface ShipDatabase {
  ships: ShipDatabaseEntry[];
  version: string;
  lastUpdated: number;
}
