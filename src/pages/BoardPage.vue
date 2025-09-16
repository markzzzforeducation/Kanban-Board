<script setup lang="ts">
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'

interface Task { id: number; title: string }
interface Column { id: number; title: string; tasks: Task[]; newTaskTitle: string }

// โหลดจาก localStorage
const saved = localStorage.getItem('kanban-columns')
const columns = ref<Column[]>(saved ? JSON.parse(saved) : [
    { id: 1, title: 'To Do', tasks: [{ id: 1, title: 'Task A' }], newTaskTitle: '' },
    { id: 2, title: 'Doing', tasks: [], newTaskTitle: '' },
    { id: 3, title: 'Done', tasks: [], newTaskTitle: '' },
])

const newColumnTitle = ref('')

// บันทึกทุกครั้งที่ columns เปลี่ยน
watch(columns, (newVal) => {
    localStorage.setItem('kanban-columns', JSON.stringify(newVal))
}, { deep: true })

function addColumn() {
    if (!newColumnTitle.value) return
    columns.value.push({ id: Date.now(), title: newColumnTitle.value, tasks: [], newTaskTitle: '' })
    newColumnTitle.value = ''
}

function deleteColumn(id: number) {
    columns.value = columns.value.filter((c: { id: number; }) => c.id !== id)
}

function addTask(column: Column) {
    if (!column.newTaskTitle) return
    column.tasks.push({ id: Date.now(), title: column.newTaskTitle })
    column.newTaskTitle = ''
}

function deleteTask(columnId: number, taskId: number) {
    const column = columns.value.find((c: { id: number; }) => c.id === columnId)
    if (column) column.tasks = column.tasks.filter((t: { id: number; }) => t.id !== taskId)
}
</script>

<template>
    <div class="flex flex-col space-y-4 p-4 bg-gray-50 min-h-screen">
        <!-- Add Column -->
        <div class="flex space-x-2 mb-4">
            <input v-model="newColumnTitle" type="text" placeholder="Column title"
                class="border p-2 rounded flex-1 text-gray-800 bg-white" />
            <button @click="addColumn" class="bg-blue-600 text-white px-4 rounded">Add Column</button>
        </div>

        <!-- Columns -->
        <div class="flex space-x-4 overflow-x-auto">
            <div v-for="column in columns" :key="column.id"
                class="bg-gray-200 p-4 rounded min-w-[250px] flex-shrink-0 shadow">
                <!-- Column Header -->
                <div class="flex justify-between items-center mb-2">
                    <h2 class="font-bold text-lg text-gray-900">{{ column.title }}</h2>
                    <button @click="deleteColumn(column.id)" class="text-red-600 font-bold">✕</button>
                </div>

                <!-- Tasks draggable -->
                <draggable v-model="column.tasks" group="tasks" item-key="id" class="space-y-2" animation="150">
                    <template #item="{ element }">
                        <div
                            class="bg-white text-gray-900 p-2 rounded shadow flex justify-between items-center cursor-grab">
                            <span>{{ element.title }}</span>
                            <button @click="deleteTask(column.id, element.id)" class="text-red-600 font-bold">✕</button>
                        </div>
                    </template>
                </draggable>

                <!-- Add Task -->
                <div class="flex space-x-2 mt-2">
                    <input v-model="column.newTaskTitle" type="text" placeholder="New Task"
                        class="border p-1 rounded flex-1 text-gray-800 bg-white" />
                    <button @click="addTask(column)" class="bg-green-600 text-white px-2 rounded">Add</button>
                </div>
            </div>
        </div>
    </div>
</template>
