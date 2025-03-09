<template>
  <view
    class="group relative transform-gpu transition-all duration-300 animate-fade-in animate-duration-300"
  >
    <!-- 添加阴影容器 -->
    <view
      class="absolute inset-0 rounded-xl -z-1 transition-all duration-200"
      :style="{
        transform: 'scale(0.97)',
        boxShadow: '0 8px 20px -6px rgba(0,0,0,0.06), 0 4px 12px -4px rgba(0,0,0,0.03)',
      }"
    />

    <view
      class="relative bg-white rounded-xl overflow-hidden transition-all duration-200"
      hoverClass="scale-97 origin-center"
      :hoverStartTime="0"
      :hoverStayTime="200"
      @tap="onBoxClick"
    >
      <!-- 卡盒封面 -->
      <view
        class="aspect-[5/4] bg-gradient-to-br"
        :style="{
          background: getGradientById(data.id),
        }"
      >
        <!-- 装饰元素容器 -->
        <view class="absolute inset-0 pointer-events-none">
          <!-- 大圆形装饰 -->
          <view class="absolute right-0 top-0 w-48 h-48 rounded-full bg-black/2 z-[1]" />
          <!-- 小圆形装饰 -->
          <view
            class="absolute left-0 bottom-0 w-32 h-32 rounded-full bg-black/3 -translate-x-16 translate-y-16 z-[1]"
          />
          <view class="absolute left-20 top-16 w-20 h-20 z-[2]">
            <view class="absolute inset-0 rounded-full border-[3px] border-white/8" />
          </view>
        </view>

        <view class="absolute inset-0 p-4 flex flex-col">
          <!-- 右上角圆孔效果 -->
          <view class="absolute right-3 top-3 w-4 h-4 z-2">
            <!-- 圆孔主体 -->
            <view class="absolute inset-0 rounded-full bg-white" />
            <!-- 内部阴影 -->
            <view class="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]" />
            <!-- 高光效果 -->
            <view
              class="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"
            />
          </view>

          <!-- 卡盒内容区域 -->
          <view class="relative flex flex-col h-full overflow-hidden">
            <!-- 卡盒名称 -->
            <text class="text-base font-semibold text-gray-800 w-80% line-clamp-2">
              {{ data.name }}
            </text>

            <!-- 底部信息区域 -->
            <view class="mt-auto space-y-4 w-full">
              <!-- 学习进度条 -->
              <template v-if="data.studyState?.isStudying">
                <view class="space-y-3 w-full">
                  <!-- 待学习提示 -->
                  <text v-if="todayStudyCount > 0" class="block text-xs text-black/40 mb-1">
                    {{ todayStudyCount }} 张待学习
                  </text>

                  <!-- 进度条 -->
                  <view class="h-1 bg-black/[0.03] rounded-full overflow-hidden">
                    <view
                      class="h-full bg-white/90 rounded-full transition-all duration-300"
                      :style="{ width: `${studyProgress}%` }"
                    />
                  </view>
                  <!-- 进度信息 -->
                  <view class="flex items-center justify-between">
                    <view class="flex items-center gap-1">
                      <text class="i-tabler-cards text-xs text-gray-600/90" />
                      <text class="text-xs text-gray-600/90">
                        {{ data.cardItems.length }} 张卡片
                      </text>
                    </view>
                  </view>
                </view>
              </template>
              <template v-else>
                <!-- 未开始学习时只显示卡片数量 -->
                <view class="flex items-center gap-1">
                  <text class="i-tabler-cards text-xs text-gray-600/90" />
                  <text class="text-xs text-gray-600/90">{{ data.cardItems.length }} 张卡片</text>
                </view>
              </template>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部操作按钮 -->
      <view class="absolute bottom-2 right-2 z-10">
        <view
          class="w-7 h-7 rounded-full bg-white/90 shadow-[0_4px_8px_rgba(0,0,0,0.04)] flex items-center justify-center"
          :hoverClass="'bg-gray-50'"
          :hoverStartTime="0"
          :hoverStayTime="200"
          @tap.stop="onMoreBtnTap"
        >
          <text class="i-tabler-dots text-sm text-gray-500" />
        </view>
      </view>
    </view>

    <!-- 操作菜单 -->
    <CardBoxActionSheet
      v-model="isActionSheetShow"
      :cardBoxId="data.id"
      :cardBoxName="data.name"
      :cardBoxColor="data.color"
      @exportClick="isExportModalShow = true"
      @sortClick="onSortClick"
    />

    <ExportModal v-model="isExportModalShow" :cardBoxId="data.id" :cardBoxIndex="cardBoxIndex" />

    <SortCardModal
      :type="sortType"
      :isShow="isSortModalShow"
      :cardBoxId="data.id"
      @close="isSortModalShow = false"
      :cardBoxIndex="cardBoxIndex"
    />
  </view>
</template>

<script lang="ts" setup>
import _ from 'lodash'

import { gradients } from '@/constants/gradients'
import { useCardBoxStore } from '@/store'
import { CardBoxList } from '@/types/card'

import CardBoxActionSheet from './CardBoxActionSheet.vue'
import ExportModal from './ExportModal.vue'
import SortCardModal from './SortCardModal.vue'

const { vibrate } = useVibrate()
const cardBoxStore = useCardBoxStore()

const props = defineProps<{
  data: CardBoxList[number]
  cardBoxIndex: number
  scrollTop: number
}>()

const onBoxClick = () => {
  vibrate()
  uni.navigateTo({
    url: `/pages/cardList/index?cardBoxId=${props.data.id}`,
  })
}

// 在 script setup 中添加
const decorationCache = new Map()

// 修改 getGradientById 函数
const getGradientById = (cardId: string) => {
  // 如果卡盒有指定颜色,则使用指定的颜色
  if (props.data.color !== undefined) {
    return gradients[props.data.color]
  }

  // 对于没有指定颜色的卡盒，使用随机但固定的颜色
  const cacheKey = `gradient-${cardId}`
  if (decorationCache.has(cacheKey)) {
    return decorationCache.get(cacheKey)
  }

  const len = cardId.length
  const seed =
    cardId.charCodeAt(0) + cardId.charCodeAt(Math.floor(len / 2)) + cardId.charCodeAt(len - 1)

  const gradient = gradients[seed % gradients.length]
  decorationCache.set(cacheKey, gradient)
  return gradient
}

// 添加操作相关的状
const isActionSheetShow = ref(false)
const isExportModalShow = ref(false)
const isSortModalShow = ref(false)
const sortType = ref<'cardBox' | 'cardItem'>('cardItem')

const onSortClick = (type?: 'cardBox' | 'cardItem') => {
  isSortModalShow.value = true
  sortType.value = type || 'cardItem'
}

const { showActions } = inject<{
  showActions: (cardBoxId: string, cardBoxName: string) => void
}>('cardBoxActions', {
  showActions: () => {}, // 提供默认
})

const onMoreBtnTap = (e: any) => {
  e.stopPropagation()
  vibrate()
  showActions(props.data.id, props.data.name)
}

// 添加计算属性获取学习进度
const studyProgress = computed(() => {
  return cardBoxStore.getStudyProgress(props.data.id)
})

// 添加计算属性获取今日待学习卡片数量
const todayStudyCount = computed(() => {
  if (!props.data.studyState?.isStudying) return 0
  const todayCards = cardBoxStore.getTodayStudyCards(props.data.id)
  return todayCards.reviewCards.length + todayCards.newCards.length
})
</script>

<style scoped>
.text-2xs {
  font-size: 0.65rem;
  line-height: 1rem;
}

.line-clamp-1 {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.line-clamp-2 {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
