# Ручное тестирование защиты от XSS

## Как протестировать XSS защиту в HistoryCard

1. **Запустите dev сервер**: `npm run dev`
2. **Откройте DevTools** в браузере
3. **В консоли браузера выполните следующие тесты**:

### Тест 1: Базовая проверка функции sanitizeHtml

```javascript
// Импортируйте функцию (если недоступна напрямую):
// В консоли выполните:
const html = '<script>alert("XSS")</script><p>Normal text</p>';
console.log('Original:', html);

// Симуляция работы sanitizeHtml (проверьте что script удален):
// Должно остаться только: '<p>Normal text</p>'
```

### Тест 2: Проверка в компоненте HistoryCard

1. Создайте тестовый объект данных:
```javascript
const maliciousData = {
  url: 'http://example.com',
  user_short_description: 'Test boat',
  user_images_html: '<script>alert("XSS Attack!")</script><img src="boat.jpg" alt="boat" />',
  thumbnail: 'thumbnail.jpg',
  title: 'Test Boat',
  description: 'Test description'
};
```

2. Найдите элемент HistoryCard на странице и проверьте что:
   - Скрипт не выполняется
   - В HTML нет тега `<script>`
   - Безопасные теги (`<img>`) остались

### Тест 3: Проверка защиты от event handlers

```javascript
const eventHandlerXSS = '<img src="x" onerror="alert(\'XSS via event!\')" />';
// Должен остаться: '<img src="x" />' (без onerror)
```

## Признаки успешной защиты:

✅ Нет всплывающих alert окон
✅ В инспекторе элементов нет тегов `<script>`  
✅ В инспекторе элементов нет event handlers (onerror, onclick, etc.)
✅ Безопасные теги (img, div, p) остались

## Признаки проблем:

❌ Появляются alert окна - XSS уязвимость!
❌ В HTML есть теги `<script>` - санитизация не работает!
❌ Есть event handlers в HTML - опасность!