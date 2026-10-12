# Обновление системы редактирования отсеков

## Внесённые изменения

### 1. Фиксированная сетка 56×23

**Параметры сетки:**
- **Ширина:** 56 ячеек (фиксировано)
- **Высота:** 23 ячейки (фиксировано)
- **Размер ячейки:** 15×15 пикселей (фиксировано)
- **Размер поля:** 860×365 пикселей
- **Масштаб:** 1 ячейка = 5 метров

**Реализация:**
```typescript
const cols = 56; // 56 ячеек в длину
const rows = 23; // 23 ячейки в высоту
const gridSize = 15; // 15px на ячейку
const padding = 10;
const width = cols * gridSize + padding * 2; // 860px
const height = rows * gridSize + padding * 2; // 365px
```

### 2. Добавление отсека в нижний левый угол

**Логика:**
- Новый отсек добавляется в клетку `(0, rows-1)` - нижний левый угол
- Если клетка занята, ищется следующая свободная клетка слева направо, снизу вверх
- Позиция автоматически сохраняется в `compartmentPositions`

**Реализация:**
```typescript
const addCompartment = () => {
  const newCompartment: Compartment = {
    id: `comp_${Date.now()}_${Math.random()}`,
    // ... параметры отсека
    lengthMeters: 5, // 5 метров на отсек
  };

  // Находим свободную клетку в нижнем левом углу
  let targetPosition: CompartmentGridPosition = { gridX: 0, gridY: rows - 1 };
  
  // Проверяем, занята ли клетка (0, rows-1)
  const isOccupied = Array.from(compartmentPositions.values()).some(
    pos => pos.gridX === 0 && pos.gridY === rows - 1
  );
  
  if (isOccupied) {
    // Ищем следующую свободную клетку
    for (let y = rows - 1; y >= 0; y--) {
      for (let x = 0; x < cols; x++) {
        const cellOccupied = Array.from(compartmentPositions.values()).some(
          pos => pos.gridX === x && pos.gridY === y
        );
        if (!cellOccupied) {
          targetPosition = { gridX: x, gridY: y };
          break;
        }
      }
      if (targetPosition.gridX !== 0 || targetPosition.gridY !== rows - 1) {
        break;
      }
    }
  }

  // Добавляем отсек с позицией
  const newPositions = new Map(compartmentPositions);
  newPositions.set(newCompartment.id, targetPosition);
  setCompartmentPositions(newPositions);
  
  onCompartmentsChange([...compartments, newCompartment]);
  setSelectedCompartment(newCompartment.id);
};
```

### 3. Выделение нескольких отсеков мышкой

**Функциональность:**
- **Shift+клик** по отсеку - добавление/удаление из множественного выделения
- **Shift+перетаскивание** на пустом месте - выделение рамкой
- Визуальный прямоугольник выделения с синим пунктиром
- Счётчик выделенных отсеков в панели управления

**Реализация:**

Состояния для выделения:
```typescript
const [selectedCompartments, setSelectedCompartments] = useState<Set<string>>(new Set());
const [isSelecting, setIsSelecting] = useState(false);
const [selectionStart, setSelectionStart] = useState<GridPosition | null>(null);
const [selectionEnd, setSelectionEnd] = useState<GridPosition | null>(null);
```

Обработчик начала выделения:
```typescript
const handleBackgroundMouseDown = (e: React.MouseEvent) => {
  if (e.shiftKey) {
    e.preventDefault();
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const mouseX = e.clientX - svgRect.left - padding;
    const mouseY = e.clientY - svgRect.top - padding;

    setIsSelecting(true);
    setSelectionStart({ x: mouseX, y: mouseY });
    setSelectionEnd({ x: mouseX, y: mouseY });
    return;
  }
  // ... остальная логика
};
```

Обработчик движения мыши:
```typescript
const handleMouseMove = useCallback((e: MouseEvent) => {
  // ...
  if (isSelecting) {
    const relX = mouseX - padding;
    const relY = mouseY - padding;
    setSelectionEnd({ x: relX, y: relY });
  }
  // ...
}, [isSelecting, /* ... */]);
```

Обработчик завершения выделения:
```typescript
const handleMouseUp = useCallback(() => {
  if (isSelecting && selectionStart && selectionEnd) {
    const minX = Math.min(selectionStart.x, selectionEnd.x);
    const maxX = Math.max(selectionStart.x, selectionEnd.x);
    const minY = Math.min(selectionStart.y, selectionEnd.y);
    const maxY = Math.max(selectionStart.y, selectionEnd.y);

    // Находим отсеки в области выделения
    const selected = new Set<string>();
    compartmentPositions.forEach((pos, id) => {
      const compX = pos.gridX * gridSize;
      const compY = pos.gridY * gridSize;
      
      if (compX >= minX && compX <= maxX && compY >= minY && compY <= maxY) {
        selected.add(id);
      }
    });

    setSelectedCompartments(selected);
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  }
  // ...
}, [/* ... */]);
```

Обработчик клика по отсеку:
```typescript
onMouseDown={(e) => {
  e.stopPropagation();
  if (e.shiftKey) {
    // Добавляем/удаляем из множественного выделения
    const newSelected = new Set(selectedCompartments);
    if (newSelected.has(comp.id)) {
      newSelected.delete(comp.id);
    } else {
      newSelected.add(comp.id);
    }
    setSelectedCompartments(newSelected);
  } else {
    // Одиночное выделение и начало перетаскивания
    setSelectedCompartments(new Set([comp.id]));
    handleMouseDown(e, comp.id);
  }
}}
```

### 4. Визуализация выделения

**Прямоугольник выделения:**
```typescript
{isSelecting && selectionStart && selectionEnd && (
  <rect
    x={padding + Math.min(selectionStart.x, selectionEnd.x)}
    y={padding + Math.min(selectionStart.y, selectionEnd.y)}
    width={Math.abs(selectionEnd.x - selectionStart.x)}
    height={Math.abs(selectionEnd.y - selectionStart.y)}
    fill="rgba(59, 130, 246, 0.2)"
    stroke="#3b82f6"
    strokeWidth="1"
    strokeDasharray="4,4"
    pointerEvents="none"
  />
)}
```

**Выделенные отсеки:**
```typescript
const isSelected = selectedCompartment === comp.id || selectedCompartments.has(comp.id);
// ...
stroke={isSelected ? '#fbbf24' : isDragging ? '#06b6d4' : '#475569'}
strokeWidth={isSelected || isDragging ? 2 : 1}
```

### 5. Панель управления для множественного выделения

**Отображение информации:**
```typescript
{selectedCompartments.size > 0 && (
  <>
    <div className="px-3 py-1 bg-yellow-900/50 border border-yellow-600 rounded text-xs font-bold text-yellow-300">
      ✓ Выделено: {selectedCompartments.size}
    </div>
    <button
      onClick={() => {
        setSelectedCompartments(new Set());
        setSelectedCompartment(null);
      }}
      className="px-3 py-1 bg-slate-600 hover:bg-slate-700 rounded text-xs"
    >
      ✕ Снять выделение
    </button>
  </>
)}
<div className="text-xs text-slate-400">
  💡 Shift+клик для множественного выделения | Shift+перетаскивание для выделения рамкой
</div>
```

### 6. Панель свойств для множественного выделения

**Одиночное выделение:**
- Отображаются свойства одного отсека
- Можно изменить палубу, позицию, статус
- Кнопка удаления одного отсека

**Множественное выделение:**
- Отображается количество выделенных отсеков
- Кнопки для массового изменения статуса:
  - ✓ Целый
  - ⚠ Повреждён
  - 💧 Затоплен
  - ✕ Разрушен
- Кнопка удаления всех выделенных отсеков

**Реализация:**
```typescript
{selectedCompartments.size === 1 ? (
  // Одиночное выделение - показываем свойства
  // ...
) : (
  // Множественное выделение - показываем общие действия
  <div className="space-y-2">
    <div className="text-xs text-slate-400">
      Вы можете изменить статус для всех выбранных отсеков:
    </div>
    <div className="grid grid-cols-2 gap-2">
      <button onClick={() => {
        const updated = compartments.map(c => 
          selectedCompartments.has(c.id) ? { ...c, status: 'intact' as const } : c
        );
        onCompartmentsChange(updated);
      }}>
        ✓ Целый
      </button>
      // ... другие кнопки
    </div>
    <button onClick={() => {
      const remaining = compartments.filter(c => !selectedCompartments.has(c.id));
      onCompartmentsChange(remaining);
      setSelectedCompartments(new Set());
    }}>
      🗑️ Удалить все выбранные ({selectedCompartments.size})
    </button>
  </div>
)}
```

## Обновлённые файлы

- ✅ `src/GridCompartmentEditor.tsx` - полная переработка компонента

## Технические детали

### Параметры сетки

```typescript
const cols = 56;        // 56 ячеек в длину
const rows = 23;        // 23 ячейки в высоту
const gridSize = 15;    // 15px на ячейку
const padding = 10;     // отступы
const width = 860;      // ширина поля
const height = 365;     // высота поля
```

### Масштаб

- 1 ячейка сетки = 15 пикселей = 5 метров
- Общая длина поля: 56 × 5 = 280 метров
- Общая высота поля: 23 × 5 = 115 метров

### Состояния для выделения

```typescript
const [selectedCompartments, setSelectedCompartments] = useState<Set<string>>(new Set());
const [isSelecting, setIsSelecting] = useState(false);
const [selectionStart, setSelectionStart] = useState<GridPosition | null>(null);
const [selectionEnd, setSelectionEnd] = useState<GridPosition | null>(null);
```

## Использование

### Добавление отсека
1. Нажмите кнопку "➕ Добавить отсек"
2. ✅ Новый отсек появится в нижнем левом углу (0, rows-1)
3. Если клетка занята, отсек появится в следующей свободной клетке

### Одиночное выделение
1. Кликните по отсеку
2. ✅ Отсек выделен жёлтой рамкой
3. В панели свойств отображаются параметры отсека

### Множественное выделение (Shift+клик)
1. Зажмите клавишу Shift
2. Кликните по первому отсеку
3. Продолжайте кликать по другим отсекам (с Shift)
4. ✅ Все выбранные отсеки выделены жёлтой рамкой
5. В панели управления отображается счётчик выделенных отсеков

### Выделение рамкой (Shift+перетаскивание)
1. Зажмите клавишу Shift
2. Зажмите левую кнопку мыши на пустом месте
3. Перетащите мышь, создавая прямоугольник выделения
4. Отпустите кнопку мыши
5. ✅ Все отсеки внутри прямоугольника выделены

### Массовое изменение статуса
1. Выделите несколько отсеков
2. В панели свойств нажмите кнопку нужного статуса:
   - ✓ Целый
   - ⚠ Повреждён
   - 💧 Затоплен
   - ✕ Разрушен
3. ✅ Все выделенные отсеки изменят статус

### Массовое удаление
1. Выделите несколько отсеков
2. Нажмите кнопку "🗑️ Удалить все выбранные (N)"
3. ✅ Все выделенные отсеки удалены

### Снятие выделения
1. Нажмите кнопку "✕ Снять выделение"
2. ✅ Все выделения сняты

## Преимущества новых функций

1. **Точное размещение** - фиксированная сетка 56×23 обеспечивает точное позиционирование
2. **Масштабирование** - размер ячейки 15px позволяет вместить большое количество отсеков
3. **Эффективность** - множественное выделение ускоряет редактирование
4. **Гибкость** - два способа выделения (Shift+клик и Shift+перетаскивание)
5. **Массовые операции** - изменение статуса и удаление нескольких отсеков одновременно
6. **Визуальная обратная связь** - прямоугольник выделения и жёлтая рамка для выделенных отсеков

## Тестирование

### Сценарий 1: Добавление отсека
1. Нажмите "➕ Добавить отсек"
2. ✅ Отсек появился в нижнем левом углу (0, 22)
3. Добавьте ещё один отсек
4. ✅ Второй отсек появился в клетке (1, 22)

### Сценарий 2: Множественное выделение
1. Добавьте 5 отсеков
2. Зажмите Shift
3. Кликните по первому отсеку
4. Кликните по третьему отсеку (с Shift)
5. ✅ Выделены 2 отсека
6. В панели управления: "✓ Выделено: 2"

### Сценарий 3: Выделение рамкой
1. Добавьте 10 отсеков в разных местах
2. Зажмите Shift
3. Зажмите левую кнопку мыши на пустом месте
4. Перетащите мышь, создавая прямоугольник вокруг 3 отсеков
5. Отпустите кнопку мыши
6. ✅ Выделены 3 отсека внутри прямоугольника

### Сценарий 4: Массовое изменение статуса
1. Выделите 5 отсеков
2. Нажмите кнопку "⚠ Повреждён"
3. ✅ Все 5 отсеков изменили статус на "damaged"
4. Все отсеки стали оранжевыми

### Сценарий 5: Массовое удаление
1. Выделите 3 отсека
2. Нажмите "🗑️ Удалить все выбранные (3)"
3. ✅ Все 3 отсека удалены
4. Счётчик отсеков уменьшился на 3

## Заключение

Все задачи успешно выполнены:
- ✅ Фиксированная сетка 56×23 ячейки
- ✅ Размер ячейки 15px (5 метров)
- ✅ Увеличенное поле 860×365 пикселей
- ✅ Новый отсек добавляется в нижний левый угол
- ✅ Выделение нескольких отсеков через Shift+клик
- ✅ Выделение рамкой через Shift+перетаскивание
- ✅ Массовое изменение статуса выделенных отсеков
- ✅ Массовое удаление выделенных отсеков
- ✅ Визуальная обратная связь (прямоугольник выделения, жёлтая рамка)

Система редактирования отсеков теперь поддерживает эффективную работу с большим количеством отсеков и массовые операции.
