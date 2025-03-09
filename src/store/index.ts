import _ from 'lodash'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

// 创建一个防抖的存储写入函数

const store = createPinia()
store.use(
  createPersistedState({
    storage: {
      setItem: uni.setStorageSync,
      getItem: uni.getStorageSync,
    },
  }),
)

export default store

// 模块统一导出
export * from './user'
export * from './cardBox'
export * from './cardData'
export * from './cardItem'
export * from './settings'
export * from './folder'
