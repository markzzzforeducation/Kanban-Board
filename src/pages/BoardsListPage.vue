<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useBoardsStore } from '../stores/boards';

const auth = useAuthStore();
const boards = useBoardsStore();
const router = useRouter();

const myBoards = computed(() => auth.currentUserId ? boards.boardsForUser(auth.currentUserId) : []);
const newBoardName = ref('');
const renamingId = ref<string | null>(null);
const renameText = ref('');
const inviteEmail = ref('');

function createBoard() {
  if (!auth.currentUserId || !newBoardName.value) return;
  const id = boards.createBoard(newBoardName.value, auth.currentUserId);
  newBoardName.value = '';
  router.push(`/board/${id}`);
}

function startRename(id: string, current: string) {
  renamingId.value = id;
  renameText.value = current;
}

function confirmRename(id: string) {
  if (!renameText.value) { renamingId.value = null; return; }
  boards.renameBoard(id, renameText.value);
  renamingId.value = null;
}

function doInvite(boardId: string) {
  const email = inviteEmail.value.trim().toLowerCase();
  if (!email) return;
  // simple lookup from auth store
  const user = auth.allUsers.find(u => u.email.toLowerCase() === email);
  if (user) boards.inviteMember(boardId, user.id);
  inviteEmail.value = '';
}

function logout() { auth.logout(); router.push('/auth'); }
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6 text-gray-900">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Your Boards</h1>
      <div class="flex items-center gap-2">
        <span v-if="auth.currentUser" class="text-sm">Hi, {{ auth.currentUser.name }}</span>
        <button class="text-blue-700 underline" @click="logout">Logout</button>
      </div>
    </div>

    <div class="flex gap-2">
      <input v-model="newBoardName" placeholder="Board name" class="border rounded p-2 flex-1" />
      <button @click="createBoard" class="bg-blue-600 text-white px-4 rounded">Create</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="b in myBoards" :key="b.id" class="bg-white rounded shadow p-4">
        <div class="flex justify-between items-center">
          <div>
            <template v-if="renamingId === b.id">
              <input v-model="renameText" class="border rounded p-1" @keyup.enter="confirmRename(b.id)" />
              <button class="ml-2 text-blue-700" @click="confirmRename(b.id)">Save</button>
            </template>
            <template v-else>
              <h2 class="font-semibold text-lg cursor-pointer" @click="router.push(`/board/${b.id}`)">{{ b.name }}</h2>
            </template>
          </div>
          <div class="flex items-center gap-2">
            <button class="text-sm text-gray-700 underline" @click="startRename(b.id, b.name)">Rename</button>
            <button class="text-sm text-red-600 underline" @click="boards.deleteBoard(b.id)">Delete</button>
          </div>
        </div>
        <div class="mt-3 flex items-center gap-2">
          <input v-model="inviteEmail" placeholder="Invite by email" class="border rounded p-1 flex-1" />
          <button class="text-sm bg-gray-800 text-white px-2 rounded" @click="doInvite(b.id)">Invite</button>
        </div>
      </div>
    </div>
  </div>
</template>


