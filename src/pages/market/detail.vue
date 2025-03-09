<route lang="json5">
{
  style: {
    navigationStyle: 'custom',
  },
  layout: false,
}
</route>

<template>
  <page-meta :pageStyle="lockScroll ? 'overflow:hidden' : ''"></page-meta>
  <view class="min-h-screen bg-[#f8f9fa] relative">
    <!-- 背景装饰 -->
    <view class="fixed inset-0 pointer-events-none overflow-hidden">
      <view
        v-for="i in 3"
        :key="i"
        class="absolute bg-black/[0.015] rounded-full"
        :style="{
          width: 300 + i * 100 + 'px',
          height: 300 + i * 100 + 'px',
          left: i === 1 ? '-10%' : i === 2 ? '110%' : '50%',
          top: i === 1 ? '-10%' : i === 2 ? '110%' : '50%',
          transform: 'translate(-50%, -50%) rotate(' + i * 45 + 'deg)',
        }"
      />
    </view>

    <!-- 自定义导航栏 -->
    <view
      class="sticky top-0 z-10 px-4 pt-16 pb-3 bg-white/90 backdrop-blur-sm"
      :style="{
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }"
    >
      <view class="flex items-center justify-between">
        <view class="flex-1">
          <view class="flex flex-col gap-1">
            <!-- 返回按钮和标题 -->
            <view class="flex items-center gap-3">
              <view
                class="w-8 h-8 rounded-lg bg-gray-50/80 flex items-center justify-center"
                @tap="back"
                :hoverClass="'bg-gray-100/80 scale-95'"
                :hoverStartTime="0"
                :hoverStayTime="200"
              >
                <text class="i-tabler-chevron-left text-lg text-gray-500" />
              </view>

              <view class="flex flex-col gap-1">
                <text
                  class="text-base font-semibold text-gray-800 overflow-hidden w-[60vw]"
                  style="text-overflow: ellipsis; white-space: nowrap"
                >
                  {{ cardBoxData?.title }}
                </text>

                <view class="flex items-center gap-3">
                  <view class="flex items-center gap-1">
                    <text class="i-tabler-cards text-xs text-gray-500" />
                    <text class="text-xs text-gray-500">
                      {{ cardBoxData?.cards?.length || 0 }} 张卡片
                    </text>
                  </view>

                  <!-- 添加全部翻面按钮 -->
                  <view
                    class="flex items-center gap-1 rounded-lg"
                    @tap="toggleAllCards"
                    hover-class="opacity-80"
                  >
                    <text
                      class="text-sm text-indigo-500"
                      :class="[isAllFlipped ? 'i-tabler-cards-filled' : 'i-tabler-cards']"
                    />
                    <text class="text-xs text-indigo-500">
                      {{ isAllFlipped ? '全部合上' : '全部翻开' }}
                    </text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 修改卡片列表部分，去掉外层 scroll-view -->
    <view class="flex-1 p-2 pb-20">
      <view
        class="relative"
        :style="{
          height: totalHeight + 'px',
        }"
      >
        <template v-for="item in visibleCards" :key="item.index">
          <view
            :id="'card-' + item.index"
            :style="getCardStyle(item.index)"
            @tap.stop
            v-if="forceUpdateKey"
          >
            <CardItem
              :front-content="item.frontContent"
              :back-content="item.backContent"
              :index="item.index"
              :layout="'grid'"
              :is-flipped="flippedCardIds.includes(item.index)"
              :is-content-centered="cardBoxData?.isContentCentered"
              :is-large-font="cardBoxData?.isLargeFont"
              @tap="onCardTap(item.index)"
            />
          </view>
        </template>
      </view>
    </view>

    <!-- 修改导入按钮样式 -->
    <view
      class="fixed bottom-8 right-8 h-8 px-4 rounded-full bg-indigo-500 shadow-lg flex items-center gap-1"
      :style="{
        boxShadow: '0 8px 24px -6px rgba(99,102,241,0.16), 0 4px 8px -4px rgba(99,102,241,0.12)',
      }"
      @tap="openImportModal"
      :hover-start-time="0"
      :hover-stay-time="200"
    >
      <text class="i-tabler-download text-white" />
      <text class="text-sm text-white">导入到目录</text>
    </view>

    <!-- 修改文件夹选择弹窗 -->
    <FolderModal
      :isShow="isFolderModalShow"
      mode="import"
      @close="onFolderModalClose"
      @select="onFolderSelect"
    />
  </view>
</template>

<script setup lang="ts">
import CardItem from '@/components/CardItem.vue'
import FolderModal from '@/components/FolderModal.vue'
import { useCardBoxStore } from '@/store'
import { MarketCardBox } from '@/types/card'

// 获取路由参数
const cardBoxId = ref('')

// 卡盒数据
const cardBoxData = ref<MarketCardBox | null>(null)

// 翻面状态
const flippedCardIds = ref<number[]>([])

// 文件夹选择弹窗状态
const isFolderModalShow = ref(false)

// 获取 cardBoxStore
const cardBoxStore = useCardBoxStore()

// 添加 lockScroll 状态
const lockScroll = ref(false)

// 提供 lockScroll
provide('lockScroll', {
  lockScroll,
  updateLockScroll: (newValue: boolean) => {
    lockScroll.value = newValue
  },
})

// 获取卡盒数据
const fetchCardBoxData = async () => {
  try {
    const db = wx.cloud.database()
    const result = await db
      .collection('market')
      .doc(cardBoxId.value)
      .field({
        title: true,
        description: true,
        cards: true,
        isContentCentered: true,
        isLargeFont: true,
      })
      .get()

    if (result.data) {
      cardBoxData.value = result.data as MarketCardBox
    }
  } catch (error) {
    console.error('获取卡盒数据失败:', error)
    uni.showToast({
      title: '获取数据失败',
      icon: 'error',
    })
  }
}

// 打开导入弹窗
const openImportModal = () => {
  uni.vibrateShort()
  isFolderModalShow.value = true
}

// 关闭导入弹窗
const onFolderModalClose = () => {
  isFolderModalShow.value = false
}

// 修改处理文件夹选择的逻辑
const onFolderSelect = (folderId: string) => {
  if (!cardBoxData.value?.cards?.length) {
    uni.showToast({
      title: '卡片数据为空',
      icon: 'error',
    })
    return
  }

  try {
    // 导入卡盒到选中的文件夹
    const cardItems = cardBoxData.value.cards.map((card, index) => ({
      frontContent: card.frontContent,
      backContent: card.backContent,
      backNote: card.backNote || '',
      index,
    }))

    cardBoxStore.importCardBox({
      name: cardBoxData.value.title,
      cards: cardItems,
      folderId,
      isContentCentered: cardBoxData.value.isContentCentered,
      isLargeFont: cardBoxData.value.isLargeFont,
    })

    // 显示成功提示
    uni.showToast({
      title: '导入成功',
      icon: 'success',
    })

    // 关闭弹窗
    isFolderModalShow.value = false
  } catch (error) {
    console.error('导入失败:', error)
    uni.showToast({
      title: '导入失败',
      icon: 'error',
    })
  }
}

// 卡片点击事件
const onCardTap = (index: number) => {
  uni.vibrateShort()
  if (flippedCardIds.value.includes(index)) {
    flippedCardIds.value = flippedCardIds.value.filter((id) => id !== index)
  } else {
    flippedCardIds.value = [...flippedCardIds.value, index]
  }
}

// 返回上一页
const back = () => {
  uni.navigateBack()
}

// 虚拟滚动相关
const scrollTop = ref(0)
const { windowHeight, windowWidth } = uni.getWindowInfo()
const forceUpdateKey = ref(true)

// 计算每个卡片的高度
const getCardHeight = () => 170 // 网格布局固定高度

// 计算可视区域能显示的卡片数量
const visibleCount = computed(() => {
  const cardHeight = getCardHeight()
  // 多渲染一屏的内容，保证滚动流畅
  return Math.ceil(windowHeight / cardHeight) * 4
})

// 计算总的滚动高度
const totalHeight = computed(() => {
  const cardHeight = getCardHeight()
  const columns = 2 // 网格布局固定两列
  const validCardCount = cardBoxData.value?.cards?.length || 0
  return Math.ceil(validCardCount / columns) * cardHeight
})

// 计算当前需要渲染的卡片范围
const visibleRange = computed(() => {
  const cardHeight = getCardHeight()
  const columns = 2

  // 根据滚动位置计算起始索引
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop.value / cardHeight) * columns - visibleCount.value,
  )
  const endIndex = Math.min(
    cardBoxData.value?.cards?.length || 0,
    Math.ceil((scrollTop.value + windowHeight) / cardHeight) * columns + visibleCount.value,
  )

  return {
    start: startIndex,
    end: endIndex,
  }
})

// 计算可见卡片
const visibleCards = computed(() => {
  if (!cardBoxData.value?.cards) return []

  return cardBoxData.value.cards
    .slice(visibleRange.value.start, visibleRange.value.end)
    .map((card: any, i: number) => ({
      ...card,
      index: visibleRange.value.start + i,
    }))
    .filter(Boolean)
})

// 计算每个卡片的定位样式
const getCardStyle = (index: number) => {
  const cardHeight = getCardHeight()
  const columns = 2
  const row = Math.floor(index / columns)
  const column = index % columns

  const scale = 0.95 // 卡片缩放比例，用来创造间距效果

  return {
    position: 'absolute',
    top: row * cardHeight + 'px',
    left: column * 50 + '%',
    width: '50%',
    transform: 'scale(' + scale + ')',
    transformOrigin: 'center center',
  }
}

// 修改滚动事件监听
onPageScroll(({ scrollTop: top }) => {
  scrollTop.value = top
})

onLoad((options) => {
  cardBoxId.value = options.id as string
  fetchCardBoxData()
})

// 添加全部翻面相关的计算属性和方法
const isAllFlipped = computed(() => {
  if (!cardBoxData.value?.cards) return false
  return flippedCardIds.value.length === cardBoxData.value.cards.length
})

// 全部翻面/合上的处理函数
const toggleAllCards = () => {
  uni.vibrateShort()
  if (isAllFlipped.value) {
    flippedCardIds.value = []
  } else {
    flippedCardIds.value = cardBoxData.value.cards.map((_, index) => index)
  }
}
</script>

<style>
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
  color: transparent;
}
</style>
