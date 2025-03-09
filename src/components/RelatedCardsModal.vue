<template>
  <wd-popup
    lockScroll
    position="bottom"
    customClass="rounded-t-2xl shadow-[0_-8px_24px_-6px_rgba(0,0,0,0.12),0_-4px_8px_-4px_rgba(0,0,0,0.08)]"
    :safe-area-inset-bottom="true"
    :modelValue="modelValue"
    @close="$emit('update:modelValue', false)"
  >
    <view
      class="bg-white rounded-t-2xl flex flex-col"
      :style="{
        paddingBottom: `${safeAreaInsets.bottom}px`,
        height: '85vh',
      }"
    >
      <!-- 标题栏 -->
      <view
        class="flex-none px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-white"
      >
        <text class="text-base font-semibold text-gray-800">
          已关联 {{ relatedCards.length }} 张卡片
        </text>
        <view class="flex items-center gap-3">
          <!-- 只在有关联卡片时显示添加按钮 -->
          <view
            v-if="relatedCards.length"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 transition-colors"
            :hoverClass="'bg-indigo-500/15 scale-95'"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="onAddRelatedCard"
          >
            <text class="i-tabler-link text-indigo-500" />
            <text class="text-sm text-indigo-500">关联新卡片</text>
          </view>
          <view
            class="w-8 h-8 rounded-lg bg-gray-50/80 flex items-center justify-center"
            hoverClass="scale-95 origin-center"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="$emit('update:modelValue', false)"
          >
            <text class="i-tabler-x text-base text-gray-500" />
          </view>
        </view>
      </view>

      <!-- 文件夹标签固定在标题栏下方 -->
      <view class="flex-none bg-white border-b border-gray-100">
        <FolderTabs
          v-if="availableFolders.length"
          v-model="currentFolderId"
          :folders="availableFolders"
          :show-count="true"
          :get-folder-count="getFolderCardCount"
          @update:modelValue="onFolderChange"
        />
      </view>

      <!-- 可滚动内容区域 -->
      <scroll-view scroll-y class="flex-1">
        <!-- 已关联卡片列表 -->
        <view class="p-3" v-if="relatedCards.length">
          <!-- 按卡盒分组显示 -->
          <view
            v-for="group in groupedRelatedCards"
            :key="group.cardBoxId"
            class="mb-6 last:mb-0 bg-gray-50/80 rounded-xl p-3"
          >
            <!-- 卡盒标题 -->
            <view class="flex items-center justify-between mb-3">
              <view class="flex items-center gap-2">
                <text class="i-tabler-cards text-gray-400" />
                <text class="text-sm text-gray-700 font-medium">{{ group.cardBoxName }}</text>
                <text class="text-xs text-gray-400">({{ group.cards.length }})</text>
              </view>
            </view>

            <!-- 卡片列表 -->
            <view
              class="gap-2"
              :class="[
                cardBoxStore.getCardBoxLayout(group.cardBoxId) === 'list'
                  ? 'space-y-2'
                  : 'grid grid-cols-2',
              ]"
            >
              <CardItem
                v-for="relation in group.cards"
                :key="`${relation.toCardBoxId}-${relation.toCardItemId}`"
                :front-content="
                  getCardContent(relation.toCardBoxId, relation.toCardItemId).frontContent
                "
                :back-content="
                  getCardContent(relation.toCardBoxId, relation.toCardItemId).backContent
                "
                :index="getCardContent(relation.toCardBoxId, relation.toCardItemId).index"
                :layout="cardBoxStore.getCardBoxLayout(relation.toCardBoxId)"
                :is-content-centered="cardBoxStore.getCardBoxContentAlign(relation.toCardBoxId)"
                :is-large-font="cardBoxStore.getCardBoxFontSize(relation.toCardBoxId)"
                :show-number="cardBoxStore.getCardBoxShowNumber(relation.toCardBoxId)"
                :disable-hover="true"
                :disable-default-tap="true"
                @tap.stop="onRelatedCardTap(relation)"
              >
                <!-- 删除按钮 -->
                <template #action>
                  <view
                    class="absolute -top-1 -right-1 w-7 h-7 rounded-lg bg-white/60 backdrop-blur-[2px] flex items-center justify-center shadow-sm hover:bg-gray-50/80"
                    @tap.stop="showDeleteConfirm(relation)"
                  >
                    <text class="i-tabler-unlink text-gray-400/80 text-sm" />
                  </view>
                </template>
              </CardItem>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-else class="p-8 flex flex-col items-center justify-center py-12 gap-6">
          <view class="relative">
            <view class="w-32 h-32 relative flex items-center justify-center">
              <view class="text-[80px] text-gray-200">
                <text class="i-tabler-cards" />
              </view>
              <view
                class="absolute -inset-4 bg-gradient-to-b from-transparent to-white/20 rounded-full animate-pulse"
              />
            </view>
            <view
              class="absolute -right-4 -top-4 w-8 h-8 rounded-full bg-indigo-50 animate-float opacity-80"
            />
            <view
              class="absolute -left-2 -bottom-2 w-6 h-6 rounded-full bg-amber-50 animate-float opacity-80"
              style="animation-delay: -1.2s"
            />
            <view
              class="absolute -right-2 bottom-0 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center animate-float"
              style="animation-delay: -0.6s"
            >
              <text class="i-tabler-link text-gray-300 text-xl" />
            </view>
          </view>
          <view class="flex flex-col items-center gap-2">
            <text class="text-gray-700 font-medium">暂无关联卡片</text>
            <text class="text-gray-400 text-sm">添加关联卡片，建立知识连接</text>
          </view>
          <!-- 只在有其他可关联卡片时显示按钮 -->
          <view
            v-if="hasAvailableCards"
            class="mt-4 px-6 py-2.5 bg-indigo-500 rounded-full flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 active:scale-95 transition-all"
            @tap="onAddRelatedCard"
          >
            <text class="i-tabler-link text-white" />
            <text class="text-white font-medium">添加关联</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>

  <!-- 删除确认弹窗 -->
  <ConfirmModal
    v-model="showConfirmModal"
    title="取消关联"
    content="确定要取消这张卡片的关联吗？"
    :danger="true"
    @confirm="handleDeleteConfirm"
  />
</template>

<script lang="ts" setup>
import _ from 'lodash'

import { useCardDataStore, useCardBoxStore } from '@/store'
import { CardRelation, CardItem as CardItemType, CardRelationWithId } from '@/types/card'

import CardItem from './CardItem.vue'
import ConfirmModal from './ConfirmModal.vue'
import FolderTabs from './FolderTabs.vue'

const props = defineProps<{
  modelValue: boolean
  currentCardBoxId: string
  currentCardItemId: string
  currentCardBoxIndex: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { safeAreaInsets } = uni.getWindowInfo()
const cardDataStore = useCardDataStore()
const cardBoxStore = useCardBoxStore()

// 文件夹相关
const currentFolderId = ref('')

// 关联卡片相关
const relatedCards = computed(() => {
  if (!props.currentCardBoxId || !props.currentCardItemId) return []
  return cardDataStore.getCardRelations(props.currentCardBoxId, props.currentCardItemId)
})

// 获取文件夹下的卡片数量
const getFolderCardCount = (folderId: string) => {
  return relatedCards.value.filter((relation) => {
    const cardBox = cardDataStore.cardBoxes[relation.toCardBoxId]
    if (!cardBox) return false

    if (folderId === 'default') {
      return !cardBox.folderId || cardBox.folderId === 'default'
    }
    return cardBox.folderId === folderId
  }).length
}

// 分组显示关联卡片
const groupedRelatedCards = computed(() => {
  const filteredRelations = currentFolderId.value
    ? relatedCards.value.filter((relation) => {
        const cardBox = cardDataStore.cardBoxes[relation.toCardBoxId]
        if (!cardBox) return false

        if (currentFolderId.value === 'default') {
          return !cardBox.folderId || cardBox.folderId === 'default'
        }
        return cardBox.folderId === currentFolderId.value
      })
    : relatedCards.value

  const groups = filteredRelations.reduce(
    (acc, relation) => {
      const cardBoxId = relation.toCardBoxId
      if (!acc[cardBoxId]) {
        const cardBox = cardDataStore.cardBoxes[cardBoxId]
        if (cardBox && relation.toCardItemId) {
          acc[cardBoxId] = {
            cardBoxId,
            cardBoxName: getCardBoxName(cardBoxId),
            cards: [],
          }
        }
      }
      if (acc[cardBoxId]) {
        acc[cardBoxId].cards.push(relation)
      }
      return acc
    },
    {} as Record<
      string,
      { cardBoxId: string; cardBoxName: string; cards: typeof relatedCards.value }
    >,
  )

  return Object.values(groups)
})

// 可用文件夹
const availableFolders = computed(() => {
  const cardBoxesWithRelations = relatedCards.value
    .map((r) => cardDataStore.cardBoxes[r.toCardBoxId])
    .filter(Boolean)

  const folderIds = new Set(cardBoxesWithRelations.map((box) => box.folderId || 'default'))

  const folders = [
    ...(folderIds.has('default') ? [{ id: 'default', name: '默认目录' }] : []),
    ...cardDataStore.folderList.filter((f) => folderIds.has(f.id)),
  ]

  if (!currentFolderId.value && folders.length > 0) {
    nextTick(() => {
      currentFolderId.value = folders[0].id
    })
  }

  return folders
})

// 辅助方法
const getCardBoxName = (cardBoxId: string) => {
  return cardDataStore.cardBoxes[cardBoxId]?.name || ''
}

const getCardContent = (cardBoxId: string, cardItemId: string): CardItemType => {
  return (
    cardDataStore.cardBoxes[cardBoxId]?.cardItems[cardItemId] || {
      frontContent: '',
      backContent: '',
      frontNote: '',
      backNote: '',
      index: 0,
    }
  )
}

// 删除相关
const showConfirmModal = ref(false)
const currentRelation = ref<CardRelationWithId | null>(null)

const showDeleteConfirm = (relation: CardRelationWithId) => {
  currentRelation.value = relation
  showConfirmModal.value = true
}

const handleDeleteConfirm = () => {
  if (!currentRelation.value) return
  cardDataStore.removeRelation(
    props.currentCardBoxId,
    props.currentCardItemId,
    currentRelation.value.id,
  )

  const currentFolderCardCount = getFolderCardCount(currentFolderId.value)

  if (currentFolderCardCount === 0) {
    currentFolderId.value = 'default'
  } else {
    const currentIndex = availableFolders.value.findIndex((f) => f.id === currentFolderId.value)

    if (currentIndex === -1 || currentIndex === 0) {
      currentFolderId.value = availableFolders.value[0].id
    } else {
      currentFolderId.value = availableFolders.value[currentIndex - 1].id
    }
  }

  currentRelation.value = null
  showConfirmModal.value = false
}

// 其他功能
const hasAvailableCards = computed(() => {
  return Object.keys(cardDataStore.cardBoxes).some((id) => id !== props.currentCardBoxId)
})

const onAddRelatedCard = () => {
  // 验证必要参数
  if (!props.currentCardBoxId || !props.currentCardItemId) {
    console.error('Missing required parameters:', props)
    uni.showToast({
      title: '参数错误',
      icon: 'none',
    })
    return
  }

  // 验证源卡片是否存在
  const sourceCard =
    cardDataStore.cardBoxes[props.currentCardBoxId]?.cardItems?.[props.currentCardItemId]
  if (!sourceCard) {
    console.error('Source card not found:', props)
    uni.showToast({
      title: '卡片不存在',
      icon: 'none',
    })
    return
  }

  uni.navigateTo({
    url: `/pages/bigCard/relate?cardBoxId=${props.currentCardBoxId}&cardItemId=${props.currentCardItemId}`,
  })
}

const onRelatedCardTap = _.debounce(
  (relation: CardRelation) => {
    emit('update:modelValue', false)

    const cardBoxId = cardDataStore.cardBoxes[relation.toCardBoxId].index
    const cardItemIndex =
      cardDataStore.cardBoxes[relation.toCardBoxId].cardItems[relation.toCardItemId].index
    // 添加延迟确保弹窗关闭后再跳转
    setTimeout(() => {
      uni.navigateTo({
        url: `/pages/bigCard/index?cardBoxId=${relation.toCardBoxId}&cardItemIndex=${cardItemIndex}&cardBoxIndex=${cardBoxId}`,
      })
    }, 100)
  },
  300,
  { leading: true, trailing: false },
)

const onFolderChange = (folderId: string) => {
  if (currentFolderId.value === folderId) {
    currentFolderId.value = ''
  }
}
</script>
