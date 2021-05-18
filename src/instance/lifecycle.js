import { patch } from '../vdom/patch'
import Watcher from '../observer/watcher'

export function callHook(vm, hook) {
  // 依次执行生命周期对应的方法
  const handlers = vm.$options[hook]
  if (handlers) {
    for (let i = 0; i < handlers.length; i++) {
      handlers[i].call(vm) // 生命周期里面的this指向当前实例
    }
  }
}

/**
 * Created by 不羡仙 on 2021/5/14 上午 11:05
 * 描述：组件挂载核心方法
 */
export function mountComponent(vm, el) {
  // 上一步模板编译解析生成了render函数
  // 下一步就是执行vm._render()方法，调用生成的render函数，生成虚拟dom
  // 最后使用vm._update()方法把虚拟dom渲染到页面

  // 真实的el选项赋值给实例的$el属性，为之后虚拟dom产生的新的dom替换老的dom做铺垫
  vm.$el = el
  // _update和._render方法都是挂载在Vue原型的方法，类似_init
  callHook(vm, 'beforeMount') // 初始渲染之前
  const updateComponent = () => {
    vm._update(vm._render())
  }
  new Watcher(vm, updateComponent, () => {
    callHook(vm, 'beforeUpdate') // 更新之前
  }, true)
  callHook(vm, 'mounted') // 渲染完成之后
}

/**
 * 描述：虚拟dom转化成真实dom核心方法_update
 */
export function lifecycleMixin(Vue) {
  Vue.prototype._update = function (vnode) {
    const vm = this
    const preVnode = vm._vnode
    vm._vnode = vnode // 保留上一次的vnode
    if (!preVnode) {
      vm.$el = patch(vm.$el, vnode) // 初次渲染，vm._vnode肯定不存在，要通过虚拟节点，渲染出真实的dom，赋值给$el属性
    } else {
      vm.$el = patch(preVnode, vnode) // 更新时把上次的vnode和这次更新的vnode穿进去，进行diff算法
      callHook(vm, 'updated')
    }
  }
}
