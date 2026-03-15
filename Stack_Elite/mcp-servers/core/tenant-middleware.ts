// mcp-servers/core/tenant-middleware.ts
//
// Middleware de banco de dados para ativar Row Level Security (RLS)
// corretamente no PostgreSQL por tenant.
//
// USO:
//   import { withTenantContext, tenantQuery } from "../core/tenant-middleware";
//
//   // queries simples:
//   const result = await tenantQuery(pool, tenant_id, "SELECT * FROM vehicles");
//
//   // transações completas:
//   await withTenantContext(pool, tenant_id, async (client) => {
//     await client.query("INSERT INTO vehicles ...");
//     await client.query("UPDATE interactions ...");
//   });

import pg from "pg";

/**
 * Executa uma callback dentro de uma transação com o contexto de tenant ativado.
 * Usa SET LOCAL para garantir que o contexto se aplica apenas à transação.
 * A política RLS "isolation_policy_*" do Postgres usa current_setting('app.current_tenant_id').
 */
export async function withTenantContext<T>(
  pool: pg.Pool,
  tenant_id: string,
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // SET LOCAL aplica APENAS para a transação atual — é seguro para multi-tenant
    await client.query(
      "SELECT set_config('app.current_tenant_id', $1, true)",
      [tenant_id]
    );
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Helper para queries simples que precisam de contexto de tenant.
 * Para múltiplas queries no mesmo tenant, prefira withTenantContext.
 */
export async function tenantQuery(
  pool: pg.Pool,
  tenant_id: string,
  queryText: string,
  values?: any[]
): Promise<pg.QueryResult> {
  return withTenantContext(pool, tenant_id, async (client) => {
    return client.query(queryText, values);
  });
}
