CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  objective TEXT NOT NULL,
  tone TEXT NOT NULL,
  product_template TEXT NOT NULL,
  audience_template TEXT,
  extras TEXT,
  is_public BOOLEAN DEFAULT false,
  use_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_templates_user ON templates(user_id);
