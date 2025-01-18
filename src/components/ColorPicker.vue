<template>
  <div class="color-picker">
    <div class="color-header">
      <h3 class="title">颜色</h3>
      <div class="color-actions">
        <div 
          class="current-color"
          :style="{ backgroundColor: modelValue }"
          @click="showColorPicker = true"
        />
        <input
          ref="colorInputRef"
          type="color"
          :value="modelValue"
          class="color-input"
          @input="handleColorInput"
        />
      </div>
    </div>
    <div class="colors-grid">
      <button
        v-for="color in colors"
        :key="color"
        class="color-btn"
        :style="{ backgroundColor: color }"
        :class="{ active: modelValue === color }"
        @click="$emit('update:modelValue', color)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: string
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>();

const colorInputRef = ref<HTMLInputElement | null>(null);
const showColorPicker = ref(false);

const colors = ref([
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#008000', '#800000', '#008080', '#000080', '#FFC0CB'
]);

watch(showColorPicker, (show) => {
  if (show && colorInputRef.value) {
    colorInputRef.value.click();
  }
});

const handleColorInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  emit('update:modelValue', input.value);
  showColorPicker.value = false;
};
</script>

<style scoped lang="scss">
.color-picker {
  padding: 0.75rem;
}

.color-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.title {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.color-actions {
  position: relative;
}

.current-color {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
}

.color-input {
  position: absolute;
  width: 0;
  height: 0;
  padding: 0;
  border: none;
  opacity: 0;
  pointer-events: none;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: 6px;
  }
}

.colors-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.4rem;
}

.color-btn {
  width: 100%;
  aspect-ratio: 1;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }

  &.active {
    border-color: var(--primary-color);
    transform: scale(1.1);
  }
}
</style> 