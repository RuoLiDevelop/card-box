import _ from 'lodash'
import { defineStore } from 'pinia'
import { reactive, computed, toRaw } from 'vue'
import { parse, stringify } from 'zipson'

import { CardBoxes, Folders } from '@/types/card'
import nanoid from '@/utils/nanoid'

import { useFolderStore } from './folder'

// 创建持久的防抖函数实例
const debouncedStorageUpdate = _.debounce((cardBoxId: string, cardBox: any) => {
  const key = `cardBox_${cardBoxId}`

  console.time(`更新卡盒 ${cardBoxId}`)
  uni.setStorage({ key, data: stringify(cardBox) })
  console.timeEnd(`更新卡盒 ${cardBoxId}`)
}, 300)

export const useCardDataStore = defineStore(
  'cardData',
  () => {
    const state = reactive({
      cardBoxes: {} as CardBoxes,
      folders: {
        default: { name: '默认目录', index: 0 },
      } as Folders,
    })
    const folderStore = useFolderStore()

    // 初始化加载所有卡盒数据
    const loadCardBoxes = () => {
      const keys = uni.getStorageInfoSync().keys
      const cardBoxKeys = keys.filter((key) => key.startsWith('cardBox_'))

      cardBoxKeys.forEach((key) => {
        const id = key.replace('cardBox_', '')
        const cardBoxData = parse(uni.getStorageSync(key))
        state.cardBoxes[id] = cardBoxData
      })
    }

    // 删除卡盒的存储数据
    const removeCardBoxStorage = (cardBoxId: string) => {
      const key = `cardBox_${cardBoxId}`
      uni.removeStorageSync(key)
    }

    // 更新卡盒的存储数据
    const updateCardBoxStorage = (cardBoxId: string) => {
      const cardBox = state.cardBoxes[cardBoxId]
      if (cardBox) {
        debouncedStorageUpdate(cardBoxId, cardBox)
      }
    }

    // 迁移旧数据到新的存储方式
    const migrateOldData = () => {
      try {
        const oldData = uni.getStorageSync('cardData')
        if (oldData) {
          const { cardBoxes, folders } = JSON.parse(oldData)

          // 迁移文件夹数据
          if (folders) {
            uni.setStorageSync('folders', stringify(folders))
          }

          // 迁移卡盒数据
          if (cardBoxes) {
            Object.entries(cardBoxes).forEach(([cardBoxId, cardBox]) => {
              uni.setStorageSync(`cardBox_${cardBoxId}`, stringify(cardBox))
            })
          }

          // 删除旧数据
          uni.removeStorageSync('cardData')
          console.log('数据迁移完成')
          return true
        }
        return false
      } catch (error) {
        console.error('数据迁移失败:', error)
        return false
      }
    }

    migrateOldData()

    const reorderCardBoxes = () => {
      // 1. 预先过滤出当前文件夹的卡盒
      const currentFolderBoxes = Object.entries(state.cardBoxes).filter(([, box]) => {
        if (!box.folderId) {
          box.folderId = 'default'
          return true
        }
        return box.folderId === folderStore.currentFolderId
      })

      // 2. 一次性排序并更新索引
      currentFolderBoxes
        .sort(([, a], [, b]) => a.index - b.index)
        .forEach(([id], index) => {
          state.cardBoxes[id].index = index
        })
    }

    const cardBoxList = computed(() => {
      console.time('cardBoxList')

      // 直接过滤当前文件夹的卡盒并排序
      console.log('cardBoxList', state.cardBoxes)
      const currentFolderBoxes = Object.entries(state.cardBoxes)
        .filter(([, cardBox]) => cardBox.folderId === folderStore.currentFolderId)
        .map(([cardBoxId, cardBox]) => ({
          id: cardBoxId,
          ...cardBox,
          cardItems: Object.entries(cardBox.cardItems || {})
            .map(([cardItemId, cardItem]) => ({
              id: cardItemId,
              ...cardItem,
            }))
            .sort((a, b) => a.index - b.index),
        }))
        .sort((a, b) => a.index - b.index)

      console.timeEnd('cardBoxList')
      return currentFolderBoxes
    })

    const reorderFolder = () => {
      Object.entries(state.folders)
        .sort(([, a], [, b]) => a.index - b.index)
        .forEach(([id, _], index) => {
          state.folders[id].index = index
        })
    }

    const folderList = computed(() => {
      reorderFolder()
      return Object.entries(state.folders)
        .map(([folderId, folder]) => ({
          id: folderId,
          ...folder,
        }))
        .sort((item1, item2) => item1.index - item2.index)
    })

    const createRelation = (params: {
      cardBoxId: string
      cardItemId: string
      relatedCardBoxId: string
      relatedCardItemId: string
    }) => {
      const { cardBoxId, cardItemId, relatedCardBoxId, relatedCardItemId } = params

      // 检查所有必要的数据是否存在
      if (
        !cardBoxId ||
        !cardItemId ||
        !relatedCardBoxId ||
        !relatedCardItemId ||
        !state.cardBoxes[cardBoxId]?.cardItems?.[cardItemId] ||
        !state.cardBoxes[relatedCardBoxId]?.cardItems?.[relatedCardItemId]
      ) {
        return
      }

      const relationId = nanoid()
      const reverseRelationId = nanoid()

      // 确保 relations 对象存在
      if (!state.cardBoxes[cardBoxId].cardItems[cardItemId].relations) {
        state.cardBoxes[cardBoxId].cardItems[cardItemId].relations = {}
      }
      if (!state.cardBoxes[relatedCardBoxId].cardItems[relatedCardItemId].relations) {
        state.cardBoxes[relatedCardBoxId].cardItems[relatedCardItemId].relations = {}
      }

      // 添加正向关联
      state.cardBoxes[cardBoxId].cardItems[cardItemId].relations![relationId] = {
        toCardBoxId: relatedCardBoxId,
        toCardItemId: relatedCardItemId,
        createdAt: Date.now(),
      }

      // 添加反向关联
      state.cardBoxes[relatedCardBoxId].cardItems[relatedCardItemId].relations![reverseRelationId] =
        {
          toCardBoxId: cardBoxId,
          toCardItemId: cardItemId,
          createdAt: Date.now(),
        }
    }

    const getCardRelations = (cardBoxId: string, cardItemId: string) => {
      const cardItem = state.cardBoxes[cardBoxId]?.cardItems[cardItemId]
      if (!cardItem?.relations) return []

      // 过滤掉指向不存在的卡片或卡盒的关联，并清理无效关联
      return Object.entries(cardItem.relations)
        .filter(([, relation]) => {
          const targetCardBox = state.cardBoxes[relation.toCardBoxId]
          const targetCardExists = targetCardBox && targetCardBox.cardItems?.[relation.toCardItemId]
          return targetCardExists
        })
        .map(([relationId, relation]) => ({
          id: relationId, // 确保包含关联ID
          fromCardBoxId: cardBoxId,
          fromCardItemId: cardItemId,
          toCardBoxId: relation.toCardBoxId,
          toCardItemId: relation.toCardItemId,
          createdAt: relation.createdAt,
        }))
    }

    const deleteCardItem = (cardBoxId: string, cardItemId: string) => {
      const cardItem = state.cardBoxes[cardBoxId]?.cardItems[cardItemId]
      if (!cardItem) return

      // 清理该卡片的所有关联
      if (cardItem.relations) {
        Object.entries(cardItem.relations).forEach(([, relation]) => {
          const targetCard = state.cardBoxes[relation.toCardBoxId]?.cardItems[relation.toCardItemId]
          if (targetCard?.relations) {
            // 删除反向关联
            Object.entries(targetCard.relations).forEach(([id, r]) => {
              if (r.toCardBoxId === cardBoxId && r.toCardItemId === cardItemId) {
                delete targetCard.relations![id]
              }
            })
          }
        })
      }

      // 删除卡片
      delete state.cardBoxes[cardBoxId].cardItems[cardItemId]
    }

    const removeRelation = (cardBoxId: string, cardItemId: string, relationId: string) => {
      const cardItem = state.cardBoxes[cardBoxId]?.cardItems[cardItemId]
      if (!cardItem?.relations?.[relationId]) return

      const relation = cardItem.relations[relationId]
      const targetCard = state.cardBoxes[relation.toCardBoxId]?.cardItems[relation.toCardItemId]

      // 删除正向关联
      delete cardItem.relations[relationId]

      // 如果 relations 为空，删除整个对象
      if (Object.keys(cardItem.relations).length === 0) {
        delete cardItem.relations
      }

      // 删除反向关联
      if (targetCard?.relations) {
        Object.entries(targetCard.relations).forEach(([id, r]) => {
          if (r.toCardBoxId === cardBoxId && r.toCardItemId === cardItemId) {
            delete targetCard.relations![id]
            // 如果 relations 为空，删除整个对象
            if (Object.keys(targetCard.relations!).length === 0) {
              delete targetCard.relations
            }
          }
        })
      }
    }

    return {
      cardBoxes: state.cardBoxes,
      folders: state.folders,
      folderList,
      cardBoxList,
      reorderCardBoxes,
      createRelation,
      getCardRelations,
      removeRelation,
      deleteCardItem,
      loadCardBoxes,
      // 导出新的存储相关方法
      updateCardBoxStorage,
      removeCardBoxStorage,
    }
  },
  {
    persist: [
      {
        paths: ['folders'],
        key: 'folders',
      },
    ],
  },
)
