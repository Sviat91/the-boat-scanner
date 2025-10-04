-- ⚠️ СРОЧНОЕ ИСПРАВЛЕНИЕ: Запустите этот скрипт в Supabase Dashboard → SQL Editor
-- Этот скрипт создаст все необходимое для системы отзывов

-- ====================
-- 1. Создать таблицу reviews
-- ====================
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL CHECK (length(review_text) >= 20),
  bonus_credits_awarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_email ON reviews(email);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Уникальный индекс: один отзыв на пользователя
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_email ON reviews(user_id, email);

-- Включить RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
CREATE POLICY "Users can insert their own reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews"
ON reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Комментарии
COMMENT ON TABLE reviews IS 'User reviews with bonus credit tracking';
COMMENT ON COLUMN reviews.bonus_credits_awarded IS 'Whether 3 bonus credits were awarded for this review';

-- ====================
-- 2. Добавить поле review_modal_shown в user_credits
-- ====================
ALTER TABLE user_credits
ADD COLUMN IF NOT EXISTS review_modal_shown BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN user_credits.review_modal_shown IS 'Track if review bonus modal was shown to user';

-- ====================
-- 3. Создать RPC функцию award_review_bonus
-- ====================
CREATE OR REPLACE FUNCTION award_review_bonus(review_user_id UUID, review_email TEXT)
RETURNS JSON AS $$
DECLARE
  already_awarded BOOLEAN;
  current_free INT;
  current_paid INT;
  result JSON;
BEGIN
  -- Проверить, уже ли начислен бонус этому пользователю
  SELECT bonus_credits_awarded INTO already_awarded
  FROM reviews
  WHERE user_id = review_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF already_awarded IS TRUE THEN
    RETURN json_build_object(
      'success', false,
      'awarded', false,
      'reason', 'bonus_already_received',
      'message', 'You have already received bonus credits for your review'
    );
  END IF;

  -- Начислить 3 бесплатных кредита
  -- Note: user_credits table uses 'id' column, not 'user_id'
  UPDATE user_credits
  SET free_credits = free_credits + 3,
      updated_at = NOW()
  WHERE id = review_user_id
  RETURNING free_credits, paid_credits INTO current_free, current_paid;

  -- Если записи user_credits нет, создать её
  IF NOT FOUND THEN
    INSERT INTO user_credits (id, free_credits, paid_credits)
    VALUES (review_user_id, 3, 0)
    RETURNING free_credits, paid_credits INTO current_free, current_paid;
  END IF;

  -- Отметить бонус как начисленный в отзыве
  UPDATE reviews
  SET bonus_credits_awarded = TRUE,
      updated_at = NOW()
  WHERE user_id = review_user_id;

  RETURN json_build_object(
    'success', true,
    'awarded', true,
    'bonus_amount', 3,
    'new_free_credits', current_free,
    'total_credits', current_free + current_paid,
    'message', 'Thank you for your review! 3 bonus credits have been added to your account.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Выдать права на выполнение функции
GRANT EXECUTE ON FUNCTION award_review_bonus(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION award_review_bonus IS 'Awards 3 free credits for leaving a review (one time per user)';

-- ====================
-- ✅ ПРОВЕРКА: Всё ли создано?
-- ====================
DO $$
BEGIN
  -- Проверка таблицы reviews
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'reviews'
  ) THEN
    RAISE NOTICE '✅ Таблица reviews создана';
  ELSE
    RAISE WARNING '❌ Таблица reviews НЕ создана!';
  END IF;

  -- Проверка поля review_modal_shown
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_credits' 
      AND column_name = 'review_modal_shown'
  ) THEN
    RAISE NOTICE '✅ Поле review_modal_shown добавлено';
  ELSE
    RAISE WARNING '❌ Поле review_modal_shown НЕ добавлено!';
  END IF;

  -- Проверка RPC функции
  IF EXISTS (
    SELECT FROM pg_proc WHERE proname = 'award_review_bonus'
  ) THEN
    RAISE NOTICE '✅ RPC функция award_review_bonus создана';
  ELSE
    RAISE WARNING '❌ RPC функция award_review_bonus НЕ создана!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🎉 Проверка завершена! Если видите только ✅ - всё готово!';
  RAISE NOTICE '📝 Теперь добавьте Secrets в Edge Function submit-review:';
  RAISE NOTICE '   VITE_N8N_WEBHOOK_URL_REVIEWS';
  RAISE NOTICE '   VITE_N8N_SECRET_TOKEN_REVIEWS';
END $$;
