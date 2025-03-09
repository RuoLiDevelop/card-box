import { defineStore } from 'pinia'
import { ref } from 'vue'

interface ParsedCard {
  frontContent: string
  backContent: string
  note?: string
}

interface ParseResult {
  cards: ParsedCard[]
  mode: 'qa' | 'conversation' | 'vocabulary' | 'free'
  timestamp: number
}

export const useAIParseStore = defineStore('aiParse', () => {
  const lastParseResult = ref<{
    cards: { frontContent: string; backContent: string; note?: string }[]
    mode: 'qa' | 'conversation' | 'vocabulary' | 'free'
    timestamp: number
  } | null>(null)

  const setLastParseResult = (result: {
    mode: 'qa' | 'conversation' | 'vocabulary' | 'free'
    cards: { frontContent: string; backContent: string; note?: string }[]
  }) => {
    lastParseResult.value = {
      ...result,
      timestamp: Date.now(),
    }
  }

  const clearParseResult = () => {
    lastParseResult.value = null
  }

  return {
    lastParseResult,
    setLastParseResult,
    clearParseResult,
  }
})
