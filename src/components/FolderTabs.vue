<template>
  <scroll-view scroll-x :show-scrollbar="false" class="flex-none overflow-x-auto h-10" enhanced>
    <view class="inline-flex gap-1.5 px-3 h-full items-center">
      <!-- 默认目录 - 只在传入的 folders 中有 default 时才显示 -->
      <view
        v-if="hasDefaultFolder"
        class="flex items-center h-8 gap-1 px-2.5 rounded-lg text-sm whitespace-nowrap transition-colors"
        :class="[
          currentFolderId === 'default'
            ? 'bg-gray-100 text-gray-700'
            : 'text-gray-500 hover:bg-gray-50',
        ]"
        @tap="$emit('update:modelValue', 'default')"
      >
        <text
          class="text-[15px]"
          :class="[
            currentFolderId === 'default' ? 'i-tabler-folder-open' : 'i-tabler-folder',
            currentFolderId === 'default' ? 'text-gray-600' : 'text-gray-400',
          ]"
        />
        <text>默认目录</text>
        <text
          v-if="showCount && getFolderCount"
          class="text-xs ml-0.5"
          :class="currentFolderId === 'default' ? 'text-gray-500' : 'text-gray-400'"
        >
          ({{ getFolderCount('default') }})
        </text>
      </view>

      <!-- 其他目录 -->
      <view
        v-for="folder in nonDefaultFolders"
        :key="folder.id"
        class="flex items-center h-8 gap-1 px-2.5 rounded-lg text-sm whitespace-nowrap transition-colors"
        :class="[
          currentFolderId === folder.id
            ? 'bg-gray-100 text-gray-700'
            : 'text-gray-500 hover:bg-gray-50',
        ]"
        @tap="$emit('update:modelValue', folder.id)"
      >
        <text
          class="text-[15px]"
          :class="[
            currentFolderId === folder.id ? 'i-tabler-folder-open' : 'i-tabler-folder',
            currentFolderId === folder.id ? 'text-gray-600' : 'text-gray-400',
          ]"
        />
        <text>{{ folder.name }}</text>
        <text
          v-if="showCount && getFolderCount"
          class="text-xs ml-0.5"
          :class="currentFolderId === folder.id ? 'text-gray-500' : 'text-gray-400'"
        >
          ({{ getFolderCount(folder.id) }})
        </text>
      </view>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
const props = defineProps<{
  folders: Array<{ id: string; name: string }> | null
  modelValue: string
  showCount?: boolean
  getFolderCount?: (folderId: string) => number
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const currentFolderId = computed(() => props.modelValue)
const folderList = computed(() => props.folders || [])

// 检查是否有默认文件夹
const hasDefaultFolder = computed(() => folderList.value.some((f) => f.id === 'default'))

// 获取非默认文件夹列表
const nonDefaultFolders = computed(() => folderList.value.filter((f) => f.id !== 'default'))
</script>
