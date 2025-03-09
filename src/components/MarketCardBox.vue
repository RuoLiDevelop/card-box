<template>
  <view
    class="group relative transform-gpu transition-all duration-300 animate-fade-in animate-duration-300"
  >
    <!-- 添加阴影容器 -->
    <view
      class="absolute inset-0 rounded-xl -z-1 transition-all duration-200"
      :style="{
        transform: 'scale(0.97)',
        boxShadow:
          '0 10px 30px -8px rgba(0,0,0,0.12), 0 4px 10px -3px rgba(0,0,0,0.08), 0 1px 3px -1px rgba(0,0,0,0.04)',
      }"
    />

    <view
      class="relative bg-white rounded-xl overflow-hidden transition-all duration-200"
      hoverClass="scale-97 origin-center"
      :hoverStartTime="0"
      :hoverStayTime="200"
      @tap="navigateToDetail"
    >
      <!-- 卡盒内容 -->
      <view class="p-4 flex flex-col">
        <!-- 标题 -->
        <view class="mb-2">
          <view class="font-medium text-gray-800 leading-normal line-clamp-1">
            {{ data.title }}
          </view>
        </view>

        <!-- 描述 -->
        <view class="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">
          {{ data.description }}
        </view>

        <!-- 底部区域：卡片数量和标签 -->
        <view class="mt-auto flex items-center justify-between">
          <view class="flex items-center gap-1">
            <view class="i-tabler-cards text-xs text-gray-400" />
            <view class="text-xs text-gray-400">{{ data.cards.length }} 张卡片</view>
          </view>

          <view class="flex flex-wrap gap-1.5 justify-end flex-1 ml-4">
            <view
              v-for="label in data.labels"
              :key="label"
              class="px-2 h-5 bg-gray-50 rounded-full flex items-center justify-center"
            >
              <text class="text-2xs text-gray-500 leading-none">{{ label }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部装饰 -->
      <view class="absolute inset-x-0 bottom-0 h-24 pointer-events-none">
        <view class="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/30" />
        <view
          class="absolute left-0 bottom-0 w-32 h-32 rounded-full bg-black/[0.01] -translate-x-16 translate-y-16"
        />
        <view
          class="absolute right-0 bottom-0 w-24 h-24 rounded-full bg-black/[0.01] translate-x-12 translate-y-12"
        />
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
const props = defineProps<{
  data: {
    id: string
    title: string
    description: string
    labels: string[]
    cards: { length: number }
  }
}>()

const { vibrate } = useVibrate()

const navigateToDetail = () => {
  vibrate()
  uni.navigateTo({
    url: `/pages/market/detail?id=${props.data.id}`,
  })
}
</script>

<style scoped>
.text-2xs {
  font-size: 0.65rem;
  line-height: 1rem;
}

.line-clamp-2 {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.line-clamp-3 {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
</style>
