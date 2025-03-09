<template>
  <view class="sticky bottom-8 flex w-90% z-4 mx-auto -mt-48px">
    <template v-if="isMultiSelectMode">
      <view
        @tap="onDeleteSelectedTap"
        :class="[
          btnClass,
          'flex-1 rounded-r-none border-r border-gray-2/50 border-r-solid transform-origin-center text-red-500',
        ]"
        hoverClass="!scale-97"
      >
        <view class="i-tabler-trash"></view>
        <view>删除选中</view>
      </view>

      <view
        @tap="onExitMultiSelectMode"
        :class="[btnClass, 'flex-1 rounded-l-none transform-origin-center']"
        hoverClass="!scale-97"
      >
        <view class="i-tabler-x"></view>
        <view>取消选择</view>
      </view>
    </template>

    <template v-else>
      <view
        @tap="onAddCardItemBtnClick"
        :class="[
          btnClass,
          'flex-1 rounded-r-none border-r border-gray-2/50 border-r-solid transform-origin-center',
        ]"
        hoverClass="!scale-97"
        :hoverStartTime="0"
        :hoverStayTime="200"
      >
        <view class="i-tabler-square-plus-2"></view>
        <view>添加卡片</view>
      </view>

      <view
        @tap="onMoreBtnClick"
        :class="[btnClass, 'rounded-l-none transform-origin-center']"
        hoverClass="!scale-97"
        :hoverStartTime="0"
        :hoverStayTime="200"
      >
        <view class="i-tabler-dots"></view>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import { useCardBoxStore, useCardItemStore } from '@/store'

const { vibrate } = useVibrate()
const cardItemStore = useCardItemStore()

const props = defineProps<{
  cardBoxId: string
  animation: boolean
  lockScroll: boolean
}>()

const emit = defineEmits<{
  (e: 'showActionSheet'): void
}>()

const btnClass = computed(
  () =>
    'bg-white/90 text-sm rounded-4 p-2 backdrop-blur-sm mx-auto text-gray-7 text-center scale-100 flex justify-center items-center gap-2 w-40px',
)

const isMultiSelectMode = computed(() => cardItemStore.isMultiSelectMode(props.cardBoxId))
const selectedCount = computed(() => cardItemStore.getSelectedCardItems(props.cardBoxId).length)

const onAddCardItemBtnClick = () => {
  vibrate()
  cardItemStore.addCardItem(props.cardBoxId)
}

const onMoreBtnClick = () => {
  emit('showActionSheet')
}

const onDeleteSelectedTap = () => {
  vibrate()
  uni.showModal({
    title: '确认删除',
    content: `确定要删除选中的 ${selectedCount.value} 张卡片吗？此操作不可撤销。`,
    confirmColor: '#ef4444',
    success: (res) => {
      if (res.confirm) {
        cardItemStore.deleteSelectedCardItems(props.cardBoxId)
        cardItemStore.exitMultiSelectMode(props.cardBoxId)
      }
    },
  })
}

const onExitMultiSelectMode = () => {
  vibrate()
  cardItemStore.exitMultiSelectMode(props.cardBoxId)
}
</script>

<style scoped>
@keyframes slide-in-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
