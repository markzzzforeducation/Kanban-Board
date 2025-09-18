import { defineStore } from 'pinia';
import { useNotificationsStore } from './notifications';
import { useAuthStore } from './auth';
import { apiGet, apiPost, apiDelete, apiPut } from '../lib/api';

export interface Task {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  assigneeIds: string[];
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface Board {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[]; // includes owner implicitly for permissions checks
  columns: Column[];
  tasks: Record<string, Task>;
}

interface BoardsState {
  boards: Board[];
  _timer?: number | null;
  _focusBound?: boolean;
}

const STORAGE_KEY_BOARDS = 'kb-boards';

function loadBoards(): Board[] {
  const raw = localStorage.getItem(STORAGE_KEY_BOARDS);
  if (raw) return JSON.parse(raw);
  return [];
}

export const useBoardsStore = defineStore('boards', {
  state: (): BoardsState => ({ boards: loadBoards(), _timer: null, _focusBound: false }),
  getters: {
    getBoardById: (state) => (id: string) => state.boards.find(b => b.id === id) ?? null,
    boardsForUser: (state) => (userId: string) => state.boards.filter(b => b.ownerId === userId || b.memberIds.includes(userId)),
  },
  actions: {
    async fetchBoards() {
      try {
        const backendBoards = await apiGet<any[]>(`/api/boards`);
        // Replace local list with backend as source of truth
        this.boards = backendBoards.map((bb) => {
          const memberIds: string[] = Array.isArray(bb.members) ? bb.members.map((m: any) => m.id) : [];
          const existing = this.boards.find(b => b.id === bb.id);
          const backendColumns: any[] | undefined = (bb as any).columns;
          // Build tasks map from backend columns[].tasks if provided
          let tasksMap: Record<string, Task> = {};
          const normalizedColumns = Array.isArray(backendColumns)
            ? backendColumns.map((c: any) => {
              const tasksArray: any[] = Array.isArray(c.tasks) ? c.tasks : [];
              const taskIds: string[] = [];
              tasksArray.forEach((t: any) => {
                if (!t || !t.id) return;
                taskIds.push(t.id);
                const assignees = Array.isArray(t.assignees)
                  ? t.assignees.map((a: any) => (typeof a === 'string' ? a : a?.id)).filter(Boolean)
                  : [];
                tasksMap[t.id] = {
                  id: t.id,
                  title: t.title ?? '',
                  description: t.description ?? '',
                  tags: Array.isArray(t.tags) ? t.tags : [],
                  assigneeIds: assignees,
                };
              });
              return {
                id: c.id,
                title: c.title,
                taskIds,
              } as Column;
            })
            : (existing?.columns || []);
          // If backend also provides a board-level tasks object, merge it but prefer column-derived tasks
          const backendTasks: any = (bb as any).tasks;
          if (backendTasks && typeof backendTasks === 'object') {
            Object.keys(backendTasks).forEach((tid) => {
              const t = backendTasks[tid];
              if (t && !tasksMap[tid]) {
                tasksMap[tid] = {
                  id: t.id ?? tid,
                  title: t.title ?? '',
                  description: t.description ?? '',
                  tags: Array.isArray(t.tags) ? t.tags : [],
                  assigneeIds: Array.isArray(t.assignees) ? t.assignees.map((a: any) => (typeof a === 'string' ? a : a?.id)).filter(Boolean) : [],
                };
              }
            });
          }
          const normalizedTasks = Object.keys(tasksMap).length ? tasksMap : (existing?.tasks || {});
          const merged: Board = {
            id: bb.id,
            name: bb.name,
            ownerId: bb.ownerId,
            memberIds,
            // Preserve or normalize columns/tasks
            columns: normalizedColumns,
            tasks: normalizedTasks,
          };
          return merged;
        });
        this.persist();
      } catch {
        // ignore if backend not available
      }
    },
    startAutoRefresh(intervalMs: number = 20000) {
      if (this._timer) return;
      this.fetchBoards();
      this._timer = (setInterval(() => this.fetchBoards(), intervalMs) as unknown as number);
      if (!this._focusBound) {
        const onFocus = () => this.fetchBoards();
        const onVis = () => { if (document.visibilityState === 'visible') this.fetchBoards(); };
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVis);
        this._focusBound = true;
      }
    },
    stopAutoRefresh() {
      if (this._timer) {
        clearInterval(this._timer as unknown as number);
        this._timer = null;
      }
    },
    notifyBoardMembers(board: Board, message: string, excludeUserId?: string) {
      const noti = useNotificationsStore();
      const recipients = [board.ownerId, ...board.memberIds];
      recipients.forEach(uid => {
        if (uid && uid !== excludeUserId) noti.push(uid, message);
      });
    },
    persist() {
      localStorage.setItem(STORAGE_KEY_BOARDS, JSON.stringify(this.boards));
    },
    async createBoard(name: string, ownerId: string): Promise<string> {
      // Try backend first
      try {
        const created = await apiPost<any>(`/api/boards`, { name });
        const id: string = created.id;
        const board: Board = {
          id,
          name: created.name ?? name,
          ownerId: created.ownerId ?? ownerId,
          memberIds: [],
          columns: [],
          tasks: {},
        };
        this.boards.push(board);
        this.persist();
        return id;
      } catch {
        // Fallback local-only if backend not available
        const id = 'b' + Date.now();
        const board: Board = {
          id,
          name,
          ownerId,
          memberIds: [],
          columns: [
            { id: 'c' + Date.now() + '-todo', title: 'To Do', taskIds: [] },
            { id: 'c' + Date.now() + '-doing', title: 'Doing', taskIds: [] },
            { id: 'c' + Date.now() + '-done', title: 'Done', taskIds: [] },
          ],
          tasks: {},
        };
        this.boards.push(board);
        this.persist();
        return id;
      }
    },
    async renameBoard(boardId: string, name: string) {
      const b = this.boards.find(bd => bd.id === boardId);
      if (!b) return;
      const old = b.name;
      try {
        await apiPut(`/api/boards/${boardId}`, { name });
        // Optionally refetch to keep in sync in case backend returns extra fields
        await this.fetchBoards();
      } catch {
        // Fallback: update locally if backend not available
        b.name = name;
        this.persist();
      }
      // Ensure local state reflects the new name even after fetch
      const local = this.boards.find(x => x.id === boardId);
      if (local) {
        local.name = name;
        this.persist();
        const auth = useAuthStore();
        const actor = auth.currentUserId || undefined;
        this.notifyBoardMembers(local, `Board "${old}" was renamed to "${name}"`, actor);
      }
    },
    async deleteBoard(boardId: string) {
      try {
        await apiDelete(`/api/boards/${boardId}`);
        // Ensure sync from backend after delete
        await this.fetchBoards();
      } catch {
        // Fallback local delete if backend not available
        this.boards = this.boards.filter(b => b.id !== boardId);
        this.persist();
      }
    },
    async inviteMember(boardId: string, userId: string) {
      const b = this.boards.find(bd => bd.id === boardId);
      if (!b) return;
      try {
        await apiPost(`/api/boards/${boardId}/invite`, { userId });
        const noti = useNotificationsStore();
        await noti.fetch();
        await this.fetchBoards();
      } catch {
        // Fallback local update if backend not available
        if (!b.memberIds.includes(userId) && b.ownerId !== userId) {
          b.memberIds.push(userId);
          this.persist();
          try {
            const noti = useNotificationsStore();
            noti.push(userId, `You have been invited to join board "${b.name}"`);
          } catch { }
        }
      }
    },
    async inviteMemberByEmail(boardId: string, email: string) {
      const b = this.boards.find(bd => bd.id === boardId);
      if (!b) return;
      try {
        await apiPost(`/api/boards/${boardId}/invite`, { email });
        const noti = useNotificationsStore();
        await noti.fetch();
        await this.fetchBoards();
      } catch {
        // If backend not available, do nothing since we can't map email -> user
      }
    },
    async addColumn(boardId: string, title: string) {
      const b = this.getBoardById(boardId);
      if (!b) return;
      const order = Array.isArray(b.columns) ? b.columns.length : 0;
      try {
        await apiPost(`/api/boards/${boardId}/columns`, { title, order });
        await this.fetchBoards();
      } catch {
        try {
          // Alternative backend route compatibility
          await apiPost(`/api/columns`, { boardId, title, order });
          await this.fetchBoards();
        } catch {
          // Fallback local-only if backend not available
          b.columns.push({ id: 'c' + Date.now(), title, taskIds: [] });
          this.persist();
        }
      }
      const auth = useAuthStore();
      const actor = auth.currentUserId || undefined;
      // Use latest board reference after possible refetch
      const latest = this.getBoardById(boardId) || b;
      this.notifyBoardMembers(latest, `New column "${title}" added to board "${latest.name}"`, actor);
    },
    async renameColumn(boardId: string, columnId: string, title: string) {
      const b = this.getBoardById(boardId);
      if (!b) return;
      try {
        // Primary endpoint per new spec
        await apiPut(`/api/boards/columns/${columnId}`, { title });
        await this.fetchBoards();
      } catch {
        try {
          // Backward compatibility endpoints
          await apiPut(`/api/boards/${boardId}/columns/${columnId}`, { title });
          await this.fetchBoards();
        } catch {
          try {
            await apiPut(`/api/columns/${columnId}`, { title });
            await this.fetchBoards();
          } catch {
            const c = b.columns.find(c => c.id === columnId);
            if (c) { c.title = title; this.persist(); }
          }
        }
      }
    },
    async deleteColumn(boardId: string, columnId: string) {
      const b = this.getBoardById(boardId);
      if (!b) return;
      try {
        // Primary endpoint per new spec
        await apiDelete(`/api/boards/columns/${columnId}`);
        await this.fetchBoards();
      } catch {
        try {
          // Backward compatibility endpoints
          await apiDelete(`/api/boards/${boardId}/columns/${columnId}`);
          await this.fetchBoards();
        } catch {
          try {
            await apiDelete(`/api/columns/${columnId}`);
          } catch { }
          await this.fetchBoards();
          const col = b.columns.find(c => c.id === columnId);
          if (!col) return;
          col.taskIds.forEach(tid => { delete b.tasks[tid]; });
          b.columns = b.columns.filter(c => c.id !== columnId);
          this.persist();
        }
      }
    },
    async createTask(boardId: string, columnId: string, title: string) {
      const b = this.getBoardById(boardId);
      if (!b) return;
      try {
        await apiPost(`/api/boards/${boardId}/tasks`, { title, columnId });
        await this.fetchBoards();
      } catch {
        // Local fallback
        const id = 't' + Date.now();
        b.tasks[id] = { id, title, description: '', tags: [], assigneeIds: [] };
        const col = b.columns.find(c => c.id === columnId);
        if (col) col.taskIds.push(id);
        this.persist();
      }
      const auth = useAuthStore();
      const actor = auth.currentUserId || undefined;
      const latest = this.getBoardById(boardId) || b;
      const colLatest = latest.columns.find(c => c.id === columnId);
      this.notifyBoardMembers(latest, `Task "${title}" created in "${colLatest?.title || 'column'}"`, actor);
    },
    async renameTask(boardId: string, taskId: string, title: string) {
      const b = this.getBoardById(boardId);
      if (!b) return;
      try {
        await apiPut(`/api/boards/tasks/${taskId}`, { title });
        await this.fetchBoards();
      } catch {
        if (b.tasks[taskId]) { b.tasks[taskId].title = title; this.persist(); }
      }
    },
    async deleteTask(boardId: string, taskId: string) {
      const b = this.getBoardById(boardId);
      if (!b) return;
      try {
        await apiDelete(`/api/boards/tasks/${taskId}`);
        await this.fetchBoards();
      } catch {
        b.columns.forEach(c => { c.taskIds = c.taskIds.filter(id => id !== taskId); });
        delete b.tasks[taskId];
        this.persist();
      }
    },
    async moveTask(boardId: string, fromColumnId: string, toColumnId: string, taskId: string, toIndex?: number) {
      const b = this.getBoardById(boardId);
      if (!b) return;
      try {
        await apiPut(`/api/boards/${boardId}/tasks/reorder`, {
          fromColumnId,
          toColumnId,
          taskId,
          toIndex: typeof toIndex === 'number' ? toIndex : (this.getBoardById(boardId)?.columns.find(c => c.id === toColumnId)?.taskIds.length || 0)
        });
        await this.fetchBoards();
      } catch {
        const from = b.columns.find(c => c.id === fromColumnId);
        const to = b.columns.find(c => c.id === toColumnId);
        if (!from || !to) return;
        from.taskIds = from.taskIds.filter(id => id !== taskId);
        if (toIndex === undefined || toIndex < 0 || toIndex > to.taskIds.length) {
          to.taskIds.push(taskId);
        } else {
          to.taskIds.splice(toIndex, 0, taskId);
        }
        this.persist();
      }
      const task = this.getBoardById(boardId)?.tasks[taskId];
      const auth = useAuthStore();
      const actor = auth.currentUserId || undefined;
      const toCol = this.getBoardById(boardId)?.columns.find(c => c.id === toColumnId);
      const latestBoard = this.getBoardById(boardId);
      if (task && latestBoard && toCol) this.notifyBoardMembers(latestBoard, `Task "${task.title}" moved to "${toCol.title}"`, actor);
    },
    async reorderColumns(boardId: string, newOrder: string[]) {
      const b = this.getBoardById(boardId);
      if (!b) return;
      try {
        // If backend supports columns reorder, call it; adjust body if API differs
        await apiPut(`/api/boards/${boardId}/columns/reorder`, { order: newOrder });
        await this.fetchBoards();
      } catch {
        // Local fallback: reorder in-place
        const currentById: Record<string, Column> = Object.fromEntries(b.columns.map(c => [c.id, c]));
        const reordered: Column[] = [];
        newOrder.forEach((id) => { const col = currentById[id]; if (col) reordered.push(col); });
        // Append any missing columns (safety)
        b.columns.forEach(c => { if (!newOrder.includes(c.id)) reordered.push(c); });
        b.columns = reordered;
        this.persist();
      }
    },
    async setTaskTags(boardId: string, taskId: string, tags: string[]) {
      const b = this.getBoardById(boardId);
      if (!b || !b.tasks[taskId]) return;
      try {
        await apiPut(`/api/boards/tasks/${taskId}/tags`, { tags });
        await this.fetchBoards();
      } catch {
        b.tasks[taskId].tags = tags;
        this.persist();
      }
    },
    async setTaskAssignees(boardId: string, taskId: string, assigneeIds: string[]) {
      const b = this.getBoardById(boardId);
      if (!b || !b.tasks[taskId]) return;
      try {
        await apiPut(`/api/boards/tasks/${taskId}/assignees`, { assigneeIds });
        await this.fetchBoards();
      } catch {
        b.tasks[taskId].assigneeIds = assigneeIds;
        this.persist();
      }
    },
    async reorderTasksWithinColumn(boardId: string, columnId: string, newTaskIds: string[]) {
      const b = this.getBoardById(boardId);
      if (!b) return;
      try {
        const toIndex = 0; // Not used server-side for full array ordering
        // If backend expects a single move, this call may be no-op. We'll still try.
        await apiPut(`/api/boards/${boardId}/tasks/reorder`, {
          fromColumnId: columnId,
          toColumnId: columnId,
          taskId: newTaskIds[newTaskIds.length - 1] || '',
          toIndex,
        });
        await this.fetchBoards();
      } catch {
        const c = b.columns.find(c => c.id === columnId);
        if (c) { c.taskIds = newTaskIds; this.persist(); }
      }
    }
  },
});


