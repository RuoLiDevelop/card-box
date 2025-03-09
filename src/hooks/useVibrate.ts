import { useSettingsStore } from '@/store'

const useVibrate = () => {
  const settingsStore = useSettingsStore()

  const vibrate = () => {
    if (settingsStore.vibration) {
      uni.vibrateShort({ type: 'soft' })
    }
  }

  return { vibrate }
}
export default useVibrate
