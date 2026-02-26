import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Server, Globe, Key, Tag, Loader2 } from 'lucide-react'
import { useCreateInstance } from '../hooks/useInstances'
import type { CreateInstancePayload } from '../services/instancesService'

export function CreateInstanceDialog({ variant }: { variant?: 'default' | 'empty-state' }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<CreateInstancePayload>({
    name: '',
    type: 'evolution',
    base_url: '',
    api_key: '',
    instance_name: '',
  })

  const createMutation = useCreateInstance()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createMutation.mutateAsync(formData)
      setOpen(false)
      // Reset form
      setFormData({
        name: '',
        type: 'evolution',
        base_url: '',
        api_key: '',
        instance_name: '',
      })
    } catch {
      // Error is handled by the mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === 'empty-state' ? (
          <Button variant="outline" className="font-medium">
            <Plus className="mr-2 h-4 w-4" />
            {t('instances.add_instance')}
          </Button>
        ) : (
          <Button className="font-medium shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            {t('instances.add_instance')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('instances.create_dialog.title')}</DialogTitle>
            <DialogDescription>
              {t('instances.create_dialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-5">
            <div className="grid gap-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                {t('instances.create_dialog.name_label')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder={t('instances.create_dialog.name_placeholder')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-10"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="type" className="flex items-center gap-2">
                <Server className="h-3.5 w-3.5 text-muted-foreground" />
                {t('instances.create_dialog.type_label')} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as CreateInstancePayload['type'] })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="evolution">Evolution API</SelectItem>
                  <SelectItem value="uazapi">UazAPI</SelectItem>
                  <SelectItem value="baileys">Baileys</SelectItem>
                  <SelectItem value="cloud_api">Cloud API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="base_url" className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                {t('instances.create_dialog.base_url_label')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="base_url"
                type="url"
                placeholder={t('instances.create_dialog.base_url_placeholder')}
                value={formData.base_url}
                onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                required
                className="h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="api_key" className="flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-muted-foreground" />
                {t('instances.create_dialog.api_key_label')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="api_key"
                type="password"
                placeholder={t('instances.create_dialog.api_key_placeholder')}
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                required
                className="h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="instance_name" className="flex items-center gap-2">
                <Server className="h-3.5 w-3.5 text-muted-foreground" />
                {t('instances.create_dialog.instance_id_label')}
              </Label>
              <Input
                id="instance_name"
                placeholder={t('instances.create_dialog.instance_id_placeholder')}
                value={formData.instance_name}
                onChange={(e) => setFormData({ ...formData, instance_name: e.target.value })}
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createMutation.isPending}
            >
              {t('instances.create_dialog.cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {createMutation.isPending ? t('instances.create_dialog.creating') : t('instances.create_dialog.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
