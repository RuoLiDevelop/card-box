import { ref, computed } from 'vue'

import type { Ref } from 'vue'

interface TipContent {
  type: 'text' | 'blank' | 'blank-en'
  text: string
}

const PATTERNS = {
  // 匹配中文字符
  CHINESE: /^[\u4e00-\u9fa5]+$/,
  // 匹配英文单词
  ENGLISH: /^[a-zA-Z]+$/,
  // 匹配标点符号和空白字符
  PUNCTUATION: /^[，。！？、；：""''（）【】《》,.!?;:()[\]{}'"/\s]+$/,
  // 分词正则
  SEGMENT: /([\u4e00-\u9fa5]+|[a-zA-Z]+|[，。？、；：""''（）【】《》,.!?;:()[\]{}'"/\s]+)/,
}

const useCardTip = (cardContent: Ref<string | undefined>, isFlipped: Ref<boolean>) => {
  const tipCount = ref(0)
  const showTip = ref(false)
  const tipPositions = ref<Set<number>>(new Set())
  const tipVisible = ref(false)

  // 处理分段内容的通用函数
  const processSegment = (
    segment: string,
    segmentIndex: number,
    probability: number,
    positions: Set<number>,
  ) => {
    if (PATTERNS.ENGLISH.test(segment)) {
      if (Math.random() < probability) {
        positions.add(segmentIndex)
      }
    } else if (PATTERNS.CHINESE.test(segment)) {
      Array.from(segment).forEach((_, idx) => {
        if (Math.random() < probability) {
          positions.add(segmentIndex + idx)
        }
      })
    }
  }

  const getSegments = (content: string) => {
    return content.split(PATTERNS.SEGMENT)
  }

  const initializeTipPositions = () => {
    if (!cardContent.value) return
    const segments = getSegments(cardContent.value)

    // 先按原来的逻辑处理
    segments.forEach((segment, segmentIndex) => {
      processSegment(segment, segmentIndex, 0.3, tipPositions.value)
    })

    // 如果没有任何提示内容，随机选择一个字符显示
    if (tipPositions.value.size === 0) {
      const validSegments = segments.reduce<{ index: number; length: number }[]>(
        (acc, segment, index) => {
          if (PATTERNS.ENGLISH.test(segment) || PATTERNS.CHINESE.test(segment)) {
            acc.push({
              index,
              length: PATTERNS.ENGLISH.test(segment) ? 1 : Array.from(segment).length,
            })
          }
          return acc
        },
        [],
      )

      if (validSegments.length > 0) {
        // 随机选择一个有效片段
        const randomSegment = validSegments[Math.floor(Math.random() * validSegments.length)]
        // 如果是英文单词，直接添加整个片段索引
        if (PATTERNS.ENGLISH.test(segments[randomSegment.index])) {
          tipPositions.value.add(randomSegment.index)
        } else {
          // 如果是中文，随机选择一个字符
          const randomCharIndex = Math.floor(Math.random() * randomSegment.length)
          tipPositions.value.add(randomSegment.index + randomCharIndex)
        }
      }
    }
  }

  const updateTipPositions = () => {
    if (!cardContent.value) return
    const segments = getSegments(cardContent.value)
    segments.forEach((segment, segmentIndex) => {
      if (!tipPositions.value.has(segmentIndex)) {
        processSegment(segment, segmentIndex, 0.3, tipPositions.value)
      }
    })
  }

  const getTipContent = computed(() => {
    if (!cardContent.value) return []

    const segments = getSegments(cardContent.value)
    return segments
      .map((segment, segmentIndex) => {
        if (!segment) return []

        if (PATTERNS.PUNCTUATION.test(segment)) {
          return [{ type: 'text', text: segment }]
        }

        if (PATTERNS.ENGLISH.test(segment)) {
          return tipPositions.value.has(segmentIndex)
            ? [{ type: 'text', text: segment }]
            : segment.split('').map(() => ({ type: 'blank-en', text: ' ' }))
        }

        const chars = Array.from(segment)
        return chars.map((char, idx) => ({
          type: tipPositions.value.has(segmentIndex + idx) ? 'text' : 'blank',
          text: tipPositions.value.has(segmentIndex + idx) ? char : ' ',
        }))
      })
      .flat() as TipContent[]
  })

  const getTipHint = computed(() => {
    const hints = {
      1: '给你一点点提示 ✨',
      2: '已经提示大部分内容啦，相信你已想起来了~🤔',
      3: '不记得就翻面看看吧~🤓',
    }
    return hints[tipCount.value as keyof typeof hints] || ''
  })

  const showTipButton = computed(() => {
    if (isFlipped.value || !cardContent.value) return false

    // 检查是否为单个英文词汇
    const content = cardContent.value.trim()
    const isSingleEnglishWord = PATTERNS.ENGLISH.test(content)

    // 如果是单个英文词汇，不显示提示按钮
    if (isSingleEnglishWord) return false

    return Array.from(content).length >= 5
  })

  const handleTipClick = () => {
    if (!showTip.value) {
      // 第一次点击
      tipCount.value = 1
      tipPositions.value.clear()
      initializeTipPositions()
    } else if (tipCount.value === 1) {
      // 第二次点击，最后一次更新提示内容
      tipCount.value++
      updateTipPositions()
    } else if (tipCount.value < 3) {
      // 第三次点击只更新提示文案
      tipCount.value++
    }
    showTip.value = true
    tipVisible.value = true
  }

  const resetTip = () => {
    tipCount.value = 0
    showTip.value = false
    tipPositions.value.clear()
  }

  const closeTip = () => {
    showTip.value = false
    setTimeout(() => {
      tipVisible.value = false
    }, 200)
  }

  return {
    showTip,
    tipVisible,
    getTipContent,
    getTipHint,
    showTipButton,
    handleTipClick,
    resetTip,
    closeTip,
  }
}

export default useCardTip
