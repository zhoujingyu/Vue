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
 * 将类数组的对象转换成数组
 * @param list
 * @param start
 * @returns {any[]}
 */
export function toArray (list, start) {
  start = start || 0
  let i = list.length - start
  const ret = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  return ret
}

/**
 * Check if value is primitive
 */
export function isPrimitive (value) {
  return typeof value === 'string' || typeof value === 'number'
}

/**
 * Create a cached version of a pure function.
 */
/*根据str得到fn(str)的结果，但是这个结果会被闭包中的cache缓存起来，下一次如果是同样的str则不需要经过fn(str)重新计算，而是直接得到结果*/
export function cached(fn) {
  const cache = Object.create(null)
  return (function cachedFn (str) {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  })
}

/**
 * Hyphenate a camelCase string.
 */
/*连接一个camelCase字符串。*/
const hyphenateRE = /([^-])([A-Z])/g
export const hyphenate = cached((str) => {
  return str
  .replace(hyphenateRE, '$1-$2')
  .replace(hyphenateRE, '$1-$2') // 两次replace，将所有大写字母分开，例如"AABB", 第一次replace的结果是A-AB-B，第二次replace的结果是A-A-B-B
  .toLowerCase()
})

/**
 * 描述：将原本用-连接的字符串变成驼峰 aaa-bbb-ccc => aaaBbbCcc
 */
const camelizeRE = /-(\w)/g
export const camelize = cached((str) => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})

export function isUndef (v) {
  return v === undefined || v === null
}

export function isDef (v) {
  return v !== undefined && v !== null
}
