import { pushTarget, popTarget } from './dep'
import { queueWatcher } from './scheduler'
import { isObject } from '../util'

// 全局变量id  每次new Watcher都会自增
let id = 0

export default class Watcher {
  constructor(vm, exprOrFn, cb, options) {
    this.vm = vm
    this.exprOrFn = exprOrFn
    this.cb = cb //回调函数，比如在watcher更新之前可以执行beforeUpdate方法
    this.options = options // 额外的选项，options.user === true代表渲染watcher
    this.id = ++id
    this.deps = [] // 存放dep的容器
    this.depsId = new Set() // 用来去重dep
    this.user = options.user // 标识用户watcher
    this.lazy = options.lazy // 标识计算属性watcher
    this.dirty = this.lazy // dirty可变，表示计算watcher是否需要重新计算，默认值是true

    // 如果表达式是一个函数
    if (typeof exprOrFn === 'function') {
      this.getter = exprOrFn
    } else {
      this.getter = function () {
        // 用户watcher传过来的可能是一个字符串，类似a.a.a.a.b
        let path = exprOrFn.split('.')
        let obj = vm
        for (let i = 0; i < path.length; i++) {
          obj = obj[path[i]] // vm.a.a.a.a.b
        }
        return obj
      }
    }
    // 实例化就会默认调用get方法
    this.value = this.lazy ? undefined : this.get()
    if (this.user && this.options.immediate) {
      this.cb.call(this.vm, this.value, undefined)
    }
  }

  get() {
    pushTarget(this) // 在调用方法之前先把当前watcher实例推到全局Dep.target上
    const res = this.getter.call(this.vm) // 如果watcher是渲染watcher，那么就相当于执行vm._update(vm._render())，这个方法在render函数执行的时候会取值，从而实现依赖收集
    popTarget() // 在调用方法之后把当前watcher实例从全局Dep.target移除
    return res
  }

  addDep(dep) {
    const { id } = dep
    if (!this.depsId.has(id)) {
      this.depsId.add(id)
      this.deps.push(dep)
      // 直接调用dep的addSub方法，把自己--watcher实例添加到dep的subs容器里面
      dep.addSub(this)
    }
  }

  // 这里简单的就执行以下get方法，之后涉及到计算属性就不一样了
  update() {
    // 计算属性依赖的值发生变化，只需要把dirty置为true，下次访问到了重新计算
    if (this.lazy) {
      this.dirty = true
    } else {
      // 每次watcher进行更新的时候，让他们先缓存起来，之后再一起调用
      // 异步队列机制
      queueWatcher(this)
    }
  }

  // 计算属性重新进行计算，并且计算完成把dirty置为false
  evaluate() {
    this.value = this.get()
    this.dirty = false
  }

  depend() {
    // 计算属性的watcher存储了依赖项的dep
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend() // 调用依赖项的dep去收集渲染watcher
    }
  }

  // 真正的触发更新
  run() {
    if (this.user) {
      const newVal = this.get() // 新值
      const oldVal = this.value // 老值
      this.value = newVal // 现在的新值将成为下一次变化的老值
      // 如果两次的值不相同，或者值是引用类型，因为引用类型新老值是相等的，他们是指向同一引用地址
      if (newVal !== oldVal || isObject(newVal)) {
        this.cb.call(this.vm, newVal, oldVal)
      }
    } else {
      // 渲染watcher
      this.cb.call(this.vm)
      this.get()
    }
  }
}
