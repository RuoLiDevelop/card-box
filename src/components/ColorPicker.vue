<template>
  <wd-popup
    customClass="rounded-t-3xl overflow-hidden"
    :modelValue="modelValue"
    @close="$emit('update:modelValue', false)"
    position="bottom"
    :safe-area-inset-bottom="true"
  >
    <view class="overflow-hidden">
      <!-- 标题栏 -->
      <view class="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <text class="text-base font-semibold">选择卡盒颜色</text>
        <view
          class="text-sm text-gray-400 py-1.5 px-4 rounded-full hover:bg-gray-50"
          :hoverStartTime="0"
          :hoverStayTime="200"
          @tap="$emit('update:modelValue', false)"
        >
          关闭
        </view>
      </view>

      <!-- 颜色网格 -->
      <view class="p-4">
        <!-- 操作按钮组 -->
        <view class="mb-4">
          <view class="grid grid-cols-3 gap-3">
            <view class="flex flex-col items-center" @tap="handleUnifyColors">
              <view
                class="w-full h-12 rounded-lg flex items-center justify-center transition-colors mb-1"
                :class="[
                  currentSystem === 'warm'
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50'
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50',
                ]"
                hoverClass="scale-95 transition-all origin-center"
                :hoverStartTime="0"
                :hoverStayTime="200"
              >
                <text
                  class="i-tabler-color-swatch text-lg"
                  :class="[currentSystem === 'warm' ? 'text-amber-500' : 'text-blue-500']"
                />
              </view>
              <text class="text-xs text-gray-700">{{ getSystemName(currentSystem) }}系</text>
            </view>

            <view class="flex flex-col items-center" @tap="handleRainbowColors">
              <view
                class="w-full h-12 rounded-lg flex items-center justify-center transition-colors bg-gray-50/80 hover:bg-gray-100/80 mb-1"
                hoverClass="scale-95 transition-all origin-center"
                :hoverStartTime="0"
                :hoverStayTime="200"
              >
                <text class="i-tabler-bleach-no-chlorine text-lg text-gray-500" />
              </view>
              <text class="text-xs text-gray-700">彩虹色</text>
            </view>

            <view class="flex flex-col items-center" @tap="handleUnifyAll">
              <view
                class="w-full h-12 rounded-lg flex items-center justify-center transition-colors bg-gray-50/80 hover:bg-gray-100/80 mb-1"
                hoverClass="scale-95 transition-all origin-center"
                :hoverStartTime="0"
                :hoverStayTime="200"
              >
                <text class="i-tabler-color-filter text-lg text-gray-500" />
              </view>
              <text class="text-xs text-gray-700">统一颜色</text>
            </view>
          </view>
        </view>

        <!-- 颜色网格 -->
        <view class="grid grid-cols-4 gap-4">
          <view
            v-for="(gradient, index) in gradients"
            :key="index"
            class="relative aspect-square rounded-xl shadow-sm transition-all duration-200 overflow-hidden"
            :class="[currentColor === index ? 'ring-2 ring-indigo-500 ring-offset-2' : '']"
            :style="{ background: gradient }"
            :hoverClass="'scale-95 shadow-md'"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="handleSelect(index)"
          >
            <!-- 选中标记 -->
            <view
              v-if="currentColor === index"
              class="absolute right-1 bottom-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center"
            >
              <text class="i-tabler-check text-xs text-white" />
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 确认弹窗 -->
    <ConfirmModal
      v-model="showConfirmModal"
      :title="confirmModalConfig.title"
      :content="confirmModalConfig.content"
      @confirm="confirmModalConfig.onConfirm"
    />
  </wd-popup>
</template>

<script lang="ts" setup>
import { gradients, getColorSystem, colorSystems, getSystemName } from '@/constants/gradients'
import { useCardBoxStore, useCardDataStore } from '@/store'

import ConfirmModal from './ConfirmModal.vue'

const props = defineProps<{
  modelValue: boolean
  cardBoxId: string
  initialColor?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', index: number): void
}>()

const cardDataStore = useCardDataStore()
const cardBoxStore = useCardBoxStore()

// 获取当前卡盒的颜色
const currentColor = computed(() => {
  return cardBoxStore.getCardBoxColor(props.cardBoxId)
})

// 初始选中颜色
const selectedColor = ref(currentColor.value)

const handleSelect = (index: number) => {
  vibrate()
  cardBoxStore.updateCardBoxColor(props.cardBoxId, index)
  // 移除自动关闭
  // emit('update:modelValue', false)
}

const { vibrate } = useVibrate()

const showConfirmModal = ref(false)
const confirmModalConfig = reactive({
  title: '',
  content: '',
  onConfirm: () => {},
})

const currentSystem = computed(() => getColorSystem(currentColor.value))

// 处理统一色系
const handleUnifyColors = () => {
  vibrate()
  confirmModalConfig.title = '统一色系'
  confirmModalConfig.content = `是否将当前文件夹下的所有卡盒统一为${getSystemName(currentSystem.value)}系？`
  confirmModalConfig.onConfirm = confirmUnifyColors
  showConfirmModal.value = true
}

// 处理渐变排布
const handleRainbowColors = () => {
  vibrate()
  confirmModalConfig.title = '设置彩虹色'
  confirmModalConfig.content = '是否将当前文件夹下的所有卡盒按顺序应用渐变色？'
  confirmModalConfig.onConfirm = confirmRainbowColors
  showConfirmModal.value = true
}

// 处理统一当前色
const handleUnifyAll = () => {
  vibrate()
  confirmModalConfig.title = '统一颜色'
  confirmModalConfig.content = '是否将当前文件夹下的所有卡盒统一为当前选中的颜色？'
  confirmModalConfig.onConfirm = confirmUnifyAll
  showConfirmModal.value = true
}

// 确认统一色系
const confirmUnifyColors = () => {
  const system = currentSystem.value
  const systemColors = [...colorSystems[system]]

  // 找到当前颜色在色系中的位置
  const currentColorIndex = systemColors.indexOf(currentColor.value)

  // 如果当前颜色不在目标色系中，从色系的第一个颜色开始
  const startIndex = currentColorIndex >= 0 ? currentColorIndex : 0

  cardDataStore.cardBoxList.forEach((cardBox, index) => {
    // 从当前颜色开始，循环使用色系中的颜色
    const colorIndex = systemColors[(startIndex + index) % systemColors.length]
    cardBoxStore.updateCardBoxColor(cardBox.id, colorIndex)
  })

  showConfirmModal.value = false
}

// 确认渐变排布
const confirmRainbowColors = () => {
  cardDataStore.cardBoxList.forEach((cardBox, index) => {
    const colorIndex = index % gradients.length
    cardBoxStore.updateCardBoxColor(cardBox.id, colorIndex)
  })

  showConfirmModal.value = false
}

// 确认统一当前色
const confirmUnifyAll = () => {
  cardDataStore.cardBoxList.forEach((cardBox) => {
    cardBoxStore.updateCardBoxColor(cardBox.id, currentColor.value)
  })

  showConfirmModal.value = false
}
</script>

<style scoped></style>
