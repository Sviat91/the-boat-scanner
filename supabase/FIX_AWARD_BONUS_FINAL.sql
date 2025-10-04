-- 🔥 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ: RPC функция award_review_bonus
-- ПРОБЛЕМА: В таблице user_credits столбец называется 'id', а не 'user_id'!
-- Запустите этот скрипт в Supabase Dashboard → SQL Editor

-- Удалить старую версию функции
DROP FUNCTION IF EXISTS award_review_bonus(UUID, TEXT);

-- Создать правильную версию
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
  -- ✅ ИСПРАВЛЕНО: используем 'id' вместо 'user_id'
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

-- ✅ Проверка
DO $$
BEGIN
  RAISE NOTICE '✅ RPC функция award_review_bonus успешно обновлена!';
  RAISE NOTICE '🎯 Теперь попробуйте удалить старый отзыв и создать новый:';
  RAISE NOTICE '';
  RAISE NOTICE 'DELETE FROM reviews WHERE email = ''ваш-email@gmail.com'';';
  RAISE NOTICE '';
  RAISE NOTICE 'Затем оставьте новый отзыв на сайте!';
END $$;
