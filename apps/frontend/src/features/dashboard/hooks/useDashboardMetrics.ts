import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

// DashboardMetrics maps directly to the backend AccountStats response shape
export interface DashboardMetrics {
  active_instances: number;
  messages_today: number;
  active_clients: number;
  workflows_triggered: number;
  generated_at: string;
}

const fetchDashboardMetrics = async (accountId: number): Promise<DashboardMetrics> => {
  const { data } = await api.get<{ success: boolean; data: DashboardMetrics }>(
    `/accounts/${accountId}/stats`
  );
  return data.data;
};

export function useDashboardMetrics() {
  const { user } = useAuth();
  const accountId = user?.account_id ?? 0;

  return useQuery({
    queryKey: ['dashboard', 'metrics', accountId],
    queryFn: () => fetchDashboardMetrics(accountId),
    enabled: accountId > 0,
    refetchInterval: 60_000, // Refresh every minute
    staleTime: 30_000,
    retry: 2,
  });
}
