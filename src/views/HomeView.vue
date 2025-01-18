<template>
  <main class="home">
    <div class="canvas-container">
      <div class="sidebar">
        <div class="sidebar-content">
          <ToolsPanel />
          <SettingsPanel />
        </div>
      </div>
      <div class="canvas-wrapper">
        <PixelCanvas />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import ToolsPanel from '../components/ToolsPanel.vue';
import SettingsPanel from '../components/SettingsPanel.vue';
import PixelCanvas from '../components/PixelCanvas.vue';
</script>

<style scoped lang="scss">
.home {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  height: 100vh;
  box-sizing: border-box;
}

.canvas-container {
  flex: 1;
  display: flex;
  gap: 1rem;
  min-height: 0;
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  overflow: hidden;
  
  .sidebar-content {
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-right: 6px;
    
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: var(--border-color);
      border-radius: 2px;
    }
    
    > * {
      background-color: var(--surface-color);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      flex-shrink: 0;
    }
  }
}

.canvas-wrapper {
  flex: 1;
  background-color: var(--surface-color);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  min-width: 0;
}
</style>
