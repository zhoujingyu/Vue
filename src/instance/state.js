import {
  observe,
  set,
  del,
  observerState,
  defineReactive,
} from '../observer'
import Watcher from '../observer/watcher'
import Dep from '../observer/dep'
import {
  noop,
  validateProp,
} from '../util'

// 作为定义的描述符，传入Object.defineProperty后，get、set对应的函数是不会变的
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop,
}

/**
 * 描述：数据代理
 */
export function proxy(object, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter() {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter(val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(object, key, sharedPropertyDefinition)
}

/**
 * 描述：初始化props
 */
function initProps(vm) {
  const {
    props = {},
    propsData = {}
  } = vm.$options
  const _props = vm._props = {}
  // 缓存属性的key，使得将来能直接使用数组的索引值来更新props来替代动态地枚举对象
  const keys = vm.$options._propKeys = Object.keys(props)
  // 根据$parent是否存在来判断当前是否是根结点
  const isRoot = !vm.$parent
  // 根实例的props配置项需要转化为可响应的
  observerState.shouldConvert = isRoot
  keys.forEach((key) => {
    // 验证prop,不存在用默认值替换
    // 类型为bool则声称true或false
    // 当使用default中的默认值的时候会将默认值的副本进行observe
    const value = validateProp(key, props, propsData, vm)
    defineReactive(_props, key, value)
    // Vue.extend()期间，静态prop已经在组件原型上代理了，我们只需要在这里进行代理prop
    if (!(key in vm)) {
      proxy(vm, '_props', key)
    }
  })
  observerState.shouldConvert = true
}

/**
 * 描述：初始化methods
 */
function initMethods(vm) {
  const { methods } = vm.$options
  if (methods) {
    for (let key in methods) {
      vm[key] = methods[key] == null ? noop : methods[key].bind(vm)
    }
  }
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

const computedWatcherOptions = {
  lazy: true
}

/**
 * 描述：初始化computed
 */
function initComputed(vm) {
  const { computed } = vm.$options
  const watchers = vm._computedWatchers = Object.create(null)
  for (let k in computed) {
    const userDef = computed[k] // 获取用户定义的计算属性
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    watchers[k] = new Watcher(vm, getter, noop, computedWatcherOptions)

    // 组件正在定义的计算属性已经定义在现有组件的原型上则不会进行重复定义
    if (!(k in vm)) {
      defineComputed(vm, k, userDef)
    }
  }
}

/**
 * 描述：重新定义计算属性，对get和set劫持
 */
export function defineComputed(target, key, userDef) {
  if (typeof userDef === 'function') {
    // 如果是一个函数，需要手动赋值到get上
    sharedPropertyDefinition.get = createComputedGetter(key)
    sharedPropertyDefinition.set = noop
  } else {
    // get不存在则直接给空函数，如果存在则查看是否有缓存cache，没有依旧赋值get，有的话使用createComputedGetter创建
    sharedPropertyDefinition.get = userDef.get
      ? userDef.cache !== false
        ? createComputedGetter(key)
        : userDef.get
      : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }
  // 利用Object.defineProperty来对计算属性的get和set进行劫持
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

// 重写计算属性的get方法，来判断是否需要进行重新计算
function createComputedGetter(key) {
  return function () {
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      // 实际是脏检查，在计算属性中的依赖发生改变的时候dirty会变成true，在get的时候重新计算计算属性的输出值
      if (watcher.dirty) {
        watcher.evaluate()
      }
      // 依赖收集
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value
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
  vm._watcher = []
  const opts = vm.$options
  if (opts.props) {
    initProps(vm)
  }
  if (opts.methods) {
    initMethods(vm)
  }
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true) // TODO observe的第二个参数asRootData未处理，但是，有什么用呢？？？
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
