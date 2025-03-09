<template>
  <wd-popup
    customClass="rounded-2xl w-85vw"
    :modelValue="modelValue"
    @close="emits('update:modelValue', false)"
    @after-leave="handleAfterLeave"
    lockScroll
    lazyRender
  >
    <view class="bg-white rounded-lg">
      <view class="p-4 space-y-2">
        <!-- 标题 -->
        <view class="flex items-center justify-between mb-4">
          <text class="text-lg font-semibold text-gray-800">
            {{ isUpdating ? '学习计划详情' : '制定学习计划' }}
          </text>
          <view
            class="text-sm text-gray-400 py-1 px-3 rounded-full"
            hoverClass="bg-gray-50"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="emits('update:modelValue', false)"
          >
            关闭
          </view>
        </view>

        <!-- 基础信息 -->
        <view v-if="isUpdating" class="space-y-2">
          <!-- 学习进度卡片 -->
          <view class="bg-gradient-to-br from-indigo-50/50 to-indigo-50/20 rounded-xl px-4 py-3">
            <!-- 进度条 -->
            <view class="h-1 bg-white/80 rounded-full overflow-hidden mb-3">
              <view
                class="h-full bg-indigo-500 rounded-full transition-all duration-300 text-sm"
                :style="{ width: `${studyProgress || 0}%` }"
              />
            </view>
            <!-- 进度数字 -->
            <view class="flex items-baseline gap-1">
              <text class="text-base font-medium text-indigo-500">{{ studyProgress }}%</text>
              <text class="text-xs text-gray-500">完成度</text>
            </view>
          </view>

          <!-- 学习数据统计 -->
          <view class="grid grid-cols-2 gap-2">
            <view class="bg-gray-50/80 rounded-lg p-3 space-y-1">
              <text class="text-xs text-gray-500 font-medium">已掌握</text>
              <view class="flex items-baseline gap-1">
                <text class="text-lg font-medium text-gray-800">
                  {{ studyPlanStats?.masteredCards || 0 }}
                </text>
                <text class="text-xs text-gray-500">张卡片</text>
              </view>
            </view>
            <view class="bg-gray-50/80 rounded-lg p-3 space-y-1">
              <text class="text-xs text-gray-500 font-medium">学习天数</text>
              <view class="flex items-baseline gap-1">
                <text class="text-lg font-medium text-gray-800">{{ studyDays }}</text>
                <text class="text-xs text-gray-500">天</text>
              </view>
            </view>
          </view>

          <!-- 学习计划设置 -->
          <view class="bg-gray-50/80 rounded-lg p-3 space-y-2">
            <view class="flex items-center gap-1.5 mb-1">
              <text class="i-tabler-settings text-gray-500" />
              <text class="text-xs font-medium text-gray-500">学习设置</text>
            </view>
            <view class="flex items-center justify-between">
              <text class="text-sm text-gray-700">每日新卡片数量</text>
              <text class="text-sm font-medium text-gray-700">
                {{ cardBoxData?.studyState?.dailyNewCards }} 张
              </text>
            </view>
            <view class="flex items-center justify-between">
              <text class="text-sm text-gray-600">开始学习时间</text>
              <text class="text-sm text-gray-600">
                {{ formatDate(cardBoxData?.studyState?.startTime) }}
              </text>
            </view>
            <view class="flex items-center justify-between">
              <text class="text-sm text-gray-600">预计完成时间</text>
              <text class="text-sm text-gray-600">
                {{ formatDate(expectedEndTime) }}
              </text>
            </view>
          </view>
        </view>

        <!-- 记忆周期安排 - 仅在首次制定计划时显示 -->
        <view v-if="!isUpdating" class="space-y-2">
          <!-- 记忆周期安排 -->
          <view class="space-y-2">
            <view class="flex items-center justify-between">
              <text class="text-sm font-medium text-gray-700">记忆周期安排</text>
              <text class="text-xs text-gray-500">掌握程度</text>
            </view>
            <view class="bg-gray-50 rounded-lg p-3">
              <view class="grid grid-cols-2 gap-2">
                <view
                  v-for="(day, index) in memoryStages"
                  :key="index"
                  class="flex items-center gap-2 py-2 px-3 rounded-lg transition-colors"
                  :class="[memoryStageStyles[index].bg]"
                >
                  <text
                    :class="[memoryStageStyles[index].text, memoryStageStyles[index].icon]"
                    class="text-lg"
                  />
                  <view class="flex-1 min-w-0">
                    <view class="flex items-center justify-between">
                      <text class="text-sm" :class="[memoryStageStyles[index].text]">
                        {{ memoryStageStyles[index].level }}
                      </text>
                    </view>
                    <text class="text-xs text-gray-400">{{ day }}天后复习</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 总结 -->
        <view class="bg-gray-50 rounded-lg p-3 space-y-2">
          <view class="flex items-center justify-between">
            <text class="text-sm text-gray-600">最少总复习次数</text>
            <text class="text-sm font-medium text-gray-700">
              {{ totalCards * memoryStages.length }} 次
            </text>
          </view>
          <view class="flex items-center justify-between">
            <text class="text-sm text-gray-600">最快完全掌握需要</text>
            <text class="text-sm font-medium text-gray-700">{{ Math.ceil(totalDays) }} 天</text>
          </view>
          <view class="text-xs text-gray-500 mt-2">
            * 基于艾宾浩斯记忆曲线，每张卡片需要完成所有复习周期才算掌握
          </view>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="p-4 pt-0 border-t border-gray-100">
        <view class="space-y-4">
          <!-- 每日新卡片设置 -->
          <view v-if="!isUpdating || isEditing" class="bg-gray-50 rounded-lg p-3 space-y-3">
            <view class="flex items-center gap-1.5 mb-1">
              <text class="i-tabler-settings text-gray-500" />
              <text class="text-xs font-medium text-gray-500">学习设置</text>
            </view>
            <view class="flex items-center justify-between">
              <text class="text-sm text-gray-600">每日新卡片数量</text>
              <view class="flex items-center gap-2">
                <view
                  class="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center"
                  :class="dailyNewCards > 1 ? 'text-indigo-500' : 'text-gray-300'"
                  @tap="adjustDailyCards(-1)"
                >
                  <text class="i-tabler-minus" />
                </view>
                <input
                  type="number"
                  :max="totalCards"
                  :min="1"
                  class="w-12 h-8 bg-white/80 rounded-lg text-center text-base font-medium text-indigo-500"
                  :value="dailyNewCards.toString()"
                  @input="onInputChange"
                  @blur="onInputBlur"
                />
                <view
                  class="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center text-indigo-500"
                  @tap="adjustDailyCards(1)"
                >
                  <text class="i-tabler-plus" />
                </view>
              </view>
            </view>
          </view>

          <!-- 按钮组 -->
          <view v-if="isUpdating && !isEditing" class="flex items-center gap-2">
            <view
              class="flex-1 h-11 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center text-sm gap-2"
              hoverClass="scale-97 origin-center transition-all"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="isUpdating ? handleEdit() : startLearning"
            >
              <text :class="isUpdating ? 'i-tabler-edit' : 'i-tabler-flag'" />
              <text class="font-medium">修改计划</text>
            </view>

            <view
              class="h-11 px-5 rounded-xl bg-red-50 flex items-center justify-center gap-2 text-sm text-red-500"
              hoverClass="scale-97 origin-center transition-all"
              @tap="exitStudy"
            >
              <text class="i-tabler-x" />
              <text>取消计划</text>
            </view>
          </view>

          <!-- 开始学习按钮 -->
          <view v-if="!isUpdating">
            <view
              class="w-full h-11 bg-indigo-500 rounded-xl flex items-center justify-center gap-2"
              :hoverClass="'bg-indigo-600'"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="startLearning"
            >
              <text class="i-tabler-flag text-white" />
              <text class="text-white font-medium">开始计划</text>
            </view>
          </view>

          <!-- 修改计划时的确认/取消按钮 -->
          <view v-if="isEditing" class="flex gap-3">
            <view
              class="flex-1 py-2.5 bg-gray-100 rounded-xl flex items-center justify-center"
              :hoverClass="'bg-gray-200'"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="cancelEdit"
            >
              <text class="text-gray-600 font-medium">取消</text>
            </view>
            <view
              class="flex-1 py-2.5 bg-indigo-500 rounded-xl flex items-center justify-center"
              :hoverClass="'bg-indigo-600'"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="confirmEdit"
            >
              <text class="text-white font-medium">确认</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 添加确认弹窗 -->
    <ConfirmModal
      v-model="isConfirmModalShow"
      title="确认退出"
      content="退出学习后，所有学习进度将被清空，确定要退出吗？"
      :danger="true"
      @confirm="handleConfirmExit"
    />
  </wd-popup>
</template>

<script setup lang="ts">
import { useCardDataStore, useCardBoxStore, memoryStages, MAX_REVIEW_CARDS } from '@/store'

import ConfirmModal from './ConfirmModal.vue'

const props = defineProps<{
  modelValue: boolean
  cardBoxId: string
  totalCards: number
  isUpdating?: boolean
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const cardDataStore = useCardDataStore()
const cardBoxStore = useCardBoxStore()

// 注入 lockScroll
const { updateLockScroll } = inject('lockScroll', {
  updateLockScroll: () => {},
})

// 监听弹窗状态，更新滚动锁定
watch(
  () => props.modelValue,
  (val) => {
    updateLockScroll(val)
  },
)

// 艾宾浩斯记忆曲线的复习时间点(单位:天)
const studyProgress = computed(() => cardBoxStore.getStudyProgress(props.cardBoxId))

// 获取卡盒数据
const cardBoxData = computed(() => cardDataStore.cardBoxes[props.cardBoxId])

// 每日新卡片数量
const dailyNewCards = ref(5)

// 监听 totalCards 和 isUpdating 的变化
watch(
  [() => props.totalCards, () => props.isUpdating],
  ([totalCards, isUpdating]) => {
    if (totalCards > 0) {
      dailyNewCards.value = isUpdating
        ? Math.min(cardBoxData.value?.studyState?.dailyNewCards || 5, totalCards)
        : Math.min(5, totalCards)
    }
  },
  { immediate: true },
)

// 记忆阶段样式配置
const memoryStageStyles = [
  {
    bg: 'bg-rose-50',
    text: 'text-rose-500',
    level: '初步印象',
    icon: 'i-tabler-eye',
  },
  {
    bg: 'bg-orange-50',
    text: 'text-orange-500',
    level: '模糊记忆',
    icon: 'i-tabler-brain',
  },
  {
    bg: 'bg-amber-50',
    text: 'text-amber-500',
    level: '基本掌握',
    icon: 'i-tabler-bulb',
  },
  {
    bg: 'bg-lime-50',
    text: 'text-lime-600',
    level: '熟练掌握',
    icon: 'i-tabler-check',
  },
  {
    bg: 'bg-emerald-50',
    text: 'text-emerald-500',
    level: '深度记忆',
    icon: 'i-tabler-star',
  },
  {
    bg: 'bg-teal-50',
    text: 'text-teal-500',
    level: '长期记忆',
    icon: 'i-tabler-trophy',
  },
]

// 调整每日卡片数量
const adjustDailyCards = (delta: number) => {
  const newValue = dailyNewCards.value + delta
  if (newValue >= 1 && newValue <= props.totalCards) {
    dailyNewCards.value = newValue
  }
}

// 处理输入变化
const onInputChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const value = parseInt(input.value)
  if (!isNaN(value)) {
    dailyNewCards.value = Math.min(Math.max(1, value), props.totalCards)
  }
}

// 处理输入框失焦
const onInputBlur = (e: Event) => {
  const input = e.target as HTMLInputElement
  let value = parseInt(input.value)

  if (isNaN(value) || value < 1) {
    value = 1
  } else if (value > props.totalCards) {
    value = props.totalCards
  }

  dailyNewCards.value = value
  input.value = value.toString()
}

// 计算完全掌握所需天数
const totalDays = computed(() => {
  // 学习所有新卡片需要的天数
  const daysForNewCards = Math.ceil(props.totalCards / dailyNewCards.value)

  // 计算复习次数和天数
  const totalReviews = props.totalCards * (memoryStages.length - 1) // 减去第一次学习
  const daysForReviews = Math.ceil(totalReviews / MAX_REVIEW_CARDS)

  // 最后一张卡片完成所有复习周期所需的天数
  const lastReviewDay = memoryStages[memoryStages.length - 1]

  // 总天数 = max(学习新卡片的天数 + 最后一张卡片的复习周期, 复习所需的总天数)
  return Math.max(daysForNewCards + lastReviewDay, daysForReviews)
})

// 开始学习按钮点击事件
const startLearning = () => {
  emits('update:modelValue', false)
  // 初始化学习状态
  cardBoxStore.startStudyPlan(props.cardBoxId, dailyNewCards.value)
}

// 退出学习
const exitStudy = () => {
  isConfirmModalShow.value = true
}

// 标记是否需要退出学习
const needExitStudy = ref(false)

// 处理弹窗关闭后的操作
const handleAfterLeave = () => {
  if (needExitStudy.value) {
    cardBoxStore.exitStudy(props.cardBoxId)
    needExitStudy.value = false
  }
}

// 格式化日期
const formatDate = (timestamp?: number) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

// 计算已掌握的卡片数量
const masteredCards = computed(() => {
  if (!cardBoxData.value?.cardItems) return 0
  return Object.values(cardBoxData.value.cardItems).filter(
    (item) => item.studyState?.stage === memoryStages.length,
  ).length
})

// 计算学习天数
const studyDays = computed(() => {
  const startTime = cardBoxData.value?.studyState?.startTime
  if (!startTime) return 0
  return Math.ceil((Date.now() - startTime) / (24 * 60 * 60 * 1000))
})

// 计算预计完成时间
const expectedEndTime = computed(() => {
  const startTime = cardBoxData.value?.studyState?.startTime
  if (!startTime) return 0

  const dailyNewCards = cardBoxData.value?.studyState?.dailyNewCards || 1
  const remainingCards = props.totalCards - masteredCards.value

  // 计算剩余复习次数
  const remainingReviews = remainingCards * (memoryStages.length - 1)
  const daysForReviews = Math.ceil(remainingReviews / MAX_REVIEW_CARDS)

  // 计算剩余新卡片学习天数
  const daysForNewCards = Math.ceil(remainingCards / dailyNewCards)

  // 使用较大的天数
  const remainingDays = Math.max(
    daysForNewCards + memoryStages[memoryStages.length - 1],
    daysForReviews,
  )

  return startTime + remainingDays * 24 * 60 * 60 * 1000
})

// 是否处于编辑状态
const isEditing = ref(false)

// 临时存储修改前的值
const tempDailyNewCards = ref(0)

// 处理修改计划
const handleEdit = () => {
  isEditing.value = true
  // 初始化修改值为当前值，但不超过总卡片数量
  dailyNewCards.value = Math.min(
    cardBoxData.value?.studyState?.dailyNewCards || 5,
    props.totalCards,
  )
  tempDailyNewCards.value = dailyNewCards.value
}

// 取消修改
const cancelEdit = () => {
  isEditing.value = false
  dailyNewCards.value = tempDailyNewCards.value
}

// 确认修改
const confirmEdit = () => {
  cardBoxStore.startStudyPlan(props.cardBoxId, dailyNewCards.value)
  isEditing.value = false
  emits('update:modelValue', false)
}

// 获取学习计划统计数据
const studyPlanStats = computed(() => {
  const cardBox = cardDataStore.cardBoxes[props.cardBoxId]
  if (!cardBox?.studyState) return null

  const now = Date.now()
  const cardItems = Object.values(cardBox.cardItems)

  // 计算各阶段卡片数量
  const stats = {
    newCards: cardItems.filter((item) => !item.studyState?.lastStudyTime).length,
    reviewCards: cardItems.filter(
      (item) => item.studyState?.lastStudyTime && item.studyState.nextStudyTime <= now,
    ).length,
    masteredCards: cardItems.filter((item) => item.studyState?.stage === memoryStages.length)
      .length,
    totalCards: cardItems.length,
  }

  return stats
})

// 添加控制 ConfirmModal 显示的状态
const isConfirmModalShow = ref(false)

// 添加处理确认的函数
const handleConfirmExit = () => {
  needExitStudy.value = true
  emits('update:modelValue', false)
}
</script>
