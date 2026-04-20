import { defineStore } from 'pinia'
import type { TableData } from '../types/table'

export const useTableStore = defineStore('table', {
  state: () => ({
    tables: [] as TableData[],
    currentTable: null as TableData | null,
    loading: false,
    error: null as string | null
  }),
  getters: {
    getTableById: (state) => (id: string) => {
      return state.tables.find(table => table.id === id) || null
    }
  },
  actions: {
    async fetchTable(id: string) {
      this.loading = true
      this.error = null
      try {
        // 这里应该是API调用，暂时使用模拟数据
        // const response = await this.$axios.get(`/api/matrix-tables/${id}`)
        // this.currentTable = response.data
        
        // 模拟数据
        this.currentTable = {
          id,
          name: '示例表格',
          fieldDefinitions: [
            { fieldName: 'name', fieldType: 'text', fieldLabel: '姓名' },
            { fieldName: 'age', fieldType: 'number', fieldLabel: '年龄' },
            { fieldName: 'gender', fieldType: 'select', fieldLabel: '性别' },
            { fieldName: 'skills', fieldType: 'tags', fieldLabel: '技能' },
            { fieldName: 'joinDate', fieldType: 'date', fieldLabel: '入职日期' }
          ],
          data: []
        }
      } catch (error) {
        this.error = '获取表格数据失败'
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    updateTable(table: TableData) {
      const index = this.tables.findIndex(t => t.id === table.id)
      if (index !== -1) {
        this.tables[index] = table
      } else {
        this.tables.push(table)
      }
      this.currentTable = table
    },
    addRow(tableId: string, row: any) {
      const table = this.getTableById(tableId)
      if (table) {
        table.data.push(row)
        this.updateTable(table)
      }
    },
    updateRow(tableId: string, rowId: string, data: any) {
      const table = this.getTableById(tableId)
      if (table) {
        const index = table.data.findIndex(row => row.id === rowId)
        if (index !== -1) {
          table.data[index] = { ...table.data[index], ...data }
          this.updateTable(table)
        }
      }
    },
    deleteRow(tableId: string, rowId: string) {
      const table = this.getTableById(tableId)
      if (table) {
        table.data = table.data.filter(row => row.id !== rowId)
        this.updateTable(table)
      }
    }
  }
})