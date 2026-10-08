# Assignment 4：Columbia / NYC 吐槽平台

日期：2026-10-08

## 用户需求与验收标准

在已有 Assignment 3 的 Next.js、Google OAuth、Supabase 和 Vercel 项目上继续开发，沿用原仓库和服务项目。

- 首页每条内容只展示标题和地点；点击进入独立详情页。首页不展示正文、图片或评论。
- 详情页展示标题、地点、正文、可选照片、点赞／踩按钮，以及评论区。
- 游客可以浏览首页和详情；仅登录用户可以发布、上传照片、使用 AI、点赞／踩和评论。
- 发布表单包含标题、地点、正文和可选照片。支持纯文字或文字加照片，最多一张照片。
- 页面右上角提供 English／简体中文语言设置；界面、按钮、状态与错误提示跟随选择，并记住选择。初始语言为英文。
- 头像与吐槽照片使用自定义文件选择按钮，按钮文字跟随网站语言。系统文件选择窗口仍由操作系统控制。
- AI 生成结果与原始 prompt 存入数据库，已发布 AI 内容可被投票。
- 所有应用表启用 RLS，验证匿名写入和冒用其他用户 ID 均被拒绝。
- 发布到现有 Vercel 项目，关闭 Deployment Protection，交付绑定最终 Git commit 的部署 URL。
- PM 反馈环节尚未发生，后续收到真实反馈再修改；不虚构已完成反馈迭代。

## 产品方向

面向 Sam 的校园、宿舍和纽约探索生活，提供轻量的吐槽与交流空间。首页保持标题和地点的浏览形式，详情页承载讨论。最新内容是默认顺序，另可按累计赞踩分数查看热门内容。新鲜的生活场景和读者评论为每日回访提供理由。

相较只展示生成结果的 caption 榜单，发布者可以补充实际地点、编辑 AI 草稿，读者可以在详情页讨论。AI 内容有明确标识，地点由用户提供，不由模型编造。

不增加地图定位、私信、通知、社交关注或付费功能。

## 页面与交互

- `/`：吐槽首页，顶部导航、语言切换、登录／账号入口、发布入口，以及最新／热门排序。列表项仅含标题和地点。原课程目录移至 `/courses`，保留先前作业入口。
- `/rants/new`：登录保护的发布页。必填标题、地点和正文，可选一张 JPEG／PNG／WebP 照片，最大 5 MB；提交期间禁用重复提交。
- `/rants/[id]`：公开详情页。正文与照片下方是赞踩和评论；游客看到登录提示。评论按时间排列，支持纯文字。
- 既有 `/profile`、`/dashboard`、`/auth/callback`：沿用既有认证和资料流程，加入界面翻译。

标题最多 120 字符，地点最多 120 字符，正文最多 3000 字符，评论最多 1000 字符；空白输入被拒绝。文本按普通文本渲染。

每个用户对每条吐槽只能有一个当前投票：首次投票 INSERT 新行，切换赞／踩 UPDATE 自己的行，再次点击同一选择 DELETE 自己的行。服务器返回成功后更新界面；错误时保留用户输入并展示当前语言的提示。

## AI 生成与保存

发布页提供“AI 帮我写 / Help me write”。用户输入场景并选择生成语言；服务端验证登录后调用 Gemini，返回标题与正文草稿。用户可以编辑草稿后发布，也可以完全手写。

生成记录保存完整用户 prompt、系统指令、原始输出、语言、提供商、模型和创建者。发布的吐槽关联对应生成记录；修改后的正文与原始 AI 输出分别保留。AI 来源标识只在详情页展示，首页仍严格只显示标题和地点。

Gemini API key 只放在服务端环境变量，绝不进入浏览器或 Git。服务端校验结构、长度和响应状态；失败不伪装成 AI 成功，允许用户重试或手写。限制每用户每天的生成次数，数据库原子计数防止并发绕过。AI 生成失败后不占用成功次数。

## 数据与访问控制

- `rants`：ID、创建者、标题、地点、正文、可选照片路径、可选生成记录 ID、创建时间、示例标识。
- `ai_generations`：ID、创建者、prompt、系统指令、原始生成标题和正文、语言、provider、可选 model、创建时间。
- `rant_votes`：ID、吐槽 ID、用户 ID、value（1 或 -1）、创建时间；对 `(rant_id, user_id)` 设置唯一约束。
- `rant_comments`：ID、吐槽 ID、用户 ID、正文、创建时间。
- `ai_generation_usage`：按用户与纽约日期记录生成额度及短期处理中状态，使用受限函数更新。
- 既有 `profiles` 与 `courses`：保留数据和必要访问。

`rants` 与评论可公开读取；仅 authenticated 用户可插入自己的内容。发布者可管理自己的吐槽和评论。投票明细仅本人可读写；公开分数通过只返回聚合计数的受限数据库函数提供，不暴露投票人列表。评论不公开私人 profile 信息，显示非识别性作者标签。

AI prompt 与生成记录仅创建者可读取；服务端生成流程有权限写入，客户端不能伪造 AI 标识。发布接口验证生成记录归属和照片路径归属。示例内容仅通过受信任迁移添加，普通用户不能写入示例标识或空创建者记录。

头像改为仅本人可访问的私有对象，使用签名 URL 展示；吐槽照片为公开发表的内容，可公开读取，上传、覆盖与删除仅限用户自己的路径。审查应用 schema 中所有表和现有策略，移除不必要的写权限。Supabase 管理的系统表不执行任意结构修改。

## 初始示例内容

添加以下 6 条由本次 Codex 会话生成的示例吐槽，标明“AI 示例 / AI example”，保存本次用户要求作为 prompt，以及实际生成的原始文字。provider 记为 `codex`，不虚构 Gemini API 调用或模型版本；不冒用真实用户，不添加虚构点赞或评论。

1. **The laundry timer is writing fiction** — Columbia dorm laundry room
   “One minute remaining” has lasted long enough for me to reconsider my major. I came here to wash a hoodie, not experience a new theory of time.
2. **The subway has entered its mystery era** — 116th Street–Columbia University station
   The board says the train is arriving. The tunnel says absolutely nothing. At this point, I am in a long-distance relationship with the 1 train.
3. **My weekend budget lost to a sandwich** — Morningside Heights
   I planned a cheap day exploring the city. Then I bought one sandwich and my spreadsheet quietly changed the activity to “walk home.”
4. **A quiet floor with a podcast guest** — Butler Library
   Someone three tables away is explaining their entire group project on speakerphone. Glad the assignment is collaborative. Apparently, so is my study session.
5. **The dorm kitchen has one permanent resident** — Residence hall kitchen
   There is a pan in the sink that has been here longer than some friendships. I do not know who owns it, but it should probably start paying housing fees.
6. **New York walking speed is a placement exam** — Midtown Manhattan
   Back home, a walk was a walk. Here, stopping for half a second makes me the final boss of pedestrian traffic. I am learning, please allow one business day.

示例与真实用户内容保留原语言，切换网站语言只翻译界面，不擅自改变用户发布文字。

## 验证与交付

运行现有测试、lint 与生产构建，补充认证、投票唯一性、跨用户访问、生成保存及中英文切换的有效测试。实际验证游客无法发布／生成／投票／评论，登录用户可以完成文字发布、照片发布、AI 草稿发布、投票切换和评论。

验证数据库保存 prompt、生成输出、吐槽、照片路径、投票与评论；检查所有应用表 RLS 状态。用无痕或未登录浏览器验证部署首页与详情可访问，受保护操作会要求登录。交付最终 commit、对应部署 URL、AI／RLS 验证结果和真实未完成事项。
