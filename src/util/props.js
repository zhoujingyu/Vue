import { hasOwn } from './'
import { observe, observerState } from '../observer'

/**
 * 描述：验证prop,不存在用默认值替换，类型为bool则声称true或false，当使用default中的默认值的时候会将默认值的副本进行observe
 */
export function validateProp(
  key, // prop的key值
  props, // prop的所有参数定义
  propsData, // props数据
  vm, // vm实例
) {
  // 获取prop参数定义
  const prop = props[key]
  // 该prop是否存在，也就是父组件是否正常传入，存在absent为false，反之为true
  const absent = !hasOwn(propsData, key)
  // 获得传入的值
  let value = propsData[key]

  // 处理Boolean类型的属性
  if (isType(Boolean, prop.type)) {
    if (absent && !hasOwn(prop, 'default')) {
      // 属性未赋值 && 没有默认值
      value = false
    } else if (!isType(String, prop.type) && (value === '' || value === hyphenate(key))) {
      // (赋值了 || 有默认值) &&
      // (值为空 || 值与属性转化为连字符形式的字符串相等)
      value = true
    }
  }

  // 当属性值不存在（即父组件没有传递下来）
  if (value === undefined) {
    // 获取属性的默认值
    value = getPropDefaultValue(vm, prop, key)

    // 由于默认值是一份新的拷贝副本，确保已经对它进行observe，有观察者观察它的变化。

    // 把之前的shouldConvert保存下来，当observe结束以后再设置回来
    const prevShouldConvert = observerState.shouldConvert
    observerState.shouldConvert = true
    observe(value)
    observerState.shouldConvert = prevShouldConvert
  }

  // TODO required等其它校验

  return value
}

/**
 * 描述：获取属性的默认值
 */
function getPropDefaultValue(vm, prop, key) {
  if (!hasOwn(prop, 'default')) {
    return undefined
  }

  const def = prop.default
  return typeof def === 'function' && getType(prop.type) !== 'Function'
    ? def.call(vm)
    : def
}

// TODO -----------------下面的代码没仔细看-----------------
/**
 * Use function string name to check built-in types,
 * because a simple equality check will fail when running
 * across different vms / iframes.
 */
function getType (fn) {
  const match = fn && fn.toString().match(/^\s*function (\w+)/)
  return match ? match[1] : ''
}

function isType (type, fn) {
  if (!Array.isArray(fn)) {
    return getType(fn) === getType(type)
  }
  for (let i = 0, len = fn.length; i < len; i++) {
    if (getType(fn[i]) === getType(type)) {
      return true
    }
  }
  /* istanbul ignore next */
  return false
}
// TODO -----------------上面的代码没仔细看-----------------
