<template>
  <div 
    ref="containerRef"
    class="canvas-container"
    :class="{ 
      'hide-grid': !showGrid,
      'move-cursor': currentTool === ToolType.MOVE
    }"
    @wheel="handleWheel"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseLeave"
    @contextmenu.prevent
  >
    <div class="canvas-background" />
    <div 
      class="canvas"
      :style="{
        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        width: `${width * cellSize}px`,
        height: `${height * cellSize}px`,
      }"
    >
      <div 
        v-for="y in height" 
        :key="y"
        class="row"
      >
        <div
          v-for="x in width"
          :key="x"
          class="cell"
          :style="{
            backgroundColor: getCellColor(x - 1, y - 1),
            width: `${cellSize}px`,
            height: `${cellSize}px`,
          }"
          @mousedown="(e) => startDrawing(x - 1, y - 1, e)"
          @mousemove="() => handleCellHover(x - 1, y - 1)"
          @mouseleave="() => handleCellMouseLeave(x - 1, y - 1)"
        />
      </div>
    </div>
    <div 
      v-if="hoveredCell"
      class="coordinates-tooltip"
      :style="{
        left: tooltipPosition.x + 'px',
        top: tooltipPosition.y + 'px'
      }"
    >
      {{ hoveredCell.x }}, {{ hoveredCell.y }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCanvasStore } from '../stores/canvas';
import { useToolsStore } from '../stores/tools';
import { storeToRefs } from 'pinia';
import { ToolType } from '../types/tools';

const canvasStore = useCanvasStore();
const toolsStore = useToolsStore();
const { width, height, scale, position, showGrid } = storeToRefs(canvasStore);
const { selectedColor, brushSize, currentTool } = storeToRefs(toolsStore);
const { getPixel, setPixel } = canvasStore;

const cellSize = 20; // 每个像素的大小
const containerRef = ref<HTMLElement | null>(null);
const isDrawing = ref(false);
const isPanning = ref(false);
const lastPanPosition = ref({ x: 0, y: 0 });
const drawStart = ref({ x: 0, y: 0 });
const previewPixels = ref(new Map<string, string>());

// 添加悬停状态
const hoveredCell = ref<{ x: number; y: number } | null>(null);
const tooltipPosition = ref({ x: 0, y: 0 });

// 缩放处理
const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.min(Math.max(scale.value * delta, 0.1), 10);
  
  // 计算鼠标位置相对于画布的偏移
  const rect = containerRef.value!.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // 调整位置以保持鼠标指向的点不变
  position.value.x = x - (x - position.value.x) * (newScale / scale.value);
  position.value.y = y - (y - position.value.y) * (newScale / scale.value);
  
  scale.value = newScale;
};

// 平移处理
const startPan = (e: MouseEvent) => {
  if (currentTool.value === ToolType.MOVE || e.button === 1 || e.button === 2) {
    e.preventDefault();
    isPanning.value = true;
    lastPanPosition.value = { x: e.clientX, y: e.clientY };
  }
};

const pan = (e: MouseEvent) => {
  if (isPanning.value) {
    const dx = e.clientX - lastPanPosition.value.x;
    const dy = e.clientY - lastPanPosition.value.y;
    position.value.x += dx;
    position.value.y += dy;
    lastPanPosition.value = { x: e.clientX, y: e.clientY };
  }
};

const stopPan = () => {
  isPanning.value = false;
};

// 绘制处理
const startDrawing = (x: number, y: number, e: MouseEvent) => {
  if (e.button !== 0) return; // 只响应左键
  
  isDrawing.value = true;
  drawStart.value = { x, y };
  
  if (currentTool.value === ToolType.BRUSH || currentTool.value === ToolType.ERASER) {
    draw(x, y);
  } else if (currentTool.value === ToolType.FILL) {
    floodFill(x, y, selectedColor.value);
  }
};

const draw = (x: number, y: number) => {
  if (!isDrawing.value) return;

  const color = currentTool.value === ToolType.ERASER ? null : selectedColor.value;
  
  switch (currentTool.value) {
    case ToolType.BRUSH:
    case ToolType.ERASER:
      drawBrush(x, y, color);
      break;
    case ToolType.LINE:
      drawPreviewLine(drawStart.value.x, drawStart.value.y, x, y, color);
      break;
    case ToolType.RECTANGLE:
      drawPreviewRect(drawStart.value.x, drawStart.value.y, x, y, color);
      break;
  }
};

// 结束绘制
const endDrawing = () => {
  if (!isDrawing.value) return;
  
  if (currentTool.value === ToolType.LINE || currentTool.value === ToolType.RECTANGLE) {
    // 应用预览的像素
    for (const [key, color] of previewPixels.value) {
      const [x, y] = key.split(',').map(Number);
      setPixel(x, y, color);
    }
  }
  
  isDrawing.value = false;
  previewPixels.value.clear();
};

// 绘制工具函数
const drawBrush = (x: number, y: number, color: string | null) => {
  const size = brushSize.value;
  const offset = Math.floor(size / 2);
  
  for (let i = -offset; i < size - offset; i++) {
    for (let j = -offset; j < size - offset; j++) {
      const targetX = x + i;
      const targetY = y + j;
      
      if (targetX >= 0 && targetX < width.value && targetY >= 0 && targetY < height.value) {
        if (color === null) {
          canvasStore.setPixel(targetX, targetY, null);
        } else {
          canvasStore.setPixel(targetX, targetY, color);
        }
      }
    }
  }
};

const drawPreviewLine = (x1: number, y1: number, x2: number, y2: number, color: string | null) => {
  previewPixels.value.clear();
  const points = getLinePoints(x1, y1, x2, y2);
  
  for (const point of points) {
    previewPixels.value.set(`${point.x},${point.y}`, color || 'transparent');
  }
};

const drawPreviewRect = (x1: number, y1: number, x2: number, y2: number, color: string | null) => {
  previewPixels.value.clear();
  const [minX, maxX] = [Math.min(x1, x2), Math.max(x1, x2)];
  const [minY, maxY] = [Math.min(y1, y2), Math.max(y1, y2)];
  
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      previewPixels.value.set(`${x},${y}`, color || 'transparent');
    }
  }
};

// 获取直线上的所有点
const getLinePoints = (x1: number, y1: number, x2: number, y2: number) => {
  const points: { x: number; y: number }[] = [];
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x: x1, y: y1 });
    if (x1 === x2 && y1 === y2) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x1 += sx; }
    if (e2 < dx) { err += dx; y1 += sy; }
  }

  return points;
};

// 填充工具
const floodFill = (startX: number, startY: number, newColor: string) => {
  const oldColor = getPixel(startX, startY);
  if (oldColor === newColor) return;

  const stack = [{ x: startX, y: startY }];
  
  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    const currentColor = getPixel(x, y);
    
    if (currentColor === oldColor) {
      setPixel(x, y, newColor);
      
      // 检查四个方向
      if (x > 0) stack.push({ x: x - 1, y });
      if (x < width.value - 1) stack.push({ x: x + 1, y });
      if (y > 0) stack.push({ x, y: y - 1 });
      if (y < height.value - 1) stack.push({ x, y: y + 1 });
    }
  }
};

// 获取单元格颜色
const getCellColor = (x: number, y: number) => {
  // 首先检查预览像素
  const previewColor = previewPixels.value.get(`${x},${y}`);
  if (previewColor !== undefined) {
    return previewColor;
  }
  
  // 然后检查实际像素
  const pixelColor = getPixel(x, y);
  if (pixelColor !== null) {
    return pixelColor;
  }
  
  // 如果是绘制模式且鼠标悬停，显示预览颜色
  if (isDrawing.value && currentTool.value === ToolType.BRUSH) {
    const dx = x - drawStart.value.x;
    const dy = y - drawStart.value.y;
    const size = brushSize.value;
    const offset = Math.floor(size / 2);
    
    if (Math.abs(dx) <= offset && Math.abs(dy) <= offset) {
      return selectedColor.value;
    }
  }
  
  return 'transparent';
};

// 处理单元格悬停
const handleCellHover = (x: number, y: number) => {
  hoveredCell.value = { x, y };
  
  // 更新提示框位置
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    const cellX = x * cellSize * scale.value + position.value.x;
    const cellY = y * cellSize * scale.value + position.value.y;
    
    tooltipPosition.value = {
      x: cellX + cellSize * scale.value + 10,
      y: cellY
    };
  }
};

// 处理单元格鼠标离开
const handleCellMouseLeave = (x: number, y: number) => {
  if (!isDrawing.value) {
    previewPixels.value.delete(`${x},${y}`);
  }
  hoveredCell.value = null;
};

// 统一的鼠标事件处理
const handleMouseDown = (e: MouseEvent) => {
  if (currentTool.value === ToolType.MOVE || e.button === 1 || e.button === 2) {
    startPan(e);
  }
};

const handleMouseMove = (e: MouseEvent) => {
  if (isPanning.value) {
    pan(e);
  }
};

const handleMouseUp = () => {
  stopPan();
};

// 处理容器鼠标离开
const handleMouseLeave = () => {
  stopPan();
};

onMounted(() => {
  window.addEventListener('mouseup', endDrawing);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      if (e.shiftKey) {
        canvasStore.redo();
      } else {
        canvasStore.undo();
      }
    }
  });
});
</script>

<style scoped lang="scss">
.canvas-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  cursor: crosshair;
  background: #f0f0f0; // 画布外的背景色
  user-select: none;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: linear-gradient(45deg, var(--grid-color) 25%, transparent 25%),
                      linear-gradient(-45deg, var(--grid-color) 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, var(--grid-color) 75%),
                      linear-gradient(-45deg, transparent 75%, var(--grid-color) 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    pointer-events: none;
    opacity: 0.5;
  }

  &.hide-grid {
    &::before {
      opacity: 0;
    }

    .cell {
      border-color: transparent;
    }
  }

  &.move-cursor {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }

    .cell {
      cursor: grab;

      &:active {
        cursor: grabbing;
      }

      // 移动模式下禁用单元格的悬停效果
      &:hover {
        background-color: transparent;
      }
    }
  }
}

.canvas-background {
  position: absolute;
  inset: 0;
  background: #f0f0f0; // 画布外的背景色
  
  [data-theme="dark"] & {
    background: #2a2a2a; // 深色主题下的背景色
  }
}

.canvas {
  position: absolute;
  transform-origin: 0 0;
  will-change: transform;
  background: var(--canvas-bg); // 画布本身的背景色
  box-shadow: 0 0 0 1px var(--border-color); // 添加边框以区分画布边界
}

.row {
  display: flex;
  height: 20px;
}

.cell {
  width: 20px;
  height: 20px;
  border: 1px solid var(--grid-color);
  box-sizing: border-box;
  transition: background-color 0.1s ease;
  
  &:hover {
    background-color: rgba(var(--primary-color-rgb), 0.1);
  }
}

.coordinates-tooltip {
  position: absolute;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--text-primary);
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style> 