<!-- src/components/HiraganaItem.vue -->
<script setup lang="ts">
import type { HiraganaChar } from '../types';

defineProps<{
  data: HiraganaChar;
  showRomaji: boolean;
  useCardStyle: boolean;
}>();
</script>

<template>
  <div 
    class="flex flex-col items-center justify-center transition-all duration-300 select-none p-2"
    :class="[
      useCardStyle 
        ? 'bg-white shadow-md rounded-xl border border-gray-100 aspect-square hover:scale-105' 
        : 'bg-transparent border-none shadow-none'
    ]"
  >
    <span class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800">{{ data.char }}</span>
    <span 
      class="text-xs md:text-sm lg:text-base text-gray-500 mt-1 transition-opacity duration-200"
      :class="showRomaji ? 'opacity-100' : 'opacity-0'"
    >
      {{ data.romaji }}
    </span>
  </div>
</template>