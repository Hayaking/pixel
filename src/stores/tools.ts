import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ToolType } from '../types/tools';

export const useToolsStore = defineStore('tools', () => {
  const selectedColor = ref('#000000');
  const brushSize = ref(1);
  const currentTool = ref<ToolType>(ToolType.BRUSH);

  return {
    selectedColor,
    brushSize,
    currentTool
  };
}); 