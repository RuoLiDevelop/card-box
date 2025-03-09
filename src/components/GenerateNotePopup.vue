<template>
  <wd-popup
    v-model="showNotePreview"
    position="bottom"
    :safe-area-inset-bottom="true"
    customClass="rounded-t-3xl overflow-hidden"
    @after-leave="selectedNotes = []"
  >
    <view class="overflow-hidden h-[70vh]">
      <!-- 标题栏 -->
      <view class="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <text class="text-base font-semibold">预览生成的笔记</text>
        <view class="flex items-center gap-2">
          <view
            class="text-sm text-indigo-500 py-1 px-3 rounded-full"
            hoverClass="bg-indigo-50"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="handleSelectAll"
          >
            {{ isAllSelected ? '取消全选' : '全选' }}
          </view>
          <view
            class="text-sm text-gray-400 py-1 px-3 rounded-full"
            hoverClass="bg-gray-50"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="$emit('close')"
          >
            关闭
          </view>
        </view>
      </view>

      <!-- 笔记内容 -->
      <view class="flex flex-col h-[calc(100%-56px)]">
        <scroll-view scroll-y class="flex-1">
          <view class="px-6 py-4">
            <checkbox-group @change="onCheckboxChange">
              <view
                v-for="(note, index) in notes"
                :key="index"
                class="flex items-center gap-3 bg-gray-50/50 rounded-lg p-3 mb-3 transition-colors"
                :class="selectedNotes.includes(index) ? 'bg-indigo-50' : ''"
                @tap="toggleNoteSelection(index)"
              >
                <checkbox
                  :value="String(index)"
                  :checked="selectedNotes.includes(index)"
                  color="#6366f1"
                  @tap.stop=""
                />
                <view
                  class="flex-1 whitespace-pre-wrap text-sm text-gray-600 leading-relaxed break-words"
                >
                  {{ note }}
                </view>
              </view>
            </checkbox-group>
          </view>
        </scroll-view>

        <!-- 操作按钮 -->
        <view class="px-6 py-4 border-t border-gray-100">
          <view class="flex gap-3">
            <view
              class="flex-1 py-2.5 text-center text-sm rounded-lg bg-gray-100 text-gray-500 font-medium"
              hoverClass="bg-gray-200 !scale-97 transform-origin-center"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="$emit('close')"
            >
              不采用
            </view>
            <view
              v-if="selectedNotes.length > 0"
              class="flex-1 py-2.5 text-center text-sm rounded-lg bg-indigo-500 text-white font-medium"
              hoverClass="bg-indigo-600 !scale-97 transform-origin-center"
              :hoverStartTime="0"
              :hoverStayTime="200"
              @tap="handleConfirm"
            >
              插入所选笔记
            </view>
          </view>
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  notes: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
  (e: 'confirm', notes: string[]): void
}>()

const showNotePreview = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const selectedNotes = ref<number[]>([])

const isAllSelected = computed(() => {
  return selectedNotes.value.length === props.notes.length && props.notes.length > 0
})

const toggleNoteSelection = (index: number) => {
  const noteIndex = selectedNotes.value.indexOf(index)
  if (noteIndex === -1) {
    selectedNotes.value = [...selectedNotes.value, index].sort((a, b) => a - b)
  } else {
    selectedNotes.value = selectedNotes.value.filter((i) => i !== index)
  }
}

const handleSelectAll = () => {
  if (selectedNotes.value.length === props.notes.length) {
    selectedNotes.value = []
  } else {
    selectedNotes.value = props.notes.map((_, index) => index)
  }
}

const onCheckboxChange = (e: any) => {
  selectedNotes.value = e.detail.value.map(Number)
}

const handleConfirm = () => {
  const selectedContent = selectedNotes.value.map((index) => props.notes[index])
  emit('confirm', selectedContent)
  emit('update:modelValue', false)
}
</script>
