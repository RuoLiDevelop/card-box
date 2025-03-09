import _ from 'lodash'
import { defineStore } from 'pinia'

import { CardItem } from '@/types/card'
import nanoid from '@/utils/nanoid'

import { useCardDataStore } from './cardData'

const initState = {
  contentEditId: '',
  isCardItemDeleting: false,
  scrollToCardItemId: '',
  multiSelectMode: {} as {
    [cardBoxId: string]: {
      active: boolean
      selectedIds: string[]
    }
  },
  selectedCardItems: {} as Record<string, string[]>,
}

export const useCardItemStore = defineStore('cardItem', () => {
  const cardDataStore = useCardDataStore()
  const state = reactive({ ...initState })

  /**
   * 删除一个卡片
   */
  const removeCardItem = (cardBoxId: string, cardItemId: string) => {
    const cardBox = cardDataStore.cardBoxes[cardBoxId]
    if (!cardBox) return

    if (cardBox.cardItems[cardItemId]) {
      const deletedIndex = cardBox.cardItems[cardItemId].index
      delete cardBox.cardItems[cardItemId]

      Object.values(cardBox.cardItems)
        .slice(deletedIndex)
        .forEach((item) => {
          item.index--
        })

      // 手动更新存储
      cardDataStore.updateCardBoxStorage(cardBoxId)
    }
  }

  /**
   * 添加一个卡片
   */
  const addCardItem = (cardBoxId: string, cardItem: Partial<CardItem>) => {
    const cardBox = cardDataStore.cardBoxes[cardBoxId]
    if (!cardBox) return

    const id = nanoid()
    const index = Object.keys(cardBox.cardItems).length

    cardBox.cardItems[id] = {
      frontContent: '',
      backContent: '',
      index,
      ...cardItem,
    }

    // 手动更新存储
    cardDataStore.updateCardBoxStorage(cardBoxId)

    return id
  }

  /**
   * 进入卡片内容编辑模式
   */
  const enterContentEditMode = (cardItemId: string) => {
    state.contentEditId = cardItemId
  }

  /**
   * 退出卡片内容编辑模式
   */
  const exitContentEditMode = () => {
    state.contentEditId = ''
  }

  /**
   * 更新卡片项的内容
   */
  const updateCardItemContent = (
    cardBoxId: string,
    cardItemId: string,
    newCardItem: Omit<CardItem, 'index'>,
  ) => {
    const cardBox = cardDataStore.cardBoxes[cardBoxId]
    cardBox.cardItems[cardItemId] = { index: cardBox.cardItems[cardItemId].index, ...newCardItem }

    // 手动更新存储
    cardDataStore.updateCardBoxStorage(cardBoxId)
  }

  const scrollToCardItem = (cardItemId: string) => {
    state.scrollToCardItemId = cardItemId
  }

  // 多选相关方法
  const enterMultiSelectMode = (cardBoxId: string, cardItemId: string) => {
    state.multiSelectMode[cardBoxId] = {
      active: true,
      selectedIds: [cardItemId],
    }
  }

  const exitMultiSelectMode = (cardBoxId: string) => {
    if (state.multiSelectMode[cardBoxId]) {
      state.multiSelectMode[cardBoxId].active = false
      state.multiSelectMode[cardBoxId].selectedIds = []
    }
  }

  const isMultiSelectMode = (cardBoxId: string) => {
    return state.multiSelectMode[cardBoxId]?.active || false
  }

  const toggleCardItemSelection = (cardBoxId: string, cardItemId: string) => {
    if (!state.multiSelectMode[cardBoxId]) return

    const selectedIds = state.multiSelectMode[cardBoxId].selectedIds
    const index = selectedIds.indexOf(cardItemId)

    if (index === -1) {
      selectedIds.push(cardItemId)
    } else {
      selectedIds.splice(index, 1)
    }
  }

  const isCardItemSelected = (cardBoxId: string, cardItemId: string) => {
    return state.multiSelectMode[cardBoxId]?.selectedIds.includes(cardItemId) || false
  }

  const getSelectedCardItems = (cardBoxId: string) => {
    return state.multiSelectMode[cardBoxId]?.selectedIds || []
  }

  const deleteSelectedCardItems = (cardBoxId: string, selectedIds: string[]) => {
    const cardBox = cardDataStore.cardBoxes[cardBoxId]
    if (!cardBox) return

    selectedIds.forEach((id) => {
      if (cardBox.cardItems[id]) {
        removeCardItem(cardBoxId, id)
      }
    })
  }

  const clearCardItemSelection = (cardBoxId: string) => {
    if (state.multiSelectMode[cardBoxId]) {
      state.multiSelectMode[cardBoxId].selectedIds = []
    }
  }

  const selectAllCardItems = (cardBoxId: string) => {
    const cardBox = cardDataStore.cardBoxes[cardBoxId]
    if (!cardBox) return

    if (!state.multiSelectMode[cardBoxId]) {
      state.multiSelectMode[cardBoxId] = {
        active: true,
        selectedIds: [],
      }
    }

    state.multiSelectMode[cardBoxId].selectedIds = Object.keys(cardBox.cardItems)
  }

  const toggleSelectCardItem = (cardBoxId: string, cardItemId: string) => {
    if (!state.selectedCardItems[cardBoxId]) {
      state.selectedCardItems[cardBoxId] = []
    }
    const index = state.selectedCardItems[cardBoxId].indexOf(cardItemId)
    if (index > -1) {
      state.selectedCardItems[cardBoxId].splice(index, 1)
    } else {
      state.selectedCardItems[cardBoxId].push(cardItemId)
    }
  }

  const unselectAllCardItems = (cardBoxId: string) => {
    if (state.multiSelectMode[cardBoxId]) {
      state.multiSelectMode[cardBoxId].selectedIds = []
    }
  }

  const moveCardItems = (params: {
    fromCardBoxId: string
    toCardBoxId: string
    cardItemIds: string[]
  }) => {
    const { fromCardBoxId, toCardBoxId, cardItemIds } = params
    const fromCardBox = cardDataStore.cardBoxes[fromCardBoxId]
    const toCardBox = cardDataStore.cardBoxes[toCardBoxId]

    if (!fromCardBox || !toCardBox) return

    // 获取目标卡盒的当前最大索引
    const currentMaxIndex = Object.values(toCardBox.cardItems).reduce(
      (max, item) => Math.max(max, item.index),
      -1,
    )

    // 移动卡片并更新索引
    cardItemIds.forEach((cardItemId, idx) => {
      const cardItem = fromCardBox.cardItems[cardItemId]
      if (cardItem) {
        // 在新位置添加卡片
        toCardBox.cardItems[cardItemId] = {
          ...cardItem,
          index: currentMaxIndex + 1 + idx,
        }
        // 从原位置删除卡片
        delete fromCardBox.cardItems[cardItemId]
      }
    })

    // 更新两个卡盒的存储
    cardDataStore.updateCardBoxStorage(fromCardBoxId)
    cardDataStore.updateCardBoxStorage(toCardBoxId)
  }

  return {
    ...toRefs(state),
    removeCardItem,
    addCardItem,
    enterContentEditMode,
    exitContentEditMode,
    updateCardItemContent,
    scrollToCardItem,
    enterMultiSelectMode,
    exitMultiSelectMode,
    isMultiSelectMode,
    toggleCardItemSelection,
    isCardItemSelected,
    getSelectedCardItems,
    deleteSelectedCardItems,
    clearCardItemSelection,
    selectAllCardItems,
    toggleSelectCardItem,
    unselectAllCardItems,
    moveCardItems,
  }
})
