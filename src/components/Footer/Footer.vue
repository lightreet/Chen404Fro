<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-left">
          <div class="footer-brand">
            <img src="/Chen404logo.svg" alt="Chen404" class="footer-logo" />
            <div class="footer-text">
              <p class="copyright">
                © {{ currentYear }} Chen404 Blog. All rights reserved.
              </p>
              <p class="powered">
                Powered by Vue 3 + Spring Boot
              </p>
            </div>
          </div>
        </div>
        <div class="footer-right">
          <a href="#" class="footer-link">GitHub</a>
          <a href="#" class="footer-link">RSS</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear();
</script>

<style scoped lang="scss">
.footer {
  padding: 24px 0;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.footer-left {
  .footer-brand {
    display: flex;
    align-items: center;
    gap: 12px;

    .footer-logo {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }
  }

  .footer-text p {
    margin: 0;
    color: var(--text-tertiary);
    font-size: 14px;

    & + p {
      margin-top: 4px;
    }
  }
}

.footer-right {
  display: flex;
  gap: 16px;
}

.footer-link {
  color: var(--text-secondary);
  font-size: 14px;
  text-decoration: none;
  transition: color 0.3s;

  &:hover {
    color: var(--primary);
  }
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
}
</style>
