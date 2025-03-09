import { defineStore } from 'pinia'
import { ref } from 'vue'

type AdAction = 'quota' | null

type AdCallback = () => Promise<void>

export const useAdStore = defineStore('ad', () => {
  const currentAction = ref<AdAction>(null)
  const pendingCallback = ref<AdCallback | null>(null)
  let videoAd: WechatMiniprogram.RewardedVideoAd | null = null

  const initAd = () => {
    if (wx.createRewardedVideoAd && !videoAd) {
      videoAd = wx.createRewardedVideoAd({
        adUnitId: 'adunit-bf98f95b208d6bb9',
      })

      videoAd.onLoad(() => {
        console.log('激励视频广告加载成功')
      })

      videoAd.onError((err) => {
        console.error('激励视频广告加载失败', err)
      })

      videoAd.onClose(async (res) => {
        if (res && res.isEnded) {
          if (pendingCallback.value) {
            try {
              await pendingCallback.value()
            } catch (error) {
              console.error('广告回调执行失败:', error)
            }
          }
        } else {
          uni.showToast({
            title: '需要完整观看广告才能获得奖励~',
            icon: 'none',
          })
        }
        currentAction.value = null
        pendingCallback.value = null
      })
    }
    return videoAd
  }

  const showAd = async (action: AdAction, callback: AdCallback) => {
    currentAction.value = action
    pendingCallback.value = callback
    const ad = initAd()
    if (!ad) {
      uni.showToast({
        title: '广告加载失败',
        icon: 'none',
      })
      currentAction.value = null
      return false
    }

    try {
      await ad.show()
      return true
    } catch (err) {
      try {
        await ad.load()
        await ad.show()
        return true
      } catch (err) {
        console.error('激励视频广告显示失败', err)
        uni.showToast({
          title: '广告加载失败',
          icon: 'none',
        })
        currentAction.value = null
        return false
      }
    }
  }

  return {
    currentAction,
    showAd,
  }
})
