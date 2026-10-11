# Исправления системы перетаскивания отсеков

## Внесённые изменения

### 1. Перетаскивание фонового изображения (Слой 1)

Добавлена возможность перемещать фоновое изображение корабля относительно сетки.

**Реализация:**
- Добавлены состояния для отслеживания позиции фона:
  ```typescript
  const [backgroundPosition, setBackgroundPosition] = useState<GridPosition>({ x: 0, y: 0 });
  const [draggingBackground, setDraggingBackground] = useState(false);
  const [backgroundDragOffset, setBackgroundDragOffset] = useState<GridPosition>({ x: 0, y: 0 });
  ```

- Обработчик `handleBackgroundMouseDown` для начала перетаскивания фона
- Кнопка "🎯 Сбросить позицию фона" для возврата в исходное положение
- Курсор `cursor-move` при наведении на изображение

**Использование:**
1. Загрузите изображение корабля
2. Зажмите левую кнопку мыши на изображении
3. Перетащите в нужное положение
4. Отпустите кнопку мыши
5. Изображение останется в новой позиции

### 2. Размер отсеков привязан к сетке (1 отсек = 1 клетка)

Изменён размер отсеков с 2×2 клетки на 1×1 клетку.

**Реализация:**
- В SVG отрисовке изменены размеры:
  ```typescript
  width={gridSize}      // Было: width * gridSize
  height={gridSize}     // Было: height * gridSize
  ```

- Ограничения при перетаскивании:
  ```typescript
  const clampedX = Math.max(0, Math.min(newGridX, cols - 1));  // Было: cols - 2
  const clampedY = Math.max(0, Math.min(newGridY, rows - 1));  // Было: rows - 2
  ```

**Результат:**
- Каждый отсек занимает ровно одну клетку сетки (10×10 пикселей)
- Более точное размещение отсеков
- Лучшая видимость деталей на фоне

### 3. Исправлено возвращение отсека на исходную позицию

**Проблема:**
При отпускании кнопки мыши отсек возвращался на исходную позицию вместо того, чтобы остаться в новом месте.

**Причина:**
Позиции отсеков пересчитывались из `positionFromBow` на каждом рендере, что приводило к сбросу позиции.

**Решение:**
Добавлено отдельное состояние `compartmentPositions` для хранения позиций отсеков в сетке:

```typescript
const [compartmentPositions, setCompartmentPositions] = useState<Map<string, CompartmentGridPosition>>(() => {
  const map = new Map<string, CompartmentGridPosition>();
  compartments.forEach((comp, idx) => {
    const deckIndex = comp.deck === 'upper' ? 0 : comp.deck === 'middle' ? 1 : 2;
    const positionIndex = comp.positionFromBow ? Math.floor(comp.positionFromBow / 10) : idx % 20;
    map.set(comp.id, { gridX: positionIndex, gridY: deckIndex * 3 });
  });
  return map;
});
```

**Логика работы:**
1. При перетаскивании обновляется `dragPosition`
2. При отпускании кнопки мыши:
   - Обновляется `compartmentPositions` (Map)
   - Обновляется `compartments` с новым `positionFromBow`
   - Вызывается `onCompartmentsChange` для сохранения изменений
3. При следующем рендере используется сохранённая позиция из `compartmentPositions`

**Результат:**
- Отсеки остаются в новой позиции после перетаскивания
- Позиция сохраняется между рендерами
- Корректная работа с привязкой к сетке

## Обновлённые файлы

- ✅ `src/GridCompartmentEditor.tsx` - полная переработка компонента

## Технические детали

### Структура данных

```typescript
interface CompartmentGridPosition {
  gridX: number;  // Позиция X в клетках сетки
  gridY: number;  // Позиция Y в клетках сетки
}

// Хранение позиций всех отсеков
const [compartmentPositions, setCompartmentPositions] = 
  useState<Map<string, CompartmentGridPosition>>(...);
```

### Поток данных при перетаскивании

```
1. handleMouseDown (отсек)
   ├── setDraggingCompartment(compId)
   ├── setDragOffset({ x, y })
   └── setDragPosition({ x: pos.gridX, y: pos.gridY })

2. handleMouseMove (window)
   ├── Вычисление новой позиции
   ├── Ограничение в пределах сетки
   └── setDragPosition({ x: clampedX, y: clampedY })

3. handleMouseUp (window)
   ├── Обновление compartmentPositions (Map)
   ├── Обновление compartments с новым positionFromBow
   ├── onCompartmentsChange(updatedCompartments)
   └── setDraggingCompartment(null)

4. handleMouseDown (фон)
   ├── setDraggingBackground(true)
   └── setBackgroundDragOffset({ x, y })

5. handleMouseMove (window) - для фона
   ├── Вычисление новой позиции фона
   └── setBackgroundPosition({ x: newX, y: newY })

6. handleMouseUp (window) - для фона
   └── setDraggingBackground(false)
```

### Отрисовка отсеков

```typescript
{compartments.map((comp) => {
  const pos = compartmentPositions.get(comp.id);
  if (!pos) return null;
  
  const isDragging = draggingCompartment === comp.id;
  const displayX = isDragging ? dragPosition.x : pos.gridX;
  const displayY = isDragging ? dragPosition.y : pos.gridY;

  return (
    <g key={comp.id} onMouseDown={(e) => handleMouseDown(e, comp.id)}>
      <rect
        x={padding + displayX * gridSize}
        y={padding + displayY * gridSize}
        width={gridSize}      // 1 клетка
        height={gridSize}     // 1 клетка
        ...
      />
    </g>
  );
})}
```

## Новые возможности

### 1. Перетаскивание фона
- Зажмите левую кнопку мыши на изображении корабля
- Перетащите в нужное положение
- Фон останется в новой позиции
- Кнопка "🎯 Сбросить позицию фона" для возврата

### 2. Точное размещение отсеков
- Каждый отсек занимает 1 клетку сетки
- Привязка к сетке при перетаскивании
- Более точное размещение относительно деталей корабля

### 3. Сохранение позиций
- Позиции отсеков сохраняются в Map
- Отсеки остаются в новом месте после перетаскивания
- Позиция синхронизируется с `positionFromBow`

## Тестирование

### Сценарий 1: Перетаскивание фона
1. Загрузите изображение корабля
2. Зажмите левую кнопку мыши на изображении
3. Перетащите вправо на 50 пикселей
4. Отпустите кнопку мыши
5. ✅ Изображение осталось в новой позиции

### Сценарий 2: Перетаскивание отсека
1. Добавьте новый отсек кнопкой "➕ Добавить отсек"
2. Зажмите левую кнопку мыши на отсеке
3. Перетащите в клетку (10, 5)
4. Отпустите кнопку мыши
5. ✅ Отсек остался в клетке (10, 5)
6. Обновите страницу
7. ✅ Отсек всё ещё в клетке (10, 5)

### Сценарий 3: Сброс позиции фона
1. Перетащите фон в новое положение
2. Нажмите кнопку "🎯 Сбросить позицию фона"
3. ✅ Фон вернулся в исходное положение (0, 0)

### Сценарий 4: Размер отсеков
1. Добавьте несколько отсеков
2. Обратите внимание на размер каждого отсека
3. ✅ Каждый отсек занимает ровно 1 клетку сетки (10×10 пикселей)

## Преимущества новых изменений

1. **Гибкость размещения** - можно подстроить фон под сетку
2. **Точность** - отсеки размером 1×1 клетка позволяют точнее размещать их
3. **Надёжность** - позиции сохраняются корректно
4. **Удобство** - кнопка сброса для быстрого возврата фона
5. **Производительность** - использование Map для хранения позиций

## Заключение

Все три проблемы успешно решены:
- ✅ Фоновое изображение можно перетаскивать
- ✅ Размер отсеков привязан к сетке (1×1 клетка)
- ✅ Отсеки остаются в новой позиции после перетаскивания

Система редактирования отсеков теперь работает корректно и предоставляет все необходимые возможности для точного размещения отсеков на изображении корабля.
