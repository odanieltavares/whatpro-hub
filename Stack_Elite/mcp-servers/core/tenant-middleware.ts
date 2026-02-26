// mcp-servers/core/tenant-middleware.ts
import pg from 'pg';

export class TenantMiddleware {
  private db: pg.Pool;

  constructor(dbPool: pg.Pool) {
    this.db = dbPool;
  }

  /**
   * Identifica o Tenant (Empresa) a partir das chaves globais da requisição (ex. Webhook Call)
   */
  async getTenantByApiKey(apiKey: string): Promise<string | null> {
    const res = await this.db.query(
      `SELECT tenant_id FROM api_keys WHERE key_hash = $1 AND is_active = true`,
      [apiKey]
    );
    return res.rows[0]?.tenant_id || null;
  }

  /**
   * Identifica o Tenant (Empresa) a partir das credenciais restritas do Chatwoot (Account e Inbox)
   * Usado para garantir que a conversa pertence ao micro-saas correto
   */
  async getTenantByChatwootOrigin(accountId: number, inboxId: number): Promise<string | null> {
    const res = await this.db.query(
      `SELECT tenant_id FROM chatwoot_connections WHERE chatwoot_account_id = $1 AND chatwoot_inbox_id = $2 AND is_active = true`,
      [accountId, inboxId]
    );
    return res.rows[0]?.tenant_id || null;
  }

  /**
   * Valida se uma operação envolvendo Row-Level-Security (Estoque ou Agendamentos) tem permissão de execução 
   * definindo a variável a nível de transação SQL na pool 
   */
  async setContextualRLS(client: pg.PoolClient, tenantId: string) {
    await client.query(`SET LOCAL app.current_tenant_id = $1`, [tenantId]);
  }
}
