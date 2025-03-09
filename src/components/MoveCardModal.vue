<template>
  <!-- 添加占位容器 -->
  <view v-if="show" class="h-[70vh]" />

  <wd-popup
    v-model="show"
    position="bottom"
    :safe-area-inset-bottom="true"
    customClass="rounded-t-3xl overflow-hidden"
  >
    <view class="overflow-hidden" :style="{ height: '70vh' }">
      <!-- 标题栏 -->
      <view class="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <text class="text-base font-semibold">移动到其他卡盒</text>
      </view>

      <!-- 目录标签 -->
      <view class="flex-none px-3 py-2 flex gap-2 overflow-x-auto border-b border-gray-100">
        <view
          v-for="folder in cardDataStore.folderList"
          :key="folder.id"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm whitespace-nowrap transition-colors"
          :class="
            currentFolderId === folder.id
              ? 'bg-indigo-50 text-indigo-600 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]'
              : 'bg-transparent text-gray-500 hover:bg-gray-50'
          "
          @tap="currentFolderId = folder.id"
        >
          <text
            :class="[
              currentFolderId === folder.id ? 'i-tabler-folder-open' : 'i-tabler-folder',
              'text-base',
            ]"
          />
          {{ folder.name }}
          <text class="ml-1 opacity-60">({{ getCardBoxCountInFolder(folder.id) }})</text>
        </view>
      </view>

      <!-- 卡盒列表 -->
      <scroll-view scroll-y class="h-[calc(70vh-56px)]">
        <view class="p-4 space-y-3">
          <view
            v-for="box in filteredCardBoxes"
            :key="box.id"
            class="flex items-center gap-3 p-4 bg-gray-50/80 rounded-xl transition-colors"
            :class="selectedBoxId === box.id ? 'bg-indigo-50 shadow-sm' : 'hover:bg-gray-100/80'"
            @tap="selectedBoxId = box.id"
          >
            <view class="flex-1">
              <text class="text-sm text-gray-700">{{ box.name }}</text>
              <text class="block text-xs text-gray-400 mt-1">
                {{ box.cardItems.length }} 张卡片
              </text>
            </view>
            <view
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
              :class="[
                selectedBoxId === box.id
                  ? 'border-indigo-500 bg-indigo-500'
                  : 'border-gray-300 bg-white',
              ]"
            >
              <text v-if="selectedBoxId === box.id" class="i-tabler-check text-white text-xs" />
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 底部按钮 -->
      <view
        class="absolute bottom-0 left-0 right-0 px-4 py-3 border-t border-gray-100 bg-white safe-area-bottom"
      >
        <view class="flex gap-3 mb-2">
          <view
            class="flex-1 py-2.5 text-center text-sm rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            @tap="show = false"
            hoverClass="scale-97 origin-center transition-transform"
            :hoverStayTime="200"
            :hoverStartTime="0"
          >
            取消
          </view>
          <view
            class="flex-1 py-2.5 rounded-lg text-center text-sm"
            :class="[
              selectedBoxId
                ? 'bg-indigo-50 text-indigo-500'
                : 'bg-gray-100 text-gray-400 pointer-events-none',
            ]"
            hoverClass="scale-97 origin-center transition-transform"
            :hoverStayTime="200"
            :hoverStartTime="0"
            @tap="handleMove"
          >
            确认移动
          </view>
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script setup lang="ts">
import { useCardDataStore, useCardItemStore } from '@/store'

const props = defineProps<{
  modelValue: boolean
  cardBoxId: string
  selectedCardIds: string[]
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const cardDataStore = useCardDataStore()
const cardItemStore = useCardItemStore()

// 获取其他卡盒列表
const otherCardBoxes = computed(() =>
  cardDataStore.cardBoxList.filter((box) => box.id !== props.cardBoxId),
)

const selectedBoxId = ref('')

// 移动卡片
const handleMove = async () => {
  if (!selectedBoxId.value) return

  cardItemStore.moveCardItems({
    fromCardBoxId: props.cardBoxId,
    toCardBoxId: selectedBoxId.value,
    cardItemIds: props.selectedCardIds,
  })

  show.value = false
  selectedBoxId.value = ''
  emit('success')

  uni.showToast({
    title: '移动成功',
    icon: 'none',
  })
}

// 监听弹窗关闭时重置选中状态
watch(show, (val) => {
  if (!val) {
    selectedBoxId.value = ''
  }
})

const currentFolderId = ref('default')

// 过滤当前文件夹的卡盒
const filteredCardBoxes = computed(() =>
  Object.entries(cardDataStore.cardBoxes)
    .filter(([id, box]) => box.folderId === currentFolderId.value && id !== props.cardBoxId)
    .sort((a, b) => a[1].index - b[1].index)
    .map(([id, box]) => ({ id, ...box })),
)

// 获取文件夹中的卡盒数量
const getCardBoxCountInFolder = (folderId: string) => {
  return Object.values(cardDataStore.cardBoxes).filter((box) => box.folderId === folderId).length
}

// 注入 lockScroll
const { updateLockScroll } = inject<{
  updateLockScroll: (val: boolean) => void
}>('lockScroll', {
  updateLockScroll: () => {},
})

// 监听弹窗显示状态，控制滚动锁定
watch(show, (val) => {
  updateLockScroll(val)
  if (!val) {
    selectedBoxId.value = ''
  }
})
</script>
