import { createRouter, createWebHistory } from 'vue-router';
import BoardPage from '../pages/BoardPage.vue';
import AuthPage from '../pages/AuthPage.vue';
import BoardsListPage from '../pages/BoardsListPage.vue';
import { useAuthStore } from '../stores/auth';

const routes = [
    { path: '/auth', component: AuthPage },
    { path: '/', component: BoardsListPage, meta: { requiresAuth: true } },
    { path: '/board/:id', component: BoardPage, meta: { requiresAuth: true } },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, _from, next) => {
    const auth = useAuthStore();
    const hasToken = !!localStorage.getItem('kb-token');
    if (to.meta.requiresAuth && (!auth.currentUserId || !hasToken)) {
        // Hard logout if token missing but state says logged in
        if (!hasToken && auth.currentUserId) {
            auth.logout();
        }
        next('/auth');
        return;
    }
    if (to.path === '/auth' && auth.currentUserId && hasToken) {
        next('/');
        return;
    }
    next();
});

export default router;
