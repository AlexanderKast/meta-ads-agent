CREATE TABLE generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  objective TEXT NOT NULL,
  tone TEXT NOT NULL,
  product TEXT NOT NULL,
  audience TEXT NOT NULL,
  extras TEXT,
  variations_count INT NOT NULL,
  result JSONB NOT NULL,
  tokens_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_generations_user ON generations(user_id, created_at DESC);
