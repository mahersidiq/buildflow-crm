-- ============================================================================
-- BuildFlow CRM — Full Database Bootstrap
-- ============================================================================
-- Run this ONCE in the Supabase SQL Editor for a fresh database.
-- It creates all tables, indexes, storage buckets, and RLS policies.
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: Multi-tenant core tables
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  logo_url      TEXT,
  address       TEXT,
  city          TEXT,
  state         TEXT,
  zip           TEXT,
  phone         TEXT,
  email         TEXT,
  website       TEXT,
  license       TEXT,
  default_markup NUMERIC(5,2) DEFAULT 20,
  terms         TEXT,
  plan          TEXT DEFAULT 'free',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member',
  is_active     BOOLEAN DEFAULT TRUE,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  user_id     UUID REFERENCES users(id),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  changes     JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_org_time ON audit_log(org_id, created_at DESC);

CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, name)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: Business tables (all include org_id from the start)
-- ═══════════════════════════════════════════════════════════════════════════

-- Projects
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  client      TEXT,
  value       NUMERIC,
  status      TEXT DEFAULT 'Lead',
  phase       TEXT DEFAULT 'Pre-Construction',
  type        TEXT,
  address     TEXT,
  "start"     DATE,
  "end"       DATE,
  notes       TEXT,
  spent       NUMERIC DEFAULT 0,
  progress    NUMERIC DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_org ON projects(org_id);

-- Contacts
CREATE TABLE contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  company     TEXT,
  type        TEXT,
  email       TEXT,
  phone       TEXT,
  city        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_org ON contacts(org_id);

-- Budget Items
CREATE TABLE budget_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category    TEXT,
  division    TEXT,
  code        TEXT,
  budgeted    NUMERIC DEFAULT 0,
  actual      NUMERIC DEFAULT 0,
  committed   NUMERIC DEFAULT 0,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_items_org ON budget_items(org_id, project_id);

-- Estimates
CREATE TABLE estimates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT,
  status      TEXT DEFAULT 'Draft',
  date        DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_estimates_org ON estimates(org_id, project_id);

-- Estimate Line Items
CREATE TABLE estimate_line_items (
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

CREATE INDEX idx_estimate_li_org ON estimate_line_items(org_id, estimate_id);

-- Invoices
CREATE TABLE invoices (
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

CREATE INDEX idx_invoices_org ON invoices(org_id, project_id);

-- Change Orders
CREATE TABLE change_orders (
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

CREATE INDEX idx_change_orders_org ON change_orders(org_id, project_id);

-- Purchase Orders
CREATE TABLE purchase_orders (
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

CREATE INDEX idx_purchase_orders_org ON purchase_orders(org_id, project_id);

-- Daily Logs
CREATE TABLE daily_logs (
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

CREATE INDEX idx_daily_logs_org ON daily_logs(org_id, project_id);

-- Documents
CREATE TABLE documents (
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

CREATE INDEX idx_documents_org ON documents(org_id, project_id);

-- Photos
CREATE TABLE photos (
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

CREATE INDEX idx_photos_org ON photos(org_id, project_id);

-- Bid Packages
CREATE TABLE bid_packages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  trade       TEXT,
  scope       TEXT,
  due_date    DATE,
  status      TEXT DEFAULT 'Open',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bid_packages_org ON bid_packages(org_id, project_id);

-- Bids
CREATE TABLE bids (
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

CREATE INDEX idx_bids_org ON bids(org_id, package_id);

-- RFIs
CREATE TABLE rfis (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number      TEXT,
  subject     TEXT,
  description TEXT,
  to_party    TEXT,
  from_party  TEXT,
  priority    TEXT DEFAULT 'Normal',
  date_needed DATE,
  response    TEXT,
  status      TEXT DEFAULT 'Open',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rfis_org ON rfis(org_id, project_id);

-- Punch List
CREATE TABLE punch_list (
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

CREATE INDEX idx_punch_list_org ON punch_list(org_id, project_id);

-- Meetings
CREATE TABLE meetings (
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

CREATE INDEX idx_meetings_org ON meetings(org_id, project_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3: Storage buckets
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('documents', 'documents', true),
  ('photos',    'photos',    true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4: Row Level Security policies
-- ═══════════════════════════════════════════════════════════════════════════

-- Helper function to get current org_id from session
CREATE OR REPLACE FUNCTION current_org_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_org_id', true), '')::UUID;
$$ LANGUAGE sql STABLE;

-- Apply RLS to all tenant-scoped tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'users', 'roles', 'audit_log',
      'projects', 'contacts', 'budget_items', 'estimates', 'estimate_line_items',
      'invoices', 'change_orders', 'purchase_orders', 'daily_logs',
      'documents', 'photos', 'bid_packages', 'bids', 'rfis', 'punch_list', 'meetings'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

    EXECUTE format(
      'CREATE POLICY tenant_select ON %I FOR SELECT USING (org_id = current_org_id())',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY tenant_insert ON %I FOR INSERT WITH CHECK (org_id = current_org_id())',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY tenant_update ON %I FOR UPDATE USING (org_id = current_org_id())',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY tenant_delete ON %I FOR DELETE USING (org_id = current_org_id())',
      tbl
    );
  END LOOP;
END;
$$;

-- Organizations table: special policy (org_id IS the id itself)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_select ON organizations FOR SELECT USING (id = current_org_id());
CREATE POLICY tenant_insert ON organizations FOR INSERT WITH CHECK (id = current_org_id());
CREATE POLICY tenant_update ON organizations FOR UPDATE USING (id = current_org_id());
CREATE POLICY tenant_delete ON organizations FOR DELETE USING (id = current_org_id());

-- Tenant-scoped storage policies (file paths must start with org_id)
CREATE POLICY "Tenant upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = current_setting('app.current_org_id', true)
  );

CREATE POLICY "Tenant read documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = current_setting('app.current_org_id', true)
  );

CREATE POLICY "Tenant delete documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = current_setting('app.current_org_id', true)
  );

CREATE POLICY "Tenant upload photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = current_setting('app.current_org_id', true)
  );

CREATE POLICY "Tenant read photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = current_setting('app.current_org_id', true)
  );

CREATE POLICY "Tenant delete photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = current_setting('app.current_org_id', true)
  );
