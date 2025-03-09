// 学习模式枚举
export enum StudyMode {
  RECALL = 'recall', // 回忆模式
  QUIZ = 'quiz', // 单选模式
  RECITE = 'recite', // 复述模式
  // 后续可以添加其他模式
  // MATCH = 'match',   // 匹配模式
  // WRITE = 'write',   // 书写模式
}

// 学习模式配置
export interface StudyModeConfig {
  useAI: boolean // 是否使用 AI
  requiresNetwork: boolean // 是否需要网络
  requiresInput: boolean // 是否需要输入
  // 后续可以添加其他配置
  // requiresInput: boolean  // 是否需要输入
}

// 学习模式配置映射
export const STUDY_MODE_CONFIG: Record<StudyMode, StudyModeConfig> = {
  [StudyMode.RECALL]: {
    useAI: false,
    requiresNetwork: false,
    requiresInput: false,
  },
  [StudyMode.QUIZ]: {
    useAI: true,
    requiresNetwork: true,
    requiresInput: false,
  },
  [StudyMode.RECITE]: {
    useAI: true,
    requiresNetwork: true,
    requiresInput: true,
  },
}
