CREATE TABLE brand_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  description TEXT,
  tone_keywords TEXT[] DEFAULT '{}',
  target_audience TEXT,
  do_say TEXT[] DEFAULT '{}',
  dont_say TEXT[] DEFAULT '{}',
  colors JSONB DEFAULT '{}',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_brand_user ON brand_profiles(user_id);
