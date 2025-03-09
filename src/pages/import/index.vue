<route lang="json5">
{
  style: {
    navigationBarTitleText: '导入卡片',
  },
  layout: false,
}
</route>

<page-meta :page-style="`overflow:${isParseResultShow ? 'hidden' : 'visible'};`"></page-meta>

<template>
  <wd-popup
    lockScroll
    v-model="isParseResultShow"
    customStyle="max-height:80vh;"
    customClass="rounded-t rounded-3"
    position="bottom"
    :safe-area-inset-bottom="true"
    @close="
      () => {
        isParseResultShow = false
      }
    "
  >
    <view class="relative">
      <view
        class="sticky top-0 left-0 w-full bg-white h-12 flex items-center justify-between border-gray-2 border-b border"
      >
        <view
          class="text-xs text-gray-4 py-2 px-3 bg-gray-50 rounded-3"
          :hoverStartTime="0"
          :hoverStayTime="200"
          hoverClass="!scale-97 transform-origin-center"
          @tap="isParseResultShow = false"
        >
          取消
        </view>
        <view class="flex flex-gap-2">
          <view
            class="text-xs py-2 px-3 bg-indigo-50 text-indigo-500 rounded-3 font-semibold text-center transition-all"
            hoverClass="bg-indigo-100 !scale-97 transform-origin-center"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="onReverseBtnClick"
          >
            正反面交换
          </view>
          <view
            class="text-xs mr-3 py-2 px-3 bg-indigo-50 text-indigo-500 rounded-3 font-semibold text-center transition-all"
            hoverClass="bg-indigo-100 !scale-97 transform-origin-center"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="onImportBtnClick"
          >
            确认导入
          </view>
        </view>
      </view>
      <view
        class="bg-gray-1 rounded-3 p-2 m-2 justify-center overflow-hidden transition-all"
        :style="{
          boxShadow:
            'rgb(204, 219, 232) 3px 3px 6px 0px inset,rgba(255, 255, 255, 0.3) -3px -3px 6px 1px inset;',
        }"
      >
        <view
          v-for="({ frontContent, backContent }, index) in cardItems"
          :key="index"
          class="rounded-3 text-dark bg-white border border-gray-2 border-solid overflow-hidden mb-4 p-4 shadow"
        >
          <view class="mb-1 text-gray-4 text-sm">正面</view>
          <view>{{ frontContent }}</view>
          <view class="mt-2 mb-1 text-gray-4 text-sm">反面</view>
          <view>{{ backContent }}</view>
        </view>
      </view>
    </view>
  </wd-popup>

  <!-- 表单内容 -->
  <view
    class="bg-gray-1 rounded-3 p-2 m-2 justify-center overflow-hidden transition-all"
    :style="{
      boxShadow:
        'rgb(204, 219, 232) 3px 3px 6px 0px inset,rgba(255, 255, 255, 0.3) -3px -3px 6px 1px inset;',
    }"
  >
    <wd-form ref="form" :model="formData">
      <view
        class="rounded-3 text-dark bg-white border border-gray-2 border-solid overflow-hidden mb-4 shadow"
      >
        <wd-cell-group>
          <wd-input
            label="卡片间的分隔离符"
            prop="cardSplit"
            v-model="formData.cardSplit"
            placeholder="留空默认为换行符 \n"
          />
          <wd-input
            label="正反面的分隔符"
            prop="sideSplit"
            v-model="formData.sideSplit"
            placeholder="留空默认为英文竖线 |"
          />
        </wd-cell-group>
      </view>

      <view
        class="rounded-3 text-dark bg-white border border-gray-2 border-solid overflow-hidden mb-4 p-4"
        :style="{
          boxShadow: `rgba(0, 0, 0, 0.15) 3px 0px 6px -3px`,
        }"
      >
        <textarea
          v-model="formData.content"
          auto-height
          class="text-sm"
          placeholder="输入要解析的内容"
          adjust-position
          :maxlength="-1"
          :cursor-spacing="10"
          :cursor="formData.content.length"
          confirm-type="done"
        />
      </view>
    </wd-form>
  </view>

  <!-- 解析按钮 -->
  <view class="p-4 sticky bottom-0 bg-white z-5">
    <view
      class="py-2 px-3 bg-indigo-50 text-indigo-500 rounded-3 font-semibold transition-all flex items-center justify-center gap-2"
      hoverClass="bg-indigo-100 !scale-97 transform-origin-center"
      :hoverStartTime="0"
      :hoverStayTime="200"
      @tap="handleSubmit"
    >
      <text class="i-tabler-device-ipad-horizontal-bolt"></text>
      <text>解析内容</text>
    </view>
    <view class="w-full" :style="{ height: `${safeAreaInsets.bottom || 8}px` }"></view>
  </view>
</template>
<script lang="ts" setup>
import { useToast } from 'wot-design-uni'

import { useCardBoxStore, useCardDataStore } from '@/store'
const { safeAreaInsets } = uni.getWindowInfo()

const { info } = useToast()
const cardBoxStore = useCardBoxStore()
const cardDataStore = useCardDataStore()
const formData = reactive<{
  cardSplit: string
  sideSplit: string
  content: string
}>({
  cardSplit: '',
  sideSplit: '||',
  content: '',
})

const importMode = ref<'cardBox' | 'cardItem'>('cardItem')
const isParseResultShow = ref(false)
const form = ref()
const cardBoxId = ref('')
const cardBoxName = ref('')

const cardItems = ref<{ frontContent: string; backContent: string }[]>([])

onLoad((query) => {
  if (query.cardBoxId) {
    cardBoxId.value = query.cardBoxId
    cardBoxName.value = cardDataStore.cardBoxes[cardBoxId.value].name
  } else {
    importMode.value = 'cardBox'
    cardBoxName.value = query.cardBoxName
  }
  uni.setNavigationBarTitle({
    title: `导入卡片到${cardBoxName.value}`,
  })
})

function handleSubmit() {
  const defaultCardSplit = formData.cardSplit || '\n'
  const defaultSideSplit = formData.sideSplit || '||'
  form.value
    .validate()
    .then(() => {
      const items = cardBoxStore.parseCardItemsContent({
        content: formData.content,
        cardSplit: defaultCardSplit,
        sideSplit: defaultSideSplit,
      })

      if (items.length === 0) {
        info('没有解析到有效的卡片')
        return
      }

      // 更新解析结果并显示预览
      cardItems.value = items
      isParseResultShow.value = true
    })
    .catch((error) => {
      console.log('error', error)
    })
}

const onReverseBtnClick = () => {
  cardItems.value = cardItems.value.map((item) => ({
    frontContent: item.backContent,
    backContent: item.frontContent,
  }))
}

const onImportBtnClick = () => {
  if (importMode.value === 'cardBox') {
    // 使用正确的参数格式调用 importCardBox
    cardBoxStore.importCardBox({
      name: cardBoxName.value,
      cards: cardItems.value.map((item, index) => ({ ...item, index })),
    })
    uni.navigateBack({
      delta: 1,
      success: () => {
        uni.$emit('scrollToTop')
      },
    })
  } else {
    cardBoxStore.importCardItems(
      cardBoxId.value,
      cardItems.value.map((item, index) => ({ ...item, index })),
    )
    uni.navigateBack()
  }
}
</script>

<style lang="scss" scoped>
//
</style>
