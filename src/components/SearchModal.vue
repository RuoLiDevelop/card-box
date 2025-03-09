<template>
  <wd-popup
    lockScroll
    customClass="rounded-t-3xl relative h-75vh"
    position="bottom"
    :safe-area-inset-bottom="true"
    :modelValue="isShow"
    @close="$emit('close')"
    @after-enter="focusInput"
    @after-leave="onAfterLeave"
  >
    <view class="flex flex-col h-full">
      <!-- 固定头部 -->
      <view class="flex-none">
        <!-- 标题栏 -->
        <view class="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <text class="text-base font-semibold">搜索卡片</text>
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

        <!-- 搜索框 -->
        <view class="px-3 py-2 bg-white flex items-center gap-2 border-b border-gray-100">
          <view
            class="flex items-center bg-gray-50/80 hover:bg-gray-100/80 rounded-lg h-9 px-3 gap-2 text-gray-500 flex-1 transition-colors relative"
          >
            <!-- 图标容器 -->
            <view class="w-5 h-5 flex items-center justify-center relative">
              <!-- 搜索图标 -->
              <text
                class="i-tabler-search text-base"
                :class="{ 'opacity-0': isSearching }"
                :style="{ position: isSearching ? 'absolute' : 'static' }"
              />

              <!-- 加载动画 -->
              <wd-loading v-if="isSearching" size="20px" color="#6366f1" class="absolute" />
            </view>

            <input
              ref="inputRef"
              class="text-sm w-full h-full"
              placeholder="请输入要查找内容"
              v-model="searchText"
              @input="onSearch"
            />
          </view>
        </view>

        <!-- 目录标签 -->
        <FolderTabs
          v-if="Object.keys(filteredCardBoxesMap).length && searchText"
          v-model="currentFolderId"
          :folders="filteredFolders"
          :show-count="true"
          :get-folder-count="(folderId) => filteredCardBoxesMap[folderId]?.cardBoxes.length || 0"
        />
      </view>

      <!-- 可滚动内容区域 -->
      <scroll-view scroll-y class="flex-1" @scroll="onScroll">
        <!-- 原有的搜索结果内容 -->
        <view class="px-3">
          <view
            v-for="cardBox in currentFilteredCards"
            :key="cardBox.id"
            class="mb-3 bg-gray-50/80 rounded-xl p-3 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.05)]"
          >
            <view class="font-medium text-gray-700 flex items-center gap-2 mb-3">
              <text class="i-tabler-cards" />
              <text>{{ cardBox.name }}</text>
            </view>

            <!-- 卡片列表 -->
            <view class="flex flex-col gap-3">
              <view
                v-for="{
                  frontContent,
                  backContent,
                  index,
                  id,
                  frontMatches,
                  backMatches,
                } in cardBox.cardItems"
                :key="id"
                class="rounded-xl text-dark bg-white overflow-hidden p-3 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]"
                hoverClass="!scale-99 transform-origin-center"
                :hoverStartTime="0"
                :hoverStayTime="200"
                @tap="onCardItemClick(cardBox.id, id, cardBox.index)"
              >
                <view class="text-xs mb-2 text-gray-400">第 {{ index + 1 }} 张卡片</view>
                <view>
                  <view class="mb-1.5 text-gray-400 text-xs">正面内容</view>
                  <view class="text-gray-700 text-sm leading-relaxed">
                    <HighLight :text="frontContent" :matches="frontMatches" />
                  </view>
                </view>
                <view>
                  <view class="mt-3 mb-1.5 text-gray-400 text-xs">反面内容</view>
                  <view class="text-gray-700 text-sm leading-relaxed">
                    <HighLight :text="backContent" :matches="backMatches" />
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 加载更多提示 -->
          <view
            v-if="currentFilteredCards.length > 0 && currentFilteredCards.length < totalCards"
            class="py-4 text-center text-sm text-gray-400"
          >
            上滑加载更多...
          </view>
          <view
            v-else-if="currentFilteredCards.length > 0 && currentFilteredCards.length >= totalCards"
            class="py-4 text-center text-sm text-gray-400"
          >
            没有更多了
          </view>
        </view>

        <!-- 搜索无结果占位图 -->
        <view
          class="flex items-center justify-center flex-col h-50vh animate-fade-in animate-duration-200"
          v-if="Object.keys(filteredCardBoxesMap).length === 0 && searchText.length"
        >
          <view class="relative w-32 h-32 mb-3">
            <image src="/static/images/empty.svg" class="w-full h-full opacity-80" />
            <view
              class="absolute inset-0 bg-gradient-to-b from-transparent to-white/30 rounded-full animate-pulse"
            />
          </view>
          <view class="flex flex-col items-center gap-1">
            <text class="text-gray-600 font-medium">未找到相关卡片</text>
            <text class="text-gray-400 text-sm">试试其他关键词吧</text>
          </view>
        </view>

        <!-- 未输入关键词占位图 -->
        <view
          class="flex items-center justify-center flex-col h-50vh animate-fade-in animate-duration-200"
          v-if="!filteredCards.length && !searchText.length"
        >
          <view class="relative w-32 h-32 mb-3">
            <image src="/static/images/search-empty.svg" class="w-full h-full opacity-80" />
            <view
              class="absolute -inset-2 bg-gradient-to-b from-transparent to-white/20 rounded-full animate-pulse"
            />
          </view>
          <view class="flex flex-col items-center gap-1">
            <text class="text-gray-600 font-medium">开始搜索</text>
            <text class="text-gray-400 text-sm">输入关键词，让我帮你找找看</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import _ from 'lodash'

import FolderTabs from '@/components/FolderTabs.vue'
import { useCardDataStore, useFolderStore } from '@/store'
import { CardBox, CardItem } from '@/types/card'

import HighLight from './HighLight.vue'

const props = defineProps<{
  isShow: boolean
}>()

const emit = defineEmits(['close'])
const { updateLockScroll } = inject<{
  updateLockScroll: (isLock: boolean) => void
}>('lockScroll')

const cardDataStore = useCardDataStore()
const folderStore = useFolderStore()

const searchText = ref('')
const filteredCards = ref<
  (Omit<CardBox, 'cardItems'> & {
    id: string
    cardItems: (CardItem & {
      id: string
      frontMatches?: { startIndex: number; endIndex: number }[]
      backMatches?: { startIndex: number; endIndex: number }[]
    })[]
  })[]
>([])

const inputRef = ref<HTMLInputElement>()

// 在 script 部分添加以下类型定义
type FilteredCardBoxWithFolder = {
  folderId: string
  folderName: string
  cardBoxes: (Omit<CardBox, 'cardItems'> & {
    id: string
    cardItems: (CardItem & {
      id: string
      frontMatches?: { startIndex: number; endIndex: number }[]
      backMatches?: { startIndex: number; endIndex: number }[]
    })[]
  })[]
}

// 添加新的响应式变量
const currentFolderId = ref<string>('')
const filteredCardBoxesMap = ref<Record<string, FilteredCardBoxWithFolder>>({})
const searchWorker = ref<UniApp.Worker | null>(null)

// 添加搜索状态
const isSearching = ref(false)

// 修改搜索函数
const debouncedSearch = _.debounce((text: string) => {
  // 空字符串直接清空结果
  if (!text) {
    filteredCardBoxesMap.value = {}
    filteredFolders.value = []
    currentFolderId.value = ''
    isSearching.value = false
    return
  }

  isSearching.value = true

  // 准备发送给 worker 的数据
  const workerData = {
    searchText: text,
    cardBoxes: Object.entries(cardDataStore.cardBoxes).reduce((acc, [id, cardBox]) => {
      acc[id] = {
        ...cardBox,
        folderName: cardDataStore.folders[cardBox.folderId]?.name,
      }
      return acc
    }, {}),
    folders: cardDataStore.folders,
  }

  searchWorker.value?.postMessage(workerData)
}, 300)

// 修改搜索函数
const onSearch = () => {
  debouncedSearch(searchText.value)
}

// 在组件销毁时终止 worker
onUnmounted(() => {
  searchWorker.value?.terminate()
})

// 修改 worker 的消息处理
onMounted(() => {
  searchWorker.value = uni.createWorker('workers/search.worker.js')
  searchWorker.value.onMessage((result) => {
    if (result.type === 'result') {
      const { filteredCardBoxesMap: resultMap, filteredFolders: folders } = result.data

      filteredCardBoxesMap.value = resultMap
      filteredFolders.value = folders

      // 重置分页状态
      currentPage.value = 0
      hasMore.value = true

      // 如果没有当前选中的目录或当前目录没有结果，选择第一个有结果的目录
      if (!currentFolderId.value || !resultMap[currentFolderId.value]?.cardBoxes.length) {
        const firstFolderId = folders[0]?.id
        currentFolderId.value = firstFolderId || ''
      }

      isSearching.value = false
    }
  })
})

const onCardItemClick = async (cardBoxId: string, cardItemId: string, cardBoxIndex: number) => {
  // 先关闭搜索弹窗
  emit('close')

  // 获取卡盒信息
  const cardBox = cardDataStore.cardBoxes[cardBoxId]
  if (!cardBox) return

  console.log(cardBox, currentFolderId.value)
  // 如果卡片在其他文件夹，先切换文件夹
  if (cardBox.folderId && cardBox.folderId !== folderStore.currentFolderId) {
    folderStore.updateCurrentFolderId(cardBox.folderId)
  }

  // 导航到卡片列表页面
  uni.navigateTo({
    url: `/pages/cardList/index?cardBoxId=${cardBoxId}&highlightCardId=${cardItemId}&cardBoxIndex=${cardBoxIndex}`,
    success: () => {
      setTimeout(() => {
        uni.$emit('scrollToCard', {
          cardId: cardItemId,
          highlight: true,
        })
      }, 500)
    },
  })
}

// 自动聚焦输入框
const focusInput = () => {
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 清空搜索内容时重置所有状态
const onAfterLeave = () => {
  searchText.value = ''
  filteredCardBoxesMap.value = {}
  currentFolderId.value = ''
  currentPage.value = 0
  hasMore.value = true
}

// 计算当前显示的搜索结果
const currentFilteredCards = computed(() => {
  if (!currentFolderId.value) return []

  const cards = filteredCardBoxesMap.value[currentFolderId.value]?.cardBoxes || []
  return cards.slice(0, (currentPage.value + 1) * pageSize)
})

// 修改过滤后的文件夹列表
const filteredFolders = ref<{ id: string; name: string }[]>([])

// 添加分页相关的状态
const pageSize = 10
const currentPage = ref(0)
const hasMore = ref(true)

// 添加加载更多的方法
const loadMore = () => {
  if (currentFilteredCards.value.length >= totalCards.value) return
  currentPage.value++
}

// 修改滚动处理函数
const onScroll = _.throttle((e: any) => {
  const { scrollTop, scrollHeight } = e.detail
  const clientHeight = e.target?.clientHeight || 0

  // 距离底部 50px 时加载更多
  if (
    scrollHeight - scrollTop - clientHeight < 50 &&
    currentFilteredCards.value.length < totalCards.value
  ) {
    loadMore()
  }
}, 16)

// 监听目录切换，重置分页状态
watch(currentFolderId, () => {
  currentPage.value = 0
  hasMore.value = true
})

watch(
  () => props.isShow,
  () => {
    updateLockScroll(props.isShow)
  },
)

// 添加计算总卡片数量的计算属性
const totalCards = computed(() => {
  if (!currentFolderId.value) return 0
  return filteredCardBoxesMap.value[currentFolderId.value]?.cardBoxes.length || 0
})
</script>

<style lang="scss" scoped>
input {
  background: transparent;
}
</style>
