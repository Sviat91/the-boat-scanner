-- RPC function to award 3 bonus credits for leaving a review
CREATE OR REPLACE FUNCTION award_review_bonus(review_user_id UUID, review_email TEXT)
RETURNS JSON AS $$
DECLARE
  already_awarded BOOLEAN;
  current_free INT;
  current_paid INT;
  result JSON;
BEGIN
  -- Check if bonus already awarded for this user
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

  -- Award 3 free credits
  UPDATE user_credits
  SET free_credits = free_credits + 3,
      updated_at = NOW()
  WHERE user_id = review_user_id
  RETURNING free_credits, paid_credits INTO current_free, current_paid;

  -- If user_credits row doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, free_credits, paid_credits)
    VALUES (review_user_id, 3, 0)
    RETURNING free_credits, paid_credits INTO current_free, current_paid;
  END IF;

  -- Mark bonus as awarded in the review
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION award_review_bonus(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION award_review_bonus IS 'Awards 3 free credits for leaving a review (one time per user)';
