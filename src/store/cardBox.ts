import _ from 'lodash'
import { defineStore } from 'pinia'

import { gradients } from '@/constants/gradients'
import { CardBoxes, CardItem, StudyCard, StudyCards } from '@/types/card'
import nanoid from '@/utils/nanoid'

import { useCardDataStore } from './cardData'
import { useFolderStore } from './folder'

const initState: {
  scrollTop: number
  editCardBoxId: string
  cardBoxLayouts: Record<string, 'grid' | 'list'>
  cardBoxContentAligns: Record<string, boolean>
  cardBoxFontSizes: Record<string, boolean>
  cardBoxShowNumbers: Record<string, boolean>
  cardBoxSettings: Record<string, CardBoxSettings>
  defaultSettings: CardBoxSettings
} = {
  scrollTop: 0,
  editCardBoxId: '',
  cardBoxLayouts: {},
  cardBoxContentAligns: {},
  cardBoxFontSizes: {},
  cardBoxShowNumbers: {},
  cardBoxSettings: {},
  defaultSettings: {
    layout: 'grid',
    fontSize: false,
    contentAlign: false,
    showNumber: true,
    autoReadFront: false,
    autoReadBack: false,
  },
}

// 添加获取随机颜色的工具函数
const getRandomColor = () => {
  return Math.floor(Math.random() * gradients.length)
}

// 记忆阶段的时间间隔（单位：天）
export const memoryStages = [1, 2, 4, 7, 15, 30]
// 每天最大复习卡片数量
export const MAX_REVIEW_CARDS = 200

interface CardBoxSettings {
  layout: 'list' | 'grid'
  fontSize: boolean
  contentAlign: boolean
  showNumber: boolean
  autoReadFront: boolean
  autoReadBack: boolean
}

// 缓存时间戳计算
const getTodayTimestamp = (() => {
  let timestamp: number | null = null
  let lastDate: string | null = null

  return () => {
    const today = new Date().toDateString()
    if (lastDate !== today) {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      timestamp = now.getTime()
      lastDate = today
    }
    return timestamp!
  }
})()

export const useCardBoxStore = defineStore(
  'cardBox',
  () => {
    const cardDataStore = useCardDataStore()
    const folderStore = useFolderStore()
    const state = reactive({ ...initState })

    // 为每个卡盒创建独立的计算属性，但只监听特定卡盒的变化
    const createCardBoxStudyKey = (cardBoxId: string) =>
      computed(() => {
        const cardBox = toRef(cardDataStore.cardBoxes, cardBoxId).value
        if (!cardBox?.studyState) return cardBoxId

        // 只关注当前卡盒的关键数据
        const cardCount = Object.keys(cardBox.cardItems).length
        const lastStudyTime = Math.max(
          ...Object.values(cardBox.cardItems).map((item) => item.studyState?.lastStudyTime || 0),
        )
        const dailyNewCards = cardBox.studyState.dailyNewCards

        return `${cardBoxId}:${cardCount}:${lastStudyTime}:${dailyNewCards}`
      })

    // 使用 ref 存储计算结果
    const studyCardsCache = new Map<string, any>()

    /**
     * 添加一个新的卡盒
     * @param {string} cardBoxName - 卡盒名
     */
    const addCardBox = (params: { name: string; folderId?: string }) => {
      const id = nanoid()
      const index = cardDataStore.cardBoxList.length + 1

      // 直接在 cardBoxes 中添加新卡盒
      cardDataStore.cardBoxes[id] = {
        name: params.name,
        folderId: params.folderId || 'default',
        index,
        cardItems: {},
      }

      // 手动更新存储
      cardDataStore.updateCardBoxStorage(id)

      return id
    }

    /**
     * 删除一个卡盒
     * @param {string} cardBoxId - 卡盒ID
     * @returns {boolean} 是否删除成功
     */
    const deleteCardBox = (cardBoxId: string): boolean => {
      if (!cardDataStore.cardBoxes[cardBoxId]) {
        return false
      }

      // 删除卡盒
      delete cardDataStore.cardBoxes[cardBoxId]

      // 重新排序 (reorderCardBoxes 内部会触发响应式更新)
      cardDataStore.reorderCardBoxes()

      // 删除存储
      cardDataStore.removeCardBoxStorage(cardBoxId)

      return !cardDataStore.cardBoxes[cardBoxId]
    }

    /**
     * 移动卡盒到文件夹
     * @param {string} cardBoxId - 卡盒ID
     * @param {string} folderId - 文件夹ID
     */
    const moveCardBoxToFolder = (cardBoxId: string, folderId: string) => {
      const cardBox = cardDataStore.cardBoxes[cardBoxId]
      const index = Object.keys(cardDataStore.cardBoxes).filter(
        (id) => cardDataStore.cardBoxes[id].folderId === folderId,
      ).length
      if (cardBox) {
        cardBox.folderId = folderId
        cardBox.index = index
        // 只重排卡盒
        cardDataStore.reorderCardBoxes()
        // 手动更新存储
        cardDataStore.updateCardBoxStorage(cardBoxId)
      }
    }

    /**
     * 进入卡盒编辑模式
     * @param {string} cardBoxId - 卡盒ID
     */
    const enterCardBoxEditMode = (cardBoxId: string) => {
      state.editCardBoxId = cardBoxId
    }

    /**
     * 退出卡盒编辑模式
     */
    const exitCardBoxEditMode = () => {
      state.editCardBoxId = ''
    }

    /**
     * 检查是否处于卡片编辑模式
     * @param {string} cardBoxId - 卡盒ID
     * @returns {boolean}
     */
    const isCardBoxEditMode = (cardBoxId: string) => {
      return state.editCardBoxId === cardBoxId
    }

    /**
     * 重命名卡盒
     * @param {string} cardBoxId - 卡盒ID
     * @param {string} name - 新名称
     */
    const renameCardBox = (cardBoxId: string, name: string) => {
      cardDataStore.cardBoxes[cardBoxId].name = name
      // 手动更新存储
      cardDataStore.updateCardBoxStorage(cardBoxId)
    }

    /**
     * 解析卡片内容
     * @param {string} content - 内容
     * @param {string} cardSplit - 卡片分隔符
     * @param {string} sideSplit - 卡片正反分隔符
     * @returns {Array<{ frontContent: string; backContent: string }>}
     * */

    const parseCardItemsContent = ({
      content,
      cardSplit,
      sideSplit,
    }: {
      content: string
      cardSplit: string
      sideSplit: string
    }) => {
      const cards = content.split(cardSplit)
      return cards
        .map((card) => {
          const [frontContent, backContent] = card.split(sideSplit)
          return {
            frontContent: frontContent || ''.trim(),
            backContent: backContent || ''.trim(),
          }
        })
        .filter((item) => item.frontContent || item.backContent)
    }

    /**
     * 导入卡片到卡盒
     * @param {string} cardBoxId - 卡盒ID
     * @param {Array<{ frontContent: string; backContent: string }>} newItems - 新卡片项
     * */
    const importCardItems = (cardBoxId: string, newItems: CardItem[]) => {
      const cardBox = cardDataStore.cardBoxes[cardBoxId]
      const newCardItems = {}
      const baseIndex = Object.keys(cardBox.cardItems || {}).length

      newItems.forEach((item, index) => {
        // 创建新卡片对象
        const newCardItem = {
          frontContent: item.frontContent,
          backContent: item.backContent,
          frontNote: item.frontNote || '',
          backNote: item.backNote || '',
          index: baseIndex + index,
        } as CardItem

        // 如果卡盒处于学习状态,初始化卡片的学习状态
        if (cardBox.studyState?.isStudying) {
          newCardItem.studyState = {
            stage: 0,
            lastStudyTime: 0,
            nextStudyTime: 0,
          }
        }

        newCardItems[nanoid()] = newCardItem
      })
      Object.assign(cardBox.cardItems, newCardItems)
      cardDataStore.updateCardBoxStorage(cardBoxId)
    }

    /**
     * 导入卡盒
     * @param {Object} params - 导入参数
     * @param {string} params.name - 卡盒名称
     * @param {Array<CardItem>} params.cards - 卡片列表
     * @param {string} params.folderId - 目录ID
     * @param {boolean} params.isContentCentered - 是否居中显示
     * @param {boolean} params.isLargeFont - 是否使用大字体
     */
    const importCardBox = (params: {
      name: string
      cards: CardItem[]
      folderId?: string
      isContentCentered?: boolean
      isLargeFont?: boolean
    }) => {
      const newCardBoxId = nanoid()
      const folderId = params.folderId || folderStore.currentFolderId
      const index = Object.keys(cardDataStore.cardBoxes).filter(
        (id) => cardDataStore.cardBoxes[id].folderId === folderId,
      ).length
      cardDataStore.cardBoxes[newCardBoxId] = {
        name: params.name,
        index,
        cardItems: {},
        folderId,
      }
      importCardItems(newCardBoxId, params.cards)

      // 设置卡盒的显示设置
      if (params.isContentCentered !== undefined) {
        state.cardBoxContentAligns[newCardBoxId] = params.isContentCentered
      }
      if (params.isLargeFont !== undefined) {
        state.cardBoxFontSizes[newCardBoxId] = params.isLargeFont
      }

      cardDataStore.updateCardBoxStorage(newCardBoxId)

      return newCardBoxId
    }

    const toggleCardBoxLayout = (cardBoxId: string) => {
      const currentLayout = state.cardBoxLayouts[cardBoxId] || 'grid'
      state.cardBoxLayouts[cardBoxId] = currentLayout === 'grid' ? 'list' : 'grid'
    }

    const getCardBoxLayout = (cardBoxId: string) => {
      return state.cardBoxLayouts[cardBoxId] || 'grid'
    }

    const getCardBoxContentAlign = (cardBoxId: string) => {
      return state.cardBoxContentAligns[cardBoxId] || false
    }

    const toggleCardBoxContentAlign = (cardBoxId: string) => {
      state.cardBoxContentAligns[cardBoxId] = !state.cardBoxContentAligns[cardBoxId]
    }

    const getCardBoxFontSize = (cardBoxId: string) => {
      return state.cardBoxFontSizes[cardBoxId] || false
    }

    const toggleCardBoxFontSize = (cardBoxId: string) => {
      state.cardBoxFontSizes[cardBoxId] = !state.cardBoxFontSizes[cardBoxId]
    }

    // 修改获取卡盒颜色的方法
    const getCardBoxColor = (cardBoxId: string) => {
      const cardBox = cardDataStore.cardBoxes[cardBoxId]
      if (!cardBox) {
        return 0 // 如果卡盒不存在，返回默认颜色
      }

      if (cardBox.color === undefined) {
        // 如果没有颜色，随机生成一个并保存
        const randomColor = getRandomColor()
        cardBox.color = randomColor
        return randomColor
      }

      return cardBox.color
    }

    // 修改更卡盒颜色的方法
    const updateCardBoxColor = (cardBoxId: string, colorIndex: number) => {
      const cardBox = cardDataStore.cardBoxes[cardBoxId]
      if (cardBox) {
        cardBox.color = colorIndex
        cardDataStore.updateCardBoxStorage(cardBoxId)
      }
    }

    const getCardBoxShowNumber = (cardBoxId: string) => {
      return state.cardBoxShowNumbers[cardBoxId] || false
    }

    const toggleCardBoxShowNumber = (cardBoxId: string) => {
      state.cardBoxShowNumbers[cardBoxId] = !state.cardBoxShowNumbers[cardBoxId]
    }

    // 添加正反对调方法
    const swapCardFrontBack = (cardBoxId: string) => {
      const cardBox = cardDataStore.cardBoxes[cardBoxId]
      if (!cardBox) return

      // 遍历所有卡片，交换正反面内容
      for (const item of Object.values(cardBox.cardItems)) {
        // 交换内容
        const tempFrontContent = item.frontContent
        item.frontContent = item.backContent
        item.backContent = tempFrontContent

        // 交换笔记
        const tempFrontNote = item.frontNote
        item.frontNote = item.backNote
        item.backNote = tempFrontNote
      }

      // 更新存储
      cardDataStore.updateCardBoxStorage(cardBoxId)
    }

    // 开始学习计划
    const startStudyPlan = (cardBoxId: string, dailyNewCards: number) => {
      const cardBox = cardDataStore.cardBoxes[cardBoxId]
      if (!cardBox) return

      // 初始化卡盒学习状态
      cardBox.studyState = {
        isStudying: true,
        startTime: Date.now(),
        dailyNewCards,
      }

      // 初始化所有卡片的学习状态为第一
      for (const item of Object.values(cardBox.cardItems)) {
        item.studyState = {
          stage: 0,
          lastStudyTime: 0,
          nextStudyTime: 0,
        }
      }

      // 更新存储
      cardDataStore.updateCardBoxStorage(cardBoxId)
    }

    // 退出学习
    const exitStudy = (cardBoxId: string) => {
      const cardBox = cardDataStore.cardBoxes[cardBoxId]
      if (!cardBox) return

      // 清空学习状态
      delete cardBox.studyState
      for (const item of Object.values(cardBox.cardItems)) {
        delete item.studyState
      }

      // 更新存储
      cardDataStore.updateCardBoxStorage(cardBoxId)
    }

    // 创建一个防抖的进度计算函数
    const calculateProgress = _.debounce((cardBox: CardBoxes[string] | undefined) => {
      console.time('calculateProgress')
      if (!cardBox?.studyState) return 0

      let completedStages = 0
      let totalStages = 0

      for (const item of Object.values(cardBox.cardItems)) {
        if (item.studyState) {
          completedStages += item.studyState.stage
          totalStages += memoryStages.length
        }
      }

      console.timeEnd('calculateProgress')
      return totalStages === 0 ? 0 : Math.floor((completedStages / totalStages) * 100)
    }, 100)

    // 计算卡盒的学习进度
    const getStudyProgress = (cardBoxId: string) => {
      const cardBox = cardDataStore.cardBoxes[cardBoxId]
      return calculateProgress(cardBox)
    }

    // 更新卡片学习状态
    const updateCardStudyState = (cardBoxId: string, cardItemId: string) => {
      console.time('updateCardStudyState')
      const cardBox = cardDataStore.cardBoxes[cardBoxId]
      const cardItem = cardBox?.cardItems[cardItemId]
      if (!cardBox?.studyState || !cardItem) return

      const now = Date.now()
      const todayTimestamp = getTodayTimestamp()

      // 获取当前阶段
      const currentStage = cardItem.studyState?.stage || 0
      const nextStage = Math.min(memoryStages.length, currentStage + 1)

      // 计算下次复习时间（避免创建新的 Date 对象）
      const nextStudyTime = todayTimestamp + memoryStages[currentStage] * 24 * 60 * 60 * 1000

      // 更新学习状态
      cardItem.studyState = {
        stage: nextStage,
        lastStudyTime: now,
        nextStudyTime,
      }

      // 更新完成后清除缓存
      clearTodayStudyCardsCache(cardBoxId)
      cardDataStore.updateCardBoxStorage(cardBoxId)

      console.timeEnd('updateCardStudyState')
    }

    // 获取今天需要学习的卡片
    const getTodayStudyCards = (cardBoxId: string): StudyCards => {
      // 如果缓存存在且 key 没变，直接返回缓存
      const cardBox = cardDataStore.cardBoxes[cardBoxId]
      if (!cardBox?.studyState) return { reviewCards: [], newCards: [] }

      const cacheKey = createCardBoxStudyKey(cardBoxId).value
      if (studyCardsCache.has(cacheKey)) {
        return studyCardsCache.get(cacheKey)
      }

      // 计算新结果
      const result = calculateTodayStudyCards(cardBoxId)
      studyCardsCache.set(cacheKey, result)
      return result
    }

    // 将原来的 getTodayStudyCards 逻辑移到这个函数中
    const calculateTodayStudyCards = (cardBoxId: string): StudyCards => {
      console.time('calculateTodayStudyCards')
      const cardBox = cardDataStore.cardBoxes[cardBoxId]
      if (!cardBox?.studyState) return { reviewCards: [], newCards: [] }

      const now = Date.now()
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)
      const todayTimestamp = today.getTime()
      const tomorrowTimestamp = todayTimestamp + 24 * 60 * 60 * 1000

      // 获取今天可学习的上限
      const maxNewCards = cardBox.studyState.dailyNewCards
      const maxReviewCards = MAX_REVIEW_CARDS

      // 创建索引结构，按学习状态分类卡片
      const cardIndices = {
        todayStudied: new Set<string>(),
        newCards: new Set<string>(),
        reviewCards: new Map<string, number>(), // cardId -> nextStudyTime
      }

      // 1. 首次遍历建立索引，同时计算今天已学习的数量
      const todayCounts = { newCount: 0, reviewCount: 0 }

      for (const [id, item] of Object.entries(cardBox.cardItems)) {
        const lastStudyTime = item.studyState?.lastStudyTime || 0
        const stage = item.studyState?.stage || 0

        // 记录今天已学习的卡片
        if (lastStudyTime >= todayTimestamp && lastStudyTime < tomorrowTimestamp) {
          cardIndices.todayStudied.add(id)
          if (stage === 1) todayCounts.newCount++
          else if (stage > 1) todayCounts.reviewCount++
          continue
        }

        // 记录新卡片
        if (!lastStudyTime || stage === 0) {
          cardIndices.newCards.add(id)
          continue
        }

        // 记录需要复习的卡片
        if (stage > 0 && stage < memoryStages.length) {
          const nextStudyTime = item.studyState!.nextStudyTime
          if (nextStudyTime <= now || (nextStudyTime - now) / (60 * 1000) <= 1) {
            cardIndices.reviewCards.set(id, nextStudyTime)
          }
        }
      }

      // 2. 计算还需要多少卡片
      const remainingNew = Math.max(0, maxNewCards - todayCounts.newCount)
      const remainingReview = Math.max(0, maxReviewCards - todayCounts.reviewCount)

      // 3. 如果都达到上限，直接返回
      if (remainingNew === 0 && remainingReview === 0) {
        console.timeEnd('calculateTodayStudyCards')
        return { reviewCards: [], newCards: [] }
      }

      // 4. 从索引中获取需要学习的卡片
      const result: StudyCards = {
        newCards: [] as StudyCard[],
        reviewCards: [] as StudyCard[],
      }

      // 处理新卡片
      if (remainingNew > 0) {
        const newCardIds = Array.from(cardIndices.newCards).slice(0, remainingNew)
        for (const id of newCardIds) {
          const item = cardBox.cardItems[id]
          result.newCards.push({ id, ...item, type: 'new' })
        }
      }

      // 处理复习卡片
      if (remainingReview > 0) {
        // 按照 nextStudyTime 排序复习卡片
        const sortedReviewCards = Array.from(cardIndices.reviewCards.entries())
          .sort(([, a], [, b]) => a - b)
          .slice(0, remainingReview)

        for (const [id] of sortedReviewCards) {
          const item = cardBox.cardItems[id]
          result.reviewCards.push({ id, ...item, type: 'review' })
        }
      }

      console.timeEnd('calculateTodayStudyCards')
      return result
    }

    // 清除缓存的方法
    const clearTodayStudyCardsCache = (cardBoxId: string) => {
      const cacheKey = createCardBoxStudyKey(cardBoxId).value
      studyCardsCache.delete(cacheKey)
    }

    // 获取学习状态
    const getStudyState = (cardBoxId: string) => {
      console.time('getStudyState')
      const cardBox = cardDataStore.cardBoxes[cardBoxId]
      if (!cardBox?.studyState) return null

      // 使用已计算的进度
      if (getStudyProgress(cardBoxId) === 100) {
        return {
          isStudying: true,
          status: 'completed',
          message: '已完成学习',
        }
      }

      // 缓存 todayCards 的结果
      const todayCards = getTodayStudyCards(cardBoxId)
      if (todayCards.reviewCards.length > 0 || todayCards.newCards.length > 0) {
        return {
          isStudying: true,
          status: 'active',
          message: '今日学习',
        }
      }

      // 获取最早需要复习的时间
      const now = Date.now()
      const nextReviewTime = Object.values(cardBox.cardItems)
        .filter((item) => item.studyState?.stage > 0 && item.studyState.stage < memoryStages.length)
        .map((item) => item.studyState!.nextStudyTime)
        .reduce((min, time) => Math.min(min, time), Infinity)

      if (nextReviewTime === Infinity) {
        return {
          isStudying: true,
          status: 'completed',
          message: '全部完成',
        }
      }

      // 计算距离下次复习的时间（分钟）
      const minutesUntilReview = (nextReviewTime - now) / (60 * 1000)
      console.timeEnd('getStudyState')
      // 如果时间差小于1分钟显示开始学习
      if (minutesUntilReview <= 1) {
        return {
          isStudying: true,
          status: 'active',
          message: '开始学习',
        }
      }

      // 如果复习时间在1小时内,显示分钟
      if (minutesUntilReview <= 60) {
        return {
          isStudying: true,
          status: 'waiting',
          message: `${Math.ceil(minutesUntilReview)}分钟后复习`,
        }
      }

      // 如果复习时间在24小时内,显示小时
      if (minutesUntilReview <= 24 * 60) {
        return {
          isStudying: true,
          status: 'waiting',
          message: `${Math.ceil(minutesUntilReview / 60)}小时后复习`,
        }
      }

      // 超过24小时则显示天数
      const daysUntilReview = Math.ceil(minutesUntilReview / (24 * 60))
      return {
        isStudying: true,
        status: 'waiting',
        message: `${daysUntilReview}天后复习`,
      }
    }

    // 切换正面自动朗读
    const toggleCardBoxAutoReadFront = (cardBoxId: string) => {
      if (!state.cardBoxSettings[cardBoxId]) {
        state.cardBoxSettings[cardBoxId] = { ...initState.defaultSettings }
      }
      state.cardBoxSettings[cardBoxId].autoReadFront =
        !state.cardBoxSettings[cardBoxId].autoReadFront
    }

    // 切换背面自动朗读
    const toggleCardBoxAutoReadBack = (cardBoxId: string) => {
      if (!state.cardBoxSettings[cardBoxId]) {
        state.cardBoxSettings[cardBoxId] = { ...initState.defaultSettings }
      }
      state.cardBoxSettings[cardBoxId].autoReadBack = !state.cardBoxSettings[cardBoxId].autoReadBack
    }

    // 获取正面自动朗读状态
    const getCardBoxAutoReadFront = (cardBoxId: string) => {
      return (
        state.cardBoxSettings[cardBoxId]?.autoReadFront ?? initState.defaultSettings.autoReadFront
      )
    }

    // 获取背面自动朗读状态
    const getCardBoxAutoReadBack = (cardBoxId: string) => {
      return (
        state.cardBoxSettings[cardBoxId]?.autoReadBack ?? initState.defaultSettings.autoReadBack
      )
    }

    return {
      ...toRefs(state),
      addCardBox,
      deleteCardBox,
      enterCardBoxEditMode,
      exitCardBoxEditMode,
      isCardBoxEditMode,
      renameCardBox,
      parseCardItemsContent,
      importCardBox,
      importCardItems,
      toggleCardBoxLayout,
      getCardBoxLayout,
      getCardBoxContentAlign,
      toggleCardBoxContentAlign,
      getCardBoxFontSize,
      toggleCardBoxFontSize,
      updateCardBoxColor,
      getCardBoxShowNumber,
      toggleCardBoxShowNumber,
      getCardBoxColor,
      startStudyPlan,
      updateCardStudyState,
      getTodayStudyCards,
      exitStudy,
      getStudyProgress,
      getStudyState,
      toggleCardBoxAutoReadFront,
      toggleCardBoxAutoReadBack,
      getCardBoxAutoReadFront,
      getCardBoxAutoReadBack,
      clearTodayStudyCardsCache,
      moveCardBoxToFolder,
      swapCardFrontBack,
    }
  },
  {
    persist: true,
  },
)
