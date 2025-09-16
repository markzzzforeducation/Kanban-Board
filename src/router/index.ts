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
    if (to.meta.requiresAuth && !auth.currentUserId) {
        next('/auth');
        return;
    }
    if (to.path === '/auth' && auth.currentUserId) {
        next('/');
        return;
    }
    next();
});

export default router;
