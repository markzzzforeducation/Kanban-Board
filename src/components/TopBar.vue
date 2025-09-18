<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';

const auth = useAuthStore();
const noti = useNotificationsStore();
const router = useRouter();
const route = useRoute();

const showUserMenu = ref(false);
const showNoti = ref(false);
const notiRef = ref<HTMLElement | null>(null);
const userRef = ref<HTMLElement | null>(null);

// Check if we're on board page for different styling
const isBoardPage = computed(() => route.name === 'board' || route.path.includes('/board/'));

function handleDocClick(e: MouseEvent) {
    const t = e.target as Node;
    if (showNoti.value && notiRef.value && !notiRef.value.contains(t)) showNoti.value = false;
    if (showUserMenu.value && userRef.value && !userRef.value.contains(t)) showUserMenu.value = false;
}

onMounted(() => {
    document.addEventListener('click', handleDocClick);
    if (auth.currentUserId) {
        noti.fetch();
    }
});
onBeforeUnmount(() => document.removeEventListener('click', handleDocClick));

const unread = computed(() => auth.currentUserId ? noti.unreadForUser(auth.currentUserId).length : 0);
const list = computed(() => auth.currentUserId ? noti.allForUser(auth.currentUserId).slice(0, 10) : []);

function logout() {
    auth.logout();
    router.push('/auth');
    showUserMenu.value = false;
}

function goHome() {
    router.push('/');
    showUserMenu.value = false;
}

function toggleNotifications() {
    showNoti.value = !showNoti.value;
    if (showUserMenu.value) showUserMenu.value = false;
}

function toggleUserMenu() {
    showUserMenu.value = !showUserMenu.value;
    if (showNoti.value) showNoti.value = false;
}

function markAllAsRead() {
    if (auth.currentUserId) {
        noti.markAllRead(auth.currentUserId);
    }
}

function markNotificationRead(notificationId: string) {
    if (auth.currentUserId) {
        // Fix: noti.markRead does not exist, so update notification directly
        const notification = noti.notifications.find(
            n => n.id === notificationId && n.userId === auth.currentUserId
        );
        if (notification && !notification.read) {
            notification.read = true;
        }
    }
}
</script>

<template>
    <header class="top-bar" :class="{ 'board-header': isBoardPage }">
        <div class="header-container">
            <!-- Logo Section -->
            <div class="logo-section">
                <button class="logo-button" @click="goHome">
                    <div class="logo-icon">
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
                    <div class="logo-text">
                        <span class="brand-name">Kanban</span>
                        <span class="brand-subtitle">Board</span>
                    </div>
                </button>
                <div class="tagline">
                    <span class="tagline-text">Organize • Prioritize • Execute</span>
                </div>
            </div>

            <!-- Navigation Actions -->
            <div class="nav-actions">
                <!-- Quick Stats (show on non-board pages) -->
                <div v-if="!isBoardPage" class="quick-stats">
                    <div class="stat-item">
                        <span class="stat-value">{{ unread }}</span>
                        <span class="stat-label">New</span>
                    </div>
                </div>

                <!-- Notifications -->
                <div class="notification-container" ref="notiRef">
                    <button class="notification-button" @click="toggleNotifications"
                        :class="{ 'has-unread': unread > 0 }">
                        <div class="notification-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M15 17H20L18.5951 15.5951C18.2141 15.2141 18 14.6973 18 14.1585V11C18 8.38757 16.3304 6.16509 14 5.34142V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V5.34142C7.66962 6.16509 6 8.38757 6 11V14.1585C6 14.6973 5.78595 15.2141 5.40493 15.5951L4 17H9M15 17V18C15 19.6569 13.6569 21 12 21C10.3431 21 9 19.6569 9 18V17M15 17H9"
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>
                        <div v-if="unread > 0" class="notification-badge">
                            <span>{{ unread > 99 ? '99+' : unread }}</span>
                        </div>
                    </button>

                    <!-- Notifications Dropdown -->
                    <transition name="dropdown">
                        <div v-if="showNoti" class="dropdown notifications-dropdown">
                            <div class="dropdown-header">
                                <div class="dropdown-title">
                                    <svg class="title-icon" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M15 17H20L18.5951 15.5951C18.2141 15.2141 18 14.6973 18 14.1585V11C18 8.38757 16.3304 6.16509 14 5.34142V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V5.34142C7.66962 6.16509 6 8.38757 6 11V14.1585C6 14.6973 5.78595 15.2141 5.40493 15.5951L4 17H9M15 17V18C15 19.6569 13.6569 21 12 21C10.3431 21 9 19.6569 9 18V17M15 17H9"
                                            stroke="currentColor" stroke-width="1.5" />
                                    </svg>
                                    <span>Notifications</span>
                                    <div v-if="unread > 0" class="unread-indicator">{{ unread }}</div>
                                </div>
                                <button v-if="list.length > 0" class="mark-all-btn" @click="markAllAsRead">
                                    Mark all read
                                </button>
                            </div>

                            <div class="notifications-list">
                                <div v-if="!list.length" class="empty-state">
                                    <div class="empty-icon">
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                                                stroke="currentColor" stroke-width="2" />
                                        </svg>
                                    </div>
                                    <p class="empty-text">You're all caught up!</p>
                                    <p class="empty-subtext">No new notifications</p>
                                </div>

                                <div v-for="n in list" :key="n.id" class="notification-item"
                                    :class="{ 'unread': !n.read }" @click="markNotificationRead(n.id)">
                                    <div class="notification-content">
                                        <div class="notification-message">{{ n.message }}</div>
                                        <div class="notification-time">
                                            {{ new Date(n.createdAt).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) }}
                                        </div>
                                    </div>
                                    <div v-if="!n.read" class="unread-dot"></div>
                                </div>
                            </div>
                        </div>
                    </transition>
                </div>

                <!-- User Menu -->
                <div class="user-container" ref="userRef">
                    <button class="user-button" @click="toggleUserMenu">
                        <div class="user-avatar">
                            <span class="avatar-text">{{ auth.currentUser?.name?.slice(0, 1) || 'U' }}</span>
                            <div class="avatar-status"></div>
                            <div v-if="unread > 0" class="avatar-badge">NEW</div>
                        </div>
                        <div class="user-info">
                            <span class="user-name">{{ auth.currentUser?.name || 'User' }}</span>
                            <span class="user-status">Online</span>
                        </div>
                        <div class="dropdown-arrow">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>
                    </button>

                    <!-- User Dropdown -->
                    <transition name="dropdown">
                        <div v-if="showUserMenu" class="dropdown user-dropdown">
                            <div class="dropdown-header">
                                <div class="user-profile">
                                    <div class="profile-avatar">
                                        <span>{{ auth.currentUser?.name?.slice(0, 1) || 'U' }}</span>
                                    </div>
                                    <div class="profile-info">
                                        <div class="profile-name">{{ auth.currentUser?.name || 'User' }}</div>
                                        <div class="profile-email">{{ auth.currentUser?.email || 'user@example.com' }}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="dropdown-menu">
                                <button class="menu-item" @click="goHome">
                                    <svg class="menu-icon" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M3 7V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V7M3 7L12 14L21 7M3 7V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V7"
                                            stroke="currentColor" stroke-width="2" />
                                    </svg>
                                    <div class="menu-content">
                                        <span class="menu-label">My Boards</span>
                                        <span class="menu-description">View all boards</span>
                                    </div>
                                </button>

                                <div class="menu-divider"></div>

                                <button class="menu-item logout-item" @click="logout">
                                    <svg class="menu-icon" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M9 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9"
                                            stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                            stroke-linejoin="round" />
                                    </svg>
                                    <div class="menu-content">
                                        <span class="menu-label">Sign out</span>
                                        <span class="menu-description">Log out of your account</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </transition>
                </div>
            </div>
        </div>
    </header>
</template>

<style scoped>
/* Main Header */
.top-bar {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(226, 232, 240, 0.5);
    position: sticky;
    top: 0;
    z-index: 100;
    transition: all 0.3s ease;
}

.top-bar.board-header {
    background: rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
}

.header-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
}

/* Logo Section */
.logo-section {
    display: flex;
    align-items: center;
    gap: 16px;
}

.logo-button {
    display: flex;
    align-items: center;
    gap: 12px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 12px;
    transition: all 0.2s ease;
    color: inherit;
}

.logo-button:hover {
    background: rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
}

.board-header .logo-button:hover {
    background: rgba(255, 255, 255, 0.1);
}

.logo-icon {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.logo-icon svg {
    width: 18px;
    height: 18px;
}

.logo-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.brand-name {
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.board-header .brand-name {
    color: white;
    -webkit-text-fill-color: white;
}

.brand-subtitle {
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
    line-height: 1;
}

.board-header .brand-subtitle {
    color: rgba(255, 255, 255, 0.7);
}

.tagline {
    display: none;
}

.tagline-text {
    font-size: 12px;
    color: #64748b;
    font-weight: 400;
}

.board-header .tagline-text {
    color: rgba(255, 255, 255, 0.6);
}

/* Navigation Actions */
.nav-actions {
    display: flex;
    align-items: center;
    gap: 16px;
}

/* Quick Stats */
.quick-stats {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: rgba(102, 126, 234, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(102, 126, 234, 0.1);
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.stat-value {
    font-size: 16px;
    font-weight: 700;
    color: #4c51bf;
}

.stat-label {
    font-size: 10px;
    color: #64748b;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Notifications */
.notification-container {
    position: relative;
}

.notification-button {
    position: relative;
    background: none;
    border: none;
    cursor: pointer;
    padding: 10px;
    border-radius: 12px;
    transition: all 0.2s ease;
    color: inherit;
}

.notification-button:hover {
    background: rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
}

.board-header .notification-button:hover {
    background: rgba(255, 255, 255, 0.1);
}

.notification-button.has-unread .notification-icon {
    animation: pulse 2s infinite;
}

.notification-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.notification-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    border-radius: 50%;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

/* User Section */
.user-container {
    position: relative;
}

.user-button {
    display: flex;
    align-items: center;
    gap: 12px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 12px;
    transition: all 0.2s ease;
    color: inherit;
}

.user-button:hover {
    background: rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
}

.board-header .user-button:hover {
    background: rgba(255, 255, 255, 0.1);
}

.user-avatar {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.avatar-text {
    font-size: 14px;
}

.avatar-status {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    background: #22c55e;
    border-radius: 50%;
    border: 2px solid white;
}

.avatar-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    font-size: 9px;
    font-weight: 700;
    border-radius: 8px;
    padding: 2px 6px;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
}

.user-name {
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
}

.user-status {
    font-size: 11px;
    color: #22c55e;
    font-weight: 500;
    line-height: 1;
}

.board-header .user-status {
    color: #86efac;
}

.dropdown-arrow {
    width: 16px;
    height: 16px;
    color: #64748b;
    transition: transform 0.2s ease;
}

.board-header .dropdown-arrow {
    color: rgba(255, 255, 255, 0.6);
}

.user-button:hover .dropdown-arrow {
    transform: translateY(-1px);
}

/* Dropdowns */
.dropdown {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(226, 232, 240, 0.5);
    overflow: hidden;
    z-index: 1000;
    backdrop-filter: blur(20px);
}

.notifications-dropdown {
    width: 380px;
    max-height: 480px;
}

.user-dropdown {
    width: 280px;
}

.dropdown-header {
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
    background: rgba(248, 250, 252, 0.5);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.dropdown-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #1e293b;
}

.title-icon {
    width: 16px;
    height: 16px;
    color: #667eea;
}

.unread-indicator {
    background: #ef4444;
    color: white;
    border-radius: 50%;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
}

.mark-all-btn {
    background: none;
    border: none;
    color: #667eea;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.mark-all-btn:hover {
    background: rgba(102, 126, 234, 0.1);
}

/* Notifications List */
.notifications-list {
    max-height: 320px;
    overflow-y: auto;
}

.empty-state {
    padding: 40px 20px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.empty-icon {
    width: 48px;
    height: 48px;
    color: #22c55e;
    margin-bottom: 8px;
}

.empty-text {
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.empty-subtext {
    font-size: 14px;
    color: #64748b;
    margin: 0;
}

.notification-item {
    padding: 16px 20px;
    border-bottom: 1px solid #f8fafc;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
}

.notification-item:hover {
    background: rgba(102, 126, 234, 0.05);
}

.notification-item.unread {
    background: rgba(59, 130, 246, 0.05);
}

.notification-content {
    flex: 1;
}

.notification-message {
    font-size: 14px;
    color: #1e293b;
    line-height: 1.4;
    margin-bottom: 4px;
}

.notification-time {
    font-size: 12px;
    color: #64748b;
}

.unread-dot {
    width: 6px;
    height: 6px;
    background: #3b82f6;
    border-radius: 50%;
    margin-top: 6px;
}

/* User Profile in Dropdown */
.user-profile {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
}

.profile-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.profile-info {
    flex: 1;
}

.profile-name {
    font-weight: 600;
    color: #1e293b;
    font-size: 14px;
    line-height: 1.2;
}

.profile-email {
    font-size: 12px;
    color: #64748b;
    line-height: 1.2;
}

/* Dropdown Menu */
.dropdown-menu {
    padding: 8px;
}

.menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s ease;
    color: #334155;
}

.menu-item:hover {
    background: rgba(102, 126, 234, 0.1);
}

.menu-item.logout-item {
    color: #dc2626;
}

.menu-item.logout-item:hover {
    background: rgba(220, 38, 38, 0.1);
}

.menu-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}

.menu-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
}

.menu-label {
    font-size: 14px;
    font-weight: 500;
    line-height: 1;
}

.menu-description {
    font-size: 12px;
    color: #64748b;
    line-height: 1;
}

.menu-divider {
    height: 1px;
    background: #f1f5f9;
    margin: 4px 0;
}

/* Animations */
@keyframes pulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }
}

.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.2s ease;
    transform-origin: top right;
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
}

/* Responsive */
@media (max-width: 1024px) {
    .tagline {
        display: block;
    }
}

@media (max-width: 768px) {
    .header-container {
        padding: 12px 16px;
        gap: 16px;
    }

    .user-info {
        display: none;
    }

    .brand-subtitle {
        display: none;
    }

    .quick-stats {
        display: none;
    }

    .notifications-dropdown {
        width: 340px;
    }

    .user-dropdown {
        width: 240px;
    }
}

@media (max-width: 480px) {
    .tagline {
        display: none;
    }

    .notifications-dropdown {
        width: 320px;
        left: 50%;
        right: auto;
        transform: translateX(-50%);
    }

    .user-dropdown {
        width: 200px;
    }
}

/* Custom Scrollbar */
.notifications-list::-webkit-scrollbar {
    width: 4px;
}

.notifications-list::-webkit-scrollbar-track {
    background: #f8fafc;
}

.notifications-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
}

.notifications-list::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Focus States */
.notification-button:focus-visible,
.user-button:focus-visible,
.logo-button:focus-visible {
    outline: 2px solid #667eea;
    outline-offset: 2px;
}

.menu-item:focus-visible,
.mark-all-btn:focus-visible {
    outline: 2px solid #667eea;
    outline-offset: 2px;
}
</style>