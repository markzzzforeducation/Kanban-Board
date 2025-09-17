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
</script>

<template>
    <div class="board-container" v-if="board">
        <!-- Header -->
        <div class="header">
            <div class="header-left">
                <button class="back-btn" @click="router.push('/')">
                    ← Back
                </button>
                <h1 class="board-title">{{ board.name }}</h1>
            </div>
            <div class="user-info" v-if="auth.currentUser">
                Signed in as {{ auth.currentUser.name }}
            </div>
        </div>

        <!-- Add Column Section -->
        <div class="add-column-section">
            <input v-model="newColumnTitle" type="text" class="add-column-input" placeholder="Enter new column name..."
                @keyup.enter="addColumn" />
            <button @click="addColumn" class="add-column-btn">
                + Add Column
            </button>
        </div>

        <!-- Columns -->
        <div class="columns-wrapper">
            <div v-for="column in board.columns" :key="column.id" class="column">
                <div class="column-header">
                    <div class="column-title-section">
                        <template v-if="renamingColumnId === column.id">
                            <input v-model="renameText" class="rename-input"
                                @keyup.enter="confirmRenameColumn(column.id)" @blur="confirmRenameColumn(column.id)"
                                ref="renameInput" />
                        </template>
                        <template v-else>
                            <h2 class="column-title">{{ column.title }}</h2>
                        </template>
                    </div>
                    <div class="column-actions">
                        <button class="rename-btn" @click="startRenameColumn(column.id, column.title)"
                            v-if="renamingColumnId !== column.id">
                            Rename
                        </button>
                        <button @click="deleteColumn(column.id)" class="delete-column-btn">×</button>
                    </div>
                </div>

                <draggable :list="column.taskIds.map(id => board!.tasks[id]).filter(Boolean)" group="tasks"
                    item-key="id" class="task-list" animation="150" :data-column-id="column.id"
                    @end="(evt: any) => onTaskDrop(evt, column.id)" ghostClass="sortable-ghost"
                    dragClass="sortable-drag">
                    <template #item="{ element }">
                        <div class="task-card" :data-task-id="element.id" :data-id="element.id">
                            <div class="task-header">
                                <div class="task-title-section">
                                    <template v-if="renamingTaskId === element.id">
                                        <input v-model="renameText" class="rename-input"
                                            @keyup.enter="confirmRenameTask(element.id)"
                                            @blur="confirmRenameTask(element.id)" />
                                    </template>
                                    <template v-else>
                                        <div class="task-title">{{ element.title }}</div>
                                    </template>
                                </div>
                                <div class="task-actions">
                                    <button class="task-rename-btn" @click="startRenameTask(element.id, element.title)"
                                        v-if="renamingTaskId !== element.id">
                                        Edit
                                    </button>
                                    <button @click="deleteTask(element.id)" class="task-delete-btn">×</button>
                                </div>
                            </div>

                            <div class="task-tags">
                                <input :value="element.tags.join(', ')"
                                    @blur="(e: any) => updateTags(element.id, e.target.value)"
                                    placeholder="Add tags (comma separated)" class="tags-input" />
                            </div>

                            <div class="task-footer">
                                <div class="assignee-info">
                                    <span class="assignee-count">
                                        {{ element.assigneeIds.length }} assignees
                                    </span>
                                </div>
                                <button class="assign-btn" @click="assignToMe(element.id)">
                                    Assign to me
                                </button>
                            </div>
                        </div>
                    </template>
                </draggable>

                <div class="add-task-section">
                    <input v-model="newTaskTitleByColumn[column.id]" type="text" class="add-task-input"
                        placeholder="Add new task..." @keyup.enter="addTask(column.id)" />
                    <button @click="addTask(column.id)" class="add-task-btn">
                        Add
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.board-container {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 20px;
    color: #1a202c;
}

/* Header */
.header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    padding: 20px 24px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.back-btn {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: transform 0.2s, box-shadow 0.2s;
}

.back-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.board-title {
    font-size: 28px;
    font-weight: 700;
    color: #2d3748;
    margin: 0;
}

.user-info {
    background: rgba(102, 126, 234, 0.1);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    color: #4c51bf;
    font-weight: 500;
}

/* Add Column Section */
.add-column-section {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
    display: flex;
    gap: 12px;
    align-items: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.add-column-input {
    flex: 1;
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    background: white;
    transition: all 0.2s;
}

.add-column-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.add-column-btn {
    background: linear-gradient(135deg, #48bb78, #38a169);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
}

.add-column-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

/* Columns Wrapper */
.columns-wrapper {
    display: flex;
    gap: 20px;
    overflow-x: auto;
    padding-bottom: 20px;
    min-height: 500px;
}

.columns-wrapper::-webkit-scrollbar {
    height: 8px;
}

.columns-wrapper::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

.columns-wrapper::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
}

/* Column */
.column {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 12px;
    padding: 20px;
    min-width: 320px;
    max-width: 320px;
    height: fit-content;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: transform 0.2s, box-shadow 0.2s;
}

.column:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.column-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f1f5f9;
}

.column-title {
    font-size: 18px;
    font-weight: 700;
    color: #2d3748;
    margin: 0;
}

.column-actions {
    display: flex;
    gap: 8px;
    align-items: center;
}

.rename-btn,
.delete-column-btn {
    padding: 4px 8px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
}

.rename-btn {
    background: rgba(102, 126, 234, 0.1);
    color: #4c51bf;
}

.rename-btn:hover {
    background: rgba(102, 126, 234, 0.2);
}

.delete-column-btn {
    background: rgba(245, 101, 101, 0.1);
    color: #e53e3e;
    font-weight: bold;
}

.delete-column-btn:hover {
    background: rgba(245, 101, 101, 0.2);
}

/* Task List */
.task-list {
    min-height: 200px;
    margin-bottom: 16px;
}

/* Task Card */
.task-card {
    background: white;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid #e2e8f0;
    cursor: grab;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.task-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    border-color: #667eea;
}

.task-card:active {
    cursor: grabbing;
}

.task-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}

.task-title {
    font-weight: 600;
    color: #2d3748;
    line-height: 1.4;
    flex: 1;
    margin-right: 8px;
}

.task-actions {
    display: flex;
    gap: 6px;
    opacity: 0;
    transition: opacity 0.2s;
}

.task-card:hover .task-actions {
    opacity: 1;
}

.task-rename-btn,
.task-delete-btn {
    padding: 2px 6px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    transition: all 0.2s;
}

.task-rename-btn {
    background: rgba(102, 126, 234, 0.1);
    color: #4c51bf;
}

.task-delete-btn {
    background: rgba(245, 101, 101, 0.1);
    color: #e53e3e;
}

/* Tags Input */
.task-tags {
    margin-bottom: 12px;
}

.tags-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 12px;
    transition: all 0.2s;
}

.tags-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

/* Task Footer */
.task-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #718096;
}

.assignee-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.assignee-count {
    background: rgba(102, 126, 234, 0.1);
    color: #4c51bf;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 500;
}

.assign-btn {
    background: none;
    border: none;
    color: #4c51bf;
    cursor: pointer;
    text-decoration: underline;
    font-size: 12px;
    padding: 0;
    transition: color 0.2s;
}

.assign-btn:hover {
    color: #667eea;
}

/* Add Task Section */
.add-task-section {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
}

.add-task-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 13px;
    transition: all 0.2s;
}

.add-task-input:focus {
    outline: none;
    border-color: #48bb78;
    box-shadow: 0 0 0 2px rgba(72, 187, 120, 0.1);
}

.add-task-btn {
    background: linear-gradient(135deg, #48bb78, #38a169);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s;
}

.add-task-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(72, 187, 120, 0.3);
}

/* Rename Input */
.rename-input {
    padding: 4px 8px;
    border: 2px solid #667eea;
    border-radius: 4px;
    font-size: inherit;
    font-weight: inherit;
    background: white;
    width: 100%;
}

/* Drag and Drop Styles */
.sortable-ghost {
    opacity: 0.5;
}

.sortable-drag {
    transform: rotate(5deg);
}

/* Responsive */
@media (max-width: 768px) {
    .board-container {
        padding: 12px;
    }

    .header {
        padding: 16px;
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
    }

    .board-title {
        font-size: 24px;
    }

    .column {
        min-width: 280px;
        max-width: 280px;
    }

    .add-column-section {
        flex-direction: column;
        align-items: stretch;
    }
}

/* Animation */
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.column,
.task-card {
    animation: slideIn 0.3s ease-out;
}
</style>