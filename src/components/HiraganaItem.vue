<!-- src/components/HiraganaItem.vue -->
<script setup lang="ts">
import type { StudyItem } from '../types';

defineProps<{
  data: StudyItem;
  showRomaji: boolean;
  useCardStyle: boolean;
}>();
</script>

<template>
  <div 
    class="flex flex-col items-center justify-center transition-all duration-300 select-none p-1 sm:p-2 min-w-0"
    :class="[
      useCardStyle 
        ? 'bg-white shadow-md rounded-xl border border-gray-100 aspect-square hover:scale-105' 
        : 'bg-transparent border-none shadow-none'
    ]"
  >
    <span class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 w-full text-center px-1 truncate">{{ data.text }}</span>
    <span 
      class="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-500 mt-0.5 sm:mt-1 transition-opacity duration-200 text-center w-full px-1 truncate"
      :class="showRomaji ? 'opacity-100' : 'opacity-0'"
    >
      {{ data.romaji }} <span v-if="data.meaning" class="text-gray-400 hidden sm:inline">({{ data.meaning }})</span>
    </span>
  </div>
</template>