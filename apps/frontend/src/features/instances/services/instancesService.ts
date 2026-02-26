import api from '@/services/api';

export interface Instance {
  id: string;
  account_id: number;
  name: string;
  type: 'evolution' | 'uazapi' | 'baileys' | 'cloud_api';
  base_url: string;
  api_key_encrypted?: string;
  instance_name?: string;
  health_check_url?: string;
  status?: 'connected' | 'disconnected' | 'connecting';
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateInstancePayload {
  name: string;
  type: 'evolution' | 'uazapi' | 'baileys' | 'cloud_api';
  base_url: string;
  api_key: string;
  instance_name?: string;
  health_check_url?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateInstancePayload {
  name?: string;
  type?: string;
  base_url?: string;
  api_key?: string;
  instance_name?: string;
  health_check_url?: string;
  metadata?: Record<string, unknown>;
}

// All service methods receive accountId as a parameter — never hardcoded
export const instancesService = {
  async list(accountId: number, filters?: { status?: string; type?: string; page?: number; limit?: number }) {
    const { data } = await api.get<{ providers: Instance[]; total: number }>(
      `/accounts/${accountId}/providers`,
      { params: filters }
    );
    return data.providers || [];
  },

  async get(accountId: number, id: string) {
    const { data } = await api.get<{ provider: Instance }>(
      `/accounts/${accountId}/providers/${id}`
    );
    return data.provider;
  },

  async create(accountId: number, payload: CreateInstancePayload) {
    const { data } = await api.post<{ provider: Instance }>(
      `/accounts/${accountId}/providers`,
      payload
    );
    return data.provider;
  },

  async update(accountId: number, id: string, updates: UpdateInstancePayload) {
    const { data } = await api.put<{ provider: Instance }>(
      `/accounts/${accountId}/providers/${id}`,
      updates
    );
    return data.provider;
  },

  async delete(accountId: number, id: string) {
    const { data } = await api.delete<{ message: string; success: boolean }>(
      `/accounts/${accountId}/providers/${id}`
    );
    return data;
  },

  async checkHealth(accountId: number, id: string) {
    const { data } = await api.get<{
      provider_id: string;
      status: string;
      healthy: boolean;
      checked_at: string;
    }>(
      `/accounts/${accountId}/providers/${id}/health`
    );
    return data;
  },

  async restart(accountId: number, id: string) {
    const { data } = await api.post<{ message: string; success: boolean }>(
      `/accounts/${accountId}/providers/${id}/restart`
    );
    return data;
  },
};
