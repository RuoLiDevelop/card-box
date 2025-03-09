import { TouchEvent } from '@uni-helper/uni-types/index'
import { ref } from 'vue'

// 定义缩放比例系数
const ZOOM_SCALE_COEFFICIENT = 0.005
const ZOOM_THRESHOLD = 0.7 // 缩放阈值

const useDoubleFingerPinch = (action: () => void) => {
  const onPinching = ref(false)
  const initialDistance = ref(0)
  const currentScale = ref(1)

  /**
   * 处理触摸开始事件
   * @param e - 触摸事件对象
   */
  const touchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      onPinching.value = true
      const [touch1, touch2] = e.touches
      const xMove = touch2.clientX - touch1.clientX
      const yMove = touch2.clientY - touch1.clientY
      initialDistance.value = Math.sqrt(xMove * xMove + yMove * yMove)
    }
  }

  /**
   * 处理触摸移动事件
   * @param e - 触摸事件对象
   */
  const touchMove = (e: TouchEvent) => {
    if (onPinching.value && e.touches.length === 2) {
      const [touch1, touch2] = e.touches
      const xMove = touch2.clientX - touch1.clientX
      const yMove = touch2.clientY - touch1.clientY
      const newDistance = Math.sqrt(xMove * xMove + yMove * yMove)
      const distanceDiff = newDistance - initialDistance.value
      currentScale.value = Math.min(Math.max(1 + ZOOM_SCALE_COEFFICIENT * distanceDiff, 0.65), 1)

      // 检查是否满足条件并触发动作
      if (currentScale.value < ZOOM_THRESHOLD) {
        // 触发动作前先重置状态
        const tempAction = action
        onPinching.value = false
        currentScale.value = 1
        initialDistance.value = 0
        // 然后执行动作
        tempAction()
      }
    }
  }

  /**
   * 处理触摸结束事件
   * @param e - 触摸事件对象
   */
  const touchEnd = (e: TouchEvent) => {
    // 立即重置所有状态
    onPinching.value = false
    initialDistance.value = 0
    currentScale.value = 1
  }

  // 注意：这里没有返回temporaryScale，因为它只在touchMove内部使用
  return { touchStart, touchMove, touchEnd, onPinching, currentScale }
}

export default useDoubleFingerPinch
