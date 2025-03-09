<route lang="json5">
{
  style: {
    navigationBarTitleText: '关联卡片',
  },
}
</route>

<template>
  <view class="h-screen bg-white overflow-hidden">
    <!-- 固定头部区域 -->
    <view
      class="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-100 h-48px flex items-center px-3"
    >
      <!-- 使用 scroll-view 包裹文件夹标签 -->
      <scroll-view scroll-x :show-scrollbar="false" class="w-full" enhanced :bounces="false">
        <view class="flex items-center gap-2 py-2">
          <FolderTabs
            v-if="Object.keys(filteredCardBoxesMap).length"
            v-model="currentFolderId"
            :folders="filteredFolders"
            :show-count="true"
            :get-folder-count="(folderId) => filteredCardBoxesMap[folderId]?.cardBoxes.length || 0"
            @update:modelValue="onFolderChange"
          />
        </view>
      </scroll-view>
    </view>

    <!-- 可滚动内容区域 -->
    <scroll-view
      scroll-y
      :style="{
        height: 'calc(100vh - 48px)',
        paddingTop: '48px',
        paddingBottom: selectedCards.length ? '100px' : '20px',
      }"
      :refresher-threshold="300"
      @scrolltolower="debouncedLoadMore"
    >
      <view class="p-4">
        <!-- 空状态 -->
        <view
          v-if="!Object.keys(filteredCardBoxesMap).length"
          class="p-4 flex flex-col items-center justify-center min-h-[50vh] gap-4"
        >
          <image
            src="/static/images/empty.svg"
            style="width: 140px; height: 140px"
            class="opacity-80"
          />
          <text class="text-gray-400 text-sm">暂无可关联的卡片</text>
        </view>

        <!-- 卡盒列表 -->
        <view v-else class="space-y-3">
          <view
            v-for="cardBox in currentFilteredCardBoxes"
            :key="cardBox.id"
            class="bg-gray-50/80 rounded-xl overflow-hidden"
          >
            <!-- 卡盒标题栏 -->
            <view
              class="flex items-center justify-between p-3 cursor-pointer transition-all duration-200"
              hover-class="bg-gray-50 scale-97 origin-center"
              :hover-start-time="0"
              :hover-stay-time="200"
              @tap="toggleCardBox(cardBox.id)"
            >
              <view class="flex items-center gap-2 flex-1 min-w-0">
                <text class="i-tabler-cards text-gray-400 flex-none" />
                <text class="text-sm text-gray-700 font-medium truncate">{{ cardBox.name }}</text>
                <text class="text-xs text-gray-400 flex-none">({{ cardBox.cards.length }})</text>
              </view>
              <view class="flex items-center gap-3 flex-none ml-2">
                <!-- 添加按钮 -->
                <view
                  class="w-7 h-7 rounded-lg bg-gray-50/80 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  @tap.stop="onAddCardToBox(cardBox.id)"
                >
                  <text class="i-tabler-plus text-gray-400" />
                </view>
                <!-- 折叠图标 -->
                <text
                  class="text-gray-400 transition-transform"
                  :class="[
                    expandedCardBoxId === cardBox.id
                      ? 'i-tabler-chevron-up'
                      : 'i-tabler-chevron-down',
                  ]"
                />
              </view>
            </view>

            <!-- 卡片列表容器，添加过渡效果 -->
            <view
              v-show="expandedCardBoxId === cardBox.id"
              class="overflow-hidden transition-all duration-300"
              :style="{
                height: expandedCardBoxId === cardBox.id ? 'auto' : '0px',
                opacity: expandedCardBoxId === cardBox.id ? 1 : 0,
              }"
            >
              <scroll-view
                scroll-y
                class="max-h-[60vh]"
                :refresher-threshold="100"
                @scrolltolower="() => handleCardBoxScroll(cardBox.id)"
              >
                <view
                  class="border-t border-gray-100 divide-y divide-gray-100"
                  :class="[
                    currentLayout === 'list' ? 'space-y-2 p-3' : 'grid grid-cols-2 gap-2 p-3',
                  ]"
                >
                  <template v-if="cardBox.cards.length">
                    <view
                      v-for="card in visibleCards(cardBox.id)"
                      :key="card.id"
                      class="relative"
                      @tap="
                        !isCardRelated(card) && !isCurrentCard(card) && toggleCardSelection(card)
                      "
                    >
                      <!-- 选中效果遮罩 -->
                      <view
                        class="absolute inset-0 z-10 rounded-2xl transition-all duration-200"
                        :class="[
                          isCardSelected(card)
                            ? 'bg-indigo-500/10 ring-2 ring-indigo-500'
                            : 'bg-transparent',
                        ]"
                      />
                      <CardItem v-bind="getCardProps(card)">
                        <template #action>
                          <!-- 已关联标记 -->
                          <view
                            v-if="isCardRelated(card)"
                            class="absolute top-2 right-2 px-2 py-0.5 rounded bg-gray-100 backdrop-blur-sm z-20"
                          >
                            <text class="text-xs text-gray-600">已关联</text>
                          </view>
                          <!-- 当前卡片标记 -->
                          <view
                            v-if="!isCardRelated(card) && isCurrentCard(card)"
                            class="absolute top-2 right-2 px-2 py-0.5 rounded bg-gray-100 backdrop-blur-sm z-20"
                          >
                            <text class="text-xs text-gray-600">当前卡片</text>
                          </view>
                          <!-- 选中标记 -->
                          <view
                            v-if="
                              !isCardRelated(card) && !isCurrentCard(card) && isCardSelected(card)
                            "
                            class="absolute right-3 bottom-3 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shadow-sm animate-fade-in animate-duration-200 z-20"
                          >
                            <text class="i-tabler-check text-white text-xs" />
                          </view>
                        </template>
                      </CardItem>
                    </view>
                  </template>

                  <!-- 加载提示 -->
                  <view
                    v-if="isCardBoxLoading(cardBox.id)"
                    class="col-span-full py-4 flex justify-center"
                  >
                    <text class="text-sm text-gray-400">加载中...</text>
                  </view>
                </view>
              </scroll-view>
            </view>
          </view>
        </view>
      </view>
      <!-- 添加底部占位容器 -->
      <view class="h-[100px]" />
    </scroll-view>

    <!-- 底部操作栏 -->
    <view
      v-if="selectedCards.length"
      class="fixed left-0 right-0 bottom-0 bg-white px-4 py-3"
      :style="{
        paddingBottom: `calc(${safeAreaInsets?.bottom || 0}px + 12px)`,
      }"
    >
      <view class="bg-white rounded-xl shadow-lg p-3 flex items-center justify-between">
        <text class="text-sm text-gray-600">已选择 {{ selectedCards.length }} 张卡片</text>
        <view
          class="px-4 py-1.5 bg-indigo-500 rounded-lg hover:bg-indigo-600 active:scale-95 transition-all"
          @tap="handleConfirm"
        >
          <text class="text-sm text-white">确认关联</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import _ from 'lodash'

import CardItem from '@/components/CardItem.vue'
import FolderTabs from '@/components/FolderTabs.vue'
import { useCardBoxStore, useCardDataStore } from '@/store'

const { vibrate } = useVibrate()
const cardBoxStore = useCardBoxStore()
const cardDataStore = useCardDataStore()

// 获取路由参数
const currentCardBoxId = ref('')
const currentCardItemId = ref('')

onLoad((query: Record<string, string>) => {
  console.log('Relate page onLoad:', query)
  // 确保参数存在且不为空
  if (!query.cardBoxId || !query.cardItemId) {
    console.error('Missing required parameters:', query)
    uni.showToast({
      title: '参数错误',
      icon: 'none',
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    return
  }

  // 检查卡片是否存在
  const sourceCard = cardDataStore.cardBoxes[query.cardBoxId]?.cardItems?.[query.cardItemId]
  if (!sourceCard) {
    console.error('Source card not found:', query)
    uni.showToast({
      title: '卡片不存在',
      icon: 'none',
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    return
  }

  // 设置参数
  currentCardBoxId.value = query.cardBoxId
  currentCardItemId.value = query.cardItemId
})

// 修改文件夹相关逻辑
const currentFolderId = ref('')

// 按文件夹组织卡盒数据
const filteredCardBoxesMap = computed(() => {
  const resultMap: Record<string, { folderId: string; folderName: string; cardBoxes: any[] }> = {}

  // 先创建一个 Map 来存储每个文件夹的卡盒
  const folderBoxes = new Map<string, any[]>()

  // 使用 cardBoxList 直接获取已排序的卡盒
  Object.entries(cardDataStore.cardBoxes).forEach(([cardBoxId, cardBox]) => {
    if (cardBoxId === currentCardBoxId.value) return

    const folderId = cardBox.folderId || 'default'
    if (!folderBoxes.has(folderId)) {
      folderBoxes.set(folderId, [])
    }

    // 将卡盒添加到对应文件夹
    folderBoxes.get(folderId)?.push({
      id: cardBoxId,
      name: cardBox.name,
      cards: Object.entries(cardBox.cardItems).map(([cardId, card]) => ({
        id: cardId,
        cardBoxId,
        frontContent: card.frontContent,
        backContent: card.backContent,
        index: card.index,
      })),
    })
  })

  // 遍历所有文件夹，包括默认文件夹
  if (folderBoxes.has('default')) {
    resultMap.default = {
      folderId: 'default',
      folderName: '默认目录',
      cardBoxes: folderBoxes.get('default') || [],
    }
  }

  // 添加其他文件夹
  Object.entries(cardDataStore.folders).forEach(([folderId, folder]) => {
    if (folderId !== 'default' && folderBoxes.has(folderId)) {
      resultMap[folderId] = {
        folderId,
        folderName: folder.name,
        cardBoxes: folderBoxes.get(folderId) || [],
      }
    }
  })

  return resultMap
})

// 可用文件夹列表
const filteredFolders = computed(() => {
  // 显示所有文件夹
  const folders = [
    { id: 'default', name: '默认目录' },
    ...cardDataStore.folderList.map((folder) => ({
      id: folder.id,
      name: folder.name,
    })),
  ]

  if (!currentFolderId.value && folders.length > 0) {
    nextTick(() => {
      currentFolderId.value = folders[0].id
    })
  }

  return folders
})

// 当前显示的卡盒列表
const currentFilteredCardBoxes = computed(() => {
  const folderId = currentFolderId.value
  if (!folderId) return []
  return filteredCardBoxesMap.value[folderId]?.cardBoxes || []
})

// 添加分页相关逻辑
const PAGE_SIZE = 20
const cardBoxPages = ref<Record<string, number>>({})

// 获取可见卡片
const visibleCards = (cardBoxId: string) => {
  const page = cardBoxPages.value[cardBoxId] || 1
  const cards = currentFilteredCardBoxes.value.find((box) => box.id === cardBoxId)?.cards || []
  return cards.slice(0, page * PAGE_SIZE)
}

// 修改加载状态为每个卡盒单独管理
const loadingCardBoxes = ref<Set<string>>(new Set())

const isCardBoxLoading = (cardBoxId: string) => loadingCardBoxes.value.has(cardBoxId)

// 处理卡盒滚动加载
const handleCardBoxScroll = async (cardBoxId: string) => {
  if (loadingCardBoxes.value.has(cardBoxId)) return

  const cards = currentFilteredCardBoxes.value.find((box) => box.id === cardBoxId)?.cards || []
  const currentPage = cardBoxPages.value[cardBoxId] || 1
  const totalItems = currentPage * PAGE_SIZE

  // 如果已经加载完所有卡片，就不再加载
  if (totalItems >= cards.length) return

  loadingCardBoxes.value.add(cardBoxId)
  try {
    cardBoxPages.value[cardBoxId] = currentPage + 1
  } finally {
    loadingCardBoxes.value.delete(cardBoxId)
  }
}

// 展开卡盒时重置分页
const toggleCardBox = (cardBoxId: string) => {
  vibrate()
  if (expandedCardBoxId.value !== cardBoxId) {
    expandedCardBoxId.value = cardBoxId
    // 重置分页
    cardBoxPages.value[cardBoxId] = 1
  } else {
    expandedCardBoxId.value = null
  }
}

// 抽取卡片属性计算
const getCardProps = (card: any) => ({
  frontContent: card.frontContent,
  backContent: card.backContent,
  index: card.index,
  layout: cardBoxStore.getCardBoxLayout(card.cardBoxId),
  isContentCentered: cardBoxStore.getCardBoxContentAlign(card.cardBoxId),
  isLargeFont: cardBoxStore.getCardBoxFontSize(card.cardBoxId),
  showNumber: cardBoxStore.getCardBoxShowNumber(card.cardBoxId),
  disableHover: true,
  disableDefaultTap: true,
  class: [(isCardRelated(card) || isCurrentCard(card)) && 'opacity-50 cursor-not-allowed'],
})

// 添加选中图标
const getCardSlots = (card: any) => ({
  action: () =>
    isCardSelected(card) &&
    h(
      'view',
      {
        class:
          'absolute right-3 bottom-3 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shadow-sm animate-fade-in animate-duration-200',
      },
      [
        h('text', {
          class: 'i-tabler-check text-white text-xs',
        }),
      ],
    ),
})

// 添加选中卡的状态
const selectedCards = ref<Array<{ id: string; cardBoxId: string; index: number }>>([])

// 检查卡片是否被选中
const isCardSelected = (card: { id: string; cardBoxId: string }) => {
  return selectedCards.value.some(
    (selected) => selected.id === card.id && selected.cardBoxId === card.cardBoxId,
  )
}

// 切换卡片选中状态
const toggleCardSelection = (card: { id: string; cardBoxId: string; index: number }) => {
  vibrate()
  if (isCardSelected(card)) {
    selectedCards.value = selectedCards.value.filter(
      (selected) => !(selected.id === card.id && selected.cardBoxId === card.cardBoxId),
    )
  } else {
    selectedCards.value.push({
      id: card.id,
      cardBoxId: card.cardBoxId,
      index: card.index,
    })
  }
}

// 处理确认关联
const handleConfirm = () => {
  vibrate()

  // 检查必要参数
  if (!currentCardBoxId.value || !currentCardItemId.value) {
    uni.showToast({
      title: '关联失败：源卡片信息缺失',
      icon: 'none',
    })
    return
  }

  if (!selectedCards.value.length) {
    uni.showToast({
      title: '请选择要关联的卡片',
      icon: 'none',
    })
    return
  }

  // 检查源卡片是否存在
  const sourceCard =
    cardDataStore.cardBoxes[currentCardBoxId.value]?.cardItems?.[currentCardItemId.value]
  if (!sourceCard) {
    uni.showToast({
      title: '关联失败：源卡片不存在',
      icon: 'none',
    })
    return
  }

  try {
    let successCount = 0
    selectedCards.value.forEach((card) => {
      if (!card.cardBoxId || !card.id) {
        console.error('Invalid card data:', card)
        return
      }

      // 检查目标卡片是否存在
      const targetCard = cardDataStore.cardBoxes[card.cardBoxId]?.cardItems?.[card.id]
      if (!targetCard) {
        console.error('Target card not found:', card)
        return
      }

      cardDataStore.createRelation({
        cardBoxId: currentCardBoxId.value,
        cardItemId: currentCardItemId.value,
        relatedCardBoxId: card.cardBoxId,
        relatedCardItemId: card.id,
      })
      successCount++
    })

    if (successCount > 0) {
      uni.showToast({
        title: '关联成功',
        icon: 'success',
      })
      // 直接返回上一页
      uni.navigateBack()
    } else {
      uni.showToast({
        title: '关联失败：目标卡片不存在',
        icon: 'none',
      })
    }
  } catch (error) {
    console.error('关联失败:', error)
    uni.showToast({
      title: '关联失败，请重试',
      icon: 'none',
    })
  }
}

// 样式相关
const currentLayout = computed(() => cardBoxStore.getCardBoxLayout(currentCardBoxId.value))

// 检查卡片是否已关联
const isCardRelated = (card: { id: string; cardBoxId: string }) => {
  const relations = cardDataStore.getCardRelations(currentCardBoxId.value, currentCardItemId.value)
  return relations.some((r) => r.toCardBoxId === card.cardBoxId && r.toCardItemId === card.id)
}

// 检查是否是当前卡片
const isCurrentCard = (card: { id: string; cardBoxId: string }) => {
  return card.id === currentCardItemId.value && card.cardBoxId === currentCardBoxId.value
}

// 处理文件夹切换
const onFolderChange = (folderId: string) => {
  // 如果点击已选中的文件夹，则取消选择
  if (currentFolderId.value === folderId) {
    currentFolderId.value = ''
  }
}

// 获取安全区域高度
const { safeAreaInsets } = uni.getWindowInfo()

// 添加新卡片到指定卡盒
const onAddCardToBox = (targetCardBoxId: string) => {
  vibrate()
  // 保存目标卡盒ID，用于后续选中新卡片
  currentTargetCardBoxId.value = targetCardBoxId
  // 保持卡盒展开状态
  expandedCardBoxId.value = targetCardBoxId

  uni.navigateTo({
    url: `/pages/bigCard/edit?cardBoxId=${targetCardBoxId}&isNew=true&fromRelate=true`,
  })
}

// 添加一个变量存储当前目标卡盒ID
const currentTargetCardBoxId = ref('')

// 添加事件监听
onMounted(() => {
  uni.$on('onNewCardCreated', (data: { cardId: string; cardBoxId: string; index: number }) => {
    // 确保数据已经更新
    nextTick(() => {
      // 自动选中新创建的卡片
      toggleCardSelection({
        id: data.cardId,
        cardBoxId: data.cardBoxId,
        index: data.index,
      })
      // 保持卡盒展开状态
      expandedCardBoxId.value = data.cardBoxId
    })
  })
})

// 记得在组件卸载时移除事件监听
onUnmounted(() => {
  uni.$off('onNewCardCreated')
})

// 展开/折叠逻辑
const expandedCardBoxId = ref<string | null>(null)
</script>

<style scoped>
/* 移除不需要的 sticky 样式 */
</style>
