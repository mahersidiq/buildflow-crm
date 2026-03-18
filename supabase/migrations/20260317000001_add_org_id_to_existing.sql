-- Add org_id column to all 16 existing tables for tenant isolation.
-- Fresh start: existing data should be cleared before applying NOT NULL.

-- Clear existing data (fresh start as agreed)
TRUNCATE projects, contacts, budget_items, estimates, estimate_line_items,
  invoices, change_orders, purchase_orders, daily_logs, documents, photos,
  bid_packages, bids, rfis, punch_list, meetings CASCADE;

-- Add org_id to all tables
ALTER TABLE projects             ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE contacts             ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE budget_items         ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE estimates            ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE estimate_line_items  ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE invoices             ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE change_orders        ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE purchase_orders      ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE daily_logs           ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE documents            ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE photos               ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE bid_packages         ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE bids                 ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE rfis                 ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE punch_list           ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE meetings             ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;

-- Create indexes for tenant-scoped queries
CREATE INDEX idx_projects_org         ON projects(org_id);
CREATE INDEX idx_contacts_org         ON contacts(org_id);
CREATE INDEX idx_budget_items_org     ON budget_items(org_id, project_id);
CREATE INDEX idx_estimates_org        ON estimates(org_id, project_id);
CREATE INDEX idx_estimate_li_org      ON estimate_line_items(org_id, estimate_id);
CREATE INDEX idx_invoices_org         ON invoices(org_id, project_id);
CREATE INDEX idx_change_orders_org    ON change_orders(org_id, project_id);
CREATE INDEX idx_purchase_orders_org  ON purchase_orders(org_id, project_id);
CREATE INDEX idx_daily_logs_org       ON daily_logs(org_id, project_id);
CREATE INDEX idx_documents_org        ON documents(org_id, project_id);
CREATE INDEX idx_photos_org           ON photos(org_id, project_id);
CREATE INDEX idx_bid_packages_org     ON bid_packages(org_id, project_id);
CREATE INDEX idx_bids_org             ON bids(org_id, package_id);
CREATE INDEX idx_rfis_org             ON rfis(org_id, project_id);
CREATE INDEX idx_punch_list_org       ON punch_list(org_id, project_id);
CREATE INDEX idx_meetings_org         ON meetings(org_id, project_id);
