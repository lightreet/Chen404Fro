import { nextTick, ref, watch, type Ref } from 'vue';
import type { ExposeParam, HeadList } from 'md-editor-v3';

/** 复用编辑器解析的标题与行号，目录导航不依赖预览 DOM 或浮层定位。 */
export function useArticleOutline(editorRef: Ref<ExposeParam | undefined>, hostRef: Ref<HTMLElement | null>) {
  const headings = ref<HeadList[]>([]);
  const activeLine = ref<number | null>(null);
  const collapsed = ref(false);

  function syncActiveHeading() {
    const view = editorRef.value?.getEditorView();
    if (!view || !headings.value.length) {
      activeLine.value = null;
      return;
    }
    const scroller = view.scrollDOM;
    if (scroller.scrollHeight > scroller.clientHeight && scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2) {
      activeLine.value = headings.value[headings.value.length - 1]?.line ?? null;
      return;
    }
    const block = view.lineBlockAtHeight(view.scrollDOM.scrollTop + 16);
    const line = view.state.doc.lineAt(block.from).number - 1;
    let current = headings.value[0];
    for (const heading of headings.value) {
      if (heading.line > line) break;
      current = heading;
    }
    activeLine.value = current?.line ?? null;
  }

  function updateHeadings(list: HeadList[]) {
    headings.value = list;
    void nextTick(syncActiveHeading);
  }

  function navigateToHeading(heading: HeadList) {
    const editor = editorRef.value;
    const view = editor?.getEditorView();
    if (!editor || !view || heading.line >= view.state.doc.lines) return;
    const line = view.state.doc.line(heading.line + 1);
    // 只移动编辑区光标，避免编辑器的 scrollIntoView 连带滚动整页。
    view.dispatch({ selection: { anchor: line.from } });
    view.focus();
    view.scrollDOM.scrollTo({ top: view.lineBlockAt(line.from).top });
    hostRef.value?.scrollIntoView({ block: 'start' });
    activeLine.value = heading.line;
  }

  watch(editorRef, async editor => {
    await nextTick();
    editor?.domEventHandlers({ scroll: syncActiveHeading });
    syncActiveHeading();
  }, { flush: 'post' });

  return { headings, activeLine, collapsed, updateHeadings, navigateToHeading };
}
