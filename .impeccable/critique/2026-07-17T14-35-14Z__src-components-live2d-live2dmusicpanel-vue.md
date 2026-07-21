---
target: Live2D 音乐弹窗封面与布局回归
total_score: 22
p0_count: 0
p1_count: 3
timestamp: 2026-07-17T14-35-14Z
slug: src-components-live2d-live2dmusicpanel-vue
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|------:|-----------|
| 1 | Visibility of System Status | 3 | 播放、队列、加载与错误状态清楚。 |
| 2 | Match System / Real World | 2 | 熟悉的封面播放器顺序被多层工具条打散。 |
| 3 | User Control and Freedom | 3 | 支持关闭、Esc、暂停与切换，但轻量弹窗承担了过多管理任务。 |
| 4 | Consistency and Standards | 2 | 圆形运输控件、方形模式键、线性页签、胶囊筛选同时出现。 |
| 5 | Error Prevention | 2 | 未选歌曲时上一首、下一首仍显得可用。 |
| 6 | Recognition Rather Than Recall | 2 | 模式按钮只有图标，含义需要猜测。 |
| 7 | Flexibility and Efficiency | 2 | 搜索与筛选齐全，但缺少简洁的高频路径。 |
| 8 | Aesthetic and Minimalist Design | 1 | 封面失去主视觉，固定控制占据大部分高度。 |
| 9 | Error Recovery | 3 | 曲库失败、空结果和重试提示完整。 |
| 10 | Help and Documentation | 2 | 空状态友好，但模式和弹窗边界不够清楚。 |
| **Total** | | **22/40** | **可用，但需要明显重构** |

#### Anti-Patterns Verdict

**LLM assessment**：界面不是典型渐变或玻璃风格的 AI 产物，而是“功能完整性堆叠”。每新增一个能力就增加一条横向工具带，没有保留一个主导构图。420px 弹窗依次展示标题说明、封面信息、运输控制、进度、音量、三种模式、三个页签、搜索、分类和长列表，像缩小的音乐后台，不像陪伴式播放器。

**Deterministic scan**：`detect.mjs` 返回 0 项，说明没有命中静态反模式规则。静态扫描没有发现的问题，是浏览器证据中的信息密度和滚动结构：实时 DOM 同时包含 37 个按钮、24 条歌曲、3 个页签和2个滑块。

**Visual evidence**：1920×919 视口下弹窗为 420×516px，内容区只有约 203px，却承载约 1555px 的滚动内容。封面只有 68×68px，技术上存在，视觉上已经退化成列表缩略图。浏览器表面不支持可变脚本注入，因此没有生成可靠的可视化覆盖层。

#### Overall Impression

功能是完整的，但主次倒置。用户打开弹窗首先应该知道“正在听什么、如何播放”，现在却先面对一组播放器设置和一个被压缩的曲库。最大的机会是恢复封面主视觉，让弹窗只承担高频播放与快速点歌，把完整浏览留给音乐馆。

#### What's Working

- 播放时间、当前歌曲、队列数量、激活模式、加载和错误状态反馈完整。
- 曲库具备搜索、分类、重试和无结果说明，功能基础可靠。
- 键盘打开、Esc 关闭、焦点恢复、滑块标签和减少动效已经覆盖。

#### Priority Issues

1. **[P1] 封面与唱片感消失**
   - **Why it matters**：封面是陪伴式听歌的情绪锚点，68px 封面在 420px 面板中与列表缩略图同级。
   - **Fix**：恢复 88–104px 的真实封面或安静唱片处理，将标题、歌手和主播放控制与封面组成一个顶部播放器区；无当前歌曲时预览曲库第一首，而不是展示空白占位。
   - **Suggested command**：`$impeccable layout`

2. **[P1] 固定播放控件占满弹窗高度**
   - **Why it matters**：约 313px 在曲库之前被消耗，实际点歌区只剩约 203px。
   - **Fix**：移除重复说明，将进度合并进播放器区，音量与模式压缩为一条次要设置行，为内容区保留至少 280px。
   - **Suggested command**：`$impeccable distill`

3. **[P1] 页签共享滚动位置**
   - **Why it matters**：点歌列表滚动后切换队列或歌词，首项会被继承的滚动偏移裁掉。
   - **Fix**：页签切换时重置内容区到顶部，或为每个页签保存独立偏移。
   - **Suggested command**：`$impeccable harden`

4. **[P2] 控件体系碎片化且点击目标偏小**
   - **Why it matters**：30–40px 模式和运输按钮低于移动端 44px 目标，圆形、方形、线性和胶囊控件同时争夺注意力。
   - **Fix**：统一 44px 交互盒、清晰焦点环和一套图标按钮语言；补齐页签关联语义。
   - **Suggested command**：`$impeccable adapt`

5. **[P2] 轻量弹窗复制了完整音乐馆**
   - **Why it matters**：24 首曲目和完整设置造成第二个长滚动页面。
   - **Fix**：默认只展示少量推荐曲目，通过搜索和“显示更多”渐进展开；保持音乐馆入口可见。
   - **Suggested command**：`$impeccable distill`

#### Persona Red Flags

- **Jordan（第一次使用）**：未选歌曲时仍看到上一首、下一首和三种模式；一打开就要在十余个控制与列表选择间判断下一步。
- **Sam（键盘与低视力用户）**：部分图标按钮目标小于 44px，列表焦点主要依赖浅色背景；页签缺少明确的 tab-panel 关联。
- **Casey（移动用户）**：封面进一步缩到 58px，面板与底层页面形成双滚动，单手点击模式按钮困难。

#### Minor Observations

- “不离开当前页面，也能随时点歌”重复解释弹窗本身，占用宝贵高度。
- 类型标签在窄列表里价值较低，却增加一个右对齐扫描目标。
- 多个粉色激活状态同时出现，削弱了主播放按钮的优先级。
- 长标题截断处理稳定，可以保留。

#### Questions to Consider

- 用户打开弹窗的第一秒，应先理解“正在听什么”，还是“有哪些设置”？
- 轻量弹窗是否只需覆盖封面、主控制、搜索和少量推荐歌曲？
- 完整曲库、长队列和管理能力是否应该继续由音乐馆承担？
