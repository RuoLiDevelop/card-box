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
        <text class="text-base font-semibold">{{ title }}</text>
        <view
          class="text-sm text-gray-400 py-1 px-3 rounded-full"
          hoverClass="bg-gray-50"
          :hoverStartTime="0"
          :hoverStayTime="200"
          @tap="$emit('update:modelValue', false)"
        >
          关闭
        </view>
      </view>

      <!-- 操作按钮列表 -->
      <view class="p-6">
        <view class="grid grid-cols-4 gap-6">
          <view
            v-for="item in actionItems"
            :key="item.text"
            class="flex flex-col items-center gap-2"
            hoverClass="opacity-60"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="onActionClick(item)"
          >
            <view
              class="w-12 h-12 rounded-3 flex items-center justify-center"
              :class="item.danger ? 'bg-red-50' : 'bg-gray-50'"
            >
              <view
                :class="[item.icon, 'text-xl', item.danger ? 'text-red-500' : 'text-gray-500']"
              />
            </view>
            <text class="text-xs" :class="item.danger ? 'text-red-500' : 'text-gray-700'">
              {{ item.text }}
            </text>
          </view>
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
type ActionItem = {
  text: string
  icon: string
  danger?: boolean
  action: () => void
}

const props = defineProps<{
  modelValue: boolean
  title: string
  actionItems: ActionItem[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const onActionClick = (item: ActionItem) => {
  item.action()
  emit('update:modelValue', false)
}
</script>
