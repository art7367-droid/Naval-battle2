# Исправление проблемы с перетаскиванием отсеков

## Проблема

В режиме "🔲 Сетка" не работало перетаскивание отсеков мышкой. При попытке перетащить отсек он оставался на месте.

## Причина

Проблема была вызвана несколькими факторами:

1. **Пересоздание draggableCompartments на каждом рендере**
   - Массив `draggableCompartments` пересчитывался из `compartments` на каждом рендере
   - При перетаскивании обновлялся `positionFromBow`, но `gridX` и `gridY` пересчитывались заново
   - Это создавало конфликт между текущей позицией перетаскивания и пересчитанной позицией

2. **Обработчики событий на SVG элементе**
   - `onMouseMove` и `onMouseUp` были привязаны к SVG элементу
   - При быстром перемещении курсор мог выйти за пределы SVG
   - Это приводило к потере событий и прерыванию перетаскивания

3. **Устаревшие замыкания**
   - Функции `handleMouseMove` и `handleMouseUp` захватывали устаревшие значения из замыканий
   - Это приводило к некорректному обновлению состояния

## Решение

### 1. Добавлено состояние dragPosition

```typescript
const [dragPosition, setDragPosition] = useState<GridPosition>({ x: 0, y: 0 });
```

Это состояние хранит текущую позицию перетаскиваемого отсека в координатах сетки.

### 2. Обновлена логика draggableCompartments

```typescript
const draggableCompartments: DraggableCompartment[] = compartments.map((comp, idx) => {
  const deckIndex = comp.deck === 'upper' ? 0 : comp.deck === 'middle' ? 1 : 2;
  const positionIndex = comp.positionFromBow ? Math.floor(comp.positionFromBow / 10) : idx % 20;
  
  // Если этот отсек перетаскивается, используем текущую позицию перетаскивания
  const isDragging = draggingCompartment === comp.id;
  
  return {
    ...comp,
    gridX: isDragging ? dragPosition.x : positionIndex,
    gridY: isDragging ? dragPosition.y : deckIndex * 3,
    width: 2,
    height: 2
  };
});
```

Теперь при перетаскивании используется `dragPosition`, а не пересчитанная позиция.

### 3. Обработчики привязаны к window

```typescript
useEffect(() => {
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
  
  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
}, [handleMouseMove, handleMouseUp]);
```

Обработчики теперь привязаны к `window`, что гарантирует получение событий даже при выходе курсора за пределы SVG.

### 4. Использован useCallback для мемоизации

```typescript
const handleMouseMove = useCallback((e: MouseEvent) => {
  // ... логика
}, [draggingCompartment, dragOffset, gridSize, cols, rows]);

const handleMouseUp = useCallback(() => {
  // ... логика
}, [draggingCompartment, dragPosition, compartments, onCompartmentsChange]);
```

Функции мемоизированы с помощью `useCallback`, что предотвращает их пересоздание на каждом рендере и решает проблему устаревших замыканий.

### 5. Удалены обработчики с SVG элемента

```typescript
<svg
  ref={svgRef}
  width={width}
  height={height}
  className="border border-slate-600 rounded bg-slate-900/50 cursor-default"
  onClick={handleSvgClick}
>
```

Обработчики `onMouseMove`, `onMouseUp` и `onMouseLeave` удалены из SVG элемента, так как теперь они привязаны к `window`.

### 6. Добавлена инициализация dragPosition в handleMouseDown

```typescript
const handleMouseDown = (e: React.MouseEvent, compId: string) => {
  // ...
  setDraggingCompartment(compId);
  setDragOffset({
    x: mouseX - compX,
    y: mouseY - compY
  });
  setDragPosition({
    x: comp.gridX,
    y: comp.gridY
  });
  setSelectedCompartment(compId);
};
```

Теперь `dragPosition` инициализируется текущей позицией отсека при начале перетаскивания.

## Обновлённые файлы

- ✅ `src/GridCompartmentEditor.tsx` - исправлена логика перетаскивания

## Результат

Теперь перетаскивание отсеков работает корректно:
- ✅ Отсеки можно перетаскивать мышкой
- ✅ Привязка к сетке работает правильно
- ✅ Позиция сохраняется при отпускании кнопки мыши
- ✅ Перетаскивание работает даже при выходе курсора за пределы SVG
- ✅ Визуальная обратная связь (синяя рамка при перетаскивании)

## Тестирование

### Сценарий 1: Базовое перетаскивание
1. Перейдите в режим "🔲 Сетка"
2. Загрузите изображение корабля
3. Нажмите "➕ Добавить отсек"
4. Зажмите левую кнопку мыши на отсеке
5. Перетащите в другое место
6. Отпустите кнопку мыши
7. Отсек должен остаться в новом месте

### Сценарий 2: Перетаскивание за пределы SVG
1. Начните перетаскивание отсека
2. Выведите курсор за пределы SVG холста
3. Продолжайте перемещение
4. Верните курсор на холст
5. Отпустите кнопку мыши
6. Отсек должен остаться в последней позиции

### Сценарий 3: Привязка к сетке
1. Перетащите отсек
2. Обратите внимание, что отсек привязывается к клеткам сетки
3. Позиция всегда кратна 10 пикселям
4. Отсек не выходит за пределы холста

## Технические детали

### Поток данных при перетаскивании

```
1. handleMouseDown
   ├── setDraggingCompartment(compId)
   ├── setDragOffset({ x, y })
   └── setDragPosition({ x: gridX, y: gridY })

2. handleMouseMove (window event)
   ├── Вычисление новой позиции
   ├── Ограничение в пределах сетки
   └── setDragPosition({ x: clampedX, y: clampedY })

3. handleMouseUp (window event)
   ├── Обновление compartments с новой позицией
   ├── onCompartmentsChange(updatedCompartments)
   └── setDraggingCompartment(null)

4. Рендер
   ├── draggableCompartments пересчитывается
   ├── Используется dragPosition для перетаскиваемого отсека
   └── SVG обновляется с новой позицией
```

### Зависимости useCallback

**handleMouseMove:**
- `draggingCompartment` - ID перетаскиваемого отсека
- `dragOffset` - смещение курсора относительно отсека
- `gridSize` - размер клетки сетки
- `cols` - количество колонок
- `rows` - количество строк

**handleMouseUp:**
- `draggingCompartment` - ID перетаскиваемого отсека
- `dragPosition` - текущая позиция перетаскивания
- `compartments` - массив отсеков
- `onCompartmentsChange` - функция обновления

### Ограничения

- Минимальная позиция: (0, 0)
- Максимальная позиция: (cols - 2, rows - 2)
- Размер отсека: 2×2 клетки
- Привязка к сетке: 10 пикселей

## Будущие улучшения

1. **Плавная анимация**
   - Анимация перемещения отсека
   - Плавная привязка к сетке

2. **Визуальная обратная связь**
   - Подсветка клетки при наведении
   - Предпросмотр позиции перед отпусканием

3. **Отмена перетаскивания**
   - Нажатие Escape для отмены
   - Возврат в исходную позицию

4. **Множественное выделение**
   - Выделение нескольких отсеков
   - Групповое перетаскивание

5. **Сохранение позиции**
   - Сохранение в localStorage
   - Восстановление при загрузке
