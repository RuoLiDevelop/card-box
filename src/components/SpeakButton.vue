<template>
  <view
    v-if="!isEmpty"
    class="flex items-center justify-center"
    :hoverClass="'opacity-80 scale-95'"
    :hoverStartTime="0"
    :hoverStayTime="200"
    @tap.stop="onSpeakBtnClick"
  >
    <wd-loading v-if="isAudioLoading" color="rgb(75 85 99)" size="14px" />
    <template v-else>
      <text
        class="text-gray-600"
        :class="[isSpeaking ? 'i-tabler-player-stop-filled' : 'i-tabler-volume', 'text-base']"
      />
    </template>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{
  content: string
  isEmpty?: boolean
}>()

const isSpeaking = ref(false)
const isAudioLoading = ref(false)
const audioCache = reactive({})
let innerAudioContext: UniApp.InnerAudioContext | null = null
const plugin = requirePlugin('WechatSI')

// 朗读内容
const onSpeakBtnClick = () => {
  if (isSpeaking.value) {
    stopSpeaking()
    return
  }

  if (!props.content?.trim()) {
    uni.showToast({
      title: '没有可朗读的内容',
      icon: 'none',
    })
    return
  }

  isAudioLoading.value = true

  // 如果有缓存的音频，直接使用
  if (audioCache[props.content]) {
    playAudio(audioCache[props.content])
    return
  }

  // 调用插件将文字转为语音
  plugin.textToSpeech({
    lang: 'zh_CN',
    tts: true,
    content: props.content,
    success: (res: any) => {
      const { filename } = res
      audioCache[props.content] = filename
      playAudio(filename)
    },
    fail: () => {
      isAudioLoading.value = false
      uni.showToast({
        icon: 'none',
        title: '朗读失败，请稍后重试',
      })
    },
  })
}

// 播放音频
const playAudio = (filename: string) => {
  stopSpeaking()
  innerAudioContext = uni.createInnerAudioContext()
  innerAudioContext.src = filename
  setupAudioListeners()
  innerAudioContext.play()
}

// 停止朗读
const stopSpeaking = () => {
  if (innerAudioContext) {
    innerAudioContext.stop()
  }
  isSpeaking.value = false
}

// 设置音频监听器
const setupAudioListeners = () => {
  if (!innerAudioContext) return

  innerAudioContext.onPlay(() => {
    isSpeaking.value = true
    isAudioLoading.value = false
  })

  innerAudioContext.onStop(() => {
    isSpeaking.value = false
  })

  innerAudioContext.onEnded(() => {
    isSpeaking.value = false
    stopSpeaking()
  })

  innerAudioContext.onError(() => {
    isSpeaking.value = false
    stopSpeaking()
    uni.showToast({
      title: '朗读失败',
      icon: 'none',
    })
  })
}

// 组件卸载时清理
onUnmounted(() => {
  innerAudioContext?.destroy()
  innerAudioContext = null
})

defineExpose({
  speak: onSpeakBtnClick,
  stop: stopSpeaking,
})
</script>
