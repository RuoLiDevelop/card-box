<route lang="json5">
{
  style: {
    navigationStyle: 'custom',
  },
  layout: false,
}
</route>

<template>
  <view class="h-screen bg-[#f8f9fa] relative">
    <!-- 背景装饰 -->
    <view class="fixed inset-0 pointer-events-none overflow-hidden">
      <view
        v-for="i in 3"
        :key="i"
        class="absolute bg-black/[0.015] rounded-full"
        :style="{
          width: `${300 + i * 100}px`,
          height: `${300 + i * 100}px`,
          left: i === 1 ? '-10%' : i === 2 ? '110%' : '50%',
          top: i === 1 ? '-10%' : i === 2 ? '110%' : '50%',
          transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
        }"
      />
    </view>

    <!-- 导航栏 -->
    <view
      class="sticky top-0 z-10 px-4 pt-16 pb-3 bg-white/90 backdrop-blur-sm"
      :style="{
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }"
    >
      <view class="flex items-center justify-between">
        <view class="flex-1">
          <view class="flex flex-col gap-1">
            <!-- 第一行：返回按钮和标题 -->
            <view class="flex items-center gap-3">
              <view
                class="w-8 h-8 rounded-lg bg-gray-50/80 flex items-center justify-center"
                @tap="back"
                :hoverClass="'bg-gray-100/80 scale-95'"
                :hoverStartTime="0"
                :hoverStayTime="200"
              >
                <text class="i-tabler-chevron-left text-lg text-gray-500" />
              </view>

              <view class="flex flex-col gap-1">
                <!-- 标题文本 -->
                <text class="text-base font-semibold text-gray-800">
                  {{ navbarTitle }}
                </text>
                <!-- 学习进度 -->
                <view class="flex items-center gap-3">
                  <view class="flex items-center gap-1">
                    <text class="i-tabler-book text-xs text-gray-500" />
                    <text class="text-xs text-gray-500">
                      {{ progressText.newCards }}：{{ studyProgress.newCards }} 张
                    </text>
                  </view>
                  <view v-if="!isPracticeMode" class="flex items-center gap-1">
                    <text class="i-tabler-refresh text-xs text-gray-500" />
                    <text class="text-xs text-gray-500">
                      {{ progressText.reviewCards }}：{{ studyProgress.reviewCards }} 张
                    </text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 卡片内容区域 -->
    <view class="px-4 py-4">
      <!-- 当没有卡片内容时显示占位图 -->
      <template v-if="isStudyCompleted">
        <view
          class="aspect-square flex items-center justify-center bg-white rounded-2xl"
          :style="{
            background: 'linear-gradient(135deg, #ffffff 0%, #fafeff 100%)',
            boxShadow: '0 8px 16px -6px rgba(0,0,0,0.1), 0 4px 8px -4px rgba(0,0,0,0.07)',
          }"
        >
          <view class="flex flex-col items-center gap-6 text-center p-8">
            <!-- 使用一个漂亮的图标 -->
            <view
              class="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center animate-trophy"
            >
              <text class="i-tabler-trophy-filled text-4xl text-indigo-500 animate-trophy-shine" />
              <!-- 修改粒子效果 -->
              <view
                v-for="i in 8"
                :key="i"
                class="absolute w-2 h-2 rounded-full bg-indigo-400/30 animate-particle"
                :style="{
                  top: 'calc(50% - 4px)',
                  left: 'calc(50% - 4px)',
                  animationDelay: `${i * 0.15}s`,
                  '--rotation': `${i * 45}deg`,
                }"
              />
            </view>
            <view class="space-y-2 animate-fade-in-up">
              <text class="text-xl font-semibold text-gray-800 block">
                {{ completionTitle }}
              </text>
              <text class="text-sm text-gray-500 block">
                {{ completionMessage }}
              </text>
            </view>
          </view>
        </view>
      </template>

      <!-- 原有的卡片内容 -->
      <view v-else>
        <view
          class="aspect-square transform-gpu rounded-2xl"
          :style="{
            background: 'linear-gradient(135deg, #ffffff 0%, #fafeff 100%)',
            boxShadow: '0 8px 16px -6px rgba(0,0,0,0.1), 0 4px 8px -4px rgba(0,0,0,0.07)',
            transform: `rotateY(${showingBack ? 180 : 0}deg)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }"
        >
          <!-- 正面 -->
          <scroll-view
            :show-scrollbar="false"
            scroll-y
            :style="{
              transform: 'rotateY(0deg)',
              backfaceVisibility: 'hidden',
            }"
            class="absolute inset-0 rounded-2xl h-full"
          >
            <view
              class="h-full"
              :class="[isContentCentered && 'flex items-center justify-center h-full']"
            >
              <view class="p-4" :class="[isContentCentered && 'flex justify-center']">
                <text
                  class="text-gray-800 leading-[1.75] tracking-[0.01em] transition-all duration-300 font-semibold"
                  :class="[
                    isContentCentered && 'text-center',
                    isLargeFont ? 'text-2xl' : 'text-lg',
                    showingBack ? '' : 'animate-fade-in animate-duration-200',
                  ]"
                >
                  {{ currentCard?.frontContent || '' }}
                </text>
              </view>
            </view>
            <!-- 修改正面朗读按钮 -->
            <view class="absolute bottom-5 left-5">
              <view
                class="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 transition-colors"
                :hoverClass="'bg-gray-100/80 scale-95'"
                :hoverStartTime="0"
                :hoverStayTime="200"
                @tap.stop="frontSpeakRef?.speak?.()"
              >
                <SpeakButton
                  ref="frontSpeakRef"
                  :content="currentCard?.frontContent"
                  :isEmpty="!currentCard"
                  @start="playingState.frontPlaying = true"
                  @stop="playingState.frontPlaying = false"
                />
                <text class="text-sm text-gray-600">朗读</text>
              </view>
            </view>
          </scroll-view>

          <!-- 背面 -->
          <scroll-view
            :show-scrollbar="false"
            scroll-y
            :style="{
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
            }"
            class="absolute inset-0 rounded-2xl h-full"
          >
            <view
              class="h-full"
              :class="[isContentCentered && 'flex items-center justify-center h-full']"
            >
              <view class="p-4" :class="[isContentCentered && 'flex justify-center']">
                <text
                  class="text-gray-800 leading-[1.75] tracking-[0.01em] w-full transition-all duration-300 font-semibold animate-fade-in animate-duration-200"
                  :class="[
                    isContentCentered && 'text-center',
                    isLargeFont ? 'text-2xl' : 'text-lg',
                  ]"
                >
                  {{ displayBackContent || currentCard?.backContent || '' }}
                </text>
              </view>
            </view>

            <!-- 修改背面朗读按钮 -->
            <view class="absolute bottom-5 left-5">
              <view
                class="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 transition-colors"
                :hoverClass="'bg-gray-100/80 scale-95'"
                :hoverStartTime="0"
                :hoverStayTime="200"
                @tap.stop="backSpeakRef?.speak?.()"
              >
                <SpeakButton
                  ref="backSpeakRef"
                  :content="currentCard?.backContent"
                  :isEmpty="!currentCard"
                  @start="playingState.backPlaying = true"
                  @stop="playingState.backPlaying = false"
                />
                <text class="text-sm text-gray-600">朗读</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>

    <!-- 底部选项区域 -->
    <view class="fixed bottom-0 left-0 right-0">
      <view
        class="px-4 pb-6 pt-8"
        :class="[
          showingBack
            ? lastAnswer === 'know'
              ? 'bg-green-50/90'
              : 'bg-amber-50/90'
            : 'bg-white/90',
        ]"
        :style="{
          backdropFilter: 'blur(8px)',
          paddingBottom: `${safeAreaInsets.bottom + 24}px`,
        }"
      >
        <!-- 选择题部分 -->
        <template v-if="currentCard">
          <view class="space-y-3">
            <!-- 单选模式 -->
            <template v-if="currentMode === StudyMode.QUIZ && settingsStore.showAIFeature">
              <!-- 加载状态 -->
              <template v-if="quizState.loading || initialLoading">
                <view
                  class="w-full rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden"
                  :style="{
                    minHeight: '120px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f5f7ff 100%)',
                  }"
                >
                  <view class="flex flex-col items-center gap-4 py-6">
                    <!-- 加载动画 -->
                    <view class="relative">
                      <view class="loading-ring">
                        <view class="loading-ring-gradient" />
                        <view class="loading-ring-inner">
                          <text
                            class="i-tabler-sparkles text-2xl text-indigo-500/80 animate-pulse"
                          />
                        </view>
                      </view>
                    </view>
                    <!-- 加载文本 -->
                    <view class="flex flex-col items-center gap-1">
                      <text class="text-base font-medium text-gray-700">正在生成题目</text>
                      <text class="text-sm text-gray-500">很快就好啦...</text>
                    </view>
                  </view>
                </view>
              </template>

              <!-- 选择题或记得/不记得模式 -->
              <template v-else>
                <!-- 选择题模式 -->
                <template v-if="quizState.quiz">
                  <!-- 选择后的反馈提示 -->
                  <view v-if="showingBack" class="animate-zoom-in animate-duration-200 mb-6">
                    <view class="flex items-center">
                      <text
                        class="text-2xl mr-3"
                        :class="[
                          quizState.isCorrect
                            ? 'i-tabler-mood-happy text-green-500'
                            : 'i-tabler-mood-puzzled text-amber-500',
                        ]"
                      />
                      <text
                        class="text-lg font-semibold"
                        :class="[quizState.isCorrect ? 'text-green-600' : 'text-amber-600']"
                      >
                        {{
                          quizState.isCorrect
                            ? encouragements.know[
                                Math.floor(Math.random() * encouragements.know.length)
                              ]
                            : encouragements.dontKnow[
                                Math.floor(Math.random() * encouragements.dontKnow.length)
                              ]
                        }}
                      </text>
                    </view>
                  </view>

                  <!-- 选项按钮 -->
                  <template v-if="!showingBack">
                    <view
                      v-for="(option, index) in quizState.quiz.o"
                      :key="index"
                      class="w-full rounded-xl flex items-center justify-center shadow-sm bg-gray-100"
                      :hoverClass="'opacity-90'"
                      :hoverStartTime="0"
                      :hoverStayTime="200"
                      @tap="handleOptionSelect(index)"
                    >
                      <text
                        class="text-base font-medium px-4 py-3 text-left w-full text-gray-600 break-words whitespace-pre-wrap"
                        :style="{ lineHeight: '1.5' }"
                      >
                        {{ option.text }}
                      </text>
                    </view>
                  </template>

                  <!-- 选择后的状态 -->
                  <template v-if="showingBack">
                    <!-- 选中的选项 -->
                    <view
                      class="w-full rounded-xl flex items-center justify-center shadow-sm"
                      :class="[
                        quizState.isCorrect
                          ? 'bg-green-500 shadow-green-200'
                          : 'bg-amber-500 shadow-amber-200',
                      ]"
                    >
                      <text
                        class="text-base font-medium px-4 py-3 text-left w-full text-white"
                        :style="{ lineHeight: '1.5' }"
                      >
                        {{ quizState.quiz.o[quizState.selectedAnswer as number].text }}
                      </text>
                    </view>

                    <!-- 选择后的反馈 -->
                    <view
                      class="mt-4 px-4 py-3 rounded-lg"
                      :class="[quizState.isCorrect ? 'bg-green-50' : 'bg-amber-50']"
                    >
                      <text
                        class="text-sm"
                        :class="[quizState.isCorrect ? 'text-green-600' : 'text-amber-600']"
                      >
                        {{ quizState.quiz.o[quizState.selectedAnswer as number].analysis }}
                      </text>
                    </view>
                  </template>
                </template>

                <!-- 记得/不记得模式（当选择题生成失败时） -->
                <template v-else>
                  <view class="space-y-3">
                    <!-- 选择前的按钮 -->
                    <template v-if="!showingBack">
                      <view
                        class="w-full h-12 rounded-xl bg-indigo-500 flex items-center justify-center shadow-sm shadow-indigo-200"
                        :hoverClass="'opacity-90'"
                        :hoverStartTime="0"
                        :hoverStayTime="200"
                        @tap="handleKnow"
                      >
                        <view class="flex items-center gap-2">
                          <text class="i-tabler-mood-happy text-white text-lg" />
                          <text class="text-white font-medium">记得</text>
                        </view>
                      </view>
                      <view
                        class="w-full h-12 rounded-xl bg-gray-100 flex items-center justify-center shadow-sm mb-3"
                        :hoverClass="'bg-gray-50'"
                        :hoverStartTime="0"
                        :hoverStayTime="200"
                        @tap="handleDontKnow"
                      >
                        <view class="flex items-center gap-2">
                          <text class="i-tabler-mood-puzzled text-gray-500 text-lg" />
                          <text class="text-gray-500 font-medium">不记得</text>
                        </view>
                      </view>
                    </template>

                    <!-- 选择后的反馈提示 -->
                    <template v-else>
                      <view class="animate-zoom-in animate-duration-200 mb-6">
                        <view class="flex items-center">
                          <text
                            class="text-2xl mr-3"
                            :class="[
                              lastAnswer === 'know'
                                ? 'i-tabler-mood-happy text-green-500'
                                : 'i-tabler-mood-puzzled text-amber-500',
                            ]"
                          />
                          <text
                            class="text-lg font-semibold"
                            :class="[lastAnswer === 'know' ? 'text-green-600' : 'text-amber-600']"
                          >
                            {{
                              lastAnswer === 'know'
                                ? encouragements.know[
                                    Math.floor(Math.random() * encouragements.know.length)
                                  ]
                                : encouragements.dontKnow[
                                    Math.floor(Math.random() * encouragements.dontKnow.length)
                                  ]
                            }}
                          </text>
                        </view>
                      </view>
                    </template>
                  </view>
                </template>
              </template>
            </template>

            <!-- 回忆模式 -->
            <template v-else-if="currentMode === StudyMode.RECALL">
              <view class="space-y-3">
                <!-- 选择前的按钮 -->
                <template v-if="!showingBack">
                  <view
                    class="w-full h-12 rounded-xl bg-indigo-500 flex items-center justify-center shadow-sm shadow-indigo-200"
                    :hoverClass="'opacity-90'"
                    :hoverStartTime="0"
                    :hoverStayTime="200"
                    @tap="handleKnow"
                  >
                    <view class="flex items-center gap-2">
                      <text class="i-tabler-mood-happy text-white text-lg" />
                      <text class="text-white font-medium">记得</text>
                    </view>
                  </view>
                  <view
                    class="w-full h-12 rounded-xl bg-gray-100 flex items-center justify-center shadow-sm"
                    :hoverClass="'bg-gray-50'"
                    :hoverStartTime="0"
                    :hoverStayTime="200"
                    @tap="handleDontKnow"
                  >
                    <view class="flex items-center gap-2">
                      <text class="i-tabler-mood-puzzled text-gray-500 text-lg" />
                      <text class="text-gray-500 font-medium">不记得</text>
                    </view>
                  </view>
                </template>

                <!-- 选择后的反馈提示 -->
                <template v-else>
                  <view class="animate-zoom-in animate-duration-200 mb-6">
                    <view class="flex items-center">
                      <text
                        class="text-2xl mr-3"
                        :class="[
                          lastAnswer === 'know'
                            ? 'i-tabler-mood-happy text-green-500'
                            : 'i-tabler-mood-puzzled text-amber-500',
                        ]"
                      />
                      <text
                        class="text-lg font-semibold"
                        :class="[lastAnswer === 'know' ? 'text-green-600' : 'text-amber-600']"
                      >
                        {{
                          lastAnswer === 'know'
                            ? encouragements.know[
                                Math.floor(Math.random() * encouragements.know.length)
                              ]
                            : encouragements.dontKnow[
                                Math.floor(Math.random() * encouragements.dontKnow.length)
                              ]
                        }}
                      </text>
                    </view>
                  </view>
                </template>
              </view>
            </template>

            <!-- 复述模式 -->
            <template v-else-if="currentMode === StudyMode.RECITE">
              <view class="space-y-3">
                <!-- 输入框和检查按钮 -->
                <template v-if="!showingBack">
                  <!-- 加载状态 -->
                  <template v-if="reciteState.loading">
                    <view
                      class="w-full rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden"
                      :style="{
                        minHeight: '120px',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f5f7ff 100%)',
                      }"
                    >
                      <view class="flex flex-col items-center gap-4 py-6">
                        <!-- 加载动画 -->
                        <view class="relative flex items-center gap-2">
                          <text
                            class="i-tabler-mood-puzzled text-3xl text-indigo-500 animate-bounce"
                            style="animation-delay: 0s"
                          />
                          <text
                            class="i-tabler-point-filled text-base text-indigo-400 animate-bounce"
                            style="animation-delay: 0.2s"
                          />
                          <text
                            class="i-tabler-point-filled text-base text-indigo-400 animate-bounce"
                            style="animation-delay: 0.4s"
                          />
                          <text
                            class="i-tabler-point-filled text-base text-indigo-400 animate-bounce"
                            style="animation-delay: 0.6s"
                          />
                        </view>
                        <!-- 加载文本 -->
                        <view class="flex flex-col items-center gap-1">
                          <text class="text-base font-medium text-gray-700">正在思考</text>
                          <text class="text-sm text-gray-500">让我想想，很快就好...</text>
                        </view>
                      </view>
                    </view>
                  </template>

                  <!-- 输入区域 -->
                  <template v-else>
                    <view class="relative">
                      <textarea
                        id="recite-textarea"
                        v-model="reciteState.userAnswer"
                        class="w-full h-32 bg-gray-50/50 rounded-xl p-3 text-sm"
                        placeholder="输入或朗读卡片内容..."
                        :cursor-spacing="20"
                        @blur="handleTextareaBlur"
                        confirm-type="done"
                      />
                      <!-- 语音输入按钮 -->
                      <view
                        class="absolute -right-2 -top-6 w-8 h-8 rounded-full flex items-center justify-center transition-colors transition-all"
                        :class="[
                          reciteState.isRecording
                            ? 'bg-indigo-500 recording-button'
                            : 'bg-indigo-50',
                        ]"
                        :hoverClass="reciteState.isRecording ? '' : 'scale-95 origin-center'"
                        :hoverStartTime="0"
                        :hoverStayTime="200"
                        @tap="handleVoiceInput"
                      >
                        <wd-loading v-if="reciteState.recordLoading" />
                        <text
                          v-else
                          :class="[
                            reciteState.isRecording
                              ? 'i-tabler-player-stop-filled'
                              : 'i-tabler-microphone',
                            reciteState.isRecording ? 'text-white' : 'text-indigo-500',
                          ]"
                          class="text-base"
                        />
                      </view>
                    </view>
                    <!-- 按钮组 -->
                    <view class="flex gap-3 mt-3">
                      <!-- 不记得按钮 -->
                      <view
                        class="flex-1 h-12 rounded-xl bg-gray-100 flex items-center justify-center shadow-sm"
                        :hoverClass="'bg-gray-50'"
                        :hoverStartTime="0"
                        :hoverStayTime="200"
                        @tap="handleDontKnow"
                      >
                        <view class="flex items-center gap-2">
                          <text class="i-tabler-mood-puzzled text-gray-500 text-lg" />
                          <text class="text-gray-500 font-medium">不记得</text>
                        </view>
                      </view>
                      <!-- 检查答案按钮 -->
                      <view
                        class="flex-[2] h-12 rounded-xl bg-indigo-500 flex items-center justify-center shadow-sm shadow-indigo-200"
                        :class="[reciteState.userAnswer ? 'opacity-100' : 'opacity-50']"
                        :hoverClass="reciteState.userAnswer ? 'opacity-90' : ''"
                        :hoverStartTime="0"
                        :hoverStayTime="200"
                        @tap="handleCheckAnswer"
                      >
                        <view class="flex items-center gap-2">
                          <text class="i-tabler-mood-check text-white text-lg" />
                          <text class="text-white font-medium">检查答案</text>
                        </view>
                      </view>
                    </view>
                  </template>
                </template>

                <!-- 检查结果 -->
                <template v-else>
                  <view class="animate-zoom-in animate-duration-200 mb-6">
                    <view class="flex items-center">
                      <text
                        class="text-2xl mr-3"
                        :class="[
                          reciteState.showResult
                            ? reciteState.score >= 80
                              ? 'i-tabler-mood-happy text-green-500'
                              : 'i-tabler-mood-puzzled text-amber-500'
                            : 'i-tabler-mood-puzzled text-amber-500',
                        ]"
                      />
                      <text
                        class="text-lg font-semibold"
                        :class="[
                          reciteState.showResult
                            ? reciteState.score >= 80
                              ? 'text-green-600'
                              : 'text-amber-600'
                            : 'text-amber-600',
                        ]"
                      >
                        <template v-if="reciteState.showResult">
                          评分: {{ reciteState.score }}
                        </template>
                        <template v-else>
                          {{
                            encouragements.dontKnow[
                              Math.floor(Math.random() * encouragements.dontKnow.length)
                            ]
                          }}
                        </template>
                      </text>
                    </view>
                    <!-- 仅在检查答案时显示用户回答和评分理由 -->
                    <template v-if="reciteState.showResult">
                      <view
                        class="mt-4 p-4 rounded-lg shadow-sm"
                        :class="[
                          reciteState.score >= 80
                            ? 'bg-green-500 shadow-green-200'
                            : 'bg-amber-500 shadow-amber-200',
                        ]"
                      >
                        <text class="text-sm text-white">{{ reciteState.userAnswer }}</text>
                      </view>
                      <!-- 评分理由 -->
                      <view class="mt-2 text-sm text-gray-600">
                        {{ reciteState.reason }}
                      </view>
                    </template>
                  </view>
                </template>
              </view>
            </template>
          </view>
        </template>

        <!-- 完成学习按钮 -->
        <template v-else-if="!currentCard">
          <view
            class="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200"
            :hoverClass="'opacity-90'"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="completeStudy"
          >
            <text class="text-white font-medium">完成学习</text>
          </view>
        </template>

        <!-- 下一题按钮 -->
        <template v-if="showingBack">
          <view
            class="w-full h-12 rounded-xl flex items-center justify-center shadow-sm"
            :class="[
              lastAnswer === 'know' || quizState.isCorrect
                ? 'bg-green-500 shadow-green-200'
                : 'bg-amber-500 shadow-amber-200',
            ]"
            :hoverClass="'opacity-90'"
            :hoverStartTime="0"
            :hoverStayTime="200"
            @tap="nextCard"
          >
            <text class="text-white text-base font-semibold">下一张</text>
          </view>
        </template>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { storeToRefs } from 'pinia'

import SpeakButton from '@/components/SpeakButton.vue'
import { checkAnswerWithAI, generateQuizWithAI } from '@/services/ai'
import { useCardDataStore, useCardBoxStore, useSettingsStore, useUserStore } from '@/store'
import { StudyCard, StudyCards } from '@/types/card'
import { StudyMode } from '@/types/study'

import { encouragements } from './encouragements'

const { safeAreaInsets } = uni.getWindowInfo()
const { vibrate } = useVibrate()
const successAudio = uni.createInnerAudioContext()
const failAudio = uni.createInnerAudioContext()

// 添加初始加载状态
const initialLoading = ref(true)
const cardBoxId = ref('')
// 获取卡盒数据
const cardBoxData = computed(() => cardDataStore.cardBoxes[cardBoxId.value])
const currentMode = ref<StudyMode>(StudyMode.RECALL)

// 修改为 shallowRef
const todayCards = shallowRef<StudyCards>({
  newCards: [],
  reviewCards: [],
})

const allStudyCards = shallowRef<StudyCard[]>([])

// 手动触发更新的辅助函数
const updateAllStudyCards = (cards: StudyCard[]) => {
  allStudyCards.value = [...cards]
}

// 添加卡片到末尾的辅助函数
const appendToStudyCards = (card: StudyCard) => {
  const newCards = [...allStudyCards.value]
  newCards.push(card)
  allStudyCards.value = newCards
}

// 提取音频初始化逻辑到单独的函数
const initAudio = () => {
  successAudio.src = '/static/audios/success.mp3'
  successAudio.volume = 0.5
  failAudio.src = '/static/audios/fail.mp3'
  failAudio.volume = 0.5
}

interface StudyPageQuery {
  cardBoxId: string
  mode?: string
  practice?: string
  order?: 'random' | 'sequence'
}

// 修改 onLoad 参数的类型定义
onLoad((query: Partial<StudyPageQuery>) => {
  initAudio()

  if (!query.cardBoxId) return

  cardBoxId.value = query.cardBoxId
  currentMode.value = (query.mode || StudyMode.RECALL) as StudyMode
  isPracticeMode.value = query.practice === 'true'

  // 初始化学习卡片数组
  if (query.practice === 'true') {
    // 练习模式：获取所有卡片
    const cardBox = cardDataStore.cardBoxList.find((box) => box.id === cardBoxId.value)
    if (cardBox) {
      const practiceCards = cardBox.cardItems.map((item) => ({
        ...item,
        type: 'new' as const,
      }))

      // 使用辅助函数更新数组
      updateAllStudyCards(query.order === 'random' ? _.shuffle(practiceCards) : practiceCards)
    }
  } else {
    // 正常学习模式：使用今日学习卡片
    const cards = cardBoxStore.getTodayStudyCards(cardBoxId.value)
    todayCards.value = cards
    updateAllStudyCards([...cards.newCards, ...cards.reviewCards])
  }

  settingsStore.checkAIFeature()
  // 初始化第一道题
  initFirstQuiz()
})

// 添加一个 Map 来追踪每张卡片的加载状态
const loadingCards = new Map<string, Promise<any>>()

// 修改生成题目的函数
const generateQuiz = async (card: any, isPreload: boolean = false) => {
  // 如果已经有缓存的题目，直接返回
  if (card.quiz) return card.quiz

  // 如果这张卡片正在加载中，等待加载完成
  if (loadingCards.has(card.id)) {
    return loadingCards.get(card.id)
  }

  // 检查额度
  if (!checkAIQuota(isPreload)) {
    if (!isPreload) {
      currentMode.value = StudyMode.RECALL
      uni.showToast({
        title: '额度不足，已切换至回忆模式',
        icon: 'none',
      })
    }
    return null
  }

  try {
    // 创建加载 Promise 并存储
    const loadingPromise = generateQuizWithAI(card.frontContent, card.backContent)
    loadingCards.set(card.id, loadingPromise)

    const quiz = await loadingPromise
    if (quiz) {
      card.quiz = quiz
    }
    return quiz
  } catch (error) {
    console.error('生成题目失败:', error)
    if (!isPreload) {
      currentMode.value = StudyMode.RECALL
      uni.showToast({
        title: '生成题目失败，已切换至回忆模式',
        icon: 'none',
      })
    }
    return null
  } finally {
    // 完成后删除加载状态
    loadingCards.delete(card.id)
  }
}

// 修改初始化第一道题的函数
const initFirstQuiz = async () => {
  if (currentMode.value !== StudyMode.QUIZ || !settingsStore.showAIFeature) {
    initialLoading.value = false
    if (autoReadFront.value && currentCard.value) {
      nextTick(() => {
        frontSpeakRef.value?.speak?.()
      })
    }
    return
  }

  const firstCard = currentCard.value
  if (firstCard) {
    try {
      quizState.loading = true
      quizState.quiz = await generateQuiz(firstCard, false)

      // 预加载下一题
      const nextCard = allStudyCards.value[currentCardIndex.value + 1]
      if (nextCard) {
        generateQuiz(nextCard, true)
      }
    } finally {
      quizState.loading = false
      initialLoading.value = false
      if (autoReadFront.value) {
        nextTick(() => {
          frontSpeakRef.value?.speak?.()
        })
      }
    }
  } else {
    initialLoading.value = false
    quizState.loading = false
  }
}

// 清理音频实例
onUnload(() => {
  successAudio.destroy()
  failAudio.destroy()
  manager.stop()
})

// 同步卡盒的内容设置
const isContentCentered = computed(() => cardBoxStore.getCardBoxContentAlign(cardBoxId.value))
const isLargeFont = computed(() => cardBoxStore.getCardBoxFontSize(cardBoxId.value))

const cardDataStore = useCardDataStore()
const cardBoxStore = useCardBoxStore()
const settingsStore = useSettingsStore()
const userStore = useUserStore()
const { quotaInfo } = storeToRefs(userStore)

// 获取卡盒数据
const currentCardIndex = ref(0)
// 获取今日学习数据
const studyProgress = computed(() => {
  const remainingStudyCards = allStudyCards.value.slice(currentCardIndex.value)
  if (isPracticeMode.value) {
    // 练习模式下只显示剩余卡片数量
    return {
      newCards: remainingStudyCards.length,
      reviewCards: 0,
    }
  }
  // 正常学习模式下区分新卡片和复习卡片
  return {
    newCards: remainingStudyCards.filter((card) => card.type === 'new').length,
    reviewCards: remainingStudyCards.filter((card) => card.type === 'review').length,
  }
})

const currentCard = computed(() => allStudyCards.value[currentCardIndex.value])

const back = () => {
  uni.navigateBack()
}

// 是否显示背面
const showingBack = ref(false)
// 最后的回答
const lastAnswer = ref<'know' | 'dontKnow' | null>(null)

// 修改处理"记得"按钮点击的逻辑
const handleKnow = () => {
  vibrate()
  if (settingsStore.soundEffect) {
    successAudio.play()
  }
  // 更新UI状态
  showingBack.value = true
  lastAnswer.value = 'know'
}

// 处理"不记得"按钮点击
const handleDontKnow = () => {
  vibrate()
  if (settingsStore.soundEffect) {
    failAudio.play()
  }
  showingBack.value = true
  lastAnswer.value = 'dontKnow'
  reciteState.showResult = false
}

// 添加一个临时变量用于保存当前显示的背面内容
const displayBackContent = ref('')

// 添加选择题相关的状态
const quizState = reactive({
  quiz: null as null | { o: { text: string; analysis: string }[]; a: number },
  selectedAnswer: null as null | number,
  showAnalysis: false,
  isCorrect: false,
  loading: false,
  nextQuiz: null as null | { o: { text: string; analysis: string }[]; a: number }, // 预加载的下一题
})

// 修改 watch currentCard，移除生成题目的逻辑
watch(currentCard, () => {
  if (!currentCard.value) {
    showingBack.value = false
    lastAnswer.value = null
    return
  }

  // 停止朗读
  if (playingState.frontPlaying) {
    frontSpeakRef.value?.stop?.()
  }
  if (playingState.backPlaying) {
    backSpeakRef.value?.stop?.()
  }
})

// 提取重置状态的逻辑到单独的函数
const resetStates = () => {
  showingBack.value = false
  lastAnswer.value = null
  quizState.selectedAnswer = null
  quizState.showAnalysis = false
  quizState.isCorrect = false
  reciteState.userAnswer = ''
  reciteState.score = 0
  reciteState.reason = ''
}

// 修改 nextCard 函数
const nextCard = async () => {
  const currentCard = allStudyCards.value[currentCardIndex.value]
  if (!currentCard) return

  // 1. 停止当前卡片的所有活动
  stopAllSpeaking()
  vibrate()

  // 2. 处理当前卡片的学习状态
  handleCurrentCardState(currentCard)

  // 3. 准备切换到下一张卡片
  displayBackContent.value = currentCard.backContent || ''
  currentCardIndex.value++

  // 4. 获取下一张卡片并重置状态
  const nextCard = allStudyCards.value[currentCardIndex.value]
  resetStates()

  if (!nextCard) return

  // 5. 检查复述模式下的额度
  if (currentMode.value === StudyMode.RECITE && !checkAIQuota()) {
    // checkAIQuota 会自动切换到回忆模式并显示提示
    return
  }

  // 6. 处理单选模式的特殊逻辑
  if (currentMode.value === StudyMode.QUIZ) {
    await handleQuizModeNextCard(nextCard)
  }

  // 7. 清理和后续处理
  cleanupAndPostProcess(nextCard)
}

// 处理当前卡片的学习状态
const handleCurrentCardState = (card: any) => {
  if (isPracticeMode.value) {
    // 练习模式下，只有当用户不记得或答错时，才将卡片加入到队列末尾
    if (
      lastAnswer.value === 'dontKnow' ||
      (currentMode.value === StudyMode.QUIZ && !quizState.isCorrect)
    ) {
      // 使用辅助函数添加卡片
      appendToStudyCards({
        ...card,
        quiz: card.quiz,
      })
    }
    return
  }

  // 正常学习模式的逻辑保持不变
  if (lastAnswer.value === 'know' || quizState.isCorrect) {
    // 记得或答对了，更新学习状态（进入下一阶段）
    cardBoxStore.updateCardStudyState(cardBoxId.value, card.id)
  } else {
    // 使用辅助函数添加卡片
    appendToStudyCards({
      ...card,
      quiz: card.quiz,
    })
  }
}

// 处理单选模式下的下一张卡片
const handleQuizModeNextCard = async (nextCard: any) => {
  quizState.loading = true
  try {
    // 获取当前卡片的题目（可能是预加载好的）
    quizState.quiz = await generateQuiz(nextCard, false)

    // 预加载下一题
    const nextNextCard = allStudyCards.value[currentCardIndex.value + 1]
    if (nextNextCard) {
      generateQuiz(nextNextCard, true)
    }
  } finally {
    quizState.loading = false
  }
}

// 清理和后续处理
const cleanupAndPostProcess = (nextCard: any) => {
  // 等待翻转动画完成后再清空临时内容
  _.delay(() => {
    displayBackContent.value = ''
  }, 300)

  // 自动朗读
  if (autoReadFront.value) {
    _.delay(() => {
      if (nextCard) {
        frontSpeakRef.value?.speak?.()
      }
    }, 400)
  }
}

// 完成学习
const completeStudy = () => {
  // 返回上一页
  uni.navigateBack()
}

// 添加朗读状态
const playingState = reactive({
  frontPlaying: false,
  backPlaying: false,
})

// 添加朗读按钮引用
const frontSpeakRef = ref<{ speak: () => void; stop: () => void } | null>(null)
const backSpeakRef = ref<{ speak: () => void; stop: () => void } | null>(null)

// 统一的停止朗读函数
const stopAllSpeaking = () => {
  if (playingState.frontPlaying) {
    frontSpeakRef.value?.stop?.()
    playingState.frontPlaying = false
  }
  if (playingState.backPlaying) {
    backSpeakRef.value?.stop?.()
    playingState.backPlaying = false
  }
}

// 延迟朗读函数
const delayedSpeak = (speakRef: any, delay: number = 300) => {
  stopAllSpeaking()
  setTimeout(() => {
    if (currentCard.value) {
      speakRef.value?.speak?.()
    }
  }, delay)
}

// 在翻转卡片时停止朗读
watch(showingBack, (newValue) => {
  stopAllSpeaking()

  // 等待翻转动画完成后再朗读背面
  if (newValue && autoReadBack.value) {
    delayedSpeak(backSpeakRef)
  }
})

// 在切换卡片时停止朗读
watch(currentCard, () => {
  stopAllSpeaking()
})

// 处理选项选择
const handleOptionSelect = (index: number) => {
  if (quizState.selectedAnswer !== null) return
  vibrate()
  quizState.selectedAnswer = index
  quizState.showAnalysis = true
  quizState.isCorrect = index === quizState.quiz?.a
  showingBack.value = true
  lastAnswer.value = quizState.isCorrect ? 'know' : 'dontKnow'

  // 播放音效
  if (settingsStore.soundEffect) {
    if (quizState.isCorrect) {
      successAudio.play()
    } else {
      failAudio.play()
    }
  }
}

// 复述模式状态
const reciteState = reactive({
  userAnswer: '',
  score: 0,
  reason: '',
  loading: false,
  recordLoading: false,
  showResult: false,
  isRecording: false,
})

// 初始化语音识别管理器
const plugin = requirePlugin('WechatSI')
const manager = plugin.getRecordRecognitionManager()

// 在 script setup 中添加新的响应式变量
const cursorPosition = ref(0)

// 添加 onblur 事件处理函数来记录光标位置
const handleTextareaBlur = (e: any) => {
  cursorPosition.value = e.target.cursor || 0
}

manager.onStop = (res) => {
  if (res.result) {
    const value = reciteState.userAnswer
    // 使用保存的光标位置
    const newValue =
      value.slice(0, cursorPosition.value) +
      (cursorPosition.value > 0 && !value.endsWith(' ') ? ' ' : '') +
      res.result +
      value.slice(cursorPosition.value)

    reciteState.userAnswer = newValue
    // 更新光标位置
    cursorPosition.value =
      cursorPosition.value +
      res.result.length +
      (cursorPosition.value > 0 && !value.endsWith(' ') ? 1 : 0)
  }
  reciteState.isRecording = false
}

manager.onError = (res) => {
  console.error('语音识别错误:', res.msg)
  reciteState.isRecording = false
  reciteState.recordLoading = false
}

manager.onStart = () => {
  reciteState.recordLoading = false
}

// 处理语音输入
const handleVoiceInput = () => {
  vibrate()
  if (reciteState.isRecording) {
    reciteState.isRecording = false
    manager.stop()
  } else {
    reciteState.isRecording = true
    reciteState.recordLoading = true
    manager.start({ duration: 30000, lang: 'zh_CN' })
  }
}

// 处理答案检查
const handleCheckAnswer = async () => {
  if (!reciteState.userAnswer) return
  vibrate()

  // 回忆模式下直接显示答案
  if (currentMode.value === StudyMode.RECALL) {
    showingBack.value = true
    lastAnswer.value = 'know' // 在回忆模式下，用户自己判断是否记住
    return
  }

  // 复述模式
  if (currentMode.value === StudyMode.RECITE) {
    // 检查额度
    if (!checkAIQuota()) return

    reciteState.loading = true
    try {
      const result = await checkAnswerWithAI(
        currentCard.value.frontContent,
        currentCard.value.backContent,
        reciteState.userAnswer,
      )

      reciteState.loading = false
      if (result) {
        reciteState.score = parseInt(result.percent)
        reciteState.reason = result.reason
        reciteState.showResult = true
        showingBack.value = true
        if (reciteState.score >= 80) {
          successAudio.play()
          lastAnswer.value = 'know'
        } else {
          failAudio.play()
          lastAnswer.value = 'dontKnow'
        }
      }
    } catch (error) {
      console.error('检查答案失败:', error)
      reciteState.loading = false
    }
  }
}

// 检查AI额度是否足够
const checkAIQuota = (isPreload: boolean = false) => {
  const remaining = quotaInfo.value.total - quotaInfo.value.used
  if (remaining < 1) {
    // 只在复述模式下切换到回忆模式
    if (!isPreload && currentMode.value === StudyMode.RECITE) {
      currentMode.value = StudyMode.RECALL
      reciteState.userAnswer = ''
      reciteState.score = 0
      reciteState.reason = ''
      reciteState.showResult = false
      reciteState.loading = false
      // 提示用户
      uni.showToast({
        title: '额度不足，已切换至回忆模式',
        icon: 'none',
      })
    }
    return false
  }
  return true
}

// 获取自动朗读设置
const autoReadFront = computed(() => cardBoxStore.getCardBoxAutoReadFront(cardBoxId.value))
const autoReadBack = computed(() => cardBoxStore.getCardBoxAutoReadBack(cardBoxId.value))

// 添加一个计算属性判断是否完成学习
const isStudyCompleted = computed(() => {
  return !currentCard.value
})

// 添加练习模式标识
const isPracticeMode = ref(false)

// 修改导航栏显示
const navbarTitle = computed(() => {
  if (isPracticeMode.value) {
    return '练习模式'
  }
  return cardBoxData.value?.name || '学习'
})

// 修改进度显示文案
const progressText = computed(() => {
  if (isPracticeMode.value) {
    return {
      newCards: '剩余卡片',
      reviewCards: '',
    }
  }
  return {
    newCards: '待新学',
    reviewCards: '待复习',
  }
})

// 修改完成学习的标题和文案
const completionTitle = computed(() => (isPracticeMode.value ? '练习完成' : '完成学习'))
const completionMessage = computed(() =>
  isPracticeMode.value ? '太棒了！你完成了这组卡片的练习！' : '恭喜你完成了今天的学习任务！',
)
</script>

<style scoped>
@keyframes recording-wave {
  0% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.3);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
}

.recording-button {
  animation: recording-wave 2s infinite;
}

@keyframes zoom-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-zoom-in {
  animation: zoom-in 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.loading-ring {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  overflow: hidden;
  border-radius: 50%;
}

.loading-ring-gradient {
  position: absolute;
  inset: 0;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgb(99 102 241 / 0.08) 60deg,
    rgb(99 102 241 / 0.12) 120deg,
    rgb(99 102 241 / 0.08) 180deg,
    transparent 360deg
  );
  animation: loading-ring 2s linear infinite;
}

.loading-ring-inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  margin: 4px;
  background: white;
  border-radius: 50%;
  box-shadow: inset 0 2px 4px rgb(99 102 241 / 0.05);
}

@keyframes loading-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(0.92);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-pulse {
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes particle {
  0% {
    opacity: 0;
    transform: rotate(var(--rotation)) translateY(-25px) scale(0.8);
  }
  50% {
    opacity: 1;
    transform: rotate(var(--rotation)) translateY(-35px) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: rotate(var(--rotation)) translateY(-25px) scale(0.8);
  }
}

.animate-particle {
  transform-origin: center;
  animation: particle 2s ease-in-out infinite;
  --rotation: 0deg;
}

.animate-trophy {
  animation: trophy-bounce 2s ease-in-out infinite;
}

@keyframes trophy-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.animate-trophy-shine {
  animation: trophy-shine 2s ease-in-out infinite;
}

@keyframes trophy-shine {
  0%,
  100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}
</style>
