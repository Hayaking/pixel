<template>
  <div class="settings-panel">
    <h3 class="title">画布设置</h3>
    <div class="settings-group">
      <label>画布大小</label>
      <div class="size-inputs">
        <input 
          type="number" 
          v-model.number="tempWidth"
          min="10"
          max="500"
        />
        <span>×</span>
        <input 
          type="number" 
          v-model.number="tempHeight"
          min="10"
          max="500"
        />
        <button 
          class="apply-btn"
          @click="applySize"
          :disabled="!isSizeValid"
        >
          应用
        </button>
      </div>
    </div>
    <div class="settings-group">
      <label class="checkbox-label">
        <input 
          type="checkbox"
          v-model="showGrid"
        />
        显示网格
      </label>
    </div>
    <div class="settings-group">
      <button 
        class="tool-btn"
        @click="exportImage"
      >
        <Icon icon="ph:download-bold" />
        导出图片
      </button>
    </div>
    <div class="settings-group">
      <label class="checkbox-label">
        <input 
          type="checkbox"
          :checked="themeStore.theme === 'dark'"
          @change="themeStore.toggleTheme"
        />
        夜间模式
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useCanvasStore } from '../stores/canvas';
import { useThemeStore } from '../stores/theme';
import { storeToRefs } from 'pinia';

const canvasStore = useCanvasStore();
const themeStore = useThemeStore();
const { width, height, showGrid } = storeToRefs(canvasStore);

const tempWidth = ref(width.value);
const tempHeight = ref(height.value);

const isSizeValid = computed(() => {
  return tempWidth.value >= 10 && 
         tempWidth.value <= 500 && 
         tempHeight.value >= 10 && 
         tempHeight.value <= 500;
});

const applySize = () => {
  if (isSizeValid.value) {
    canvasStore.resizeCanvas(tempWidth.value, tempHeight.value);
  }
};

const exportImage = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const pixelSize = 1; // 导出时每个像素的大小

  canvas.width = width.value * pixelSize;
  canvas.height = height.value * pixelSize;

  // 设置背景色
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制像素
  for (let y = 0; y < height.value; y++) {
    for (let x = 0; x < width.value; x++) {
      const color = canvasStore.getPixel(x, y);
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(
          x * pixelSize,
          y * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }
  }

  // 下载图片
  const link = document.createElement('a');
  link.download = 'pixel-art.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
};
</script>

<style scoped lang="scss">
.settings-panel {
  padding: 1rem;
}

.title {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: var(--text-primary);
}

.settings-group {
  margin-bottom: 0.75rem;

  &:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-secondary);
  }
}

.size-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  input {
    width: 60px;
    padding: 0.25rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--surface-color);
    color: var(--text-primary);
    text-align: center;
  }

  span {
    color: var(--text-secondary);
  }
}

.apply-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--surface-color);
  color: var(--text-primary);
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: var(--border-color);
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--text-primary);

  input {
    margin: 0;
  }
}

.tool-btn {
  width: 100%;
  padding: 0.5rem;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--border-color);
  }

  .icon {
    width: 20px;
    height: 20px;
  }
}
</style> 