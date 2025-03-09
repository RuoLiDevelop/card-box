<template>
  <wd-popup
    lockScroll
    customClass="rounded-3xl w-[300px] overflow-hidden"
    position="center"
    :modelValue="modelValue"
    @close="$emit('update:modelValue', false)"
    transition="fade-up"
  >
    <view class="flex flex-col overflow-hidden" v-if="modelValue">
      <!-- 标题 -->
      <view class="pt-6 px-6 text-center">
        <text class="text-lg font-semibold text-gray-800">{{ title }}</text>
      </view>

      <!-- 输入框容器 -->
      <view v-if="editable" class="mt-4 px-6">
        <input
          ref="inputRef"
          class="w-full h-10 px-3 border border-gray-200 rounded-lg text-base bg-gray-50/50 box-border"
          :placeholder="placeholder"
          v-model="inputValue"
          @input="onInput"
          adjustPosition
        />
      </view>

      <!-- 提示内容 -->
      <view v-if="content" class="mt-4 px-6 text-sm text-gray-500 text-center break-all">
        {{ content }}
      </view>

      <!-- 按钮组 -->
      <view class="mt-4 flex">
        <view
          class="flex-1 py-4 text-center text-base transition-colors text-gray-600 border-t border-gray-100 hover:bg-gray-50"
          :hoverStartTime="0"
          :hoverStayTime="200"
          @tap="onCancel"
        >
          取消
        </view>
        <view class="w-[1px] bg-gray-100"></view>
        <view
          class="flex-1 py-4 text-center text-base transition-colors font-medium border-t border-gray-100"
          :class="[danger ? 'text-red-500' : 'text-indigo-500 ']"
          :hoverStartTime="0"
          :hoverStayTime="200"
          @tap="onConfirm"
        >
          确定
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
const props = defineProps<{
  modelValue: boolean
  title: string
  content?: string
  editable?: boolean
  placeholder?: string
  danger?: boolean
  defaultValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', value?: string): void
  (e: 'cancel'): void
}>()

const inputValue = ref('')
const inputRef = ref<HTMLInputElement>()

const onConfirm = () => {
  if (props.editable && !inputValue.value) return
  emit('confirm', inputValue.value)
  emit('update:modelValue', false)
  inputValue.value = ''
}

const onCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
  inputValue.value = ''
}

const onInput = () => {
  // 可以在这里添加输入验证逻辑
}

watch(
  () => props.defaultValue,
  (newVal) => {
    if (newVal && props.modelValue) {
      inputValue.value = newVal
    }
  },
  { immediate: true },
)

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && props.defaultValue) {
      inputValue.value = props.defaultValue
    }
  },
)
</script>

<style scoped>
:deep(.wd-popup) {
  overflow: hidden;
}
</style>

export default defineComponent({ name: 'ConfirmModal' })
