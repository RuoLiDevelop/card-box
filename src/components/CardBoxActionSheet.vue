<template>
  <wd-popup
    customClass="rounded-t-3xl overflow-hidden"
    :modelValue="modelValue"
    @close="$emit('update:modelValue', false)"
    position="bottom"
    :safe-area-inset-bottom="true"
  >
    <view class="overflow-hidden">
      <!-- 标题栏 -->
      <view class="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <text class="text-base font-semibold">{{ cardBoxName }}</text>
        <view
          class="text-sm text-gray-400 py-1 px-3 rounded-full"
          hoverClass="bg-gray-50"
          :hoverStartTime="0"
          :hoverStayTime="200"
          @tap="$emit('update:modelValue', false)"
        >
          关闭
        </view>
      </view>

      <!-- 操作按钮列表 -->
      <view class="py-4">
        <!-- 基础功能 -->
        <view v-if="baseItems.length > 0" class="mb-6">
          <view class="px-6 mb-2">
            <text class="text-sm text-gray-400">卡片操作</text>
          </view>
          <view class="px-6 grid grid-cols-4 gap-6">
            <view
              v-for="item in baseItems"
              :key="item.text"
              class="flex flex-col items-center gap-2"
              :class="[item.value === 'ai' ? 'col-span-2' : '']"
              hoverClass="opacity-60"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="onActionClick(item)"
            >
              <view
                class="rounded-3 flex items-center justify-center"
                :class="[
                  item.value === 'ai'
                    ? 'w-full h-12 bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50'
                    : 'w-12 h-12',
                  item.danger ? 'bg-red-50' : 'bg-gray-50',
                ]"
              >
                <view
                  :class="[
                    item.icon,
                    item.value === 'ai' ? 'text-2xl' : 'text-xl',
                    item.danger
                      ? 'text-red-500'
                      : item.value === 'ai'
                        ? 'text-indigo-500'
                        : 'text-gray-500',
                  ]"
                />
              </view>
              <text
                class="text-xs whitespace-nowrap"
                :class="[
                  item.danger
                    ? 'text-red-500'
                    : item.value === 'ai'
                      ? 'text-indigo-500'
                      : 'text-gray-700',
                ]"
              >
                {{ item.text }}
              </text>
            </view>
          </view>
        </view>

        <!-- 样式设置 -->
        <view v-if="styleItems.length > 0" class="mb-6">
          <view class="px-6 mb-2">
            <text class="text-sm text-gray-400">样式设置</text>
          </view>
          <view class="px-6 grid grid-cols-4 gap-6">
            <view
              v-for="item in styleItems"
              :key="item.text"
              class="flex flex-col items-center gap-2"
              hoverClass="opacity-60"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="onActionClick(item)"
            >
              <view
                class="rounded-3 flex items-center justify-center"
                :class="[
                  item.value === 'ai'
                    ? 'w-full h-12 bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50'
                    : 'w-12 h-12',
                  item.danger ? 'bg-red-50' : 'bg-gray-50',
                ]"
              >
                <view
                  :class="[
                    item.icon,
                    item.value === 'ai' ? 'text-2xl' : 'text-xl',
                    item.danger
                      ? 'text-red-500'
                      : item.value === 'ai'
                        ? 'text-indigo-500'
                        : 'text-gray-500',
                  ]"
                />
              </view>
              <text
                class="text-xs whitespace-nowrap"
                :class="[
                  item.danger
                    ? 'text-red-500'
                    : item.value === 'ai'
                      ? 'text-indigo-500'
                      : 'text-gray-700',
                ]"
              >
                {{ item.text }}
              </text>
            </view>
          </view>
        </view>

        <!-- 朗读设置 -->
        <view v-if="readingItems.length > 0" class="mb-6">
          <view class="px-6 mb-2">
            <text class="text-sm text-gray-400">朗读设置</text>
          </view>
          <view class="px-6 grid grid-cols-4 gap-6">
            <view
              v-for="item in readingItems"
              :key="item.text"
              class="flex flex-col items-center gap-2"
              hoverClass="opacity-60"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="onActionClick(item)"
            >
              <view class="w-12 h-12 rounded-3 bg-gray-50 flex items-center justify-center">
                <view :class="[item.icon, 'text-xl text-gray-500']" />
              </view>
              <text class="text-xs text-gray-700 whitespace-nowrap">
                {{ item.text }}
              </text>
            </view>
          </view>
        </view>

        <!-- 卡盒管理 -->
        <view v-if="managementItems.length > 0" class="mb-6">
          <view class="px-6 mb-2">
            <text class="text-sm text-gray-400">卡盒管理</text>
          </view>
          <view class="px-6 grid grid-cols-4 gap-6">
            <view
              v-for="item in managementItems"
              :key="item.text"
              class="flex flex-col items-center gap-2"
              hoverClass="opacity-60"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="onActionClick(item)"
            >
              <view
                class="rounded-3 flex items-center justify-center"
                :class="[
                  item.value === 'ai'
                    ? 'w-full h-12 bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50'
                    : 'w-12 h-12',
                  item.danger ? 'bg-red-50' : 'bg-gray-50',
                ]"
              >
                <view
                  :class="[
                    item.icon,
                    item.value === 'ai' ? 'text-2xl' : 'text-xl',
                    item.danger
                      ? 'text-red-500'
                      : item.value === 'ai'
                        ? 'text-indigo-500'
                        : 'text-gray-500',
                  ]"
                />
              </view>
              <text
                class="text-xs whitespace-nowrap"
                :class="[
                  item.danger
                    ? 'text-red-500'
                    : item.value === 'ai'
                      ? 'text-indigo-500'
                      : 'text-gray-700',
                ]"
              >
                {{ item.text }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </wd-popup>

  <!-- 确认弹窗 -->
  <ConfirmModal
    v-model="showDeleteConfirm"
    title="确认删除卡盒吗？"
    content="删除后仅可通过备份恢复，请确保数据及时备份"
    :danger="true"
    @confirm="handleDeleteConfirm"
  />

  <!-- 重命名弹窗 -->
  <ConfirmModal
    v-model="showRenameModal"
    title="重命名卡盒"
    placeholder="请输入新的卡盒名称"
    :editable="true"
    @confirm="handleRenameConfirm"
    :defaultValue="props.cardBoxName"
  />

  <!-- 颜色选择器组件 -->
  <ColorPicker v-model="isColorPickerShow" :cardBoxId="props.cardBoxId" />

  <!-- 删除卡片的确认弹窗 -->
  <ConfirmModal
    v-model="showDeleteCardConfirm"
    title="确认删除卡片吗？"
    content="删除后不可恢复，请谨慎操作"
    :danger="true"
    @confirm="handleDeleteCardConfirm"
  />
</template>

<script lang="ts" setup>
import { useCardBoxStore, useSettingsStore } from '@/store'

import ColorPicker from './ColorPicker.vue'
import ConfirmModal from './ConfirmModal.vue'

const props = defineProps<{
  modelValue: boolean
  cardBoxId: string
  cardBoxName: string
  cardBoxColor?: number
  showOnlyStyle?: boolean
  currentCardId?: string
  isBigCardMode?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'exportClick'): void
  (e: 'sortClick', type?: 'cardBox' | 'cardItem'): void
  (e: 'deleteSuccess'): void
  (e: 'deleteCard'): void
}>()

const { vibrate } = useVibrate()
const cardBoxStore = useCardBoxStore()
const settingsStore = useSettingsStore()
const { openFolderModal } = inject<{
  openFolderModal: (cardBoxId?: string) => void
}>('folderModal', {
  openFolderModal: () => {},
})

const showDeleteConfirm = ref(false)
const showRenameModal = ref(false)
const isColorPickerShow = ref(false)
const showDeleteCardConfirm = ref(false)

type ActionItem = {
  text: string
  icon: string
  action: () => void
  value?: string
  danger?: boolean
  keepOpen?: boolean
}

const baseItems = computed<ActionItem[]>(() => {
  const items: ActionItem[] = []

  // 如果不是仅样式模式，添加基础操作
  if (!props.showOnlyStyle) {
    // 首页的基础操作
    items.push(
      {
        text: '导出卡片',
        icon: 'i-tabler-file-export',
        action: () => emit('exportClick'),
      },
      {
        text: '导入新卡片',
        icon: 'i-tabler-file-import',
        action: () => {
          uni.navigateTo({
            url: '/pages/import/index?cardBoxId=' + props.cardBoxId,
          })
        },
      },
      {
        text: '正反面交换',
        icon: 'i-tabler-arrows-exchange',
        action: () => {
          cardBoxStore.swapCardFrontBack(props.cardBoxId)
          uni.showToast({
            title: '已完成正反面交换',
            icon: 'none',
          })
        },
      },
    )

    if (settingsStore.showAIFeature) {
      items.push({
        text: '智能生成卡片',
        icon: 'i-solar-magic-stick-3-bold-duotone',
        value: 'ai',
        action: () => {
          uni.navigateTo({
            url: `/pages/generate/index?cardBoxId=${props.cardBoxId}&cardBoxName=${props.cardBoxName}`,
          })
        },
      })
    }
  }

  return items
})

const styleItems = computed<ActionItem[]>(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const isHomePage = currentPage.route === 'pages/index/index'
  const isCardListPage = currentPage.route === 'pages/cardList/index'

  const items: ActionItem[] = []

  // 首页样式设置
  if (isHomePage) {
    items.push({
      text: '更换颜色',
      icon: 'i-tabler-palette',
      action: handleColorClick,
    })
  }

  // 卡片列表页样式设置
  if (isCardListPage) {
    items.push({
      text: cardBoxStore.getCardBoxLayout(props.cardBoxId) === 'grid' ? '切换列表' : '切换卡片',
      icon:
        cardBoxStore.getCardBoxLayout(props.cardBoxId) === 'grid'
          ? 'i-tabler-layout-grid'
          : 'i-tabler-layout-list',
      action: () => cardBoxStore.toggleCardBoxLayout(props.cardBoxId),
      keepOpen: true,
    })
  }

  // 非首页的通用样式设置
  if (!isHomePage) {
    items.push(
      {
        text: cardBoxStore.getCardBoxFontSize(props.cardBoxId) ? '切换小字体' : '切换大字体',
        icon: cardBoxStore.getCardBoxFontSize(props.cardBoxId)
          ? 'i-tabler-letter-case-toggle'
          : 'i-tabler-letter-case',
        action: () => cardBoxStore.toggleCardBoxFontSize(props.cardBoxId),
        keepOpen: true,
      },
      {
        text: cardBoxStore.getCardBoxContentAlign(props.cardBoxId) ? '切换靠左' : '切换居中',
        icon: cardBoxStore.getCardBoxContentAlign(props.cardBoxId)
          ? 'i-tabler-align-box-left-top'
          : 'i-tabler-align-box-center-middle',
        action: () => cardBoxStore.toggleCardBoxContentAlign(props.cardBoxId),
        keepOpen: true,
      },
      {
        text: cardBoxStore.getCardBoxShowNumber(props.cardBoxId) ? '关闭序号' : '开启序号',
        icon: cardBoxStore.getCardBoxShowNumber(props.cardBoxId)
          ? 'i-tabler-list-numbers'
          : 'i-tabler-list',
        action: () => cardBoxStore.toggleCardBoxShowNumber(props.cardBoxId),
        keepOpen: true,
      },
    )
  }

  return items
})

// 朗读设置项
const readingItems = computed<ActionItem[]>(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const isBigCardPage = currentPage.route === 'pages/bigCard/index'

  if (!isBigCardPage) return []

  return [
    {
      text: cardBoxStore.getCardBoxAutoReadFront(props.cardBoxId) ? '手动朗读正面' : '自动朗读正面',
      icon: cardBoxStore.getCardBoxAutoReadFront(props.cardBoxId)
        ? 'i-tabler-hand-click'
        : 'i-tabler-automation',
      action: () => cardBoxStore.toggleCardBoxAutoReadFront(props.cardBoxId),
      keepOpen: true,
    },
    {
      text: cardBoxStore.getCardBoxAutoReadBack(props.cardBoxId) ? '手动朗读背面' : '自动朗读背面',
      icon: cardBoxStore.getCardBoxAutoReadBack(props.cardBoxId)
        ? 'i-tabler-hand-click'
        : 'i-tabler-automation',
      action: () => cardBoxStore.toggleCardBoxAutoReadBack(props.cardBoxId),
      keepOpen: true,
    },
  ]
})

const managementItems = computed<ActionItem[]>(() => {
  if (props.showOnlyStyle) {
    // 在大卡片模式下，只显示删除卡片操作
    if (props.isBigCardMode && props.currentCardId) {
      return [
        {
          text: '删除卡片',
          icon: 'i-tabler-trash',
          danger: true,
          action: () => {
            showDeleteCardConfirm.value = true
          },
        },
      ]
    }
    return []
  }

  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const isHomePage = currentPage.route === 'pages/index/index'

  const items: ActionItem[] = [
    {
      text: isHomePage ? '卡盒排序' : '卡片排序',
      icon: isHomePage ? 'i-tabler-arrows-sort' : 'i-tabler-sort-descending',
      action: () => emit('sortClick', isHomePage ? 'cardBox' : 'cardItem'),
    },
    {
      text: '重命名卡盒',
      icon: 'i-tabler-edit',
      action: () => {
        showRenameModal.value = true
      },
    },
  ]

  // 首页特有的管理功能
  if (isHomePage) {
    items.push({
      text: '移动目录',
      icon: 'i-tabler-folder-plus',
      action: () => {
        openFolderModal(props.cardBoxId)
      },
    })
  }

  items.push({
    text: '删除卡盒',
    icon: 'i-tabler-trash',
    danger: true,
    action: () => {
      showDeleteConfirm.value = true
    },
  })

  return items
})

const onActionClick = (item: ActionItem) => {
  item.action()
  if (!item.keepOpen) {
    emit('update:modelValue', false)
  }
}

const handleDeleteConfirm = () => {
  vibrate()
  const success = cardBoxStore.deleteCardBox(props.cardBoxId)

  if (success) {
    showDeleteConfirm.value = false
    emit('deleteSuccess')
    emit('update:modelValue', false)
  } else {
    // 删除失败时提示用户
    uni.showToast({
      title: '删除失败，请重试',
      icon: 'none',
    })
  }
}

const handleRenameConfirm = (newName: string) => {
  if (newName) {
    cardBoxStore.renameCardBox(props.cardBoxId, newName)
  }
}

// 监听弹出层显示状态
watch(
  () => props.modelValue,
  async (newVal) => {
    if (newVal) {
      // 弹出层显示时检查 AI 功能状态
      await settingsStore.checkAIFeature()
    }
  },
)

const { updateLockScroll } = inject('lockScroll', {
  updateLockScroll: (val: boolean) => {},
})

watch(
  () => props.modelValue,
  (val) => {
    updateLockScroll(val)
  },
)

// 修复 modelValue 未定义的问题
const modelValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 修改颜色选择器的显示逻辑
const handleColorClick = () => {
  isColorPickerShow.value = true
  emit('update:modelValue', false)
}

const handleDeleteCardConfirm = () => {
  vibrate()
  showDeleteCardConfirm.value = false
  emit('deleteCard')
}
</script>
