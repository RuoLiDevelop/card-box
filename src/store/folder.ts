import { defineStore } from 'pinia'

import nanoid from '@/utils/nanoid'

import { useCardDataStore } from './cardData'

const initState: {
  currentFolderId: string
} = {
  currentFolderId: 'default',
}

export const useFolderStore = defineStore(
  'folders',
  () => {
    const cardDataStore = useCardDataStore()
    const state = reactive({ ...initState })

    const updateCurrentFolderId = (folderId: string) => {
      state.currentFolderId = folderId
    }

    const addFolder = (name: string) => {
      cardDataStore.folders[nanoid()] = {
        name,
        index: cardDataStore.folderList.length,
      }
    }

    const removeFolder = (folderId: string) => {
      // 删除文件夹下的所有卡盒
      Object.entries(cardDataStore.cardBoxes).forEach(([cardBoxId, cardBox]) => {
        if (cardBox.folderId === folderId) {
          delete cardDataStore.cardBoxes[cardBoxId]
        }
      })

      // 删除文件夹
      delete cardDataStore.folders[folderId]

      // 如果删除的是当前文件夹，切换到默认文件夹
      if (state.currentFolderId === folderId) {
        state.currentFolderId = 'default'
      }
    }

    const renameFolder = (folderId: string, name: string) => {
      cardDataStore.folders[folderId].name = name
    }

    return {
      ...toRefs(state),
      addFolder,
      updateCurrentFolderId,
      removeFolder,
      renameFolder,
    }
  },
  {
    persist: true,
  },
)
