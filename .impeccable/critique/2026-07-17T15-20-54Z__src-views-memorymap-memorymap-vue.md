---
target: 旅游地图三栏工作台
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-07-17T15-20-54Z
slug: src-views-memorymap-memorymap-vue
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | 列表、详情和权限状态都有反馈，但当前选中进度被放在正文层，和片段导航分离。 |
| 2 | Match System / Real World | 3 | 时间轴、地图、游记的模型自然，但三栏尚未完全形成一张私人旅行图集。 |
| 3 | User Control and Freedom | 3 | 地点、地图展开、片段、照片和相邻旅行都有退出或切换路径。 |
| 4 | Consistency and Standards | 2 | 右侧固定头部使用面板内边距，正文却被单独居中为窄列，形成两套水平坐标。 |
| 5 | Error Prevention | 3 | 请求竞态、可见性和删除确认已有防护，视觉层级本身仍会诱导用户错过右栏内容。 |
| 6 | Recognition Rather Than Recall | 3 | 三栏职责清楚，图标和标签大多可识别。 |
| 7 | Flexibility and Efficiency | 2 | 宽屏空间没有被正文和相册有效利用，片段进度也未和标签集中呈现。 |
| 8 | Aesthetic and Minimalist Design | 2 | 结构完整，但宽阴影、漂浮面板和右栏大面积无功能留白削弱整洁度。 |
| 9 | Error Recovery | 3 | 列表和详情都提供重试，地图失败不会阻断阅读。 |
| 10 | Help and Documentation | 2 | 地图有操作提示，其余交互主要依靠熟悉度。 |
| **Total** |  | **26/40** | **Acceptable** |

## Anti-Patterns Verdict

**LLM assessment**：不像通用 SaaS 模板，旅行时间轴、真实地图和邮戳已经有 Chen404 的私人图集气质。主要缺陷不是功能缺失，而是视觉坐标不统一。右侧头部从面板左边开始，正文、标题和相册却居中收窄，导致视线在同一栏内反复横跳。三张面板同时使用边框和 34px 模糊阴影，也让工作台更像三张漂浮大卡片，而不是一张稳定的 Atlas 工作面。

**Deterministic scan**：对 `MemoryMap.vue`、`TravelTimeline.vue`、`TravelMemoryReader.vue` 和 `TravelPhotoGallery.vue` 的扫描结果为 0 条。自动扫描没有识别出当前的水平基线和宽阴影问题，因此以改造说明、目标示意图和用户截图作为主要证据。

**Visual overlays**：内置浏览器运行时在初始化阶段报 `Cannot redefine property: process`，没有成功注入覆盖层。可靠的视觉回退信号为用户提供的 3840×2160 当前页面截图，以及改造说明内嵌的目标界面图。

## Overall Impression

页面已经完成三栏架构和主要交互迁移，但视觉完成度停在“功能都进来了”。最大的机会是让右侧真正成为最宽的主内容区，同时把三栏压回同一套边界、间距和材质语言。

## What's Working

- 左、中、右三栏比例符合改造说明，右侧确实是最大列，地图也填满剩余高度。
- 顶部旅行封面已压缩到约 160px，标题、统计和导航关系稳定，应作为保护边界。
- 地点切换、片段切换、照片预览、地图展开、详情错误恢复等功能入口完整。

## Priority Issues

### [P1] 右侧存在两套水平坐标

**Why it matters**：头部和摘要从 22px 内边距开始，正文、相册、事实和导航却以 `max-width: 74ch; margin: 0 auto` 居中。在当前宽屏截图中，正文左边比标题缩进约一个完整内容列，用户会把相册误读为另一个嵌套页面。

**Fix**：让正文区与头部共享左、右内边距；只给长段落设置 65–75ch 阅读宽度，相册、事实和导航使用右栏可用宽度。

**Suggested command**：`$impeccable layout`

### [P1] 面板材质过于漂浮

**Why it matters**：每栏同时使用边框和 34px 模糊阴影，三栏边界被光晕扩大，栏间距看起来不一致，页面也更像三张独立卡片。

**Fix**：统一 16px 圆角，保留安静边框和最多 8px 的轻阴影；地图展开时再使用更明确的层级阴影。

**Suggested command**：`$impeccable quieter`

### [P2] 片段进度与片段导航分离

**Why it matters**：标签在固定导航条内，`片段 1 / 2` 却出现在滚动正文头部。用户切换片段时需要跨层寻找当前进度，宽屏标签条右侧也形成大块无信息区域。

**Fix**：将当前进度固定在片段导航条右侧，正文头部只保留日期、地点和片段标题。

**Suggested command**：`$impeccable clarify`

### [P2] 左侧时间轴的信息顺序未按目标图收敛

**Why it matters**：当前节点把完整日期放进标题下方，时间关系不够直接；头部也只显示“3 站”，没有把地点数与照片数作为一个稳定摘要。

**Fix**：节点增加月日列，标题下只保留地点和照片；头部用一枚轻量摘要展示地点数与照片数。

**Suggested command**：`$impeccable layout`

## Persona Red Flags

**Jordan（第一次浏览旅行地图）**：能理解三栏职责，但右侧正文突然向中间缩进，会误以为标题下方的空白代表内容尚未加载；片段进度不在标签条内，也不容易确认当前所在位置。

**Sam（依赖键盘与高缩放）**：组件有焦点样式和 tab 语义，这是优点；但正文与标签的视觉位置分离，高缩放时会增加导航和内容之间的视线跳跃。

**受邀查看私人旅行的朋友**：最想看到照片和故事的主栏反而留下最大的左右空白，会觉得地图比游记更像主角，这与“私人旅行图集”的产品目标相反。

## Minor Observations

- 地图标题、当前位置和展开动作已经对齐，不需要重做。
- 顶部封面与导航已经形成稳定层级，本轮不应修改。
- 规则相册的 16:9 主图和四列缩略图符合规格，问题主要来自外层阅读宽度。

## Questions to Consider

- 如果右侧是最宽主栏，为什么照片和辅助信息仍只使用大约三分之二宽度？
- 当前进度是否应该和可切换的片段标签始终处在同一视线内？
- 三栏工作台是否真的需要三圈宽阴影来证明它们是三个区域？
