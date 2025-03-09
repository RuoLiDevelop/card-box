import { onShow, onHide } from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import { ref, onUnmounted } from 'vue'

import { useUserStore } from '@/store'

export const useStudyTimer = () => {
  const userStore = useUserStore()
  const startTime = ref<number>(0)
  const currentTimer = ref(0)
  let displayTimer: ReturnType<typeof setInterval> | null = null
  let updateTimer: ReturnType<typeof setInterval> | null = null
  let backgroundEnterTime = 0

  // 初始化今日已记录的时长
  const initTodayTimer = () => {
    const today = dayjs().format('YYYY-MM-DD')
    const todayRecord = userStore.userInfo.currentMonthStudy?.records.find((r) => r.date === today)
    currentTimer.value = todayRecord?.duration || 0
  }

  // 开始计时
  const startTimer = () => {
    // 初始化今日已记录的时长
    initTodayTimer()
    startTime.value = Date.now()

    // 更新显示的计时器（每秒更新）
    displayTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.value) / 1000 / 60)
      userStore.updateCurrentTimer(elapsed)
    }, 1000)

    // 数据库更新计时器（每分钟更新）
    updateTimer = setInterval(async () => {
      const duration = Math.floor((Date.now() - startTime.value) / 1000 / 60)
      if (duration > 0) {
        await userStore.updateTodayStudyTime(1)
        startTime.value = Date.now()
      }
    }, 60000)
  }

  // 停止计时
  const stopTimer = async () => {
    // 清理定时器
    if (displayTimer) {
      clearInterval(displayTimer)
      displayTimer = null
    }
    if (updateTimer) {
      clearInterval(updateTimer)
      updateTimer = null
    }

    // 更新最后一段时间
    if (startTime.value > 0) {
      const duration = Math.floor((Date.now() - startTime.value) / 1000 / 60)
      if (duration > 0) {
        await userStore.updateTodayStudyTime(duration)
      }
      startTime.value = 0
      currentTimer.value = 0
    }
    userStore.updateCurrentTimer(0)
  }

  // 处理进入后台
  const handleAppHide = () => {
    backgroundEnterTime = Date.now()
    stopTimer() // 停止计时器
  }

  // 处理返回前台
  const handleAppShow = () => {
    if (backgroundEnterTime > 0) {
      const backgroundDuration = Date.now() - backgroundEnterTime
      // 如果后台时间超过5分钟，重新开始计时
      if (backgroundDuration > 5 * 60 * 1000) {
        startTimer()
      } else {
        // 计算后台时间并更新
        const duration = Math.floor(backgroundDuration / 1000 / 60)
        if (duration > 0) {
          userStore.updateTodayStudyTime(duration)
        }
        startTimer()
      }
      backgroundEnterTime = 0
    } else {
      startTimer()
    }
  }

  onShow(() => {
    handleAppShow()
  })

  onHide(() => {
    handleAppHide()
  })

  onUnmounted(() => {
    stopTimer()
  })

  return {
    currentTimer,
  }
}
