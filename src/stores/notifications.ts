import { defineStore } from 'pinia';

export interface Notification {
  id: string;
  userId: string;
  message: string;
  createdAt: number;
  read: boolean;
}

interface NotiState {
  notifications: Notification[];
}

const STORAGE_KEY = 'kb-notifications';

function load(): Notification[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export const useNotificationsStore = defineStore('notifications', {
  state: (): NotiState => ({ notifications: load() }),
  getters: {
    unreadForUser: (state) => (userId: string) => state.notifications.filter(n => n.userId === userId && !n.read),
    allForUser: (state) => (userId: string) => state.notifications.filter(n => n.userId === userId),
  },
  actions: {
    persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notifications)); },
    push(userId: string, message: string) {
      this.notifications.unshift({ id: 'n' + Date.now(), userId, message, createdAt: Date.now(), read: false });
      this.persist();
    },
    markAllRead(userId: string) {
      this.notifications.forEach(n => { if (n.userId === userId) n.read = true; });
      this.persist();
    }
  }
});


