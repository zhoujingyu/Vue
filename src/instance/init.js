import { initState } from './state'
import { mountComponent, initLifecycle, callHook } from './lifecycle'
import { initEvents } from './events'
import { initRender } from './render'
import { compileToFunctions } from '../compiler'
import Watcher from '../observer/watcher'
import { mergeOptions } from '../util'

let uid = 0

/**
 * Created by 不羡仙 on 2021/5/13 下午 03:12
 * 描述：初始化
 */
export function initMixin(Vue) {
  // TODO 移到state里
  Vue.prototype.$watch = function (exprOrFn, cb, options) {
    const vm = this
    new Watcher(vm, exprOrFn, cb, {
      ...options,
      user: true,
    })
  }

  // TODO 源码不在这里
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
    vm.uid = uid++
    // 一个防止vm实例自身被观察的标志位
    vm._isVue = true
    // expose real self
    vm._self = vm

    if (options && options._isComponent) {
      // 优化内部组件实例化
      // 因为动态选项合并非常慢
      // 并且没有任何内部组件选项需要特殊处理。
      initInternalComponent(vm, options)
    } else {
      // TODO mergeOptions的实现需要修改
      vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor), options || {}, vm)
    }

    // 初始化生命周期
    initLifecycle(vm)
    // 初始化事件
    initEvents(vm)
    // 初始化渲染
    initRender(vm)
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

function initInternalComponent(vm, options) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // 这样做是因为它比动态枚举更快。
  // TODO 这些字段都是啥？？？
  opts.parent = options.parent
  opts.propsData = options.propsData
  opts._parentVnode = options._parentVnode
  opts._parentListeners = options._parentListeners
  opts._renderChildren = options._renderChildren
  opts._componentTag = options._componentTag
  opts._parentElm = options._parentElm
  opts._refElm = options._refElm
  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

function resolveConstructorOptions(Ctor) {
  return Ctor.options
  // TODO 源码处理得比较复杂，有空理解了再加上
}
