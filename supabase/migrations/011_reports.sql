CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
