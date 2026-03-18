import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  // 与 global variables 对齐的主题 token（樱花粉 / 柔和二次元风）
  theme: {
    colors: {
      primary: '#fb7299',
      'primary-light': '#ff85a7',
      'primary-dark': '#e44d78',
      'primary-hover': '#ff9eb3',
    },
    borderRadius: {
      jp: '12px',
      'jp-lg': '16px',
    },
    boxShadow: {
      jp: '0 2px 8px rgba(0,0,0,0.06)',
      'jp-hover': '0 8px 24px rgba(251,114,153,0.15)',
    },
  },
  shortcuts: {
    // 卡片：圆角、阴影、背景用 CSS 变量以兼容明暗主题
    'jp-card':
      'rounded-jp overflow-hidden transition-all duration-300 bg-[var(--bg-secondary)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)]',
    'jp-card-hover': 'hover:-translate-y-1',
    // 标签 chip：统一灰色系，弱化色彩
    'jp-chip':
      'inline-flex items-center rounded-jp px-2.5 py-1 text-xs font-medium bg-[var(--border-light)] text-[var(--text-secondary)]',
    // Hero 区域
    'jp-hero':
      'relative py-16 md:py-24 text-center overflow-hidden',
    'jp-hero-title':
      'text-3xl md:text-4xl font-semibold text-[var(--text-primary)] tracking-tight',
    'jp-hero-desc':
      'mt-3 text-base md:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto',
    'jp-hero-accent':
      'text-[var(--primary)]',
    // 区块标题（如 Discovery）
    'jp-section-title':
      'flex items-center gap-3 text-2xl font-semibold text-[var(--text-primary)]',
    'jp-section-icon':
      'text-2xl text-[var(--primary)]',
    // 主按钮样式（与现有 load-more 一致）
    'jp-btn-primary':
      'min-w-40 h-11 rounded-full text-base font-medium bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] border-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(251,114,153,0.3)]',
  },
})
