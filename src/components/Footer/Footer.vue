<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-shell">
        <div class="footer-main">
          <div class="footer-brand" aria-label="站点信息">
            <img src="/logo.png" alt="Chen404" class="footer-logo" />
            <div>
              <p class="footer-title">{{ siteName }}</p>
              <p class="footer-subtitle">Chen404.cn</p>
            </div>
          </div>

          <div class="footer-links">
            <a class="footer-link" :href="githubLink" target="_blank" rel="noreferrer">GitHub</a>
            <router-link class="footer-link" to="/about">关于</router-link>
            <router-link class="footer-link" to="/guestbook">留言板</router-link>
          </div>
        </div>

        <div class="footer-info">
          <a class="footer-chip" href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
            {{ icpNumber }}
          </a>
          <span class="footer-chip">{{ siteDomain }} · {{ domainExpiresAt }}</span>
          <span class="footer-copyright">© {{ currentYear }} {{ siteName }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useSiteConfig } from '@/composables/useSiteConfig';

const DEFAULT_SITE_NAME = 'Chen404 Blog';
const DEFAULT_GITHUB_LINK = 'https://github.com/lightreet';
const DEFAULT_ICP_NUMBER = '湘ICP备2026010852号-1';
const SITE_DOMAIN = 'chen404.cn';
const DOMAIN_EXPIRES_AT = '2027.03.28';

const currentYear = new Date().getFullYear();
const { siteConfig, loadSiteConfig } = useSiteConfig();

const siteName = computed(() => siteConfig.value?.siteName?.trim() || DEFAULT_SITE_NAME);
const githubLink = computed(() => siteConfig.value?.github?.trim() || DEFAULT_GITHUB_LINK);
const icpNumber = computed(() => siteConfig.value?.icp?.trim() || DEFAULT_ICP_NUMBER);
const siteDomain = SITE_DOMAIN;
const domainExpiresAt = DOMAIN_EXPIRES_AT;

onMounted(() => {
  void loadSiteConfig();
});
</script>

<style scoped lang="scss">
.footer {
  position: relative;
  padding: 18px 0 22px;
  border-top: 1px solid rgba(225, 214, 222, 0.8);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.58), rgba(255, 248, 251, 0.72)),
    radial-gradient(circle at 50% 0, rgba(255, 221, 235, 0.16), transparent 44%);
  backdrop-filter: blur(10px);
}

.footer::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 12% 28%, rgba(255, 206, 226, 0.14), transparent 18%),
    radial-gradient(circle at 86% 18%, rgba(209, 225, 255, 0.18), transparent 16%);
}

.container {
  max-width: min(1080px, calc(100% - 40px));
}

.footer-shell {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 12px;
  padding: 16px 18px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 22px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.78), rgba(255, 248, 251, 0.66)),
    radial-gradient(circle at right top, rgba(255, 226, 238, 0.2), transparent 34%);
  box-shadow:
    0 14px 34px rgba(210, 169, 188, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.84);
}

.footer-main,
.footer-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.footer-logo {
  width: 74px;
  height: 48px;
  flex-shrink: 0;
  object-fit: contain;
}

.footer-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.25;
  color: #563746;
}

.footer-subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: rgba(139, 95, 116, 0.74);
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 13px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.72);
  color: #745061;
  text-decoration: none;
  font-size: 13px;
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease,
    color 0.24s ease;
}

.footer-link:hover {
  color: var(--primary);
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(206, 166, 184, 0.12);
}

.footer-info {
  justify-content: flex-start;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid rgba(228, 216, 224, 0.72);
}

.footer-chip,
.footer-copyright {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 11px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.54);
  color: rgba(111, 83, 96, 0.82);
  font-size: 12px;
  line-height: 1;
}

.footer-chip {
  text-decoration: none;
}

.footer-chip:hover {
  color: var(--primary);
}

.footer-copyright {
  margin-left: auto;
  background: transparent;
  color: rgba(111, 83, 96, 0.76);
}

@media (max-width: 980px) {
  .footer-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .footer-info,
  .footer-links {
    justify-content: flex-start;
  }

  .footer-copyright {
    margin-left: 0;
  }
}

@media (max-width: 640px) {
  .footer {
    padding: 14px 0 18px;
  }

  .container {
    max-width: min(100% - 24px, 1080px);
  }

  .footer-shell {
    padding: 14px;
    border-radius: 18px;
  }

  .footer-title {
    font-size: 16px;
  }

  .footer-logo {
    width: 66px;
    height: 42px;
  }

  .footer-links {
    width: 100%;
  }

  .footer-link {
    justify-content: center;
    flex: 1 1 calc(50% - 6px);
  }

  .footer-chip,
  .footer-copyright {
    width: 100%;
    justify-content: center;
  }
}
</style>
