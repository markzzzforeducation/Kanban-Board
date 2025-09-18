import { defineStore } from 'pinia';
import { apiGet, apiPost } from '../lib/api';

export interface Notification {
  id: string;
  userId: string;
  message: string;
  createdAt: number;
  read: boolean;
  type?: string;
  boardId?: string | null;
}

interface NotiState {
  notifications: Notification[];
  _timer?: number | null;
  _focusBound?: boolean;
}

const STORAGE_KEY = 'kb-notifications';

function load(): Notification[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export const useNotificationsStore = defineStore('notifications', {
  state: (): NotiState => ({ notifications: load(), _timer: null, _focusBound: false }),
  getters: {
    unreadForUser: (state) => (userId: string) => state.notifications.filter(n => n.userId === userId && !n.read),
    allForUser: (state) => (userId: string) => state.notifications.filter(n => n.userId === userId),
  },
  actions: {
    persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notifications)); },
    async fetch() {
      try {
        const raw = await apiGet<any[]>(`/api/notifications`);
        const mapped: Notification[] = (raw || []).map((n) => ({
          id: n.id,
          userId: n.userId,
          message: n.message,
          read: Boolean(n.read),
          createdAt: typeof n.createdAt === 'number' ? n.createdAt : (n.createdAt ? new Date(n.createdAt).getTime() : Date.now()),
          type: n.type,
          boardId: n.boardId ?? null,
        }));
        // Optional: sort newest first
        mapped.sort((a, b) => b.createdAt - a.createdAt);
        this.notifications = mapped;
        console.log('[FE] notifications fetched', { count: mapped.length });
        this.persist();
      } catch {
        // ignore if backend not available
      }
    },
    startAutoRefresh(intervalMs: number = 15000) {
      if (this._timer) return;
      // immediate fetch then interval
      this.fetch();
      this._timer = (setInterval(() => this.fetch(), intervalMs) as unknown as number);
      // focus/visibility-based refresh
      if (!this._focusBound) {
        const onFocus = () => this.fetch();
        const onVis = () => { if (document.visibilityState === 'visible') this.fetch(); };
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVis);
        // store markers; not storing handlers to keep it simple for this demo
        this._focusBound = true;
      }
    },
    stopAutoRefresh() {
      if (this._timer) {
        clearInterval(this._timer as unknown as number);
        this._timer = null;
      }
    },
    push(userId: string, message: string) {
      this.notifications.unshift({ id: 'n' + Date.now(), userId, message, createdAt: Date.now(), read: false });
      this.persist();
    },
    async markAllRead(userId: string) {
      try {
        await apiPost(`/api/notifications/read-all`);
        await this.fetch();
      } catch {
        this.notifications.forEach(n => { if (n.userId === userId) n.read = true; });
        this.persist();
      }
    }
  }
});


