import { createElement, createTextNode } from '../vdom'
import { nextTick } from '../util/next-tick'

/**
 * Created by 不羡仙 on 2021/5/14 上午 11:13
 * 描述：render函数转化成虚拟dom的核心方法
 */
export function renderMixin(Vue) {
  Vue.prototype.$nextTick = nextTick

  Vue.prototype._render = function () {
    const vm = this
    // 获取模板编译生成的render方法
    const { render } = vm.$options
    return render.call(vm)
  }

  // render函数里面有_c _v _s方法需要定义
  // 创建虚拟dom元素
  Vue.prototype._c = function (...args) {
    const vm = this
    return createElement(vm, ...args)
  }

  // 创建虚拟dom文本
  Vue.prototype._v = function (text) {
    return createTextNode(text)
  }

  // 创建表达式
  Vue.prototype._s = function (val) {
    if (val === null) {
      return ''
    }
    if (val === 'object') {
      return JSON.stringify(val)
    }
    return val
  }
}
