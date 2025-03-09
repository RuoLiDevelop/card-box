<template>
  <view v-if="settingsStore.showAIFeature" class="flex items-center">
    <view
      class="flex items-center gap-2 px-2 py-1 bg-indigo-50 text-indigo-500 rounded-lg text-sm transition-colors"
      hoverClass="bg-indigo-100"
      :hoverStartTime="0"
      :hoverStayTime="200"
      @tap="handleGenerateClick"
    >
      <text class="i-solar-magic-stick-3-bold-duotone"></text>
      <text class="text-xs font-medium">智能生成笔记 · 消耗1次</text>
    </view>
  </view>

  <!-- 加载动画弹窗 -->
  <wd-popup
    v-model="isGeneratingNote"
    :closeOnClickModal="false"
    customClass="bg-transparent shadow-none rounded-[32px]"
  >
    <view
      class="flex flex-col items-center gap-6 p-8 rounded-[32px] justify-center"
      :style="{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        width: '320rpx',
        height: '320rpx',
      }"
    >
      <view class="relative w-18 h-18 flex items-center justify-center">
        <view class="absolute inset-0">
          <view
            class="w-full h-full rounded-full border-[3px] border-indigo-100/80 animate-spin-slow"
            :style="{
              boxShadow: 'inset 0 0 12px rgba(99, 102, 241, 0.1)',
            }"
          ></view>
        </view>
        <view class="absolute inset-0 rotate-45">
          <view
            class="w-full h-full rounded-full border-[3px] border-t-indigo-400/90 border-transparent animate-pulse"
            :style="{
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.15)',
            }"
          ></view>
        </view>
        <view class="relative animate-float">
          <text
            class="i-solar-magic-stick-3-bold-duotone text-4xl text-indigo-500"
            :style="{
              filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.3))',
            }"
          ></text>
        </view>
      </view>

      <view class="flex flex-col items-center gap-3">
        <text class="text-base font-medium text-gray-700 tracking-wide">AI 思考中</text>
        <text
          class="text-xs text-gray-500/90 animate-fade-in tracking-wide"
          :style="{
            textShadow: '0 0 1px rgba(0,0,0,0.05)',
          }"
        >
          {{ loadingTips[currentTipIndex] }}
        </text>
      </view>
    </view>
  </wd-popup>

  <QuotaExceededModal
    v-model="isQuotaDialogVisible"
    title="今日笔记生成次数不足"
    @success="handleGenerateClick"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { generateNoteWithAI } from '@/services/ai'
import { useUserStore, useSettingsStore } from '@/store'

import QuotaExceededModal from './QuotaExceededModal.vue'

const props = defineProps<{
  frontContent: string
  backContent: string
  side: 'front' | 'back'
}>()

const emit = defineEmits<{
  (e: 'success', notes: string[]): void
}>()

const userStore = useUserStore()
const settingsStore = useSettingsStore()
const isGeneratingNote = ref(false)
const currentTipIndex = ref(0)
const loadingTips = [
  '正在理解卡片内容...',
  '分析知识要点...',
  '生成学习笔记...',
  '优化笔记内容...',
  '马上就好...',
]

let tipTimer: ReturnType<typeof setInterval>

const startThinkingAnimation = () => {
  isGeneratingNote.value = true
  currentTipIndex.value = 0
  tipTimer = setInterval(() => {
    currentTipIndex.value = (currentTipIndex.value + 1) % loadingTips.length
  }, 2000)
}

const stopThinkingAnimation = () => {
  isGeneratingNote.value = false
  clearInterval(tipTimer)
}

const isQuotaDialogVisible = ref(false)

const handleGenerateClick = async () => {
  if (isGeneratingNote.value) return
  if (quotaInfo.value.total - quotaInfo.value.used < 1) {
    isQuotaDialogVisible.value = true
    return
  }

  if (
    (props.side === 'front' && !props.frontContent) ||
    (props.side === 'back' && !props.backContent)
  ) {
    uni.showToast({
      title: '请先输入卡片内容',
      icon: 'none',
    })
    return
  }

  try {
    startThinkingAnimation()
    const notes = await generateNoteWithAI({
      frontContent: props.frontContent,
      backContent: props.backContent,
      side: props.side,
    })

    // 生成成功后更新限额信息
    await userStore.refreshUserInfo()

    emit('success', notes)
  } catch (error) {
    console.error('生成笔记失败:', error)
    uni.showToast({
      title: '生成笔记失败，请稍后重试',
      icon: 'none',
    })
  } finally {
    stopThinkingAnimation()
  }
}

const contactSupport = () => {
  isQuotaDialogVisible.value = false
}

onUnmounted(() => {
  clearInterval(tipTimer)
})

const { quotaInfo } = storeToRefs(userStore)
const remainingCount = computed(() => quotaInfo.value.total - quotaInfo.value.used)
</script>
