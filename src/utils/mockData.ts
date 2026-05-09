import type { Project, Table, FieldDefinition, View } from '../types/table'

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const now = new Date().toISOString()

// 生成随机日期
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// 生成随机整数
const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 随机选择数组元素
const randomPick = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 员工姓名列表
const employeeNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']

// 项目状态
const statusOptions = ['未开始', '进行中', '已完成', '已暂停']

// 优先级
const priorityOptions = ['高', '中', '低']

// 标签列表
const tagOptions = ['前端', '后端', '测试', '设计', '产品', '运维']

// 部门列表
const departmentOptions = ['研发部', '产品部', '设计部', '运营部', '财务部']

// 创建测试项目
export const createTestProject = (): Project => {
  // 创建字段定义
  const fields: FieldDefinition[] = [
    {
      id: generateId(),
      fieldName: 'title',
      fieldType: 'text',
      fieldLabel: '任务标题',
      required: true
    },
    {
      id: generateId(),
      fieldName: 'status',
      fieldType: 'select',
      fieldLabel: '状态',
      options: statusOptions
    },
    {
      id: generateId(),
      fieldName: 'priority',
      fieldType: 'select',
      fieldLabel: '优先级',
      options: priorityOptions
    },
    {
      id: generateId(),
      fieldName: 'assignee',
      fieldType: 'person',
      fieldLabel: '负责人'
    },
    {
      id: generateId(),
      fieldName: 'department',
      fieldType: 'select',
      fieldLabel: '所属部门',
      options: departmentOptions
    },
    {
      id: generateId(),
      fieldName: 'tags',
      fieldType: 'tags',
      fieldLabel: '标签'
    },
    {
      id: generateId(),
      fieldName: 'progress',
      fieldType: 'number',
      fieldLabel: '进度(%)',
      validation: { min: 0, max: 100 }
    },
    {
      id: generateId(),
      fieldName: 'startDate',
      fieldType: 'date',
      fieldLabel: '开始日期'
    },
    {
      id: generateId(),
      fieldName: 'endDate',
      fieldType: 'date',
      fieldLabel: '结束日期'
    },
    {
      id: generateId(),
      fieldName: 'budget',
      fieldType: 'number',
      fieldLabel: '预算(元)'
    },
    {
      id: generateId(),
      fieldName: 'completed',
      fieldType: 'boolean',
      fieldLabel: '是否完成'
    },
    {
      id: generateId(),
      fieldName: 'rating',
      fieldType: 'rating',
      fieldLabel: '满意度'
    },
    {
      id: generateId(),
      fieldName: 'url',
      fieldType: 'url',
      fieldLabel: '链接'
    },
    {
      id: generateId(),
      fieldName: 'description',
      fieldType: 'text',
      fieldLabel: '描述'
    }
  ]

  // 生成测试数据
  const generateTestData = () => {
    const data = []
    const taskTitles = [
      '用户登录模块开发111',
      '数据分析仪表盘设计',
      '订单管理系统优化',
      '移动端适配改造',
      'API接口重构',
      '数据库性能优化',
      '安全漏洞修复',
      '产品需求文档编写',
      'UI设计规范制定',
      '自动化测试脚本',
      '性能监控系统搭建',
      '日志系统升级',
      '第三方支付集成',
      '消息推送服务',
      '权限管理模块',
      '报表导出功能',
      '数据迁移工具',
      '代码审查流程',
      '部署脚本优化',
      '用户反馈处理'
    ]

    for (let i = 0; i < 50; i++) {
      const startDate = randomDate(new Date(2024, 0, 1), new Date())
      const endDate = randomDate(startDate, new Date(2024, 11, 31))
      const progress = randomInt(0, 100)
      const completed = progress === 100

      data.push({
        id: generateId(),
        title: taskTitles[i % taskTitles.length] + (i >= taskTitles.length ? ` #${i - taskTitles.length + 1}` : ''),
        status: completed ? '已完成' : randomPick(['未开始', '进行中', '已暂停']),
        priority: randomPick(priorityOptions),
        assignee: randomPick(employeeNames),
        department: randomPick(departmentOptions),
        tags: Array.from({ length: randomInt(1, 3) }, () => randomPick(tagOptions)),
        progress,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        budget: randomInt(1000, 50000),
        completed,
        rating: randomInt(1, 5),
        url: 'https://example.com/task/' + i,
        description: '这是任务的详细描述信息，包含任务的具体要求和注意事项。'
      })
    }

    return data
  }

  // 创建视图
  const createViews = (tableId: string): View[] => [
    {
      id: generateId(),
      name: '表格视图',
      type: 'table',
      tableId,
      isDefault: true,
      visibleFieldIds: fields.slice(0, 8).map(f => f.id)
    },
    {
      id: generateId(),
      name: '看板视图',
      type: 'kanban',
      tableId,
      groupFieldId: fields[1].id, // 按状态分组
      visibleFieldIds: fields.slice(0, 6).map(f => f.id)
    },
    {
      id: generateId(),
      name: '日历视图',
      type: 'calendar',
      tableId,
      dateFieldId: fields[7].id // 开始日期
    },
    {
      id: generateId(),
      name: '甘特视图',
      type: 'gantt',
      tableId,
      startDateFieldId: fields[7].id, // 开始日期
      endDateFieldId: fields[8].id // 结束日期
    }
  ]

  const table: Table = {
    id: generateId(),
    name: '项目任务表',
    fieldDefinitions: fields,
    data: generateTestData(),
    views: [],
    comments: [
      {
        id: generateId(),
        recordId: 'placeholder',
        tableId: '',
        userId: 'user1',
        userName: '张三',
        content: '这个任务需要优先处理',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    createdAt: now,
    updatedAt: now
  }

  table.views = createViews(table.id)
  table.comments[0].tableId = table.id
  table.comments[0].recordId = table.data[0].id

  return {
    id: generateId(),
    name: '产品研发项目',
    description: '这是一个测试项目，包含各种类型的字段和视图，用于测试多维表的所有功能。',
    tables: [table],
    createdAt: now,
    updatedAt: now
  }
}

// 清空现有数据并创建测试项目
export const initTestData = (): Project[] => {
  return [createTestProject()]
}
