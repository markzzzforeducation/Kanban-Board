<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import draggable from 'vuedraggable';
import { useBoardsStore } from '../stores/boards';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';

const route = useRoute();
const router = useRouter();
const boards = useBoardsStore();
const auth = useAuthStore();
const noti = useNotificationsStore();

const boardId = computed(() => String(route.params.id));
const board = computed(() => boards.getBoardById(boardId.value));

const newColumnTitle = ref('');
const newTaskTitleByColumn = ref<Record<string, string>>({});
const renamingColumnId = ref<string | null>(null);
const renamingTaskId = ref<string | null>(null);
const renameText = ref('');

function addColumn() {
    if (!board.value || !newColumnTitle.value) return;
    boards.addColumn(board.value.id, newColumnTitle.value);
    newColumnTitle.value = '';
}

function deleteColumn(columnId: string) {
    if (!board.value) return;
    if (confirm('Are you sure you want to delete this column and all its tasks?')) {
        boards.deleteColumn(board.value.id, columnId);
    }
}

function addTask(columnId: string) {
    if (!board.value) return;
    const text = newTaskTitleByColumn.value[columnId];
    if (!text) return;
    boards.createTask(board.value.id, columnId, text);
    newTaskTitleByColumn.value[columnId] = '';
}

function deleteTask(taskId: string) {
    if (!board.value) return;
    if (confirm('Are you sure you want to delete this task?')) {
        boards.deleteTask(board.value.id, taskId);
    }
}

function startRenameColumn(columnId: string, current: string) {
    renamingTaskId.value = null;
    renamingColumnId.value = columnId;
    renameText.value = current;
}

function confirmRenameColumn(columnId: string) {
    if (!board.value) return;
    boards.renameColumn(board.value.id, columnId, renameText.value);
    renamingColumnId.value = null;
}

function startRenameTask(taskId: string, current: string) {
    renamingColumnId.value = null;
    renamingTaskId.value = taskId;
    renameText.value = current;
}

function confirmRenameTask(taskId: string) {
    if (!board.value) return;
    boards.renameTask(board.value.id, taskId, renameText.value);
    renamingTaskId.value = null;
}

function cancelRename() {
    renamingColumnId.value = null;
    renamingTaskId.value = null;
    renameText.value = '';
}

function onTaskDrop(evt: any, toColumnId: string) {
    if (!board.value) return;
    const taskId: string = evt.item?.dataset?.id;
    const fromColumnId: string | undefined = evt.from?.dataset?.columnId;
    const newOrder: string[] = Array.from(evt.to.querySelectorAll('[data-task-id]')).map((el: any) => el.getAttribute('data-task-id'));
    if (!taskId || !fromColumnId) return;
    if (fromColumnId === toColumnId) {
        boards.reorderTasksWithinColumn(board.value.id, toColumnId, newOrder);
    } else {
        const toIndex = evt.newIndex as number | undefined;
        boards.moveTask(board.value.id, fromColumnId, toColumnId, taskId, toIndex);
    }
}

function onColumnDrop(evt: any) {
    if (!board.value) return;
    const newOrder: string[] = Array.from(evt.to.querySelectorAll('[data-column-id]')).map((el: any) => el.getAttribute('data-column-id'));
    boards.reorderColumns(board.value.id, newOrder);
}

function assignToMe(taskId: string) {
    if (!board.value || !auth.currentUserId) return;
    const task = board.value.tasks[taskId];
    if (!task) return;
    const ids = new Set(task.assigneeIds);
    ids.add(auth.currentUserId);
    boards.setTaskAssignees(board.value.id, taskId, Array.from(ids));
    noti.push(auth.currentUserId, `You were assigned to task "${task.title}" in ${board.value!.name}`);
}

function updateTags(taskId: string, tagsText: string) {
    if (!board.value) return;
    const tags = tagsText.split(',').map(t => t.trim()).filter(Boolean);
    boards.setTaskTags(board.value.id, taskId, tags);
}

function logout() {
    auth.logout();
    router.push('/auth');
}
</script>

<template>
    <div class="board-page" v-if="board">
        <div class="page-container">
            <!-- Header Section -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-left">
                        <button class="back-button" @click="router.push('/')">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            Back to Boards
                        </button>
                        <div class="board-info">
                            <div class="board-avatar">
                                <span class="board-initial">{{ board.name.slice(0, 1).toUpperCase() }}</span>
                            </div>
                            <div class="board-details">
                                <h1 class="board-title">{{ board.name }}</h1>
                                <div class="board-meta">
                                    <div class="column-count">
                                        <svg class="meta-icon" viewBox="0 0 24 24" fill="none">
                                            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor"
                                                stroke-width="2" />
                                            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor"
                                                stroke-width="2" />
                                            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor"
                                                stroke-width="2" />
                                            <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor"
                                                stroke-width="2" />
                                        </svg>
                                        {{ board.columns.length }} {{ board.columns.length === 1 ? 'column' : 'columns'
                                        }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="header-right" v-if="auth.currentUser">
                        <div class="user-badge">
                            <div class="user-avatar">
                                <span>{{ auth.currentUser.name.slice(0, 1).toUpperCase() }}</span>
                            </div>
                            <span class="user-name">{{ auth.currentUser.name }}</span>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none">
                            <path
                                d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Add Column Section -->
            <div class="add-column-section">
                <div class="add-column-card">
                    <div class="add-column-header">
                        <div class="add-column-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>
                        <div class="add-column-text">
                            <h3 class="add-column-title">Add New Column</h3>
                            <p class="add-column-subtitle">Organize your workflow</p>
                        </div>
                    </div>
                    <div class="add-column-form">
                        <div class="input-group">
                            <input v-model="newColumnTitle" placeholder="Enter column name" class="column-name-input"
                                @keyup.enter="addColumn" />
                            <button @click="addColumn" :disabled="!newColumnTitle.trim()" class="add-column-button">
                                <svg class="button-icon" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2"
                                        stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                Add Column
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Kanban Board -->
            <div class="kanban-section">
                <div v-if="!board.columns.length" class="empty-state">
                    <div class="empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"
                                fill="none" />
                            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"
                                fill="none" />
                            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"
                                fill="none" />
                            <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"
                                fill="none" />
                        </svg>
                    </div>
                    <div class="empty-content">
                        <h3 class="empty-title">No columns yet</h3>
                        <p class="empty-description">Create your first column to start organizing your tasks</p>
                    </div>
                </div>

                <div v-else class="columns-wrapper">
                    <draggable :list="(board.columns || [])" group="columns" item-key="id" class="columns-container"
                        animation="200" @end="onColumnDrop" ghost-class="sortable-ghost-column"
                        drag-class="sortable-drag-column" handle=".column-drag-handle">
                        <template #item="{ element: column }">
                            <div class="column-card" :data-column-id="column.id">
                                <!-- Column Header -->
                                <div class="column-header">
                                    <div class="column-info">
                                        <div class="column-drag-handle" title="Drag to reorder columns">
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="9" cy="12" r="1" fill="currentColor" />
                                                <circle cx="9" cy="5" r="1" fill="currentColor" />
                                                <circle cx="9" cy="19" r="1" fill="currentColor" />
                                                <circle cx="15" cy="12" r="1" fill="currentColor" />
                                                <circle cx="15" cy="5" r="1" fill="currentColor" />
                                                <circle cx="15" cy="19" r="1" fill="currentColor" />
                                            </svg>
                                        </div>
                                        <div class="column-avatar">
                                            <span class="column-initial">{{ column.title.slice(0, 1).toUpperCase()
                                                }}</span>
                                        </div>
                                        <div class="column-details">
                                            <div v-if="renamingColumnId === column.id" class="rename-section">
                                                <input v-model="renameText" class="rename-input"
                                                    @keyup.enter="confirmRenameColumn(column.id)"
                                                    @keyup.escape="cancelRename"
                                                    @blur="confirmRenameColumn(column.id)" />
                                            </div>
                                            <div v-else class="column-title-section">
                                                <h3 class="column-title">{{ column.title }}</h3>
                                                <div class="column-meta">
                                                    <div class="task-count">
                                                        <svg class="meta-icon" viewBox="0 0 24 24" fill="none">
                                                            <path
                                                                d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                                                                stroke="currentColor" stroke-width="2"
                                                                stroke-linecap="round" stroke-linejoin="round" />
                                                        </svg>
                                                        {{ (column.taskIds || []).length }} {{ (column.taskIds ||
                                                            []).length === 1 ?
                                                            'task' : 'tasks' }}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="column-actions">
                                        <div class="action-buttons">
                                            <button class="action-button"
                                                @click="startRenameColumn(column.id, column.title)"
                                                title="Rename column">
                                                <svg viewBox="0 0 24 24" fill="none">
                                                    <path
                                                        d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H16C16.5304 20 17.0391 19.7893 17.4142 19.4142C17.7893 19.0391 18 18.5304 18 18V13M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89783 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
                                                        stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                                        stroke-linejoin="round" />
                                                </svg>
                                            </button>
                                            <button class="action-button danger" @click="deleteColumn(column.id)"
                                                title="Delete column">
                                                <svg viewBox="0 0 24 24" fill="none">
                                                    <path
                                                        d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                                                        stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                                        stroke-linejoin="round" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Tasks List -->
                                <div class="tasks-container">
                                    <draggable
                                        :list="(column.taskIds || []).map((id: string | number) => board!.tasks[id]).filter(Boolean)"
                                        group="tasks" item-key="id" class="task-list" animation="150"
                                        :data-column-id="column.id" @end="(evt: any) => onTaskDrop(evt, column.id)"
                                        ghost-class="sortable-ghost-task" drag-class="sortable-drag-task"
                                        :empty-insert-threshold="50">
                                        <template #item="{ element }">
                                            <div class="task-card" :data-task-id="element.id" :data-id="element.id">
                                                <div class="task-drag-handle" title="Drag to move task">
                                                    <svg viewBox="0 0 24 24" fill="none"
                                                        xmlns="http://www.w3.org/2000/svg">
                                                        <circle cx="9" cy="12" r="1" fill="currentColor" />
                                                        <circle cx="9" cy="5" r="1" fill="currentColor" />
                                                        <circle cx="9" cy="19" r="1" fill="currentColor" />
                                                        <circle cx="15" cy="12" r="1" fill="currentColor" />
                                                        <circle cx="15" cy="5" r="1" fill="currentColor" />
                                                        <circle cx="15" cy="19" r="1" fill="currentColor" />
                                                    </svg>
                                                </div>
                                                <div class="task-content">
                                                    <div class="task-header">
                                                        <div class="task-title-section">
                                                            <div v-if="renamingTaskId === element.id"
                                                                class="rename-section">
                                                                <input v-model="renameText" class="rename-input"
                                                                    @keyup.enter="confirmRenameTask(element.id)"
                                                                    @keyup.escape="cancelRename"
                                                                    @blur="confirmRenameTask(element.id)" />
                                                            </div>
                                                            <div v-else class="task-title">{{ element.title }}</div>
                                                        </div>
                                                        <div class="task-actions">
                                                            <button class="task-action-button"
                                                                @click="startRenameTask(element.id, element.title)"
                                                                title="Edit task">
                                                                <svg viewBox="0 0 24 24" fill="none">
                                                                    <path
                                                                        d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H16C16.5304 20 17.0391 19.7893 17.4142 19.4142C17.7893 19.0391 18 18.5304 18 18V13M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89783 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
                                                                        stroke="currentColor" stroke-width="2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round" />
                                                                </svg>
                                                            </button>
                                                            <button class="task-action-button danger"
                                                                @click="deleteTask(element.id)" title="Delete task">
                                                                <svg viewBox="0 0 24 24" fill="none">
                                                                    <path
                                                                        d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                                                                        stroke="currentColor" stroke-width="2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div class="task-tags"
                                                        v-if="element.tags.length || renamingTaskId !== element.id">
                                                        <input :value="element.tags.join(', ')"
                                                            @blur="(e: any) => updateTags(element.id, e.target.value)"
                                                            placeholder="Add tags (comma separated)"
                                                            class="tags-input" />
                                                    </div>

                                                    <div class="task-footer">
                                                        <div class="assignee-info">
                                                            <div class="assignee-count">
                                                                <svg class="meta-icon" viewBox="0 0 24 24" fill="none">
                                                                    <path
                                                                        d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
                                                                        stroke="currentColor" stroke-width="2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round" />
                                                                    <circle cx="9" cy="7" r="4" stroke="currentColor"
                                                                        stroke-width="2" />
                                                                </svg>
                                                                {{ element.assigneeIds.length }} assigned
                                                            </div>
                                                        </div>
                                                        <button class="assign-button" @click="assignToMe(element.id)">
                                                            <svg class="button-icon" viewBox="0 0 24 24" fill="none">
                                                                <path d="M12 5V19M5 12H19" stroke="currentColor"
                                                                    stroke-width="2" stroke-linecap="round"
                                                                    stroke-linejoin="round" />
                                                            </svg>
                                                            Assign to me
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </template>
                                    </draggable>
                                </div>

                                <!-- Add Task Section -->
                                <div class="add-task-section">
                                    <div class="add-task-form">
                                        <div class="task-input-group">
                                            <input v-model="newTaskTitleByColumn[column.id]"
                                                placeholder="Add new task..." class="task-input"
                                                @keyup.enter="addTask(column.id)" />
                                            <button @click="addTask(column.id)"
                                                :disabled="!newTaskTitleByColumn[column.id]?.trim()"
                                                class="add-task-button">
                                                <svg class="button-icon" viewBox="0 0 24 24" fill="none">
                                                    <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2"
                                                        stroke-linecap="round" stroke-linejoin="round" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </draggable>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Page Layout */
.board-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 24px 0;
}

.page-container {
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    flex-direction: column;
    gap: 32px;
}

/* Page Header */
.page-header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    border: 1px solid rgba(226, 232, 240, 0.5);
    padding: 32px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.header-content {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
}

.header-left {
    display: flex;
    align-items: flex-start;
    gap: 24px;
    flex: 1;
}

.back-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
    border: 1px solid rgba(102, 126, 234, 0.2);
    border-radius: 12px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
    font-size: 14px;
}

.back-button:hover {
    background: rgba(102, 126, 234, 0.15);
    color: #5a67d8;
    transform: translateX(-2px);
}

.back-button svg {
    width: 16px;
    height: 16px;
}

.board-info {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    flex: 1;
}

.board-avatar {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 24px;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.board-title {
    font-size: 32px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.board-meta {
    display: flex;
    align-items: center;
    gap: 16px;
}

.column-count {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #64748b;
}

.meta-icon {
    width: 16px;
    height: 16px;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(102, 126, 234, 0.05);
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid rgba(102, 126, 234, 0.1);
}

.user-avatar {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 14px;
}

.user-name {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
}

.logout-button {
    width: 40px;
    height: 40px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #ef4444;
}

.logout-button:hover {
    background: rgba(239, 68, 68, 0.15);
    transform: translateY(-1px);
}

.logout-button svg {
    width: 18px;
    height: 18px;
}

/* Add Column Section */
.add-column-section {
    display: flex;
    justify-content: center;
}

.add-column-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    border: 1px solid rgba(226, 232, 240, 0.5);
    padding: 24px 32px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    width: 100%;
    max-width: 600px;
}

.add-column-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
}

.add-column-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #48bb78, #38a169);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.add-column-icon svg {
    width: 24px;
    height: 24px;
}

.add-column-text {
    flex: 1;
}

.add-column-title {
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px 0;
}

.add-column-subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
}

.add-column-form {
    margin-top: 20px;
}

.input-group {
    display: flex;
    gap: 12px;
    align-items: stretch;
}

.column-name-input {
    flex: 1;
    padding: 14px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 16px;
    transition: all 0.2s ease;
    background: white;
}

.column-name-input:focus {
    outline: none;
    border-color: #48bb78;
    box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.1);
}

.add-column-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 24px;
    background: linear-gradient(135deg, #48bb78, #38a169);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.add-column-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(72, 187, 120, 0.3);
}

.add-column-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.button-icon {
    width: 18px;
    height: 18px;
}

/* Kanban Section */
.kanban-section {
    flex: 1;
}

/* Empty State */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 40px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    border: 1px solid rgba(226, 232, 240, 0.5);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    text-align: center;
}

.empty-icon {
    width: 80px;
    height: 80px;
    color: #94a3b8;
    margin-bottom: 24px;
}

.empty-content {
    max-width: 400px;
}

.empty-title {
    font-size: 24px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 8px 0;
}

.empty-description {
    font-size: 16px;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
}

/* Columns Wrapper */
.columns-wrapper {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 20px;
    min-height: 600px;
}

.columns-container {
    display: flex;
    gap: 24px;
    min-height: 600px;
    width: fit-content;
}

.columns-wrapper::-webkit-scrollbar {
    height: 8px;
}

.columns-wrapper::-webkit-scrollbar-track {
    background: rgba(226, 232, 240, 0.3);
    border-radius: 4px;
}

.columns-wrapper::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.3);
    border-radius: 4px;
}

.columns-wrapper::-webkit-scrollbar-thumb:hover {
    background: rgba(102, 126, 234, 0.5);
}

/* Column Card */
.column-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    border: 1px solid rgba(226, 232, 240, 0.5);
    padding: 24px;
    min-width: 350px;
    max-width: 350px;
    height: fit-content;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
}

.column-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

/* Column Header */
.column-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 2px solid #f1f5f9;
}

/* Column Info */
.column-info {
    flex: 1;
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.column-drag-handle {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    cursor: grab;
    border-radius: 4px;
    transition: all 0.2s ease;
    flex-shrink: 0;
    margin-top: 8px;
}

.column-drag-handle:hover {
    color: #48bb78;
    background: rgba(72, 187, 120, 0.1);
}

.column-drag-handle:active {
    cursor: grabbing;
}

.column-drag-handle svg {
    width: 16px;
    height: 16px;
}

.column-avatar {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #48bb78, #38a169);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 16px;
    box-shadow: 0 3px 10px rgba(72, 187, 120, 0.2);
    flex-shrink: 0;
}

.column-details {
    flex: 1;
    min-width: 0;
}

.column-title-section {
    margin-bottom: 6px;
}

.column-title {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 6px 0;
    line-height: 1.2;
}

.column-meta {
    display: flex;
    align-items: center;
    gap: 12px;
}

.task-count {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #64748b;
}

/* Rename Section */
.rename-section {
    margin-bottom: 6px;
}

.rename-input {
    width: 100%;
    padding: 8px 12px;
    border: 2px solid #48bb78;
    border-radius: 8px;
    font-size: inherit;
    font-weight: inherit;
    color: #1e293b;
    background: white;
}

.rename-input:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.1);
}

/* Column Actions */
.column-actions {
    flex-shrink: 0;
}

.action-buttons {
    display: flex;
    align-items: center;
    gap: 6px;
}

.action-button {
    width: 32px;
    height: 32px;
    background: rgba(248, 250, 252, 0.8);
    border: 1px solid rgba(226, 232, 240, 0.5);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #64748b;
}

.action-button:hover {
    background: rgba(72, 187, 120, 0.1);
    color: #48bb78;
    border-color: rgba(72, 187, 120, 0.2);
    transform: translateY(-1px);
}

.action-button.danger:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.2);
}

.action-button svg {
    width: 14px;
    height: 14px;
}

/* Tasks Container */
.tasks-container {
    flex: 1;
    margin-bottom: 20px;
}

.task-list {
    min-height: 120px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-radius: 8px;
    padding: 8px;
    transition: all 0.2s ease;
}

.task-list:empty {
    background: rgba(248, 250, 252, 0.5);
    border: 2px dashed #e2e8f0;
}

.task-list.sortable-chosen {
    background: rgba(72, 187, 120, 0.05);
    border: 2px dashed #48bb78;
}

/* Task Card */
.task-card {
    background: white;
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: flex-start;
    gap: 12px;
    position: relative;
}

.task-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border-color: #48bb78;
}

.task-drag-handle {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    cursor: grab;
    border-radius: 4px;
    transition: all 0.2s ease;
    flex-shrink: 0;
    margin-top: 2px;
}

.task-drag-handle:hover {
    color: #48bb78;
    background: rgba(72, 187, 120, 0.1);
}

.task-drag-handle:active {
    cursor: grabbing;
}

.task-drag-handle svg {
    width: 14px;
    height: 14px;
}

.task-content {
    flex: 1;
    min-width: 0;
}

/* Task Header */
.task-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}

.task-title-section {
    flex: 1;
    margin-right: 8px;
}

.task-title {
    font-weight: 600;
    color: #2d3748;
    line-height: 1.4;
    margin: 0;
}

.task-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
}

.task-card:hover .task-actions {
    opacity: 1;
}

.task-action-button {
    width: 24px;
    height: 24px;
    background: rgba(248, 250, 252, 0.8);
    border: 1px solid rgba(226, 232, 240, 0.5);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #64748b;
}

.task-action-button:hover {
    background: rgba(72, 187, 120, 0.1);
    color: #48bb78;
    border-color: rgba(72, 187, 120, 0.2);
}

.task-action-button.danger:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.2);
}

.task-action-button svg {
    width: 12px;
    height: 12px;
}

/* Task Tags */
.task-tags {
    margin-bottom: 12px;
}

.tags-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 12px;
    transition: all 0.2s;
    background: rgba(248, 250, 252, 0.5);
}

.tags-input:focus {
    outline: none;
    border-color: #48bb78;
    box-shadow: 0 0 0 2px rgba(72, 187, 120, 0.1);
    background: white;
}

/* Task Footer */
.task-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
}

.assignee-info {
    display: flex;
    align-items: center;
    gap: 6px;
}

.assignee-count {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(102, 126, 234, 0.05);
    color: #667eea;
    padding: 4px 8px;
    border-radius: 12px;
    font-weight: 500;
}

.assign-button {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    color: #48bb78;
    cursor: pointer;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s ease;
    font-weight: 500;
}

.assign-button:hover {
    background: rgba(72, 187, 120, 0.1);
    color: #38a169;
}

.assign-button .button-icon {
    width: 12px;
    height: 12px;
}

/* Add Task Section */
.add-task-section {
    border-top: 1px solid #f1f5f9;
    padding-top: 16px;
}

.add-task-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.task-input-group {
    display: flex;
    gap: 8px;
    align-items: center;
}

.task-input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s;
    background: white;
}

.task-input:focus {
    outline: none;
    border-color: #48bb78;
    box-shadow: 0 0 0 2px rgba(72, 187, 120, 0.1);
}

.add-task-button {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #48bb78, #38a169);
    color: white;
    border: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.add-task-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.add-task-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.add-task-button .button-icon {
    width: 16px;
    height: 16px;
}

/* Drag and Drop Styles */
.sortable-ghost-task {
    opacity: 0.5;
    transform: rotate(3deg);
    background: rgba(72, 187, 120, 0.1) !important;
    border: 2px dashed #48bb78 !important;
}

.sortable-drag-task {
    transform: rotate(-3deg);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
    z-index: 1000;
    cursor: grabbing !important;
}

.sortable-ghost-column {
    opacity: 0.6;
    background: rgba(72, 187, 120, 0.1) !important;
    border: 2px dashed #48bb78 !important;
    transform: scale(0.98);
}

.sortable-drag-column {
    transform: rotate(-1deg) scale(1.02);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2) !important;
    z-index: 1000;
}

/* Responsive Design */
@media (max-width: 1024px) {
    .columns-container {
        gap: 16px;
    }

    .column-card {
        min-width: 320px;
        max-width: 320px;
    }
}

@media (max-width: 768px) {
    .page-container {
        padding: 0 16px;
        gap: 24px;
    }

    .page-header {
        padding: 24px 20px;
    }

    .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 20px;
    }

    .header-left {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
        width: 100%;
    }

    .board-info {
        width: 100%;
    }

    .board-title {
        font-size: 28px;
    }

    .board-avatar {
        width: 48px;
        height: 48px;
        font-size: 20px;
    }

    .add-column-card {
        padding: 20px 24px;
    }

    .add-column-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        text-align: left;
    }

    .add-column-icon {
        width: 40px;
        height: 40px;
    }

    .add-column-icon svg {
        width: 20px;
        height: 20px;
    }

    .input-group {
        flex-direction: column;
        gap: 12px;
    }

    .columns-wrapper {
        overflow-x: visible;
    }

    .columns-container {
        flex-direction: column;
        width: 100%;
    }

    .column-card {
        min-width: 100%;
        max-width: 100%;
    }

    .column-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
    }

    .column-info {
        width: 100%;
    }

    .action-buttons {
        align-self: flex-end;
    }

    .task-card {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
    }

    .task-drag-handle {
        align-self: flex-end;
        margin-top: 0;
    }

    .task-content {
        width: 100%;
    }

    .task-header {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
    }

    .task-actions {
        opacity: 1;
        align-self: flex-end;
    }

    .empty-state {
        padding: 60px 24px;
    }

    .empty-icon {
        width: 64px;
        height: 64px;
    }

    .empty-title {
        font-size: 20px;
    }

    /* Mobile drag handles */
    .column-drag-handle,
    .task-drag-handle {
        opacity: 1;
        background: rgba(72, 187, 120, 0.1);
        color: #48bb78;
    }
}

@media (max-width: 480px) {
    .board-title {
        font-size: 24px;
    }

    .add-column-header {
        text-align: center;
        align-items: center;
    }

    .column-avatar {
        width: 36px;
        height: 36px;
        font-size: 14px;
    }

    .board-avatar {
        width: 40px;
        height: 40px;
        font-size: 18px;
    }

    .action-button {
        width: 28px;
        height: 28px;
    }

    .action-button svg {
        width: 12px;
        height: 12px;
    }

    .task-input-group {
        flex-direction: column;
    }

    .add-task-button {
        width: 100%;
        height: 40px;
        justify-content: center;
    }
}

/* Focus States */
.back-button:focus-visible,
.add-column-button:focus-visible,
.action-button:focus-visible,
.task-action-button:focus-visible,
.assign-button:focus-visible,
.add-task-button:focus-visible,
.logout-button:focus-visible {
    outline: 2px solid #48bb78;
    outline-offset: 2px;
}

.column-name-input:focus-visible,
.task-input:focus-visible,
.tags-input:focus-visible,
.rename-input:focus-visible {
    outline: 2px solid #48bb78;
    outline-offset: 2px;
}

/* Loading States */
.add-column-button:active,
.add-task-button:active {
    transform: translateY(0);
}

/* Animation for cards */
.column-card,
.task-card {
    animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Hover effects */
.board-info:hover .board-title {
    color: #5a67d8;
}

.board-info:hover .board-avatar {
    transform: scale(1.05);
}

.column-info:hover .column-title {
    color: #48bb78;
}

.column-info:hover .column-avatar {
    transform: scale(1.05);
}

/* Smooth transitions */
* {
    transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
</style>
