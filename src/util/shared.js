// 判断是否是对象
export function isObject(val) {
  return !(typeof val !== 'object' || val === null)
}

// 对象是否有key属性
const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}

export function noop () {}

const _toString = Object.prototype.toString

// 对对象类型进行严格检查，只有当对象是纯javascript对象的时候返回true
export function isPlainObject(obj) {
  return _toString.call(obj) === '[object Object]'
}

// 将val转化成字符串
export function toString(val) {
  if (val === null) {
    return ''
  }
  if (val === 'object') {
    return JSON.stringify(val, null, 2)
  }
  return String(val)
}

/**
 * Check if value is primitive
 */
export function isPrimitive (value) {
  return typeof value === 'string' || typeof value === 'number'
}
