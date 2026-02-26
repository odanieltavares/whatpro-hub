import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { QrCode, RefreshCw, Trash2, CheckCircle2, AlertCircle, Smartphone, Server } from 'lucide-react'
import { useDeleteInstance, useCheckHealth, useRestartInstance } from './hooks/useInstances'

interface InstanceCardProps {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'connecting'
  phone?: string
  type?: string
}

const providerLabels: Record<string, string> = {
  evolution: 'Evolution API',
  uazapi: 'UazAPI',
  baileys: 'Baileys',
  cloud_api: 'Cloud API',
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    connected: 'bg-emerald-500',
    disconnected: 'bg-red-400',
    connecting: 'bg-amber-400',
  }
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === 'connecting' && (
        <span className={`absolute inline-flex h-full w-full rounded-full ${colors[status]} opacity-75 animate-ping`} />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${colors[status]}`} />
    </span>
  )
}

export function InstanceCard({ id, name, status: initialStatus, phone, type }: InstanceCardProps) {
  const { t } = useTranslation()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const deleteMutation = useDeleteInstance()
  const { mutate: restartInstance, isPending: isRestarting } = useRestartInstance()
  
  // Real-time health check
  const { data: healthData } = useCheckHealth(id, initialStatus === 'connected')
  
  // Use real-time health status if available
  const status = healthData?.healthy ? 'connected' : initialStatus

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id)
    setShowDeleteConfirm(false)
  }

  const statusBorderColor: Record<string, string> = {
    connected: 'border-t-emerald-500/60',
    disconnected: 'border-t-red-400/40',
    connecting: 'border-t-amber-400/50',
  }

  return (
    <>
      <Card className={`w-full border-t-2 ${statusBorderColor[status]} transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 bg-primary/10 rounded-xl">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">{name}</CardTitle>
                <CardDescription className="flex items-center gap-1.5 mt-0.5">
                  {phone || t('instances.card.no_phone')}
                </CardDescription>
              </div>
            </div>
            <Badge 
              variant={status === 'connected' ? 'default' : 'destructive'}
              className="flex items-center gap-1.5 capitalize text-xs px-2.5 py-0.5"
            >
              <StatusDot status={status} />
              {t(`instances.status.${status}`)}
            </Badge>
          </div>
          {type && (
            <div className="mt-2 pl-12">
              <Badge variant="outline" className="text-xs font-normal gap-1">
                <Server className="h-3 w-3" />
                {providerLabels[type] || type}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="py-3">
          {status === 'disconnected' || status === 'connecting' ? (
            <div className="flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
              <div className="p-3 bg-background rounded-full shadow-sm group-hover:scale-110 transition-transform">
                <QrCode className="h-7 w-7 text-muted-foreground" />
              </div>
              <span className="mt-2.5 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {t('instances.card.scan_qr')}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-5 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {t('instances.card.synced')}
              </span>
              {healthData?.checked_at && (
                <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                  {t('instances.card.connected_at')} {new Date(healthData.checked_at).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1 text-xs"
            onClick={() => restartInstance(id)}
            disabled={isRestarting}
          >
            {isRestarting ? (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t('instances.card.restart')}
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            {t('instances.card.delete')}
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {t('instances.delete_dialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('instances.delete_dialog.description', { name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleteMutation.isPending}
            >
              {t('instances.delete_dialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('instances.delete_dialog.deleting') : t('instances.delete_dialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
