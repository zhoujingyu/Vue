import { arrayMethods } from './array'
import Dep from './dep'
import {
  isObject,
  isPlainObject,
  hasOwn,
} from '../util'

/**
 * 描述：默认情况下，当一个无效的属性被设置时，新的值也会被转换成无效的。
 * 不管怎样，当传递props时，我们不需要进行强制转换
 */
export const observerState = {
  shouldConvert: true,
  isSettingProps: false,
}

/**
 * 描述：响应式数据核心方法
 */
export function defineReactive(data, key, value) {
  const property = Object.getOwnPropertyDescriptor(data, key)
  if (property && !property.configurable) {
    return
  }

  const dep = new Dep() // 闭包中的dep，区别于observer中的dep
  const childObserve = observe(value) // 递归关键

  // 如果之前该对象已经预设了getter以及setter函数则将其取出来
  // 新定义的getter/setter中会将其执行
  // 保证不会覆盖之前已经定义的getter/setter
  const getter = property && property.get
  const setter = property && property.set

  // 如果value还是一个对象会继续走一遍defineReactive，层层遍历一直到value不是对象才停止
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get() {
      const res = getter ? getter.call(data) : value
      // 页面取值的时候，可以把watcher收集到dep里面--依赖收集
      if (Dep.target) {
        // 如果有watcher，dep就会保存watcher，同时watcher也会保存dep
        dep.depend()
        // 子对象进行依赖收集
        // 其实就是将同一个watcher观察者实例放进了两个depend中，一个是正在本身闭包中的depend，另一个是子元素的depend
        if (childObserve) {
          // 这里表示，属性的值依然是一个对象，包含数组和对象，childObserve指代的就是Observer实例对象，里面的dep进行依赖收集
          // 比如{a:[1,2,3]}属性a对应的值是一个数组，观测数组的返回值就是对应数组的Observer实例对象
          childObserve.dep.depend()
        }
        if (Array.isArray(res)) {
          // 如果数据结构类似{a:[1,2,[3,4,[5,6]]]}这种数组多层嵌套，数组包含数组的情况
          // 那么我们访问a的时候，只是对第一层的数组进行了依赖收集，里面的数组因为没访问到，达不到收集依赖
          // 但是如果我们改变了a里面的第二层数组的值，是需要更新页面的
          // 所以需要对数组递归进行依赖收集
          dependArray(res)
        }
      }
      return res
    },
    set(newVal) {
      const oldVal = getter ? getter.call(data) : value
      // TODO newVal !== newVal && oldVal !== oldVal 是啥意思？？？
      if (newVal === oldVal || (newVal !== newVal && oldVal !== oldVal)) {
        return
      }
      if (setter) {
        // 如果原本对象拥有setter方法则执行setter
        setter.call(data, newVal)
      } else {
        value = newVal
      }
      // 如果赋值的新值也是一个对象，需要观测
      observe(newVal)
      // dep对象通知所有的观察者--派发更新
      dep.notify()
    }
  })
}

/**
 * 描述：递归收集数组依赖
 */
function dependArray(value) {
  value.forEach((item) => {
    item && item.__ob__ && item.__ob__.dep.depend()
    if (Array.isArray(item)) {
      dependArray(item)
    }
  })
}

/**
 * 描述：响应式数据核心类
 */
export class Observer {
  constructor(data) {
    Object.defineProperty(data, '__ob__', {
      // 值指代的就是Observer的实例
      value: this,
      enumerable: false,
      writable: true,
      configurable: true,
    })
    this.value = data
    this.dep = new Dep()

    if (Array.isArray(data)) {
      // 这里对数组做了额外判断
      // 通过重写数组原型方法来对数组的七种方法进行拦截
      data.__proto__ = arrayMethods
      this.observeArray(data)
    } else {
      this.walk(data)
    }
  }

  walk(data) {
    Object.keys(data).forEach((key) => {
      defineReactive(data, key, data[key])
    })
  }

  observeArray(data) {
    data.forEach((item) => {
      observe(item)
    })
  }
}

export function set(target, key, val) {
  // 如果是数组，直接调用我们重写的splice方法，可以刷新视图
  if (Array.isArray(target) && typeof key === 'number') {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }

  // 如果是对象本身的属性，则直接添加即可
  if (hasOwn(target, key)) {
    target[key] = val
    return val
  }

  const ob = target.__ob__

  // 如果对象本身就不是响应式，不需要将其定义成响应式属性
  if (!ob) {
    target[key] = val
    return val
  }
  // 否则，新增的属性定义成响应式的
  defineReactive(ob.value, key, val)
  // 通知视图更新
  ob.dep.notify()
  return val
}

export function del(target, key) {
  // 如果是数组依旧调用splice方法
  if (Array.isArray(target) && typeof key === 'number') {
    target.splice(key, 1)
    return
  }
  const ob = target.__ob__
  // 如果对象本身就没有这个属性，什么都不做
  if (!hasOwn(target, key)) {
    return
  }
  // 直接使用delete，删除这个属性
  delete target[key]
  // 如果对象本身就不是响应式，直接返回
  if (!ob) {
    return
  }
  // 通知视图更新
  ob.dep.notify()
}

/**
 * Created by 不羡仙 on 2021/5/13 下午 03:30
 * 描述：响应式数据
 */
export function observe(data) {
  if (!isObject(data)) {
    return
  }
  let ob
  if (
    hasOwn(data, '__ob__') &&
    data.__ob__ instanceof Observer
  ) {
    // 这里用__ob__这个属性来判断是否已经有Observer实例
    // 如果没有Observer实例则会新建一个Observer实例并赋值给__ob__这个属性
    // 如果已有Observer实例则直接返回该Observer实例
    ob = data.__ob__
  } else if (
    observerState.shouldConvert &&
    (isPlainObject(data) || Array.isArray(data)) &&
    Object.isExtensible(data)
  ) {
    // 如果传过来的是对象或者数组，进行属性劫持
    ob = new Observer(data)
  }
  // TODO 忽略根数据计数，不知道干啥的
  return ob
}
