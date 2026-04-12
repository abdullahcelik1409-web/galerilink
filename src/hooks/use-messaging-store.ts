import { create } from 'zustand'

interface MessagingState {
  unreadCount: number
  activeConversationId: string | null
  setUnreadCount: (count: number) => void
  incrementUnread: () => void
  setActiveConversation: (id: string | null) => void
}

export const useMessagingStore = create<MessagingState>((set) => ({
  unreadCount: 0,
  activeConversationId: null,
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  setActiveConversation: (id) => set({ activeConversationId: id }),
}))
