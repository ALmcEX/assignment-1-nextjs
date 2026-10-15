# CatCanvas 猫图与社区投票 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有应用上完成猫图卡片、创作、个人作品与社区投票改版，保留 API 关闭状态，并交付对应具体提交的 Vercel Preview。

**Architecture:** 保留既有 Next.js／Supabase 项目、历史表和稳定详情地址。新增专用猫图查询／发布接口，复用生成、认证和投票基础设施；原创页面样例与真实数据库作品明确分离。服务端生成开关继续保护供应商请求，实际 API 配置和收费测试属于下一阶段。

**Tech Stack:** 已安装的 Next.js 16.4、React 19、TypeScript、Supabase SSR／Postgres／Storage、Vitest、Testing Library、CSS、Vercel；不新增产品依赖。

**Spec:** `docs/superpowers/specs/2026-10-14-cat-image-rating-design.md`（用户已确认）

## Global Constraints

- 工作目录：`/Users/alex/.codex/worktrees/assignment-4-rants/Design for AI`；复用已有隔离工作树，不修改原课程作业目录。
- **输入想法 → 选择猫咪和画风 → AI 生成猫图 → 预览并发布 → 社区投票。**
- 地点可选，最多 120 字符。场景提示词 1–1000 个 Unicode 字符；可选作品标题最多 120 字符。
- 每页 8 条，最多读取 9 条判断下一页；默认最新、全部；America/New_York 当前周／月／年起点为时间边界。
- 时间范围按作品发布时间筛选；热门按这些作品的累计赞踩净分排序；再按发布时间倒序和 ID 排序。
- 保留既有六种猫咪、三种画风、English／简体中文、Google 登录及登录后回首页。
- 样例不进入数据库榜单，不显示虚构用户或票数，不伪装为实时生成；数据库错误不切换成假列表。
- 保持 `GEMINI_IMAGE_ENABLED` 默认关闭；不启用计费、不传输或更新密钥、不执行真实供应商请求。
- 已有文字吐槽、课程页、资料页和详情地址保留；不新增删除、关注、私信或支付功能。
- 实现前读 `AGENTS.md` 和安装包中的 Next.js 页面、服务端／客户端、redirect 与 Image 文档。
- 只对相关行为写有效测试；纯视觉调整通过浏览器检查。按实际输出报告验证，保留未验证项。

## Review Focus

- 单张签名失败或签名链接过期：该卡显示图片错误，其他卡可读，重载能请求新签名。（Task 2、4）
- 恶意筛选与超大页码：恢复有效默认值，数据库再检查窗口／排序／偏移，不构造无界查询。（Task 1、2）
- localStorage 拒绝访问、损坏草稿或账号切换：表单仍可编辑，不恢复别人的草稿。（Task 5）
- 生成完成后改了场景／品种／画风：不能把旧图片作为新参数结果发布；保留旧预览并要求重新生成。（Task 5）
- 加载他人的作品 ID 作为复用来源或会话过期：不返回私有 prompt，不发布、不写入他人数据。（Task 1、2、6）

## 文件与职责

- `src/lib/cats/`：猫图类型、筛选解析、查询、发布和本机草稿；旧 `rants/` 模块保留兼容职责。
- `src/components/cats/`：作品卡片、卡片投票、首页、样例、创作表单、个人作品；不混入数据库逻辑。
- `app/create/`、`app/my-cats/`：服务端认证、加载可复用参数与页面组装。
- `supabase/migrations/20261014000000_cat_rating.sql`：可选地点、猫图分页与受权限保护的发布；SQL 权限测试单独维护。
- 既有 `app/page.tsx`、详情页、header、i18n 与 CSS：连接新流程并保持旧链接可用。

---

### Task 1: 数据契约与数据库权限

**Files:** Create `src/lib/cats/types.ts`, `src/lib/cats/filters.ts`, `src/lib/cats/filters.test.ts`, `supabase/migrations/20261014000000_cat_rating.sql`, `supabase/tests/cat_rating_permissions.sql`.

**Interfaces:** `CatFilters={sort:'latest'|'popular';window:'week'|'month'|'year'|'all';page:number}`；`CatSeed={prompt:string;breed:CatBreed;style:CatStyle;language:Language}`。`CatFeedItem={id:string;title:string;body:string;location:string;created_at:string;ai_image_path:string;breed:CatBreed;style:CatStyle;totals:VoteTotals;myVote:1|-1|null;canReuse:boolean;imageUrl:string|null;imageError:boolean}`。复用既有 `CatBreed`、`CatStyle`、`Language`、`VoteTotals`。

- [ ] **Step 1: 写筛选失败测试和回滚 SQL 权限断言。**
  ```ts
  expect(parseCatFilters({})).toEqual({sort:'latest',window:'all',page:1});
  expect(parseCatFilters({sort:'popular',window:'week',page:'2'}).page).toBe(2);
  expect(parseCatFilters({sort:'invalid',window:'invalid',page:'999999999999'})).toEqual({sort:'latest',window:'all',page:1});
  ```
  SQL 使用不同 authenticated 用户／anon／service_role fixtures；断言游客发布被拒绝、本人发布成功、其他用户或 text generation 发布被拒绝、图片路径不能伪造、空地点合法、历史文本不进入猫图榜单。权限脚本必须回滚。
- [ ] **Step 2: 运行 `npm test -- src/lib/cats/filters.test.ts`，确认因接口尚未实现失败。** 数据库测试在可用隔离数据库执行；执行前确认图片迁移是否存在，不能重复应用未知线上迁移。
- [ ] **Step 3: 实现 `parseCatFilters(params:{sort?:string;window?:string;page?:string}):CatFilters`。** 页码只接受十进制正整数 1–100000，默认 1。新增 `cat_feed_page(p_sort text,p_window text,p_offset integer,p_mine boolean)`，固定 limit 9、offset 0–799992，非法枚举／偏移拒绝。SQL join 真实 image generation，时间上界 `now()`，边界 `date_trunc(..., now() at time zone 'America/New_York') at time zone 'America/New_York'`；只投影公共字段与本人的投票／归属布尔值。`p_mine=true` 使用 `auth.uid()`，匿名返回空，不能传用户 ID。
- [ ] **Step 4: 同一迁移实现 `publish_cat_image(p_generation_id uuid,p_title text,p_location text) returns uuid`。** SECURITY INVOKER、仅 authenticated 可执行，校验当前用户拥有的 image generation 和存储对象；正文来自 generation.prompt，缺省标题截取 prompt 前 120 字符，地点空字符串可用。沿用既有 trigger 推导图片路径。放宽 location check 为 0–120，其余历史约束不变。
- [ ] **Step 5: 运行筛选测试及可用数据库的回滚 SQL 测试，确认净分、本人票值、周一纽约周边界、夏令时月边界、未来作品排除和分页断言通过；无法执行 SQL 时记录未验证。**
- [ ] **Step 6: 检查 diff 并仅提交本任务文件，消息 `feat: add cat gallery data contracts and protected SQL interfaces`。**

### Task 2: 猫图查询、发布与可选地点

**Files:** Create `src/lib/cats/queries.ts`, `src/lib/cats/queries.test.ts`, `src/lib/cats/mutations.ts`, `src/lib/cats/mutations.test.ts`; modify `src/lib/rants/generation-service.ts`, `generation-service.test.ts`, `gemini.ts`, `gemini.test.ts`; retain existing `app/api/generate/route.test.ts` coverage.

**Interfaces:** `getCats(client:SupabaseClient,filters:CatFilters,mine=false):Promise<{items:CatFeedItem[];hasMore:boolean}>`；`getCatSeed(client:SupabaseClient,rantId:string):Promise<CatSeed|null>`；`publishCat(client:SupabaseClient,input:{generationId:string;title?:string;location?:string}):Promise<{id:string}>`。`DraftInput.location` 接受缺省或空字符串，清洗后传给生成器为字符串；其余生成返回值不变。

- [ ] **Step 1: 写失败测试。**
  ```ts
  expect(result.items).toHaveLength(8); expect(result.hasMore).toBe(true); // RPC returns 9
  expect(result.items[0].imageError).toBe(true); // only that signature fails
  expect(result.items[1].imageUrl).toBe('https://storage.example/cat.png');
  expect(await getCatSeed(otherUserClient, ownedBySomeoneElse)).toBeNull();
  ```
  补充 RPC 失败抛错、批量签名一次、本人查询参数、无效 ID／未登录发布被拒绝、可选地点、服务端关闭开关零供应商调用。Mock 名称和 fixtures 使用实际导出接口，不调用真实 AI。
- [ ] **Step 2: 运行上述 cats 测试与 generation-service 测试，确认新增断言失败。**
- [ ] **Step 3: 实现三个接口。** `getCats` 一次 RPC、一次 `createSignedUrls(paths,3600)`；查询错误抛出，单张签名失败仅设置本行错误。`getCatSeed` 先确认会话，依据公开作品的 generation ID 查本人可见的 image generation，仅返回四个种子字段。`publishCat` 确认会话及输入，调用专用 RPC，不接受浏览器图片路径或 AI provider。
- [ ] **Step 4: 修改生成输入清洗与提示词。** 空地点不要求补地点；场景从 everyday grievance 改为用户 creative idea，保留猫咪主题、图片二进制校验、失败清理和现有调用协议，不变更供应商模型或收费配置。
- [ ] **Step 5: 运行 `npm test -- src/lib/cats src/lib/rants/generation-service.test.ts src/lib/rants/gemini.test.ts app/api/generate/route.test.ts`，确认新旧断言通过。**
- [ ] **Step 6: 提交相关文件，消息 `feat: query and publish verified cat image creations`。**

### Task 3: 卡片投票

**Files:** Create `src/components/cats/cat-vote-controls.tsx`, `cat-vote-controls.test.tsx`; consume existing `src/lib/rants/mutations.ts:setVote` and auth UI.

**Interfaces:** `CatVoteControls({id,user,totals,myVote,disabled=false}:{id:string;user:User|null;totals:VoteTotals;myVote:1|-1|null;disabled?:boolean})`。成功调用现有 `toggle_rant_vote` 后 `router.refresh()`，分数和选择来自刷新后的服务端 props。

- [ ] **Step 1: 写组件失败测试：赞、踩、同项取消都传准确值；连续点击只调用一次；失败不更改分数；游客只显示登录操作；样例禁用且没有伪造票数。**
  ```ts
  expect(upvote.getAttribute('aria-pressed')).toBe('true');
  expect(setVote).toHaveBeenCalledWith(expect.anything(),id,1);
  expect(setVote).toHaveBeenCalledTimes(1); // double click while pending
  ```
- [ ] **Step 2: 运行 `npm test -- src/components/cats/cat-vote-controls.test.tsx`，确认失败。**
- [ ] **Step 3: 实现按钮、净分、按下状态、pending 和错误提示。** 不在渲染中自行增加票数；取消／切换语义交给现有原子 RPC；失败保留旧 props。用复用的 `AuthNav` 完成游客登录入口。
- [ ] **Step 4: 运行本任务测试及既有 mutations／rant-interactions 测试，确认通过。**
- [ ] **Step 5: 提交相关文件，消息 `feat: add authenticated voting to cat cards`。**

### Task 4: 图片首页与明确标注的页面样例

**Files:** Create `src/components/cats/cat-card.tsx`, `cat-feed.tsx`, `cat-feed.test.tsx`, `cat-samples.tsx`; create four original SVG assets under `public/cat-samples/`; modify `app/page.tsx`.

**Interfaces:** `CatCard({item,user}:{item:CatFeedItem;user:User|null})`；`CatFeed({items,filters,user,hasMore,hasError,showSamples=false})`，类型沿用 Task 1；`CatSamples()` 是单独的静态展示组件，不能调用查询或写入接口。`showSamples` 由明确的 `?samples=1` 入口启用，不作为查询失败回退。

- [ ] **Step 1: 写组件失败测试。**
  ```ts
  expect(screen.getByRole('link',{name:/Popular/}).getAttribute('href')).not.toContain('page=');
  expect(screen.getByRole('link',{name:/Next/}).getAttribute('href')).toContain('window=week');
  expect(screen.queryByText(/Interface sample/)).toBeNull(); // real feed empty/error
  ```
  覆盖空列表、数据库错误、单图失败占位、下一页保留排序与窗口、样例无数字投票／虚构作者；所有卡片链接可进入详情。
- [ ] **Step 2: 运行首页组件测试，确认新组件尚未存在导致失败。**
- [ ] **Step 3: 实现首页服务端组装与卡片。** Promise searchParams 解包后解析 filter，获取当前 user 并调用 `getCats`；catch 只设置错误。前端提供最新／热门、四种窗口、8 条分页和样例入口；固定图片容器使用 contain，图片加载失败单卡显示提示。原创 SVG 以“界面样例，非本应用实时生成”标记，不复制参考站媒体。
- [ ] **Step 4: 运行 cats 组件测试，删除或更新旧 rant-feed 测试中已不适用于首页的产品断言，保留历史组件独立可用的覆盖。**
- [ ] **Step 5: 提交相关文件，消息 `feat: replace the homepage with a cat image gallery`。**

### Task 5: 创作表单、本机草稿与生成状态

**Files:** Create `src/lib/cats/local-draft.ts`, `local-draft.test.ts`, `src/components/cats/cat-composer.tsx`, `cat-composer.test.tsx`, `app/create/page.tsx`; modify `app/rants/new/page.tsx` to redirect.

**Interfaces:** `CatFormDraft=CatSeed & {title:string;location:string}`；`readLocalDraft(userId:string):CatFormDraft|null`；`writeLocalDraft(userId:string,draft:CatFormDraft):boolean`；`clearLocalDraft(userId:string):boolean`。使用 `catcanvas:draft:v1:${userId}` 且严格白名单序列化字段。`CatComposer({userId,imageEnabled=false,seed}:{userId:string;imageEnabled?:boolean;seed?:CatSeed})`。

- [ ] **Step 1: 写本机草稿失败测试：损坏 JSON、超长／非法字段、localStorage 抛错、账号隔离、没有 generation ID 或签名 URL。**
  ```ts
  expect(readLocalDraft('user-b')).toBeNull(); // saved under user-a
  expect(JSON.parse(saved)).not.toHaveProperty('generationId');
  expect(writeLocalDraft('user-a',draft)).toBe(false); // blocked storage
  ```
- [ ] **Step 2: 写表单失败测试：API 关闭生成／发布禁用；空地点可生成；六品种三画风；成功预览后才能发布；失败保留上张图；提示词／品种／画风／语言编辑后旧图不可作为新结果发布；按 code point 校验 emoji 长度。** 使用 fetch／publishCat mock，确认保存草稿不访问供应商。
- [ ] **Step 3: 运行 `npm test -- src/lib/cats/local-draft.test.ts src/components/cats/cat-composer.test.tsx`，确认失败。**
- [ ] **Step 4: 实现草稿与创作状态机。** 明确 idle／generating／preview／publishing 状态；成功保存 generation ID 与生成参数快照，只有参数与快照一致才能发布。重新生成失败保留旧图和其快照；清除预览解除关联。表单先用种子，其次本人已保存草稿，最后默认值；不自动把私有 prompt 放入 URL。
- [ ] **Step 5: 实现 `/create` 认证保护。** `?reuse=<作品 UUID>` 只含作品 ID，由服务端 `getCatSeed` 查本人记录；无权限显示无法复用但保留空表单。未登录转 `/?auth=required`；旧 `/rants/new` 重定向 `/create`。开关由现有服务端变量计算；产品层不展示凭据或部署实现细节。
- [ ] **Step 6: 运行 Task 5 和现有 generate API 测试，确认通过；提交消息 `feat: add a cat creation studio with private local drafts`。**

### Task 6: 本人作品、复用与兼容详情

**Files:** Create `app/my-cats/page.tsx`, `src/components/cats/my-cats.tsx`, `my-cats.test.tsx`, `src/components/rants/rant-detail.test.tsx`; modify `app/rants/[id]/page.tsx`, `src/components/rants/rant-detail.tsx`.

**Interfaces:** `MyCats({items,user,page,hasMore,hasError})` 沿用 Task 1／2 类型。`RantDetail` 新增可选 `canReuse:boolean`、`breed?:CatBreed`、`style?:CatStyle`，保留旧 props 兼容；本人读取种子成功才设置复用入口。

- [ ] **Step 1: 写失败测试：本人作品真实空／错状态、分页、复用只含 UUID；猫图详情显示图片和场景；空地点不显示；历史文本仍可读；无权复用不出现入口。**
  ```ts
  expect(reuseLink.getAttribute('href')).toBe(`/create?reuse=${id}`);
  expect(reuseLink.getAttribute('href')).not.toContain('private prompt');
  expect(screen.queryByText('⌖')).toBeNull(); // no location
  ```
- [ ] **Step 2: 运行新详情／本人作品测试，确认失败。**
- [ ] **Step 3: 实现本人作品页面认证与 `getCats(...,true)`。** 默认最新、全部；空状态指向创作页。详情沿用 `getRant`、评论和 signed URL，图片作品将图置于主要位置，旧文本布局保持可用；404 与加载异常遵守 Next.js 各自路径。
- [ ] **Step 4: 运行本任务和既有 queries／rant-interactions／auth-redirect 测试，确认通过；提交消息 `feat: add personal cat galleries and prompt reuse`。**

### Task 7: 品牌、双语和响应式整合

**Files:** Modify `src/components/site-header.tsx`, `src/lib/i18n.ts`, `app/globals.css`, `app/layout.tsx`, `app/error.tsx`, `app/not-found.tsx`; create `src/components/site-header.test.tsx`, `src/lib/cats/localization.test.ts`; update `README.md` and `docs/ai-cat-images.md` for the new flow.

**Interfaces:** 所有新增文案通过现有 `useLanguage().t` 获取；品牌 CatCanvas／猫咪画室。原 auth、语言提供器与课程入口签名不变。

- [ ] **Step 1: 写语义失败测试：新导航分别指向 `/`、`/create`、`/my-cats`；两种语言键集合一致且新增控件无漏译；切换语言不改变作品文字。**
- [ ] **Step 2: 运行 header／语言相关测试，确认新增品牌与路由断言失败。**
- [ ] **Step 3: 实现深色背景、深灰卡片、黄色主按钮、原创猫标识、桌面双列和手机单列。** 固定图片 contain、可见键盘焦点、足够按钮尺寸；修复旧 course／profile 表单在深色背景的可读性；更新 title、description 和错误页文案。
- [ ] **Step 4: 用 CUA 浏览器在桌面与手机尺寸检查首页样例、真实空／错状态、创作页、详情、导航、语言、焦点及无横向滚动。** 登录不可用时通过组件测试验证受保护表单，实际登录流程单独标为未验证；不通过虚构认证绕过限制。保存可 review 的截图。
- [ ] **Step 5: 运行相关组件／语言测试，修复实际发现的布局问题后提交，消息 `style: apply CatCanvas branding and bilingual responsive layouts`。**

### Task 8: 集成验收与具体提交部署链接

**Files:** Create `docs/cat-rating-verification.md`; update only files required to fix observed failures.

**Interfaces:** 交付当前 commit SHA、匹配该 SHA 的 Vercel Preview URL、测试结果、迁移状态、真实 API 未启用状态与截图路径。

- [ ] **Step 1: 运行 `npm test`、`npm run lint`、`npm run build`、`git diff --check`，记录实际结果。** 出现失败先定位根因，只修复相关问题并重跑受影响检查；不使用旧 93 项测试结果充当本轮证据。
- [ ] **Step 2: 检查目标 Supabase 项目迁移状态。** 在已有授权覆盖的目标项目应用缺失的图片迁移和本轮迁移，执行可回滚角色权限测试；若缺少可用访问则保留脚本，明确记录线上未验证。全程不输出／转移密钥，不打开 AI 生成开关。
- [ ] **Step 3: 完成未启用 API 的浏览器验收并填写 verification 文档。** 核对样例独立、游客限制、草稿、旧详情、个人页与翻译；记录具体未完成的登录或线上操作，不把 mock 测试称作真实供应商成功。
- [ ] **Step 4: 提交验证记录，推送现有工作分支至既有仓库，等待 Vercel Preview。** 使用 GitHub deployments/checks 或既有 Vercel 访问核验 deployment SHA 等于最终 HEAD；再用未登录浏览器访问具体部署 URL。必要 OAuth 回调配置应使用该部署准确域名并按已有权限处理，不禁用额外安全控制。
- [ ] **Step 5: 若数据库或部署访问受阻，交付已验证代码、准确 blocker 与可执行下一步；否则交付可访问的具体提交链接。** 不提交本周作业表单，不宣称收到 PM 反馈；API 配置与真实付费测试进入下一阶段。

## 自审与执行交接

设计第 1–3 节由全局约束与 Task 8 覆盖；页面由 Task 3–6 覆盖；视觉与双语由 Task 7 覆盖；权限、数据与错误由 Task 1–2、5 覆盖；验收由各任务测试和 Task 8 覆盖。Review Focus 的五种条件均有指定任务和断言；类型、RPC 名称和组件依赖在上文统一定义。

本计划尚待用户审核和选择执行方式。建议由当前 agent 在本会话顺序实现：任务共享类型、数据库和 UI 状态，单线执行便于保持接口一致。也可选择逐任务子代理与独立审查；该选项会启动多代理工作，并增加上下文与审查开销。
