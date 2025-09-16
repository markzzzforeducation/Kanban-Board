<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Header -->
    <header class="bg-blue-600 text-black p-4 text-2xl font-bold shadow-md flex items-center justify-between">
      <span>Kanban Board</span>

    </header>

    <!-- Router Outlet -->
    <main class="flex-1 p-6">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="bg-gray-200 text-gray-700 p-4 text-center text-sm mt-auto shadow-inner">
      &copy; 2025 Your Name. All rights reserved.
    </footer>
  </div>
</template>

<style scoped>
/* ถ้าคุณมี .logo เดิม สามารถใช้ Tailwind แทน hover effect ได้ */
/* แต่ถ้าอยากเก็บ CSS เดิมก็ยังใช้ได้ */
.logo {
  will-change: filter;
  transition: filter 300ms, transform 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 1.5em #646cffaa);
  transform: scale(1.05);
}
</style>
