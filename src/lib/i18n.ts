export type Language = 'en' | 'zh-CN';
const messages = {
 brand:['CITY / VENT','城市 / 吐槽'], home:['Rants','吐槽'], courses:['Course catalog','课程目录'], profile:['Profile','个人资料'], dashboard:['Dashboard','账户面板'],
 publish:['Publish rant','发布吐槽'], newRant:['Write a rant','写条吐槽'], latest:['Latest','最新'], popular:['Popular','热门'],
 eyebrow:['COLUMBIA & NEW YORK','哥大 · 纽约'], feedTitle:['Big city. Small grievances.','大城市，小牢骚。'], feedIntro:['Dorm life, delayed trains, and everything in between. Let it out.','从宿舍到地铁，把那些生活里的小崩溃写下来。'],
 feedEmpty:['Nothing here yet. Be the first to let it out.','还没有吐槽，来写第一条吧。'], loadError:['We could not load this right now. Please try again.','暂时无法加载，请重试。'],
 signIn:['Continue with Google','通过 Google 登录'], signOut:['Sign out','退出登录'], signedIn:['Signed in','已登录'],
 signInError:['Unable to start Google sign-in. Please try again.','无法开始 Google 登录，请重试。'], signOutError:['Unable to sign out right now. Please try again.','暂时无法退出，请重试。'],
 authRequired:['Please sign in with Google to view that page.','请先通过 Google 登录再访问此页面。'], loginInteract:['Sign in to post, vote, or join the conversation.','登录后即可发布、点赞／踩和评论。'],
 language:['Language','语言'], title:['Title','标题'], location:['Location','地点'], body:['Your rant','正文'], optionalPhoto:['Photo (optional)','照片（可选）'],
 choosePhoto:['Choose photo','选择照片'], noPhoto:['No photo selected','尚未选择照片'], photoHint:['JPEG, PNG or WebP · up to 5 MB','JPEG、PNG 或 WebP · 最大 5 MB'], removePhoto:['Remove photo','移除照片'],
 titlePlaceholder:['What is getting on your nerves?','用一句话说说你想吐槽什么'], locationPlaceholder:['e.g. Butler Library, Morningside Heights','例如：Butler 图书馆、Morningside Heights'], bodyPlaceholder:['Tell us what happened…','说说发生了什么……'],
 formTitle:['Your city. Your side of the story.','这座城市，你的视角。'], formIntro:['A little perspective, a little humor. Write your own, or ask AI for a starting point.','说说你的经历，也可以让 AI 帮你起个草稿。'],
 publishing:['Publishing…','正在发布……'], back:['Back to rants','返回吐槽'], invalidText:['Please complete the text fields and stay within their limits.','请填写文字，并确保长度不超过限制。'], invalidPhoto:['Choose a JPEG, PNG or WebP photo no larger than 5 MB.','请选择不超过 5 MB 的 JPEG、PNG 或 WebP 照片。'],
 signInRequired:['Please sign in to continue.','请先登录。'], mutationFailed:['That did not save. Your text is still here; please try again.','保存失败，输入内容已保留，请重试。'], uploadFailed:['The photo could not be uploaded. Please try again.','照片上传失败，请重试。'],
 aiTitle:['Need a starting point?','需要一个开头？'], aiPrompt:['Describe the moment','描述你想吐槽的场景'], aiPromptPlaceholder:['The laundry machine has said “1 minute” for half an hour…','洗衣机的“剩余 1 分钟”已经持续半小时……'], aiLanguage:['Draft language','生成语言'], generate:['AI: help me write','AI 帮我写'], generating:['Writing your draft…','正在生成草稿……'],
 aiHint:['AI drafts are saved with their prompts. Review and edit before publishing. Up to 10 successful drafts a day.','AI 草稿及 prompt 会保存。发布前请检查并修改，每天最多成功生成 10 次。'], aiGenerated:['AI-assisted','AI 辅助生成'], aiExample:['AI example','AI 示例'], aiReady:['Draft saved. Make it yours before publishing.','草稿已保存，请检查、修改后发布。'], discardAi:['Start a manual draft','改为手写草稿'],
 aiUnavailable:['AI writing is not configured yet. You can still write and publish your own rant.','AI 功能尚未配置，你仍可手写并发布吐槽。'], aiFailed:['AI could not finish this draft. Please try again.','AI 未能完成草稿，请重试。'], quotaExceeded:['You have used today’s 10 drafts. Try again tomorrow.','今天的 10 次生成已用完，请明天再来。'], generationBusy:['A draft is already being generated. Please wait a moment.','已有草稿正在生成，请稍后再试。'],
 comments:['The conversation','评论区'], commentPlaceholder:['Add your take…','说说你的看法……'], comment:['Post comment','发表评论'], commenting:['Posting…','正在发表……'], noComments:['No comments yet. Start the conversation.','还没有评论，来聊第一句吧。'], author:['Community member','社区用户'], upvote:['Upvote','点赞'], downvote:['Downvote','踩'], voteHint:['One vote per person. Tap again to undo.','每人一票，再点一次可取消。'],
 yourAccount:['Your account','你的账户'], profileIntro:['Add your name and an optional photo.','填写姓名，也可以添加一张头像。'], completeProfile:['Complete your profile to continue.','请完善个人资料后继续。'], profileSaved:['Profile saved.','个人资料已保存。'], firstName:['First name','名'], lastName:['Last name','姓'], profilePhoto:['Profile photo','个人照片'], currentPhoto:['Current profile photo','当前个人照片'], saveProfile:['Save profile','保存个人资料'], saving:['Saving…','正在保存……'],
 profileUnavailable:['Profile unavailable','无法加载个人资料'], returnHome:['Return home','返回首页'], profileSaveError:['Unable to save your profile. Please try again.','个人资料保存失败，请重试。'], nameRequired:['First and last name are required.','请填写名和姓。'], avatarInvalid:['Please choose a JPEG, PNG, WebP, or GIF image.','请选择 JPEG、PNG、WebP 或 GIF 图片。'], avatarSize:['Avatar must be 5 MB or smaller.','头像不能超过 5 MB。'], avatarUploadError:['Unable to upload your profile photo. Please try again.','头像上传失败，请重试。'],
 protectedRoute:['Protected route','受保护页面'], memberDashboard:['Members-only dashboard','用户账户面板'], sessionActive:['You can see this page because your Supabase session is active.','你已登录，可以访问此页面。'], unlockDashboard:['Complete your profile to unlock your dashboard.','完善个人资料后即可进入账户面板。'], editProfile:['Edit profile','编辑个人资料'],
 catalogTitle:['Course Catalog','课程目录'], catalogIntro:['A small collection of courses rendered from a secure, read-only Supabase table.','从数据库读取的课程列表。'], liveData:['Live data from Supabase','数据库实时数据'], noCourses:['No courses are available yet.','暂时没有课程。'], coursesError:['Unable to load courses right now.','暂时无法加载课程。'], catalogEyebrow:['Design for AI · Assignment 3','Design for AI · 作业 3'],
 interrupted:['Sign-in interrupted','登录中断'], authError:['We could not finish signing you in.','无法完成登录。'], retryLogin:['Please return home and try Google sign-in again.','请返回首页并重试 Google 登录。'], notFound:['This rant could not be found.','找不到这条吐槽。'], footer:['A little rant goes a long way.','生活不必完美，吐槽可以有趣。'], newLabel:['NEW','最新'], readRant:['Read rant','查看吐槽']
} as const;
export type TranslationKey = keyof typeof messages;
export function translate(language: Language, key: string): string {
 const pair = messages[key as TranslationKey]; return pair ? pair[language === 'zh-CN' ? 1 : 0] : messages.mutationFailed[language === 'zh-CN' ? 1 : 0];
}
export function errorKey(error: unknown): string {
 if (error instanceof Error) {
  if (error.message in messages) return error.message;
  const legacy: Record<string,string> = {'First and last name are required.':'nameRequired','Please choose a JPEG, PNG, WebP, or GIF image.':'avatarInvalid','Avatar must be 5 MB or smaller.':'avatarSize','Unable to upload your profile photo. Please try again.':'avatarUploadError','Unable to save your profile. Please try again.':'profileSaveError','Please sign in again before saving your profile.':'signInRequired'};
  if (legacy[error.message]) return legacy[error.message];
 }
 return 'mutationFailed';
}
