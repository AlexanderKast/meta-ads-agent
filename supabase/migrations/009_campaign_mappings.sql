CREATE TABLE campaign_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connected_account_id UUID REFERENCES connected_accounts(id) ON DELETE CASCADE NOT NULL,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  platform_campaign_id TEXT NOT NULL,
  platform_adset_id TEXT,
  platform_ad_id TEXT,
  campaign_name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  objective TEXT,
  budget_amount NUMERIC,
  budget_currency TEXT DEFAULT 'USD',
  last_synced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaign_mappings_user ON campaign_mappings(user_id, platform);
CREATE INDEX idx_campaign_mappings_account ON campaign_mappings(connected_account_id);
