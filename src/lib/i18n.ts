export type Language = 'en' | 'zh-CN';
const messages = {
 nextPage:['Next page','下一页'], previousPage:['Previous page','上一页'], page:['Page','页'], olderComments:['Older comments','更早的评论'], newerComments:['Newer comments','较新的评论'], retry:['Try again','重试'],
 brand:['CITY / VENT','城市 / 吐槽'], home:['Rants','吐槽'], courses:['Course catalog','课程目录'], profile:['Profile','个人资料'], dashboard:['Dashboard','账户面板'],
 publish:['Publish rant','发布吐槽'], newRant:['Write a rant','写条吐槽'], latest:['Latest','最新'], popular:['Popular','热门'],
 eyebrow:['COLUMBIA & NEW YORK','哥大 · 纽约'], feedTitle:['Big city. Cat-sized chaos.','大城市，猫式小牢骚。'], feedIntro:['Dorm life, delayed trains, and a cat that gets it. Share your story, give it a feline face.','从宿舍到地铁，把小崩溃写下来，让一只小猫替你演出来。'],
 feedEmpty:['Nothing here yet. Be the first to let it out.','还没有吐槽，来写第一条吧。'], loadError:['We could not load this right now. Please try again.','暂时无法加载，请重试。'],
 signIn:['Continue with Google','通过 Google 登录'], signOut:['Sign out','退出登录'], signedIn:['Signed in','已登录'],
 signInError:['Unable to start Google sign-in. Please try again.','无法开始 Google 登录，请重试。'], signOutError:['Unable to sign out right now. Please try again.','暂时无法退出，请重试。'],
 authRequired:['Please sign in with Google to view that page.','请先通过 Google 登录再访问此页面。'], loginInteract:['Sign in to post, vote, or join the conversation.','登录后即可发布、点赞／踩和评论。'],
 language:['Language','语言'], title:['Title','标题'], location:['Location','地点'], body:['Your rant','正文'], optionalPhoto:['Photo (optional)','照片（可选）'],
 choosePhoto:['Choose photo','选择照片'], noPhoto:['No photo selected','尚未选择照片'], photoHint:['JPEG, PNG or WebP · up to 5 MB','JPEG、PNG 或 WebP · 最大 5 MB'], removePhoto:['Remove photo','移除照片'],
 titlePlaceholder:['What is getting on your nerves?','用一句话说说你想吐槽什么'], locationPlaceholder:['e.g. Butler Library, Morningside Heights','例如：Butler 图书馆、Morningside Heights'], bodyPlaceholder:['Tell us what happened…','说说发生了什么……'],
 formTitle:['Your city. Your side of the story.','这座城市，你的视角。'], formIntro:['Write your story. Add your own photo, or create a cat that shares your mood.','写下你的经历，上传照片，或者生成一只和你心情相同的小猫。'],
 publishing:['Publishing…','正在发布……'], back:['Back to rants','返回吐槽'], invalidText:['Please complete the text fields and stay within their limits.','请填写文字，并确保长度不超过限制。'], invalidPhoto:['Choose a JPEG, PNG or WebP photo no larger than 5 MB.','请选择不超过 5 MB 的 JPEG、PNG 或 WebP 照片。'],
 signInRequired:['Please sign in to continue.','请先登录。'], mutationFailed:['That did not save. Your text is still here; please try again.','保存失败，输入内容已保留，请重试。'], uploadFailed:['The photo could not be uploaded. Please try again.','照片上传失败，请重试。'],
 aiTitle:['Create a cat image','生成一张小猫图'], aiPrompt:['Describe your cat scene','描述小猫的场景'], aiPromptPlaceholder:['An orange cat waiting for a laundry machine that never finishes…','一只橘猫盯着永远洗不完的洗衣机……'], generate:['Generate cat image','生成小猫图片'], generating:['Creating your cat…','正在生成小猫……'],
 aiHint:['Choose a cat and a style. Images and prompts are saved; review before publishing. Up to 10 successful images a day.','选一只猫和一种画风。图片及提示词会保存，发布前请检查，每天最多成功生成 10 张。'], aiGenerated:['AI-assisted','AI 辅助生成'], aiCatGenerated:['AI cat image','AI 小猫配图'], aiExample:['AI example','AI 示例'], aiReady:['Cat image saved. Attach it when you publish.','小猫图已保存，发布吐槽时会一起附上。'], discardAi:['Remove cat image','移除小猫配图'], aiPreview:['Your AI-generated cat','你生成的 AI 小猫'],
 catBreed:['Cat type','小猫品种'], catStyle:['Art style','画风'], catOrange:['Orange cat','橘猫'], catTabby:['Tabby','狸花猫'], catRagdoll:['Ragdoll','布偶猫'], catBritish:['British shorthair','英国短毛猫'], catTuxedo:['Tuxedo cat','奶牛猫'], catCalico:['Calico','三花猫'], stylePhoto:['Photography','写实摄影'], styleIllustration:['Soft illustration','温柔插画'], styleClay:['Clay miniature','黏土小猫'], catNote:['A cat for every mood.','每一种心情，都有一只小猫。'],
 aiUnavailable:['Cat image generation is not enabled yet. You can still write a rant and upload a photo.','小猫图片生成暂未开启，你仍可写吐槽并上传照片。'], aiFailed:['The cat image could not be created. Please try again.','小猫图片生成失败，请重试。'], quotaExceeded:['You have used today’s 10 cat images. Try again tomorrow.','今天的 10 张小猫图已用完，请明天再来。'], generationBusy:['A cat image is already being generated. Please wait a moment.','已有小猫图片正在生成，请稍后再试。'],
 comments:['The conversation','评论区'], commentPlaceholder:['Add your take…','说说你的看法……'], comment:['Post comment','发表评论'], commenting:['Posting…','正在发表……'], noComments:['No comments yet. Start the conversation.','还没有评论，来聊第一句吧。'], author:['Community member','社区用户'], upvote:['Upvote','点赞'], downvote:['Downvote','踩'], voteHint:['One vote per person. Tap again to undo.','每人一票，再点一次可取消。'],
 yourAccount:['Your account','你的账户'], profileIntro:['Add your name and an optional photo.','填写姓名，也可以添加一张头像。'], completeProfile:['Complete your profile to continue.','请完善个人资料后继续。'], profileSaved:['Profile saved.','个人资料已保存。'], firstName:['First name','名'], lastName:['Last name','姓'], profilePhoto:['Profile photo','个人照片'], currentPhoto:['Current profile photo','当前个人照片'], saveProfile:['Save profile','保存个人资料'], saving:['Saving…','正在保存……'],
 profileUnavailable:['Profile unavailable','无法加载个人资料'], returnHome:['Return home','返回首页'], profileSaveError:['Unable to save your profile. Please try again.','个人资料保存失败，请重试。'], nameRequired:['First and last name are required.','请填写名和姓。'], avatarInvalid:['Please choose a JPEG, PNG, WebP, or GIF image.','请选择 JPEG、PNG、WebP 或 GIF 图片。'], avatarSize:['Avatar must be 5 MB or smaller.','头像不能超过 5 MB。'], avatarUploadError:['Unable to upload your profile photo. Please try again.','头像上传失败，请重试。'],
 protectedRoute:['Protected route','受保护页面'], memberDashboard:['Members-only dashboard','用户账户面板'], sessionActive:['You can see this page because your Supabase session is active.','你已登录，可以访问此页面。'], unlockDashboard:['Complete your profile to unlock your dashboard.','完善个人资料后即可进入账户面板。'], editProfile:['Edit profile','编辑个人资料'],
 catalogTitle:['Course Catalog','课程目录'], catalogIntro:['A small collection of courses rendered from a secure, read-only Supabase table.','从数据库读取的课程列表。'], liveData:['Live data from Supabase','数据库实时数据'], noCourses:['No courses are available yet.','暂时没有课程。'], coursesError:['Unable to load courses right now.','暂时无法加载课程。'], catalogEyebrow:['Design for AI · Assignment 3','Design for AI · 作业 3'],
 interrupted:['Sign-in interrupted','登录中断'], authError:['We could not finish signing you in.','无法完成登录。'], retryLogin:['Please return home and try Google sign-in again.','请返回首页并重试 Google 登录。'], notFound:['This rant could not be found.','找不到这条吐槽。'], footer:['A little rant. A little purr.','吐个槽，呼噜一下。'], newLabel:['NEW','最新'], readRant:['Read rant','查看吐槽']
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
