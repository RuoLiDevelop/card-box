<template>
  <wd-popup
    :modelValue="modelValue"
    customClass="rounded-2xl"
    position="bottom"
    @close="emit('update:modelValue', false)"
    safe-area-inset-bottom
  >
    <view class="bg-white rounded-xl overflow-hidden">
      <view class="p-5 space-y-5">
        <!-- 标题区域 -->
        <view class="flex items-center justify-between">
          <text class="text-lg font-semibold text-gray-800">{{ title || '增加使用额度' }}</text>
          <view
            class="text-sm text-gray-400 py-1 px-3 rounded-full"
            hoverClass="bg-gray-50"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="emit('update:modelValue', false)"
          >
            关闭
          </view>
        </view>

        <!-- 套餐展示 -->
        <view class="space-y-3">
          <view class="text-sm font-medium text-gray-700 mb-2">升级获取更多次数</view>
          <view class="grid grid-cols-2 gap-3">
            <!-- Pro 套餐 -->
            <view
              class="p-3 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-50/30 relative overflow-hidden"
            >
              <view class="flex items-center gap-2 mb-2">
                <text class="text-sm font-medium text-blue-600">Pro</text>
                <text class="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                  推荐
                </text>
              </view>
              <view class="space-y-2">
                <text class="text-blue-600 font-medium block">{{ plans.pro.quota }}次/天</text>
                <text class="text-[10px] text-blue-600/60 block">{{ plans.pro.price }}</text>
              </view>
            </view>

            <!-- Max 套餐 -->
            <view
              class="p-3 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-purple-50/30"
            >
              <view class="flex items-center gap-2 mb-2">
                <text class="text-sm font-medium text-purple-600">Max</text>
              </view>
              <view class="space-y-2">
                <text class="text-purple-600 font-medium block">{{ plans.max.quota }}次/天</text>
                <text class="text-[10px] text-purple-600/60 block">{{ plans.max.price }}</text>
              </view>
            </view>
          </view>

          <!-- 联系客服按钮 -->
          <view
            class="w-full py-3 rounded-[24px] flex items-center justify-center gap-2 text-indigo-500 text-center text-sm font-medium transition-all"
            :style="{
              background:
                'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.15))',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.1)',
            }"
            :hover-class="'opacity-90 transform scale-98'"
          >
            <button
              class="flex items-center justify-center gap-2 text-indigo-500 text-sm font-medium bg-transparent border-none p-0 m-0 w-full"
              open-type="contact"
            >
              <text class="i-tabler-messages text-base" />
              <text>联系客服提前体验</text>
            </button>
          </view>
        </view>

        <!-- 分割线 -->
        <view class="flex items-center gap-3 py-1">
          <view class="h-[1px] flex-1 bg-gray-100" />
          <text class="text-xs text-gray-400">或者</text>
          <view class="h-[1px] flex-1 bg-gray-100" />
        </view>

        <!-- 广告相关 -->
        <view class="space-y-3">
          <view
            class="p-3 rounded-xl bg-gradient-to-br from-indigo-50/50 to-indigo-50/30 border border-indigo-100/50"
          >
            <view class="flex flex-col gap-2">
              <view class="flex items-center gap-2">
                <text class="i-tabler-movie text-base text-indigo-500" />
                <text class="text-sm text-indigo-600">观看广告获得5次机会</text>
              </view>
              <text class="text-xs text-indigo-600/70">
                观看短视频广告即可获得使用次数，广告收入将用于支持我们提供更好的服务
              </text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="px-5 pb-5 space-y-3">
        <view
          class="w-full py-3 rounded-[24px] text-white text-center text-sm font-medium transition-all"
          :style="{
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
          }"
          :hover-class="'opacity-90 transform scale-98'"
          @tap="handleWatchAd"
        >
          <text>观看广告获得 5 次额度</text>
        </view>
      </view>
    </view>
  </wd-popup>

  <wd-popup v-model="isThankDialogVisible" customClass="bg-transparent shadow-none rounded-[32px]">
    <view
      class="p-8 rounded-[32px] w-[420rpx]"
      :style="{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      }"
    >
      <view class="flex flex-col items-center gap-5">
        <view
          class="w-18 h-18 rounded-full flex items-center justify-center p-[2px]"
          :style="{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.3))',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
          }"
        >
          <view
            class="w-full h-full rounded-full flex items-center justify-center"
            :style="{
              background:
                'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.95))',
            }"
          >
            <text
              class="i-tabler-mood-heart text-3xl text-indigo-500"
              :style="{
                filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.2))',
              }"
            />
          </view>
        </view>

        <view class="flex flex-col items-center gap-3">
          <text
            class="text-lg font-medium text-gray-800"
            :style="{
              textShadow: '0 0 1px rgba(0,0,0,0.05)',
            }"
          >
            感谢支持！
          </text>
          <text
            class="text-sm text-gray-600/90 text-center leading-6 tracking-wide"
            :style="{
              textShadow: '0 0 1px rgba(0,0,0,0.03)',
            }"
          >
            您已获得 5 次使用机会，广告可以帮助我们持续为您提供更好的服务，感谢您的理解~
          </text>
        </view>

        <view
          class="mt-2 w-full py-3.5 rounded-[24px] text-indigo-500 text-center text-sm font-medium transition-all"
          :style="{
            background:
              'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.15))',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.1)',
          }"
          :hover-class="'opacity-90 transform scale-98'"
          @tap="isThankDialogVisible = false"
        >
          继续使用
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useUserStore, useSettingsStore } from '@/store'
import { useAdStore } from '@/store/ad'

defineProps<{
  modelValue: boolean
  title?: string
  description?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const userStore = useUserStore()
const adStore = useAdStore()
const settingsStore = useSettingsStore()
const isThankDialogVisible = ref(false)

const { plans } = storeToRefs(settingsStore)

const handleWatchAd = async () => {
  await adStore.showAd('quota', async () => {
    await userStore.increaseAIQuota(5)
    await userStore.refreshUserInfo()
    emit('update:modelValue', false)
    isThankDialogVisible.value = true
    emit('success')
  })
}
</script>
