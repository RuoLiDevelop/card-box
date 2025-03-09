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
        <text class="text-base font-semibold">添加卡盒</text>
        <view class="flex items-center gap-2">
          <view
            class="flex items-center gap-1 text-sm text-indigo-500 py-1.5 transition-all"
            hover-class=" scale-95"
            :hover-start-time="0"
            :hover-stay-time="200"
            @tap="onMarketClick"
          >
            <text class="text-xs">找卡盒？去逛逛卡盒集市</text>
            <text class="i-tabler-arrow-right" />
          </view>
          <view
            class="text-sm text-gray-400 py-1 px-3 rounded-full"
            hover-class="bg-gray-50"
            :hover-start-time="0"
            :hover-stay-time="200"
            @tap="$emit('update:modelValue', false)"
          >
            关闭
          </view>
        </view>
      </view>

      <!-- 操作按钮列表 -->
      <view class="p-6">
        <view class="grid grid-cols-4 gap-6">
          <view
            v-for="item in actionItems"
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
                  ? 'w-full h-12 bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 '
                  : 'w-12 h-12 bg-gray-50',
              ]"
            >
              <view
                :class="[
                  item.icon,
                  item.value === 'ai' ? 'text-2xl' : 'text-xl',
                  item.value === 'ai' ? 'text-indigo-500' : 'text-gray-500',
                ]"
              />
            </view>
            <text
              class="text-xs"
              :class="[item.value === 'ai' ? 'text-indigo-500' : 'text-gray-700']"
            >
              {{ item.text }}
            </text>
          </view>
        </view>
      </view>
    </view>
  </wd-popup>

  <!-- 添加确认弹窗 -->
  <ConfirmModal
    v-model="showNewBoxModal"
    title="添加卡盒"
    placeholder="请输入卡盒名称"
    :editable="true"
    @confirm="handleNewBoxConfirm"
  />

  <ConfirmModal
    v-model="showImportBoxModal"
    title="导入至新卡盒"
    placeholder="请输入卡盒名称"
    :editable="true"
    @confirm="handleImportBoxConfirm"
  />

  <ConfirmModal
    v-model="showAiImportBoxModal"
    title="智能生成至新卡盒"
    placeholder="请输入卡盒名称"
    :editable="true"
    @confirm="handleAiImportBoxConfirm"
  />
</template>

<script lang="ts" setup>
import { useCardBoxStore, useSettingsStore, useFolderStore } from '@/store'

import ConfirmModal from './ConfirmModal.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { vibrate } = useVibrate()
const cardBoxStore = useCardBoxStore()
const settingsStore = useSettingsStore()
const folderStore = useFolderStore()
// 添加控制弹窗显示的响应式变量
const showNewBoxModal = ref(false)
const showImportBoxModal = ref(false)
const showAiImportBoxModal = ref(false)

const actionItems = computed(() => {
  const baseItems = [
    {
      text: '空白卡盒',
      icon: 'i-tabler-box',
      value: 'empty',
      action: () => {
        showNewBoxModal.value = true
      },
    },
    {
      text: '导入卡片',
      icon: 'i-tabler-file-import',
      value: 'import',
      action: () => {
        showImportBoxModal.value = true
      },
    },
  ]

  // 根据条件添加 AI 选项
  if (settingsStore.showAIFeature) {
    baseItems.push({
      text: '智能生成卡片',
      icon: 'i-solar-magic-stick-3-bold-duotone',
      value: 'ai',
      action: () => {
        uni.navigateTo({
          url: '/pages/generate/index',
        })
      },
    })
  }

  return baseItems
})

// 添加处理函数
const handleNewBoxConfirm = (name: string) => {
  if (name) {
    vibrate()
    cardBoxStore.addCardBox({ name, folderId: folderStore.currentFolderId })
  }
}

const handleImportBoxConfirm = (name: string) => {
  if (name) {
    uni.navigateTo({
      url: '/pages/import/index?cardBoxName=' + name,
    })
  }
}

const handleAiImportBoxConfirm = (name: string) => {
  if (name) {
    uni.navigateTo({
      url: '/pages/generate/index?cardBoxName=' + name,
    })
  }
}

const onActionClick = (item: (typeof actionItems)[number]) => {
  item.action()
  emit('update:modelValue', false)
}

const onMarketClick = () => {
  vibrate()
  uni.navigateTo({
    url: '/pages/market/index',
  })
  emit('update:modelValue', false)
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
</script>
