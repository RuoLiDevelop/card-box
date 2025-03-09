export type CardItem = {
  frontContent: string
  backContent: string
  frontNote?: string
  backNote?: string
  index: number
  relations?: Record<string, CardRelation>
  studyState?: {
    stage: number // 当前学习阶段(0-5)
    lastStudyTime: number // 上次学习时间戳
    nextStudyTime: number // 下次复习时间戳
  }
}

export type CardRelation = {
  toCardBoxId: string
  toCardItemId: string
  createdAt: number
}

export type CardRelationWithId = CardRelation & {
  id: string
  fromCardBoxId: string
  fromCardItemId: string
}

export type CardBox = {
  name: string
  folderId?: string
  index: number
  color?: number
  cardItems?: {
    [cardItemId: string]: CardItem
  }
  studyState?: {
    isStudying: boolean // 是否在学习中
    startTime: number // 开始学习时间
    dailyNewCards: number // 每日新卡片数量
  }
}

export type CardBoxes = Record<string, CardBox>

export type CardBoxList = (Omit<CardBox, 'cardItems'> & {
  id: string
  cardItems: (CardItem & { id: string })[]
})[]

export type Folder = {
  name: string
  index: number
}

export type Folders = Record<string, Folder>

export type FolderList = (Folder & { id: string })[]

// 学习卡片类型
export type StudyCard = CardItem & {
  id: string
  type: 'new' | 'review'
}

// 学习卡片集合
export type StudyCards = {
  newCards: StudyCard[]
  reviewCards: StudyCard[]
}

export type MarketCardBox = {
  title: string
  description: string
  cards: {
    frontContent: string
    backContent: string
    backNote?: string
    index: number
    isContentCentered: boolean
    isLargeFont: boolean
  }[]
  isContentCentered: boolean
  isLargeFont: boolean
}
