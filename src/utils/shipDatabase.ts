import { ShipDatabase, ShipDatabaseEntry, ShipClass } from '../types/shipDatabase';

const DB_KEY = 'naval_battle_ship_database';
const DB_VERSION = '1.0.0';

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function loadDatabase(): ShipDatabase {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (data) return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка загрузки базы данных:', error);
  }
  return { ships: [], version: DB_VERSION, lastUpdated: Date.now() };
}

export function saveDatabase(db: ShipDatabase): void {
  try {
    db.lastUpdated = Date.now();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (error) {
    console.error('Ошибка сохранения базы данных:', error);
  }
}

export function createShipEntry(name: string, shipClass: ShipClass, country: string, year: number): ShipDatabaseEntry {
  return {
    id: generateId(),
    name,
    class: shipClass,
    country,
    year,
    maxHP: 100,
    speed: 30,
    range: 10,
    armor: 100,
    weapons: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export function addShipToDatabase(ship: ShipDatabaseEntry): ShipDatabase {
  const db = loadDatabase();
  db.ships.push(ship);
  saveDatabase(db);
  return db;
}

export function updateShipInDatabase(ship: ShipDatabaseEntry): ShipDatabase {
  const db = loadDatabase();
  const index = db.ships.findIndex(s => s.id === ship.id);
  if (index !== -1) {
    ship.updatedAt = Date.now();
    db.ships[index] = ship;
    saveDatabase(db);
  }
  return db;
}

export function deleteShipFromDatabase(shipId: string): ShipDatabase {
  const db = loadDatabase();
  db.ships = db.ships.filter(s => s.id !== shipId);
  saveDatabase(db);
  return db;
}

export function createDemoDatabase(): ShipDatabase {
  const demoShips: ShipDatabaseEntry[] = [
    {
      id: generateId(),
      name: 'Ямато',
      class: 'battleship',
      country: 'Япония',
      year: 1941,
      maxHP: 150,
      speed: 27,
      range: 12,
      armor: 410,
      weapons: [],
      description: 'Крупнейший линкор в истории',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: generateId(),
      name: 'Бисмарк',
      class: 'battleship',
      country: 'Германия',
      year: 1940,
      maxHP: 140,
      speed: 30,
      range: 11,
      armor: 320,
      weapons: [],
      description: 'Немецкий линкор времен WWII',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: generateId(),
      name: 'Энтерпрайз',
      class: 'aircraft_carrier',
      country: 'США',
      year: 1938,
      maxHP: 120,
      speed: 33,
      range: 10,
      armor: 100,
      weapons: [],
      description: 'Легендарный американский авианосец',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  const db: ShipDatabase = { ships: demoShips, version: DB_VERSION, lastUpdated: Date.now() };
  saveDatabase(db);
  return db;
}
