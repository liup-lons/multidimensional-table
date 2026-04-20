// 工具函数集合

// 数据处理工具
export const dataUtils = {
  // 深拷贝对象
  deepClone: (obj: any): any => {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => dataUtils.deepClone(item))
    if (typeof obj === 'object') {
      const clonedObj: any = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = dataUtils.deepClone(obj[key])
        }
      }
      return clonedObj
    }
  },

  // 格式化日期
  formatDate: (dateStr: string, format: string = 'YYYY-MM-DD'): string => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  },

  // 验证数据
  validate: (value: any, rules: any): { valid: boolean; message: string } => {
    if (rules.required && (!value || value === '')) {
      return { valid: false, message: rules.message || '此字段为必填项' }
    }

    if (rules.type === 'number' && value !== '' && isNaN(Number(value))) {
      return { valid: false, message: rules.message || '请输入数字' }
    }

    if (rules.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return { valid: false, message: rules.message || '请输入有效的邮箱地址' }
      }
    }

    if (rules.min && Number(value) < Number(rules.min)) {
      return { valid: false, message: rules.message || `最小值为${rules.min}` }
    }

    if (rules.max && Number(value) > Number(rules.max)) {
      return { valid: false, message: rules.message || `最大值为${rules.max}` }
    }

    if (rules.minLength && value.length < rules.minLength) {
      return { valid: false, message: rules.message || `最少${rules.minLength}个字符` }
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return { valid: false, message: rules.message || `最多${rules.maxLength}个字符` }
    }

    if (rules.regex && value) {
      const regex = new RegExp(rules.regex)
      if (!regex.test(value)) {
        return { valid: false, message: rules.message || '格式不正确' }
      }
    }

    return { valid: true, message: '' }
  }
}

// 导出工具
export const exportUtils = {
  // 导出为CSV
  exportToCSV: (data: any[], filename: string = 'data.csv') => {
    if (!data || data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => {
        return headers.map(header => {
          const value = row[header]
          // 处理包含逗号或引号的值
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  },

  // 导出为Excel (使用xlsx库)
  exportToExcel: async (data: any[], filename: string = 'data.xlsx') => {
    if (!data || data.length === 0) return

    try {
      // 动态导入xlsx库
      const XLSX = await import('xlsx')
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
      XLSX.writeFile(workbook, filename)
    } catch (error) {
      console.error('导出Excel失败:', error)
    }
  }
}

// 节流和防抖工具
export const throttleUtils = {
  // 节流函数
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => {
    let inThrottle = false
    return function(this: any, ...args: Parameters<T>) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  // 防抖函数
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => {
    let timeout: number | null = null
    return function(this: any, ...args: Parameters<T>) {
      if (timeout) clearTimeout(timeout)
      timeout = window.setTimeout(() => {
        func.apply(this, args)
      }, wait)
    }
  }
}

// 存储工具
export const storageUtils = {
  // 设置本地存储
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('存储数据失败:', error)
    }
  },

  // 获取本地存储
  get: (key: string, defaultValue: any = null) => {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : defaultValue
    } catch (error) {
      console.error('获取数据失败:', error)
      return defaultValue
    }
  },

  // 删除本地存储
  remove: (key: string) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('删除数据失败:', error)
    }
  },

  // 清空本地存储
  clear: () => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('清空数据失败:', error)
    }
  }
}

// 网络工具
export const networkUtils = {
  // 检查网络连接
  isOnline: (): boolean => {
    return navigator.onLine
  },

  // 格式化API错误
  formatError: (error: any): string => {
    if (error.response) {
      // 服务器返回错误
      return error.response.data?.message || `服务器错误 (${error.response.status})`
    } else if (error.request) {
      // 请求发送但没有收到响应
      return '网络错误，无法连接到服务器'
    } else {
      // 请求配置错误
      return error.message || '请求错误'
    }
  }
}

// DOM工具
export const domUtils = {
  // 获取元素相对于文档的位置
  getElementPosition: (element: HTMLElement): { top: number; left: number } => {
    let top = 0
    let left = 0
    let current = element

    while (current) {
      top += current.offsetTop
      left += current.offsetLeft
      current = current.offsetParent as HTMLElement
    }

    return { top, left }
  },

  // 检查元素是否在视口中
  isElementInViewport: (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }
}

export default {
  data: dataUtils,
  export: exportUtils,
  throttle: throttleUtils,
  storage: storageUtils,
  network: networkUtils,
  dom: domUtils
}