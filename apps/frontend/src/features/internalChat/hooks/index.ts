/**
 * Internal Chat Hooks - Index Export
 */

export {
  // Query keys
  chatKeys,
  
  // Account
  useAccountId,
  
  // Settings
  useChatSettings,
  useFeatureEnabled,
  
  // Rooms
  useRooms,
  useActiveRoom,
  useActiveRoomId,
  useSetActiveRoom,
  useRoomFilter,
  useCreateRoom,
  useUpdateRoomStatus,
  useUpdateRoomPrefs,
  
  // Messages
  useMessages,
  useActiveMessages,
  useSendMessage,
  useEditMessage,
  useDeleteMessage,
  
  // Draft
  useDraft,
  
  // Typing
  useTyping,
  
  // Reactions
  useReaction,
  
  // Read
  useMarkAsRead,
  
  // Connection
  useChatConnection,
} from './useChatHooks';

export { useInternalChatData } from './useInternalChatData';
export { useInternalChatMockData } from './useInternalChatMockData';
