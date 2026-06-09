import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark' | 'system'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: 'light' as ThemeMode,
    systemTheme: 'light' as ThemeMode
  }),
  
  getters: {
    currentTheme: (state) => {
      if (state.theme === 'system') {
        return state.systemTheme
      }
      return state.theme
    }
  },
  
  actions: {
    initTheme() {
      // 从localStorage读取主题设置
      const stored = localStorage.getItem('multidimensional-table-theme')
      if (stored) {
        this.theme = stored as ThemeMode
      } else {
        // 默认跟随系统
        this.theme = 'system'
      }
      
      // 检测系统主题
      this.detectSystemTheme()
      
      // 监听系统主题变化
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        mediaQuery.addEventListener('change', (e) => {
          this.systemTheme = e.matches ? 'dark' : 'light'
          this.applyTheme()
        })
      }
      
      // 应用主题
      this.applyTheme()
    },
    
    detectSystemTheme() {
      if (window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) {
        this.systemTheme = 'dark'
      } else {
        this.systemTheme = 'light'
      }
    },
    
    setTheme(theme: ThemeMode) {
      this.theme = theme
      localStorage.setItem('multidimensional-table-theme', theme)
      this.applyTheme()
    },
    
    toggleTheme() {
      const themes: ThemeMode[] = ['light', 'dark', 'system']
      const currentIndex = themes.indexOf(this.theme)
      const nextIndex = (currentIndex + 1) % themes.length
      this.setTheme(themes[nextIndex])
    },
    
    applyTheme() {
      const theme = this.currentTheme
      document.documentElement.setAttribute('data-theme', theme)
    }
  }
})