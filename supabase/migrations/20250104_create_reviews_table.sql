-- Create reviews table for user feedback
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_email ON reviews(email);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Ensure one review per user (user_id + email combination)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_email ON reviews(user_id, email);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can insert their own reviews
CREATE POLICY "Users can insert their own reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Everyone can view reviews
CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT
TO public
USING (true);

-- Users can update their own reviews (optional, for editing)
CREATE POLICY "Users can update their own reviews"
ON reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add review_modal_shown flag to user_credits table
ALTER TABLE user_credits 
ADD COLUMN IF NOT EXISTS review_modal_shown BOOLEAN DEFAULT FALSE;

-- Comment
COMMENT ON TABLE reviews IS 'User reviews with bonus credit tracking';
COMMENT ON COLUMN reviews.bonus_credits_awarded IS 'Whether 3 bonus credits were awarded for this review';
COMMENT ON COLUMN user_credits.review_modal_shown IS 'Track if review bonus modal was shown to user';
