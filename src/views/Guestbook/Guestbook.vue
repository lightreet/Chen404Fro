<template>
  <DefaultLayout>
    <div class="guestbook-page">
      <div class="page-header">
        <h1 class="page-title">留言板</h1>
        <p class="page-desc">欢迎留言交流 💬</p>
      </div>

      <div class="guestbook-content">
        <CommentSection :can-comment="true" :comment-policy="3" />
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import CommentSection from '@/components/Comment/CommentSection.vue'
</script>

<style scoped lang="scss">
.guestbook-page {
  padding-top: 24px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.page-desc {
  font-size: 14px;
  color: var(--text-secondary);
}

.guestbook-content {
  max-width: 800px;
  margin: 0 auto;
}
</style>
