<template>
  <wd-popup
    customClass="rounded-2xl w-85vw"
    :modelValue="modelValue"
    @close="emits('update:modelValue', false)"
    lockScroll
  >
    <view class="overflow-hidden">
      <!-- 标题栏 -->
      <view class="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <text class="text-base font-semibold">导出卡片</text>
        <view
          class="text-sm text-gray-400 py-1 px-3 rounded-full"
          hoverClass="bg-gray-50"
          :hoverStartTime="0"
          :hoverStayTime="200"
          @tap="emits('update:modelValue', false)"
        >
          关闭
        </view>
      </view>

      <view class="p-4 flex flex-col gap-4">
        <view class="text-sm text-gray-600 leading-relaxed">
          在添加卡盒时选择
          <text class="text-indigo-500 font-medium">导入卡片至新卡盒</text>
          ，将内容粘贴在表单中即可解析为新卡片
        </view>

        <view class="bg-gray-50 rounded-xl h-300px overflow-auto p-3">
          <text class="text-sm text-gray-600">{{ joinedCardBoxContent }}</text>
        </view>

        <view
          class="py-2.5 px-4 bg-indigo-50 text-indigo-500 rounded-xl font-medium transition-all flex items-center gap-2 justify-center"
          hoverClass="bg-indigo-100 opacity-80"
          :hoverStartTime="0"
          :hoverStayTime="200"
          @tap="onCopy"
        >
          <text class="i-tabler-copy"></text>
          <text>复制内容</text>
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { useCardDataStore } from '@/store'
const cardDataStore = useCardDataStore()
const props = defineProps<{
  modelValue: boolean
  cardBoxId: string
  cardBoxIndex?: number
}>()
const emits = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()
const { updateLockScroll } = inject('lockScroll', {
  updateLockScroll: () => {},
})

const cardBoxData = computed(() => {
  const box = cardDataStore.cardBoxList.find((box) => box.id === props.cardBoxId)
  return box || { cardItems: [] }
})

const cardItems = computed(() => cardBoxData.value?.cardItems || [])

const joinedCardBoxContent = computed(() => {
  return cardBoxData.value.cardItems
    .map((item) => {
      const frontContent = (item.frontContent || '').replaceAll('\n', ' ')
      const backContent = item.backContent ? `||${item.backContent.replaceAll('\n', ' ')}` : ''
      return `${frontContent}${backContent}`
    })
    .join('\n')
})

const onCopy = () => {
  uni.setClipboardData({
    data: joinedCardBoxContent.value,
    success() {
      emits('update:modelValue', false)
    },
  })
}
//

watch(
  () => props.modelValue,
  (val) => {
    updateLockScroll(val)
  },
)
</script>

<style lang="scss" scoped>
//
</style>
