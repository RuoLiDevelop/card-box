<template>
  <wd-popup
    lockScroll
    customClass="rounded-t-3xl relative h-60vh"
    position="bottom"
    :safe-area-inset-bottom="true"
    :model-value="props.isShow"
    @close="$emit('close')"
  >
    <view class="overflow-hidden h-full flex flex-col">
      <view class="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <text class="font-semibold text-base">排序</text>
        <view class="flex items-center gap-2">
          <view
            class="text-sm text-gray-400 py-1 px-3 rounded-full"
            hoverClass="bg-gray-50"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="$emit('close')"
          >
            取消
          </view>
          <view
            class="text-sm text-indigo-500 py-1 px-3 rounded-full bg-indigo-50"
            hoverClass="bg-indigo-100"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="onSortBtnClick"
          >
            保存
          </view>
        </view>
      </view>

      <scroll-view
        scroll-y
        class="flex-1 relative"
        :scrollTop="scrollTop"
        scroll-with-animation
        :enhanced="true"
      >
        <movable-area
          class="movable-area"
          :style="{
            height: list.length * itemHeight + 'px',
          }"
        >
          <movable-view
            v-for="(item, index) in list"
            class="movable-item"
            :class="{ 'movable-item--active': oldIndex === index }"
            :style="{
              height: itemHeight + 'px',
              zIndex: oldIndex === index ? 10 : 1,
            }"
            :key="item.id"
            :x="item.x"
            :y="item.y + 'px'"
            direction="vertical"
            @change="handleChange"
            out-of-bounds
            :disabled="!onSorting"
          >
            <view class="item-content">
              <view
                class="drag-handle"
                @touchend="handleTouchEnd"
                @touchstart="handleDragStart(index)"
              >
                <text class="i-material-symbols-drag-indicator" />
              </view>

              <text class="item-text">{{ item.text }}</text>
            </view>
          </movable-view>
        </movable-area>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { ref } from 'vue'

import { useCardDataStore } from '@/store'

const props = defineProps<{
  type: 'cardBox' | 'cardItem'
  isShow: boolean
  cardBoxIndex: number
  cardBoxId: string
}>()
const { vibrate } = useVibrate()
const emit = defineEmits(['close'])
const { updateLockScroll } = inject('lockScroll', {
  updateLockScroll: () => {},
})
const onSorting = ref(false)
const currentIndex = ref(-1)
const oldIndex = ref(-1)
const targetIndex = ref(-1)
const cardDataStore = useCardDataStore()
const scrollTop = ref(0)

const maxItems = 13
const itemHeight = computed(() => 40)

onMounted(() => {
  scrollTop.value = 0
})

const initPosition = (arr: any[]) => {
  return arr.map((item, index) => {
    return {
      ...item,
      text: props.type === 'cardBox' ? item.name : item.frontContent,
      y: index * itemHeight.value,
      x: 0,
    }
  })
}

watch(
  () => props.isShow,
  (val) => {
    updateLockScroll(val)
    if (val) {
      if (props.type === 'cardBox') {
        list.value = _.cloneDeep(initPosition(cardDataStore.cardBoxList))
      } else {
        const cardBox = cardDataStore.cardBoxes[props.cardBoxId]
        if (cardBox) {
          const cardItems = Object.entries(cardBox.cardItems)
            .map(([id, item]) => ({
              id,
              ...item,
            }))
            .sort((a, b) => a.index - b.index)

          list.value = _.cloneDeep(initPosition(cardItems))
        }
      }
    }
  },
  {
    immediate: true,
  },
)

const list = ref([])

const handleDragStart = (index) => {
  vibrate()
  currentIndex.value = index
  oldIndex.value = index
  onSorting.value = true
}

const handleChange = (e) => {
  if (e.detail.source !== 'touch' || !onSorting.value) {
    return
  }

  const { y } = e.detail
  const currentY = Math.floor((y + itemHeight.value / 2) / itemHeight.value)
  targetIndex.value = Math.min(currentY, list.value.length - 1)

  if (targetIndex.value !== currentIndex.value && targetIndex.value >= 0) {
    const newList = _.cloneDeep(list.value)
    const elementToMove = newList.splice(oldIndex.value, 1)[0]
    newList.splice(targetIndex.value, 0, elementToMove)
    scrollList()

    list.value.forEach((item, index) => {
      // 当前项通过手动拖动已经到了指定位置，因此需要重新排序其他项的高度
      if (index !== oldIndex.value) {
        // 找到所有项在新数组中的位置
        const newItemIndex = newList.findIndex((newItem) => newItem.id === item.id)
        // 根据新数组的位置重新置y值
        item.y = newItemIndex * itemHeight.value
      }
    })

    nextTick(() => {
      currentIndex.value = targetIndex.value
    })
  }
}

const scrollList = () => {
  const middleIndex = (maxItems - 1) / 2
  if (targetIndex.value > middleIndex) {
    scrollTop.value = (targetIndex.value - middleIndex) * itemHeight.value
  } else {
    scrollTop.value = 0.1
    nextTick(() => {
      scrollTop.value = 0
    })
  }
}

const handleTouchEnd = () => {
  if (!onSorting.value) return
  vibrate()
  onSorting.value = false
  list.value[oldIndex.value].y = targetIndex.value * itemHeight.value
  list.value = initPosition(list.value.sort((item1, item2) => item1.y - item2.y))
  oldIndex.value = -1
  currentIndex.value = -1
  targetIndex.value = -1
}

const onSortBtnClick = () => {
  if (props.type === 'cardBox') {
    // 更新卡盒排序
    const newOrder = list.value.map((item, index) => ({
      id: item.id,
      index,
    }))

    newOrder.forEach(({ id, index }) => {
      if (cardDataStore.cardBoxes[id]) {
        cardDataStore.cardBoxes[id].index = index
      }
    })

    // 只重排卡盒
    cardDataStore.reorderCardBoxes()
  } else if (props.type === 'cardItem') {
    // 更新卡片排序
    const cardBox = cardDataStore.cardBoxes[props.cardBoxId]
    if (cardBox) {
      // 先创建一个新的临时对象来存储更新后的卡片
      const updatedCardItems = {}

      // 按照新顺序重新构建卡片列表
      list.value.forEach((item, index) => {
        if (cardBox.cardItems[item.id]) {
          // 保持原有属性不变，只更新 index
          updatedCardItems[item.id] = {
            ...cardBox.cardItems[item.id],
            index,
          }
        }
      })

      // 使用 Object.keys 获取所有卡片 ID 并按新的索引排序
      const sortedIds = Object.keys(updatedCardItems).sort(
        (a, b) => updatedCardItems[a].index - updatedCardItems[b].index,
      )

      // 按排序后的顺序重新构建 cardItems 对象
      const newCardItems = {}
      sortedIds.forEach((id) => {
        newCardItems[id] = updatedCardItems[id]
      })

      // 更新 cardItems
      cardBox.cardItems = newCardItems
    }
  }

  emit('close')
}
</script>

<style scoped>
.container {
  width: 100vw;
  height: 100%;
}

.movable-area {
  position: relative;
  width: 100%;
  padding: 0 1rem;
}

.movable-item {
  width: 100%;
  background-color: white;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.movable-item--active {
  background-color: #f8f8f8;
}

.item-content {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0 1rem;
}

.drag-handle {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  margin-right: 0.5rem;
  font-size: 1.25rem;
  color: #999;
}

.item-text {
  width: 65vw;
  overflow: hidden;
  font-size: 0.875rem;
  color: #333;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
