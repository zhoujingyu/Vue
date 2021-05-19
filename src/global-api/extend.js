import { mergeOptions } from '../util'
import { proxy, defineComputed } from '../instance/state'

export function initExtend(Vue) {
  /**
   * 描述：每个构造函数实例（包括Vue本身）都会有一个唯一的cid
   * 它为我们能够创造继承创建自构造函数并进行缓存创造了可能
   */
  Vue.cid = 0
  let cid = 0 // 组件的唯一标识

  Vue.extend = function (extendOptions = {}) {
    // 父类的构造器
    const Super = this
    const SuperId = Super.cid
    // 如果构造函数中已经存在了该cid，则代表已经extend过了，直接返回
    // 因为是通过父类继承的，所以有父类id，证明已经通过父类生成了构造器
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    const name = extendOptions.name || Super.options.name

    // 创建子类的构造函数，并且调用初始化方法
    const Sub = function VueComponent(options) {
      this._init(options)
    }
    // 创建一个新的cid
    Sub.cid = ++cid
    // 继承父类的原型
    Sub.prototype = Object.create(Super.prototype)
    // 原型上的构造函数指向的是子类，不是父类
    Sub.prototype.constructor = Sub
    // 合并自己的options和父类的options
    Sub.options = mergeOptions(Super.options, extendOptions)

    // 在扩展时，我们将计算属性以及props通过代理绑定在Vue实例上（也就是vm），这也避免了Object.defineProperty被每一个实例调用
    // TODO 不明白
    if (Sub.options.props) {
      initProps(Sub)
    }
    if (Sub.options.computed) {
      initComputed(Sub)
    }

    // 缓存构造函数（用cid），防止重复extend
    cachedCtors[SuperId] = Sub
    return Sub
  }
}

// 初始化props，将option中的_props代理到vm上
function initProps(Comp) {
  const { props } = Comp.options
  for (let key in props) {
    proxy(Comp.prototype, '_props', key)
  }
}

// 处理计算属性，给计算属性设置defineProperty并绑定在vm上
function initComputed(Comp) {
  const { computed } = Comp.options
  for (let key in computed) {
    defineComputed(Comp.prototype, key, computed[key])
  }
}
