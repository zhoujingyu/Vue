import Vnode, {
  createElement,
  createTextNode,
  createEmptyVnode,
} from '../vdom'
import {
  nextTick,
  toString
} from '../util'

/**
 * 描述：初始化render
 */
export function initRender(vm) {
  vm._vnode = null
  vm._staticTrees = null
  const parentVnode = vm.$vnode = vm.$options._parentVnode // TODO 为何取父节点赋值给当前实例节点？
  const renderContext = parentVnode && parentVnode.context
  // TODO 暂时不管下面的代码
  // ...code
}

/**
 * Created by 不羡仙 on 2021/5/14 上午 11:13
 * 描述：render函数转化成虚拟dom的核心方法
 */
export function renderMixin(Vue) {
  Vue.prototype.$nextTick = nextTick // TODO 源码nextTick第二个参数是this实例

  Vue.prototype._render = function () {
    const vm = this
    const {
      render,
      _parentVnode,
    } = vm.$options
    // TODO 先忽略作用域slot、静态节点等一些细节

    let vnode
    try {
      vnode = render.call(vm)
    } catch (e) {
      console.error(e)
      vnode = vm._vnode
    }

    if (!(vnode instanceof Vnode)) {
      // 如果VNode节点没有创建成功则创建一个空节点
      vnode = createEmptyVnode()
    }

    // set parent
    vnode.parent = _parentVnode
    return vnode
  }

  // TODO 还有很多_x的原型方法
  // 创建虚拟dom元素
  Vue.prototype._c = function(...args) {
    const vm  = this
    return createElement(vm, ...args)
  }
  // 创建虚拟dom文本
  Vue.prototype._v = createTextNode
  // 创建空vnode节点
  Vue.prototype._e = createEmptyVnode
  // 将val转化成字符串
  Vue.prototype._s = toString
}
