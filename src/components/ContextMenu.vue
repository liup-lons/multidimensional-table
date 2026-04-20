<script setup lang="ts">
import { ref, defineProps, defineEmits, onMounted, onUnmounted } from 'vue'

interface MenuItem {
  id: string
  label: string
  icon?: string
  disabled?: boolean
  children?: MenuItem[]
}

const props = defineProps<{
  items: MenuItem[]
  x: number
  y: number
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'select', itemId: string): void
  (e: 'close'): void
}>()

const menuRef = ref<HTMLElement | null>(null)

const handleClick = (itemId: string) => {
  emit('select', itemId)
  emit('close')
}

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('close')
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div
    v-if="visible"
    ref="menuRef"
    class="context-menu"
    :style="{ left: `${x}px`, top: `${y}px` }"
  >
    <div 
      v-for="item in items" 
      :key="item.id"
      class="menu-item"
      :class="{ 'disabled': item.disabled }"
      @click="!item.disabled && handleClick(item.id)"
    >
      <span v-if="item.icon" class="menu-icon">{{ item.icon }}</span>
      <span class="menu-label">{{ item.label }}</span>
      <span v-if="item.children && item.children.length > 0" class="menu-arrow">▶</span>
      
      <div v-if="item.children && item.children.length > 0" class="submenu">
        <div 
          v-for="child in item.children" 
          :key="child.id"
          class="menu-item"
          :class="{ 'disabled': child.disabled }"
          @click="!child.disabled && handleClick(child.id)"
        >
          <span v-if="child.icon" class="menu-icon">{{ child.icon }}</span>
          <span class="menu-label">{{ child.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.context-menu {
  position: fixed;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 150px;
  max-width: 300px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  position: relative;
}

.menu-item:hover:not(.disabled) {
  background-color: #f5f7fa;
}

.menu-item.disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.menu-icon {
  margin-right: 8px;
  font-size: 14px;
  width: 16px;
  text-align: center;
}

.menu-label {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.menu-arrow {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.submenu {
  position: absolute;
  top: 0;
  left: 100%;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.15);
  min-width: 150px;
  display: none;
  z-index: 1001;
}

.menu-item:hover .submenu {
  display: block;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .context-menu {
    min-width: 120px;
    max-width: 200px;
  }
  
  .menu-item {
    padding: 6px 12px;
  }
  
  .menu-label {
    font-size: 12px;
  }
}
</style>