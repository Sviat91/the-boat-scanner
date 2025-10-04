# ✅ Что уже сделано:

1. ✅ **Ссылка "Leave a Review" добавлена в футер** всех страниц
2. ✅ **Edge Function `submit-review` задеплоена** в Supabase
3. ✅ **Функция обновлена** для работы с N8N через переменные `VITE_N8N_WEBHOOK_URL_REVIEWS` и `VITE_N8N_SECRET_TOKEN_REVIEWS`
4. ✅ **Код запушен** в branch `stages`

---

# 🔧 Что нужно сделать вручную:

## 1. Настроить Secrets в Supabase для Edge Function

Зайдите в Supabase Dashboard и добавьте секреты:

**Путь:** Supabase Dashboard → Functions → submit-review → Settings → Secrets

Добавьте две переменные:

```
VITE_N8N_WEBHOOK_URL_REVIEWS = ваш_URL_N8N_webhook
VITE_N8N_SECRET_TOKEN_REVIEWS = ваш_секретный_токен
```

### Где взять эти значения?

Из вашего файла `.env`:
- `VITE_N8N_WEBHOOK_URL_REVIEWS` - скопируйте значение из `.env`
- `VITE_N8N_SECRET_TOKEN_REVIEWS` - скопируйте значение из `.env`

---

## 2. Запустить SQL миграции

Зайдите в: **Supabase Dashboard → SQL Editor**

### Миграция 1: Создать таблицу reviews

Откройте файл `supabase/migrations/20250104_create_reviews_table.sql` и выполните весь SQL код в SQL Editor.

Это создаст:
- Таблицу `reviews`
- RLS policies
- Индексы
- Поле `review_modal_shown` в таблице `user_credits`

### Миграция 2: Создать RPC функцию

Откройте файл `supabase/migrations/20250104_award_review_bonus_function.sql` и выполните весь SQL код в SQL Editor.

Это создаст функцию `award_review_bonus` для начисления 3 бесплатных кредитов.

---

## 3. Настроить N8N Webhook (если хотите получать уведомления)

1. В N8N создайте новый workflow
2. Добавьте **Webhook** node:
   - **HTTP Method**: POST
   - **Path**: `/webhook/reviews`
   - **Authentication**: Header Auth
   - **Header Name**: `Authorization`
   - **Expected Value**: `Bearer ваш_токен_из_VITE_N8N_SECRET_TOKEN_REVIEWS`
3. Добавьте nodes для обработки данных (например, отправка в Google Sheets, email уведомление и т.д.)
4. Активируйте workflow
5. Скопируйте URL webhook и используйте его как значение `VITE_N8N_WEBHOOK_URL_REVIEWS`

**Формат данных от Edge Function:**
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "rating": 5,
  "review_text": "Great service!",
  "bonus_awarded": true,
  "new_credits": 3,
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

## 4. Протестировать систему

### Тест 1: Проверить таблицу
```sql
SELECT * FROM reviews LIMIT 1;
SELECT review_modal_shown FROM user_credits LIMIT 1;
```

### Тест 2: Проверить RPC функцию
```sql
SELECT award_review_bonus('your-user-id', 'your-email@example.com');
```

### Тест 3: Оставить тестовый отзыв
1. Запустите приложение `npm run dev`
2. Залогиньтесь
3. Перейдите на страницу `/review` (или кликните "Leave a Review" в футере)
4. Заполните форму:
   - Выберите рейтинг (1-5 звезд)
   - Напишите отзыв (минимум 20 символов)
5. Нажмите "Submit Review"
6. Проверьте:
   - ✅ Отзыв сохранился в БД
   - ✅ Начислено +3 кредита
   - ✅ (Опционально) Webhook пришел в N8N

### Тест 4: Проверить модальное окно
1. Убедитесь что у пользователя ровно 1 свободный кредит
2. Перейдите на Dashboard
3. Через 2 секунды должно появиться модальное окно с предложением оставить отзыв
4. Нажмите "Leave Review" → откроется страница `/review`

---

## 5. Интегрировать модал в Dashboard (опционально, но рекомендуется)

Откройте `src/pages/Dashboard.tsx` и добавьте:

```tsx
// В импортах
import { ReviewBonusModal } from '@/components/review/ReviewBonusModal';

// В компоненте Dashboard, добавить state для credits
const [credits, setCredits] = useState({ free_credits: 0, paid_credits: 0 });

// Добавить useEffect для загрузки credits
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

// В JSX перед остальными компонентами:
<ReviewBonusModal freeCredits={credits.free_credits} />
```

---

## ✅ Checklist развертывания

- [ ] Добавлены secrets в Supabase (`VITE_N8N_WEBHOOK_URL_REVIEWS`, `VITE_N8N_SECRET_TOKEN_REVIEWS`)
- [ ] Выполнена миграция 1 (reviews table)
- [ ] Выполнена миграция 2 (award_review_bonus function)
- [ ] Настроен N8N webhook (опционально)
- [ ] Протестирована отправка отзыва
- [ ] Проверено начисление кредитов
- [ ] (Опционально) Интегрирован ReviewBonusModal в Dashboard

---

## 🐛 Troubleshooting

### Edge Function возвращает ошибку
- Проверьте логи: Supabase Dashboard → Functions → submit-review → Logs
- Убедитесь что secrets настроены правильно

### Бонус не начисляется
- Проверьте что RPC функция создана: `SELECT * FROM pg_proc WHERE proname = 'award_review_bonus';`
- Проверьте что пользователь не получал бонус ранее

### N8N не получает webhook
- Проверьте URL webhook в secrets
- Проверьте токен в N8N
- Посмотрите логи Edge Function для ошибок

---

## 📊 Мониторинг отзывов

```sql
-- Все отзывы
SELECT * FROM reviews ORDER BY created_at DESC;

-- Средний рейтинг
SELECT AVG(rating) as average_rating FROM reviews;

-- Количество бонусов начислено
SELECT COUNT(*) as bonuses_awarded FROM reviews WHERE bonus_credits_awarded = TRUE;
```
