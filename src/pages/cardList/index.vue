<route lang="json5">
{
  style: {
    navigationStyle: 'custom',
  },
  layout: false,
}
</route>

<template>
  <!-- 添加 page-meta -->
  <page-meta :pageStyle="lockScroll ? 'overflow:hidden' : ''"></page-meta>

  <view class="min-h-screen bg-[#f8f9fa] relative">
    <!-- 添加背景装饰元素 -->
    <view class="fixed inset-0 pointer-events-none overflow-hidden">
      <view
        v-for="i in 3"
        :key="i"
        class="absolute bg-black/[0.015] rounded-full"
        :style="{
          width: `${300 + i * 100}px`,
          height: `${300 + i * 100}px`,
          left: i === 1 ? '-10%' : i === 2 ? '110%' : '50%',
          top: i === 1 ? '-10%' : i === 2 ? '110%' : '50%',
          transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
        }"
      />
    </view>

    <!-- 自定义导航栏 - 使用 sticky 定位 -->
    <view
      class="sticky top-0 z-10 px-4 pt-16 pb-3 bg-white/90 backdrop-blur-sm"
      :style="{
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }"
    >
      <view class="flex items-center justify-between">
        <view class="flex-1">
          <view class="flex flex-col gap-1">
            <!-- 第一行：返回按钮和标题 -->
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
                <!-- 标题文本 -->
                <text
                  class="text-base font-semibold text-gray-800 overflow-hidden w-[60vw]"
                  style="text-overflow: ellipsis; white-space: nowrap"
                >
                  {{ cardBoxData?.name }}
                </text>

                <!-- 卡片数量 -->
                <view class="flex items-center gap-3">
                  <view class="flex items-center gap-1">
                    <text class="i-tabler-cards text-xs text-gray-500" />
                    <text class="text-xs text-gray-500">{{ cardItems.length }} 张卡片</text>
                  </view>

                  <!-- 修改学习计划入口样式,统一使用 indigo 色 -->
                  <view
                    class="flex items-center gap-1 rounded-lg"
                    @tap="handleStudyPlanClick"
                    hover-class="opacity-80"
                  >
                    <text
                      class="text-sm text-indigo-500"
                      :class="[
                        cardBoxData?.studyState?.isStudying
                          ? 'i-solar-chart-2-bold-duotone'
                          : 'i-solar-flag-2-bold-duotone',
                      ]"
                    />
                    <text class="text-xs text-indigo-500">
                      {{ cardBoxData?.studyState?.isStudying ? '查看学习计划' : '制定学习计划' }}
                    </text>

                    <view
                      v-if="cardBoxData?.studyState?.isStudying"
                      class="flex items-center gap-1.5 ml-1"
                    >
                      <view class="w-13 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <view
                          class="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          :style="{ width: `${studyProgress}%` }"
                        />
                      </view>
                      <text class="text-xs text-indigo-500">{{ studyProgress }}%</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 添加外层容器来控制整体内边距 -->
    <view class="p-2">
      <!-- 空状态占位图 -->
      <view v-if="cardItems.length === 0" class="flex flex-col items-center justify-center py-32">
        <text class="i-tabler-cards text-6xl text-gray-200 mb-4" />
        <text class="text-gray-400">暂无卡片</text>
      </view>

      <view
        v-else
        class="relative"
        :style="{
          height: `${totalHeight}px`,
        }"
      >
        <view
          v-for="item in visibleCards"
          :key="item.id"
          :id="`card-${item.id}`"
          :style="getCardStyle(item.index, item.id)"
          @tap.stop
        >
          <CardItem
            :front-content="formatCardContent(item.frontContent)"
            :back-content="formatCardContent(item.backContent)"
            :index="item.index"
            :layout="currentLayout"
            :is-flipped="flippedCardIds.includes(item.id)"
            :is-content-centered="isContentCentered"
            :is-large-font="isLargeFont"
            :show-number="cardBoxStore.getCardBoxShowNumber(cardBoxId)"
            :disable-hover="isFlipMode"
            :study-state="item.studyState"
            :show-study-state="cardBoxData?.studyState?.isStudying"
            @tap="onCardTap(item)"
            @longpress="onCardLongPress(item)"
          >
            <!-- 选中效果遮罩 -->
            <template v-if="isMultiSelectMode" #action>
              <view
                class="absolute inset-0 z-10 rounded-2xl transition-all duration-200"
                :class="[
                  cardItemStore.isCardItemSelected(cardBoxId, item.id)
                    ? 'bg-indigo-500/10 ring-2 ring-indigo-500'
                    : 'bg-transparent',
                ]"
              >
                <!-- 选中状态的 check 图标 -->
                <view
                  v-if="cardItemStore.isCardItemSelected(cardBoxId, item.id)"
                  class="absolute right-3 bottom-3 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shadow-sm animate-fade-in animate-duration-200"
                >
                  <text class="i-tabler-check text-white text-xs" />
                </view>
              </view>
            </template>

            <!-- 高亮动画效果 -->
            <template v-if="highlightCardId === item.id" #highlight>
              <view
                class="absolute inset-0 rounded-2xl animation-after-search"
                :style="{
                  zIndex: 1,
                }"
              />
            </template>
          </CardItem>
        </view>
      </view>
    </view>

    <!-- 底部占位容器 -->
    <view
      class="w-full"
      :style="{
        height: `${isMultiSelectMode ? 240 : 180}px`,
      }"
    />

    <!-- 多选操作栏 -->
    <wd-popup
      v-model="isMultiSelectMode"
      position="bottom"
      :modal="false"
      :safe-area-inset-bottom="true"
      custom-class="bg-white/90 backdrop-blur-sm"
      custom-style="box-shadow: 0 -1px 5px rgba(0,0,0,0.05);"
    >
      <!-- 标题栏 -->
      <view class="px-4 py-3 flex items-center justify-between">
        <text class="text-base font-semibold text-gray-800">批量操作</text>
        <view
          class="w-8 h-8 rounded-lg bg-gray-50/80 flex items-center justify-center"
          hoverClass="scale-95 origin-center"
          :hoverStartTime="0"
          :hoverStayTime="200"
          @tap="exitMultiSelectMode"
        >
          <text class="i-tabler-x text-base text-gray-500" />
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="p-4">
        <!-- 全选和已选择数量 -->
        <view class="flex items-center gap-2 mb-3">
          <view
            class="flex items-center gap-2 px-3 py-1.5 bg-gray-50/80 rounded-lg text-gray-600"
            hoverClass="scale-95 origin-center"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="handleSelectAll"
          >
            <text class="text-sm" :class="isAllSelected ? 'i-tabler-check' : 'i-tabler-minus'" />
            <text class="text-sm">{{ isAllSelected ? '取消选择' : '全选' }}</text>
          </view>
          <text class="text-sm text-gray-500">已选择 {{ selectedCount }} 张卡片</text>
        </view>

        <!-- 操作按钮网格 -->
        <view class="grid grid-cols-2 gap-6">
          <view
            v-if="selectedCount > 0"
            class="flex flex-col items-center gap-2"
            hoverClass="scale-95 origin-center"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="handleMoveCard"
          >
            <view class="w-full h-12 rounded-3 bg-gray-50 flex items-center justify-center">
              <text class="i-tabler-folder-plus text-xl text-gray-500" />
            </view>
            <text class="text-xs text-gray-700">移动</text>
          </view>
          <view
            v-if="selectedCount > 0"
            class="flex flex-col items-center gap-2"
            hoverClass="scale-95 origin-center"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="handleDeleteCard"
          >
            <view class="w-full h-12 rounded-3 bg-red-50 flex items-center justify-center">
              <text class="i-tabler-trash text-xl text-red-500" />
            </view>
            <text class="text-xs text-red-500">删除</text>
          </view>
        </view>
      </view>
    </wd-popup>

    <!-- 修改底部操作栏,添加 v-show 控制显示隐藏 -->
    <view
      v-show="!isMultiSelectMode"
      class="fixed bottom-8 w-[90vw] max-w-2xl z-4 mx-auto left-0 right-0"
    >
      <view
        class="flex-1 bg-white rounded-2xl shadow-lg flex items-center justify-between p-2 relative overflow-hidden"
        :style="{
          boxShadow: '0 8px 24px -6px rgba(0,0,0,0.12), 0 4px 8px -4px rgba(0,0,0,0.08)',
        }"
      >
        <scroll-view
          scroll-x
          :show-scrollbar="false"
          class="flex-1 relative mr-2"
          enhanced
          :bounces="false"
          @scroll="onScroll"
        >
          <view class="flex items-center gap-2.5 px-0.5 min-w-max whitespace-nowrap">
            <!-- 学习按钮 -->
            <view v-if="getStudyState">
              <view
                class="w-13 h-12 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all"
                :class="[getStudyState.status === 'active' ? 'bg-indigo-500/10' : '']"
                :hoverClass="
                  getStudyState.status === 'active'
                    ? 'bg-indigo-500/15 scale-95'
                    : 'bg-gray-50/80 scale-95 origin-center transition-all'
                "
                :hoverStartTime="0"
                :hoverStayTime="200"
                :disabled="getStudyState.status !== 'active'"
                @tap="getStudyState.status === 'active' && startLearning()"
              >
                <text
                  :class="[
                    getStudyState.status === 'active'
                      ? 'i-tabler-book text-[17px] text-indigo-500'
                      : 'i-tabler-clock text-[17px] text-gray-500',
                  ]"
                />
                <text
                  class="text-[10px] whitespace-nowrap leading-none"
                  :class="[getStudyState.status === 'active' ? 'text-indigo-500' : 'text-gray-500']"
                >
                  {{ getStudyState.message }}
                </text>
              </view>
            </view>

            <!-- 练习按钮 -->
            <view
              class="w-13 h-12 rounded-xl flex flex-col items-center justify-center gap-1.5"
              :hoverClass="'bg-gray-50/80 scale-95 origin-center transition-all'"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="startPractice"
            >
              <text class="i-tabler-mood-up text-[17px] text-gray-600" />
              <text class="text-[10px] text-gray-500 leading-none">练一练</text>
            </view>

            <!-- 翻面模式按钮 -->
            <view
              class="w-13 h-12 rounded-xl flex flex-col items-center justify-center gap-1.5"
              :class="[isFlipMode ? 'bg-indigo-500/10' : '']"
              :hoverClass="
                isFlipMode
                  ? 'bg-indigo-500/15 scale-95'
                  : 'bg-gray-50/80 scale-95 origin-center transition-all'
              "
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="toggleFlipMode"
            >
              <text
                class="i-tabler-cards text-[17px]"
                :class="[isFlipMode ? 'text-indigo-500' : 'text-gray-600']"
              />
              <text
                class="text-[10px] leading-none"
                :class="[isFlipMode ? 'text-indigo-500' : 'text-gray-500']"
              >
                翻面模式
              </text>
            </view>

            <!-- 添加卡片按钮 -->
            <view
              class="w-13 h-12 rounded-xl flex flex-col items-center justify-center gap-1.5"
              :hoverClass="'bg-gray-50/80 scale-95 origin-center transition-all'"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="onAddCard"
            >
              <text class="i-tabler-plus text-[17px] text-gray-600" />
              <text class="text-[10px] text-gray-500 leading-none">添加卡片</text>
            </view>

            <!-- 其他按钮... -->
          </view>
        </scroll-view>

        <!-- 添加渐变遮罩 -->
        <view
          class="absolute right-[3.5rem] top-0 bottom-0 w-10 pointer-events-none transition-opacity duration-200"
          :style="{
            opacity: showScrollShadow ? 1 : 0,
            background:
              'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 40%, rgba(255,255,255,1) 100%)',
          }"
        />

        <!-- 更多按钮 -->
        <view
          class="relative z-1 w-13 h-12 rounded-xl flex flex-col items-center justify-center gap-1"
          :style="{
            boxShadow: showScrollShadow
              ? '-8px 0 12px -4px rgba(255,255,255,1), 0 2px 8px -2px rgba(0,0,0,0.05)'
              : '0 2px 8px -2px rgba(0,0,0,0.05)',
          }"
          :hoverClass="'bg-gray-50/80 scale-95 origin-center transition-all'"
          :hoverStartTime="0"
          :hoverStayTime="200"
          @tap="isActionSheetShow = true"
        >
          <text class="i-tabler-dots text-[17px] text-gray-600" />
          <text class="text-[10px] text-gray-500 leading-none">更多</text>
        </view>
      </view>
    </view>

    <!-- 添加移动卡片窗 -->
    <MoveCardModal
      v-model="isMoveModalShow"
      :cardBoxId="cardBoxId"
      :selectedCardIds="selectedCardIds"
      @success="exitMultiSelectMode"
    />

    <!-- 操作菜单 -->
    <CardBoxActionSheet
      v-model="isActionSheetShow"
      :cardBoxId="cardBoxId"
      :cardBoxName="cardBoxData?.name"
      @exportClick="isExportModalShow = true"
      @sortClick="onSortClick"
      @deleteSuccess="back()"
    />

    <ExportModal v-model="isExportModalShow" :cardBoxId="cardBoxId" :cardBoxIndex="cardBoxIndex" />

    <SortCardModal
      :type="sortType"
      :isShow="isSortModalShow"
      :cardBoxId="cardBoxId"
      @close="isSortModalShow = false"
      :cardBoxIndex="cardBoxIndex"
    />

    <FolderModal
      :isShow="isFolderModalShow"
      :cardBoxId="moveCardBoxId"
      @close="onFolderModalClose"
    />

    <!-- 使用组件 -->
    <StudyPlanModal
      v-model="isStudyPlanModalShow"
      :cardBoxId="cardBoxId"
      :totalCards="cardItems.length"
      :isUpdating="cardBoxData?.studyState?.isStudying"
    />

    <DebugButton :cardBoxId="cardBoxId" />

    <!-- 添加开始学习弹窗状态 -->
    <StartStudyModal
      v-model="isStartStudyModalShow"
      :cardBoxId="cardBoxId"
      :is-practice-mode="isPracticeMode"
      @start="handleStartStudy"
    />

    <!-- 学习计划弹窗 -->
    <StudyPlanModal
      v-model="isStudyPlanModalShow"
      :cardBoxId="cardBoxId"
      :totalCards="cardItems.length"
      :isUpdating="cardBoxData?.studyState?.isStudying"
    />
  </view>
</template>

<script setup lang="ts">
import _ from 'lodash'

import CardBoxActionSheet from '@/components/CardBoxActionSheet.vue'
import CardItem from '@/components/CardItem.vue'
import DebugButton from '@/components/DebugButton.vue'
import ExportModal from '@/components/ExportModal.vue'
import FolderModal from '@/components/FolderModal.vue'
import MoveCardModal from '@/components/MoveCardModal.vue'
import SortCardModal from '@/components/SortCardModal.vue'
import StartStudyModal from '@/components/StartStudyModal.vue'
import StudyPlanModal from '@/components/StudyPlanModal.vue'
import { useCardBoxStore, useCardDataStore, useCardItemStore } from '@/store'
import { CardBoxList } from '@/types/card'

const cardBoxStore = useCardBoxStore()
const cardDataStore = useCardDataStore()
const cardItemStore = useCardItemStore()
const { vibrate } = useVibrate()
const isStudyPlanModalShow = ref(false)
// 获取路由参数
const cardBoxId = ref('')
const highlightCardId = ref('')

// 卡据
const cardBoxData = computed(() => {
  return cardDataStore.cardBoxes[cardBoxId.value]
})

// 卡片数据
const cardItems = computed(() => {
  if (!cardBoxData.value) return []
  return cardDataStore.cardBoxList[cardBoxIndex.value].cardItems
})

// 在 onLoad 中获取环境信息
onLoad((options) => {
  // 取小程序环信息
  cardBoxId.value = options.cardBoxId as string
  highlightCardId.value = options.highlightCardId as string

  // 等数据载完
  nextTick(() => {
    if (!cardBoxData.value) {
      uni.showToast({
        title: '卡盒不存在',
        icon: 'none',
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
      return
    }

    // 果有高亮片ID，等待面渲染完成滚动到应位置
    if (highlightCardId.value) {
      setTimeout(() => {
        uni.$emit('scrollToCard', {
          cardId: highlightCardId.value,
          highlight: true,
        })
      }, 300)
    }
  })

  // 监滚动到指定卡片的件
  uni.$on('scrollToCard', ({ cardId, highlight, flash }) => {
    const cardIndex = cardItems.value.findIndex((item) => item.id === cardId)
    if (cardIndex === -1) return

    // 滚动到指定位置
    scrollToIndex(cardIndex)

    // 如果需要高亮闪烁效果
    if (highlight || flash) {
      // 设置高亮卡片 ID
      highlightCardId.value = cardId
      // 动画结束后移除
      setTimeout(() => {
        highlightCardId.value = ''
      }, 2000) // 增加时间以确保画完成
    }
  })
})

onUnload(() => {
  uni.$off('scrollToCard')
})

// 布局相关
const currentLayout = computed(() => cardBoxStore.getCardBoxLayout(cardBoxId.value))

// 多选
const isMultiSelectMode = computed(() => cardItemStore.isMultiSelectMode(cardBoxId.value))
const selectedCardIds = computed(() => cardItemStore.getSelectedCardItems(cardBoxId.value))
const selectedCount = computed(() => selectedCardIds.value.length)
const isAllSelected = computed(() => selectedCount.value === cardItems.value.length)

// 操作相关
const isActionSheetShow = ref(false)
const isExportModalShow = ref(false)
const isSortModalShow = ref(false)
const sortType = ref<'cardBox' | 'cardItem'>('cardItem')
const isMoveModalShow = ref(false)

// 提供 lockScroll
const lockScroll = ref(false)
provide('lockScroll', {
  lockScroll,
  updateLockScroll: (newValue: boolean) => {
    lockScroll.value = newValue
  },
})

// 添加翻面相关的状态
const flippedCardIds = ref<string[]>([])

// 添加翻面模式状态
const isFlipMode = ref(false)

// 切换翻面模式
const toggleFlipMode = () => {
  vibrate()
  isFlipMode.value = !isFlipMode.value

  // 显示提示
  if (isFlipMode.value) {
    uni.showToast({
      title: '点击卡片即可翻面',
      icon: 'none',
      duration: 1000,
    })
  } else {
    // 退出翻面模式时清翻的卡片
    flippedCardIds.value = []
  }
}

// 修改卡片点击处理函数
const onCardTap = (item: CardBoxList[number]['cardItems'][number]) => {
  vibrate()

  if (isMultiSelectMode.value) {
    cardItemStore.toggleCardItemSelection(cardBoxId.value, item.id)
    return
  }

  if (isFlipMode.value) {
    // 直接修改数组
    if (flippedCardIds.value.includes(item.id)) {
      flippedCardIds.value = flippedCardIds.value.filter((id) => id !== item.id)
    } else {
      flippedCardIds.value = [...flippedCardIds.value, item.id]
    }
    return
  }

  // 正常模式下点击进入情
  uni.navigateTo({
    url: `/pages/bigCard/index?cardBoxId=${cardBoxId.value}&cardItemIndex=${item.index}&cardBoxIndex=${cardBoxIndex.value}`,
  })
}

// 修改长按处理函数回到原来的多选逻辑
const onCardLongPress = (item: CardBoxList[number]['cardItems'][number]) => {
  if (isFlipMode.value) return
  vibrate()
  cardItemStore.enterMultiSelectMode(cardBoxId.value, item.id)
}

// 操作
const handleSelectAll = () => {
  vibrate()
  if (isAllSelected.value) {
    cardItemStore.clearCardItemSelection(cardBoxId.value)
  } else {
    cardItemStore.selectAllCardItems(cardBoxId.value)
  }
}

const handleMoveCard = () => {
  vibrate()
  isMoveModalShow.value = true
}

const handleDeleteCard = () => {
  vibrate()
  uni.showModal({
    title: '确认删除',
    content: `确定删除中的 ${selectedCount.value} 张卡片吗？此操作不可撤销。`,
    confirmColor: '#ef4444',
    success: (res) => {
      if (res.confirm) {
        // 执行删除操作
        cardItemStore.deleteSelectedCardItems(
          cardBoxId.value,
          cardItemStore.getSelectedCardItems(cardBoxId.value),
        )
        cardItemStore.exitMultiSelectMode(cardBoxId.value)
      }
    },
  })
}

const exitMultiSelectMode = () => {
  cardItemStore.exitMultiSelectMode(cardBoxId.value)
}

const back = () => {
  uni.navigateBack()
}

// 监返按钮如果在面模下，先退出翻面模式
onBackPress(() => {
  if (isMultiSelectMode.value) {
    exitMultiSelectMode()
    return true
  }
  if (isFlipMode.value) {
    isFlipMode.value = false
    flippedCardIds.value = []
    return true
  }
  return false
})

// 添加卡片
const onAddCard = () => {
  vibrate()
  // 直接跳转到编辑页，入 isNew 数
  uni.navigateTo({
    url: `/pages/bigCard/edit?cardBoxId=${cardBoxId.value}&isNew=true`,
    success: () => {
      // 等待页面返回后，滚动到底部
      uni.$once('cardAdded', () => {
        // 计算总高度
        const cardHeight = getCardHeight(currentLayout.value)
        const columns = currentLayout.value === 'grid' ? 2 : 1
        const validCardCount = cardItems.value.filter((item) => item && item.id).length
        const totalScrollHeight = Math.ceil(validCardCount / columns) * cardHeight

        // 立即滚动到底部，不需要动画
        uni.pageScrollTo({
          scrollTop: totalScrollHeight,
          duration: 0,
        })
      })
    },
  })
}

// 更操作

const onSortClick = (type?: 'cardBox' | 'cardItem') => {
  isSortModalShow.value = true
  sortType.value = type || 'cardItem'
}

const cardBoxIndex = computed(() =>
  cardDataStore.cardBoxList.findIndex((box) => box.id === cardBoxId.value),
)

const isFolderModalShow = ref(false)
const moveCardBoxId = ref('')

const openFolderModal = (cardBoxId?: string) => {
  moveCardBoxId.value = cardBoxId || ''
  isFolderModalShow.value = true
}

provide('folderModal', {
  isFolderModalShow,
  openFolderModal,
})

const onFolderModalClose = () => {
  isFolderModalShow.value = false
  moveCardBoxId.value = ''
}

const isMultiSelectBarVisible = ref(false)
const isMultiSelectBarClosing = ref(false)

// 监听多选模式的变
watch(isMultiSelectMode, (newVal) => {
  if (newVal) {
    isMultiSelectBarVisible.value = true
    isMultiSelectBarClosing.value = false
  } else {
    isMultiSelectBarClosing.value = true
    setTimeout(() => {
      isMultiSelectBarVisible.value = false
      isMultiSelectBarClosing.value = false
    }, 300) // 动画时间
  }
})

// 内容对齐方
const isContentCentered = computed(() => cardBoxStore.getCardBoxContentAlign(cardBoxId.value))

// 字体大小
const isLargeFont = computed(() => cardBoxStore.getCardBoxFontSize(cardBoxId.value))

// 格式化卡片内容
const formatCardContent = (content: string) => {
  if (!content) return ''
  return content
}

// 滚动到指定卡片位置
const scrollToIndex = (index: number) => {
  const cardHeight = getCardHeight(currentLayout.value)
  const columns = currentLayout.value === 'grid' ? 2 : 1
  const row = Math.floor(index / columns)

  uni.pageScrollTo({
    scrollTop: row * cardHeight,
    duration: 300,
  })
}

// 动相关
const showScrollShadow = ref(false)

// 检查是否需要显示阴影
const checkScrollShadow = () => {
  const query = uni.createSelectorQuery()
  query
    .select('.min-w-max')
    .boundingClientRect((rect) => {
      if (rect) {
        const contentWidth = rect.width - windowWidth + 76 // 76px 是更多按钮的宽度和间距
        showScrollShadow.value = contentWidth > 0
      }
    })
    .exec()
}

// 监听滚动事件
const onScroll = _.debounce((e: any) => {
  const { scrollLeft, scrollWidth } = e.detail
  const contentWidth = scrollWidth - windowWidth + 76
  showScrollShadow.value = contentWidth > 0 && scrollLeft < contentWidth
}, 100)

// 监听可能影响内容宽度的数据变化
watch(
  [cardItems],
  () => {
    nextTick(() => {
      checkScrollShadow()
    })
  },
  { immediate: true },
)

// 添加开始学习弹窗状态
const isStartStudyModalShow = ref(false)
const isPracticeMode = ref(false)

// 修改开始学习函数
const startLearning = () => {
  if (!cardItems.value.length) {
    uni.showToast({
      title: '当前卡盒暂无卡片',
      icon: 'none',
    })
    return
  }
  vibrate()
  isStartStudyModalShow.value = true
  isPracticeMode.value = false
}

// 添加开始练习函数
const startPractice = () => {
  if (!cardItems.value.length) {
    uni.showToast({
      title: '当前卡盒暂无卡片',
      icon: 'none',
    })
    return
  }
  vibrate()
  isStartStudyModalShow.value = true
  isPracticeMode.value = true
}

// 处理开始学习
const handleStartStudy = (mode: 'recall' | 'quiz', practice?: { order: 'sequence' | 'random' }) => {
  // 跳转到学习页面
  let url = `/pages/study/index?cardBoxId=${cardBoxId.value}&mode=${mode}`

  if (practice) {
    url += `&practice=true&order=${practice.order}`
  }

  uni.navigateTo({ url })
}

// 获取学习状态
const getStudyState = computed(() => cardBoxStore.getStudyState(cardBoxId.value))

// 算学习进度
const studyProgress = computed(() => cardBoxStore.getStudyProgress(cardBoxId.value))

// 计算每个卡片的高度
const getCardHeight = (layout: 'list' | 'grid') => {
  const baseHeight = layout === 'list' ? 100 : 170
  return baseHeight // 只返回基础高度
}

// 计算可视区域能显示的卡片数量
const visibleCount = computed(() => {
  const cardHeight = getCardHeight(currentLayout.value)
  // 增加预加载的数量,提前3屏的内容来保证滚动流畅
  return Math.ceil(windowHeight / cardHeight) * 2
})

// 计算总的滚动高度
const totalHeight = computed(() => {
  const cardHeight = getCardHeight(currentLayout.value)
  const columns = currentLayout.value === 'grid' ? 2 : 1
  // 使用过滤后的有效卡片数量
  const validCardCount = cardItems.value.filter((item) => item && item.id).length
  return Math.ceil(validCardCount / columns) * cardHeight
})

// 计算当前需要染的卡片范围
const visibleRange = computed(() => {
  const cardHeight = getCardHeight(currentLayout.value)
  const columns = currentLayout.value === 'grid' ? 2 : 1

  // 根据滚动位置计算起始索引
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop.value / cardHeight) * columns - visibleCount.value,
  )
  const endIndex = Math.min(
    cardItems.value.length,
    Math.ceil((scrollTop.value + windowHeight) / cardHeight) * columns + visibleCount.value,
  )

  return {
    start: startIndex,
    end: endIndex,
  }
})

// 计算可见卡片
const visibleCards = computed(() => {
  const { start, end } = visibleRange.value

  // 使用 slice 获取可见范围内的卡片
  return cardItems.value
    .slice(Math.max(0, start), Math.min(end, cardItems.value.length))
    .filter((item) => item && item.id)
    .map((item) => ({
      ...item,
      style: getCardStyle(item.index, item.id),
    }))
})

// 计算每个卡片的定位样式
const getCardStyle = (index: number, id: string) => {
  const cardHeight = getCardHeight(currentLayout.value)
  const columns = currentLayout.value === 'grid' ? 2 : 1
  const row = Math.floor(index / columns)
  const column = index % columns
  const scale = 0.95 // 卡片缩放比例，用来创造间距效果

  // 添加一个随机key来强制更新样式
  const updateKey = index + '_' + id

  return {
    position: 'absolute',
    left: '0',
    top: '0',
    width: currentLayout.value === 'grid' ? '50%' : '100%',
    transition: 'all 0.2s ease-in-out',
    transform:
      currentLayout.value === 'grid'
        ? `translate(${column * 100}%, ${row * cardHeight}px) scale(${scale})`
        : `translateY(${row * cardHeight}px) scale(${scale})`,
    transformOrigin: 'center center',
    key: updateKey, // 添加key属性来触发更新
  }
}

// 监听页面动
const scrollTop = ref(0)
const { windowHeight, windowWidth } = uni.getWindowInfo()

onPageScroll(({ scrollTop: top }) => {
  scrollTop.value = top
})

// 添加处理学习计划点击的函数
const handleStudyPlanClick = () => {
  // 只在制定学习计划时检查卡片数量
  if (!cardBoxData.value?.studyState?.isStudying && !cardItems.value.length) {
    uni.showToast({
      title: '当前卡盒暂无卡片',
      icon: 'none',
    })
    return
  }
  isStudyPlanModalShow.value = true
}
</script>

<style scoped>
.animation-after-search {
  animation: vague 1s ease-in-out;
  animation-iteration-count: 2;
}

@keyframes vague {
  0%,
  100% {
    border: 2px solid transparent;
    box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.05);
  }
  50% {
    border: 2px solid #6366f1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
  }
}

::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
  color: transparent;
}
</style>
