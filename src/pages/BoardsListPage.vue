<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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
const showInviteModal = ref<string | null>(null);

async function createBoard() {
  if (!auth.currentUserId || !newBoardName.value.trim()) return;
  const id = await boards.createBoard(newBoardName.value.trim(), auth.currentUserId);
  newBoardName.value = '';
  router.push(`/board/${id}`);
}

function startRename(id: string, current: string) {
  renamingId.value = id;
  renameText.value = current;
}

function confirmRename(id: string) {
  if (!renameText.value.trim()) {
    renamingId.value = null;
    return;
  }
  boards.renameBoard(id, renameText.value.trim());
  renamingId.value = null;
}

function cancelRename() {
  renamingId.value = null;
  renameText.value = '';
}

function doInvite(boardId: string) {
  const email = inviteEmail.value.trim().toLowerCase();
  if (!email) return;
  boards.inviteMemberByEmail(boardId, email);
  inviteEmail.value = '';
  showInviteModal.value = null;
}

interface Board {
  id: string;
  name: string;
  memberIds: string[];
}

function openBoard(boardId: Board['id']): void {
  router.push(`/board/${boardId}`);
}

function logout() {
  auth.logout();
  router.push('/auth');
}

onMounted(async () => {
  try { await boards.fetchBoards(); } catch { }
});

</script>

<template>
  <div class="boards-page">
    <div class="page-container">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">Your Boards</h1>
            <p class="page-subtitle">Create boards and invite teammates to collaborate</p>
          </div>
          <div class="header-stats">
            <div class="stat-card">
              <span class="stat-number">{{ myBoards.length }}</span>
              <span class="stat-label">{{ myBoards.length === 1 ? 'Board' : 'Boards' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Board Section -->
      <div class="create-board-section">
        <div class="create-board-card">
          <div class="create-header">
            <div class="create-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </div>
            <div class="create-text">
              <h3 class="create-title">Create New Board</h3>
              <p class="create-subtitle">Start organizing your projects</p>
            </div>
          </div>
          <div class="create-form">
            <div class="input-group">
              <input v-model="newBoardName" placeholder="Enter board name" class="board-name-input"
                @keyup.enter="createBoard" />
              <button @click="createBoard" :disabled="!newBoardName.trim()" class="create-button">
                <svg class="button-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                Create Board
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Boards Grid -->
      <div class="boards-section">
        <div v-if="!myBoards.length" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none" />
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none" />
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none" />
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none" />
            </svg>
          </div>
          <div class="empty-content">
            <h3 class="empty-title">No boards yet</h3>
            <p class="empty-description">Create your first board to start organizing your projects and tasks</p>
            <button @click="createBoard" class="empty-action-button">
              <svg class="button-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
              Create Your First Board
            </button>
          </div>
        </div>

        <div v-else class="boards-grid">
          <div v-for="board in myBoards" :key="board.id" class="board-card">
            <div class="board-header">
              <div class="board-info" @click="openBoard(board.id)">
                <div class="board-avatar">
                  <span class="board-initial">{{ board.name.slice(0, 1).toUpperCase() }}</span>
                </div>
                <div class="board-details">
                  <div v-if="renamingId === board.id" class="rename-section" @click.stop>
                    <input v-model="renameText" class="rename-input" @click.stop @mousedown.stop
                      @keydown.enter.stop="confirmRename(board.id)" @keyup.enter="confirmRename(board.id)"
                      @keyup.escape="cancelRename" @blur="confirmRename(board.id)" />
                  </div>
                  <div v-else class="board-name-section">
                    <h3 class="board-name">{{ board.name }}</h3>
                    <div class="board-meta">
                      <div class="member-count">
                        <svg class="meta-icon" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                          <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" />
                        </svg>
                        {{ 1 + board.memberIds.length }} {{ (1 + board.memberIds.length) === 1 ? 'member' : 'members' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="board-actions">
                <div class="action-buttons">
                  <button class="action-button" @click="showInviteModal = board.id" title="Invite members">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M12.5 11.5L15 9L12.5 6.5M21 9H15"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                  <button class="action-button" @click.stop="startRename(board.id, board.name)" title="Rename board">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H16C16.5304 20 17.0391 19.7893 17.4142 19.4142C17.7893 19.0391 18 18.5304 18 18V13M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89783 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                  <button class="action-button danger" @click="boards.deleteBoard(board.id)" title="Delete board">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Invite Modal -->
            <div v-if="showInviteModal === board.id" class="invite-modal">
              <div class="modal-backdrop" @click="showInviteModal = null"></div>
              <div class="modal-content">
                <div class="modal-header">
                  <h4 class="modal-title">Invite to {{ board.name }}</h4>
                  <button class="modal-close" @click="showInviteModal = null">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
                <div class="modal-body">
                  <div class="invite-form">
                    <label class="form-label">Email address</label>
                    <div class="invite-input-group">
                      <input v-model="inviteEmail" placeholder="Enter email address" class="invite-input" type="email"
                        @keyup.enter="doInvite(board.id)" />
                      <button @click="doInvite(board.id)" :disabled="!inviteEmail.trim()" class="invite-button">
                        Send Invite
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page Layout */
.boards-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 24px 0;
}

.page-container {
  max-width: 1400px;
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
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.header-text {
  flex: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 24px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Create Board Section */
.create-board-section {
  display: flex;
  justify-content: center;
}

.create-board-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(226, 232, 240, 0.5);
  padding: 24px 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 600px;
}

.create-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.create-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.create-icon svg {
  width: 24px;
  height: 24px;
}

.create-text {
  flex: 1;
}

.create-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.create-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.create-form {
  margin-top: 20px;
}

.input-group {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.board-name-input {
  flex: 1;
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.2s ease;
  background: white;
}

.board-name-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.create-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.create-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.button-icon {
  width: 18px;
  height: 18px;
}

/* Boards Section */
.boards-section {
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
  margin: 0 0 32px 0;
  line-height: 1.5;
}

.empty-action-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.empty-action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

/* Boards Grid */
.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.board-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.5);
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
}

.board-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.board-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.board-info {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  cursor: pointer;
}

.board-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  flex-shrink: 0;
}

.board-details {
  flex: 1;
  min-width: 0;
}

.board-name-section {
  margin-bottom: 8px;
}

.board-name {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.board-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.member-count {
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

/* Rename Section */
.rename-section {
  margin-bottom: 8px;
}

.rename-input {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  background: white;
}

.rename-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Board Actions */
.board-actions {
  flex-shrink: 0;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-button {
  width: 36px;
  height: 36px;
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(226, 232, 240, 0.5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
}

.action-button:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border-color: rgba(102, 126, 234, 0.2);
  transform: translateY(-1px);
}

.action-button.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.action-button svg {
  width: 16px;
  height: 16px;
}

/* Invite Modal */
.invite-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-content {
  position: relative;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 520px;
  overflow: hidden;
  /* ensure it fits within viewport width */
  margin: 0 16px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  background: rgba(248, 250, 252, 0.5);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(248, 250, 252, 0.8);
  color: #374151;
}

.modal-close svg {
  width: 18px;
  height: 18px;
}

.modal-body {
  padding: 24px;
}

.invite-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.invite-input-group {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: stretch;
}

.invite-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  min-width: 0;
  /* allow to shrink within grid */
  box-sizing: border-box;
}

.invite-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.invite-button {
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-sizing: border-box;
}

.invite-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.invite-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .boards-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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

  .page-title {
    font-size: 28px;
  }

  .create-board-card {
    padding: 20px 24px;
  }

  .create-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    text-align: left;
  }

  .create-icon {
    width: 40px;
    height: 40px;
  }

  .create-icon svg {
    width: 20px;
    height: 20px;
  }

  .input-group {
    flex-direction: column;
    gap: 12px;
  }

  .boards-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .board-card {
    padding: 20px;
  }

  .board-header {
    flex-direction: column;
    gap: 16px;
  }

  .board-info {
    width: 100%;
  }

  .action-buttons {
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

  .modal-content {
    margin: 0 16px;
    max-width: none;
  }

  .invite-input-group {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 24px;
  }

  .create-header {
    text-align: center;
    align-items: center;
  }

  .stat-card {
    padding: 12px 16px;
  }

  .board-name {
    font-size: 18px;
  }

  .board-avatar {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .action-button {
    width: 32px;
    height: 32px;
  }

  .action-button svg {
    width: 14px;
    height: 14px;
  }

  .invite-input-group {
    flex-direction: column;
  }

  .empty-action-button {
    width: 100%;
    justify-content: center;
  }
}

/* Focus States */
.create-button:focus-visible,
.action-button:focus-visible,
.empty-action-button:focus-visible,
.invite-button:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

.board-name-input:focus-visible,
.invite-input:focus-visible,
.rename-input:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

/* Loading States */
.create-button:active,
.invite-button:active {
  transform: translateY(0);
}

/* Animation for board cards */
.board-card {
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

/* Hover effects for better UX */
.board-info:hover .board-name {
  color: #667eea;
}

.board-info:hover .board-avatar {
  transform: scale(1.05);
}

/* Smooth transitions */
* {
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

/* Custom scrollbar for modal if content overflows */
.modal-body {
  max-height: 60vh;
  overflow-y: auto;
}

.modal-body::-webkit-scrollbar {
  width: 4px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f8fafc;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
