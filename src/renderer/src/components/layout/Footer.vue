<template>
  <footer class="footer">
    <div class="footer-content">
      <span class="copyright">
        &copy; {{ currentYear }} JPSM - Jabatan Perhutanan Semenanjung Malaysia
      </span>
      <span class="version">
        PSOH Offline v{{ version }}
      </span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
const version = '1.0.0'
</script>

<style scoped>
.footer {
  padding: 15px 30px;
  background: #fff;
  border-top: 1px solid var(--gray-200);
  margin-top: auto;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--gray-600);
}

.version {
  color: var(--gray-500);
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}
</style>
