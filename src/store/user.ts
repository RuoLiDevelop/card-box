import dayjs from 'dayjs'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface DailyStudyRecord {
  date: string
  duration: number
}

interface MonthlyStudyRecord {
  _id?: string
  _openid?: string
  yearMonth: string // 格式: YYYY-MM
  records: DailyStudyRecord[]
  createdAt?: Date
  updatedAt?: Date
}

interface UserState {
  openid: string
  memberLevel: 'default' | 'pro' | 'max'
  memberExpireDate?: string
  aiUsage: {
    date: string
    count: number
  }
  quotaLimit: number
  currentMonthStudy?: MonthlyStudyRecord // 当前月份的学习记录
}

export const useUserStore = defineStore('user', () => {
  // 基础状态
  const userInfo = ref<UserState>({
    openid: '',
    memberLevel: 'default',
    memberExpireDate: '',
    aiUsage: {
      date: '',
      count: 0,
    },
    quotaLimit: 0,
  })

  // ==================== 日期工具函数 ====================
  const getTodayString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const isToday = (date: string) => date === getTodayString()

  // ==================== AI 额度相关 ====================
  const quotaInfo = computed(() => ({
    used: isToday(userInfo.value.aiUsage.date) ? userInfo.value.aiUsage.count : 0,
    total: userInfo.value.quotaLimit,
    percentage: Math.round(
      ((userInfo.value.quotaLimit -
        (isToday(userInfo.value.aiUsage.date) ? userInfo.value.aiUsage.count : 0)) /
        userInfo.value.quotaLimit) *
        100,
    ),
  }))

  const remainingCount = computed(() => {
    if (!quotaInfo.value) return 0
    return Math.max(0, quotaInfo.value.total - quotaInfo.value.used)
  })

  // 更新 AI 使用次数
  const updateAIUsage = async (count: number = 1) => {
    const today = getTodayString()
    const db = wx.cloud.database()

    try {
      await db
        .collection('users')
        .doc(userInfo.value.openid)
        .update({
          data: {
            aiUsage: {
              date: today,
              count: userInfo.value.aiUsage.count + count,
            },
            updatedAt: db.serverDate(),
          },
        })

      userInfo.value.aiUsage = {
        date: today,
        count: userInfo.value.aiUsage.count + count,
      }

      return true
    } catch (error) {
      console.error('更新 AI 使用次数失败:', error)
      return false
    }
  }

  // ==================== 状态同步与更新 ====================
  // 统一的状态更新函数
  const syncUserState = async (userData: any) => {
    try {
      const today = getTodayString()
      const updates: Partial<UserState> = {}
      let needsDbUpdate = false

      // 1. 检查会员状态
      if (userData.memberExpireDate) {
        const expireDate = new Date(userData.memberExpireDate)
        const todayDate = new Date(today)

        if (todayDate.getTime() > expireDate.getTime() && userData.memberLevel !== 'default') {
          updates.memberLevel = 'default'
          updates.memberExpireDate = ''
          needsDbUpdate = true
        } else {
          updates.memberLevel = userData.memberLevel
          updates.memberExpireDate = userData.memberExpireDate
        }
      }

      // 2. 检查并更新 AI 额度
      const quotaLimit = await getUserQuotaLimit(updates.memberLevel || userData.memberLevel)
      updates.quotaLimit = quotaLimit

      // 3. 检查 AI 使用状态
      if (userData.aiUsage) {
        if (!isToday(userData.aiUsage.date)) {
          // 如果不是今天的数据，重置计数
          updates.aiUsage = {
            date: today,
            count: 0,
          }
          needsDbUpdate = true
        } else {
          updates.aiUsage = userData.aiUsage
        }
      } else {
        updates.aiUsage = {
          date: today,
          count: 0,
        }
        needsDbUpdate = true
      }

      // 4. 如果需要，更新数据库
      if (needsDbUpdate) {
        const db = wx.cloud.database()
        await db
          .collection('users')
          .doc(userInfo.value.openid)
          .update({
            data: {
              ...updates,
              updatedAt: db.serverDate(),
            },
          })
      }

      // 5. 更新本地状态
      setUserInfo(updates)

      return {
        ...updates,
        needsDbUpdate,
      }
    } catch (error) {
      console.error('同步用户状态失败:', error)
      throw new Error('同步用户状态失败')
    }
  }

  // 获取或创建月度学习记录
  const getOrCreateMonthlyRecord = async () => {
    const db = wx.cloud.database()
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const yearMonth = `${year}-${month}`

    try {
      // 查询当月记录
      const result = await db
        .collection('monthly-study')
        .where({
          _openid: userInfo.value.openid,
          yearMonth,
        })
        .get()

      if (result.data.length > 0) {
        userInfo.value.currentMonthStudy = result.data[0] as MonthlyStudyRecord
        return result.data[0] as MonthlyStudyRecord
      }

      // 不存在则创建新记录
      const newRecord: MonthlyStudyRecord = {
        yearMonth,
        records: [],
      }

      const addResult = await db.collection('monthly-study').add({
        data: {
          ...newRecord,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate(),
        },
      })

      newRecord._id = addResult._id as string
      userInfo.value.currentMonthStudy = newRecord
      return newRecord
    } catch (error) {
      console.error('获取月度学习记录失败:', error)
      throw error
    }
  }

  // 修改刷新用户信息函数
  const refreshUserInfo = async () => {
    try {
      const db = wx.cloud.database()
      console.log('userInfo.value.openid', userInfo.value)
      const userResult = await db.collection('users').doc(userInfo.value.openid).get()
      await syncUserState(userResult.data)

      // 刷新当月学习记录
      await getOrCreateMonthlyRecord()

      return true
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      throw error
    }
  }

  // 修改初始化用户数据函数
  const initUserData = async (openid: string) => {
    try {
      const db = wx.cloud.database()
      const userResult = await db.collection('users').doc(openid).get()

      if (userResult.data) {
        await syncUserState(userResult.data)
      } else {
        await createNewUser(openid)
        const newUserResult = await db.collection('users').doc(openid).get()
        await syncUserState(newUserResult.data)
      }

      // 获取当月学习记录
      await getOrCreateMonthlyRecord()
    } catch (error) {
      if ((error as any).errCode === -1) {
        await createNewUser(openid)
        const db = wx.cloud.database()
        const newUserResult = await db.collection('users').doc(openid).get()
        await syncUserState(newUserResult.data)
      } else {
        console.error('同步用户信息失败:', error)
        throw error
      }
    }
  }

  // 修改更新会员等级函数
  const updateMemberLevel = async (level: 'default' | 'pro' | 'max', expireDate?: string) => {
    try {
      const db = wx.cloud.database()
      const userData = {
        ...userInfo.value,
        memberLevel: level,
        memberExpireDate: expireDate || '',
      }

      await db
        .collection('users')
        .doc(userInfo.value.openid)
        .update({
          data: {
            memberLevel: level,
            memberExpireDate: expireDate || null,
            updatedAt: db.serverDate(),
          },
        })

      await syncUserState(userData)
      return true
    } catch (error) {
      console.error('更新会员等级失败:', error)
      return false
    }
  }

  // 修改 AI 额度相关函数
  const checkAndUpdateAICount = async (count: number = 1) => {
    const currentState = await syncUserState(userInfo.value)

    // 检查是否超出限额
    if (currentState.aiUsage.count + count > quotaInfo.value.total) {
      return false
    }

    return await updateAIUsage(count)
  }

  // 增加 AI 额度
  const increaseAIQuota = async (count: number = 1) => {
    try {
      const currentState = await syncUserState(userInfo.value)
      const db = wx.cloud.database()
      const today = getTodayString()
      const newCount = Math.max(0, currentState.aiUsage.count - count)

      await db
        .collection('users')
        .doc(userInfo.value.openid)
        .update({
          data: {
            aiUsage: {
              date: today,
              count: newCount,
            },
            updatedAt: db.serverDate(),
          },
        })

      userInfo.value.aiUsage = {
        date: today,
        count: newCount,
      }

      return true
    } catch (error) {
      console.error('增加AI额度失败:', error)
      throw new Error('增加AI额度失败')
    }
  }

  // ==================== 用户状态管理 ====================
  // 获取用户配额
  const getUserQuotaLimit = async (memberLevel: string) => {
    const db = wx.cloud.database()
    const configResult = await db.collection('config').limit(1).get()
    return configResult.data[0].limit[memberLevel || 'default']
  }

  // 创建新用户
  const createNewUser = async (openid: string) => {
    const db = wx.cloud.database()
    await db.collection('users').add({
      data: {
        _id: openid,
        memberLevel: 'default',
        memberExpireDate: '',
        aiUsage: {
          date: '',
          count: 0,
        },
        createdAt: db.serverDate(),
        updatedAt: db.serverDate(),
      },
    })
  }

  const setUserInfo = (info: Partial<UserState>) => {
    userInfo.value = {
      ...userInfo.value,
      ...info,
    }
  }

  const clearUserInfo = () => {
    userInfo.value = null
  }

  const isLogined = computed(() => !!userInfo.value.openid)

  // 获取学习时长等级 (0-3)
  const getStudyTimeLevel = (duration: number) => {
    if (duration >= 30) return 3
    if (duration >= 20) return 2
    if (duration >= 10) return 1
    if (duration >= 5) return 0
    return -1
  }

  // 更新今日学习时长
  const updateTodayStudyTime = async (duration: number) => {
    // 如果时长太小，不更新
    if (duration <= 0) return true

    const today = getTodayString()
    const db = wx.cloud.database()

    try {
      const monthlyRecord = await getOrCreateMonthlyRecord()
      const existingRecord = monthlyRecord.records.find((r) => r.date === today)
      const newDuration = (existingRecord?.duration || 0) + duration

      // 更新数据库
      await db
        .collection('monthly-study')
        .doc(monthlyRecord._id)
        .update({
          data: {
            records: existingRecord
              ? db.command.set(
                  monthlyRecord.records.map((r) =>
                    r.date === today ? { ...r, duration: newDuration } : r,
                  ),
                )
              : db.command.push([{ date: today, duration: newDuration }]),
            updatedAt: db.serverDate(),
          },
        })

      // 更新本地状态
      if (existingRecord) {
        existingRecord.duration = newDuration
      } else {
        monthlyRecord.records.push({
          date: today,
          duration: newDuration,
        })
      }

      return true
    } catch (error) {
      console.error('更新学习时长失败:', error)
      return false
    }
  }

  // 获取本月的学习记录
  const getCurrentMonthStudyRecords = computed(() => {
    const now = dayjs()
    const startOfMonth = now.startOf('month')
    const daysInMonth = now.daysInMonth()

    const records: { date: string; level: number }[] = []
    const monthlyRecords = userInfo.value.currentMonthStudy?.records || []

    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = startOfMonth.add(i, 'day')
      const dateStr = currentDate.format('YYYY-MM-DD')
      const record = monthlyRecords.find((r) => r.date === dateStr)

      records.push({
        date: dateStr,
        level: record ? getStudyTimeLevel(record.duration) : -1,
      })
    }

    return records
  })

  // 添加当前计时状态
  const currentTimer = ref(0)

  // 获取今日学习时长（包含当前计时）
  const getTodayStudyDuration = computed(() => {
    const today = getTodayString()
    const todayRecord = userInfo.value.currentMonthStudy?.records.find((r) => r.date === today)
    return (todayRecord?.duration || 0) + currentTimer.value
  })

  // 更新当前计时
  const updateCurrentTimer = (minutes: number) => {
    currentTimer.value = minutes
  }

  return {
    // 状态
    userInfo,
    quotaInfo,
    remainingCount,
    isLogined,

    // AI 额度相关
    checkAndUpdateAICount,
    increaseAIQuota,

    // 用户状态管理
    setUserInfo,
    clearUserInfo,
    initUserData,
    refreshUserInfo,
    updateMemberLevel,

    // 学习时长相关
    getCurrentMonthStudyRecords,
    updateTodayStudyTime,
    getTodayStudyDuration,
    updateCurrentTimer,
  }
})
