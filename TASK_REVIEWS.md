# Review System + Bonus Credits Implementation Plan

## Цели
- Страница отзывов с формой
- Начисление 3 бесплатных кредитов за отзыв (один раз на пользователя)
- Всплывающее окно при 1 кредите (показывать только раз)
- Контроль по UID и email
- Обработка через Supabase Edge Function + N8N

---

## Database Schema

### 1. Таблица `reviews`
```sql
CREATE TABLE reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  bonus_credits_awarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_email ON reviews(email);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- Один отзыв от одного user_id + email
CREATE UNIQUE INDEX idx_reviews_user_email ON reviews(user_id, email);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Пользователь может создать свой отзыв
CREATE POLICY "Users can insert their own reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Все могут читать отзывы
CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT
TO public
USING (true);
```

### 2. Обновить таблицу `user_credits`
```sql
-- Добавить поле для отслеживания показа модального окна
ALTER TABLE user_credits 
ADD COLUMN review_modal_shown BOOLEAN DEFAULT FALSE;
```

---

## Implementation Checklist

### Backend (Supabase)
- [x] Создать таблицу `reviews` с RLS policies ✅
- [x] Обновить `user_credits` добавить `review_modal_shown` ✅
- [x] Создать Edge Function `submit-review` для обработки отзыва ✅
- [x] Создать RPC функцию `award_review_bonus` для начисления кредитов ✅
- [ ] Настроить N8N webhook для получения отзывов (manual setup needed)

### Frontend - Review Page
- [x] Создать `/review` страницу (`src/pages/Review.tsx`) ✅
- [x] Создать компонент формы отзыва (`src/components/review/ReviewForm.tsx`) ✅
- [x] Добавить звездочки для рейтинга ✅
- [x] Валидация формы (min length, rating required) ✅
- [x] Success message после отправки ✅
- [ ] Показывать существующие отзывы (опционально - not implemented)

### Frontend - Modal
- [x] Создать `ReviewBonusModal.tsx` компонент ✅
- [x] Логика показа при `free_credits === 1` ✅
- [x] Проверка `review_modal_shown` из БД ✅
- [x] Обновление флага после показа ✅
- [x] Кнопки: "Leave Review" и "Maybe Later" ✅

### Services
- [x] `src/lib/reviews.ts` - функции для работы с отзывами ✅
  - `submitReview(rating, text)` ✅
  - `hasUserReviewed()` ✅
  - `markModalAsShown()` ✅
  - `shouldShowReviewModal()` ✅

### Navigation
- [x] Добавить ссылку на Review в навигацию ✅
- [x] Обновить роутинг в `App.tsx` ✅

### Tests
- [ ] Тесты для `submitReview` функции
- [ ] Тесты для ReviewForm компонента
- [ ] Тесты для ReviewBonusModal логики

---

## N8N Workflow Structure

### Webhook Input
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "rating": 5,
  "review_text": "Great service!",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### N8N Steps
1. Receive webhook
2. Validate data
3. Save to external analytics/CRM (optional)
4. Send notification to admin
5. Return success response

---

## Edge Function: submit-review

### Input
```json
{
  "rating": 5,
  "review_text": "Amazing boat search!"
}
```

### Logic
1. Verify user is authenticated
2. Check if user already submitted review (user_id + email)
3. Insert review into `reviews` table
4. Call `award_review_bonus()` RPC
5. Send to N8N webhook
6. Return success with credits info

### Output
```json
{
  "success": true,
  "bonus_awarded": true,
  "new_credit_balance": 5,
  "message": "Thank you! 3 bonus credits added."
}
```

---

## RPC Function: award_review_bonus

```sql
CREATE OR REPLACE FUNCTION award_review_bonus(review_user_id UUID)
RETURNS JSON AS $$
DECLARE
  already_awarded BOOLEAN;
  current_free INT;
  result JSON;
BEGIN
  -- Check if bonus already awarded for this user
  SELECT bonus_credits_awarded INTO already_awarded
  FROM reviews
  WHERE user_id = review_user_id
  LIMIT 1;

  IF already_awarded THEN
    RETURN json_build_object('awarded', false, 'reason', 'already_received');
  END IF;

  -- Award 3 free credits
  UPDATE user_credits
  SET free_credits = free_credits + 3,
      updated_at = NOW()
  WHERE user_id = review_user_id
  RETURNING free_credits INTO current_free;

  -- Mark bonus as awarded
  UPDATE reviews
  SET bonus_credits_awarded = TRUE
  WHERE user_id = review_user_id;

  RETURN json_build_object(
    'awarded', true,
    'bonus_amount', 3,
    'new_balance', current_free
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## UI/UX Flow

### Review Page Flow
1. User navigates to `/review`
2. If already reviewed: show "Thank you" message
3. If not reviewed: show review form
4. User selects rating (1-5 stars)
5. User writes review (min 20 chars)
6. Submit → loading state
7. Success → show bonus message + new credit count

### Modal Flow (1 credit left)
1. Check on Dashboard mount
2. If `free_credits === 1` AND `review_modal_shown === false`
3. Show modal after 2 second delay
4. User clicks "Leave Review" → navigate to `/review`
5. User clicks "Maybe Later" → mark as shown, don't show again
6. Update `review_modal_shown = true` in DB

---

## Priority Order
1. Database schema + RPC function
2. Edge Function for review submission
3. Review page + form
4. Modal component
5. Integration + testing
6. N8N webhook setup

---

## Notes
- **One bonus per user**: Контроль через `UNIQUE INDEX` на `(user_id, email)`
- **Modal shown once**: Флаг `review_modal_shown` в `user_credits`
- **Security**: RLS policies + Edge Function auth check
- **Analytics**: N8N сохраняет отзывы в external system
