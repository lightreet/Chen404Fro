<template>
  <DefaultLayout>
    <div class="guestbook-page">
      <div class="page-header">
        <h1 class="page-title">留言板</h1>
        <p class="page-desc">欢迎留言交流 💬</p>
      </div>

      <div class="guestbook-content">
        <!-- 留言表单 -->
        <div class="comment-form card">
          <h3 class="form-title">发表评论</h3>
          <el-form :model="form" label-position="top">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="昵称">
                  <el-input v-model="form.name" placeholder="请输入昵称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="邮箱">
                  <el-input v-model="form.email" placeholder="请输入邮箱" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="内容">
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="4"
                placeholder="写下你的留言..."
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitComment">发表评论</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 留言列表 -->
        <div class="comments-list">
          <div class="comments-header">
            <span class="comments-count">{{ comments.length }} 条留言</span>
          </div>

          <div
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item card"
          >
            <div class="comment-avatar">
              {{ comment.author_name?.charAt(0).toUpperCase() }}
            </div>
            <div class="comment-body">
              <div class="comment-header">
                <span class="author-name">{{ comment.author_name }}</span>
                <span class="comment-time">{{ formatDate(comment.createTime) }}</span>
              </div>
              <p class="comment-content">{{ comment.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { formatDate } from '@/utils/format';

const form = ref({
  name: '',
  email: '',
  content: '',
});

const comments = ref([
  {
    id: 1,
    author_name: '访客A',
    content: '博客设计得很漂亮，期待更多文章！',
    createTime: '2024-03-15',
  },
  {
    id: 2,
    author_name: '开发者B',
    content: '技术栈选得很棒，学习了！',
    createTime: '2024-03-14',
  },
]);

const submitComment = () => {
  // TODO: 实现提交逻辑
  console.log('提交留言:', form.value);
};
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

.card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 20px;
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
  color: var(--text-primary);
}

.comments-header {
  margin-bottom: 20px;
  padding: 0 4px;
}

.comments-count {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.comment-item {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.comment-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.author-name {
  font-weight: 600;
  color: var(--text-primary);
}

.comment-time {
  font-size: 13px;
  color: var(--text-tertiary);
}

.comment-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
}
</style>
