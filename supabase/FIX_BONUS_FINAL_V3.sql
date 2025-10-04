-- 🎯 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ V3: PRIMARY KEY = uid!
-- Запустите этот скрипт в Supabase Dashboard → SQL Editor

DROP FUNCTION IF EXISTS award_review_bonus(UUID, TEXT);

CREATE OR REPLACE FUNCTION award_review_bonus(review_user_id UUID, review_email TEXT)
RETURNS JSON AS $$
DECLARE
  already_awarded BOOLEAN;
  current_free INT;
  current_paid INT;
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
  -- ✅ PRIMARY KEY = uid (не id, не user_id!)
  UPDATE user_credits
  SET free_credits = free_credits + 3,
      updated_at = NOW()
  WHERE uid = review_user_id
  RETURNING free_credits, paid_credits INTO current_free, current_paid;

  -- Если записи user_credits нет, создать её
  IF NOT FOUND THEN
    INSERT INTO user_credits (uid, free_credits, paid_credits)
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

GRANT EXECUTE ON FUNCTION award_review_bonus(UUID, TEXT) TO authenticated;

-- ✅ Проверка
DO $$
BEGIN
  RAISE NOTICE '✅ RPC функция обновлена! PRIMARY KEY = uid';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Теперь:';
  RAISE NOTICE '1. DELETE FROM reviews WHERE email = ''s.upirov91@gmail.com'';';
  RAISE NOTICE '2. Оставьте новый отзыв на сайте';
  RAISE NOTICE '3. Получите +3 кредита! 🎉';
END $$;
