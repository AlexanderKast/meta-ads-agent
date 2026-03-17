CREATE TABLE IF NOT EXISTS creatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  variation_index INT,
  platform TEXT,
  headline TEXT,
  primary_text TEXT,
  description TEXT,
  cta TEXT,
  hook TEXT,
  image_prompt TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'draft',
  campaign_mapping_id UUID REFERENCES campaign_mappings(id) ON DELETE SET NULL,
  performance JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creatives_status ON creatives(status, created_at DESC);
