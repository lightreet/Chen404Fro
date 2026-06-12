# Chen404 前端 UI 架构迁移方案

本文档用于指导 `Chen404Fro` 从当前“自定义页面 + Element Plus 辅助”的 UI 结构，迁移到“自有设计系统 + primitive 组件层 + 统一图标与动效语言”的前端体系。

这不是一次单纯的“换组件库”，而是一次 **UI 基础设施升级**。目标不是把 `Element Plus` 机械替换成另一套库，而是让 Chen404 形成真正可复用、可扩展、可持续演进的前端设计系统。

## 1. 迁移背景

当前前端已经具备明显的产品个性，尤其是在以下区域：

- 首页 Hero 与文章流
- Sakura Radio 音乐馆
- 旅行纪念地图与旅行详情
- Live2D / Lyra 相关交互

但与此同时，很多工作台、后台、表单与列表类页面仍然大量直接使用 `Element Plus` 默认能力，导致整体视觉存在明显割裂：

- 前台页面更偏“品牌化内容站”
- 后台与工作台页面更偏“标准管理后台”
- 页面级设计感存在，但底层组件语言不统一
- 图标、表单、浮层、反馈、动效缺少统一的系统层

因此，本次迁移的核心问题不是“Vue 要不要换成 Next.js”，而是：

1. 如何建立 Chen404 自己的 UI primitive 层
2. 如何减少 `Element Plus` 的默认后台味
3. 如何沉淀统一 token、图标、动效与交互语言
4. 如何在不打断现有业务的前提下渐进迁移

## 2. 迁移目标

## 2.1 总目标

将前端升级为如下结构：

```text
Route / Page
  -> Feature Components
    -> App Components
      -> UI Primitives
        -> Tokens / Motion / Icons / Theme
```

迁移完成后，应具备以下能力：

- 前台、后台、工作台共享同一套底层设计语言
- 页面不再直接大面积依赖 `Element Plus` 默认视觉
- 颜色、圆角、阴影、间距、字号、动效拥有统一 token
- 图标具备统一风格入口
- 浮层、表单、按钮、输入、分段、分页、表格等基础能力具备统一封装
- 后续新增页面默认使用 `App*` / `Ui*` 体系，而不是重新“就地搭样式”

## 2.2 非目标

以下事项 **不属于本次迁移的核心目标**：

- 不强制把 `Vue` 迁移到 `React` / `Next.js`
- 不重构 API、路由、Pinia、业务分层
- 不在第一阶段改写地图、音乐、AI 等业务逻辑
- 不要求一次性移除全部 `Element Plus`
- 不把所有复杂控件立即自研到底层实现

## 3. 分支策略

本次迁移应在单独分支推进，避免干扰日常业务开发。

建议主分支名称：

```text
refactor/ui-system-migration
```

如迁移周期较长，可继续拆分子分支：

```text
refactor/ui-foundation
refactor/ui-primitives
refactor/ui-admin-migration
refactor/ui-content-migration
refactor/ui-memory-map-migration
```

建议原则：

- 主迁移分支只做 UI 基础设施与页面迁移
- 业务功能继续在原开发线推进
- 基础层稳定后，按页面或模块逐步合并
- 不要在一个 PR 中同时做“换组件体系 + 改业务逻辑 + 调接口协议”

## 4. 当前前端组件与依赖现状

## 4.1 当前技术栈

当前前端核心栈：

- `Vue 3`
- `Vite`
- `TypeScript`
- `Vue Router`
- `Pinia`
- `Sass`
- `UnoCSS`
- `Element Plus`
- `@element-plus/icons-vue`
- `@iconify/vue`

辅助能力：

- `md-editor-v3`
- `swiper`
- `echarts`
- `music-metadata`
- 地图相关：`d3-geo`、`@svg-maps/china`、`china-map-geojson`

## 4.2 当前 UI 架构特点

当前前端更接近：

- 页面壳、Hero、内容卡片、地图、Live2D 等由项目自定义实现
- 表单、输入、按钮、分页、弹窗、标签、上传等大量依赖 `Element Plus`
- 样式来源混合：
  - `SCSS`
  - CSS Variables
  - `UnoCSS`
  - `Element Plus` 默认组件样式

问题不在于“没有自定义 UI”，而在于：

- 自定义 UI 主要集中在页面层
- 基础组件层不够强
- 管理与工具类页面退回到标准后台范式

## 4.3 当前应保留并增强的自定义组件

以下组件属于 Chen404 的品牌资产，不应简单替换，应在迁移中保留并接入新体系：

### 页面骨架与品牌表达

- `layouts/DefaultLayout.vue`
- `components/Header/Header.vue`
- `components/Footer/Footer.vue`
- `components/PageHero/PageHero.vue`
- `components/PageHero/HeroSubtitlePulse.vue`
- `components/HeroWave/HeroWave.vue`
- `components/SakuraOverlay/SakuraOverlay.vue`
- `components/FeatureAccessCover.vue`

### 内容与交互组件

- `components/ArticleCard/ArticleCard.vue`
- `components/HomeDiscoverySearch/HomeDiscoverySearch.vue`
- `components/Comment/CommentSection.vue`
- `components/Comment/CommentItem.vue`
- `components/UserProfile/UserProfileCard.vue`
- `components/UserProfile/UserProfilePopover.vue`

### 专题能力组件

- `components/TravelMemoryMap/TravelMemoryMap.vue`
- `components/Live2D/Live2D.vue`
- `components/Live2D/Live2DChatPanel.vue`
- `components/Live2D/Live2DMusicPanel.vue`
- `components/CategoryIcon/CategoryIcon.vue`
- `components/HeroImageFocusEditor/HeroImageFocusEditor.vue`
- `components/MdResizablePreview/MdResizablePreview.vue`
- `components/Emoji/EmojiPickerPanel.vue`
- `components/Editor/MdEditorEmojiToolbar.vue`
- `components/Editor/MdEditorUnorderedListToolbar.vue`

迁移原则：

- 保留其业务语义与页面角色
- 去除内部对旧按钮、旧图标、旧交互的散落依赖
- 接入新的 token、icon、motion 和 primitive

## 4.4 当前页面中的 Element Plus 使用重灾区

以下页面是迁移重点：

### 后台 / 工作台类

- `views/Admin/AdminSiteSettings.vue`
- `views/Admin/AdminCategories.vue`
- `views/Admin/AdminFiles.vue`
- `views/Admin/AdminEmojiManager.vue`
- `views/Admin/AdminTrustRequests.vue`
- `views/Admin/components/AiAssistantSettings.vue`

### 编辑 / 表单类

- `views/Article/ArticleEdit.vue`
- `views/Music/MusicTrackEdit.vue`
- `views/MemoryMap/TravelMemoryCreate.vue`
- `views/Profile/Profile.vue`
- `views/Profile/ProfileTrustRequestPanel.vue`

### 复杂产品页中仍混有大量基础组件依赖

- `views/Music/Music.vue`
- `views/MemoryMap/MemoryMap.vue`
- `views/MemoryMap/TravelMemoryDetail.vue`
- `views/Article/ArticleDetail.vue`

## 5. 当前 Element Plus 依赖盘点

下表用于判断哪些组件需要优先迁出。

| 类别 | 当前使用 | 迁移优先级 | 说明 |
| --- | --- | --- | --- |
| 按钮 | `el-button` | 高 | 最强后台味来源之一 |
| 输入 | `el-input` | 高 | 表单、搜索、编辑页全局高频 |
| 表单 | `el-form` / `el-form-item` | 高 | 默认结构与视觉都偏后台 |
| 卡片 | `el-card` | 高 | 后台页面大量使用，最易形成管理台观感 |
| 标签 | `el-tag` | 高 | 状态展示语义需要自定义统一化 |
| 分页 | `el-pagination` | 高 | 多处列表页使用，样式应统一 |
| 标签页 | `el-tabs` / `el-tab-pane` | 高 | 后台页观感明显受其影响 |
| 弹层 | `el-dialog` | 高 | 交互节奏和视觉都应统一 |
| 表格 | `el-table` / `el-table-column` | 高 | 后台感极强，需重点处理 |
| 选择器 | `el-select` / `el-option` | 中 | 需统一输入体系 |
| 开关 | `el-switch` | 中 | 状态件，后续统一到系统控件 |
| 勾选 | `el-checkbox` | 中 | 与表单体系一起统一 |
| 日期 | `el-date-picker` | 中 | 可先包一层，暂不急于重写内核 |
| 上传 | `el-upload` | 中 | 可先包一层，统一外观和交互 |
| 空态 | `el-empty` | 中 | 建议替换为项目自定义空态组件 |
| 提示 | `el-tooltip` | 中 | 统一浮层语言即可 |
| 分段 | `el-segmented` | 中 | 产品型页面中很重要，建议自定义 |
| 滑块 | `el-slider` | 中 | 先包一层，短期不必完全重写 |
| 骨架 | `el-skeleton` | 低 | 可在后期统一到自定义 skeleton 系统 |
| 加载 | `v-loading` | 中 | 需要项目统一 loading 语义 |
| 消息 | `ElMessage` | 中 | 需收敛到统一通知服务 |
| 确认框 | `ElMessageBox` | 中 | 需收敛到统一 confirm 服务 |

## 6. 迁移后的目标分层

## 6.1 目录结构建议

建议新增如下结构：

```text
src/
├─ design/
│  ├─ tokens.ts
│  ├─ motion.ts
│  ├─ theme.ts
│  └─ icon-map.ts
├─ components/
│  ├─ ui/
│  │  ├─ button/
│  │  ├─ input/
│  │  ├─ textarea/
│  │  ├─ select/
│  │  ├─ switch/
│  │  ├─ checkbox/
│  │  ├─ tabs/
│  │  ├─ dialog/
│  │  ├─ tooltip/
│  │  ├─ badge/
│  │  ├─ empty/
│  │  ├─ divider/
│  │  ├─ pagination/
│  │  ├─ upload/
│  │  ├─ date-field/
│  │  ├─ slider/
│  │  ├─ table/
│  │  ├─ panel/
│  │  └─ icon/
│  ├─ app/
│  │  ├─ AppSection/
│  │  ├─ AppActionBar/
│  │  ├─ AppFilterBar/
│  │  ├─ AppStatusPill/
│  │  ├─ AppEmptyState/
│  │  ├─ AppMetaRow/
│  │  └─ AppHero/
│  └─ ...现有业务组件
├─ features/
│  ├─ article/
│  ├─ music/
│  ├─ memory-map/
│  ├─ comments/
│  ├─ profile/
│  └─ admin/
└─ assets/styles/
   ├─ tokens.scss
   ├─ theme.css
   └─ global.scss
```

## 6.2 三层组件模型

### `components/ui`

最低层 primitive，不带业务语义，只提供稳定交互与统一视觉规则。

例如：

- `UiButton`
- `UiInput`
- `UiDialog`
- `UiTabs`
- `UiPanel`
- `UiBadge`

### `components/app`

Chen404 项目的风格层，承接产品语言和品牌表达。

例如：

- `AppSection`
- `AppActionBar`
- `AppEmptyState`
- `AppStatusPill`
- `AppMetaRow`

### `features`

业务组合层，不再直接面向底层库，而是消费 `ui` + `app`。

例如：

- 文章编辑侧边工具栏
- 音乐馆筛选条
- 旅行地图详情 rail
- 后台站点配置分区容器

## 7. Token 体系迁移

## 7.1 当前问题

虽然当前已有：

- `assets/styles/variables.scss`
- 全局 CSS Variables
- `DESIGN.md`

但仍存在以下问题：

- 颜色、阴影、圆角没有完全形成稳定命名体系
- 页面级样式仍有较多直接写死值
- 动效没有独立 token 层
- 页面 register 没有工程化表达

## 7.2 目标

形成统一 token 体系，至少覆盖：

- `color`
- `surface`
- `text`
- `border`
- `radius`
- `space`
- `shadow`
- `font-size`
- `line-height`
- `z-index`
- `motion-duration`
- `motion-easing`

## 7.3 建议命名

应优先使用语义化命名，而不是页面局部命名：

```text
--color-accent
--color-accent-soft
--color-surface
--color-surface-muted
--color-surface-elevated
--color-border
--color-text-primary
--color-text-secondary
--radius-sm
--radius-md
--radius-lg
--shadow-sm
--shadow-md
--motion-duration-fast
--motion-duration-base
--motion-ease-standard
```

## 8. 图标体系迁移

## 8.1 当前问题

当前图标来源混合：

- `@element-plus/icons-vue`
- `Iconify + mdi`

问题：

- 风格不统一
- 线条粗细不统一
- 部分页面更像后台，部分页面更像内容站

## 8.2 目标

统一图标入口，不允许业务页面直接散落引用第三方图标。

建议新增：

```text
src/components/ui/icon/UiIcon.vue
src/design/icon-map.ts
```

## 8.3 迁移原则

### 短期

- 保留现有图标库能力
- 页面侧统一改为使用 `UiIcon`
- 将高频操作图标映射为统一语义

### 中期

- 收敛到单一主图标语言
- 装饰图标与功能图标分离
- 仅保留少量业务特殊图标例外

## 9. 动效体系迁移

## 9.1 当前问题

当前项目已有不少不错的局部动效：

- Hero 过渡
- 卡片 hover lift
- 图片缩放
- 滚动浮动
- reduced motion 适配

但仍缺少统一 motion system：

- 页面切换动效没有统一语言
- 列表切换、浮层进出、面板展开没有统一规范
- 动效参数主要散落在局部组件中

## 9.2 目标

新增动效 token 与通用模式：

- `fade`
- `raise`
- `stagger`
- `press`
- `panel-enter`
- `list-reflow`
- `drawer-slide`

建议沉淀：

```text
src/design/motion.ts
src/composables/useMotionPreset.ts
```

## 10. 迁移阶段计划

## 阶段 0：准备期

目标：建立迁移隔离环境与执行规则。

### 任务

- 创建迁移分支
- 明确目录与命名约定
- 冻结“页面直接新增 Element Plus 依赖”的开发习惯
- 约定新页面优先走 `ui` / `app` 层

### 产出

- 独立分支
- 迁移文档（本文）
- 组件命名规范

## 阶段 1：地基搭建

目标：建立 token、icon、feedback、motion 基础设施。

### 任务

- 迁移并统一颜色、阴影、圆角、间距变量
- 建立 `design/tokens.ts`
- 建立 `UiIcon`
- 建立通知与确认服务：
  - `notify.*`
  - `confirmAction()`
- 建立 motion token

### 验收标准

- 新增页面不再直接引 `ElMessage`
- 新图标不再直接散落从第三方库引入
- token 命名可覆盖现有绝大多数视觉变量

## 阶段 2：基础 primitive 第一批

目标：先替掉最强后台味来源。

### 第一批必做组件

- `UiButton`
- `UiInput`
- `UiTextarea`
- `UiPanel`
- `UiTabs`
- `UiDialog`
- `UiBadge`
- `UiEmpty`
- `UiTooltip`
- `UiPagination`

### 实施原则

- 短期允许内部仍复用 Element Plus
- 对外只暴露项目自己的 API
- 样式统一走 token

### 验收标准

- 后台与工作台类页面已经可以在不直接写 `el-button` / `el-input` 的前提下开发

## 阶段 3：后台与工作台迁移

目标：最快消除“标准管理后台感”。

### 优先页面

1. `AdminSiteSettings.vue`
2. `AdminCategories.vue`
3. `AdminFiles.vue`
4. `AdminEmojiManager.vue`
5. `AdminTrustRequests.vue`
6. `Admin/components/AiAssistantSettings.vue`

### 重点替换

- `el-card` -> `UiPanel` / `AppSection`
- `el-tabs` -> `UiTabs`
- `el-form` / `el-form-item` -> `UiFormField` / 表单容器方案
- `el-table` -> `UiTable` 或自定义列表表格壳
- `el-tag` -> `UiBadge` / `AppStatusPill`

### 验收标准

- 后台页不再呈现明显的 Element 默认风格
- 标题、工具栏、分区、状态件、表单、列表具备统一语言

## 阶段 4：表单与编辑页迁移

目标：统一复杂交互与录入体验。

### 优先页面

1. `ArticleEdit.vue`
2. `MusicTrackEdit.vue`
3. `TravelMemoryCreate.vue`
4. `Profile.vue`
5. `ProfileTrustRequestPanel.vue`

### 重点替换

- 输入组件体系
- 日期选择体系
- 上传组件体系
- 分段选择、切换、校验与错误提示

### 验收标准

- 编辑类页面共享统一按钮、输入、上传、字段标题与错误提示语言

## 阶段 5：产品型页面迁移

目标：统一复杂产品表面，而不是仅做后台页去 Element。

### 优先页面

1. `Music.vue`
2. `ArticleDetail.vue`
3. `MemoryMap.vue`
4. `TravelMemoryDetail.vue`

### 重点

- 搜索条、筛选条、操作条统一
- 空态、加载态、分页态统一
- 分段切换、浮层、状态提示统一

## 阶段 6：专题与全站收尾

目标：补齐全站一致性。

### 收尾内容

- `Category.vue`
- `Tag.vue`
- `CategoryDetail.vue`
- `TagDetail.vue`
- `Guestbook.vue`
- `About.vue`
- `UserProfile.vue`
- `TrustRequest.vue`
- `NotFound.vue`

### 收尾动作

- 统一空态
- 统一 loading
- 统一 icon 使用
- 统一 motion 参数
- 清理旧样式和废弃封装

## 11. 具体迁移映射表

| 当前 Element 能力 | 迁移目标 | 策略 |
| --- | --- | --- |
| `el-button` | `UiButton` / `AppActionButton` | 优先替换 |
| `el-input` | `UiInput` / `UiTextarea` | 优先替换 |
| `el-card` | `UiPanel` / `AppSection` | 优先替换 |
| `el-tabs` | `UiTabs` | 优先替换 |
| `el-dialog` | `UiDialog` | 优先替换 |
| `el-tag` | `UiBadge` / `AppStatusPill` | 优先替换 |
| `el-pagination` | `UiPagination` | 优先替换 |
| `el-table` | `UiTable` / `AppDataTable` | 先包后换 |
| `el-select` | `UiSelect` | 中期替换 |
| `el-switch` | `UiSwitch` | 中期替换 |
| `el-checkbox` | `UiCheckbox` | 中期替换 |
| `el-date-picker` | `UiDateField` | 先包后换 |
| `el-upload` | `UiUpload` | 先包后换 |
| `el-slider` | `UiSlider` | 先包后换 |
| `el-tooltip` | `UiTooltip` | 中期统一 |
| `el-empty` | `UiEmpty` | 中期统一 |
| `v-loading` | `UiLoadingState` | 中期统一 |
| `ElMessage` | `notify.*` | 立即收敛 |
| `ElMessageBox` | `confirmAction()` | 立即收敛 |

## 12. 风险与应对

## 12.1 风险：一次性重写过大

应对：

- 坚持按页面分批迁移
- 先搭基建再动页面
- 不与业务逻辑重构混做

## 12.2 风险：新组件层只是“换壳”

应对：

- 新 primitive 必须有稳定 API
- 禁止只做样式复制，不做语义抽象
- 在 `ui` 层处理状态、尺寸、变体、禁用、加载等通用问题

## 12.3 风险：前台做得很美，后台仍像后台

应对：

- 后台页作为第一优先迁移对象
- 优先解决 `card / form / table / tabs / button`

## 12.4 风险：Element Plus 永远删不掉

应对：

- 允许短期包裹复用
- 但业务页面必须停止直接依赖
- 后续逐步替换底层实现，而不是继续扩散直接使用

## 13. 验收标准

迁移不以“删掉多少 Element Plus”作为唯一指标，而应同时满足以下条件：

### 设计系统层

- token 完整且被实际使用
- 图标使用有统一入口
- 消息与确认框不再散落直调
- 动效有统一 token 与基础模式

### 组件层

- 至少 10 个高频基础组件完成 `Ui*` 化
- 页面不再直接新增 `el-*` 默认用法
- `App*` 层能承接项目语义

### 页面层

- 后台页显著降低管理后台既视感
- 前台、后台、工作台具备统一产品语言
- 首页、音乐馆、地图、工作台不再像多个独立项目

## 14. 推荐执行顺序

如果只允许一条最现实的推进路径，建议按如下顺序执行：

1. 建分支
2. 建 `design/` 与 `components/ui/`
3. 先做 `UiIcon`
4. 先做 `UiButton`、`UiInput`、`UiPanel`、`UiTabs`、`UiBadge`
5. 先迁 `AdminSiteSettings.vue`
6. 再迁 `AdminCategories.vue` / `AdminFiles.vue`
7. 再迁 `MusicTrackEdit.vue` / `ArticleEdit.vue`
8. 再迁 `Music.vue`
9. 最后迁地图专题页

## 15. 第一批建议直接创建的组件

以下组件应作为迁移第一批落地对象：

### `components/ui`

- `UiIcon`
- `UiButton`
- `UiInput`
- `UiTextarea`
- `UiPanel`
- `UiTabs`
- `UiDialog`
- `UiBadge`
- `UiTooltip`
- `UiPagination`

### `components/app`

- `AppSection`
- `AppActionBar`
- `AppStatusPill`
- `AppEmptyState`
- `AppFilterBar`

### 基础服务

- `lib/feedback/notify.ts`
- `lib/feedback/confirm.ts`
- `design/tokens.ts`
- `design/motion.ts`

## 16. 文档维护规则

在迁移过程中，建议同步维护以下文档：

- `README.md`：当迁移改变开发方式、依赖或运行方式时更新
- `architecture.md`：当目录结构、组件分层、UI 基础设施发生变化时更新
- 本文档：仅维护迁移目标、阶段状态、组件映射与执行策略

如果迁移完成，可将本文档从“进行中蓝图”改为“迁移复盘与最终架构说明”，并把长期有效内容收敛回 `architecture.md`。

## 17. 迁移进度（持续更新）

> 最近更新：2026-06-12（阶段 3 后台收尾完成）

### 已完成

**阶段 0 / 阶段 1（地基）**

- 新增 `src/design/`：`tokens.ts`、`motion.ts`、`icon-map.ts`
- 新增 `src/assets/styles/tokens.scss`：语义 token 层（`--color-* / --radius-* / --space-* / --font-size-* / --motion-* / --z-* / --control-height-*`），复用历史 `variables.scss` 不破坏旧值
- 新增 `src/assets/styles/motion.scss`：统一进出场 transition（`m-fade / m-raise / m-panel / m-list / m-drawer / m-press`），含 reduced-motion 适配
- 新增 `src/assets/styles/element-theme.scss`：**将 Element Plus 全部 CSS 变量映射到项目 token**，所有 `el-*` 组件无需改页面即获得品牌化外观（按钮渐变、圆角柔化、表格去重边框、分页/Tabs 品牌色等）—— 这是“对原有 UI 影响最小、视觉统一收益最大”的关键一步
- 新增统一反馈服务 `src/lib/feedback/`：`notify.*`（包 `ElMessage`）、`confirmAction()` / `confirmDelete()`（包 `ElMessageBox`，取消不再抛错）

**阶段 2（第一批 primitive）**

- `components/ui/`：`UiIcon`、`UiButton`、`UiInput`、`UiTextarea`、`UiPanel`、`UiTabs`、`UiDialog`、`UiBadge`、`UiTooltip`、`UiPagination`、`UiEmpty`（共 11 个，超过验收要求的 10 个），统一 barrel 出口 `@/components/ui`
- `components/app/`：`AppSection`、`AppActionBar`、`AppStatusPill`、`AppEmptyState`、`AppFilterBar`，出口 `@/components/app`
- `UiIcon` 通过 `design/icon-map.ts` 支持「语义名 / 旧 Element 图标名 / 直接 Iconify 名」三种来源，迁移期平滑过渡

**阶段 3（后台，部分）**

- `AdminLayout.vue`：`el-menu` → 自定义品牌化侧边导航（`UiIcon` + token）
- `AdminCategories.vue`：`el-card`→`UiPanel`、`el-button`→`UiButton`、`el-tag`→`AppStatusPill`、`el-pagination`→`UiPagination`、`el-dialog`→`UiDialog`、`ElMessage/ElMessageBox`→`notify/confirmDelete`
- `AdminTrustRequests.vue`：同上模式 + `el-input`→`UiInput`

**阶段 3（后台收尾，已全部完成）**

- `AdminEmojiManager.vue`：`el-card`→`UiPanel`、`el-button`→`UiButton`、`el-tag`→`AppStatusPill`/`UiBadge`、`el-pagination`→`UiPagination`、`el-dialog`→`UiDialog`、`ElMessageBox`→`confirmDelete`、`ElMessage`→`notify`（保留 `el-upload`/`el-form`/`el-select` 等中期组件）
- `AdminFiles.vue`：`el-card`→`UiPanel`、`el-button`→`UiButton`、`el-input`→`UiInput`、`el-tag`→`AppStatusPill`/`UiBadge`、`el-pagination`→`UiPagination`、状态色函数改为 `AccentTone`、`ElMessage`→`notify`（保留 `el-table`/`el-drawer`/`el-select`/图表）
- `AdminSiteSettings.vue`：`el-card`→`UiPanel`、`el-tabs/el-tab-pane`→`UiTabs`（v-show 切换面板）、`el-button`→`UiButton`、`el-tag`→`UiBadge`、`ElMessage`→`notify`
- `AiAssistantSettings.vue`：`el-tabs/el-tab-pane`→`UiTabs`、`el-button`→`UiButton`、`el-tooltip`→`UiTooltip`、`el-icon InfoFilled`→`UiIcon`、`el-alert`→自定义品牌化结果卡片、`ElMessage`→`notify`

**中期 primitive 补建（2026-06-12）**

- 新建 `UiSwitch`、`UiCheckbox`、`UiSelect`（薄包装 el-select，保留 filterable/多选能力）
- `feedback` 层新增 `confirmInput`（替代 `ElMessageBox.prompt`）
- 新增 `UiSelectOption` 类型到 `types.ts`

**全站反馈层收敛（2026-06-12）**

全仓 22 个文件 `ElMessage.*` → `notify.*`、`ElMessageBox.confirm/prompt` → `confirmDelete/confirmAction/confirmInput`，唯一底层出口收口到 `lib/feedback`。涉及文件：
`request.ts`、`router/index.ts`、`stores/music-player.ts`、`composables/article-edit/useArticleEdit.ts`、`Header.vue`、`CommentSection.vue`、`Live2D.vue`、`UserProfileCard.vue`、`ArticleDetail.vue`、`Login.vue`、`Register.vue`、`Category.vue`、`CategoryDetail.vue`、`Home.vue`、`MemoryMap.vue`、`TravelMemoryCreate.vue`、`Music.vue`、`MusicTrackEdit.vue`、`Profile.vue`、`ProfileTrustRequestPanel.vue`、`Tag.vue`、`TagDetail.vue`、`UserProfile.vue`

**阶段 4（表单与编辑页，已完成部分）**

- `ArticleEdit.vue`：footer `el-button`→`UiButton`，移除 icons-vue 依赖
- `ProfileTrustRequestPanel.vue`：`el-tag`→`UiBadge`（statusTone computed），`el-input textarea`→`UiInput`，`el-button`→`UiButton`，移除 icons-vue 依赖
- `Profile.vue`：`el-card`→`UiPanel`，`el-menu/el-menu-item`→原生 `nav-menu-item` 按钮组（配合 `UiIcon`），`el-input`（搜索框）→`UiInput`，`el-button`→`UiButton`，`el-dialog`→`UiDialog`，`el-pagination×3`→`UiPagination`，panelIcon 改为字符串名，移除 icons-vue 依赖；el-form/el-form-item/el-input（表单校验绑定）保留
- `MusicTrackEdit.vue`：`el-switch`→`UiSwitch`，`el-button`→`UiButton`，`el-tooltip`→`UiTooltip`，`el-icon`→`UiIcon`，`el-empty`→`UiEmpty`，移除 icons-vue 依赖；el-form/el-segmented/el-date-picker/el-input 保留

构建验证：`vue-tsc -b` 通过（2026-06-12）。

### 待办（按方案阶段推进）

**阶段 4 剩余**
- `TravelMemoryCreate.vue`：`el-switch`/`el-button`/`el-input(standalone)` → `Ui*`，`ElMessage` 已收敛，重点是 el-form 校验绑定保留

**阶段 5（展示型长页面）**
- `Music.vue`：`ElMessageBox.confirm/prompt`（已收敛），`el-button`/`el-pagination`/`el-empty`/`el-tag` → `Ui*`/`UiBadge`
- `ArticleDetail.vue`：`el-button`/`el-tag`/`el-skeleton` → `Ui*`
- `MemoryMap.vue`：`ElMessageBox.confirm`（已收敛），地图层保留，`el-button`/`el-pagination` → `Ui*`
- `TravelMemoryDetail.vue`：`el-button`/`el-tag` → `Ui*`

**阶段 6（其余页面收尾）**
- `Category.vue`、`CategoryDetail.vue`、`Tag.vue`、`TagDetail.vue`、`UserProfile.vue`、`Register.vue`、`Login.vue` 等：`ElMessage` 已收敛，剩 `el-button`/`el-form`/`el-input`/`el-tag` 逐页替换
- `About.vue`、`Guestbook.vue`、`NotFound.vue` 等小页面

**中期组件待补建**
- `UiUpload`（薄包装 el-upload，统一 before-upload/loading/accept API）
- `UiDateField`（薄包装 el-date-picker）
- `UiSlider`（薄包装 el-slider）
- `UiTable`（薄包装 el-table，或等阶段 6 再评估）

> 最近更新：2026-06-12（阶段 3 全部完成；中期 primitive 补建；全站反馈层收敛；阶段 4 完成 4/5 个文件）
