import { defineStore } from 'pinia'

interface State {
  vibration: boolean
  soundEffect: boolean
  showAIFeature: boolean
  reviewVersion: string | null
  model: string
  plans: {
    pro: {
      quota: number
      price: string
      isOnline: boolean
    }
    max: {
      quota: number
      price: string
      isOnline: boolean
    }
  }
}

const initState: State = {
  vibration: true,
  soundEffect: true,
  showAIFeature: false,
  reviewVersion: null,
  model: 'deepseek/deepseek-chat',
  plans: {
    pro: {
      quota: 150,
      price: '未上线',
      isOnline: false,
    },
    max: {
      quota: 300,
      price: '未上线',
      isOnline: false,
    },
  },
}

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const state = reactive({ ...initState })

    // 获取配置并更新 AI 功能状态
    const checkAIFeature = async () => {
      try {
        const db = wx.cloud.database()
        const { data } = await db.collection('config').limit(1).get()
        if (data && data[0]) {
          // 更新套餐配置
          if (data[0].limit) {
            state.plans.pro.quota = data[0].limit.pro
            state.plans.max.quota = data[0].limit.max
          }
          Object.assign(state, data[0])
          state.model = data[0].model
          state.showAIFeature = data[0].reviewVersion !== import.meta.env.VITE_APP_VERSION
        } else {
          console.error('未找到配置数据')
        }
      } catch (error) {
        console.error('获取配置失败:', error)
      }
    }

    return {
      ...toRefs(state),
      version: import.meta.env.VITE_APP_VERSION,
      checkAIFeature,
    }
  },
  {
    persist: true,
  },
)
