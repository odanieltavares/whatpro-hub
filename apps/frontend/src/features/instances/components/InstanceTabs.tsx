import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface InstanceTabsProps {
  activeTab: 'all' | 'connected' | 'disconnected'
  onTabChange: (tab: 'all' | 'connected' | 'disconnected') => void
  counts: {
    all: number
    connected: number
    disconnected: number
  }
}

export function InstanceTabs({ activeTab, onTabChange, counts }: InstanceTabsProps) {
  const { t } = useTranslation()

  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as 'all' | 'connected' | 'disconnected')}>
      <TabsList className="h-9">
        <TabsTrigger value="all" className="text-xs px-3 gap-1.5">
          {t('instances.tabs.all')}
          <span className="ml-0.5 bg-muted-foreground/15 text-muted-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] inline-flex items-center justify-center">
            {counts.all}
          </span>
        </TabsTrigger>
        <TabsTrigger value="connected" className="text-xs px-3 gap-1.5">
          {t('instances.tabs.connected')}
          <span className="ml-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] inline-flex items-center justify-center">
            {counts.connected}
          </span>
        </TabsTrigger>
        <TabsTrigger value="disconnected" className="text-xs px-3 gap-1.5">
          {t('instances.tabs.disconnected')}
          <span className="ml-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] inline-flex items-center justify-center">
            {counts.disconnected}
          </span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
