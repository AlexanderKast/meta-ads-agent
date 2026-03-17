CREATE TABLE usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  generations_used INT DEFAULT 0,
  plan TEXT DEFAULT 'free',
  UNIQUE(user_id, period_start)
);
