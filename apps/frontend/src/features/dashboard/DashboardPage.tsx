import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Activity, MessageSquare, Server, Users, AlertCircle, RefreshCw } from "lucide-react"
import { useDashboardMetrics } from "./hooks/useDashboardMetrics"
import { useInstances } from "@/features/instances/hooks/useInstances"

export default function DashboardPage() {
  const {
    data: metrics,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useDashboardMetrics()

  // Fetch instances list for the "Recent Instances" panel — real data
  const { data: instances = [] } = useInstances()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  // Error state — friendly message with retry (never crash the page)
  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm">Visão geral do sistema</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar métricas</AlertTitle>
          <AlertDescription>
            Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-fit"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Tentar novamente
        </Button>
      </div>
    )
  }

  // Real stat cards — no hardcoded percentages
  const stats = [
    {
      title: "Instâncias Ativas",
      value: metrics?.active_instances ?? 0,
      description: "Instâncias conectadas ao sistema",
      icon: Server,
    },
    {
      title: "Mensagens Hoje",
      value: metrics?.messages_today ?? 0,
      description: "Mensagens processadas nas últimas 24h",
      icon: Activity,
    },
    {
      title: "Clientes Ativos",
      value: metrics?.active_clients ?? 0,
      description: "Contatos únicos em conversas abertas",
      icon: Users,
    },
    {
      title: "Workflows Disparados",
      value: metrics?.workflows_triggered ?? 0,
      description: "Automações executadas hoje",
      icon: MessageSquare,
    },
  ]

  // Status color helper for instance badges
  const statusColor = (status?: string) => {
    switch (status) {
      case 'connected':    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'connecting':   return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      case 'disconnected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:             return 'bg-muted text-muted-foreground'
    }
  }

  const statusLabel = (status?: string) => {
    switch (status) {
      case 'connected':    return 'Conectada'
      case 'connecting':   return 'Conectando'
      case 'disconnected': return 'Desconectada'
      default:             return 'Desconhecido'
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-sm">
          Visão geral do sistema em tempo real
        </p>
      </div>

      {/* Metric cards — all from real API data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString('pt-BR')}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom panels */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Activity chart placeholder — to be replaced with Recharts in a future task */}
        <Card className="col-span-4 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Visão geral do desempenho das instâncias</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex flex-col items-center justify-center border-dashed border-2 rounded-md bg-muted/20">
              <Activity className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Gráfico de atividade em breve</p>
            </div>
          </CardContent>
        </Card>

        {/* Real instances panel — latest 5 instances from the account */}
        <Card className="col-span-3 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle>Instâncias Recentes</CardTitle>
            <CardDescription>Últimas instâncias da sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            {instances.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Server className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">Nenhuma instância encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {instances.slice(0, 5).map((instance) => (
                  <div key={instance.id} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Server className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">{instance.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{instance.type}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(instance.status)}`}>
                      {statusLabel(instance.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// DashboardSkeleton mirrors the real layout to prevent layout shift
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="col-span-4 h-[300px] rounded-xl" />
        <Skeleton className="col-span-3 h-[300px] rounded-xl" />
      </div>
    </div>
  )
}
