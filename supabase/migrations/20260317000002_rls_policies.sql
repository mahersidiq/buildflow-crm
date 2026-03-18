-- Row Level Security policies for tenant isolation (defense-in-depth).
-- These policies check that org_id matches the PostgreSQL session variable
-- set by the Express tenantScope middleware.

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
      'organizations', 'users', 'roles', 'audit_log',
      'projects', 'contacts', 'budget_items', 'estimates', 'estimate_line_items',
      'invoices', 'change_orders', 'purchase_orders', 'daily_logs',
      'documents', 'photos', 'bid_packages', 'bids', 'rfis', 'punch_list', 'meetings'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

    -- SELECT policy
    EXECUTE format(
      'CREATE POLICY tenant_select ON %I FOR SELECT USING (org_id = current_org_id())',
      tbl
    );

    -- INSERT policy
    EXECUTE format(
      'CREATE POLICY tenant_insert ON %I FOR INSERT WITH CHECK (org_id = current_org_id())',
      tbl
    );

    -- UPDATE policy
    EXECUTE format(
      'CREATE POLICY tenant_update ON %I FOR UPDATE USING (org_id = current_org_id())',
      tbl
    );

    -- DELETE policy
    EXECUTE format(
      'CREATE POLICY tenant_delete ON %I FOR DELETE USING (org_id = current_org_id())',
      tbl
    );
  END LOOP;
END;
$$;

-- Organizations table: special policy (org_id IS the id itself)
DROP POLICY IF EXISTS tenant_select ON organizations;
DROP POLICY IF EXISTS tenant_insert ON organizations;
DROP POLICY IF EXISTS tenant_update ON organizations;
DROP POLICY IF EXISTS tenant_delete ON organizations;

CREATE POLICY tenant_select ON organizations FOR SELECT USING (id = current_org_id());
CREATE POLICY tenant_insert ON organizations FOR INSERT WITH CHECK (id = current_org_id());
CREATE POLICY tenant_update ON organizations FOR UPDATE USING (id = current_org_id());
CREATE POLICY tenant_delete ON organizations FOR DELETE USING (id = current_org_id());

-- Drop old anonymous storage policies
DROP POLICY IF EXISTS "Allow anon uploads on documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon reads on documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon deletes on documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon uploads on photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon reads on photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon deletes on photos" ON storage.objects;

-- Tenant-scoped storage policies (path must start with org_id)
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
