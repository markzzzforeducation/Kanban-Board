import { defineStore } from 'pinia';

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
    login(email: string, password: string): boolean {
      const user = this.users.find(u => u.email === email && u.password === password);
      if (!user) return false;
      this.currentUserId = user.id;
      localStorage.setItem(STORAGE_KEY_CURRENT, user.id);
      return true;
    },
    register(name: string, email: string, password: string): { ok: boolean; message?: string } {
      const exists = this.users.some(u => u.email === email);
      if (exists) return { ok: false, message: 'Email already registered' };
      const id = 'u' + Date.now();
      this.users.push({ id, name, email, password });
      this.persistUsers();
      this.currentUserId = id;
      localStorage.setItem(STORAGE_KEY_CURRENT, id);
      return { ok: true };
    },
    logout() {
      this.currentUserId = null;
      localStorage.removeItem(STORAGE_KEY_CURRENT);
    },
  },
});


