import { describe, expect, it } from 'vitest'
import { evaluateFormula, getAvailableFunctions, getFunctionDescription } from './formula'

describe('Formula Engine', () => {
  describe('evaluateFormula', () => {
    it('should evaluate simple addition', () => {
      const context: Record<string, any> = {}
      const result = evaluateFormula('=1 + 2', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(3)
    })

    it('should evaluate subtraction', () => {
      const context: Record<string, any> = {}
      const result = evaluateFormula('=10 - 5', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(5)
    })

    it('should evaluate multiplication', () => {
      const context: Record<string, any> = {}
      const result = evaluateFormula('=3 * 4', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(12)
    })

    it('should evaluate division', () => {
      const context: Record<string, any> = {}
      const result = evaluateFormula('=10 / 2', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(5)
    })

    it('should evaluate with field context', () => {
      const context: Record<string, any> = { age: 25, score: 90 }
      const result = evaluateFormula('=[age] + [score]', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(115)
    })

    it('should evaluate SUM function', () => {
      const context: Record<string, any> = {}
      const result = evaluateFormula('=SUM(1, 2, 3, 4)', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(10)
    })

    it('should evaluate AVG function', () => {
      const context: Record<string, any> = {}
      const result = evaluateFormula('=AVG(1, 2, 3, 4, 5)', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(3)
    })

    it('should evaluate MAX function', () => {
      const context: Record<string, any> = {}
      const result = evaluateFormula('=MAX(1, 5, 3, 9, 2)', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(9)
    })

    it('should evaluate MIN function', () => {
      const context: Record<string, any> = {}
      const result = evaluateFormula('=MIN(1, 5, 3, 9, 2)', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(1)
    })

    it('should evaluate TODAY function', () => {
      const context: Record<string, any> = {}
      const result = evaluateFormula('=TODAY()', context)
      expect(result.success).toBe(true)
      expect(typeof result.value).toBe('string')
    })

    it('should evaluate nested functions', () => {
      const context: Record<string, any> = {}
      const result = evaluateFormula('=SUM(1, AVG(2, 4))', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(4)
    })

    it('should handle parentheses', () => {
      const context: Record<string, any> = {}
      const result = evaluateFormula('=(1 + 2) * 3', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(9)
    })

    it('should return error for invalid formula', () => {
      const context: Record<string, any> = {}
      const result = evaluateFormula('=INVALID()', context)
      expect(result.success).toBe(false)
    })

    it('should return original string if no equals sign', () => {
      const context: Record<string, any> = {}
      const result = evaluateFormula('hello world', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe('hello world')
    })
  })

  describe('getAvailableFunctions', () => {
    it('should return list of functions', () => {
      const functions = getAvailableFunctions()
      expect(Array.isArray(functions)).toBe(true)
      expect(functions.length).toBeGreaterThan(0)
      expect(functions).toContain('SUM')
      expect(functions).toContain('AVG')
    })
  })

  describe('getFunctionDescription', () => {
    it('should return description for known function', () => {
      const desc = getFunctionDescription('SUM')
      expect(desc).toContain('SUM')
    })

    it('should return default description for unknown function', () => {
      const desc = getFunctionDescription('UNKNOWN')
      expect(desc).toBe('UNKNOWN() - 内置函数')
    })
  })
})