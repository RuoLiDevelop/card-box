<script lang="ts" setup>
import { ref, watch } from 'vue'

import { useSettingsStore } from '@/store'

import QuotaExceededModal from './QuotaExceededModal.vue'

const props = defineProps<{
  isShow: boolean
}>()

const emit = defineEmits(['close'])
const { updateLockScroll } = inject<{
  updateLockScroll: (isLock: boolean) => void
}>('lockScroll')

watch(
  () => props.isShow,
  async (newVal) => {
    if (newVal) {
      try {
        // 获取存储信息
        getStorageInfo()
      } catch (error) {
        console.error('初始化设置弹窗失败:', error)
      }
    }
    updateLockScroll(newVal)
  },
)

const settingsStore = useSettingsStore()

// 其他设置相关的方法
const onSyncChange = () => {
  uni.showToast({
    title: '同步功能正在开发中，如果需要可以联系作者',
    icon: 'none',
  })
}

const storageInfo = ref({
  currentSize: 0,
  limitSize: 0,
  percentage: 0,
})

// 获取存储信息
const getStorageInfo = () => {
  uni.getStorageInfo({
    success: (res) => {
      const currentKB = res.currentSize
      const limitKB = res.limitSize
      storageInfo.value = {
        currentSize: Number((currentKB / 1024).toFixed(1)), // 转换为 MB
        limitSize: Number((limitKB / 1024).toFixed(1)), // 转换为 MB
        percentage: Math.round((currentKB / limitKB) * 100),
      }
    },
  })
}

// 添加额度不足弹窗控制
const isQuotaDialogVisible = ref(false)
</script>

<template>
  <wd-popup
    lockScroll
    customClass="rounded-t-3xl relative h-60vh"
    position="bottom"
    :safe-area-inset-bottom="true"
    :modelValue="isShow"
    @close="$emit('close')"
  >
    <view class="overflow-auto h-full">
      <!-- 标题栏 -->
      <view
        class="sticky top-0 left-0 right-0 bg-white z-10 px-4 py-3 flex items-center justify-between border-b border-gray-100"
      >
        <text class="font-semibold text-base">设置</text>
        <view
          class="text-sm text-gray-400 py-1.5 px-3 rounded-lg"
          hoverClass="bg-gray-50"
          :hoverStartTime="0"
          :hoverStayTime="200"
          @tap="$emit('close')"
        >
          关闭
        </view>
      </view>

      <wd-cell-group border>
        <!-- 跨设备同步 -->
        <wd-cell center>
          <template #title>
            <view class="flex flex-col gap-0.5">
              <view class="flex items-center gap-2">
                <view class="i-tabler-cloud text-sm text-gray-700" />
                <view class="flex items-center gap-1">
                  <view class="text-sm">数据同步</view>
                  <view
                    class="bg-gray-50 text-gray-600 rounded-full text-xs px-2 py-0.5 font-medium scale-80"
                  >
                    PRO
                  </view>
                </view>
              </view>
              <view class="text-xs text-gray-400">
                数据存储在本地，删除小程序会导致数据丢失，请及时备份或开启同步
              </view>
            </view>
          </template>
          <view class="custom-value" style="height: 32px">
            <wd-switch :modelValue="settingsStore.sync" @change="onSyncChange" size="20px" />
          </view>
        </wd-cell>

        <!-- 震动反馈 -->
        <wd-cell center>
          <template #title>
            <view class="flex flex-col gap-1">
              <view class="flex items-center gap-2">
                <view class="i-tabler-device-mobile-vibration text-base text-gray-700" />
                <view class="text-sm">震动反馈</view>
              </view>
            </view>
          </template>
          <view class="custom-value" style="height: 32px">
            <wd-switch v-model="settingsStore.vibration" size="20px" />
          </view>
        </wd-cell>

        <!-- 音效反馈 -->
        <wd-cell center>
          <template #title>
            <view class="flex flex-col gap-1">
              <view class="flex items-center gap-2">
                <view class="i-tabler-volume text-base text-gray-700" />
                <view class="text-sm">学习模式音效</view>
              </view>
            </view>
          </template>
          <view class="custom-value" style="height: 32px">
            <wd-switch v-model="settingsStore.soundEffect" size="20px" />
          </view>
        </wd-cell>

        <!-- 意见反馈 -->
        <wd-cell center>
          <template #title>
            <view class="flex flex-col gap-1">
              <view class="flex items-center gap-2">
                <view class="i-tabler-hand-three-fingers text-base text-gray-700" />
                <view class="text-sm">联系作者</view>
              </view>
            </view>
          </template>
          <view class="custom-value" style="height: 32px">
            <wd-button
              type="icon"
              icon="arrow-right"
              customClass="!text-gray-4"
              size="small"
              open-type="contact"
            />
          </view>
        </wd-cell>

        <!-- 存储使用情况 -->
        <wd-cell center>
          <template #title>
            <view class="flex items-center gap-2">
              <view class="i-tabler-database text-base text-gray-700" />
              <view class="text-sm">存储使用情况</view>
            </view>
          </template>
          <view class="custom-value flex flex-col gap-2">
            <!-- 进度条 -->
            <view class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <view
                class="h-full rounded-full transition-all duration-300"
                :class="[
                  storageInfo.percentage > 90
                    ? 'bg-red-500'
                    : storageInfo.percentage > 70
                      ? 'bg-amber-500'
                      : 'bg-indigo-500',
                ]"
                :style="{ width: `${storageInfo.percentage}%` }"
              />
            </view>
            <!-- 使用详情 -->
            <view class="flex items-center justify-between">
              <text class="text-xs text-gray-500">
                {{ storageInfo.currentSize }}MB / {{ storageInfo.limitSize }}MB
              </text>
              <text
                class="text-xs"
                :class="[
                  storageInfo.percentage > 90
                    ? 'text-red-500'
                    : storageInfo.percentage > 70
                      ? 'text-amber-500'
                      : 'text-gray-500',
                ]"
              >
                {{ storageInfo.percentage }}%
              </text>
            </view>
          </view>
        </wd-cell>
      </wd-cell-group>

      <!-- 版本号显示 -->
      <view class="flex items-center justify-center py-6">
        <text class="text-xs text-gray-400">版本号 {{ settingsStore.version }}</text>
      </view>
    </view>

    <!-- 额度不足弹窗 -->
    <QuotaExceededModal
      v-model="isQuotaDialogVisible"
      title="增加使用额度"
      description="观看一个短视频广告，即可获得 5 次使用机会。广告收入将用于支持我们提供更好的服务~"
    />
  </wd-popup>
</template>

<style lang="scss" scoped>
//
</style>
