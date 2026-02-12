/**
 * InternalChatPage - Production Chat Page with Zustand Store
 */

import React from 'react';
import { MessageCircle } from 'lucide-react';

import { InternalChatScreen } from '../components/InternalChatScreen';
import { useInternalChatData } from '../hooks/useInternalChatData';
import { useChatConnection, useChatSettings, useFeatureEnabled } from '../hooks';

function FeatureDisabledState() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center max-w-md p-8">
        <div className="mx-auto w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-400">
          <MessageCircle className="w-6 h-6" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Chat Interno nao habilitado</h2>
        <p className="mt-2 text-muted-foreground">
          O chat interno nao esta disponivel para esta conta. Entre em contato com o administrador para solicitar acesso.
        </p>
      </div>
    </div>
  );
}

export function InternalChatPage() {
  const { isLoading: settingsLoading, isError: settingsError } = useChatSettings();
  const featureEnabled = useFeatureEnabled();

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!featureEnabled || settingsError) {
    return <FeatureDisabledState />;
  }

  return <InternalChatPageContent />;
}

export default InternalChatPage;

function InternalChatPageContent() {
  useChatConnection();
  const data = useInternalChatData();
  return <InternalChatScreen {...data} />;
}
