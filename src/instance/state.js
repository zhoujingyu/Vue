import { observe, set, del } from '../observer'
import Watcher from '../observer/watcher'
import Dep from '../observer/dep'

/**
 * 描述：数据代理
 */
function proxy(object, sourceKey, key) {
  Object.defineProperty(object, key, {
    get() {
      return object[sourceKey][key]
    },
    set(newValue) {
      object[sourceKey][key] = newValue
    },
  })
}

/**
 * 描述：初始化props
 */
function initProps(vm) {
}

function initMethods(vm) {
}

/**
 * 描述：初始化data
 */
function initData(vm) {
  // 实例的_data属性就是传入的data
  // vue组件data推荐使用函数 防止数据在组件之间共享
  let data = vm.$options.data
  data = vm._data = typeof data === 'function' ? data.call(vm) : (data || {})
  // 把data数据代理到vm 也就是Vue实例上面 我们可以使用this.a来访问this._data.a
  for (let key in data) {
    proxy(vm, '_data', key)
  }
  // 对数据进行观测 --响应式数据核心
  observe(data)
}

/**
 * 描述：初始化computed
 */
function initComputed(vm) {
  const { computed } = vm.$options
  const watchers = vm._computedWatchers = {}
  for (let k in computed) {
    const userDef = computed[k] // 获取用户定义的计算属性
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    watchers[k] = new Watcher(vm, getter, () => {}, {
      lazy: true,
    })
    defineComputed(vm, k, userDef)
  }

  /**
   * 描述：重新定义计算属性，对get和set劫持
   */
  function defineComputed(target, key, userDef) {
    const sharePropertyDefinition = {
      enumerable: true,
      configurable: true,
      get: () => {},
      set: () => {},
    }
    if (typeof userDef === 'function') {
      // 如果是一个函数，需要手动赋值到get上
      sharePropertyDefinition.get = createComputedGetter(key)
    } else {
      sharePropertyDefinition.get = createComputedGetter(key)
      sharePropertyDefinition.set = userDef.set
    }
    // 利用Object.defineProperty来对计算属性的get和set进行劫持
    Object.defineProperty(target, key, sharePropertyDefinition)
  }

// 重写计算属性的get方法，来判断是否需要进行重新计算
  function createComputedGetter(key) {
    return function () {
      const watcher = watchers[key]
      if (watcher) {
        if (watcher.dirty) {
          watcher.evaluate() // 计算属性取值的时候，如果是脏的，需要重新求值
        }
        if (Dep.target) {
          watcher.depend()
        }
        return watcher.value
      }
    }
  }
}

/**
 * 描述：初始化watch
 */
function initWatch(vm) {
  const { watch } = vm.$options
  for (let k in watch) {
    let handler = watch[k] // 用户自定义watch的写法可能是数组、对象、函数、字符串
    // 统一包装成一个数组
    if (!Array.isArray(handler)) {
      handler = [handler]
    }
    handler.forEach((h) => {
      createWatcher(vm, k, h)
    })
  }
}

/**
 * 描述：创建watcher的核心
 */
function createWatcher(vm, exprOrFn, handler, options = {}) {
  if (typeof handler === 'object') {
    options = handler // 保存用户传入的对象
    handler = options.handler // 这个代表真正用户传入的函数
  }
  if (typeof handler === 'string') {
    // 代表传入的是定义好的methods方法
    handler = vm[handler]
  }
  return vm.$watch(exprOrFn, handler, options)
}

/**
 * Created by 不羡仙 on 2021/5/13 下午 03:13
 * 描述：初始化状态，注意这里的顺序，依次是：prop > methods > data > computed > watch
 */
export function initState(vm) {
  const opts = vm.$options
  if (opts.props) {
    initProps(vm)
  }
  if (opts.methods) {
    initMethods(vm)
  }
  if (opts.data) {
    initData(vm)
  }
  if (opts.computed) {
    initComputed(vm)
  }
  if (opts.watch) {
    initWatch(vm)
  }
}

export function stateMixin(Vue) {
  // 用以将data之外的对象绑定成响应式的
  Vue.prototype.$set = set
  // 与set对立，解除绑定
  Vue.prototype.$delete = del
}
