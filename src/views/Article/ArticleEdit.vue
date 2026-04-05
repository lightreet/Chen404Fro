<template>
  <div ref="articleEditRootRef" class="article-edit-page">
    <!-- 顶部 fixed 栏（返回与草稿状态）；Markdown 工具栏在正文内 sticky，避免迁出 DOM 导致下拉失效 -->
    <header ref="editTopDockRef" class="edit-top-dock">
      <div class="edit-dock-row edit-dock-row--back">
        <button type="button" class="back-link" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </button>
        <div class="dock-back-meta">
          <span class="draft-hint">
            {{ form.status === ArticleStatus.PUBLISHED ? '已发布' : '草稿' }}
            · {{ form.title?.trim() ? form.title : '无标题' }}
          </span>
          <span class="autosave-text" :class="`is-${autoSaveState}`">
            {{ autoSaveStatusText }}
          </span>
        </div>
      </div>
    </header>

    <div class="edit-container">
      <!-- 正文纸媒：标题 → 分割线 → 编辑器（目录由 md-editor catalog 固定在左侧） -->
      <main class="edit-paper">
        <div class="paper-title-block">
          <el-input
            v-model="form.title"
            placeholder="请输入文章标题（5～100 个字）"
            size="large"
            class="paper-title-input"
            maxlength="100"
            show-word-limit
          />
        </div>
        <div class="paper-title-divider"></div>

        <div
          ref="paperEditorHostRef"
          class="paper-editor-host"
          @click.capture="onMdToolbarItemClickOpenDropdown"
        >
          <MdEditor
            ref="editorRef"
            v-model="form.content"
            :theme="editorTheme"
            :toolbars="toolbars"
            :preview="true"
            :previewComponent="MdResizablePreview"
            catalog-layout="flat"
            :catalog-max-depth="4"
            :offset-top="articleEditTopOffset + 16"
            :scroll-element-offset-top="articleEditTopOffset + 16"
            placeholder="开始编写正文，支持 Markdown…"
            @on-upload-img="onUploadImg"
          />
        </div>
      </main>

      <!-- 文章设置：始终在正文之后 -->
      <aside ref="settingsAnchorRef" class="edit-settings-after" id="article-edit-settings">
        <div class="sidebar-card settings-card">
          <h2 class="sidebar-title">文章设置</h2>

            <!-- 封面 -->
            <section class="sidebar-section cover-section">
              <div class="section-label">文章封面</div>
              <el-upload
                class="cover-uploader"
                :http-request="handleCoverUpload"
                :show-file-list="false"
                :before-upload="beforeCoverUpload"
                accept="image/*"
              >
                <img v-if="form.coverImage" :src="form.coverImage" class="cover-preview" />
                <div v-else class="cover-placeholder">
                  <el-icon><Plus /></el-icon>
                  <span>点击上传封面</span>
                  <span class="cover-tip">建议尺寸 1200×630，支持 GIF 动图</span>
                </div>
              </el-upload>
              <el-button
                v-if="form.coverImage"
                type="danger"
                link
                size="small"
                @click="form.coverImage = ''"
                class="remove-cover"
              >
                移除封面
              </el-button>
            </section>

            <!-- 分类 -->
            <section class="sidebar-section meta-section category-section">
              <label class="meta-section-label">选择分类</label>
              <div class="category-grid">
                <button
                  v-for="category in categories"
                  :key="category.id"
                  type="button"
                  class="category-card"
                  :class="{ selected: form.categoryId === category.id }"
                  @click="form.categoryId = category.id"
                >
                  <Icon
                    class="category-card-icon"
                    :icon="resolveCategoryIcon(category.icon || 'mdi:folder')"
                    width="14"
                    height="14"
                  />
                  {{ category.name }}
                </button>
              </div>
              <p v-if="categories.length === 0" class="form-tip">
                暂无分类，请先在
                <router-link to="/profile">个人中心</router-link>
                → 分类管理 中添加（需管理员账号）。
              </p>
            </section>

            <!-- 标签 -->
            <section class="sidebar-section meta-section tags-section">
              <label class="meta-section-label">标签</label>
              <div
                class="tags-input-wrap"
                @mouseenter="onTagsWrapMouseEnter"
                @mouseleave="onTagsWrapMouseLeave"
              >
                <el-input
                  v-model="newTagName"
                  placeholder="输入标签，按回车添加"
                  size="large"
                  clearable
                  class="tags-input"
                  @keyup.enter="addCustomTag"
                  @focus="showTagSuggestions = true"
                  @blur="onTagsInputBlur"
                />
                <Transition name="suggest-fade">
                  <div
                    v-show="showTagSuggestions && suggestedTags.length > 0"
                    class="tag-suggestions"
                    @mousedown.prevent
                  >
                    <div class="tag-suggestions-title">常用标签</div>
                    <div class="tag-suggestions-list">
                      <button
                        v-for="tag in suggestedTags"
                        :key="tag.id"
                        type="button"
                        class="tag-suggestion-item"
                        @mousedown="addTagById(tag.id)"
                      >
                        {{ tag.name }}
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>
              <div v-if="selectedTagNames.length > 0 || customTagNames.length > 0" class="chips-wrap">
                <span
                  v-for="item in selectedTagNames"
                  :key="`id-${item.id}`"
                  class="chip"
                >
                  {{ item.name }}
                  <button type="button" class="chip-remove" aria-label="移除" @click="removeTagById(item.id)">×</button>
                </span>
                <span
                  v-for="name in customTagNames"
                  :key="`name-${name}`"
                  class="chip"
                >
                  {{ name }}
                  <button type="button" class="chip-remove" aria-label="移除" @click="removeCustomTag(name)">×</button>
                </span>
              </div>
            </section>

            <!-- 摘要 -->
            <section class="sidebar-section summary-section">
              <label class="section-label">内容摘要</label>
              <el-input
                v-model="form.summary"
                type="textarea"
                :rows="3"
                placeholder="选填，不填将自动提取正文前200字"
                maxlength="500"
                show-word-limit
              />
            </section>

            <!-- 高级设置（可折叠） -->
            <section class="sidebar-section advanced-section">
              <button
                type="button"
                class="advanced-toggle"
                @click="advancedOpen = !advancedOpen"
              >
                <span>高级设置</span>
                <el-icon class="toggle-icon" :class="{ open: advancedOpen }"><ArrowDown /></el-icon>
              </button>
              <Transition name="slide-down">
                <div v-show="advancedOpen" class="advanced-content">
                  <div class="advanced-field">
                    <label class="advanced-field-label">文章可见性</label>
                    <el-select v-model="form.visibility" class="advanced-select">
                      <el-option
                        v-for="item in visibilityOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </div>
                  <div class="advanced-field">
                    <label class="advanced-field-label">评论策略</label>
                    <el-select v-model="form.commentPolicy" class="advanced-select">
                      <el-option
                        v-for="item in commentPolicyOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </div>
                  <el-checkbox
                    v-if="canSetArticleTop"
                    v-model="form.isTop"
                    :true-value="1"
                    :false-value="0"
                  >
                    置顶文章
                  </el-checkbox>
                </div>
              </Transition>
            </section>
        </div>
      </aside>
    </div>

    <!-- 底部固定操作栏（参考 CSDN 发文条） -->
    <footer ref="editFooterRef" class="edit-footer-bar">
      <div class="footer-left">
        <span class="footer-word-count">共 {{ contentCharCount }} 字</span>
        <span class="footer-hint">正文与设置修改后请及时保存</span>
        <button type="button" class="footer-settings-link" @click="scrollToArticleSettings">
          发文设置
        </button>
      </div>
      <div class="footer-actions">
        <button
          type="button"
          class="footer-btn footer-btn--ghost"
          @click="handleSaveDraft"
          :disabled="isDraftSaving"
        >
          保存草稿
        </button>
        <el-button type="primary" class="footer-publish" @click="handlePublish" :loading="publishing">
          {{ form.status === ArticleStatus.PUBLISHED ? '更新发布' : '发布文章' }}
        </el-button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { resolveCategoryIcon } from '@/utils/categoryIcon';
import { ArrowLeft, ArrowDown, Plus } from '@element-plus/icons-vue';
import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import { ArticleStatus } from '@/types';
import MdResizablePreview from '@/components/MdResizablePreview/MdResizablePreview.vue';
import { useArticleEdit } from '@/composables/article-edit/useArticleEdit';

const {
  articleEditRootRef,
  editTopDockRef,
  editFooterRef,
  articleEditTopOffset,
  settingsAnchorRef,
  paperEditorHostRef,
  editorRef,
  canSetArticleTop,
  onMdToolbarItemClickOpenDropdown,
  goBack,
  scrollToArticleSettings,
  editorTheme,
  toolbars,
  form,
  contentCharCount,
  visibilityOptions,
  commentPolicyOptions,
  customTagNames,
  newTagName,
  showTagSuggestions,
  advancedOpen,
  categories,
  isDraftSaving,
  publishing,
  autoSaveState,
  handleCoverUpload,
  beforeCoverUpload,
  onUploadImg,
  handleSaveDraft,
  handlePublish,
  autoSaveStatusText,
  addCustomTag,
  removeCustomTag,
  selectedTagNames,
  suggestedTags,
  removeTagById,
  addTagById,
  onTagsInputBlur,
  onTagsWrapMouseEnter,
  onTagsWrapMouseLeave,
} = useArticleEdit();

/** 仅模板使用；满足 noUnusedLocals（布局测量在 composable 内消费这些 ref） */
void [
  articleEditRootRef,
  editTopDockRef,
  editFooterRef,
  articleEditTopOffset,
  settingsAnchorRef,
  paperEditorHostRef,
];

defineExpose({ editorRef });
</script>

<style scoped lang="scss">
@use './article-edit/ArticleEdit.styles.scss' as *;
</style>
