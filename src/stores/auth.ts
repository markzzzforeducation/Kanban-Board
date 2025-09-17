import { defineStore } from 'pinia';
import { apiPost, setAuthToken } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // mock only for FE assignment
}

interface AuthState {
  users: User[];
  currentUserId: string | null;
}

const STORAGE_KEY_USERS = 'kb-users';
const STORAGE_KEY_CURRENT = 'kb-currentUserId';

function loadUsers(): User[] {
  const raw = localStorage.getItem(STORAGE_KEY_USERS);
  if (raw) return JSON.parse(raw);
  const seed: User[] = [
    { id: 'u1', name: 'Alice', email: 'alice@example.com', password: '123456' },
    { id: 'u2', name: 'Bob', email: 'bob@example.com', password: '123456' },
  ];
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(seed));
  return seed;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    users: loadUsers(),
    currentUserId: localStorage.getItem(STORAGE_KEY_CURRENT),
  }),
  getters: {
    currentUser(state): User | null {
      return state.users.find(u => u.id === state.currentUserId) ?? null;
    },
    allUsers(state): User[] {
      return state.users;
    },
  },
  actions: {
    persistUsers() {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
    },
    async login(email: string, password: string): Promise<{ ok: boolean; message?: string }> {
      try {
        const res = await apiPost<{ token: string; user: { id: string; name: string; email: string } }>(`/api/auth/login`, { email, password });
        setAuthToken(res.token);
        // Sync minimal user list for compatibility
        const exists = this.users.some(u => u.id === res.user.id);
        if (!exists) {
          this.users.push({ id: res.user.id, name: res.user.name, email: res.user.email, password: '' });
          this.persistUsers();
        }
        this.currentUserId = res.user.id;
        localStorage.setItem(STORAGE_KEY_CURRENT, res.user.id);
        return { ok: true };
      } catch (e: any) {
        return { ok: false, message: e?.message || 'Invalid credentials' };
      }
    },
    async register(name: string, email: string, password: string): Promise<{ ok: boolean; message?: string }> {
      try {
        await apiPost(`/api/auth/register`, { name, email, password });
        // Auto-login after register
        const loginRes = await this.login(email, password);
        return loginRes;
      } catch (e: any) {
        return { ok: false, message: e?.message || 'Email already registered' };
      }
    },
    logout() {
      this.currentUserId = null;
      localStorage.removeItem(STORAGE_KEY_CURRENT);
      setAuthToken(null);
    },
  },
});


