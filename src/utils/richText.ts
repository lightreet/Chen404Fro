import DOMPurify from 'dompurify'

/** 清理富文本的可执行内容；保留图片尺寸、代码、SVG 和数学公式所需的安全标记。 */
export function sanitizeRichTextHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['style', 'form'],
    RETURN_TRUSTED_TYPE: false,
  })
}
