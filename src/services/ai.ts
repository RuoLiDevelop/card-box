import { useSettingsStore } from '@/store/settings'
import { useUserStore } from '@/store/user'

// 定义不同模式的 prompt
const PROMPTS = {
  qa: `请将内容转换为问答形式的卡片。

直接返回 JSON 对象格式：{
  "title": "根据内容生成一个简短的卡盒名称，不超过10个字",
  "cards": [["问题", "答案"]]
}

要求：
1. 提取关键知识点，生成启发性问题
2. 答案要准确、完整但简洁
3. 每张卡片专注一个知识点
4. 问题用中文表述，清晰易懂
5. 卡盒名称要体现内容主题，简洁有意义`,

  conversation: `你是一个专业的英语学习助手，请生成中英对照的对话卡片。

直接返回 JSON 对象格式：{
  "title": "根据对话场景生成一个简短的卡盒名称，不超过10个字",
  "cards": [["中文", "英文", "笔记"]]
}

笔记要求：
1. 标注重要语法点和地道表达
2. 说明文化背景和易错点
3. 提供近义表达
4. 无需笔记时返回 null

卡盒名称要求：
1. 体现对话的场景或主题
2. 简洁易懂，有实用价值`,

  vocabulary: `请提取重要词汇和短语。
提取规则：
1. 如果输入是中文文本：
   - 提取重要词汇和短语
   - 正面放中文，反面放对应的英文表达和音标
   - 笔记包含：用法说明、例句、同义词

2. 如果输入是英文文本：
   - 提取重要词汇、短语和地道表达
   - 正面放英文原文，反面放中文释义和音标
   - 笔记包含：词性、用法说明、例句、同义词  

通用要求：
1. 避免过于基础的词汇
2. 优先提取：
   - 常用搭配
   - 地道表达
   - 专业术语
   - 习语和俚语
3. 笔记格式建议：
   - 词性：[n./v./adj./...]
   - 例句：原文 + 翻译
   - 同义词/近义词
   - 使用场景说明
4. 无需笔记时返回 null

直接返回 JSON 对象格式：{
  "title": "根据词汇主题生成一个简短的卡盒名称，不超过10个字",
  "cards": [["词汇/短语", "词性 + 中文释义", "笔记"]]
}

卡盒名称要求：
1. 体现词汇的领域或主题
2. 简洁易懂，便于分类`,

  free: `请根据用户的输入生成记忆卡片。

直接返回 JSON 对象格式：{
  "title": "根据内容生成一个简短的卡盒名称，不超过10个字",
  "cards": [["正面内容", "反面内容", "笔记"]]
}

格式要求:
1. 每个数组元素必须包含正面和反面内容,笔记可选
2. 正反面内容各自控制在200字以内
3. 笔记内容如果没有则返回 null
4. 笔记的内容用于补充反面的内容，可包含：
  * 重要提示和技巧
  * 相关知识点链接
  * 实际应用场景
  * 易错点提醒

卡盒名称要求：
1. 体现内容的主题或领域
2. 简洁易懂，便于分类

请直接按照用户的需求生成内容，不要添加多余的解释`,

  note: `请根据卡片内容，生成补充性的笔记要点，帮助加深理解。注意：不要重复卡片中已有的内容。

分析内容类型：
1. 如果是英语/外语内容：
   - 补充相关词汇和短语的延伸用法
   - 解释未提及的语法点和句式变化
   - 提供其他场景下的表达方式
   - 补充文化背景和使用注意事项

2. 如果是概念/知识点：
   - 补充相关的背景知识
   - 与其他知识点的联系和区别
   - 实际应用场景和例子
   - 常见误区和解决方案
   - 记忆技巧和方法

3. 如果是方法/技能：
   - 补充进阶技巧和变体
   - 常见陷阱和规避方法
   - 效率提升建议
   - 实践经验总结
   - 相关延伸学习方向

要求：
1. 必须是对卡片内容的补充，不要重复已有信息
2. 每个笔记要点都应该提供新的视角或信息
3. 使用简洁清晰的语言
4. 每个笔记点控制在80字以内

直接返回 JSON 对象：{"notes": ["补充笔记点1", "补充笔记点2", "补充笔记点3"]}`,

  quiz: `我将给你一个问题和答案，请基于答案生成一个干扰项：

规则：
- 1. 干扰项生成规则：
    - 如果答案是翻译，生成相似但不同的翻译
    - 如果答案是解释，生成相近但有区别的概念
    - 如果答案是答案，生成相似但错误的答案
    - 干扰项的长度应该与正确答案相近
    - 干扰项的语言要与答案一致，如果答案是英文，干扰项也应该是英文
- 2. 解析要求：
    - 用中文解释为什么这个选项是错的，进行适当补充
    - 解析尽量简洁干练，没有废话

返回格式（仅返回 JSON）：
{
  "text": "干扰选项内容",
  "analysis": "解释为什么这个选项是错的，80字以内"
}`,

  answer: `下面我将给你一个问题和问题的答案，以及一个我的回答。
请你对比我回答的答案和标准答案的相似度评估，从多个方面综合考虑，打分略微严格"。

返回格式为（仅返回 JSON）：
{
  percent: "评分",
  reason: "用中文给出此百分比的理由及可以提升的点，语气亲切，简洁干练，没有废话，100字以内"
}`,
}

// 添加一个辅助函数来显示错误提示
function showErrorToast(message: string) {
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 3000,
  })
}

// 添加基础额度检查函数
const hasEnoughQuota = () => {
  const userStore = useUserStore()
  const quota = userStore.quotaInfo
  return quota.total - quota.used >= 1
}

type ParseMode = 'qa' | 'conversation' | 'vocabulary' | 'free'

export async function parseContentWithAI(content: string, mode: ParseMode) {
  const userStore = useUserStore()
  const settingsStore = useSettingsStore()
  try {
    // 检查 AI 使用限额
    if (!hasEnoughQuota()) {
      throw new Error('超出使用限制')
    }

    await userStore.checkAndUpdateAICount(3)
    const result = await wx.cloud.callFunction({
      name: 'openrouter',
      data: {
        messages: [
          {
            role: 'system',
            content: PROMPTS[mode],
          },
          {
            role: 'user',
            content,
          },
        ],
        model: settingsStore.model,
        max_tokens: 8000,
      },
    })

    const response = result.result as {
      success: boolean
      data?: {
        choices: { message: { content: string } }[]
      }
      error?: string
    }

    if (!response.success || !response.data) {
      throw new Error(response.error || '生成失败')
    }

    const returnContent = response.data.choices[0].message.content
    try {
      const parsed = JSON.parse(returnContent)
      if (!parsed.cards || !Array.isArray(parsed.cards)) {
        throw new Error('返回格式错误')
      }
      return parsed
    } catch (e) {
      throw new Error('解析结果失败')
    }
  } catch (error) {
    // 如果是限额错误，直接抛出
    if ((error as Error).message === '超出使用限制') {
      throw error
    }
    throw error
  }
}

// 添加成笔记的接口
interface GenerateNoteParams {
  frontContent: string
  backContent: string
  side: 'front' | 'back'
}

// 修改生成笔记的函数
export async function generateNoteWithAI({
  frontContent,
  backContent,
  side,
}: GenerateNoteParams): Promise<string[]> {
  const settingsStore = useSettingsStore()

  try {
    // 检查 AI 使用限额
    if (!hasEnoughQuota()) {
      throw new Error('超出使用限制')
    }

    const content = side === 'front' ? `卡片内容：${frontContent}` : `卡片内容：${backContent}`

    const result = await wx.cloud.callFunction({
      name: 'openrouter',
      data: {
        messages: [
          {
            role: 'system',
            content: PROMPTS.note,
          },
          {
            role: 'user',
            content: `请按照上述规则为以下卡片内容生成笔记：\n${content}`,
          },
        ],
        model: settingsStore.model,
        max_tokens: 2000,
      },
    })

    // 检查返回结果的结构
    const response = result.result as {
      success: boolean
      data?: {
        choices: { message: { content: string } }[]
      }
      error?: string
    }

    if (!response.success) {
      throw new Error('生成笔记失败')
    }

    const returnContent = response.data?.choices[0].message.content

    // 解析返回的 JSON 数组
    try {
      const result = JSON.parse(returnContent)
      if (!result.notes || !Array.isArray(result.notes)) {
        throw new Error('笔记格式错误')
      }
      const notes = result.notes
      if (!Array.isArray(notes) || notes.length === 0) {
        throw new Error('笔记生成失败')
      }
      return notes
    } catch (e) {
      throw new Error('笔记格式错误')
    }
  } catch (error) {
    // 如果是限额错误，直接抛出
    if ((error as Error).message === '超出使用限制') {
      throw error
    }
    throw error
  }
}

// 添加生成选择题的接口
export interface QuizOption {
  text: string
  analysis: string
}

interface QuizResult {
  o: QuizOption[]
  a: number
}

export async function generateQuizWithAI(
  frontContent: string,
  backContent: string,
): Promise<QuizResult | null> {
  const settingsStore = useSettingsStore()
  const userStore = useUserStore()

  // 边界情况检查
  // 1. 内容长度检查
  if (frontContent?.length === 0 || backContent?.length === 0 || backContent?.length > 400) {
    console.log('Content too short, skipping quiz generation')
    return null
  }

  // 2. 正反面内容相同检查
  if (frontContent?.trim() === backContent?.trim()) {
    console.log('Front and back content are identical, skipping quiz generation')
    return null
  }

  // 3. 无意义符号组合检查（使用正则表达式检查是否只包含符号）
  const meaningfulContentRegex = /[a-zA-Z\u4e00-\u9fa5]/
  if (!meaningfulContentRegex.test(frontContent) || !meaningfulContentRegex.test(backContent)) {
    console.log('Content contains only symbols, skipping quiz generation')
    return null
  }

  // 4. 额度检查
  if (!hasEnoughQuota()) {
    return null
  }

  try {
    console.time('generateQuizWithAI')
    await userStore.checkAndUpdateAICount()
    const result = await wx.cloud.callFunction({
      name: 'openrouter',
      data: {
        messages: [
          {
            role: 'system',
            content: PROMPTS.quiz,
          },
          {
            role: 'user',
            content: `[问题：${frontContent}]\n[答案：${backContent}]`,
          },
        ],
        model: settingsStore.model,
        max_tokens: 1000,
      },
    })
    console.timeEnd('generateQuizWithAI')

    const response = result.result as {
      success: boolean
      data?: {
        choices: { message: { content: string } }[]
      }
      error?: string
    }

    if (!response.success || !response.data) {
      return null
    }

    const returnContent = response.data.choices[0].message.content
    console.log('Quiz API response:', returnContent)
    const wrongOption = JSON.parse(returnContent)

    // 随机决定正确答案的位置
    const correctAnswerIndex = Math.random() < 0.5 ? 0 : 1

    // 构建选项数组
    const options: QuizOption[] = []
    options[correctAnswerIndex] = {
      text: backContent,
      analysis: 'Bingo! 回答正确~',
    }
    options[correctAnswerIndex ? 0 : 1] = {
      text: wrongOption.text,
      analysis: wrongOption.analysis,
    }

    // 验证生成的选项
    if (!wrongOption || typeof wrongOption !== 'object') {
      console.error('Invalid wrong option data structure')
      return null
    }

    if (!wrongOption.text || typeof wrongOption.text !== 'string') {
      console.error('Invalid wrong option text')
      return null
    }

    if (!wrongOption.analysis || typeof wrongOption.analysis !== 'string') {
      console.error('Invalid wrong option analysis')
      return null
    }

    return {
      o: options,
      a: correctAnswerIndex,
    }
  } catch (error) {
    console.error('Generate quiz error:', error)
    return null
  }
}

// 添加检查答案的接口
interface AnswerCheckResult {
  percent: string
  reason: string
}

export async function checkAnswerWithAI(
  question: string,
  standardAnswer: string,
  userAnswer: string,
): Promise<AnswerCheckResult | null> {
  const settingsStore = useSettingsStore()
  const userStore = useUserStore()

  // 清理文本的辅助函数
  const cleanText = (text: string) => {
    return text
      .trim()
      .toLowerCase()
      .replace(/[.,，。！？!?、\s]/g, '') // 移除标点符号和空白字符
  }

  // 检查是否完全匹配
  const cleanStandardAnswer = cleanText(standardAnswer)
  const cleanUserAnswer = cleanText(userAnswer)

  if (cleanStandardAnswer === cleanUserAnswer) {
    return {
      percent: '100',
      reason: '回答与标准答案完全一致！你的记忆非常准确，继续保持这样的水平。',
    }
  }

  // 额度检查
  if (!hasEnoughQuota()) {
    return null
  }

  try {
    await userStore.checkAndUpdateAICount()
    const result = await wx.cloud.callFunction({
      name: 'openrouter',
      data: {
        messages: [
          {
            role: 'system',
            content: PROMPTS.answer,
          },
          {
            role: 'user',
            content: `问题：${question}
                     答案：${standardAnswer}
                     我的回答：${userAnswer}`,
          },
        ],
        model: settingsStore.model,
        max_tokens: 1000,
      },
    })

    const response = result.result as {
      success: boolean
      data?: {
        choices: { message: { content: string } }[]
      }
      error?: string
    }

    if (!response.success || !response.data) {
      showErrorToast(response.error || '答案检查失败，请重试')
      return null
    }

    const returnContent = response.data.choices[0].message.content
    try {
      return JSON.parse(returnContent)
    } catch (e) {
      showErrorToast('答案检查结果格式错误，请重试')
      return null
    }
  } catch (error) {
    console.error('Check answer error:', error)
    showErrorToast('答案检查失败：' + (error as Error).message)
    return null
  }
}
