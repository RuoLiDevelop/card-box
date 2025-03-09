<script setup lang="ts">
import dayjs from 'dayjs'
import { computed, inject, ref } from 'vue'

import { useUserStore } from '@/store'

const props = defineProps<{
  records: { date: string; level: number }[]
}>()

const userStore = useUserStore()

// 计算日历网格数据
const calendarData = computed(() => {
  const now = dayjs()
  const startOfMonth = now.startOf('month')
  const startWeekday = startOfMonth.day() // 0-6, 0 是周日
  const daysInMonth = now.daysInMonth()

  const weeks: { date: string; level: number }[][] = []
  let currentWeek: { date: string; level: number }[] = []

  // 填充月初空白天数
  for (let i = 0; i < startWeekday; i++) {
    currentWeek.push({ date: '', level: -1 })
  }

  // 填充实际日期
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = startOfMonth.add(day - 1, 'day')
    const dateStr = currentDate.format('YYYY-MM-DD')
    const record = props.records.find((r) => r.date === dateStr)

    currentWeek.push({
      date: dateStr,
      level: record?.level ?? -1,
    })

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // 填充月末空白天数
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: '', level: -1 })
    }
    weeks.push(currentWeek)
  }

  return weeks
})

// 获取日期对应的颜色类名
const getLevelColorClass = (level: number) => {
  if (level === -1) return 'bg-gray-100'
  const colors = ['bg-indigo-100', 'bg-indigo-200', 'bg-indigo-300', 'bg-indigo-400']
  return colors[level]
}

// 获取今天的日期字符串
const today = dayjs().format('YYYY-MM-DD')

// 获取今日学习时长
const getTodayDuration = computed(() => userStore.getTodayStudyDuration)
</script>

<template>
  <view class="flex flex-col gap-4">
    <!-- 今日学习时长 -->
    <view class="flex items-center justify-between bg-indigo-50/50 rounded-xl p-2">
      <view class="flex items-center gap-2">
        <view class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          <text class="i-tabler-clock text-lg text-indigo-500" />
        </view>
        <view class="flex flex-col">
          <text class="text-xs text-gray-500">今日学习时长</text>
          <text class="text-sm font-medium text-gray-800">{{ getTodayDuration }} 分钟</text>
        </view>
      </view>
    </view>

    <!-- 本月学习情况 -->
    <view class="flex flex-col gap-4">
      <view class="flex items-center justify-between text-sm text-gray-500 px-1">
        <text>本月学习情况</text>
        <view class="flex items-center gap-2">
          <view
            v-for="(label, index) in ['5分钟', '10分钟', '20分钟', '30分钟']"
            :key="index"
            class="flex items-center gap-1"
          >
            <view class="w-2 h-2 rounded" :class="getLevelColorClass(index)" />
            <text class="text-xs">{{ label }}</text>
          </view>
        </view>
      </view>

      <view class="grid grid-cols-7 gap-2">
        <view
          v-for="(day, index) in ['日', '一', '二', '三', '四', '五', '六']"
          :key="index"
          class="text-center text-xs text-gray-400 mb-1.5 w-4"
        >
          {{ day }}
        </view>

        <template v-for="(week, weekIndex) in calendarData" :key="weekIndex">
          <view
            v-for="(day, dayIndex) in week"
            :key="`${weekIndex}-${dayIndex}`"
            class="aspect-square rounded-md transition-colors relative w-7 h-7"
            :class="[
              getLevelColorClass(day.level),
              day.date === today ? 'ring-1 ring-indigo-600' : '',
            ]"
          />
        </template>
      </view>
    </view>
  </view>
</template>
