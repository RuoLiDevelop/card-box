<template>
  <view
    :class="['group transform-gpu ease-out relative', customClass]"
    :style="{
      height: getCardHeight(),
      transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
      transformStyle: 'preserve-3d',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }"
    @tap.stop="$emit('tap')"
    @longpress.stop="$emit('longpress')"
    :hoverClass="!disableHover ? 'scale-97! origin-center' : ''"
    :hoverStartTime="0"
    :hoverStayTime="200"
  >
    <!-- 掌握程度指示器 -->
    <view v-if="showStudyState && studyState" class="absolute left-2 top-1 z-10">
      <view class="relative w-4 h-4">
        <!-- 背景圆环 -->
        <view
          class="absolute inset-0 rounded-full bg-white"
          :style="{
            boxShadow: '0 2px 6px -1px rgba(0,0,0,0.1)',
          }"
        />
        <!-- 进度圆环 -->
        <view
          class="absolute inset-0.5 rounded-full bg-white overflow-hidden"
          :style="{
            background: `conic-gradient(
              ${studyState.stage === memoryStages.length ? 'rgb(52 211 153)' : 'rgb(99 102 241)'} ${(studyState.stage / memoryStages.length) * 100}%,
              rgb(243 244 246) ${(studyState.stage / memoryStages.length) * 100}%
            )`,
          }"
        />
        <!-- 内圆 -->
        <view class="absolute inset-1 rounded-full bg-white" />
      </view>
    </view>

    <!-- 正面内容 -->
    <view
      class="absolute inset-0 rounded-2xl overflow-hidden backface-hidden"
      :style="{
        transform: 'rotateY(0deg)',
        background: 'linear-gradient(135deg, #ffffff 0%, #fafeff 100%)',
      }"
    >
      <view class="h-full relative z-1">
        <view
          class="absolute inset-0 p-4"
          :class="[isContentCentered && 'flex items-center justify-center']"
        >
          <view class="w-full">
            <!-- 卡片内容 -->
            <text
              class="font-600 text-gray-800 overflow"
              :class="[isLargeFont ? 'text-lg' : 'text-base', isContentCentered && 'text-center']"
              :style="{
                'line-height': isLargeFont ? '32px' : '24px',
                'letter-spacing': '0.01em',
                '-webkit-line-clamp': getLineClamp(),
              }"
            >
              <template v-if="showNumber">
                <text class="text-gray-400 font-normal">{{ index + 1 }}.</text>
              </template>
              {{ frontContent }}
            </text>

            <text
              v-if="!frontContent"
              class="block mt-2 text-gray-400 font-normal"
              :class="[isLargeFont ? 'text-base' : 'text-sm']"
            >
              暂无内容
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 背面内容 -->
    <view
      class="absolute inset-0 rounded-2xl overflow-hidden backface-hidden"
      :style="{
        transform: 'rotateY(180deg)',
        background: 'linear-gradient(135deg, #ffffff 0%, #fafeff 100%)',
      }"
    >
      <view class="h-full relative z-1">
        <view
          class="absolute inset-0 p-4"
          :class="[isContentCentered && 'flex items-center justify-center']"
        >
          <view class="w-full">
            <text
              class="font-600 text-gray-800 transition-all duration-300 overflow"
              :class="[isLargeFont ? 'text-lg' : 'text-base', isContentCentered && 'text-center']"
              :style="{
                'line-height': isLargeFont ? '32px' : '24px',
                'letter-spacing': '0.01em',
                '-webkit-line-clamp': getLineClamp(),
              }"
            >
              {{ backContent }}
            </text>

            <text
              v-if="!backContent"
              class="block mt-2 text-gray-400 font-normal"
              :class="[isLargeFont ? 'text-base' : 'text-sm']"
            >
              暂无内容
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 阴影 -->
    <view
      class="absolute inset-0 rounded-2xl -z-1 transition-all duration-200"
      :style="{
        transform: layout === 'list' ? 'scale(0.99)' : 'scale(0.98)',
        boxShadow: '0 8px 16px -6px rgba(0,0,0,0.1), 0 4px 8px -4px rgba(0,0,0,0.07)',
      }"
    />

    <!-- 添加插槽 -->
    <slot name="action"></slot>
  </view>
</template>

<script setup lang="ts">
import { memoryStages } from '@/store'

import type { CardItem } from '@/types/card'
const props = defineProps<{
  frontContent: string
  backContent: string
  index: number
  layout?: 'list' | 'grid'
  isFlipped?: boolean
  isContentCentered?: boolean
  isLargeFont?: boolean
  showNumber?: boolean
  disableHover?: boolean
  studyState?: CardItem['studyState']
  showStudyState?: boolean
  customClass?: string
}>()

defineEmits<{
  (e: 'tap'): void
  (e: 'longpress'): void
}>()

const getLineClamp = () => {
  const isListLayout = props.layout === 'list'
  const isLarge = props.isLargeFont

  if (isListLayout) {
    return isLarge ? 2 : 3
  }
  return isLarge ? 4 : 6
}

const getCardHeight = () => {
  return props.layout === 'list' ? '100px' : '170px'
}
</script>

<style scoped>
.overflow {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  word-break: break-word;
  white-space: pre-line;
}

.backface-hidden {
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transform-style: preserve-3d;
}
</style>
