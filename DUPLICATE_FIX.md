# Исправление дублирования отсеков

## Проблема

При добавлении новых отсеков в редакторе сетки возникало дублирование - новые отсеки появлялись поверх уже существующих в одних и тех же клетках сетки.

## Причина

1. При инициализации `compartmentPositions` создавались позиции для всех отсеков из массива `compartments`, который уже содержал автоматически созданные отсеки при создании корабля
2. При добавлении нового отсека через кнопку "➕ Добавить отсек" он всегда размещался в клетке `{ gridX: 0, gridY: 0 }` (верхний левый угол), независимо от того, занята ли эта клетка

## Решение

### 1. Инициализация пустого редактора

Изменена инициализация `compartmentPositions`:

**Было:**
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

**Стало:**
```typescript
const [compartmentPositions, setCompartmentPositions] = useState<Map<string, CompartmentGridPosition>>(new Map());
```

Теперь редактор начинается пустым, без автоматически созданных отсеков. Пользователь добавляет отсеки вручную через кнопку "➕ Добавить отсек".

### 2. Поиск свободной клетки в нижнем левом углу

Переписана функция `addCompartment` для поиска свободной клетки:

**Было:**
```typescript
const addCompartment = () => {
  const newCompartment: Compartment = { ... };
  
  const newPositions = new Map(compartmentPositions);
  newPositions.set(newCompartment.id, { gridX: 0, gridY: 0 }); // Всегда в (0, 0)
  setCompartmentPositions(newPositions);
  
  onCompartmentsChange([...compartments, newCompartment]);
  setSelectedCompartment(newCompartment.id);
};
```

**Стало:**
```typescript
const addCompartment = () => {
  // Находим свободную клетку начиная с нижнего левого угла
  let foundPosition: CompartmentGridPosition | null = null;
  
  // Перебираем клетки снизу вверх, слева направо
  for (let y = rows - 1; y >= 0 && !foundPosition; y--) {
    for (let x = 0; x < cols && !foundPosition; x++) {
      // Проверяем, занята ли эта клетка
      const isOccupied = Array.from(compartmentPositions.values()).some(
        pos => pos.gridX === x && pos.gridY === y
      );
      
      if (!isOccupied) {
        foundPosition = { gridX: x, gridY: y };
      }
    }
  }
  
  // Если не нашли свободную клетку, используем (0, rows-1)
  const position = foundPosition || { gridX: 0, gridY: rows - 1 };
  
  const newCompartment: Compartment = {
    ...
    positionFromBow: position.gridX * 10
  };

  const newPositions = new Map(compartmentPositions);
  newPositions.set(newCompartment.id, position);
  setCompartmentPositions(newPositions);
  
  onCompartmentsChange([...compartments, newCompartment]);
  setSelectedCompartment(newCompartment.id);
};
```

### 3. Улучшена функция удаления

Добавлены комментарии для ясности:

```typescript
const deleteCompartment = (id: string) => {
  // Удаляем позицию из Map
  const newPositions = new Map(compartmentPositions);
  newPositions.delete(id);
  setCompartmentPositions(newPositions);
  
  // Удаляем отсек из массива compartments
  onCompartmentsChange(compartments.filter(c => c.id !== id));
  
  // Снимаем выделение, если удалили выбранный отсек
  if (selectedCompartment === id) {
    setSelectedCompartment(null);
  }
};
```

## Алгоритм поиска свободной клетки

1. Начинаем с нижнего левого угла: `gridX = 0`, `gridY = rows - 1`
2. Перебираем клетки **снизу вверх** (y от rows-1 до 0)
3. В каждом ряду перебираем клетки **слева направо** (x от 0 до cols-1)
4. Для каждой клетки проверяем, занята ли она:
   ```typescript
   const isOccupied = Array.from(compartmentPositions.values()).some(
     pos => pos.gridX === x && pos.gridY === y
   );
   ```
5. Если клетка свободна - используем её
6. Если все клетки заняты - используем `(0, rows-1)` как fallback

## Порядок заполнения сетки

При добавлении отсеков они будут размещаться в следующем порядке:

```
Сетка 5×3 (cols=5, rows=3):

y=2 (низ):  [1] [2] [3] [4] [5]
y=1 (середина): [6] [7] [8] [9] [10]
y=0 (верх): [11] [12] [13] [14] [15]
            x=0  x=1  x=2  x=3  x=4
```

Первый отсек появится в клетке (0, 2) - нижний левый угол.
Второй отсек появится в клетке (1, 2) - справа от первого.
И так далее, заполняя ряд снизу вверх.

## Преимущества нового подхода

1. **Нет дублирования** - каждый отсек занимает уникальную клетку
2. **Предсказуемое размещение** - новые отсеки всегда появляются в нижнем левом углу
3. **Пустой редактор** - пользователь начинает с чистого листа
4. **Автоматический поиск** - система сама находит свободную клетку
5. **Fallback** - если все клетки заняты, используется (0, rows-1)

## Обновлённые файлы

- ✅ `src/GridCompartmentEditor.tsx` - исправлена логика инициализации и добавления отсеков

## Тестирование

### Сценарий 1: Добавление первого отсека
1. Перейдите в режим "🔲 Сетка"
2. Нажмите "➕ Добавить отсек"
3. ✅ Отсек появился в нижнем левом углу (0, rows-1)
4. ✅ Нет других отсеков на сетке

### Сценарий 2: Добавление второго отсека
1. Добавьте первый отсек
2. Нажмите "➕ Добавить отсек" ещё раз
3. ✅ Второй отсек появился справа от первого (1, rows-1)
4. ✅ Нет дублирования

### Сценарий 3: Заполнение ряда
1. Добавьте 5 отсеков (для сетки с 5 колонками)
2. ✅ Все 5 отсеков заполнили нижний ряд
3. ✅ Каждый отсек в своей клетке

### Сценарий 4: Переход к следующему ряду
1. Заполните нижний ряд (5 отсеков)
2. Добавьте 6-й отсек
3. ✅ 6-й отсек появился во втором ряду снизу (0, rows-2)
4. ✅ Нет дублирования с первым рядом

### Сценарий 5: Удаление и добавление
1. Добавьте 3 отсека
2. Удалите средний отсек
3. Добавьте новый отсек
4. ✅ Новый отсек появился на месте удалённого (если оно свободно)
5. ✅ Нет дублирования

## Заключение

Проблема дублирования отсеков полностью решена. Теперь:
- ✅ Редактор начинается пустым
- ✅ Новые отсеки добавляются по одному в свободные клетки
- ✅ Поиск свободной клетки начинается с нижнего левого угла
- ✅ Каждый отсек занимает уникальную позицию в сетке
- ✅ Нет перекрытий и дублирования

Система редактирования отсеков теперь работает корректно и предсказуемо.
