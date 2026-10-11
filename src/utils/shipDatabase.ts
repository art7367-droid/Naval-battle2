import { ShipDatabase, ShipDatabaseEntry, ShipClass } from '../types/shipDatabase';

const DB_KEY = 'naval_battle_ship_database';
const DB_VERSION = '1.0.0';

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Создание демо-базы с примерами кораблей
function createDefaultDatabase(): ShipDatabase {
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
      length: 263,
      beam: 38.9,
      draft: 10.4,
      displacementStandard: 64000,
      displacementFull: 72800,
      description: 'Крупнейший линкор в истории. Водоизмещение 72 800 т.',
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
      length: 251,
      beam: 36,
      draft: 9.9,
      displacementStandard: 41700,
      displacementFull: 50900,
      description: 'Немецкий линкор времен WWII. Потоплен в 1941 году.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: generateId(),
      name: 'Айова',
      class: 'battleship',
      country: 'США',
      year: 1943,
      maxHP: 145,
      speed: 33,
      range: 12,
      armor: 310,
      weapons: [],
      length: 270.4,
      beam: 32.9,
      draft: 11.3,
      displacementStandard: 45000,
      displacementFull: 58000,
      description: 'Американский быстроходный линкор.',
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
      length: 251.4,
      beam: 33.4,
      draft: 8.5,
      displacementStandard: 19800,
      displacementFull: 25500,
      description: 'Легендарный американский авианосец. Самый результативный корабль WWII.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: generateId(),
      name: 'Акаги',
      class: 'aircraft_carrier',
      country: 'Япония',
      year: 1927,
      maxHP: 110,
      speed: 31,
      range: 10,
      armor: 90,
      weapons: [],
      length: 260.7,
      beam: 31.3,
      draft: 8.1,
      displacementStandard: 36500,
      displacementFull: 41300,
      description: 'Японский авианосец. Потоплен в битве у Мидуэя.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: generateId(),
      name: 'Балтимор',
      class: 'cruiser',
      country: 'США',
      year: 1943,
      maxHP: 90,
      speed: 33,
      range: 9,
      armor: 150,
      weapons: [],
      length: 205.9,
      beam: 21.6,
      draft: 7.3,
      displacementStandard: 14000,
      displacementFull: 17000,
      description: 'Тяжелый крейсер ВМС США.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: generateId(),
      name: 'Такао',
      class: 'cruiser',
      country: 'Япония',
      year: 1932,
      maxHP: 85,
      speed: 35,
      range: 9,
      armor: 130,
      weapons: [],
      length: 203.8,
      beam: 20.7,
      draft: 6.3,
      displacementStandard: 13200,
      displacementFull: 15500,
      description: 'Японский тяжелый крейсер.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: generateId(),
      name: 'Флетчер',
      class: 'destroyer',
      country: 'США',
      year: 1942,
      maxHP: 60,
      speed: 37,
      range: 7,
      armor: 30,
      weapons: [],
      length: 114.8,
      beam: 12,
      draft: 5.3,
      displacementStandard: 2100,
      displacementFull: 2900,
      description: 'Самый массовый эсминец WWII. Построено 175 единиц.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: generateId(),
      name: 'Симкадзэ',
      class: 'destroyer',
      country: 'Япония',
      year: 1940,
      maxHP: 55,
      speed: 36,
      range: 7,
      armor: 25,
      weapons: [],
      length: 118.5,
      beam: 10.8,
      draft: 3.8,
      displacementStandard: 2033,
      displacementFull: 2500,
      description: 'Японский эсминец типа Кагэро. Вооружен торпедами Type 93.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: generateId(),
      name: 'Гневный',
      class: 'destroyer',
      country: 'СССР',
      year: 1938,
      maxHP: 50,
      speed: 35,
      range: 6,
      armor: 20,
      weapons: [],
      length: 112.5,
      beam: 10.2,
      draft: 3.8,
      displacementStandard: 1700,
      displacementFull: 2000,
      description: 'Советский эсминец проекта 7.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  return {
    ships: demoShips,
    version: DB_VERSION,
    lastUpdated: Date.now()
  };
}

export function loadDatabase(): ShipDatabase {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (data) {
      const db = JSON.parse(data);
      // Если база пустая, создаем демо-базу
      if (!db.ships || db.ships.length === 0) {
        const defaultDb = createDefaultDatabase();
        saveDatabase(defaultDb);
        return defaultDb;
      }
      
      // Проверяем, есть ли новые поля (миграция)
      const needsMigration = db.ships.some((ship: ShipDatabaseEntry) => 
        ship.length === undefined || 
        ship.beam === undefined || 
        ship.draft === undefined ||
        ship.displacementStandard === undefined ||
        ship.displacementFull === undefined
      );
      
      if (needsMigration) {
        console.log('Обнаружены старые данные. Пересоздание базы данных с новыми характеристиками...');
        const defaultDb = createDefaultDatabase();
        saveDatabase(defaultDb);
        return defaultDb;
      }
      
      return db;
    }
  } catch (error) {
    console.error('Ошибка загрузки базы данных:', error);
  }
  
  // Если данных нет вообще, создаем демо-базу
  const defaultDb = createDefaultDatabase();
  saveDatabase(defaultDb);
  return defaultDb;
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
    length: 200,
    beam: 20,
    draft: 8,
    displacementStandard: 30000,
    displacementFull: 40000,
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
  const db = createDefaultDatabase();
  saveDatabase(db);
  return db;
}

export function clearDatabase(): void {
  localStorage.removeItem(DB_KEY);
}
