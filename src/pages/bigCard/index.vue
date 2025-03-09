<route lang="json5">
{
  style: {
    navigationBarTitleText: '大卡片模式',
  },
  layout: false,
}
</route>

<template>
  <page-meta :pageStyle="lockScroll ? 'overflow:hidden;height:100vh' : ''"></page-meta>
  <view class="bg-[#f8f9fa] min-h-screen relative">
    <!-- 装饰元素移到页面背景 -->
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

    <view
      class="w-full relative overflow-hidden"
      :style="{
        height: `calc(100vh - ${safeAreaInsets.bottom}px)`,
      }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <view
        class="absolute inset-0 flex"
        :class="[!initializing && 'transition-transform duration-300', isDragging && 'dragging']"
        :style="{
          transform: `translateX(${translateX}px)`,
        }"
      >
        <!-- 添加一个占位容器 -->
        <view
          class="shrink-0"
          :style="{
            width: `${Math.max(0, currentCardIndex - 1) * windowWidth}px`,
          }"
        />

        <!-- 渲染可见卡片 -->
        <view
          v-for="item in renderCardItems"
          :key="item.id"
          class="h-full shrink-0"
          :style="{
            width: `${windowWidth}px`,
          }"
        >
          <template v-if="item.index < cardItemList.length">
            <!-- 普通卡片 -->
            <view class="h-full">
              <view
                class="rounded-2xl text-dark m-6 relative"
                :style="{
                  height: `calc(100vh - ${safeAreaInsets.bottom}px - 240rpx)`,
                  transform: `rotateY(${isCardFlipped(item.index) ? 180 : 0}deg)`,
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafeff 100%)',
                  boxShadow: '0 8px 16px -6px rgba(0,0,0,0.1), 0 4px 8px -4px rgba(0,0,0,0.07)',
                }"
                @tap="onCardItemTap"
                @longpress="() => onCardItemLongPress(cardItemList[item.index].id)"
              >
                <!-- 添加卡片右上角的挖孔装饰 -->
                <view class="absolute right-3 top-3 w-6 h-6 z-2">
                  <view class="absolute inset-0 rounded-full bg-gray-50" />
                  <view
                    class="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
                  />
                  <view
                    class="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"
                  />
                </view>

                <!-- 正面 -->
                <scroll-view
                  scroll-y
                  :style="{
                    transform: 'rotateY(0deg)',
                    backfaceVisibility: 'hidden',
                  }"
                  class="absolute inset-0"
                >
                  <view class="p-5 pb-8 font-600">
                    <view class="flex items-center gap-1 text-gray-400 text-sm mb-2">
                      <text class="i-tabler-play-card" />
                      <text class="text-sm">正面</text>
                    </view>
                    <view
                      class="min-h-[calc(100vh-300px)]"
                      :class="[isContentCentered && 'flex items-center justify-center']"
                    >
                      <text
                        class="overflow w-full leading-[1.75] tracking-[0.01em] text-gray-800 transition-all duration-300 break-words whitespace-pre-wrap"
                        :class="[
                          isContentCentered && 'text-center',
                          isLargeFont ? 'text-2xl' : 'text-lg',
                        ]"
                        :style="{
                          display: '-webkit-box',
                          '-webkit-box-orient': 'vertical',
                          '-webkit-line-clamp': '999',
                          transition:
                            'font-size 0.3s ease, line-height 0.3s ease, transform 0.3s ease',
                        }"
                      >
                        <template v-if="cardBoxStore.getCardBoxShowNumber(currentCardBoxId)">
                          <text class="text-gray-400 font-normal">{{ currentCardIndex + 1 }}.</text>
                        </template>
                        {{ getCardContent(item.index, 'front') }}
                        <text
                          v-if="isCardEmpty(item.index)"
                          class="block mt-2 text-sm text-gray-400 bg-gray-50/50 rounded-lg px-4 py-3"
                          :class="[isLargeFont ? 'text-base' : 'text-sm']"
                        >
                          {{
                            isCardFlipped(item.index)
                              ? '反面无内容，长按编辑'
                              : '正面无内容，长按编辑'
                          }}
                        </text>
                      </text>
                    </view>
                  </view>
                </scroll-view>

                <!-- 反面 -->
                <scroll-view
                  scroll-y
                  :style="{
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                  }"
                  class="absolute inset-0"
                >
                  <view class="p-5 pb-8 font-600">
                    <view class="flex items-center justify-end gap-1 text-gray-400 text-sm mb-2">
                      <text class="i-tabler-play-card" />
                      <text class="text-sm">反面</text>
                    </view>
                    <view
                      class="min-h-[calc(100vh-300px)]"
                      :class="[isContentCentered && 'flex items-center justify-center']"
                    >
                      <text
                        class="overflow w-full leading-[1.75] tracking-[0.01em] text-gray-800 transition-all duration-300 break-words whitespace-pre-wrap"
                        :class="[
                          isContentCentered && 'text-center',
                          isLargeFont ? 'text-2xl' : 'text-lg',
                        ]"
                        :style="{
                          display: '-webkit-box',
                          '-webkit-box-orient': 'vertical',
                          '-webkit-line-clamp': '999',
                          transition:
                            'font-size 0.3s ease, line-height 0.3s ease, transform 0.3s ease',
                        }"
                      >
                        {{ getCardContent(item.index, 'back') }}
                        <text
                          v-if="isCardEmpty(item.index)"
                          class="block mt-2 text-sm text-gray-400 bg-gray-50/50 rounded-lg px-4 py-3"
                          :class="[isLargeFont ? 'text-base' : 'text-sm']"
                        >
                          {{
                            isCardFlipped(item.index)
                              ? '反面暂无内容，长按编辑'
                              : '正面暂无内容，长按编辑'
                          }}
                        </text>
                      </text>
                    </view>
                  </view>
                </scroll-view>
              </view>
            </view>
          </template>
          <template v-else>
            <!-- 添加新卡片的占位 -->
            <view class="h-full" @longpress="onAddCardTap">
              <view
                class="rounded-3 text-dark h-full m-6 relative flex items-center justify-center"
                :style="{
                  height: `calc(100vh - ${safeAreaInsets.bottom}px - 160rpx)`,
                }"
              >
                <view
                  class="flex flex-col items-center gap-4 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl py-16 px-12 bg-white/70"
                  hoverClass="!border-indigo-400 !text-indigo-500 !scale-98 transform-origin-center"
                  :style="{
                    boxShadow: '0 8px 16px -6px rgba(0,0,0,0.1), 0 4px 8px -4px rgba(0,0,0,0.07)',
                  }"
                  :hoverStartTime="0"
                  :hoverStayTime="200"
                >
                  <text class="i-tabler-square-plus-2 text-4xl mb-2" />
                  <view class="flex flex-col items-center gap-2">
                    <text class="text-base font-medium">长按加新卡片</text>
                    <text class="text-xs opacity-65">在卡片盒中添加一张新的卡片</text>
                  </view>
                </view>
              </view>
            </view>
          </template>
        </view>
      </view>
    </view>
    <!-- 底部操作栏 -->
    <view
      class="fixed bottom-8 w-[90vw] max-w-2xl z-4 mx-auto left-0 right-0 animate-fade-in-up animate-duration-400 animate-ease-out"
      v-if="!isAddCardPage"
    >
      <view
        class="flex-1 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg flex items-center justify-between p-2 relative overflow-hidden"
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
            <!-- 朗读按钮 -->
            <view
              class="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1"
              :hoverClass="'bg-gray-50/80 scale-95 origin-center transition-all'"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap.stop="speakRef?.speak?.()"
            >
              <SpeakButton
                ref="speakRef"
                :content="currentSpeakContent"
                :isEmpty="isCardEmpty(currentCardIndex)"
                @start="playingState.isPlaying = true"
                @stop="playingState.isPlaying = false"
              />
              <text class="text-[11px] text-gray-500 leading-none">朗读</text>
            </view>

            <!-- 笔记按钮 -->
            <view
              class="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 relative"
              :hoverClass="'bg-gray-50/80 scale-95 origin-center transition-all'"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="showNoteModal = true"
            >
              <text class="i-tabler-notebook text-[17px] text-gray-600" />
              <text class="text-[11px] text-gray-500 leading-none">笔记</text>
              <view
                v-if="currentNote"
                class="absolute right-3 top-1 w-2 h-2 rounded-full bg-indigo-500"
              />
            </view>

            <!-- 提示按钮 -->
            <view
              v-if="showTipButton"
              class="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1"
              :hoverClass="'bg-gray-50/80 scale-95 origin-center transition-all'"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="onTipBtnClick"
            >
              <text class="i-tabler-bulb text-[17px] text-gray-600" />
              <text class="text-[11px] text-gray-500 leading-none">提示</text>
            </view>

            <!-- 添加关联按钮 -->
            <view
              class="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 relative"
              :hoverClass="'bg-gray-50/80 scale-95 origin-center transition-all'"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="onRelatedBtnClick"
            >
              <text class="i-tabler-link text-[17px] text-gray-600" />
              <text class="text-[11px] text-gray-500 leading-none">关联</text>
              <text
                v-if="relatedCards.length"
                class="absolute right-1 top-0 text-[10px] px-1.5 py-0.5 bg-indigo-50 rounded-full text-indigo-500"
              >
                {{ relatedCards.length }}
              </text>
            </view>
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
          class="relative z-1 w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1"
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
          <text class="text-[11px] text-gray-500 leading-none">更多</text>
        </view>
      </view>
    </view>
    <!-- 提示泡 -->
    <view
      v-if="tipVisible"
      class="fixed left-8 right-8 bottom-32 bg-white rounded-2xl p-4 z-10"
      :class="[
        showTip ? 'animate-fade-in-up' : 'animate-fade-out-down',
        'animate-duration-200',
        'animate-ease-out',
      ]"
      :style="`box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.1);`"
    >
      <view class="flex items-start justify-between">
        <view class="text-gray-700 leading-relaxed flex-1 mr-4 font-medium">
          <text
            v-for="(item, index) in getTipContent"
            :key="index"
            :class="[
              item.type === 'blank' && 'tip-blank',
              item.type === 'blank-en' && 'tip-blank-en',
              item.type === 'text' && 'animate-fade-in-up animate-duration-200',
            ]"
            :style="{
              borderBottom:
                item.type === 'blank' || item.type === 'blank-en' ? '2px solid #ddd' : 'none',
              display:
                item.type === 'blank' || item.type === 'blank-en' ? 'inline-block' : 'inline',
              width: item.type === 'blank' ? '1em' : item.type === 'blank-en' ? '0.5em' : 'auto',
              verticalAlign:
                item.type === 'blank' || item.type === 'blank-en' ? 'bottom' : 'baseline',
              opacity: item.type === 'text' ? 1 : 0.5,
              margin: '0 0.5px',
            }"
          >
            {{ item.text }}
          </text>
        </view>
        <view
          class="p-1 rounded-full transition-colors bg-gray-50/80"
          @tap="showTip = false"
          hoverClass="bg-gray-100"
          :hoverStayTime="100"
        >
          <text class="i-tabler-x text-gray-400 text-sm block" />
        </view>
      </view>
      <view class="flex items-center justify-between mt-3">
        <view class="text-xs text-gray-400">
          {{ getTipHint }}
        </view>
        <view
          class="p-1.5 rounded-full bg-amber-50 text-amber-500 w-6 h-6 flex items-center justify-center border border-amber-200"
          @tap.stop="onTipSpeakBtnClick"
          hoverClass="bg-amber-100 !scale-95"
          :hoverStartTime="0"
          :hoverStayTime="200"
        >
          <wd-loading v-if="onBackAudioLoading" color="#f59e0b" size="16px" />
          <view class="text-sm" v-else>
            <text class="i-tabler-volume" v-if="!onBackPlaying" />
            <text class="i-tabler-player-stop-filled" v-else />
          </view>
        </view>
      </view>
    </view>

    <!-- 笔记弹窗 -->
    <wd-popup
      v-model="showNoteModal"
      position="bottom"
      customClass="rounded-t-2xl shadow-[0_-8px_24px_-6px_rgba(0,0,0,0.12),0_-4px_8px_-4px_rgba(0,0,0,0.08)]"
      :closeOnClickModal="true"
      :modal="false"
    >
      <view
        class="bg-white rounded-t-2xl"
        :style="{
          paddingBottom: `${safeAreaInsets.bottom}px`,
          maxHeight: '75vh',
          minHeight: '40vh',
        }"
      >
        <!-- 标题 -->
        <view class="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <text class="text-base font-semibold text-gray-800">笔记</text>
          <view class="flex items-center gap-2">
            <!-- 编辑按钮 -->
            <view
              class="text-sm text-indigo-500 py-1 px-3 rounded-full"
              hoverClass="bg-indigo-50"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="onEditNote"
            >
              去编辑
            </view>
            <!-- 关按 -->
            <view
              class="w-8 h-8 rounded-lg bg-gray-50/80 flex items-center justify-center"
              hoverClass="scale-95 origin-center"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="showNoteModal = false"
            >
              <text class="i-tabler-x text-base text-gray-500" />
            </view>
          </view>
        </view>

        <!-- 笔记内容 -->
        <view class="p-6">
          <template v-if="currentNote">
            <view
              class="leading-relaxed text-gray-700 whitespace-pre-wrap break-words"
              :class="isLargeFont ? 'text-base' : 'text-sm'"
            >
              {{ currentNote }}
            </view>
          </template>
          <template v-else>
            <!-- 空状态 -->
            <view class="flex flex-col items-center justify-center h-full gap-6">
              <view class="relative">
                <view class="w-24 h-24 relative flex items-center justify-center">
                  <!-- 笔记图标 -->
                  <view class="text-[60px] text-gray-200">
                    <text class="i-tabler-notebook" />
                  </view>
                  <!-- 添加动画装饰 -->
                  <view
                    class="absolute -inset-4 bg-gradient-to-b from-transparent to-white/20 rounded-full animate-pulse"
                  />
                </view>
                <!-- 添加悬浮的装饰元素 -->
                <view
                  class="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-indigo-50 animate-float opacity-80"
                />
                <view
                  class="absolute -left-1 -bottom-1 w-4 h-4 rounded-full bg-amber-50 animate-float opacity-80"
                  style="animation-delay: -1.2s"
                />
              </view>
              <view class="flex flex-col items-center gap-2">
                <text class="text-gray-700 font-medium">暂无笔记</text>
                <text class="text-gray-400 text-sm">添加笔记以记录你的想法</text>
              </view>
              <!-- 生成笔记按钮 -->
              <GenerateNoteButton
                v-if="canGenerateNote"
                :show-button="settingsStore.showAIFeature"
                :front-content="cardItemData?.frontContent || ''"
                :back-content="cardItemData?.backContent || ''"
                :side="isCardFlipped(currentCardIndex) ? 'back' : 'front'"
                @success="handleGenerateSuccess"
              />
            </view>
          </template>
        </view>
      </view>
    </wd-popup>

    <!-- 加操作菜单 -->
    <CardBoxActionSheet
      v-model="isActionSheetShow"
      :cardBoxId="currentCardBoxId"
      :cardBoxName="cardBoxData?.name"
      :showOnlyStyle="true"
      :isBigCardMode="true"
      :currentCardId="currentCard?.id"
      @deleteCard="handleDeleteCard"
    />

    <!-- 添加生成笔记-->
    <GenerateNotePopup
      v-model="showNotePreview"
      :notes="generatedNotes"
      @close="showNotePreview = false"
      @confirm="handleInsertNotes"
    />

    <!-- 添加关联卡片弹窗 -->
    <RelatedCardsModal
      :current-card-box-index="currentCardBoxIndex"
      v-model="showRelatedModal"
      :current-card-box-id="currentCardBoxId"
      :current-card-item-id="currentCardItemId"
    />
  </view>
</template>

<script lang="ts" setup>
import { SwiperOnChange, TouchEvent } from '@uni-helper/uni-types/index'
import _ from 'lodash'

import CardBoxActionSheet from '@/components/CardBoxActionSheet.vue'
import GenerateNoteButton from '@/components/GenerateNoteButton.vue'
import GenerateNotePopup from '@/components/GenerateNotePopup.vue'
import RelatedCardsModal from '@/components/RelatedCardsModal.vue'
import SpeakButton from '@/components/SpeakButton.vue'
import { useCardDataStore, useCardItemStore, useCardBoxStore, useSettingsStore } from '@/store'
const plugin = requirePlugin('WechatSI')

const { safeAreaInsets } = uni.getWindowInfo()
const { vibrate } = useVibrate()
const cardDataStore = useCardDataStore()
const cardItemStore = useCardItemStore()
const cardBoxStore = useCardBoxStore()
const settingsStore = useSettingsStore()
const currentCardBoxId = ref('')
const currentCardBoxIndex = ref(0)
const currentCardIndex = ref(0)
const cardItemList = ref([])
const currentCard = computed(() => {
  // 从 store 中获取最新的卡片数据
  if (currentCardIndex.value >= 0 && currentCardBoxId.value) {
    const cardBox = cardDataStore.cardBoxes[currentCardBoxId.value]
    const card = cardItemList.value[currentCardIndex.value]
    if (cardBox && card && card.id) {
      // 返回 store 中的最新数据
      return { ...cardBox.cardItems[card.id], id: card.id }
    }
  }
  return null
})

const cardItemData = computed(
  () =>
    currentCard.value || {
      frontContent: '',
      backContent: '',
    },
)

const currentCardContent = computed(() => currentCard.value?.backContent)

const currentNote = computed(() => {
  if (!currentCard.value) return ''
  return isCardFlipped(currentCardIndex.value)
    ? currentCard.value.backNote
    : currentCard.value.frontNote
})

const isCardEmpty = computed(() => {
  return (index: number) => {
    const card = cardItemList.value[index]
    if (!card) return true
    return isCardFlipped(index) ? !card.backContent?.trim() : !card.frontContent?.trim()
  }
})

const canGenerateNote = computed(() => {
  if (!currentCard.value) return false
  const content = isCardFlipped(currentCardIndex.value)
    ? currentCard.value.backContent
    : currentCard.value.frontContent
  return content?.trim()?.length >= 3
})

const currentCardItemId = computed(() => {
  const card = cardItemList.value[currentCardIndex.value]
  return card?.id || ''
})

const relatedCards = computed(() => {
  if (!currentCard.value?.id) return []
  return cardDataStore.getCardRelations(currentCardBoxId.value, currentCard.value.id)
})

const handleInsertNotes = (selectedContent: string[]) => {
  const currentCard = cardItemList.value[currentCardIndex.value]
  if (!currentCard) return

  // 获取当前笔记内容，确保是字符串类型
  const currentNote =
    (isCardFlipped(currentCardIndex.value) ? currentCard.backNote : currentCard.frontNote) || ''

  // 拼接新笔记，确保所有值都是字符串
  const newNote = currentNote.trim()
    ? `${currentNote.trim()}\n\n${selectedContent.join('\n\n')}`
    : selectedContent.join('\n\n')

  // 更新卡片内容
  cardItemStore.updateCardItemContent(currentCardBoxId.value, currentCard.id, {
    frontContent: currentCard.frontContent,
    backContent: currentCard.backContent,
    frontNote: isCardFlipped(currentCardIndex.value) ? currentCard.frontNote : newNote,
    backNote: isCardFlipped(currentCardIndex.value) ? newNote : currentCard.backNote,
  })

  // 同步更新本地卡片数据
  if (isCardFlipped(currentCardIndex.value)) {
    currentCard.backNote = newNote
  } else {
    currentCard.frontNote = newNote
  }

  // 关闭笔记预览
  showNotePreview.value = false

  // 重新打开笔记弹窗以显示更新后的内容
  showNoteModal.value = false
  nextTick(() => {
    showNoteModal.value = true
  })
}

// 添加一个控制初始化动画的变量
const initializing = ref(true)

onShow(() => {
  if (currentCardBoxIndex.value >= 0) {
    // 更新卡片列表数据
    const cardBox = cardDataStore.cardBoxList[currentCardBoxIndex.value]
    if (cardBox) {
      cardItemList.value = cardBox.cardItems
      // 强制重新计算 currentCard
    }
  }
})

onLoad((query: { cardBoxId: string; cardItemIndex: string; cardBoxIndex: string }) => {
  // 设置初始位置（无动画）
  translateX.value = -(parseInt(query.cardItemIndex) || 0) * windowWidth
  currentCardBoxId.value = query.cardBoxId
  currentCardIndex.value = parseInt(query.cardItemIndex) || 0
  currentCardBoxIndex.value = parseInt(query.cardBoxIndex) || 0
  cardItemList.value = cardDataStore.cardBoxList[query.cardBoxIndex]?.cardItems

  // 等待下一帧后启用动画
  nextTick(() => {
    initializing.value = false
  })

  // 等待数据加载完成
  nextTick(() => {
    if (!cardItemList.value.length) {
      uni.showToast({
        title: '卡片不存在',
        icon: 'none',
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
      return
    }

    // 置页面标题
    const cardBoxName = cardDataStore.cardBoxes[currentCardBoxId.value]?.name
    if (cardBoxName) {
      uni.setNavigationBarTitle({
        title: cardBoxName,
      })
    }
  })
})

const cardFlippedArr = ref<number[]>([])
const isCardFlipped = (index: number) => cardFlippedArr.value.includes(index)

// 添加正在播放的状态追踪
const playingState = reactive({
  isPlaying: false,
})

// 修改卡片翻转处理
const onCardItemTap = () => {
  vibrate()
  resetTip()

  // 如果正在朗读，则停止朗读并返回执行翻转
  if (playingState.isPlaying) {
    speakRef.value?.stop?.()
    return
  }

  const wasFlipped = isCardFlipped(currentCardIndex.value)
  if (wasFlipped) {
    cardFlippedArr.value = cardFlippedArr.value.filter((index) => index !== currentCardIndex.value)
  } else {
    cardFlippedArr.value = [...cardFlippedArr.value, currentCardIndex.value]
  }

  // 等待翻转动画完成后再朗读
  setTimeout(() => {
    autoSpeak(currentCardIndex.value)
  }, 300)
}

const onCardItemLongPress = (cardItemId: string) => {
  vibrate()
  uni.navigateTo({
    url: `/pages/bigCard/edit?cardBoxId=${currentCardBoxId.value}&cardItemId=${cardItemId}&isFlip=${isCardFlipped(currentCardIndex.value)}`,
  })
}

const backAudio = uni.createInnerAudioContext()

// 分离音频状态
const onBackPlaying = ref(false)
const onBackAudioLoading = ref(false)

// 分离音频缓存
const backAudioCacheFileName = reactive({})

// 修改提示内容读按钮点击处理函数
const onTipSpeakBtnClick = _.debounce(() => {
  // 如果正在加载或播放中，直接返回
  if (onBackAudioLoading.value || onBackPlaying.value) {
    // 如果正在播放，则停止播放
    if (onBackPlaying.value) {
      backAudio.stop()
    }
    return
  }

  vibrate()
  const content = cardItemList.value[currentCardIndex.value]?.backContent?.trim()

  if (!content) return
  onBackAudioLoading.value = true

  if (backAudioCacheFileName[content]) {
    backAudio.src = backAudioCacheFileName[content]
    backAudio.play()
    onBackAudioLoading.value = false
    return
  }

  plugin?.textToSpeech({
    content,
    lang: 'zh_CN',
    success: (res) => {
      backAudio.src = res.filename
      backAudioCacheFileName[content] = res.filename
      backAudio.play()
    },
    fail: (err) => {
      console.log('err: ', err)
      uni.showToast({
        icon: 'none',
        title: '朗读失败，请稍后重试',
      })
    },
    complete: () => {
      onBackAudioLoading.value = false
    },
  })
}, 300)

// 背面音频状态监听
backAudio.onPlay(() => {
  onBackPlaying.value = true
})

backAudio.onStop(() => {
  onBackPlaying.value = false
})

backAudio.onEnded(() => {
  onBackPlaying.value = false
})

const onAddCardTap = () => {
  vibrate()
  // 直接跳到编辑页面，传入 isNew 参数
  uni.navigateTo({
    url: `/pages/bigCard/edit?cardBoxId=${currentCardBoxId.value}&isNew=true`,
  })
}

const isCurrentCardFlipped = computed(() => isCardFlipped(currentCardIndex.value))

const {
  showTip,
  tipVisible,
  getTipContent,
  getTipHint,
  showTipButton,
  handleTipClick,
  resetTip,
  closeTip,
} = useCardTip(currentCardContent, isCurrentCardFlipped)

// 监听提示状态，关闭时重置提示状态
watch(showTip, (newVal) => {
  if (!newVal) {
    closeTip()
  }
})

const onTipBtnClick = () => {
  vibrate()
  handleTipClick()
}

onUnmounted(() => {
  backAudio.destroy()
  cardItemStore.exitContentEditMode()
})
// 添加 lockScroll 开关
const lockScroll = ref<{ updateLockScroll?: (val: boolean) => void }>({})
provide('lockScroll', {
  lockScroll,
  updateLockScroll: (newValue) => {
    lockScroll.value = newValue
  },
})

// 字体大小
const showNoteModal = ref(false)

// 生成笔记相关态
const showNotePreview = ref(false)
const generatedNotes = ref<string[]>([])

const handleGenerateSuccess = (notes: string[]) => {
  if (!Array.isArray(notes) || notes.length === 0) return
  generatedNotes.value = notes.filter((note) => typeof note === 'string')
  showNotePreview.value = true
}

// 添加操作菜单变量
const isActionSheetShow = ref(false)

const cardBoxData = computed(() => {
  return cardDataStore.cardBoxes[currentCardBoxId.value]
})

// 样式关算属性
const isContentCentered = computed(() =>
  cardBoxStore.getCardBoxContentAlign(currentCardBoxId.value),
)
const isLargeFont = computed(() => cardBoxStore.getCardBoxFontSize(currentCardBoxId.value))

// 添加计算属性判断是否是加新卡片页面
const isAddCardPage = computed(() => {
  return currentCardIndex.value >= cardItemList.value.length
})

// 在其他 ref 声明附近添加
const showRelatedModal = ref(false)

const onEditNote = () => {
  showNoteModal.value = false
  uni.navigateTo({
    url: `/pages/bigCard/edit?cardBoxId=${currentCardBoxId.value}&cardItemId=${cardItemList.value[currentCardIndex.value].id}&isNote=true&isFlip=${isCardFlipped(currentCardIndex.value)}`,
  })
}

const onRelatedBtnClick = () => {
  vibrate()
  showRelatedModal.value = true
}

// 滚动关逻辑
const showScrollShadow = ref(false)

// 检查是否需要显示阴影
const checkScrollShadow = () => {
  const { windowWidth } = uni.getWindowInfo()
  const query = uni.createSelectorQuery()
  query
    .select('.min-w-max')
    .boundingClientRect((rect) => {
      if (rect) {
        const contentWidth = rect.width - windowWidth + 76
        showScrollShadow.value = contentWidth > 0
      }
    })
    .exec()
}

// 监听滚动事件
const onScroll = (e: any) => {
  const { scrollLeft, scrollWidth } = e.detail
  const { windowWidth } = uni.getWindowInfo()
  const contentWidth = scrollWidth - windowWidth + 76
  showScrollShadow.value = contentWidth > 0 && scrollLeft < contentWidth
}

// 监听可影响内容宽度的数据变化
watch(
  [cardItemList],
  () => {
    nextTick(() => {
      checkScrollShadow()
    })
  },
  {
    immediate: true,
  },
)

// 获取动朗读设置
const autoReadFront = computed(() => cardBoxStore.getCardBoxAutoReadFront(currentCardBoxId.value))
const autoReadBack = computed(() => cardBoxStore.getCardBoxAutoReadBack(currentCardBoxId.value))

// 自动朗读的引用 - 改回数组型
const speakRef = ref<{ speak: () => void; stop: () => void } | null>(null)

const onSwiperChange: SwiperOnChange = (e) => {
  const { current } = e.detail

  autoSpeak(current)
  currentCardIndex.value = current
  resetTip()
}

const autoSpeak = (current: number) => {
  // 停止所有朗读
  speakRef.value?.stop?.()

  // 检查边界情况
  if (current < 0 || current >= cardItemList.value.length) {
    return
  }

  // 等待组件更新完成后再执行朗读
  nextTick(() => {
    const currentCard = cardItemList.value[current]
    if (!currentCard) return

    // 根据设置自动朗读正面或背面内容
    if (isCardFlipped(current)) {
      if (autoReadBack.value && currentCard.backContent) {
        speakRef.value?.speak?.()
      }
    } else {
      if (autoReadFront.value && currentCard.frontContent) {
        speakRef.value?.speak?.()
      }
    }
  })
}

// 在切换卡片时停止朗读
watch(currentCardIndex, () => {
  if (playingState.isPlaying) {
    speakRef.value?.stop?.()
  }
})

// 添加以下响应式数据和方法
const { windowWidth } = uni.getWindowInfo()
const translateX = ref(0)
const startX = ref(0)
const isDragging = ref(false)

// 获取需要渲染的卡片索引
const renderCardItems = computed(() => {
  const current = currentCardIndex.value
  const minIndex = Math.max(0, current - 1)
  const maxIndex = Math.min(cardItemList.value.length, current + 1) // 注意这里去掉了 -1

  // 获取实际卡片
  const cards = cardItemList.value.slice(minIndex, maxIndex + 1).map((card) => ({
    ...card,
    index: cardItemList.value.findIndex((c) => c.id === card.id),
  }))

  // 如果当前显示范围包含最后一个位置，添加"添加卡片"项
  if (current >= cardItemList.value.length - 1) {
    cards.push({
      id: 'add-card',
      index: cardItemList.value.length,
      frontContent: '',
      backContent: '',
    })
  }

  return cards
})

// 处理触摸事件
const handleTouchStart = (e: TouchEvent) => {
  startX.value = e.touches[0].clientX
  isDragging.value = true
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return

  const deltaX = e.touches[0].clientX - startX.value
  // 进一步降低移动比例，让滑动更平滑
  const moveRatio = 0.5 // 从 0.6 降低到 0.5
  const dampingRatio = 0.12 // 从 0.15 降低到 0.12

  if (
    (currentCardIndex.value === 0 && deltaX > 0) ||
    (currentCardIndex.value === cardItemList.value.length && deltaX < 0)
  ) {
    translateX.value = -currentCardIndex.value * windowWidth + deltaX * dampingRatio
  } else {
    translateX.value = -currentCardIndex.value * windowWidth + deltaX * moveRatio
  }
}

const handleTouchEnd = (e: TouchEvent) => {
  if (!isDragging.value) return

  const deltaX = e.changedTouches[0].clientX - startX.value
  const threshold = windowWidth * 0.1

  let newIndex = currentCardIndex.value

  if (Math.abs(deltaX) > threshold) {
    if (deltaX > 0 && currentCardIndex.value > 0) {
      newIndex--
    } else if (deltaX < 0 && currentCardIndex.value < cardItemList.value.length) {
      newIndex++
    }
  }

  isDragging.value = false

  // 使用 nextTick 替代 requestAnimationFrame
  nextTick(() => {
    // 添加过渡动画
    translateX.value = -newIndex * windowWidth

    if (newIndex !== currentCardIndex.value) {
      onSwiperChange({
        detail: {
          current: newIndex,
          source: '',
        },
      })
    }
  })
}

// 监听 currentCardIndex 变化，更新位置
watch(currentCardIndex, (newIndex) => {
  translateX.value = -newIndex * windowWidth
})

// 添加一个安全的获取卡片内容的方法
const getCardContent = (index: number, side: 'front' | 'back') => {
  const card = cardItemList.value?.[index]
  if (!card) return ''
  return side === 'front' ? card.frontContent : card.backContent
}

// 1. 添加一个计算属性来获取当前卡片的朗读内容
const currentSpeakContent = computed(() => {
  if (!currentCard.value) return ''
  return isCardFlipped(currentCardIndex.value)
    ? currentCard.value.backContent || ''
    : currentCard.value.frontContent || ''
})

// 添加删除卡片的处理方法
const handleDeleteCard = () => {
  if (!currentCard.value?.id) return

  cardItemStore.removeCardItem(currentCardBoxId.value, currentCard.value.id)
  cardItemList.value = cardDataStore.cardBoxList[currentCardBoxIndex.value]?.cardItems
}
</script>

<style lang="scss" scoped>
.backface-hidden {
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transform-style: preserve-3d;
}

@keyframes spin-slow {
  to {
    transform: rotate(360deg);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.1;
  }
  50% {
    opacity: 0.3;
  }
}

.animate-spin-slow {
  animation: spin-slow 4s linear infinite;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-fade-in {
  animation: fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.transition-transform {
  transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
/* 拖动时禁用过渡效果 */
.dragging {
  transition: transform 0.1s linear !important;
}
</style>
