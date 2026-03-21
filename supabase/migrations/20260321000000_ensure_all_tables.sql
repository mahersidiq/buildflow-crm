-- ============================================================================
-- Ensure ALL required tables exist (safe to run multiple times)
-- Run this in Supabase SQL Editor to fix missing tables
-- ============================================================================

-- Create tables only if they don't exist yet

CREATE TABLE IF NOT EXISTS rfis (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number      TEXT,
  subject     TEXT,
  description TEXT,
  to_party    TEXT,
  from_party  TEXT,
  priority    TEXT DEFAULT 'Normal',
  date_submitted DATE,
  date_needed DATE,
  response    TEXT,
  status      TEXT DEFAULT 'Open',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rfis_org ON rfis(org_id, project_id);

CREATE TABLE IF NOT EXISTS punch_list (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number      TEXT,
  location    TEXT,
  description TEXT,
  assigned_to TEXT,
  due_date    DATE,
  priority    TEXT DEFAULT 'Normal',
  notes       TEXT,
  status      TEXT DEFAULT 'Open',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_punch_list_org ON punch_list(org_id, project_id);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number          TEXT,
  vendor          TEXT,
  description     TEXT,
  amount          NUMERIC DEFAULT 0,
  status          TEXT DEFAULT 'Draft',
  budget_category TEXT,
  delivery_date   DATE,
  notes           TEXT,
  date            DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_org ON purchase_orders(org_id, project_id);

CREATE TABLE IF NOT EXISTS meetings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        TEXT,
  date         DATE,
  location     TEXT,
  attendees    TEXT,
  agenda       TEXT,
  notes        TEXT,
  action_items TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meetings_org ON meetings(org_id, project_id);

CREATE TABLE IF NOT EXISTS change_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number        TEXT,
  title         TEXT,
  category      TEXT,
  description   TEXT,
  requested_by  TEXT,
  amount        NUMERIC DEFAULT 0,
  status        TEXT DEFAULT 'Pending',
  date          DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_change_orders_org ON change_orders(org_id, project_id);

CREATE TABLE IF NOT EXISTS daily_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date        DATE,
  author      TEXT,
  weather     TEXT,
  crew        INTEGER DEFAULT 0,
  notes       TEXT,
  photos      INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_daily_logs_org ON daily_logs(org_id, project_id);

CREATE TABLE IF NOT EXISTS bid_packages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  trade       TEXT,
  scope       TEXT,
  due_date    DATE,
  status      TEXT DEFAULT 'Open',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bid_packages_org ON bid_packages(org_id, project_id);

CREATE TABLE IF NOT EXISTS bids (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  package_id  UUID NOT NULL REFERENCES bid_packages(id) ON DELETE CASCADE,
  sub_name    TEXT,
  amount      NUMERIC DEFAULT 0,
  notes       TEXT,
  submitted   DATE,
  awarded     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bids_org ON bids(org_id, package_id);

CREATE TABLE IF NOT EXISTS estimates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT,
  status      TEXT DEFAULT 'Draft',
  date        DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_estimates_org ON estimates(org_id, project_id);

CREATE TABLE IF NOT EXISTS estimate_line_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  category    TEXT,
  description TEXT,
  qty         NUMERIC DEFAULT 1,
  unit        TEXT DEFAULT 'LS',
  cost        NUMERIC DEFAULT 0,
  markup      NUMERIC DEFAULT 0,
  parent_id   UUID,
  hidden      BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_estimate_li_org ON estimate_line_items(org_id, estimate_id);

CREATE TABLE IF NOT EXISTS invoices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number      TEXT,
  description TEXT,
  amount      NUMERIC DEFAULT 0,
  status      TEXT DEFAULT 'Draft',
  issued      DATE,
  due         DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(org_id, project_id);

CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT,
  type        TEXT,
  date        DATE,
  notes       TEXT,
  file_url    TEXT,
  uploader    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(org_id, project_id);

CREATE TABLE IF NOT EXISTS photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  caption     TEXT,
  tag         TEXT,
  date        DATE,
  author      TEXT,
  file_url    TEXT,
  emoji       TEXT,
  color       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_photos_org ON photos(org_id, project_id);

-- Add missing columns to existing tables
ALTER TABLE projects ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'Pre-Construction';
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS date_submitted DATE;
