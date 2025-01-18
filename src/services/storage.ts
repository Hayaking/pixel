interface RLEData {
  w: number;   // width
  h: number;   // height
  d: string[]; // 压缩后的数据: [x,y,color,count]
  v: number;   // 版本号，用于后续数据结构升级
}

const STORAGE_KEY = 'pixel-canvas';
const CURRENT_VERSION = 1;

// 数据迁移函数
function migrateData(data: unknown): RLEData | null {
  // 处理旧版本数据迁移
  // 目前是第一个版本，所以直接返回 null
  return null;
}

export const storage = {
  // 保存数据
  save(data: RLEData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...data,
        v: CURRENT_VERSION
      }));
    } catch (error) {
      console.error('Failed to save canvas data:', error);
    }
  },

  // 加载数据
  load(): RLEData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const data = JSON.parse(raw);
      
      // 版本检查
      if (!data.v || data.v < CURRENT_VERSION) {
        // 处理数据迁移
        return migrateData(data);
      }

      return data;
    } catch (error) {
      console.error('Failed to load canvas data:', error);
      return null;
    }
  },

  // 清除数据
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  // 压缩数据
  compress(pixels: Map<string, string>, width: number, height: number): RLEData {
    const pixelArray = Array.from(pixels.entries())
      .map(([key, color]) => {
        const [x, y] = key.split(',').map(Number);
        return { x, y, color };
      })
      .sort((a, b) => a.y - b.y || a.x - b.x);

    const compressed: string[] = [];
    if (pixelArray.length > 0) {
      let current = pixelArray[0];
      let count = 1;

      for (let i = 1; i < pixelArray.length; i++) {
        const pixel = pixelArray[i];
        if (pixel.y === current.y && 
            pixel.x === current.x + count && 
            pixel.color === current.color) {
          count++;
        } else {
          compressed.push(
            current.x.toString(),
            current.y.toString(),
            current.color,
            count.toString()
          );
          current = pixel;
          count = 1;
        }
      }

      compressed.push(
        current.x.toString(),
        current.y.toString(),
        current.color,
        count.toString()
      );
    }

    return {
      w: width,
      h: height,
      d: compressed,
      v: CURRENT_VERSION
    };
  },

  // 解压数据
  decompress(data: RLEData): Map<string, string> {
    const pixels = new Map<string, string>();
    
    for (let i = 0; i < data.d.length; i += 4) {
      const x = parseInt(data.d[i]);
      const y = parseInt(data.d[i + 1]);
      const color = data.d[i + 2];
      const count = parseInt(data.d[i + 3]);
      
      for (let j = 0; j < count; j++) {
        pixels.set(`${x + j},${y}`, color);
      }
    }

    return pixels;
  }
}; 