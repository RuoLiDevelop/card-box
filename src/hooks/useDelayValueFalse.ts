import _ from 'lodash'

const useDelayValueFalse = (refValue: Ref<boolean>, delay: number = 200) => {
  const delayValue = ref(refValue.value)
  watch(refValue, () => {
    if (refValue.value) {
      delayValue.value = true
    } else {
      _.delay(() => {
        delayValue.value = false
      }, delay)
    }
  })
  return delayValue
}

export default useDelayValueFalse
