/**
 * Wraps Supabase queries with automatic org_id scoping.
 * Every query is filtered by org_id so tenants can never access each other's data.
 *
 * Usage:
 *   const tq = tenantQuery(supabase, 'contacts', req.orgId);
 *   const { data } = await tq.select();
 *   const { data } = await tq.insert({ name: 'Alice', email: 'a@b.com' });
 *   const { data } = await tq.update(id, { name: 'Bob' });
 *   const { data } = await tq.remove(id);
 */
function tenantQuery(supabase, table, orgId) {
  return {
    select(columns = '*') {
      return supabase
        .from(table)
        .select(columns)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
    },

    selectOne(id, columns = '*') {
      return supabase
        .from(table)
        .select(columns)
        .eq('id', id)
        .eq('org_id', orgId)
        .single();
    },

    insert(data) {
      return supabase
        .from(table)
        .insert({ ...data, org_id: orgId })
        .select()
        .single();
    },

    update(id, data) {
      // Double filter: id + org_id prevents cross-tenant modification
      const { org_id, id: _id, ...safeData } = data;
      return supabase
        .from(table)
        .update(safeData)
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();
    },

    upsert(data) {
      return supabase
        .from(table)
        .upsert({ ...data, org_id: orgId })
        .select()
        .single();
    },

    remove(id) {
      // Double filter: id + org_id prevents cross-tenant deletion
      return supabase
        .from(table)
        .delete()
        .eq('id', id)
        .eq('org_id', orgId);
    },
  };
}

module.exports = tenantQuery;
