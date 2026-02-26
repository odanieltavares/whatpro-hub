import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { instancesService, type CreateInstancePayload, type UpdateInstancePayload } from '../services/instancesService';

// useAccountId returns the authenticated user's account_id (never hardcoded)
function useAccountId(): number {
  const { user } = useAuth();
  return user?.account_id ?? 0;
}

export function useInstances(filters?: { status?: string; type?: string }) {
  const accountId = useAccountId();
  return useQuery({
    queryKey: ['instances', accountId, filters],
    queryFn: () => instancesService.list(accountId, filters),
    enabled: accountId > 0,
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useInstance(id: string | undefined) {
  const accountId = useAccountId();
  return useQuery({
    queryKey: ['instances', accountId, id],
    queryFn: () => instancesService.get(accountId, id!),
    enabled: !!id && accountId > 0,
  });
}

export function useCreateInstance() {
  const queryClient = useQueryClient();
  const accountId = useAccountId();

  return useMutation({
    mutationFn: (payload: CreateInstancePayload) => instancesService.create(accountId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instances', accountId] });
      toast.success(`Instância "${data.name}" criada com sucesso`);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const message = error?.response?.data?.message || 'Falha ao criar instância';
      toast.error(message);
    },
  });
}

export function useUpdateInstance() {
  const queryClient = useQueryClient();
  const accountId = useAccountId();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateInstancePayload }) =>
      instancesService.update(accountId, id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instances', accountId] });
      queryClient.invalidateQueries({ queryKey: ['instances', accountId, data.id] });
      toast.success(`Instância "${data.name}" atualizada com sucesso`);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const message = error?.response?.data?.message || 'Falha ao atualizar instância';
      toast.error(message);
    },
  });
}

export function useDeleteInstance() {
  const queryClient = useQueryClient();
  const accountId = useAccountId();

  return useMutation({
    mutationFn: (id: string) => instancesService.delete(accountId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances', accountId] });
      toast.success('Instância removida com sucesso');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const message = error?.response?.data?.message || 'Falha ao remover instância';
      toast.error(message);
    },
  });
}

export function useRestartInstance() {
  const queryClient = useQueryClient();
  const accountId = useAccountId();

  return useMutation({
    mutationFn: (id: string) => instancesService.restart(accountId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances', accountId] });
      toast.success('Instância reiniciada com sucesso');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const message = error?.response?.data?.message || 'Falha ao reiniciar instância';
      toast.error(message);
    },
  });
}

export function useCheckHealth(id: string | undefined, enabled = true) {
  const accountId = useAccountId();
  return useQuery({
    queryKey: ['instances', accountId, id, 'health'],
    queryFn: () => instancesService.checkHealth(accountId, id!),
    enabled: !!id && enabled && accountId > 0,
    refetchInterval: 15000,
    retry: 1,
  });
}
