import { onMounted, onUnmounted } from 'vue'

export interface ShortcutConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  handler: () => void
  description?: string
}

export function useShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeydown = (event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const ctrl = shortcut.ctrl || shortcut.meta
      const shift = shortcut.shift || false
      const alt = shortcut.alt || false
      
      const matchKey = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const matchCtrl = ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey
      const matchShift = shift ? event.shiftKey : !event.shiftKey
      const matchAlt = alt ? event.altKey : !event.altKey
      
      if (matchKey && matchCtrl && matchShift && matchAlt) {
        // 阻止默认行为（如Ctrl+S保存页面）
        event.preventDefault()
        event.stopPropagation()
        shortcut.handler()
        break
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return { shortcuts }
}

// 预定义快捷键列表
export const defaultShortcuts: ShortcutConfig[] = [
  {
    key: 's',
    ctrl: true,
    description: '保存数据',
    handler: () => {
      // 默认保存逻辑
      console.log('Save triggered')
    }
  },
  {
    key: 'n',
    ctrl: true,
    description: '新建项目/表格',
    handler: () => {
      console.log('New triggered')
    }
  },
  {
    key: 'f',
    ctrl: true,
    description: '搜索',
    handler: () => {
      console.log('Search triggered')
    }
  },
  {
    key: 'z',
    ctrl: true,
    description: '撤销',
    handler: () => {
      console.log('Undo triggered')
    }
  },
  {
    key: 'z',
    ctrl: true,
    shift: true,
    description: '重做',
    handler: () => {
      console.log('Redo triggered')
    }
  },
  {
    key: 'd',
    ctrl: true,
    description: '删除',
    handler: () => {
      console.log('Delete triggered')
    }
  },
  {
    key: '/',
    ctrl: true,
    description: '打开命令面板',
    handler: () => {
      console.log('Command palette triggered')
    }
  },
  {
    key: 'Escape',
    description: '关闭弹窗',
    handler: () => {
      console.log('Escape triggered')
    }
  }
]