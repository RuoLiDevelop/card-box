<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { provide } from 'vue'

import { useUserStore, useCardDataStore } from './store'

const userStore = useUserStore()
const cardDataStore = useCardDataStore()
const { currentTimer } = useStudyTimer()

// 提供计时器给其他组件使用
provide('currentStudyTimer', currentTimer)

onLaunch(() => {
  cardDataStore.loadCardBoxes()
  // 初始化云开发环境
  if (!wx.cloud) {
    console.error('请使用 2.2.3 或以上的基础库以使用云能力')
  } else {
    wx.cloud.init({
      env: import.meta.env.VITE_CLOUD_ENV_ID,
      traceUser: true,
    })

    // 获取用户 openid 并初始化用户数据
    wx.cloud.callFunction({
      name: 'login',
      success: async (res: any) => {
        const { openid } = res.result
        if (openid) {
          // 先设置 openid
          userStore.setUserInfo({ openid })
          // 然后初始化用户数据
          await userStore.initUserData(openid)
        }
      },
      fail: console.error,
    })
  }

  const updateManager = uni.getUpdateManager()
  updateManager.onCheckForUpdate(function (res) {
    console.log(res.hasUpdate)
  })

  updateManager.onUpdateReady(function () {
    uni.showModal({
      title: '更新提示',
      content: '新版本已经准备好，是否重启应用？',
      success(res) {
        if (res.confirm) {
          updateManager.applyUpdate()
        }
      },
    })
  })
})
</script>

<style lang="scss">
/* stylelint-disable selector-type-no-unknown */
button::after {
  border: none;
}

swiper,
scroll-view {
  flex: 1;
  height: 100%;
  overflow: hidden;
}

image {
  width: 100%;
  height: 100%;
  vertical-align: middle;
}

// 单行省略，优先使用 unocss: text-ellipsis
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 两行省略
.ellipsis-2 {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

// 三行省略
.ellipsis-3 {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
</style>
