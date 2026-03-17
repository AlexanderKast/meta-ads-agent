CREATE TABLE campaign_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_mapping_id UUID REFERENCES campaign_mappings(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,4) DEFAULT 0,
  conversions INT DEFAULT 0,
  revenue NUMERIC(12,4) DEFAULT 0,
  ctr NUMERIC(8,6),
  cpc NUMERIC(10,4),
  cpm NUMERIC(10,4),
  roas NUMERIC(10,4),
  platform_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_mapping_id, date)
);

CREATE INDEX idx_campaign_metrics_mapping ON campaign_metrics(campaign_mapping_id, date DESC);
