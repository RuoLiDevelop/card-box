<route lang="json5">
{
  style: {
    navigationBarTitleText: '生成卡片',
  },
  layout: false,
}
</route>

<page-meta :page-style="`overflow:${isParseResultShow ? 'hidden' : 'visible'};`"></page-meta>

<template>
  <view class="h-screen flex flex-col bg-white">
    <template v-if="settingsStore.showAIFeature">
      <!-- 解析模式选择 -->
      <scroll-view scroll-y class="flex-1">
        <view class="p-2">
          <view class="rounded-3 bg-gray-1 p-2">
            <view class="rounded-3 bg-white border border-gray-2 p-4">
              <text class="text-sm font-semibold text-gray-800">生成卡片类型</text>
              <view class="mt-2 flex gap-1.5 flex-wrap">
                <view
                  v-for="mode in parseModes"
                  :key="mode.value"
                  class="py-1.5 px-3 rounded-full text-xs transition-all flex items-center gap-1 flex-shrink-0 mb-1"
                  :class="[
                    currentMode === mode.value
                      ? 'bg-indigo-50 text-indigo-500 font-medium'
                      : 'bg-gray-50 text-gray-500 ',
                  ]"
                  @tap="currentMode = mode.value"
                >
                  <text :class="[mode.icon, 'text-sm']"></text>
                  <text>{{ mode.label }}</text>
                </view>
              </view>
              <view class="mt-2 text-xs text-gray-500 leading-5">{{ currentModeDescription }}</view>
            </view>
          </view>
        </view>

        <!-- 输入区域 -->
        <view class="p-2 pt-0">
          <view class="rounded-3 bg-gray-1 p-2">
            <view
              class="rounded-3 bg-white border border-gray-2 overflow-hidden p-2"
              :style="{
                boxShadow: `rgba(0, 0, 0, 0.15) 3px 0px 6px -3px`,
              }"
            >
              <textarea
                v-model="content"
                class="h-45vh p-2 text-sm"
                style="width: calc(100vw - 128rpx)"
                :adjust-position="true"
                :show-confirm-bar="false"
                :placeholder="currentPlaceholder"
                placeholderClass="text-sm"
                :maxlength="2000"
                confirm-type="done"
              />
              <view class="px-4 pb-3 flex items-center justify-between text-sm">
                <view class="flex items-center gap-2">
                  <view
                    v-if="content"
                    class="py-1 px-2 rounded bg-gray-50 text-gray-500 flex items-center gap-1"
                    @tap="content = ''"
                  >
                    <text class="i-tabler-x text-sm"></text>
                    <text>清空</text>
                  </view>
                  <view class="text-gray-400">{{ content.length }}/2000</view>
                </view>
              </view>
            </view>
          </view>

          <!-- 信息栏 -->
          <view class="px-4 py-2 flex justify-end text-xs">
            <view
              v-if="aiParseStore.lastParseResult"
              class="text-indigo-500 flex items-center gap-1"
              @tap="showLastParseResult"
            >
              <text class="i-tabler-history"></text>
              <text>查看上次结果</text>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 底部按钮固定 -->
      <view class="p-3 border-t border-gray-100">
        <!-- 额度显示 -->
        <view class="mb-2 flex items-center justify-between px-1">
          <text class="text-xs text-gray-400">今日剩余额度</text>
          <view class="flex items-center gap-1">
            <text class="text-sm font-medium text-gray-600">{{ remainingCount }}</text>
            <text class="text-xs text-gray-400">次</text>
          </view>
        </view>

        <!-- 生成按钮 -->
        <view class="flex items-center">
          <button
            class="w-full py-3 rounded-lg bg-indigo-500 text-white text-center text-sm font-medium transition-all"
            :hover-class="'opacity-90'"
            @tap="handleParse"
          >
            <view class="flex items-center justify-center gap-2">
              <text class="i-solar-magic-stick-3-bold-duotone text-base"></text>
              <text>智能生成卡片</text>
              <text class="text-xs opacity-80">(消耗3次额度)</text>
            </view>
          </button>
        </view>

        <view class="w-full" :style="{ height: `${safeAreaInsets.bottom || 8}px` }" />
      </view>

      <!-- 加载动画 -->
      <wd-popup
        v-model="isLoading"
        :closeOnClickModal="false"
        customClass="bg-transparent shadow-none rounded-[32px]"
        @after-leave="scrollToTop"
      >
        <view
          class="flex flex-col items-center gap-6 p-8 rounded-[32px] justify-center"
          :style="{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            width: '320rpx',
            height: '320rpx',
          }"
        >
          <!-- 修改动画容器 -->
          <view class="relative w-18 h-18 flex items-center justify-center">
            <view class="absolute inset-0">
              <view
                class="w-full h-full rounded-full border-[3px] border-indigo-100/80 animate-spin-slow"
                :style="{
                  boxShadow: 'inset 0 0 12px rgba(99, 102, 241, 0.1)',
                }"
              ></view>
            </view>
            <view class="absolute inset-0 rotate-45">
              <view
                class="w-full h-full rounded-full border-[3px] border-t-indigo-400/90 border-transparent animate-pulse"
                :style="{
                  boxShadow: '0 0 16px rgba(99, 102, 241, 0.15)',
                }"
              ></view>
            </view>
            <view class="relative animate-float">
              <text
                class="i-solar-magic-stick-3-bold-duotone text-4xl text-indigo-500"
                :style="{
                  filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.3))',
                }"
              ></text>
            </view>
          </view>

          <view class="flex flex-col items-center gap-3">
            <text class="text-base font-medium text-gray-700 tracking-wide">AI 思考中</text>
            <text
              class="text-xs text-gray-500/90 animate-fade-in tracking-wide"
              :style="{
                textShadow: '0 0 1px rgba(0,0,0,0.05)',
              }"
            >
              {{ loadingTips[currentTipIndex] }}
            </text>
          </view>
        </view>
      </wd-popup>

      <!-- 预览弹窗 -->
      <wd-popup
        lockScroll
        v-model="isParseResultShow"
        customStyle="max-height:80vh;"
        customClass="rounded-t-3xl overflow-hidden"
        position="bottom"
        :safe-area-inset-bottom="true"
        @close="isParseResultShow = false"
        @before-enter="scrollToTop"
        @after-leave="handleAfterLeave"
      >
        <view class="overflow-hidden h-[80vh] flex flex-col">
          <!-- 标题栏 -->
          <view
            class="sticky top-0 left-0 w-full bg-white h-12 flex items-center justify-between border-gray-2 border-b border z-10"
          >
            <view
              class="text-xs text-gray-4 py-2 px-3 bg-gray-50 rounded-3 ml-3"
              :hoverStartTime="0"
              :hoverStayTime="200"
              hoverClass="!scale-97 transform-origin-center"
              @tap="isParseResultShow = false"
            >
              取消
            </view>
            <view class="flex flex-gap-2">
              <view
                class="text-xs py-2 px-3 bg-indigo-50 text-indigo-500 rounded-3 font-semibold text-center transition-all"
                hoverClass="bg-indigo-100 !scale-97 transform-origin-center"
                :hoverStartTime="0"
                :hoverStayTime="200"
                @tap="onReverseBtnClick"
              >
                正反面交换
              </view>
              <view
                class="text-xs mr-3 py-2 px-3 bg-indigo-50 text-indigo-500 rounded-3 font-semibold text-center transition-all"
                hoverClass="bg-indigo-100 !scale-97 transform-origin-center"
                :hoverStartTime="0"
                :hoverStayTime="200"
                @tap="onImportBtnClick"
              >
                确认导入
              </view>
            </view>
          </view>

          <!-- 卡片列表容器 -->
          <scroll-view v-if="showContent" scroll-y class="flex-1" :scrollTop="scrollTop">
            <view class="bg-gray-1 rounded-3 p-2 m-2">
              <view
                v-for="(item, index) in cardItems"
                :key="index"
                class="rounded-3 text-dark bg-white border border-gray-2 border-solid overflow-hidden mb-4 shadow"
              >
                <view class="p-4">
                  <view class="mb-1 text-gray-4 text-sm">正面</view>
                  <view class="p-2 rounded bg-gray-50/50">{{ item.frontContent }}</view>
                  <view class="mt-2 mb-1 text-gray-4 text-sm">反面</view>
                  <view class="p-2 rounded bg-gray-50/50">{{ item.backContent }}</view>
                  <template v-if="item.note">
                    <view class="mt-2 mb-1 text-gray-4 text-sm">笔记</view>
                    <view class="p-2 rounded bg-yellow-50/50 text-sm text-gray-600">
                      {{ item.note }}
                    </view>
                  </template>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>
      </wd-popup>

      <QuotaExceededModal v-model="isQuotaDialogVisible" title="今日卡片生成次数不足" />
    </template>
    <template v-else>
      <!-- 将原来的功能未开放提示替换为学习指南 -->
      <view class="h-full flex flex-col items-center justify-center px-8">
        <view
          class="w-48 h-48 mb-8 rounded-3xl flex items-center justify-center"
          :style="{
            background:
              'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.15))',
          }"
        >
          <text
            class="i-tabler-book text-6xl text-indigo-500/80"
            :style="{
              filter: 'drop-shadow(0 4px 8px rgba(99, 102, 241, 0.2))',
            }"
          />
        </view>
        <view class="flex flex-col items-center gap-3">
          <text class="text-xl font-medium text-gray-700">记忆卡片使用指南</text>
          <view class="text-sm text-gray-500 leading-6 max-w-80">
            <view class="mb-3 text-center">让我们开始制作高效的记忆卡片吧！</view>
            <view class="space-y-2">
              <view class="flex items-start gap-2">
                <text class="i-tabler-point text-indigo-500"></text>
                <text>正面写下问题或概念</text>
              </view>
              <view class="flex items-start gap-2">
                <text class="i-tabler-point text-indigo-500"></text>
                <text>反面记录详细的解释</text>
              </view>
              <view class="flex items-start gap-2">
                <text class="i-tabler-point text-indigo-500"></text>
                <text>添加笔记以补充重要信息</text>
              </view>
              <view class="flex items-start gap-2">
                <text class="i-tabler-point text-indigo-500"></text>
                <text>定期复习提高记忆效果</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'

import QuotaExceededModal from '@/components/QuotaExceededModal.vue'
import { parseContentWithAI } from '@/services/ai'
import { useCardBoxStore, useSettingsStore, useUserStore, useFolderStore } from '@/store'
import { useAIParseStore } from '@/store/aiParse'

const { safeAreaInsets } = uni.getWindowInfo()
const cardBoxStore = useCardBoxStore()
const userStore = useUserStore()
const aiParseStore = useAIParseStore()
const settingsStore = useSettingsStore()
const folderStore = useFolderStore()
const { remainingCount } = storeToRefs(userStore)

const content = ref('')
const isParseResultShow = ref(false)
const cardBoxId = ref('')
const cardBoxName = ref('')
const cardItems = ref<{ frontContent: string; backContent: string; note?: string }[]>([])
const isLoading = ref(false)
const currentTipIndex = ref(0)
const scrollTop = ref(0)
const isQuotaDialogVisible = ref(false)
const currentMode = ref<'qa' | 'conversation' | 'vocabulary' | 'free'>('qa')
const showContent = ref(true)

const loadingTips = [
  '正在理解文本内容...',
  '分析知识点结构...',
  '生成记忆卡片...',
  '优化学习效果...',
  '马上就好...',
]

// 修改 onLoad 函数，只保留必要的逻辑
onLoad(async (options) => {
  await settingsStore.checkAIFeature()
  cardBoxId.value = options.cardBoxId
  uni.setNavigationBarTitle({
    title: settingsStore.showAIFeature ? `智能生成卡片` : '使用指南',
  })
})

// 修改解析模式定义
const parseModes = [
  {
    label: '问答卡片',
    value: 'qa',
    icon: 'i-tabler-message-question',
    description:
      '将文本转换为问答形式的卡片。我会提取重要知识点，生成启发的问题，适合记忆知识点和概念解释。',
    example: '填写建议：输入一段文本或者笔记，我将智能转换为问答形式的卡片',
  },
  {
    label: '英语对话',
    value: 'conversation',
    icon: 'i-tabler-messages',
    description: '生成中英对照的对话卡片。我在笔记中标注语法要点、地道表达、文化背景和易错点。',
    example:
      '填写建议：1. 输入一段中英文对话，我将帮你整理成卡片，或者告诉我想生成一段什么场景中的对话',
  },
  {
    label: '词汇提取',
    value: 'vocabulary',
    icon: 'i-tabler-vocabulary',
    description: '从文本中提取重要词汇和短语。正面显示词汇，反面包含释义、例句和用法说明。',
    example: '填写建议：输入一段文本或者笔记，我将智能提取重要词汇和短语 ',
  },
  {
    label: '自由生成',
    value: 'free',
    icon: 'i-tabler-brain',
    description:
      '根据你的描述智能生成记忆卡片。支持知识点、概念、公式、步骤等多种形式，我会将内容拆分为易于记忆的卡片。',
    example:
      '填写建议：\n1. 明确说明需要生成的卡片类型\n2. 指定卡片的正反面和笔记内容格式\n3. 列出需要包含的要点\n4. 可以是任何学习主题，描述的越详细效果越好噢',
  },
] as const

// 计算当前式的描述
const currentModeDescription = computed(() => {
  return parseModes.find((mode) => mode.value === currentMode.value)?.description
})

// 修改 scrollToTop 函数
const scrollToTop = () => {
  scrollTop.value = 0
  showContent.value = true
}

// 添加关闭后的处理函数
const handleAfterLeave = () => {
  showContent.value = false
}

// TODO: 调用 解析 API
const handleParse = async () => {
  if (!content.value) return

  isLoading.value = true
  currentTipIndex.value = 0
  const tipInterval = setInterval(() => {
    currentTipIndex.value = (currentTipIndex.value + 1) % loadingTips.length
  }, 2000)

  try {
    const result = await parseContentWithAI(content.value, currentMode.value)
    if (result) {
      const { cards, title } = result
      cardItems.value = cards.map(([front, back, note]) => ({
        frontContent: front,
        backContent: back,
        note: note || '',
      }))
      cardBoxName.value = title
      aiParseStore.setLastParseResult({
        mode: currentMode.value,
        cards: cardItems.value,
      })
      showContent.value = true
      scrollTop.value = 0
      isParseResultShow.value = true
    }
  } catch (e) {
    console.error(e)
    if ((e as Error).message === '超出使用限制') {
      isQuotaDialogVisible.value = true
    } else {
      uni.showToast({
        title: '生成失败，请重试',
        icon: 'error',
      })
    }
  } finally {
    clearInterval(tipInterval)
    isLoading.value = false
  }
}

const onReverseBtnClick = () => {
  cardItems.value = cardItems.value.map((item) => ({
    frontContent: item.backContent || '',
    backContent: item.frontContent || '',
    note: item.note || '',
  }))
}

const onImportBtnClick = () => {
  const cardsToImport = cardItems.value.map(({ frontContent, backContent, note }, index) => ({
    frontContent: frontContent || '',
    backContent: backContent || '',
    frontNote: '',
    backNote: note || '',
    index,
  }))

  if (cardBoxId.value) {
    // 如果有 cardBoxId，导入到现有卡盒
    cardBoxStore.importCardItems(cardBoxId.value, cardsToImport)
  } else {
    // 使用 AI 生成的卡盒名称创建新卡盒
    cardBoxStore.importCardBox({
      name: cardBoxName.value || '未命名卡盒',
      cards: cardsToImport,
      folderId: folderStore.currentFolderId,
    })
  }

  // 清除历史记录
  aiParseStore.clearParseResult()

  uni.navigateBack({
    delta: 1,
    success: () => {
      uni.$emit('scrollToTop')
    },
  })
}

// 修改 showLastParseResult 函数
const showLastParseResult = () => {
  if (aiParseStore.lastParseResult) {
    currentMode.value = aiParseStore.lastParseResult.mode
    cardItems.value = aiParseStore.lastParseResult.cards
    showContent.value = true
    scrollTop.value = 0
    isParseResultShow.value = true
  }
}

// 添加计算属性取当前模式的 placeholder
const currentPlaceholder = computed(() => {
  const mode = parseModes.find((mode) => mode.value === currentMode.value)
  return mode?.example || '将文本内容智能转换为记忆卡片'
})

// 在页面加载时检查功能状态
onLoad(async () => {
  await settingsStore.checkAIFeature()
})
</script>

<style>
/* 修改动画样式 */
@keyframes spin-slow {
  to {
    transform: rotate(360deg);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-4px) scale(1.02);
  }
}

@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-spin-slow {
  animation: spin-slow 4s linear infinite;
}

.animate-float {
  animation: float 2.5s ease-in-out infinite;
}

.animate-fade-in {
  animation: fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
