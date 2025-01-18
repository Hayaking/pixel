<template>
  <div class="tools-panel">
    <div class="tools-section">
      <div class="tools-grid">
        <button 
          v-for="tool in tools" 
          :key="tool.type"
          class="tool-btn"
          :class="{ active: currentTool === tool.type }"
          :title="tool.name"
          @click="currentTool = tool.type"
        >
          <Icon :icon="tool.icon" />
        </button>
      </div>
    </div>
    <div class="tools-section">
      <ColorPicker v-model="selectedColor" />
    </div>
    <div class="tools-section brush-size">
      <input
        type="range"
        v-model="brushSize"
        min="1"
        max="5"
        class="brush-slider"
      />
      <span class="brush-value">{{ brushSize }}</span>
    </div>
    <div class="tools-section">
      <div class="tools-grid">
        <button 
          class="tool-btn" 
          :disabled="!canUndo"
          title="撤销"
          @click="canvasStore.undo()"
        >
          <Icon icon="ph:arrow-counter-clockwise-bold" />
        </button>
        <button 
          class="tool-btn" 
          :disabled="!canRedo"
          title="重做"
          @click="canvasStore.redo()"
        >
          <Icon icon="ph:arrow-clockwise-bold" />
        </button>
        <button 
          class="tool-btn"
          title="清除画布" 
          @click="handleClear"
        >
          <Icon icon="ph:eraser-bold" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import ColorPicker from './ColorPicker.vue';
import { useToolsStore } from '../stores/tools';
import { useCanvasStore } from '../stores/canvas';
import { ToolType } from '../types/tools';

const toolsStore = useToolsStore();
const canvasStore = useCanvasStore();
const { selectedColor, brushSize, currentTool } = storeToRefs(toolsStore);
const { canUndo, canRedo } = storeToRefs(canvasStore);

const tools = [
  { type: ToolType.BRUSH, name: '画笔', icon: 'ph:pencil-bold' },
  { type: ToolType.LINE, name: '直线', icon: 'ph:line-segment-bold' },
  { type: ToolType.RECTANGLE, name: '矩形', icon: 'ph:square-bold' },
  { type: ToolType.ERASER, name: '橡皮擦', icon: 'ph:eraser-bold' },
  { type: ToolType.FILL, name: '填充', icon: 'ph:paint-bucket-bold' },
  { type: ToolType.MOVE, name: '移动画布', icon: 'ph:arrows-out-bold' }
];

const handleClear = () => {
  if (confirm('确定要清除画布吗？')) {
    canvasStore.clearCanvas();
  }
};
</script>

<style scoped lang="scss">
.tools-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
}

.tools-section {
  &:not(:last-child) {
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-color);
  }
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
}

.tool-btn {
  aspect-ratio: 1;
  padding: 0.5rem;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  .icon {
    width: 18px;
    height: 18px;
  }

  &:hover:not(:disabled) {
    background-color: var(--border-color);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.active {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
    color: white;

    &:hover {
      background-color: var(--primary-color);
    }
  }
}

.brush-size {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brush-slider {
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    background: var(--primary-color);
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.2);
    }
  }
}

.brush-value {
  min-width: 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
}
</style> 