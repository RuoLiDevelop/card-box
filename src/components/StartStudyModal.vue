<template>
  <wd-popup
    position="bottom"
    :modelValue="modelValue"
    @close="emits('update:modelValue', false)"
    lockScroll
    lazyRender
    safe-area-inset-bottom
  >
    <view class="overflow-hidden">
      <view class="p-5 space-y-5">
        <!-- 标题区域 -->
        <view class="flex flex-col gap-1">
          <view class="flex items-center justify-between">
            <text class="text-lg font-semibold text-gray-800">
              {{ props.isPracticeMode ? '练习卡片' : '开始学习' }}
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
          <!-- 添加卡盒名称 -->
          <text class="text-sm text-gray-500">{{ cardBoxData?.name }}</text>
        </view>

        <!-- 学习数据统计 -->
        <view v-if="!props.isPracticeMode" class="grid grid-cols-2 gap-3">
          <!-- 新卡片 -->
          <view
            class="bg-gradient-to-br from-indigo-50/90 to-indigo-50/30 rounded-xl p-3.5 space-y-1.5 border border-indigo-100/50"
          >
            <text class="text-xs text-indigo-600/70 font-medium">新卡片</text>
            <view class="flex items-baseline gap-1">
              <text class="text-xl font-semibold text-indigo-600">
                {{ todayStudyCards.newCards.length }}
              </text>
              <text class="text-xs text-indigo-600/70">张</text>
            </view>
          </view>

          <!-- 待复习 -->
          <view
            class="bg-gradient-to-br from-amber-50/90 to-amber-50/30 rounded-xl p-3.5 space-y-1.5 border border-amber-100/50"
          >
            <text class="text-xs text-amber-600/70 font-medium">待复习</text>
            <view class="flex items-baseline gap-1">
              <text class="text-xl font-semibold text-amber-600">
                {{ todayStudyCards.reviewCards.length }}
              </text>
              <text class="text-xs text-amber-600/70">张</text>
            </view>
          </view>
        </view>

        <!-- 练习模式选择 -->
        <view v-if="props.isPracticeMode" class="grid grid-cols-2 gap-3">
          <!-- 顺序练习 -->
          <view
            class="bg-gradient-to-br from-indigo-50/90 to-indigo-50/30 rounded-xl p-3.5 space-y-1.5 border border-indigo-100/50"
            :class="{ 'ring-2 ring-indigo-500': practiceOrder === 'sequence' }"
            @tap="practiceOrder = 'sequence'"
          >
            <text class="text-xs text-indigo-600/70 font-medium">顺序练习</text>
            <view class="flex items-baseline gap-1">
              <text class="i-tabler-arrows-left-right text-xl text-indigo-600" />
            </view>
          </view>

          <!-- 随机练习 -->
          <view
            class="bg-gradient-to-br from-amber-50/90 to-amber-50/30 rounded-xl p-3.5 space-y-1.5 border border-amber-100/50"
            :class="{ 'ring-2 ring-amber-500': practiceOrder === 'random' }"
            @tap="practiceOrder = 'random'"
          >
            <text class="text-xs text-amber-600/70 font-medium">随机练习</text>
            <view class="flex items-baseline gap-1">
              <text class="i-tabler-arrows-shuffle text-xl text-amber-600" />
            </view>
          </view>
        </view>

        <!-- 学习模式选择 -->
        <view class="space-y-2">
          <view class="text-sm font-semibold text-gray-800 mb-1">选择模式</view>
          <view class="space-y-3">
            <view
              class="flex items-center gap-3 p-4 rounded-xl transition-all border"
              :class="[
                selectedMode === StudyMode.RECALL
                  ? 'bg-indigo-50 border-indigo-500 shadow-sm shadow-indigo-100'
                  : 'border-gray-100 hover:border-gray-200',
              ]"
              hoverClass="scale-97 origin-center"
              :hoverStayTime="200"
              :hoverStartTime="0"
              @tap="
                () => {
                  vibrate()
                  selectedMode = StudyMode.RECALL
                }
              "
            >
              <text
                class="i-tabler-mood-puzzled text-xl"
                :class="[selectedMode === StudyMode.RECALL ? 'text-indigo-500' : 'text-gray-500']"
              />
              <view class="flex-1">
                <text
                  class="text-sm font-medium"
                  :class="[selectedMode === StudyMode.RECALL ? 'text-indigo-500' : 'text-gray-700']"
                >
                  回忆模式
                </text>
                <text class="text-xs text-gray-500 block mt-0.5">自主复习，选择记得或不记得</text>
              </view>
            </view>

            <!-- 单选模式选项 -->
            <view
              v-if="settingsStore.showAIFeature"
              class="flex items-center gap-3 p-4 rounded-xl transition-all border"
              :class="[
                selectedMode === StudyMode.QUIZ
                  ? 'bg-indigo-50 border-indigo-500'
                  : 'border-gray-100',
              ]"
              @tap="handleModeSelect(StudyMode.QUIZ)"
            >
              <text
                class="i-tabler-mood-check text-xl"
                :class="[selectedMode === StudyMode.QUIZ ? 'text-indigo-500' : 'text-gray-500']"
              />
              <view class="flex-1">
                <view class="flex items-center gap-2">
                  <text
                    class="text-sm font-medium"
                    :class="[selectedMode === StudyMode.QUIZ ? 'text-indigo-500' : 'text-gray-700']"
                  >
                    单选模式
                    <text class="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-gray-50 text-gray-400">
                      每题消耗1次 · 剩余{{ remainingCount }}次
                    </text>
                  </text>
                </view>
                <text class="text-xs text-gray-500 block mt-0.5">
                  智能生成混淆选项，选择正确选项
                </text>
              </view>
            </view>

            <!-- 复述模式选项 -->
            <view
              v-if="settingsStore.showAIFeature"
              class="flex items-center gap-3 p-4 rounded-xl transition-all border"
              :class="[
                selectedMode === StudyMode.RECITE
                  ? 'bg-indigo-50 border-indigo-500'
                  : 'border-gray-100',
              ]"
              @tap="handleModeSelect(StudyMode.RECITE)"
            >
              <text
                class="i-tabler-mood-sing text-xl"
                :class="[selectedMode === StudyMode.RECITE ? 'text-indigo-500' : 'text-gray-500']"
              />
              <view class="flex-1">
                <view class="flex items-center gap-2">
                  <text
                    class="text-sm font-medium"
                    :class="[
                      selectedMode === StudyMode.RECITE ? 'text-indigo-500' : 'text-gray-700',
                    ]"
                  >
                    复述模式
                    <text class="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-gray-50 text-gray-400">
                      每题消耗1次 · 剩余{{ remainingCount }}次
                    </text>
                  </text>
                </view>
                <text class="text-xs text-gray-500 block mt-0.5">输入或朗读卡片内容，智能评分</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="px-5 pb-5">
        <view
          class="w-full h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 transition-all"
          hoverClass="scale-97 origin-center"
          :hoverStayTime="200"
          :hoverStartTime="0"
          @tap="handleStart"
        >
          <text class="i-tabler-book text-white" />
          <text class="text-white font-medium">
            {{ props.isPracticeMode ? '开始练习' : '开始学习' }}
            {{
              props.isPracticeMode
                ? cardItems.length
                : todayStudyCards.newCards.length + todayStudyCards.reviewCards.length
            }}
            张卡片
          </text>
        </view>
      </view>
    </view>

    <QuotaExceededModal v-model="isQuotaDialogVisible" title="今日学习次数不足" />
  </wd-popup>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useSettingsStore, useCardBoxStore, useUserStore, useCardDataStore } from '@/store'
import { StudyMode } from '@/types/study'

import QuotaExceededModal from './QuotaExceededModal.vue'

const { vibrate } = useVibrate()
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    cardBoxId: string
    isPracticeMode?: boolean
  }>(),
  {
    isPracticeMode: false,
  },
)

const cardBoxStore = useCardBoxStore()
const todayStudyCards = computed(() => cardBoxStore.getTodayStudyCards(props.cardBoxId))

const { updateLockScroll } = inject<{ updateLockScroll: (newValue: boolean) => void }>('lockScroll')
watch(
  () => props.modelValue,
  async () => {
    if (props.modelValue) {
      await settingsStore.checkAIFeature()
      await userStore.refreshUserInfo()
    }
    updateLockScroll(props.modelValue)
  },
)
const emits = defineEmits<{
  'update:modelValue': [value: boolean]
  start: [mode: StudyMode, practice?: { order: 'sequence' | 'random' }]
}>()

const settingsStore = useSettingsStore()
const userStore = useUserStore()
const cardDataStore = useCardDataStore()
const { quotaInfo } = storeToRefs(userStore)
const selectedMode = ref<StudyMode>(StudyMode.RECALL)
const isQuotaDialogVisible = ref(false)

const handleStart = () => {
  if (
    (selectedMode.value === StudyMode.QUIZ || selectedMode.value === StudyMode.RECITE) &&
    quotaInfo.value.total - quotaInfo.value.used < 1
  ) {
    isQuotaDialogVisible.value = true
    return
  }

  emits(
    'start',
    selectedMode.value,
    props.isPracticeMode ? { order: practiceOrder.value } : undefined,
  )
  emits('update:modelValue', false)
}

const remainingCount = computed(() => quotaInfo.value.total - quotaInfo.value.used)

const handleModeSelect = (mode: StudyMode) => {
  vibrate()
  selectedMode.value = mode
}

const cardBoxData = computed(() => cardDataStore.cardBoxes[props.cardBoxId])
const cardItems = computed(() => {
  const box = cardDataStore.cardBoxList.find((box) => box.id === props.cardBoxId)
  return box?.cardItems || []
})
const practiceOrder = ref<'sequence' | 'random'>('sequence')
</script>
