import { defineStore } from 'pinia';

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
}

const STORAGE_KEY_BOARDS = 'kb-boards';

function loadBoards(): Board[] {
  const raw = localStorage.getItem(STORAGE_KEY_BOARDS);
  if (raw) return JSON.parse(raw);
  return [];
}

export const useBoardsStore = defineStore('boards', {
  state: (): BoardsState => ({ boards: loadBoards() }),
  getters: {
    getBoardById: (state) => (id: string) => state.boards.find(b => b.id === id) ?? null,
    boardsForUser: (state) => (userId: string) => state.boards.filter(b => b.ownerId === userId || b.memberIds.includes(userId)),
  },
  actions: {
    persist() {
      localStorage.setItem(STORAGE_KEY_BOARDS, JSON.stringify(this.boards));
    },
    createBoard(name: string, ownerId: string): string {
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
    },
    renameBoard(boardId: string, name: string) {
      const b = this.boards.find(bd => bd.id === boardId);
      if (b) { b.name = name; this.persist(); }
    },
    deleteBoard(boardId: string) {
      this.boards = this.boards.filter(b => b.id !== boardId);
      this.persist();
    },
    inviteMember(boardId: string, userId: string) {
      const b = this.boards.find(bd => bd.id === boardId);
      if (!b) return;
      if (!b.memberIds.includes(userId) && b.ownerId !== userId) {
        b.memberIds.push(userId);
        this.persist();
      }
    },
    addColumn(boardId: string, title: string) {
      const b = this.getBoardById(boardId);
      if (!b) return;
      b.columns.push({ id: 'c' + Date.now(), title, taskIds: [] });
      this.persist();
    },
    renameColumn(boardId: string, columnId: string, title: string) {
      const b = this.getBoardById(boardId);
      if (!b) return;
      const c = b.columns.find(c => c.id === columnId);
      if (c) { c.title = title; this.persist(); }
    },
    reorderColumns(boardId: string, newOrder: string[]) {
      const board = this.boards.find(b => b.id === boardId);
      if (!board) return;
      board.columns = newOrder
        .map(id => board.columns.find(col => col.id === id))
        .filter(Boolean) as typeof board.columns;
    },
    deleteColumn(boardId: string, columnId: string) {
      const b = this.getBoardById(boardId);
      if (!b) return;
      const col = b.columns.find(c => c.id === columnId);
      if (!col) return;
      col.taskIds.forEach(tid => { delete b.tasks[tid]; });
      b.columns = b.columns.filter(c => c.id !== columnId);
      this.persist();
    },
    createTask(boardId: string, columnId: string, title: string) {
      const b = this.getBoardById(boardId);
      if (!b) return;
      const id = 't' + Date.now();
      b.tasks[id] = { id, title, description: '', tags: [], assigneeIds: [] };
      const col = b.columns.find(c => c.id === columnId);
      if (col) col.taskIds.push(id);
      this.persist();
    },
    renameTask(boardId: string, taskId: string, title: string) {
      const b = this.getBoardById(boardId);
      if (!b) return;
      if (b.tasks[taskId]) { b.tasks[taskId].title = title; this.persist(); }
    },
    deleteTask(boardId: string, taskId: string) {
      const b = this.getBoardById(boardId);
      if (!b) return;
      b.columns.forEach(c => { c.taskIds = c.taskIds.filter(id => id !== taskId); });
      delete b.tasks[taskId];
      this.persist();
    },
    moveTask(boardId: string, fromColumnId: string, toColumnId: string, taskId: string, toIndex?: number) {
      const b = this.getBoardById(boardId);
      if (!b) return;
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
    },
    setTaskTags(boardId: string, taskId: string, tags: string[]) {
      const b = this.getBoardById(boardId);
      if (!b || !b.tasks[taskId]) return;
      b.tasks[taskId].tags = tags;
      this.persist();
    },
    setTaskAssignees(boardId: string, taskId: string, assigneeIds: string[]) {
      const b = this.getBoardById(boardId);
      if (!b || !b.tasks[taskId]) return;
      b.tasks[taskId].assigneeIds = assigneeIds;
      this.persist();
    },
    reorderTasksWithinColumn(boardId: string, columnId: string, newTaskIds: string[]) {
      const b = this.getBoardById(boardId);
      if (!b) return;
      const c = b.columns.find(c => c.id === columnId);
      if (c) { c.taskIds = newTaskIds; this.persist(); }
    }
  },

});


