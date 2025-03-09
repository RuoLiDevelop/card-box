<!-- 使用 type="home" 属性设置首页，其他页面不需要设置，默认为page；推荐使用json5，更强大，且允许注释 -->

<route lang="json5" type="home">
{
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '首页',
  },
  layout: false,
}
</route>

<template>
  <page-meta :pageStyle="lockScroll ? 'overflow:hidden' : ''"></page-meta>
  <view class="bg-white w-screen relative transition-all">
    <view class="fixed inset-0 pointer-events-none overflow-hidden">
      <view
        v-for="i in 3"
        :key="i"
        class="absolute bg-gray-900/[0.02] rounded-full"
        :style="{
          width: `${350 + i * 100}px`,
          height: `${350 + i * 100}px`,
          left: i === 1 ? '-5%' : i === 2 ? '105%' : '50%',
          top: i === 1 ? '-5%' : i === 2 ? '105%' : '65%',
          transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
          background:
            i === 1
              ? 'linear-gradient(135deg, rgba(0,0,0,0.02), rgba(0,0,0,0.01))'
              : i === 2
                ? 'linear-gradient(225deg, rgba(0,0,0,0.02), rgba(0,0,0,0.01))'
                : 'linear-gradient(45deg, rgba(0,0,0,0.02), rgba(0,0,0,0.01))',
        }"
      />
    </view>

    <view
      class="sticky bg-white/70 backdrop-blur-md w-screen z-5 top-0 left-0"
      :style="{
        paddingTop: Math.max(safeAreaInsets?.top, 28) + 'px',
      }"
    >
      <view class="flex items-center gap-3 py-2 px-3">
        <!-- 用户信息按钮 -->
        <view
          class="flex items-center p-2 gap-1.5 text-gray-600 backdrop-blur-sm transition-all w-fit bg-gray-100/80 rounded-full px-3"
          hoverClass="bg-gray-200/80 !scale-97 transform-origin-center"
          :hoverStartTime="0"
          :hoverStayTime="200"
          @tap="isUserInfoShow = true"
        >
          <text class="i-tabler-user text-sm" />
          <text class="text-xs whitespace-nowrap">用户</text>
        </view>

        <!-- 设置按钮 -->
        <view
          :class="[
            'flex items-center p-2 gap-1.5 text-gray-600 backdrop-blur-sm transition-all w-fit bg-gray-100/80 rounded-full px-3',
          ]"
          hoverClass="bg-gray-200/80 !scale-97 transform-origin-center"
          :hoverStartTime="0"
          :hoverStayTime="200"
          @tap="isSettingsShow = true"
        >
          <text class="i-tabler-settings text-sm" />
          <text class="text-xs whitespace-nowrap">设置</text>
        </view>

        <!-- 卡盒集市按钮 -->
        <view
          :class="[
            'flex items-center p-2 gap-1.5 text-gray-600 backdrop-blur-sm transition-all w-fit bg-gray-100/80 rounded-full px-3',
          ]"
          hoverClass="bg-gray-200/80 !scale-97 transform-origin-center"
          :hoverStartTime="0"
          :hoverStayTime="200"
          @tap="navigateToMarket"
        >
          <text class="i-tabler-cards text-sm" />
          <text class="text-xs whitespace-nowrap">卡盒集市</text>
        </view>
      </view>

      <!-- 今日学习统计 -->
      <view v-if="todayTotalCards > 0" class="px-3 pb-2">
        <view
          class="bg-gradient-to-br from-indigo-50/90 to-indigo-50/50 rounded-xl p-2 backdrop-blur-sm"
          :style="{
            boxShadow: '0 4px 12px -6px rgba(99,102,241,0.2)',
          }"
        >
          <view class="flex items-center justify-between">
            <view class="flex items-center gap-4">
              <view class="w-10 h-10 rounded-lg bg-indigo-100/80 flex items-center justify-center">
                <text class="i-tabler-cards text-xl text-indigo-500" />
              </view>
              <view class="flex flex-col gap-1">
                <text class="text-xs text-gray-500">今日待学习</text>
                <view class="flex items-baseline gap-1">
                  <text class="text-base font-semibold text-gray-800">
                    {{ todayStudyBoxCount }}
                  </text>
                  <text class="text-xs text-gray-500">个卡盒</text>
                  <text class="text-sm text-gray-500 mx-1">·</text>
                  <text class="text-base font-semibold text-gray-800">{{ todayTotalCards }}</text>
                  <text class="text-xs text-gray-500">张卡片</text>
                </view>
              </view>
            </view>
            <view
              class="px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              hoverClass="!scale-95 transform-origin-center transition-all"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="navigateToStudy"
            >
              <text class="text-sm text-indigo-500 font-medium">开始学习</text>
              <text class="i-tabler-arrow-right text-sm text-indigo-500" />
            </view>
          </view>
        </view>
      </view>
    </view>
    <view class="p-3 flex flex-col gap-4 relative">
      <view class="grid grid-cols-2 gap-3">
        <CardBox
          v-for="cardBox in cardDataStore.cardBoxList"
          :key="cardBox.id"
          :data="cardBox"
          :scrollTop="cardBoxStore.scrollTop"
          :cardBoxIndex="cardBox.index"
          @showActions="handleShowActions"
        />
      </view>
      <view
        class="flex items-center justify-center flex-col gap-6 h-60vh animate-fade-in animate-duration-200"
        v-if="cardDataStore.cardBoxList.length === 0"
      >
        <view class="relative">
          <view class="w-32 h-32 relative">
            <image src="/static/images/empty.svg" class="w-full h-full"></image>
            <!-- 添加装饰性动画元素 -->
            <view
              class="absolute -inset-4 bg-gradient-to-b from-transparent to-white/20 rounded-full animate-pulse"
            />
          </view>
          <!-- 添加悬浮的装饰元素 -->
          <view
            class="absolute -right-6 -top-6 w-12 h-12 rounded-full bg-indigo-50 animate-float opacity-80"
          />
          <view
            class="absolute -left-4 -bottom-4 w-8 h-8 rounded-full bg-amber-50 animate-float opacity-80"
            style="animation-delay: -1.2s"
          />
        </view>
        <view class="flex flex-col items-center gap-2">
          <text class="text-gray-700 font-medium text-lg">开始添加你的第一个卡盒</text>
          <text class="text-gray-400 text-sm">点击右下角 "+" 添加卡盒，开启记忆之旅</text>
        </view>
        <!-- 添加一个引导按钮 -->
        <view
          class="mt-4 px-6 py-2.5 bg-indigo-500 rounded-full flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 active:scale-95 transition-all"
          @tap="onAddBtnClick"
        >
          <text class="i-tabler-plus text-white" />
          <text class="text-white font-medium">添加卡盒</text>
        </view>
      </view>
      <!-- 添加底部占位容器 -->
      <view class="w-full" style="height: 180px" />
    </view>

    <view
      class="fixed bottom-8 flex w-90% z-4 mx-auto left-0 right-0 animate-fade-in-up animate-duration-400 animate-ease-out"
    >
      <view
        class="flex-1 bg-white/70 rounded-full shadow-lg flex items-center justify-between px-3.5 py-2.5"
        :style="{
          boxShadow: '0 8px 24px -6px rgba(0,0,0,0.12), 0 4px 8px -4px rgba(0,0,0,0.08)',
        }"
      >
        <view class="flex items-center gap-3">
          <view
            class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 transition-colors"
            :hoverClass="'bg-gray-100/80 scale-95'"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="openFolderModal()"
          >
            <text class="i-tabler-folder text-gray-600" />
            <text class="text-sm text-gray-600 max-w-[80px] truncate">
              {{ cardDataStore.folders?.[folderStore.currentFolderId]?.name || '全部' }}
            </text>
          </view>

          <view
            class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 transition-colors"
            :hoverClass="'bg-gray-100/80 scale-95'"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="isSearchShow = true"
          >
            <text class="i-tabler-search text-gray-600" />
            <text class="text-sm text-gray-600">搜索</text>
          </view>
        </view>

        <view
          class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 transition-colors"
          :hoverClass="'bg-indigo-500/15 scale-95'"
          :hoverStartTime="0"
          :hoverStayTime="200"
          @tap="onAddBtnClick"
        >
          <text class="i-tabler-plus text-indigo-500" />
          <text class="text-sm text-indigo-500 font-medium">添加</text>
        </view>
      </view>
    </view>

    <SearchModal :isShow="isSearchShow" @close="isSearchShow = false" />
    <SettingModal :isShow="isSettingsShow" @close="isSettingsShow = false" />
    <UserInfoModal :isShow="isUserInfoShow" @close="isUserInfoShow = false" />
    <FolderModal
      :isShow="isFolderModalShow"
      :cardBoxId="moveCardBoxId"
      @close="onFolderModalClose"
    />
    <AddCardBoxActionSheet v-model="isAddCardBoxShow" />

    <!-- 操作菜单 -->
    <CardBoxActionSheet
      v-model="isCardBoxActionSheetShow"
      :cardBoxId="currentCardBoxId"
      :cardBoxName="currentCardBoxName"
      @exportClick="isExportModalShow = true"
      @sortClick="onSortClick"
    />

    <ExportModal
      v-model="isExportModalShow"
      :cardBoxId="currentCardBoxId"
      :cardBoxIndex="currentCardBoxIndex"
    />

    <SortCardModal
      :type="sortType"
      :isShow="isSortModalShow"
      :cardBoxId="currentCardBoxId"
      @close="isSortModalShow = false"
      :cardBoxIndex="currentCardBoxIndex"
    />

    <StartStudyModal
      v-model="isStartStudyModalShow"
      :cardBoxId="firstStudyCardBoxId"
      @start="handleStartStudy"
    />
  </view>
</template>

<script lang="ts" setup>
import _ from 'lodash'

import AddCardBoxActionSheet from '@/components/AddCardBoxActionSheet.vue'
import CardBox from '@/components/CardBox.vue'
import CardBoxActionSheet from '@/components/CardBoxActionSheet.vue'
import ExportModal from '@/components/ExportModal.vue'
import FolderModal from '@/components/FolderModal.vue'
import SearchModal from '@/components/SearchModal.vue'
import SettingModal from '@/components/SettingModal.vue'
import SortCardModal from '@/components/SortCardModal.vue'
import StartStudyModal from '@/components/StartStudyModal.vue'
import UserInfoModal from '@/components/UserInfoModal.vue'
import { useCardBoxStore, useCardDataStore, useFolderStore } from '@/store'

defineOptions({
  name: 'Home',
})

const lockScroll = ref(false)
provide('lockScroll', {
  lockScroll,
  updateLockScroll: (newValue) => {
    lockScroll.value = newValue
  },
})

const cardDataStore = useCardDataStore()
const folderStore = useFolderStore()
const cardBoxStore = useCardBoxStore()
const { vibrate } = useVibrate()
const isSearchShow = ref(false)
const isSettingsShow = ref(false)
const isFolderModalShow = ref(false)
const isAddCardBoxShow = ref(false)
const moveCardBoxId = ref<string>('')

// 获取屏幕边界安全区域距离
const { safeAreaInsets } = uni.getWindowInfo()

const openFolderModal = (cardBoxId?: string) => {
  moveCardBoxId.value = cardBoxId || ''
  isFolderModalShow.value = true
}

const onFolderModalClose = () => {
  isFolderModalShow.value = false
  moveCardBoxId.value = ''
}

// 提供 folderModal 给子组件使用
provide('folderModal', {
  openFolderModal,
})

// 提供给其他页面的方法
provide('cardBoxActions', {
  showActions: (cardBoxId: string, cardBoxName: string) => {
    currentCardBoxId.value = cardBoxId
    currentCardBoxName.value = cardBoxName
    isCardBoxActionSheetShow.value = true
  },
})

const onAddBtnClick = () => {
  vibrate()
  isAddCardBoxShow.value = true
}

// 添加操作相关的状态
const isCardBoxActionSheetShow = ref(false)
const isExportModalShow = ref(false)
const isSortModalShow = ref(false)
const sortType = ref<'cardBox' | 'cardItem'>('cardItem')
const currentCardBoxId = ref('')
const currentCardBoxName = ref('')
const currentCardBoxIndex = computed(() =>
  cardDataStore.cardBoxList.findIndex((box) => box.id === currentCardBoxId.value),
)

const handleShowActions = (cardBoxId: string, cardBoxName: string) => {
  currentCardBoxId.value = cardBoxId
  currentCardBoxName.value = cardBoxName
  isCardBoxActionSheetShow.value = true
}

const onSortClick = (type?: 'cardBox' | 'cardItem') => {
  isSortModalShow.value = true
  sortType.value = type || 'cardItem'
}

// 使用 ref 存储学习统计数据
const todayTotalCards = ref(0)
const todayStudyBoxCount = ref(0)

// 简化计算逻辑
const calculateStudyCards = () => {
  let totalCards = 0
  let boxCount = 0

  // 只遍历正在学习的卡盒
  for (const cardBox of cardDataStore.cardBoxList) {
    if (!cardBox.studyState?.isStudying) continue

    // 使用 cardBoxStore 的缓存机制
    const todayCards = cardBoxStore.getTodayStudyCards(cardBox.id)
    const count = todayCards.reviewCards.length + todayCards.newCards.length

    if (count > 0) {
      totalCards += count
      boxCount++
    }
  }

  // 更新 ref 值
  todayTotalCards.value = totalCards
  todayStudyBoxCount.value = boxCount
}

// 优化跳转逻辑
const firstStudyCardBoxId = computed(() => {
  for (const cardBox of cardDataStore.cardBoxList) {
    if (!cardBox.studyState?.isStudying) continue
    const todayCards = cardBoxStore.getTodayStudyCards(cardBox.id)
    if (todayCards.reviewCards.length + todayCards.newCards.length > 0) {
      return cardBox.id
    }
  }
  return ''
})

// 在页面显示时更新数据
onShow(() => {
  calculateStudyCards()
})

// 监听当前文件夹的变化，更新学习统计
watch(
  () => folderStore.currentFolderId,
  () => {
    calculateStudyCards()
  },
)

const isUserInfoShow = ref(false)

// 添加相关状态和方法
const isStartStudyModalShow = ref(false)

const navigateToStudy = () => {
  vibrate()
  isStartStudyModalShow.value = true
}

const handleStartStudy = (mode: string) => {
  uni.navigateTo({
    url: `/pages/study/index?cardBoxId=${firstStudyCardBoxId.value}&mode=${mode}`,
  })
}

const navigateToMarket = () => {
  vibrate()
  uni.navigateTo({
    url: '/pages/market/index',
  })
}
</script>

<style>
.main-title-color {
  color: #d14328;
}
</style>
