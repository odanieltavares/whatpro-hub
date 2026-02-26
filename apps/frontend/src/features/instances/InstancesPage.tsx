import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { InstanceCard } from './InstanceCard'
import { InstanceTabs } from './components/InstanceTabs'
import { InstanceCardSkeleton } from './components/InstanceCardSkeleton'
import { CreateInstanceDialog } from './components/CreateInstanceDialog'
import { useInstances } from './hooks/useInstances'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Smartphone, 
  Search, 
  WifiOff, 
  RefreshCw, 
  ServerCrash,
} from 'lucide-react'

type TabValue = 'all' | 'connected' | 'disconnected'

export default function InstancesPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { data: instances = [], isLoading, error, refetch } = useInstances()

  // Filter instances based on active tab and search
  const filteredInstances = useMemo(() => {
    let filtered = instances

    // Tab filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(instance => {
        const status = instance.status || 'disconnected'
        return status === activeTab
      })
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(instance =>
        instance.name.toLowerCase().includes(q) ||
        instance.instance_name?.toLowerCase().includes(q) ||
        instance.type?.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [instances, activeTab, searchQuery])

  // Calculate counts for tabs
  const counts = useMemo(() => {
    const connected = instances.filter(i => i.status === 'connected').length
    const disconnected = instances.filter(i => i.status !== 'connected').length
    
    return {
      all: instances.length,
      connected,
      disconnected
    }
  }, [instances])

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('instances.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('instances.description')}
          </p>
        </div>
        <CreateInstanceDialog />
      </div>

      {/* Search + Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('instances.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <InstanceTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          counts={counts}
        />
      </div>

      {/* Loading State — Skeleton Grid */}
      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <InstanceCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-full mb-4">
            <ServerCrash className="h-10 w-10 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold mb-1">
            {t('instances.error.title')}
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mb-5">
            {t('instances.messages.load_error')}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('instances.error.retry')}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredInstances.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-muted/50 rounded-full mb-4">
            {searchQuery ? (
              <Search className="h-10 w-10 text-muted-foreground/60" />
            ) : activeTab !== 'all' ? (
              <WifiOff className="h-10 w-10 text-muted-foreground/60" />
            ) : (
              <Smartphone className="h-10 w-10 text-muted-foreground/60" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-1">
            {searchQuery 
              ? t('instances.empty.search_title')
              : activeTab !== 'all'
                ? t('instances.empty.filtered_title')
                : t('instances.empty.title')}
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mb-5">
            {searchQuery
              ? t('instances.empty.search_description')
              : activeTab === 'all' 
                ? t('instances.messages.empty_all')
                : t('instances.messages.empty_filtered', { status: t(`instances.tabs.${activeTab}`) })}
          </p>
          {!searchQuery && activeTab === 'all' && (
            <CreateInstanceDialog variant="empty-state" />
          )}
        </div>
      )}

      {/* Instance Cards Grid */}
      {!isLoading && !error && filteredInstances.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredInstances.map((instance) => (
            <InstanceCard
              key={instance.id}
              id={instance.id}
              name={instance.name}
              status={(instance.status as 'connected' | 'disconnected' | 'connecting') || 'disconnected'}
              phone={instance.instance_name}
              type={instance.type}
            />
          ))}
        </div>
      )}
    </div>
  )
}
