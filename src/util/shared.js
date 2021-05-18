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
