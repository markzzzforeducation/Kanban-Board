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

// helper removed; using inline mapping with non-null assertion instead

function addColumn() {
    if (!board.value || !newColumnTitle.value) return;
    boards.addColumn(board.value.id, newColumnTitle.value);
    newColumnTitle.value = '';
}

function deleteColumn(columnId: string) {
    if (!board.value) return;
    boards.deleteColumn(board.value.id, columnId);
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
    boards.deleteTask(board.value.id, taskId);
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
    // notify assignee (self) as optional feature
    noti.push(auth.currentUserId, `You were assigned to task "${task.title}" in ${board.value!.name}`);
}

function updateTags(taskId: string, tagsText: string) {
    if (!board.value) return;
    const tags = tagsText.split(',').map(t => t.trim()).filter(Boolean);
    boards.setTaskTags(board.value.id, taskId, tags);
}
</script>

<template>
    <div class="flex flex-col space-y-4 p-4 bg-gray-50 min-h-screen text-gray-900" v-if="board">
        <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
                <button class="text-blue-700 underline" @click="router.push('/')">Back</button>
                <h1 class="text-2xl font-bold">{{ board.name }}</h1>
            </div>
            <div class="text-sm" v-if="auth.currentUser">Signed in as {{ auth.currentUser.name }}</div>
        </div>

        <div class="flex space-x-2 mb-4">
            <input v-model="newColumnTitle" type="text" placeholder="Add column"
                class="border p-2 rounded flex-1 bg-white" />
            <button @click="addColumn" class="bg-blue-600 text-white px-4 rounded">Add Column</button>
        </div>

        <div class="flex space-x-4 overflow-x-auto">
            <div v-for="column in board.columns" :key="column.id"
                class="bg-gray-200 p-4 rounded min-w-[280px] flex-shrink-0 shadow">
                <div class="flex justify-between items-center mb-2">
                    <div>
                        <template v-if="renamingColumnId === column.id">
                            <input v-model="renameText" class="border rounded p-1"
                                @keyup.enter="confirmRenameColumn(column.id)" />
                            <button class="ml-2 text-blue-700" @click="confirmRenameColumn(column.id)">Save</button>
                        </template>
                        <template v-else>
                            <h2 class="font-bold text-lg">{{ column.title }}</h2>
                        </template>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="text-sm text-gray-700 underline"
                            @click="startRenameColumn(column.id, column.title)">Rename</button>
                        <button @click="deleteColumn(column.id)" class="text-red-600 font-bold">✕</button>
                    </div>
                </div>

                <draggable :list="column.taskIds.map(id => board!.tasks[id]).filter(Boolean)" group="tasks"
                    item-key="id" class="space-y-2" animation="150" :data-column-id="column.id"
                    @end="(evt: any) => onTaskDrop(evt, column.id)">
                    <template #item="{ element }">
                        <div class="bg-white p-2 rounded shadow cursor-grab" :data-task-id="element.id"
                            :data-id="element.id">
                            <div class="flex justify-between items-center">
                                <div class="font-medium">
                                    <template v-if="renamingTaskId === element.id">
                                        <input v-model="renameText" class="border rounded p-1"
                                            @keyup.enter="confirmRenameTask(element.id)" />
                                        <button class="ml-2 text-blue-700"
                                            @click="confirmRenameTask(element.id)">Save</button>
                                    </template>
                                    <template v-else>
                                        {{ element.title }}
                                    </template>
                                </div>
                                <div class="flex items-center gap-2">
                                    <button class="text-xs text-gray-700 underline"
                                        @click="startRenameTask(element.id, element.title)">Rename</button>
                                    <button @click="deleteTask(element.id)" class="text-red-600 font-bold">✕</button>
                                </div>
                            </div>
                            <div class="mt-2 flex items-center gap-2">
                                <input :value="element.tags.join(', ')"
                                    @change="(e: any) => updateTags(element.id, e.target.value)"
                                    placeholder="tags (comma)" class="border rounded p-1 w-full" />
                            </div>
                            <div class="mt-2 flex items-center gap-2 text-sm">
                                <div>Assignees: {{ element.assigneeIds.length }}</div>
                                <button class="text-blue-700 underline" @click="assignToMe(element.id)">Assign to
                                    me</button>
                            </div>
                        </div>
                    </template>
                </draggable>

                <div class="flex space-x-2 mt-2">
                    <input v-model="newTaskTitleByColumn[column.id]" type="text" placeholder="New Task"
                        class="border p-1 rounded flex-1 bg-white" />
                    <button @click="addTask(column.id)" class="bg-green-600 text-white px-2 rounded">Add</button>
                </div>
            </div>
        </div>
    </div>
</template>
