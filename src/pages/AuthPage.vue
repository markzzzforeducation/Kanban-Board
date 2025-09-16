<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();

const isRegister = ref(false);
const name = ref('');
const email = ref('alice@example.com');
const password = ref('123456');
const error = ref('');

function submit() {
  error.value = '';
  if (isRegister.value) {
    const res = auth.register(name.value, email.value, password.value);
    if (!res.ok) { error.value = res.message || 'Register failed'; return; }
    router.push('/');
  } else {
    const ok = auth.login(email.value, password.value);
    if (!ok) { error.value = 'Invalid credentials'; return; }
    router.push('/');
  }
}
</script>

<template>
  <div class="max-w-md mx-auto bg-white shadow p-6 rounded text-gray-900">
    <h1 class="text-2xl font-bold mb-4">{{ isRegister ? 'Register' : 'Login' }}</h1>
    <div v-if="isRegister" class="mb-2">
      <label class="block text-sm mb-1">Name</label>
      <input v-model="name" class="w-full border rounded p-2" />
    </div>
    <div class="mb-2">
      <label class="block text-sm mb-1">Email</label>
      <input v-model="email" type="email" class="w-full border rounded p-2" />
    </div>
    <div class="mb-4">
      <label class="block text-sm mb-1">Password</label>
      <input v-model="password" type="password" class="w-full border rounded p-2" />
    </div>
    <p v-if="error" class="text-red-600 text-sm mb-2">{{ error }}</p>
    <div class="flex items-center gap-2">
      <button @click="submit" class="bg-blue-600 text-white px-4 py-2 rounded">
        {{ isRegister ? 'Create account' : 'Login' }}
      </button>
      <button class="text-blue-700 underline" @click="isRegister = !isRegister">
        {{ isRegister ? 'Have an account? Login' : 'New user? Register' }}
      </button>
    </div>
  </div>

</template>
