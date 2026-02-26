import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languagedetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    fallbackLng: 'pt-BR',
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      'pt-BR': {
        translation: {
          instances: {
            title: 'Instâncias',
            description: 'Gerencie suas conexões do WhatsApp e pareie novos dispositivos.',
            add_instance: 'Adicionar Instância',
            search_placeholder: 'Buscar instâncias...',
            tabs: {
              all: 'Todas',
              connected: 'Conectadas',
              disconnected: 'Desconectadas',
            },
            status: {
              connected: 'Conectada',
              disconnected: 'Desconectada',
              connecting: 'Conectando...',
            },
            card: {
              no_phone: 'Nenhum número pareado',
              scan_qr: 'Escanear QR Code',
              synced: 'Sincronizado',
              connected_at: 'Conectado às',
              restart: 'Reiniciar',
              delete: 'Excluir',
            },
            delete_dialog: {
              title: 'Confirmar Exclusão',
              description: 'Tem certeza que deseja excluir a instância "{{name}}"? Esta ação não pode ser desfeita.',
              cancel: 'Cancelar',
              confirm: 'Excluir Instância',
              deleting: 'Excluindo...',
            },
            create_dialog: {
              title: 'Criar Nova Instância',
              description: 'Adicione uma nova instância de provedor WhatsApp à sua conta.',
              name_label: 'Nome da Instância',
              name_placeholder: 'Ex: Suporte de Vendas',
              type_label: 'Tipo de Provedor',
              base_url_label: 'URL Base',
              base_url_placeholder: 'https://api.exemplo.com',
              api_key_label: 'Chave API',
              api_key_placeholder: 'Sua chave de API',
              instance_id_label: 'ID da Instância (opcional)',
              instance_id_placeholder: 'bot-vendas-01',
              cancel: 'Cancelar',
              create: 'Criar Instância',
              creating: 'Criando...',
            },
            error: {
              title: 'Erro ao carregar',
              retry: 'Tentar novamente',
            },
            empty: {
              title: 'Nenhuma instância',
              filtered_title: 'Nenhum resultado',
              search_title: 'Nenhum resultado',
              search_description: 'Tente buscar com outros termos.',
            },
            messages: {
              created_success: 'Instância "{{name}}" criada com sucesso',
              create_error: 'Falha ao criar instância',
              updated_success: 'Instância "{{name}}" atualizada com sucesso',
              update_error: 'Falha ao atualizar instância',
              deleted_success: 'Instância excluída com sucesso',
              delete_error: 'Falha ao excluir instância',
              load_error: 'Falha ao carregar instâncias. Verifique sua conexão e tente novamente.',
              empty_all: 'Nenhuma instância encontrada. Crie sua primeira instância para começar.',
              empty_filtered: 'Nenhuma instância {{status}} encontrada.',
            }
          },
          common: {
            loading: 'Carregando...',
            error: 'Erro',
            success: 'Sucesso',
          }
        }
      },
      'en': {
        translation: {
          instances: {
            title: 'Instances',
            description: 'Manage your WhatsApp connections and pair new devices.',
            add_instance: 'Add Instance',
            search_placeholder: 'Search instances...',
            tabs: {
              all: 'All',
              connected: 'Connected',
              disconnected: 'Disconnected',
            },
            status: {
              connected: 'Connected',
              disconnected: 'Disconnected',
              connecting: 'Connecting...',
            },
            card: {
              no_phone: 'No number paired',
              scan_qr: 'Scan QR Code',
              synced: 'Synced',
              connected_at: 'Connected at',
              restart: 'Restart',
              delete: 'Delete',
            },
            delete_dialog: {
              title: 'Confirm Deletion',
              description: 'Are you sure you want to delete instance "{{name}}"? This action cannot be undone.',
              cancel: 'Cancel',
              confirm: 'Delete Instance',
              deleting: 'Deleting...',
            },
            create_dialog: {
              title: 'Create New Instance',
              description: 'Add a new WhatsApp provider instance to your account.',
              name_label: 'Instance Name',
              name_placeholder: 'Sales Support',
              type_label: 'Provider Type',
              base_url_label: 'Base URL',
              base_url_placeholder: 'https://api.example.com',
              api_key_label: 'API Key',
              api_key_placeholder: 'Your API key',
              instance_id_label: 'Instance ID (optional)',
              instance_id_placeholder: 'sales-bot-01',
              cancel: 'Cancel',
              create: 'Create Instance',
              creating: 'Creating...',
            },
            error: {
              title: 'Failed to load',
              retry: 'Try again',
            },
            empty: {
              title: 'No instances',
              filtered_title: 'No results',
              search_title: 'No results found',
              search_description: 'Try searching with different terms.',
            },
            messages: {
              created_success: 'Instance "{{name}}" created successfully',
              create_error: 'Failed to create instance',
              updated_success: 'Instance "{{name}}" updated successfully',
              update_error: 'Failed to update instance',
              deleted_success: 'Instance deleted successfully',
              delete_error: 'Failed to delete instance',
              load_error: 'Failed to load instances. Please check your connection and try again.',
              empty_all: 'No instances found. Create your first instance to get started.',
              empty_filtered: 'No {{status}} instances found.',
            }
          },
          common: {
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
          }
        }
      }
    }
  });

export default i18n;
