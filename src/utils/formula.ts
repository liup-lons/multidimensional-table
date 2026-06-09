// 公式计算引擎
// 支持类似Excel的公式语法

export interface FormulaResult {
  success: boolean
  value: any
  error?: string
}

// 内置函数列表
const builtinFunctions: Record<string, (...args: any[]) => any> = {
  // 数学函数
  SUM: (...args: any[]) => args.flat().filter(v => typeof v === 'number').reduce((a, b) => a + b, 0),
  AVG: (...args: any[]) => {
    const nums = args.flat().filter(v => typeof v === 'number')
    return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
  },
  MIN: (...args: any[]) => Math.min(...args.flat().filter(v => typeof v === 'number')),
  MAX: (...args: any[]) => Math.max(...args.flat().filter(v => typeof v === 'number')),
  COUNT: (...args: any[]) => args.flat().filter(v => v !== undefined && v !== null && v !== '').length,
  COUNTIF: (range: any[], condition: string) => {
    return range.flat().filter(v => evaluateCondition(v, condition)).length
  },
  ROUND: (num: number, decimals: number = 0) => Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals),
  ABS: (num: number) => Math.abs(num),
  SQRT: (num: number) => Math.sqrt(num),
  POWER: (base: number, exponent: number) => Math.pow(base, exponent),
  MOD: (num: number, divisor: number) => num % divisor,
  CEILING: (num: number, significance: number = 1) => Math.ceil(num / significance) * significance,
  FLOOR: (num: number, significance: number = 1) => Math.floor(num / significance) * significance,
  
  // 文本函数
  CONCAT: (...args: any[]) => args.flat().map(v => String(v ?? '')).join(''),
  CONCATENATE: (...args: any[]) => args.flat().map(v => String(v ?? '')).join(''),
  LEFT: (text: string, numChars: number = 1) => String(text ?? '').slice(0, numChars),
  RIGHT: (text: string, numChars: number = 1) => {
    const str = String(text ?? '')
    return str.slice(-numChars)
  },
  MID: (text: string, startNum: number, numChars: number) => {
    const str = String(text ?? '')
    return str.slice(startNum - 1, startNum - 1 + numChars)
  },
  LEN: (text: string) => String(text ?? '').length,
  UPPER: (text: string) => String(text ?? '').toUpperCase(),
  LOWER: (text: string) => String(text ?? '').toLowerCase(),
  TRIM: (text: string) => String(text ?? '').trim(),
  REPLACE: (text: string, startNum: number, numChars: number, newText: string) => {
    const str = String(text ?? '')
    return str.slice(0, startNum - 1) + String(newText ?? '') + str.slice(startNum - 1 + numChars)
  },
  SUBSTITUTE: (text: string, oldText: string, newText: string, instanceNum?: number) => {
    const str = String(text ?? '')
    if (instanceNum === undefined) {
      return str.split(String(oldText ?? '')).join(String(newText ?? ''))
    }
    let count = 0
    return str.split(String(oldText ?? '')).map((part, i) => {
      if (i > 0 && ++count === instanceNum) return ''
      return part
    }).join(count < instanceNum ? String(oldText ?? '') : String(newText ?? ''))
  },
  FIND: (findText: string, withinText: string, startNum: number = 1) => {
    const str = String(withinText ?? '')
    const pos = str.indexOf(String(findText ?? ''), startNum - 1)
    return pos === -1 ? 0 : pos + 1
  },
  SEARCH: (findText: string, withinText: string, startNum: number = 1) => {
    const str = String(withinText ?? '').toLowerCase()
    const pos = str.indexOf(String(findText ?? '').toLowerCase(), startNum - 1)
    return pos === -1 ? 0 : pos + 1
  },
  
  // 日期函数
  TODAY: () => new Date().toISOString().split('T')[0],
  NOW: () => new Date().toISOString(),
  DATE: (year: number, month: number, day: number) => {
    const date = new Date(year, month - 1, day)
    return date.toISOString().split('T')[0]
  },
  YEAR: (dateStr: string) => new Date(dateStr).getFullYear(),
  MONTH: (dateStr: string) => new Date(dateStr).getMonth() + 1,
  DAY: (dateStr: string) => new Date(dateStr).getDate(),
  HOUR: (dateStr: string) => new Date(dateStr).getHours(),
  MINUTE: (dateStr: string) => new Date(dateStr).getMinutes(),
  SECOND: (dateStr: string) => new Date(dateStr).getSeconds(),
  DATEDIF: (startDate: string, endDate: string, unit: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diff = end.getTime() - start.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    switch (unit.toUpperCase()) {
      case 'Y': // 年
        return Math.floor(days / 365)
      case 'M': // 月
        return Math.floor(days / 30.4375)
      case 'D': // 日
        return days
      case 'MD': // 忽略年和月，计算天数差
        return end.getDate() - start.getDate()
      case 'YM': // 忽略年和日，计算月数差
        return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
      case 'YD': // 忽略年，计算天数差
        return days % 365
      default:
        return 0
    }
  },
  EDATE: (startDate: string, months: number) => {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + months)
    return date.toISOString().split('T')[0]
  },
  EOMONTH: (startDate: string, months: number) => {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + months + 1)
    date.setDate(0)
    return date.toISOString().split('T')[0]
  },
  
  // 逻辑函数
  IF: (condition: boolean, trueValue: any, falseValue: any) => condition ? trueValue : falseValue,
  AND: (...args: any[]) => args.every(v => !!v),
  OR: (...args: any[]) => args.some(v => !!v),
  NOT: (value: any) => !value,
  IFERROR: (value: any, errorValue: any) => {
    try {
      return value
    } catch {
      return errorValue
    }
  },
  SWITCH: (expression: any, ...args: any[]) => {
    for (let i = 0; i < args.length; i += 2) {
      if (expression === args[i]) {
        return args[i + 1]
      }
    }
    return args.length % 2 === 1 ? args[args.length - 1] : undefined
  },
  
  // 查找函数
  INDEX: (array: any[], rowNum: number, colNum?: number) => {
    if (!Array.isArray(array)) return undefined
    if (colNum !== undefined) {
      return array[rowNum - 1]?.[colNum - 1]
    }
    return array[rowNum - 1]
  },
  MATCH: (lookupValue: any, lookupArray: any[], matchType: number = 1) => {
    if (!Array.isArray(lookupArray)) return 0
    for (let i = 0; i < lookupArray.length; i++) {
      if (matchType === 0 && lookupArray[i] === lookupValue) return i + 1
      if (matchType === 1 && lookupArray[i] >= lookupValue) return i + 1
      if (matchType === -1 && lookupArray[i] <= lookupValue) return i + 1
    }
    return 0
  },
  
  // 其他函数
  RAND: () => Math.random(),
  RANDBETWEEN: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
  ISNUMBER: (value: any) => typeof value === 'number',
  ISTEXT: (value: any) => typeof value === 'string',
  ISBLANK: (value: any) => value === undefined || value === null || value === '',
  ISERROR: (value: any) => value instanceof Error || typeof value === 'undefined'
}

// 计算条件表达式
function evaluateCondition(value: any, condition: string): boolean {
  try {
    const parts = condition.split(/([<>!=]=?)/)
    if (parts.length !== 3) return false
    
    const operator = parts[1]
    const compareValue = parseValue(parts[2].trim())
    
    switch (operator) {
      case '=': return value == compareValue
      case '!=': return value != compareValue
      case '>': return value > compareValue
      case '<': return value < compareValue
      case '>=': return value >= compareValue
      case '<=': return value <= compareValue
      default: return false
    }
  } catch {
    return false
  }
}

// 解析值
function parseValue(value: string): any {
  if (value === '') return ''
  if (value === 'TRUE' || value === 'true') return true
  if (value === 'FALSE' || value === 'false') return false
  
  const num = parseFloat(value)
  if (!isNaN(num)) return num
  
  return value
}

// 词法分析器
class Lexer {
  private input: string
  private pos: number = 0
  
  constructor(input: string) {
    this.input = input
  }
  
  nextToken(): { type: string; value: string } | null {
    while (this.pos < this.input.length) {
      const char = this.input[this.pos]
      
      if (char === ' ' || char === '\t') {
        this.pos++
        continue
      }
      
      if (char === '=') {
        this.pos++
        return { type: 'EQUALS', value: '=' }
      }
      
      if (char === '+') {
        this.pos++
        return { type: 'PLUS', value: '+' }
      }
      
      if (char === '-') {
        this.pos++
        return { type: 'MINUS', value: '-' }
      }
      
      if (char === '*') {
        this.pos++
        return { type: 'MULTIPLY', value: '*' }
      }
      
      if (char === '/') {
        this.pos++
        return { type: 'DIVIDE', value: '/' }
      }
      
      if (char === '^') {
        this.pos++
        return { type: 'POWER', value: '^' }
      }
      
      if (char === '(') {
        this.pos++
        return { type: 'LPAREN', value: '(' }
      }
      
      if (char === ')') {
        this.pos++
        return { type: 'RPAREN', value: ')' }
      }
      
      if (char === ',') {
        this.pos++
        return { type: 'COMMA', value: ',' }
      }
      
      if (char === '"' || char === "'") {
        const quote = char
        this.pos++
        let str = ''
        while (this.pos < this.input.length && this.input[this.pos] !== quote) {
          str += this.input[this.pos]
          this.pos++
        }
        this.pos++
        return { type: 'STRING', value: str }
      }
      
      if (char === '[') {
        this.pos++
        let str = ''
        while (this.pos < this.input.length && this.input[this.pos] !== ']') {
          str += this.input[this.pos]
          this.pos++
        }
        this.pos++
        return { type: 'FIELD', value: str }
      }
      
      if (char === '{') {
        this.pos++
        let str = ''
        while (this.pos < this.input.length && this.input[this.pos] !== '}') {
          str += this.input[this.pos]
          this.pos++
        }
        this.pos++
        return { type: 'ARRAY', value: str }
      }
      
      if (/[A-Za-z]/.test(char)) {
        let word = ''
        while (this.pos < this.input.length && /[A-Za-z0-9_]/.test(this.input[this.pos])) {
          word += this.input[this.pos]
          this.pos++
        }
        return { type: 'IDENTIFIER', value: word.toUpperCase() }
      }
      
      if (/[0-9.]/.test(char)) {
        let num = ''
        while (this.pos < this.input.length && /[0-9.]/.test(this.input[this.pos])) {
          num += this.input[this.pos]
          this.pos++
        }
        return { type: 'NUMBER', value: num }
      }
      
      this.pos++
    }
    
    return null
  }
}

// 语法分析器和求值器
export function evaluateFormula(formula: string, record: Record<string, any> = {}, allRecords: Record<string, any>[] = []): FormulaResult {
  try {
    if (!formula.startsWith('=')) {
      return { success: true, value: formula }
    }
    
    const lexer = new Lexer(formula.slice(1))
    const result = parseExpression(lexer, record, allRecords)
    
    if (result.error) {
      return { success: false, value: null, error: result.error }
    }
    
    return { success: true, value: result.value }
  } catch (error) {
    return {
      success: false,
      value: null,
      error: error instanceof Error ? error.message : '公式执行错误'
    }
  }
}

interface ParseResult {
  value: any
  error?: string
}

function parseExpression(lexer: Lexer, record: Record<string, any>, allRecords: Record<string, any>[]): ParseResult {
  let result = parseTerm(lexer, record, allRecords)
  
  while (true) {
    const token = lexer.nextToken()
    if (!token) break
    
    if (token.type === 'PLUS') {
      const right = parseTerm(lexer, record, allRecords)
      if (right.error) return right
      result = { value: (result.value ?? 0) + (right.value ?? 0) }
    } else if (token.type === 'MINUS') {
      const right = parseTerm(lexer, record, allRecords)
      if (right.error) return right
      result = { value: (result.value ?? 0) - (right.value ?? 0) }
    } else {
      // 回退
      lexer.pos -= token.value.length
      break
    }
  }
  
  return result
}

function parseTerm(lexer: Lexer, record: Record<string, any>, allRecords: Record<string, any>[]): ParseResult {
  let result = parseFactor(lexer, record, allRecords)
  
  while (true) {
    const token = lexer.nextToken()
    if (!token) break
    
    if (token.type === 'MULTIPLY') {
      const right = parseFactor(lexer, record, allRecords)
      if (right.error) return right
      result = { value: (result.value ?? 0) * (right.value ?? 0) }
    } else if (token.type === 'DIVIDE') {
      const right = parseFactor(lexer, record, allRecords)
      if (right.error) return right
      if (right.value === 0) {
        return { value: null, error: '除以零错误' }
      }
      result = { value: (result.value ?? 0) / (right.value ?? 1) }
    } else if (token.type === 'POWER') {
      const right = parseFactor(lexer, record, allRecords)
      if (right.error) return right
      result = { value: Math.pow(result.value ?? 0, right.value ?? 0) }
    } else {
      lexer.pos -= token.value.length
      break
    }
  }
  
  return result
}

function parseFactor(lexer: Lexer, record: Record<string, any>, allRecords: Record<string, any>[]): ParseResult {
  const token = lexer.nextToken()
  if (!token) {
    return { value: null, error: '表达式不完整' }
  }
  
  if (token.type === 'NUMBER') {
    const num = parseFloat(token.value)
    return { value: isNaN(num) ? 0 : num }
  }
  
  if (token.type === 'STRING') {
    return { value: token.value }
  }
  
  if (token.type === 'FIELD') {
    // 支持字段引用 [字段名]
    const fieldValue = record[token.value]
    if (fieldValue === undefined || fieldValue === null) {
      return { value: 0 }
    }
    if (typeof fieldValue === 'string') {
      const num = parseFloat(fieldValue)
      return { value: isNaN(num) ? fieldValue : num }
    }
    return { value: fieldValue }
  }
  
  if (token.type === 'ARRAY') {
    // 支持数组 {1,2,3}
    try {
      const values = token.value.split(',').map(v => {
        const trimmed = v.trim()
        const num = parseFloat(trimmed)
        return isNaN(num) ? trimmed : num
      })
      return { value: values }
    } catch {
      return { value: [], error: '数组格式错误' }
    }
  }
  
  if (token.type === 'IDENTIFIER') {
    // 函数调用
    return parseFunctionCall(token.value, lexer, record, allRecords)
  }
  
  if (token.type === 'LPAREN') {
    const result = parseExpression(lexer, record, allRecords)
    const closing = lexer.nextToken()
    if (!closing || closing.type !== 'RPAREN') {
      return { value: null, error: '缺少右括号' }
    }
    return result
  }
  
  if (token.type === 'MINUS') {
    const result = parseFactor(lexer, record, allRecords)
    if (result.error) return result
    return { value: -(result.value ?? 0) }
  }
  
  return { value: null, error: `未知token: ${token.type}` }
}

function parseFunctionCall(funcName: string, lexer: Lexer, record: Record<string, any>, allRecords: Record<string, any>[]): ParseResult {
  const token = lexer.nextToken()
  if (!token || token.type !== 'LPAREN') {
    return { value: null, error: `函数 ${funcName} 缺少左括号` }
  }
  
  const args: any[] = []
  
  while (true) {
    const peek = lexer.nextToken()
    if (!peek) {
      return { value: null, error: '参数列表不完整' }
    }
    
    if (peek.type === 'RPAREN') {
      break
    }
    
    // 回退
    lexer.pos -= peek.value.length
    
    // 解析参数
    const result = parseExpression(lexer, record, allRecords)
    if (result.error) return result
    args.push(result.value)
    
    const next = lexer.nextToken()
    if (!next) {
      return { value: null, error: '参数列表不完整' }
    }
    
    if (next.type === 'RPAREN') {
      break
    }
    
    if (next.type !== 'COMMA') {
      return { value: null, error: '参数分隔符应为逗号' }
    }
  }
  
  // 调用函数
  const func = builtinFunctions[funcName]
  if (!func) {
    return { value: null, error: `未知函数: ${funcName}` }
  }
  
  try {
    return { value: func(...args) }
  } catch (error) {
    return { value: null, error: error instanceof Error ? error.message : '函数执行错误' }
  }
}

// 获取所有可用函数列表
export function getAvailableFunctions(): string[] {
  return Object.keys(builtinFunctions)
}

// 获取函数描述
export function getFunctionDescription(funcName: string): string {
  const descriptions: Record<string, string> = {
    SUM: 'SUM(number1, [number2], ...) - 计算所有参数的和',
    AVG: 'AVG(number1, [number2], ...) - 计算平均值',
    MIN: 'MIN(number1, [number2], ...) - 返回最小值',
    MAX: 'MAX(number1, [number2], ...) - 返回最大值',
    COUNT: 'COUNT(value1, [value2], ...) - 计算非空值的数量',
    COUNTIF: 'COUNTIF(range, condition) - 根据条件计数',
    ROUND: 'ROUND(number, decimals) - 四舍五入',
    ABS: 'ABS(number) - 返回绝对值',
    SQRT: 'SQRT(number) - 返回平方根',
    POWER: 'POWER(base, exponent) - 返回幂',
    MOD: 'MOD(number, divisor) - 返回余数',
    CONCAT: 'CONCAT(text1, [text2], ...) - 连接文本',
    LEFT: 'LEFT(text, num_chars) - 返回左侧字符',
    RIGHT: 'RIGHT(text, num_chars) - 返回右侧字符',
    MID: 'MID(text, start_num, num_chars) - 返回中间字符',
    LEN: 'LEN(text) - 返回文本长度',
    UPPER: 'UPPER(text) - 转换为大写',
    LOWER: 'LOWER(text) - 转换为小写',
    TRIM: 'TRIM(text) - 去除首尾空格',
    TODAY: 'TODAY() - 返回今天日期',
    NOW: 'NOW() - 返回当前时间',
    DATE: 'DATE(year, month, day) - 创建日期',
    YEAR: 'YEAR(date) - 返回年份',
    MONTH: 'MONTH(date) - 返回月份',
    DAY: 'DAY(date) - 返回日期',
    DATEDIF: 'DATEDIF(start_date, end_date, unit) - 计算日期差',
    IF: 'IF(condition, true_value, false_value) - 条件判断',
    AND: 'AND(logical1, [logical2], ...) - 逻辑与',
    OR: 'OR(logical1, [logical2], ...) - 逻辑或',
    NOT: 'NOT(logical) - 逻辑非',
    IFERROR: 'IFERROR(value, error_value) - 错误处理',
    SWITCH: 'SWITCH(expression, value1, result1, ...) - 多条件判断',
    INDEX: 'INDEX(array, row_num, [col_num]) - 返回数组元素',
    MATCH: 'MATCH(lookup_value, lookup_array, [match_type]) - 查找位置',
    RAND: 'RAND() - 返回随机数',
    RANDBETWEEN: 'RANDBETWEEN(min, max) - 返回指定范围随机数',
    ISNUMBER: 'ISNUMBER(value) - 判断是否为数字',
    ISTEXT: 'ISTEXT(value) - 判断是否为文本',
    ISBLANK: 'ISBLANK(value) - 判断是否为空',
    ISERROR: 'ISERROR(value) - 判断是否为错误'
  }
  return descriptions[funcName] || `${funcName}() - 内置函数`
}