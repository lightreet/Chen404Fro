import { computed, ref, type Ref } from 'vue';
import type { Tag } from '@/types';

/**
 * 标签输入、候选标签与自定义标签的本地交互状态。
 */
export function useArticleTagSelector(tags: Ref<Tag[]>) {
  const formTagIds = ref<number[]>([]);
  const customTagNames = ref<string[]>([]);
  const newTagName = ref('');
  const showTagSuggestions = ref(false);
  let tagSuggestionsBlurTimer: ReturnType<typeof setTimeout> | null = null;

  const selectedTagNames = computed(() => {
    return formTagIds.value
      .map((id) => {
        const tag = tags.value.find((item) => Number(item.id) === id);
        return tag ? { id: Number(tag.id), name: tag.name } : null;
      })
      .filter((item): item is { id: number; name: string } => item != null);
  });

  const suggestedTags = computed(() => {
    return tags.value.filter((tag) => !formTagIds.value.includes(Number(tag.id)));
  });

  const addCustomTag = () => {
    const name = newTagName.value?.trim();
    if (!name) return;

    const existingTag = tags.value.find((tag) => tag.name === name);
    if (existingTag) {
      const existingId = Number(existingTag.id);
      if (!formTagIds.value.includes(existingId)) {
        formTagIds.value = [...formTagIds.value, existingId];
      }
      newTagName.value = '';
      return;
    }

    if (customTagNames.value.includes(name)) {
      newTagName.value = '';
      return;
    }

    customTagNames.value = [...customTagNames.value, name];
    newTagName.value = '';
  };

  const removeCustomTag = (name: string) => {
    customTagNames.value = customTagNames.value.filter((item) => item !== name);
  };

  const removeTagById = (id: number) => {
    formTagIds.value = formTagIds.value.filter((item) => item !== id);
  };

  const addTagById = (id: number) => {
    const nextId = Number(id);
    if (formTagIds.value.includes(nextId)) return;
    formTagIds.value = [...formTagIds.value, nextId];
  };

  const setSelectedTagIds = (tagIds: number[]) => {
    formTagIds.value = [...tagIds];
  };

  const setCustomTagNames = (tagNames: string[]) => {
    customTagNames.value = [...tagNames];
  };

  const onTagsInputBlur = () => {
    tagSuggestionsBlurTimer = setTimeout(() => {
      showTagSuggestions.value = false;
      tagSuggestionsBlurTimer = null;
    }, 150);
  };

  const onTagsWrapMouseEnter = () => {
    if (tagSuggestionsBlurTimer) {
      clearTimeout(tagSuggestionsBlurTimer);
      tagSuggestionsBlurTimer = null;
    }
    showTagSuggestions.value = true;
  };

  const onTagsWrapMouseLeave = () => {
    if (tagSuggestionsBlurTimer) {
      clearTimeout(tagSuggestionsBlurTimer);
      tagSuggestionsBlurTimer = null;
    }
    showTagSuggestions.value = false;
  };

  const cleanupTagSelector = () => {
    if (tagSuggestionsBlurTimer) {
      clearTimeout(tagSuggestionsBlurTimer);
      tagSuggestionsBlurTimer = null;
    }
  };

  return {
    formTagIds,
    customTagNames,
    newTagName,
    showTagSuggestions,
    selectedTagNames,
    suggestedTags,
    addCustomTag,
    removeCustomTag,
    removeTagById,
    addTagById,
    setSelectedTagIds,
    setCustomTagNames,
    onTagsInputBlur,
    onTagsWrapMouseEnter,
    onTagsWrapMouseLeave,
    cleanupTagSelector,
  };
}
