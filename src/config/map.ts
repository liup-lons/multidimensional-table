// 地图服务配置
import type { MapProviderConfig } from '@/types/geo'

// 支持的地图服务提供商
export const mapProviders: MapProviderConfig[] = [
  {
    name: '高德地图',
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    attribution: '高德地图'
  },
  {
    name: '高德影像',
    url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
    attribution: '高德地图'
  },
  {
    name: '百度地图',
    url: 'http://online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=1',
    attribution: '百度地图'
  },
  {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
  }
]

// 默认地图配置
export const defaultMapConfig = {
  // 默认中心点（北京）
  defaultCenter: [116.4074, 39.9042] as [number, number],
  // 默认缩放级别
  defaultZoom: 12,
  // 最小缩放级别
  minZoom: 1,
  // 最大缩放级别
  maxZoom: 18,
  // 默认地图提供商索引
  defaultProviderIndex: 0,
  // 启用3D模式
  enable3d: false,
  // 启用旋转
  enableRotation: true,
  // 启用倾斜
  enablePitch: true
}

// 地图样式配置
export const mapStyles = {
  // 标记样式
  marker: {
    defaultColor: '#3B82F6',
    selectedColor: '#EF4444',
    radius: 8,
    strokeWidth: 2,
    strokeColor: '#FFFFFF'
  },
  // 热力图样式
  heatmap: {
    radius: 25,
    blur: 15,
    opacity: 0.8,
    gradient: {
      0.4: '#0000FF',
      0.6: '#00FFFF',
      0.7: '#00FF00',
      0.8: '#FFFF00',
      1.0: '#FF0000'
    }
  },
  // 路径样式
  line: {
    color: '#3B82F6',
    width: 3,
    opacity: 0.8
  },
  // 填充样式
  fill: {
    opacity: 0.5,
    strokeColor: '#3B82F6',
    strokeWidth: 2
  }
}

// 行政区划数据（示例）
export const regionData = {
  provinces: [
    { code: '110000', name: '北京市' },
    { code: '120000', name: '天津市' },
    { code: '130000', name: '河北省' },
    { code: '140000', name: '山西省' },
    { code: '150000', name: '内蒙古自治区' },
    { code: '210000', name: '辽宁省' },
    { code: '220000', name: '吉林省' },
    { code: '230000', name: '黑龙江省' },
    { code: '310000', name: '上海市' },
    { code: '320000', name: '江苏省' },
    { code: '330000', name: '浙江省' },
    { code: '340000', name: '安徽省' },
    { code: '350000', name: '福建省' },
    { code: '360000', name: '江西省' },
    { code: '370000', name: '山东省' },
    { code: '410000', name: '河南省' },
    { code: '420000', name: '湖北省' },
    { code: '430000', name: '湖南省' },
    { code: '440000', name: '广东省' },
    { code: '450000', name: '广西壮族自治区' },
    { code: '460000', name: '海南省' },
    { code: '500000', name: '重庆市' },
    { code: '510000', name: '四川省' },
    { code: '520000', name: '贵州省' },
    { code: '530000', name: '云南省' },
    { code: '540000', name: '西藏自治区' },
    { code: '610000', name: '陕西省' },
    { code: '620000', name: '甘肃省' },
    { code: '630000', name: '青海省' },
    { code: '640000', name: '宁夏回族自治区' },
    { code: '650000', name: '新疆维吾尔自治区' },
    { code: '710000', name: '台湾省' },
    { code: '810000', name: '香港特别行政区' },
    { code: '820000', name: '澳门特别行政区' }
  ]
}