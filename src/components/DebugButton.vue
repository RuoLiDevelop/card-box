<template>
  <view>
    <!-- 悬浮调试按钮 -->
    <view
      v-if="isDevelopEnv"
      class="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2"
    >
      <view
        class="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shadow-lg"
        :hoverStartTime="0"
        :hoverStayTime="200"
        @tap="showDebugModal = true"
      >
        <text class="i-tabler-bug text-lg text-orange-500" />
      </view>
    </view>

    <!-- 调试操作弹窗 -->
    <wd-popup
      v-model="showDebugModal"
      position="bottom"
      customClass="rounded-t-3xl"
      :safeAreaInsetBottom="true"
    >
      <view class="p-4 space-y-4">
        <!-- 标题 -->
        <view class="flex items-center justify-between">
          <text class="text-lg font-semibold text-gray-800">调试操作</text>
          <view
            class="w-8 h-8 rounded-lg bg-gray-50/80 flex items-center justify-center"
            :hoverClass="'bg-gray-100/80 scale-95'"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="showDebugModal = false"
          >
            <text class="i-tabler-x text-base text-gray-500" />
          </view>
        </view>

        <!-- 操作按钮列表 -->
        <view class="space-y-3">
          <view
            class="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl"
            :hoverClass="'bg-gray-100/80 scale-98'"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="handlePrevStage"
          >
            <text class="i-tabler-arrow-up text-lg text-amber-500" />
            <text class="text-sm text-gray-700">返回上一周期</text>
          </view>
          <view
            class="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl"
            :hoverClass="'bg-gray-100/80 scale-98'"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="handleNextStage"
          >
            <text class="i-tabler-arrow-down text-lg text-indigo-500" />
            <text class="text-sm text-gray-700">进入下一周期</text>
          </view>

          <view
            class="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl"
            :hoverClass="'bg-gray-100/80 scale-98'"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="handleStartReview"
          >
            <text class="i-tabler-player-play text-lg text-emerald-500" />
            <text class="text-sm text-gray-700">立即开始复习</text>
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script setup lang="ts">
import { useCardDataStore, memoryStages } from '@/store'

const props = defineProps<{
  cardBoxId: string
}>()

const cardDataStore = useCardDataStore()
const showDebugModal = ref(false)
const isDevelopEnv = ref(false)

// 初始化时获取环境信息
onMounted(() => {
  try {
    const accountInfo = uni.getAccountInfoSync()
    isDevelopEnv.value = accountInfo.miniProgram.envVersion === 'develop'
  } catch (e) {
    console.log('获取环境信息失败', e)
  }
})

// 进入下一周期
const handleNextStage = () => {
  const cardBox = cardDataStore.cardBoxes[props.cardBoxId]
  if (!cardBox) return

  Object.values(cardBox.cardItems).forEach((item) => {
    const currentStage = item.studyState?.stage || 0
    const nextStage = Math.min(memoryStages.length, currentStage + 1)

    item.studyState = {
      stage: nextStage,
      lastStudyTime: Date.now(),
      nextStudyTime: Date.now() + memoryStages[currentStage] * 24 * 60 * 60 * 1000,
    }
  })

  showDebugModal.value = false
  uni.showToast({
    title: '已进入下一周期',
    icon: 'none',
  })
}

// 返回上一周期
const handlePrevStage = () => {
  const cardBox = cardDataStore.cardBoxes[props.cardBoxId]
  if (!cardBox) return

  Object.values(cardBox.cardItems).forEach((item) => {
    const currentStage = item.studyState?.stage || 0
    const prevStage = Math.max(0, currentStage - 1)

    item.studyState = {
      stage: prevStage,
      lastStudyTime: Date.now(),
      nextStudyTime: Date.now() + memoryStages[prevStage] * 24 * 60 * 60 * 1000,
    }
  })

  showDebugModal.value = false
  uni.showToast({
    title: '已返回上一周期',
    icon: 'none',
  })
}

// 立即开始复习
const handleStartReview = () => {
  const cardBox = cardDataStore.cardBoxes[props.cardBoxId]
  if (!cardBox) return

  const now = Date.now()
  // 获取今天零点的时间戳
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const todayTimestamp = today.getTime()

  Object.values(cardBox.cardItems).forEach((item) => {
    if (item.studyState) {
      // 设置复习时间为当前时间
      item.studyState.nextStudyTime = now
      // 将最后学习时间设置为昨天，确保今天可以学习
      item.studyState.lastStudyTime = todayTimestamp - 24 * 60 * 60 * 1000
    }
  })

  showDebugModal.value = false
  uni.showToast({
    title: '已设置为立即复习',
    icon: 'none',
  })
}
</script>
