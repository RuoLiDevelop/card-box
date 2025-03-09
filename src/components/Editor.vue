<template>
  <view class="relative">
    <!-- 编辑器区域 -->
    <editor
      :id="editorId"
      :model-value="htmlContent"
      class="w-full bg-gray-50/50 rounded-xl p-3 text-sm min-h-[120px] text-base"
      :placeholder="placeholder || '请输入内容...'"
      @ready="onEditorReady"
      @input="handleInput"
      :read-only="isReadOnly"
    />
  </view>
</template>

<script setup lang="ts">
import { EditorContext } from '@/types/global'
import nanoid from '@/utils/nanoid'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  id?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
}>()

// 编辑器内部 HTML 内容
const htmlContent = ref(props.modelValue)
// 编辑器上下文
const editorCtx = ref<EditorContext | null>(null)
const isReadOnly = ref(true)

// 生成唯一 id
const editorId = computed(() => props.id || `editor-${nanoid()}`)
const instance = getCurrentInstance()

// 初始化编辑器
const onEditorReady = () => {
  uni
    .createSelectorQuery()
    .in(instance)
    .select(`#${editorId.value}`)
    .context((res: any) => {
      editorCtx.value = res.context
      // 只设置初始内容，不自动聚焦
      if (editorCtx.value && props.modelValue) {
        editorCtx.value.setContents({ html: props.modelValue })
      }
      isReadOnly.value = false
    })
    .exec()
}

// 处理输入
const handleInput = (e: any) => {
  // 保存 HTML 内容
  htmlContent.value = e.detail.html || ''
  // 向外发送纯文本
  emit('update:modelValue', e.detail.text || '')
}

defineExpose({
  editorCtx,
})
</script>

<style scoped>
:deep([id^='editor']) {
  caret-color: rgb(99, 102, 241);
}
</style>
