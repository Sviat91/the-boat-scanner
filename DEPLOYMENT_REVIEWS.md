# Review System - Deployment Instructions

## ✅ Что уже готово (в коде)

### Backend Files
- ✅ `supabase/migrations/20250104_create_reviews_table.sql`
- ✅ `supabase/migrations/20250104_award_review_bonus_function.sql`
- ✅ `supabase/functions/submit-review/index.ts`

### Frontend Files
- ✅ `src/pages/Review.tsx` - страница отзывов
- ✅ `src/components/review/ReviewForm.tsx` - форма с рейтингом
- ✅ `src/components/review/ReviewBonusModal.tsx` - модальное окно
- ✅ `src/lib/reviews.ts` - API функции
- ✅ `src/App.tsx` - добавлен роутинг `/review`

---

## 📋 Шаги для развертывания

### 1. Запустить SQL миграции в Supabase

Зайдите в Supabase Dashboard → SQL Editor и выполните по порядку:

#### Миграция 1: Создание таблицы reviews
```bash
# Открыть файл
supabase/migrations/20250104_create_reviews_table.sql

# Или выполнить напрямую в Supabase SQL Editor
```

Эта миграция создаст:
- Таблицу `reviews` с полями (id, user_id, email, rating, review_text, bonus_credits_awarded, created_at)
- RLS policies (пользователи могут создавать свои отзывы, все могут читать)
- Индексы для быстрого поиска
- Поле `review_modal_shown` в таблице `user_credits`

#### Миграция 2: RPC функция для начисления бонуса
```bash
# Открыть файл
supabase/migrations/20250104_award_review_bonus_function.sql

# Или выполнить напрямую в Supabase SQL Editor
```

Эта миграция создаст функцию `award_review_bonus(user_id, email)` которая:
- Проверяет, не получал ли пользователь бонус ранее
- Начисляет 3 бесплатных кредита
- Помечает review как "bonus_credits_awarded = true"

---

### 2. Развернуть Edge Function

#### Вариант А: Через Supabase CLI (рекомендуется)

```bash
# Из корня проекта
cd dream-boat-snaps-discover

# Залогиниться (если еще не залогинены)
supabase login

# Связать проект
supabase link --project-ref YOUR_PROJECT_REF

# Развернуть функцию
supabase functions deploy submit-review
```

#### Вариант Б: Через Supabase Dashboard

1. Зайдите в Supabase Dashboard → Edge Functions
2. Нажмите "Create Function"
3. Имя: `submit-review`
4. Скопируйте содержимое файла `supabase/functions/submit-review/index.ts`
5. Вставьте и сохраните

---

### 3. Настроить переменные окружения

В Supabase Dashboard → Edge Functions → submit-review → Settings → Secrets добавьте:

```
N8N_REVIEW_WEBHOOK_URL=https://your-n8n-instance.com/webhook/reviews
```

Это опционально. Если не настроено, отзывы будут просто сохраняться в БД без отправки в N8N.

---

### 4. Настроить N8N Webhook (опционально)

Если хотите получать уведомления об отзывах:

1. В N8N создайте новый workflow
2. Добавьте Webhook trigger node
3. Метод: POST
4. Скопируйте URL webhook
5. Добавьте его как `N8N_REVIEW_WEBHOOK_URL` (см. шаг 3)

Формат данных, которые приходят в N8N:
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "rating": 5,
  "review_text": "Great service!",
  "bonus_awarded": true,
  "timestamp": "2024-01-15T10:00:00Z"
}
```

Дальше можете настроить:
- Отправку в Google Sheets
- Email уведомления админу
- Сохранение в CRM
- И т.д.

---

### 5. Интегрировать ReviewBonusModal в Dashboard (TODO)

Нужно добавить в `src/pages/Dashboard.tsx`:

```tsx
// В импортах
import { ReviewBonusModal } from '@/components/review/ReviewBonusModal';

// В компоненте Dashboard добавить useState для credits:
const [credits, setCredits] = useState({ free_credits: 0, paid_credits: 0 });

// В useEffect загрузить credits:
useEffect(() => {
  const fetchCredits = async () => {
    const { data } = await supabase.rpc('get_credits');
    if (data) {
      const row = Array.isArray(data) ? data[0] : data;
      setCredits(row ?? { free_credits: 0, paid_credits: 0 });
    }
  };
  fetchCredits();
}, []);

// В JSX перед другими компонентами:
<ReviewBonusModal freeCredits={credits.free_credits} />
```

---

## 🧪 Тестирование

### Проверка базы данных
```sql
-- Проверить что таблица создана
SELECT * FROM reviews LIMIT 1;

-- Проверить что поле добавлено
SELECT review_modal_shown FROM user_credits LIMIT 1;

-- Проверить что функция работает
SELECT award_review_bonus('your-user-id', 'your-email@example.com');
```

### Проверка Edge Function
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/submit-review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "rating": 5,
    "review_text": "This is a test review with more than 20 characters"
  }'
```

### Проверка Frontend
1. Запустите `npm run dev`
2. Залогиньтесь
3. Перейдите на `/review`
4. Оставьте отзыв
5. Проверьте что получили +3 кредита

---

## 🐛 Troubleshooting

### Edge Function не работает
- Проверьте что функция развернута: `supabase functions list`
- Проверьте логи: Supabase Dashboard → Edge Functions → submit-review → Logs

### Бонус не начисляется
- Проверьте что RPC функция создана: `SELECT * FROM pg_proc WHERE proname = 'award_review_bonus';`
- Проверьте логи Edge Function
- Проверьте что пользователь не получал бонус ранее

### Modal не появляется
- Убедитесь что `free_credits === 1`
- Проверьте `review_modal_shown` в таблице `user_credits`
- Проверьте что пользователь еще не оставлял отзыв

---

## 📊 Мониторинг

После развертывания можете отслеживать:

```sql
-- Количество отзывов
SELECT COUNT(*) FROM reviews;

-- Средний рейтинг
SELECT AVG(rating) FROM reviews;

-- Сколько бонусов начислено
SELECT COUNT(*) FROM reviews WHERE bonus_credits_awarded = TRUE;

-- Последние отзывы
SELECT email, rating, review_text, created_at 
FROM reviews 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## ✅ Checklist развертывания

- [ ] Выполнить миграцию 1 (reviews table)
- [ ] Выполнить миграцию 2 (RPC function)
- [ ] Развернуть Edge Function submit-review
- [ ] Настроить N8N webhook (опционально)
- [ ] Добавить N8N_REVIEW_WEBHOOK_URL в secrets (опционально)
- [ ] Интегрировать ReviewBonusModal в Dashboard
- [ ] Протестировать отправку отзыва
- [ ] Проверить начисление кредитов
- [ ] Проверить работу модального окна

---

## 🚀 Готово!

После завершения всех шагов система отзывов будет полностью функциональна:
- ✅ Пользователи смогут оставлять отзывы
- ✅ Получать 3 бонусных кредита (один раз)
- ✅ Видеть модальное окно при 1 кредите
- ✅ Отзывы сохраняются в БД
- ✅ (Опционально) Уведомления в N8N
