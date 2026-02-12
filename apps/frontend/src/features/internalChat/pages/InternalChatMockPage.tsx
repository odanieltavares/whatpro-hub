/**
 * InternalChatMockPage - REFACTORED to match chat-interno reference layout
 */

import React from 'react';

// New Reference Layout Components
import { InternalChatSidebar } from '../components/InternalChatSidebar';
import { InternalProfileSidebar } from '../components/InternalProfileSidebar';
import { InternalUserProfile } from '../components/InternalUserProfile';

import { InternalChatScreen } from '../components/InternalChatScreen';
import { useInternalChatMockData } from '../hooks/useInternalChatMockData';

export function InternalChatMockPage() {
  const data = useInternalChatMockData();
  return <InternalChatScreen {...data} />;
}

export default InternalChatMockPage;
