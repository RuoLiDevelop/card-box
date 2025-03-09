`
<route lang="json5">
{
  style: {
    navigationBarTitleText: '卡盒集市',
  },
}
</route>

<template>
  <view class="bg-white min-h-screen">
    <view class="sticky top-0 z-10">
      <!-- 搜索栏 -->
      <view class="backdrop-blur-md px-3 py-2">
        <view class="flex items-center gap-2 px-3 py-2 bg-gray-100/80 rounded-full">
          <text class="i-tabler-search text-gray-400" />
          <input
            class="flex-1 text-sm bg-transparent text-gray-800"
            type="text"
            placeholder="搜索卡盒名称或描述"
            placeholder-class="text-gray-400"
            confirm-type="search"
            v-model="searchKeyword"
            @confirm="onSearch"
            @input="onSearchInput"
          />
          <text v-if="searchKeyword" class="i-tabler-x text-gray-400 p-1" @tap="clearSearch" />
        </view>
      </view>

      <!-- Tab栏 -->
      <view class="bg-white/95 backdrop-blur-md border-b border-gray-100/80">
        <scroll-view
          scroll-x
          class="whitespace-nowrap"
          :show-scrollbar="false"
          :enhanced="true"
          :bounces="true"
        >
          <view class="flex items-center h-10 px-2">
            <view
              v-for="tab in tabs"
              :key="tab._id"
              class="relative h-full flex items-center justify-center px-4 cursor-pointer"
              @tap="handleTabChange(tab.title)"
            >
              <text
                :class="[
                  'text-xs transition-colors duration-300',
                  currentTab === tab.title ? 'text-indigo-500 font-medium' : 'text-gray-500',
                ]"
              >
                {{ tab.title }}
              </text>
              <view
                v-if="currentTab === tab.title"
                class="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-500 transition-all duration-300 rounded-full"
              />
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 卡盒列表 -->
    <scroll-view
      scroll-y
      class="flex-1"
      :style="{ height: 'calc(100vh - 120px)' }"
      @scrolltolower="onScrollToLower"
    >
      <view class="p-4">
        <view class="flex flex-col gap-4">
          <MarketCardBox v-for="cardBox in marketCardBoxes" :key="cardBox.id" :data="cardBox" />
        </view>
        <!-- 加载状态 -->
        <view v-if="isLoading" class="py-4 flex items-center justify-center">
          <text class="text-xs text-gray-400">加载中...</text>
        </view>
        <view
          v-else-if="!hasMore && marketCardBoxes.length > 0"
          class="py-4 flex items-center justify-center"
        >
          <text class="text-xs text-gray-400">没有更多了</text>
        </view>
        <!-- 无搜索结果 -->
        <view
          v-if="!isLoading && marketCardBoxes.length === 0 && searchKeyword"
          class="py-12 flex flex-col items-center justify-center gap-2"
        >
          <text class="text-gray-400">未找到相关卡盒</text>
          <text class="text-xs text-gray-400">试试其他关键词</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import debounce from 'lodash/debounce'
import { ref, onMounted } from 'vue'

import MarketCardBox from '@/components/MarketCardBox.vue'

// 组件使用的卡盒数据类型
interface MarketCardBoxData {
  id: string
  title: string
  description: string
  labels: string[]
  cards: { length: number }
}

interface Classification {
  _id: string
  title: string
}

// Tab数据
const tabs = ref<Classification[]>([])
const currentTab = ref('')
const pageSize = 20
const currentPage = ref(1)
const isLoading = ref(false)
const hasMore = ref(true)

// 添加请求标识符
const currentRequestId = ref<string>('')

// 卡盒数据
const marketCardBoxes = ref<MarketCardBoxData[]>([])

// 搜索相关
const searchKeyword = ref('')

// 从云数据库获取分类数据
const fetchClassifications = async () => {
  try {
    const db = wx.cloud.database()
    const result = await db
      .collection('market-classification')
      .field({
        title: true,
      })
      .get()

    if (result.data && result.data.length > 0) {
      tabs.value = result.data.map((item) => ({
        _id: String(item._id),
        title: String(item.title || ''),
      }))
      // 设置默认选中第一个分类
      currentTab.value = tabs.value[0].title
      // 获取到分类后再获取卡盒数据
      await fetchMarketData(true)
    }
  } catch (error) {
    console.error('获取分类数据失败:', error)
  }
}

// 从云数据库获取卡盒数据
const fetchMarketData = async (isRefresh = false) => {
  if (!currentTab.value || isLoading.value || (!isRefresh && !hasMore.value)) return

  try {
    isLoading.value = true
    // 生成新的请求ID
    const requestId = Date.now().toString()
    currentRequestId.value = requestId

    const db = wx.cloud.database()
    const _ = db.command

    // 如果是刷新，重置页码和数据
    if (isRefresh) {
      currentPage.value = 1
      marketCardBoxes.value = []
      hasMore.value = true
    }

    // 构建查询条件
    const query: any = {
      classification: currentTab.value,
    }

    // 如果有搜索关键词，添加搜索条件
    if (searchKeyword.value) {
      query.$or = [
        {
          title: db.RegExp({
            regexp: searchKeyword.value,
            options: 'i',
          }),
        },
        {
          description: db.RegExp({
            regexp: searchKeyword.value,
            options: 'i',
          }),
        },
      ]
    }

    const result = await db
      .collection('market')
      .where(query)
      .field({
        _id: true,
        title: true,
        description: true,
        labels: true,
        cards: true,
      })
      .orderBy('createTime', 'desc')
      .skip((currentPage.value - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 检查是否是最新请求
    if (currentRequestId.value !== requestId) {
      return
    }

    if (result.data) {
      const mappedData = result.data.map((item) => ({
        id: String(item._id),
        title: String(item.title || ''),
        description: String(item.description || ''),
        labels: Array.isArray(item.labels) ? item.labels.map(String) : [],
        cards: { length: Number(item.cards?.length || 0) },
      }))

      if (isRefresh) {
        marketCardBoxes.value = mappedData
      } else {
        marketCardBoxes.value.push(...mappedData)
      }

      // 更新分页状态
      hasMore.value = result.data.length === pageSize
      if (hasMore.value) {
        currentPage.value++
      }
    }
  } catch (error) {
    console.error('获取市场数据失败:', error)
    uni.showToast({
      title: '获取数据失败',
      icon: 'error',
    })
  } finally {
    isLoading.value = false
  }
}

// 搜索输入事件（防抖）
const onSearchInput = debounce(function () {
  fetchMarketData(true)
}, 500)

// 搜索确认事件
const onSearch = () => {
  fetchMarketData(true)
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  fetchMarketData(true)
}

// Tab切换事件
const handleTabChange = (tab: string) => {
  if (currentTab.value === tab) return
  currentTab.value = tab
  uni.vibrateShort()
  fetchMarketData(true)
}

// 滚动到底部加载更多
const onScrollToLower = () => {
  if (!isLoading.value && hasMore.value) {
    fetchMarketData()
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchClassifications()
})
</script>

<style>
.whitespace-nowrap {
  white-space: nowrap;
}
</style>
