import { toArray } from '../util'

/**
 * 初始化事件
 * @param vm
 */
export function initEvents(vm) {
  // 在vm上创建一个_events对象，用来存放事件。
  vm._events = Object.create(null)
  // 这个bool标志位来表明是否存在钩子，而不需要通过哈希表的方法来查找是否有钩子，这样做可以减少不必要的开销，优化性能。
  vm._hasHookEvent = false
  // 初始化父级的附加事件
  const listeners = vm.$options._parentListeners
  if (listeners) {
    updateComponentListeners(vm, listeners)
  }
}

// 有once的时候注册一个只会触发一次的方法，没有once的时候注册一个事件方法
function add (event, fn, once) {
  const vm = this
  if (once) {
    vm.$once(event, fn)
  } else {
    vm.$on(event, fn)
  }
}

// 销毁一个事件方法
function remove (event, fn) {
  const vm = this
  vm.$off(event, fn)
}

/**
 * 更新组件的监听事件
 * @param vm
 * @param listeners
 * @param oldListeners
 */
export function updateComponentListeners (vm, listeners, oldListeners) {
  // TODO 先不管
  // updateListeners(listeners, oldListeners || {}, add.bind(vm), remove.bind(vm), vm)
}

/**
 * 为Vue原型加入操作事件的方法
 * @param Vue
 */
export function eventsMixin(Vue) {
  const hookRE = /^hook:/

  // 在原型上绑定事件方法
  Vue.prototype.$on = function (event, fn) {
    const vm = this

    if (Array.isArray(event)) {
      event.forEach(e => this.$on(e, fn))
    } else {
      (vm._events[event] || (vm._events = [])).push(fn)
      // 这里在注册事件的时候标记bool值也就是个标志位来表明存在钩子，而不需要通过哈希表的方法来查找是否有钩子，这样做可以减少不必要的开销，优化性能。
      if (hookRE.test(event))
        vm.hasHookEvent = true
    }
    return vm
  }

  // 注册一个只执行一次的事件方法
  Vue.prototype.$once = function (event, fn) {
    const vm = this
    function on() {
      vm.$off(event, on)
      fn.apply(vm, arguments)
    }
    on.fn = fn // 保存传入的fn，用于off时判断
    vm.$on(event, on)
    return vm
  }

  // 销一个事件，如果不传参则注销所有事件，如果只传event名则注销该event下的所有方法
  Vue.prototype.$off = function (event, fn) {
    const vm = this

    // 如果不传参数则注销所有事件
    if (!arguments.length) {
      vm._events = Object.create(null)
      return vm
    }

    // 如果event是数组则递归注销事件
    if (Array.isArray(event)) {
      event.forEach((e) => vm.$off(e, fn))
      return vm
    }

    const cbs = vm._events[event]
    // 本身不存在该事件则直接返回
    if (!cbs) {
      return vm
    }
    // 如果只传了event参数则注销该event方法下的所有方法
    if (arguments.length === 1) {
      vm._events[event] = null
      return vm
    }
    // 遍历寻找对应方法并删除
    let cb
    let i = cbs.length
    while (i--) {
      cb = cbs[i]
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1)
        break
      }
    }
    return vm
  }

  // 触发一个事件方法
  Vue.prototype.$off = function (event) {
    const vm = this
    let cbs = vm._events[event]
    if (cbs) {
      // 将类数组的对象转换成数组
      // TODO cbs本来就是一个数组吧？？？
      cbs = cbs.length > 1 ? toArray(cbs) : cbs
      const args = toArray(arguments, 1)
      // 遍历执行
      for (let i = 0, l = cbs.length; i < l; i++) {
        cbs[i].apply(vm, args)
      }
    }
    return vn
  }
}
