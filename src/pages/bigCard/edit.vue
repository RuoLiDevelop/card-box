<route lang="json5">
{
  style: {
    navigationBarTitleText: '编辑卡片',
  },
  layout: false,
}
</route>

<template>
  <view class="min-h-screen bg-gray-50 relative">
    <view class="flex flex-col h-screen bg-[#f8f9fa]">
      <!-- 顶部操作栏 -->
      <view
        class="sticky top-0 z-10 p-3 bg-white/90 backdrop-blur-sm"
        :style="{
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }"
      >
        <!-- 原有的操作栏内容 -->
        <view class="flex items-center justify-between">
          <!-- 正反面切换 -->
          <view class="inline-flex h-7 bg-[#f1f3f5] rounded-lg overflow-hidden p-0.5">
            <view
              class="h-full px-4 flex items-center justify-center transition-all duration-200"
              :class="
                selectedSide === 'front'
                  ? 'bg-white shadow-sm text-gray-700 rounded-md'
                  : 'text-gray-500'
              "
              @tap="selectedSide = 'front'"
            >
              <text class="text-[13px] font-medium">正面</text>
            </view>
            <view
              class="h-full px-4 flex items-center justify-center transition-all duration-200"
              :class="
                selectedSide === 'back'
                  ? 'bg-white shadow-sm text-gray-700 rounded-md'
                  : 'text-gray-500'
              "
              @tap="selectedSide = 'back'"
            >
              <text class="text-[13px] font-medium">反面</text>
            </view>
          </view>

          <!-- 操作按钮组 -->
          <view class="flex items-center gap-2">
            <!-- 只在新建模式下显示按钮 -->
            <view
              v-if="isNew"
              class="h-7 px-3 text-[13px] font-medium flex items-center justify-center rounded-lg transition-all duration-200"
              :class="[canSave ? 'bg-indigo-50 text-indigo-500' : 'bg-gray-100 text-gray-400']"
              :style="canSave ? 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1)' : ''"
              @tap="onCompleteBtnClick"
            >
              添加
            </view>
          </view>
        </view>
      </view>

      <!-- 内容区域 -->
      <scroll-view scroll-y class="flex-1">
        <view class="p-4">
          <!-- 正面/反面内容 -->
          <view class="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
            <view class="flex items-center gap-1 text-gray-400 text-sm px-4 pt-3">
              <text class="i-tabler-play-card" />
              <text>{{ selectedSide === 'front' ? '正面' : '反面' }}</text>
            </view>
            <view class="p-4">
              <Editor
                v-if="selectedSide === 'front'"
                v-model="frontCardContent"
                :placeholder="'请输入卡片正面内容...'"
                id="editor-front"
                ref="frontEditorRef"
              />
              <Editor
                v-else
                v-model="backCardContent"
                :placeholder="'请输入卡片背面内容...'"
                id="editor-back"
                ref="backEditorRef"
              />
            </view>
          </view>

          <!-- 笔记区域 -->
          <view class="bg-white rounded-xl shadow-sm p-4 mb-8">
            <view class="flex justify-between items-center mb-3">
              <text class="text-sm font-medium text-gray-600">笔记</text>
              <GenerateNoteButton
                :show-button="canShowGenerateButton"
                :front-content="frontCardContent"
                :back-content="backCardContent"
                :side="selectedSide"
                @success="handleGenerateNoteSuccess"
              />
            </view>

            <Editor
              v-if="selectedSide === 'front'"
              id="editor-front-note"
              v-model="frontNoteContent"
              :placeholder="'添加笔记...'"
              ref="frontEditorRef"
            />

            <Editor
              v-if="selectedSide === 'back'"
              id="editor-back-note"
              v-model="backNoteContent"
              :placeholder="'添加笔记...'"
              ref="backEditorRef"
            />
          </view>
        </view>
      </scroll-view>

      <!-- 使用 GenerateNotePopup 组件替换原有的预览弹窗 -->
      <GenerateNotePopup
        v-model="showNotePreview"
        :notes="generatedNotes"
        @close="showNotePreview = false"
        @confirm="handleInsertNotes"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import _ from 'lodash'

import Editor from '@/components/Editor.vue'
import GenerateNoteButton from '@/components/GenerateNoteButton.vue'
import GenerateNotePopup from '@/components/GenerateNotePopup.vue'
import { useCardDataStore, useSettingsStore, useCardItemStore } from '@/store'
import { EditorContext } from '@/types/global'
const settingsStore = useSettingsStore()
const cardDataStore = useCardDataStore()
const cardItemStore = useCardItemStore()
const selectedSide = ref<'front' | 'back'>('front')
const frontCardContent = ref('')
const backCardContent = ref('')
const frontNoteContent = ref('')
const backNoteContent = ref('')

// 添加本地内容状态
const localContent = ref({
  frontContent: '',
  backContent: '',
  frontNote: '',
  backNote: '',
})

// 获取页面参数
const cardBoxId = ref('')
const cardItemId = ref('')
const isNew = ref(false)
const fromRelate = ref(false)

// 修改 watch 逻辑，只在本地维护状态
watch(
  [frontCardContent, backCardContent, frontNoteContent, backNoteContent],
  ([newFront, newBack, newFrontNote, newBackNote]) => {
    // 不再实时保存到 store，而是在本地维护状态
    localContent.value = {
      frontContent: newFront,
      backContent: newBack,
      frontNote: newFrontNote,
      backNote: newBackNote,
    }
  },
  { deep: true },
)

// 添加页面卸载时的保存逻辑
onUnload(() => {
  if (!isNew.value) {
    // 在页面卸载时保存最新内容到 store
    cardItemStore.updateCardItemContent(cardBoxId.value, cardItemId.value, {
      frontContent: frontCardContent.value,
      backContent: backCardContent.value,
      frontNote: frontNoteContent.value,
      backNote: backNoteContent.value,
    })
  }
})

onLoad(
  (query: {
    cardBoxId: string
    cardItemId?: string
    isFlip?: string
    isNew?: string
    fromRelate?: string
  }) => {
    const {
      cardBoxId: boxId,
      cardItemId: itemId,
      isFlip,
      isNew: newCard,
      fromRelate: isFromRelate,
    } = query
    cardBoxId.value = boxId
    cardItemId.value = itemId || ''
    selectedSide.value = isFlip === 'true' ? 'back' : 'front'
    isNew.value = newCard === 'true'
    fromRelate.value = isFromRelate === 'true'

    // 设置页面标题
    uni.setNavigationBarTitle({
      title: isNew.value ? '添加卡片' : '编辑卡片',
    })

    if (!isNew.value && itemId) {
      // 获取已有卡片数据
      const cardItem = cardDataStore.cardBoxes[boxId].cardItems[itemId]

      if (cardItem) {
        frontCardContent.value = cardItem.frontContent || ''
        backCardContent.value = cardItem.backContent || ''
        frontNoteContent.value = cardItem.frontNote || ''
        backNoteContent.value = cardItem.backNote || ''
      }
    }

    settingsStore.checkAIFeature()
  },
)

const onCompleteBtnClick = () => {
  if (!canSave.value) return

  // 创建新卡片
  const cardItemId = cardItemStore.addCardItem(cardBoxId.value, {
    frontContent: frontCardContent.value,
    backContent: backCardContent.value,
    frontNote: frontNoteContent.value,
    backNote: backNoteContent.value,
  })

  // 如果是从关联页面来的，需要通知关联页面新卡片的ID
  if (fromRelate.value) {
    uni.$emit('onNewCardCreated', {
      cardId: cardItemId,
      cardBoxId: cardBoxId.value,
    })
  }

  // 发送卡片添加成功事件
  uni.$emit('cardAdded')

  uni.navigateBack()
}

const canShowGenerateButton = computed(() => {
  const currentContent =
    selectedSide.value === 'front' ? frontCardContent.value : backCardContent.value
  return settingsStore.showAIFeature && currentContent && currentContent.trim().length >= 3
})

const showNotePreview = ref(false)
const generatedNotes = ref<string[]>([])

const handleGenerateNoteSuccess = (notes: string[]) => {
  generatedNotes.value = notes
  showNotePreview.value = true
}

const frontEditorRef = ref<{ editorCtx: EditorContext } | null>(null)
const backEditorRef = ref<{ editorCtx: EditorContext } | null>(null)

const handleInsertNotes = (selectedContent: string[]) => {
  // 获取当前输入框的内容
  const currentContent =
    selectedSide.value === 'front' ? frontNoteContent.value : backNoteContent.value

  // 在当前内容末尾添加新笔记
  const newContent = currentContent
    ? `${currentContent.trim()}\n\n${selectedContent.join('\n\n')}`
    : selectedContent.join('\n\n')

  // 更新对应面的笔记内容
  if (selectedSide.value === 'front') {
    frontNoteContent.value = newContent
    frontEditorRef.value?.editorCtx.setContents({
      html: newContent,
    })
  } else {
    backNoteContent.value = newContent
    backEditorRef.value?.editorCtx.setContents({
      html: newContent,
    })
  }
}

const canSave = computed(() => {
  return frontCardContent.value.trim() || backCardContent.value.trim()
})
</script>

<style scoped>
textarea {
  width: 100% !important;
}

::-webkit-input-placeholder {
  color: #94a3b8;
}

textarea {
  font-size: 15px !important;
}
</style>
