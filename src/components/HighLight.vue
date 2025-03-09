<template>
  <view class="text-sm leading-relaxed">
    <template v-for="(segment, index) in highlightedSegments" :key="index">
      <text
        :class="[
          'tracking-wide',
          segment.isMatched
            ? 'text-indigo-500 font-medium bg-indigo-50/50 px-0.5 rounded'
            : 'text-gray-700',
        ]"
      >
        {{ segment.text }}
      </text>
    </template>
  </view>
</template>

<script lang="ts" setup>
import { defineProps, computed } from 'vue'

interface Props {
  text: string
  matches: { startIndex: number; endIndex: number }[]
}

const props = defineProps<Props>()

// 优化高亮文本计算逻辑
const highlightedSegments = computed(() => {
  if (!props.matches?.length) {
    return [{ text: props.text || '暂无内容', isMatched: false }]
  }

  const segments = []
  let lastIndex = 0

  // 对匹配区间进行排序
  const sortedMatches = [...props.matches].sort((a, b) => a.startIndex - b.startIndex)

  for (const match of sortedMatches) {
    if (match.startIndex > lastIndex) {
      segments.push({
        text: props.text.slice(lastIndex, match.startIndex),
        isMatched: false,
      })
    }

    segments.push({
      text: props.text.slice(match.startIndex, match.endIndex),
      isMatched: true,
    })

    lastIndex = match.endIndex
  }

  if (lastIndex < props.text.length) {
    segments.push({
      text: props.text.slice(lastIndex),
      isMatched: false,
    })
  }

  return segments
})
</script>

<style lang="scss" scoped>
// 样式可以根据需要添加
</style>
