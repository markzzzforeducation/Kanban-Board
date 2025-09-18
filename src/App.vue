<script setup lang="ts">
import TopBar from './components/TopBar.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

// Check if we're on the board page to apply different background
const isBoardPage = computed(() => route.name === 'board' || String(route.path).indexOf('/board/') !== -1)
</script>

<template>
  <div class="app-container" :class="{ 'board-view': isBoardPage }">
    <!-- Top Navigation -->
    <TopBar />

    <!-- Main Content Area -->
    <main class="main-content" :class="{ 'board-main': isBoardPage }">
      <div class="content-wrapper" :class="{ 'board-wrapper': isBoardPage }">
        <router-view />
      </div>
    </main>

    <!-- Footer - only show on non-board pages -->
    <footer v-if="!isBoardPage" class="app-footer">
      <div class="footer-content">
        <div class="footer-info">
          <span class="footer-brand">Kanban Board</span>
          <span class="footer-separator">•</span>
          <span class="footer-year">&copy; 2025</span>
        </div>
        <div class="footer-links"></div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* App Container */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  transition: all 0.3s ease;
}

/* Board view specific styling */
.app-container.board-view {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.main-content.board-main {
  padding: 0;
  background: transparent;
}

.content-wrapper {
  flex: 1;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  animation: fadeIn 0.5s ease-out;
}

.content-wrapper.board-wrapper {
  padding: 0;
  max-width: none;
  margin: 0;
}

/* Footer */
.app-footer {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(226, 232, 240, 0.5);
  padding: 20px 0;
  margin-top: auto;
  position: relative;
}

.app-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #667eea, transparent);
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #64748b;
  font-size: 14px;
}

.footer-brand {
  font-weight: 600;
  color: #334155;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer-separator {
  color: #cbd5e1;
}

.footer-year {
  font-size: 13px;
}

.footer-links {
  display: flex;
  gap: 24px;
  align-items: center;
}

.footer-link {
  color: #64748b;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
}

.footer-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  transition: width 0.2s ease;
}

.footer-link:hover {
  color: #334155;
  transform: translateY(-1px);
}

.footer-link:hover::after {
  width: 100%;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .content-wrapper {
    padding: 16px;
  }

  .content-wrapper.board-wrapper {
    padding: 0;
  }

  .footer-content {
    padding: 0 16px;
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .footer-links {
    gap: 16px;
  }

  .footer-info {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .footer-links {
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }

  .footer-info {
    flex-direction: column;
    gap: 4px;
  }

  .footer-separator {
    display: none;
  }
}

/* Dark mode support (if needed later) */
@media (prefers-color-scheme: dark) {
  .app-container:not(.board-view) {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }

  .footer-info {
    color: #94a3b8;
  }

  .footer-brand {
    color: #f1f5f9;
  }

  .footer-link {
    color: #94a3b8;
  }

  .footer-link:hover {
    color: #f1f5f9;
  }

  .app-footer {
    background: rgba(15, 23, 42, 0.95);
    border-top-color: rgba(71, 85, 105, 0.3);
  }
}

/* Loading states and transitions */
.router-enter-active,
.router-leave-active {
  transition: all 0.3s ease;
}

.router-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.router-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Custom scrollbar for the app */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(226, 232, 240, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 4px;
  transition: background 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

/* Focus states for accessibility */
.footer-link:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
  border-radius: 2px;
}

/* Prevent layout shift */
.content-wrapper {
  min-height: calc(100vh - 140px);
  /* Adjust based on TopBar and Footer height */
}

.content-wrapper.board-wrapper {
  min-height: 100vh;
}
</style>