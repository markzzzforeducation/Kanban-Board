<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();

const isRegister = ref(false);
const name = ref('');
const email = ref('alice@example.com');
const password = ref('123456');
const error = ref('');
const isLoading = ref(false);
const showPassword = ref(false);

const buttonText = computed(() => isRegister.value ? 'Create Account' : 'Sign In');
const switchText = computed(() => isRegister.value ? 'Already have an account? Sign in' : 'New to Kanban Board? Create account');

async function submit() {
  if (isLoading.value) return;

  error.value = '';
  isLoading.value = true;

  try {
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (isRegister.value) {
      if (!name.value.trim()) {
        error.value = 'Name is required';
        return;
      }
      const res = await auth.register(name.value.trim(), email.value, password.value);
      if (!res.ok) {
        error.value = res.message || 'Registration failed';
        return;
      }
    } else {
      const res = await auth.login(email.value, password.value);
      if (!res.ok) {
        error.value = res.message || 'Invalid email or password';
        return;
      }
    }

    router.push('/');
  } catch (err) {
    error.value = 'Something went wrong. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

function toggleMode() {
  isRegister.value = !isRegister.value;
  error.value = '';
}

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value;
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- Background Elements -->
      <div class="background-elements">
        <div class="bg-shape shape-1"></div>
        <div class="bg-shape shape-2"></div>
        <div class="bg-shape shape-3"></div>
      </div>

      <!-- Auth Card -->
      <div class="auth-card">
        <!-- Header -->
        <div class="auth-header">
          <div class="logo-section">
            <div class="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none" />
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none" />
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none" />
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none" />
              </svg>
            </div>
            <div class="logo-text">
              <span class="brand-name">Kanban Board</span>
              <span class="brand-tagline">Organize • Prioritize • Execute</span>
            </div>
          </div>

          <div class="auth-title">
            <h1 class="title">{{ isRegister ? 'Create your account' : 'Welcome back' }}</h1>
            <p class="subtitle">
              {{ isRegister ? 'Start organizing your projects today' : 'Sign in to continue to your boards' }}
            </p>
          </div>
        </div>

        <!-- Auth Form -->
        <form @submit.prevent="submit" class="auth-form">
          <!-- Name Field (Register only) -->
          <div v-if="isRegister" class="form-group">
            <label class="form-label">
              <svg class="label-icon" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Full Name
            </label>
            <div class="input-wrapper">
              <input v-model="name" type="text" class="form-input" placeholder="Enter your full name" required />
            </div>
          </div>

          <!-- Email Field -->
          <div class="form-group">
            <label class="form-label">
              <svg class="label-icon" viewBox="0 0 24 24" fill="none">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
              Email Address
            </label>
            <div class="input-wrapper">
              <input v-model="email" type="email" class="form-input" placeholder="Enter your email" required />
            </div>
          </div>

          <!-- Password Field -->
          <div class="form-group">
            <label class="form-label">
              <svg class="label-icon" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="12" cy="16" r="1" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
                <path
                  d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Password
            </label>
            <div class="input-wrapper password-wrapper">
              <input v-model="password" :type="showPassword ? 'text' : 'password'" class="form-input password-input"
                placeholder="Enter your password" required />
              <button type="button" class="password-toggle" @click="togglePasswordVisibility">
                <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none">
                  <path
                    d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.572 9.14351 13.1984C8.99264 12.8249 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4858 9.58525 10.1546 9.88 9.88"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M1 1L23 23" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="error-message">
            <svg class="error-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
              <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            <span>{{ error }}</span>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="submit-button" :disabled="isLoading" :class="{ 'loading': isLoading }">
            <svg v-if="isLoading" class="loading-spinner" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="31.416"
                stroke-dashoffset="31.416">
                <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416"
                  repeatCount="indefinite" />
                <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416"
                  repeatCount="indefinite" />
              </circle>
            </svg>
            <svg v-else-if="!isRegister" class="button-icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H15M10 17L15 12M15 12L10 7M15 12H3"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg v-else class="button-icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>{{ isLoading ? (isRegister ? 'Creating Account...' : 'Signing In...') : buttonText }}</span>
          </button>

          <!-- Mode Switch -->
          <div class="mode-switch">
            <p class="switch-text">{{ switchText }}</p>
            <button type="button" class="switch-button" @click="toggleMode">
              {{ isRegister ? 'Sign In' : 'Create Account' }}
            </button>
          </div>
        </form>

        <!-- Footer -->
        <div class="auth-footer">
          <p class="footer-text">
            By {{ isRegister ? 'creating an account' : 'signing in' }}, you agree to our
            <a href="#" class="footer-link">Terms of Service</a> and
            <a href="#" class="footer-link">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page Layout */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 24px;
  position: relative;
  overflow: hidden;
}

/* Background Elements */
.background-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  top: 70%;
  right: 15%;
  animation-delay: 2s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  top: 40%;
  right: 10%;
  animation-delay: 4s;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }

  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

/* Auth Container */
.auth-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
}

/* Auth Card */
.auth-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.5);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header */
.auth-header {
  padding: 40px 40px 32px;
  text-align: center;
  border-bottom: 1px solid rgba(241, 245, 249, 0.8);
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.logo-icon svg {
  width: 22px;
  height: 22px;
}

.logo-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.brand-name {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-tagline {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.auth-title {
  margin-bottom: 8px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

/* Form */
.auth-form {
  padding: 32px 40px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.label-icon {
  width: 16px;
  height: 16px;
  color: #64748b;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 16px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.8);
  color: #1e293b;
}

.form-input::placeholder {
  color: #9ca3af;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: white;
}

.password-wrapper {
  position: relative;
}

.password-input {
  padding-right: 50px;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: #64748b;
  transition: all 0.2s ease;
}

.password-toggle:hover {
  color: #374151;
  background: rgba(248, 250, 252, 0.8);
}

.password-toggle svg {
  width: 20px;
  height: 20px;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 24px;
  animation: shake 0.5s ease-in-out;
}

.error-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

@keyframes shake {

  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-5px);
  }

  75% {
    transform: translateX(5px);
  }
}

/* Submit Button */
.submit-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.submit-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
}

.submit-button:hover:not(:disabled)::before {
  left: 100%;
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.submit-button.loading {
  pointer-events: none;
}

.button-icon,
.loading-spinner {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Mode Switch */
.mode-switch {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(241, 245, 249, 0.8);
}

.switch-text {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 12px 0;
}

.switch-button {
  background: none;
  border: none;
  color: #667eea;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.switch-button:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #5a67d8;
}

/* Footer */
.auth-footer {
  padding: 24px 40px 32px;
  text-align: center;
  border-top: 1px solid rgba(241, 245, 249, 0.8);
  background: rgba(248, 250, 252, 0.5);
}

.footer-text {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.footer-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.footer-link:hover {
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 768px) {
  .auth-page {
    padding: 16px;
  }

  .auth-card {
    border-radius: 20px;
  }

  .auth-header,
  .auth-form,
  .auth-footer {
    padding-left: 24px;
    padding-right: 24px;
  }

  .title {
    font-size: 24px;
  }

  .subtitle {
    font-size: 14px;
  }

  .logo-section {
    flex-direction: column;
    gap: 8px;
  }

  .logo-text {
    align-items: center;
    text-align: center;
  }
}

@media (max-width: 480px) {

  .auth-header,
  .auth-form,
  .auth-footer {
    padding-left: 20px;
    padding-right: 20px;
  }

  .form-input {
    font-size: 16px;
    /* Prevent zoom on iOS */
  }

  .bg-shape {
    display: none;
    /* Hide background shapes on very small screens */
  }
}

/* Focus States */
.submit-button:focus-visible,
.switch-button:focus-visible,
.password-toggle:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

.form-input:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .auth-card {
    background: white;
    border: 2px solid #000;
  }

  .form-input {
    border: 2px solid #000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>