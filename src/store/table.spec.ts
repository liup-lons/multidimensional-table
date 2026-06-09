import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTableStore } from './table'
import type { Table, View, Field } from '@/types/table'

describe('Table Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('initStore', () => {
    it('should initialize with test data if no storage', () => {
      const store = useTableStore()
      store.initStore()
      expect(store.projects.length).toBeGreaterThan(0)
      expect(store.currentProject).not.toBeNull()
    })
  })

  describe('createProject', () => {
    it('should create a new project', () => {
      const store = useTableStore()
      store.initStore()
      const initialLength = store.projects.length
      store.createProject('Test Project', 'Test Description')
      expect(store.projects.length).toBe(initialLength + 1)
      expect(store.projects[store.projects.length - 1].name).toBe('Test Project')
    })
  })

  describe('deleteProject', () => {
    it('should delete a project', () => {
      const store = useTableStore()
      store.initStore()
      const projectId = store.projects[0].id
      const initialLength = store.projects.length
      store.deleteProject(projectId)
      expect(store.projects.length).toBe(initialLength - 1)
      expect(store.projects.find(p => p.id === projectId)).toBeUndefined()
    })
  })

  describe('createTable', () => {
    it('should create a new table', () => {
      const store = useTableStore()
      store.initStore()
      const projectId = store.projects[0].id
      const project = store.projects.find(p => p.id === projectId)!
      const initialLength = project.tables.length
      store.createTable(projectId, 'Test Table')
      expect(project.tables.length).toBe(initialLength + 1)
      expect(project.tables[project.tables.length - 1].name).toBe('Test Table')
    })
  })

  describe('deleteTable', () => {
    it('should delete a table', () => {
      const store = useTableStore()
      store.initStore()
      const projectId = store.projects[0].id
      const project = store.projects.find(p => p.id === projectId)!
      const tableId = project.tables[0].id
      const initialLength = project.tables.length
      store.deleteTable(projectId, tableId)
      expect(project.tables.length).toBe(initialLength - 1)
      expect(project.tables.find(t => t.id === tableId)).toBeUndefined()
    })
  })

  describe('createView', () => {
    it('should create a new view', () => {
      const store = useTableStore()
      store.initStore()
      const projectId = store.projects[0].id
      const project = store.projects.find(p => p.id === projectId)!
      const tableId = project.tables[0].id
      const table = project.tables.find(t => t.id === tableId)!
      const initialLength = table.views.length
      store.createView(projectId, tableId, {
        name: 'Test View',
        type: 'table',
        tableId
      })
      expect(table.views.length).toBe(initialLength + 1)
      expect(table.views[table.views.length - 1].name).toBe('Test View')
    })
  })

  describe('deleteView', () => {
    it('should delete a view', () => {
      const store = useTableStore()
      store.initStore()
      const projectId = store.projects[0].id
      const project = store.projects.find(p => p.id === projectId)!
      const tableId = project.tables[0].id
      const table = project.tables.find(t => t.id === tableId)!
      const viewId = table.views[0].id
      const initialLength = table.views.length
      store.deleteView(projectId, tableId, viewId)
      expect(table.views.length).toBe(initialLength - 1)
      expect(table.views.find(v => v.id === viewId)).toBeUndefined()
    })
  })

  describe('exportBackup', () => {
    it('should export valid JSON', () => {
      const store = useTableStore()
      store.initStore()
      const backup = store.exportBackup()
      expect(() => JSON.parse(backup)).not.toThrow()
      const data = JSON.parse(backup)
      expect(data.projects).toBeDefined()
    })
  })

  describe('importBackup', () => {
    it('should import valid backup', () => {
      const store = useTableStore()
      store.initStore()
      const backup = store.exportBackup()
      store.projects = []
      const result = store.importBackup(backup)
      expect(result).toBe(true)
      expect(store.projects.length).toBeGreaterThan(0)
    })

    it('should return false for invalid backup', () => {
      const store = useTableStore()
      store.initStore()
      const result = store.importBackup('invalid json')
      expect(result).toBe(false)
    })
  })
})