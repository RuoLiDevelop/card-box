<template>
  <wd-popup
    lockScroll
    customClass="rounded-2xl"
    position="bottom"
    :safe-area-inset-bottom="true"
    :modelValue="isShow"
    @close="$emit('close')"
  >
    <view class="bg-white rounded-xl overflow-hidden">
      <!-- 标题栏 -->
      <view class="p-5 space-y-5">
        <!-- 标题区域 -->
        <view class="flex items-center justify-between mb-2">
          <view class="text-lg font-semibold text-gray-800">
            {{ getTitle }}
          </view>
          <view class="flex items-center gap-2">
            <view
              v-if="!mode"
              class="text-sm text-gray-600 py-1 px-3 rounded-full"
              hoverClass="bg-gray-50"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="onAddFolderClick"
            >
              新建目录
            </view>
            <view
              class="text-sm text-gray-400 py-1 px-3 rounded-full"
              hoverClass="bg-gray-50"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="$emit('close')"
            >
              关闭
            </view>
          </view>
        </view>

        <!-- 目录列表 -->
        <scroll-view scroll-y class="max-h-[50vh]">
          <view class="space-y-3">
            <view v-for="folder in cardDataStore.folderList" :key="folder.id">
              <view
                class="flex items-center gap-3 p-4 rounded-xl transition-all border relative overflow-hidden"
                @tap="onFolderClick(folder.id)"
                :class="[
                  isSelected(folder.id)
                    ? 'bg-indigo-50 border-indigo-500 shadow-sm shadow-indigo-100'
                    : 'border-gray-100 hover:border-gray-200',
                ]"
                hoverClass="scale-97 origin-center"
                :hoverStartTime="0"
                :hoverStayTime="200"
              >
                <view class="flex gap-3 items-center relative flex-1 min-w-0">
                  <view
                    :class="[
                      folder.id === 'default'
                        ? 'i-tabler-folder-star'
                        : isSelected(folder.id)
                          ? 'i-tabler-folder-open'
                          : 'i-tabler-folder',
                      isSelected(folder.id) ? 'text-indigo-500' : 'text-gray-500',
                      'text-xl flex-shrink-0',
                    ]"
                  />
                  <view
                    class="text-sm truncate"
                    :class="[
                      isSelected(folder.id) ? 'text-indigo-500 font-medium' : 'text-gray-700',
                    ]"
                  >
                    {{ folder.name }}
                  </view>
                </view>
                <view
                  v-if="!mode"
                  class="w-7 h-7 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-50 relative flex-shrink-0"
                  @tap.stop="onMoreBtnClick(folder.id)"
                >
                  <view class="i-tabler-dots text-base" />
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 底部按钮 -->
      <view class="px-5 pb-5">
        <view
          v-if="mode === 'import'"
          class="w-full h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 transition-all"
          hoverClass="scale-97 origin-center"
          :hoverStayTime="200"
          :hoverStartTime="0"
          @tap="onImportClick"
        >
          <text class="i-tabler-download text-white" />
          <text class="text-white font-medium">导入到此目录</text>
        </view>
        <view
          v-else-if="cardBoxId"
          class="w-full h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 transition-all"
          hoverClass="scale-97 origin-center"
          :hoverStayTime="200"
          :hoverStartTime="0"
          @tap="handleMoveConfirm(selectedFolderId)"
          :class="[
            selectedFolderId === cardDataStore.cardBoxes[cardBoxId]?.folderId
              ? 'opacity-50 pointer-events-none'
              : '',
          ]"
        >
          <text class="i-tabler-folder-plus text-white" />
          <text class="text-white font-medium">移动到此目录</text>
        </view>
      </view>
    </view>
  </wd-popup>

  <!-- 加确认弹窗 -->
  <ConfirmModal
    v-model="showAddFolderModal"
    title="添加目录"
    placeholder="请输入目录名称"
    :editable="true"
    @confirm="handleAddFolderConfirm"
  />

  <ConfirmModal
    v-model="showRenameFolderModal"
    title="目录重命名"
    placeholder="请输入新的目录名称"
    :editable="true"
    :defaultValue="currentFolderName"
    @confirm="handleRenameFolderConfirm"
  />

  <ConfirmModal
    v-model="showDeleteFolderModal"
    title="确认删除目录吗？"
    content="删除目录将移除目录中所有卡盒，删除后仅可通过备份恢复，请确保数据及时备份"
    :danger="true"
    @confirm="handleDeleteFolderConfirm"
  />

  <FolderActionSheet
    v-model="isActionSheetShow"
    :folderId="currentFolderId"
    :folderName="currentFolderName"
    @rename="showRenameFolderModal = true"
    @delete="handleDeleteClick"
  />
</template>

<script lang="ts" setup>
import _ from 'lodash'

import { useCardBoxStore, useCardDataStore, useFolderStore } from '@/store'

import ConfirmModal from './ConfirmModal.vue'
import FolderActionSheet from './FolderActionSheet.vue'

const props = defineProps<{
  isShow: boolean
  cardBoxId?: string
  mode?: 'import' | 'select' // 添加 mode 属性
}>()

const emit = defineEmits(['close', 'select'])
const { updateLockScroll } = inject<{
  updateLockScroll: (isLock: boolean) => void
}>('lockScroll')

const cardDataStore = useCardDataStore()
const folderStore = useFolderStore()
const cardBoxStore = useCardBoxStore()

// 添加响应式变量控制弹窗显示
const showAddFolderModal = ref(false)
const showRenameFolderModal = ref(false)
const showDeleteFolderModal = ref(false)
const isActionSheetShow = ref(false)
const currentFolderId = ref('')
const currentFolderName = ref('')

// 添加计算属性获取标题
const getTitle = computed(() => {
  if (props.mode === 'import') return '选择要导入的目录'
  if (props.cardBoxId) return '选择新目录'
  return '选择目录'
})

// 添加导入相关状态和方法
const selectedFolderId = computed(() => {
  if (props.cardBoxId && !selectedFolderIdRef.value) {
    // 如果是移动卡盒模式，且还没有选择新目录，使用当前卡盒的目录
    return (
      cardDataStore.cardBoxes[props.cardBoxId]?.folderId || cardDataStore.folderList[0]?.id || ''
    )
  }
  return selectedFolderIdRef.value || cardDataStore.folderList[0]?.id || ''
})

const selectedFolderIdRef = ref('')

// 修改文件夹点击事件
const onFolderClick = (id: string) => {
  if (props.mode === 'import') {
    selectedFolderIdRef.value = id
    return
  }

  if (props.cardBoxId) {
    selectedFolderIdRef.value = id
    return
  }

  // 切换当前目录
  folderStore.updateCurrentFolderId(id)
  emit('close')
}

// 导入按钮点击事件
const onImportClick = () => {
  if (selectedFolderId.value) {
    emit('select', selectedFolderId.value)
  }
}

// 修改添加目录的处理函数
const onAddFolderClick = () => {
  showAddFolderModal.value = true
}

const handleAddFolderConfirm = (folderName: string) => {
  if (folderName) {
    folderStore.addFolder(folderName)
  }
}

// 添加确认移动的处理函数
const handleMoveConfirm = (folderId: string) => {
  if (props.cardBoxId && folderId) {
    // 移动卡盒到新目录
    const cardBox = cardDataStore.cardBoxes[props.cardBoxId]
    if (cardBox) {
      cardBox.folderId = folderId
      cardBox.index = -1
      cardDataStore.reorderCardBoxes()
      emit('close')
    }
  }
}

const onMoreBtnClick = (id: string) => {
  const folder = cardDataStore.folderList.find((f) => f.id === id)
  if (folder) {
    currentFolderId.value = id
    currentFolderName.value = folder.name
    isActionSheetShow.value = true
  }
}

const handleDeleteClick = () => {
  if (currentFolderId.value === 'default') {
    uni.showToast({
      title: '请不要删除默认目录',
      icon: 'none',
    })
    return
  }
  showDeleteFolderModal.value = true
}

// 添加重命名确认处理函数
const handleRenameFolderConfirm = (newName: string) => {
  if (newName && currentFolderId.value) {
    folderStore.renameFolder(currentFolderId.value, newName)
  }
}

// 添加删除目录的处理函数
const handleDeleteFolderConfirm = () => {
  // 只删除当前目录下的卡片
  folderStore.removeFolder(currentFolderId.value)

  if (currentFolderId.value === folderStore.currentFolderId) {
    // 如果删除的是当前目录，切换到其他目录
    folderStore.updateCurrentFolderId(
      cardDataStore.folderList.filter((folder) => {
        return folder.id !== currentFolderId.value
      })[0].id,
    )
  }
  folderStore.removeFolder(currentFolderId.value)
}

// 修改选中状态判断方法
const isSelected = (folderId: string) => {
  if (props.mode === 'import') {
    return folderId === selectedFolderId.value
  }
  if (props.cardBoxId) {
    return folderId === selectedFolderId.value
  }
  return folderId === folderStore.currentFolderId
}

watch(
  () => props.isShow,
  (val) => {
    updateLockScroll(val)
  },
)
</script>

<style scoped>
:deep(.wd-popup) {
  overflow: hidden;
}
</style>
