import { initState } from './state'
import { mountComponent, callHook } from './lifecycle'
import { compileToFunctions } from '../compiler'
import Watcher from '../observer/watcher'
import { mergeOptions } from '../util'

/**
 * Created by 不羡仙 on 2021/5/13 下午 03:12
 * 描述：初始化
 */
export function initMixin(Vue) {
  Vue.prototype.$watch = function (exprOrFn, cb, options) {
    const vm = this
    new Watcher(vm, exprOrFn, cb, {
      ...options,
      user: true,
    })
  }

  Vue.prototype.$mount = function (el) {
    const vm = this
    const options = vm.$options
    el = document.querySelector(el)

    // 如果不存在render属性
    if (!options.render) {
      // 如果存在template属性
      let template = options.template

      if (!template && el) {
        // 如果不存在render和template，但是存在el属性，直接将模板赋值到el所在的外层html结构（就是el本身，并不是父元素）
        template = el.outerHTML
      }

      // 最终需要把template模板转化成render函数
      if (template) {
        options.render = compileToFunctions(template)
      }
    }

    // 将当前组件实例挂载到真实的el节点上面
    return mountComponent(vm, el)
  }

  Vue.prototype._init = function (options) {
    const vm = this
    // 这里的this代表调用_init方法的对象(实例对象)
    // this.$options就是用户new Vue的时候传入的属性
    vm.$options = mergeOptions(vm.constructor.options, options)
    callHook(vm, 'beforeCreate')
    // 初始化状态
    initState(vm)
    callHook(vm, 'created')
    // 如果有el属性，进行模板渲染
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}
