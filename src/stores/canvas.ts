import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { storage } from '../services/storage';

interface HistoryState {
  pixels: Map<string, string>;
  timestamp: number;
}

export const useCanvasStore = defineStore('canvas', () => {
  // 画布大小
  const width = ref(100);
  const height = ref(100);
  
  // 画布数据，使用 Map 存储以提高性能
  const pixels = ref(new Map<string, string>());
  
  // 缩放和位置状态
  const scale = ref(1);
  const position = ref({ x: 0, y: 0 });
  
  // 历史记录
  const history = ref<HistoryState[]>([]);
  const currentHistoryIndex = ref(-1);
  const maxHistorySize = 50;
  
  // 计算属性
  const canUndo = computed(() => currentHistoryIndex.value > 0);
  const canRedo = computed(() => currentHistoryIndex.value < history.value.length - 1);
  
  // 保存当前状态到历史记录
  const saveToHistory = () => {
    const newState: HistoryState = {
      pixels: new Map(pixels.value),
      timestamp: Date.now()
    };
    
    // 如果我们在历史记录中间进行了更改，删除后面的记录
    if (currentHistoryIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentHistoryIndex.value + 1);
    }
    
    // 添加新状态
    history.value.push(newState);
    
    // 限制历史记录大小
    if (history.value.length > maxHistorySize) {
      history.value = history.value.slice(history.value.length - maxHistorySize);
    }
    
    currentHistoryIndex.value = history.value.length - 1;
  };
  
  // 设置像素颜色并保存历史
  const setPixel = (x: number, y: number, color: string | null) => {
    if (x >= 0 && x < width.value && y >= 0 && y < height.value) {
      const key = `${x},${y}`;
      const oldColor = pixels.value.get(key);
      
      if (oldColor !== color) {
        if (color === null) {
          pixels.value.delete(key);
        } else {
          pixels.value.set(key, color);
        }
        saveToHistory();
      }
    }
  };
  
  // 撤销
  const undo = () => {
    if (canUndo.value) {
      currentHistoryIndex.value--;
      pixels.value = new Map(history.value[currentHistoryIndex.value].pixels);
    }
  };
  
  // 重做
  const redo = () => {
    if (canRedo.value) {
      currentHistoryIndex.value++;
      pixels.value = new Map(history.value[currentHistoryIndex.value].pixels);
    }
  };
  
  // 清除画布
  const clearCanvas = () => {
    pixels.value.clear();
    saveToHistory();
  };
  
  // 初始化历史记录
  saveToHistory();
  
  // 添加网格显示状态
  const showGrid = ref(true);
  
  // 调整画布大小
  const resizeCanvas = (newWidth: number, newHeight: number) => {
    // 创建新的像素映射
    const newPixels = new Map<string, string>();
    
    // 复制现有像素
    for (let y = 0; y < Math.min(height.value, newHeight); y++) {
      for (let x = 0; x < Math.min(width.value, newWidth); x++) {
        const color = pixels.value.get(`${x},${y}`);
        if (color) {
          newPixels.set(`${x},${y}`, color);
        }
      }
    }
    
    // 更新状态
    width.value = newWidth;
    height.value = newHeight;
    pixels.value = newPixels;
    
    // 保存到历史记录
    saveToHistory();
  };
  
  // 加载保存的数据
  const loadFromStorage = () => {
    const data = storage.load();
    if (data) {
      width.value = data.w;
      height.value = data.h;
      pixels.value = storage.decompress(data);
    }
  };
  
  // 保存数据到 storage
  const saveToStorage = () => {
    const data = storage.compress(pixels.value, width.value, height.value);
    storage.save(data);
  };
  
  // 监听画布变化并保存
  watch(
    [pixels, width, height],
    () => {
      saveToStorage();
    },
    { deep: true }
  );
  
  // 初始化时加载数据
  loadFromStorage();
  
  // 如果没有历史记录，初始化一个
  if (history.value.length === 0) {
    saveToHistory();
  }
  
  return {
    width,
    height,
    pixels,
    scale,
    position,
    canUndo,
    canRedo,
    getPixel: (x: number, y: number) => pixels.value.get(`${x},${y}`) || null,
    setPixel,
    clearCanvas,
    undo,
    redo,
    showGrid,
    resizeCanvas,
    loadFromStorage,
    saveToStorage,
  };
}); 