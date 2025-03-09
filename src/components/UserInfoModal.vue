<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useUserStore, useSettingsStore } from '@/store'

import QuotaExceededModal from './QuotaExceededModal.vue'
import StudyHeatmap from './StudyHeatmap.vue'

const props = defineProps<{
  isShow: boolean
}>()

const settingsStore = useSettingsStore()
const userStore = useUserStore()
const { quotaInfo } = storeToRefs(userStore)

// 添加额度不足弹窗控制
const isQuotaDialogVisible = ref(false)

const { updateLockScroll } = inject<{ updateLockScroll: (newValue: boolean) => void }>('lockScroll')
watch(
  () => props.isShow,
  async (newVal) => {
    if (newVal) {
      try {
        // 先刷新用户信息，因为这会影响到额度
        await userStore.refreshUserInfo()
        // 然后检查 AI 特性
        await settingsStore.checkAIFeature()
      } catch (error) {
        console.error('初始化设置弹窗失败:', error)
      }
    }
    updateLockScroll(newVal)
  },
)

// 复制 openid
const copyOpenId = () => {
  uni.setClipboardData({
    data: userStore.userInfo.openid,
    success: () => {
      uni.showToast({
        title: '已复制',
        icon: 'none',
      })
    },
  })
}

// 会员等级标签
const memberLevelTag = computed(() => {
  const levelMap = {
    default: {
      text: '免费',
      icon: 'i-tabler-user',
      class: 'bg-gray-50 text-gray-600',
    },
    pro: {
      text: 'Pro',
      icon: 'i-tabler-star',
      class: 'bg-blue-50 text-blue-600',
    },
    max: {
      text: 'Max',
      icon: 'i-tabler-crown',
      class: 'bg-purple-50 text-indigo-600',
    },
  }
  return levelMap[userStore.userInfo.memberLevel]
})

// 处理增加额度按钮点击
const handleIncreaseQuota = () => {
  isQuotaDialogVisible.value = true
}

// 获取本月学习记录
const monthlyStudyRecords = computed(() => userStore.getCurrentMonthStudyRecords)
</script>

<template>
  <wd-popup
    lockScroll
    customClass="rounded-t-3xl relative h-80vh"
    position="bottom"
    :safe-area-inset-bottom="true"
    :modelValue="isShow"
    @close="$emit('close')"
  >
    <view class="h-80vh relative">
      <!-- 标题栏 -->
      <view
        class="sticky top-0 left-0 right-0 bg-white z-10 px-4 py-3 flex items-center justify-between border-b border-gray-100"
      >
        <text class="font-semibold text-base">用户信息</text>
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

      <!-- 用户信息卡片 -->
      <view class="h-full">
        <view class="p-4 space-y-2">
          <!-- AI 额度卡片 -->
          <view
            class="rounded-2xl bg-white border border-gray-100 flex flex-col gap-2 p-4"
            :style="{
              boxShadow: '0 8px 20px -6px rgba(0,0,0,0.06), 0 4px 12px -4px rgba(0,0,0,0.03)',
            }"
            v-if="settingsStore.showAIFeature"
          >
            <!-- 卡片标题 -->
            <view class="border-b border-gray-50 flex items-center justify-between">
              <view class="flex items-center gap-1.5 text-gray-500 text-sm">
                <view class="i-tabler-sparkles text-base" />
                <text class="font-medium">今日剩余额度</text>
              </view>
              <!-- 会员等级标签 -->
              <view
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="[
                  userStore.userInfo.memberLevel === 'max'
                    ? 'bg-indigo-50 text-indigo-600'
                    : userStore.userInfo.memberLevel === 'pro'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-gray-50 text-gray-600',
                ]"
              >
                <view class="flex items-center gap-1">
                  <text :class="[memberLevelTag.icon, 'text-xs']" />
                  {{ memberLevelTag.text }}
                </view>
              </view>
            </view>

            <!-- 额度信息 -->
            <view>
              <view class="flex items-center justify-between">
                <view class="flex items-baseline gap-1">
                  <text class="text-2xl font-semibold text-gray-800 tracking-tight">
                    {{ quotaInfo.total - quotaInfo.used }}
                  </text>
                  <text class="text-sm text-gray-500">/ {{ quotaInfo.total }}</text>
                </view>
                <!-- 增加额度按钮 -->
                <view
                  v-if="quotaInfo.used >= 5"
                  class="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-indigo-500 transition-all bg-indigo-50"
                  hover-class="opacity-70 scale-95"
                  :hover-stay-time="200"
                  :hover-start-time="0"
                  @tap="handleIncreaseQuota"
                >
                  <view class="i-solar-magic-stick-3-bold-duotone text-sm" />
                  <text>增加额度</text>
                </view>
              </view>

              <!-- 进度条 -->
              <view class="w-full h-1 bg-gray-100 rounded-full mt-2">
                <view
                  class="h-full rounded-full transition-all duration-300"
                  :class="quotaInfo.percentage <= 20 ? 'bg-red-500' : 'bg-indigo-500'"
                  :style="{ width: `${quotaInfo.percentage}%` }"
                />
              </view>

              <!-- 到期时间 -->
              <template
                v-if="
                  userStore.userInfo.memberExpireDate &&
                  userStore.userInfo.memberLevel !== 'default'
                "
              >
                <view class="flex items-center gap-1 mt-2">
                  <view class="i-tabler-calendar-time text-xs text-gray-400" />
                  <text class="text-xs text-gray-400">
                    {{ userStore.userInfo.memberExpireDate }} 到期
                  </text>
                </view>
              </template>
            </view>
          </view>

          <!-- 用户 ID 卡片 -->
          <view
            class="rounded-2xl bg-white border border-gray-100 flex flex-col gap-2 p-4"
            :style="{
              boxShadow: '0 8px 20px -6px rgba(0,0,0,0.06), 0 4px 12px -4px rgba(0,0,0,0.03)',
            }"
          >
            <view class="border-b border-gray-50">
              <view class="flex items-center gap-1.5 text-gray-500 text-sm">
                <view class="i-tabler-user-circle text-base" />
                <text class="font-medium">用户 ID</text>
              </view>
            </view>
            <view class="flex items-center justify-between">
              <text class="text-sm font-mono text-gray-600 break-all">
                {{ userStore.userInfo.openid || '-' }}
              </text>
              <view
                class="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors shrink-0 active:scale-95"
                @tap="copyOpenId"
              >
                <text class="i-tabler-copy text-sm text-gray-500" />
              </view>
            </view>
          </view>

          <!-- 学习记录卡片 -->
          <view
            class="rounded-2xl bg-white border border-gray-100 flex flex-col gap-2 p-4"
            :style="{
              boxShadow: '0 8px 20px -6px rgba(0,0,0,0.06), 0 4px 12px -4px rgba(0,0,0,0.03)',
            }"
          >
            <view class="border-b border-gray-50">
              <view class="flex items-center gap-1.5 text-gray-500 text-sm">
                <view class="i-tabler-calendar-month text-base" />
                <text class="font-medium">学习记录</text>
              </view>
            </view>
            <StudyHeatmap :records="monthlyStudyRecords" />
          </view>
        </view>
      </view>
    </view>
  </wd-popup>

  <!-- 添加额度对话框 -->
  <QuotaExceededModal v-model="isQuotaDialogVisible" @success="isQuotaDialogVisible = false" />
</template>
