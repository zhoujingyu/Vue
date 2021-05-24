import {
  isObject,
  isPrimitive,
  RESERVED_TAGS,
} from '../util'

// 判断是不是常规html标签
const reservedTagSet = new Set(RESERVED_TAGS)
function isReservedTag(tagName) {
  return reservedTagSet.has(tagName)
}

/**
 * Created by 不羡仙 on 2021/5/14 上午 11:23
 * 描述：定义Vnode类
 */
export default class Vnode {
  constructor(tag, data, key, children, text) {
    this.tag = tag
    this.data = data
    this.key = key
    this.children = children || []
    this.text = text
  }
}

/**
 * 描述：创建一个空vnode节点
 */
export function createEmptyVnode() {
  const vnode = new Vnode()
  vnode.text = ''
  vnode.isComment = true
  return vnode
}

function createComponent(vm, tag, data, key, children, Ctor) {
  if (isObject(Ctor)) {
    // 如果没有被改造成构造函数
    Ctor = vm.$options._base.extend(Ctor)
  }

  // 声明组件自己内部的生命周期
  Object.defineProperty(data, '__hook__', {
    value: {
      __init__(vnode) {
        // 实例化组件
        const child = vnode.componentInstance = new Ctor({
          _isComponent: true,
        })
        // 因为没有传入el属性，需要手动挂载，为了在组件实例上面增加$el方法可用于生成组件的真实渲染节点
        child.$mount()
      }
    },
    enumerable: false,
  })

  return new Vnode(`vue-component-${Ctor.cid}-${tag}`, data, key, children,'')
}

/**
 * 描述：创建元素vnode，等于render函数里面的h=>h(App)
 * TODO 源码是6个参数
 */
export function createElement(vm, tag, data, children, normalizationType) {
  // 兼容不传data的情况
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children
    children = data
    data = undefined
  }
  data = data || {}
  const { key } = data
  let vnode
  if (isReservedTag(tag)) {
    // 如果是普通标签
    vnode = new Vnode(tag, data, key, children)
  } else {
    // 否则就是组件
    const Ctor = vm.$options.components[tag]
    vnode = createComponent(vm, tag, data, key, children, Ctor)
  }
  vnode.context = vm
  return vnode
}

/**
 * 描述：创建文本vnode
 */
export function createTextNode(text) {
  return new Vnode(undefined, undefined, undefined, undefined, text)
}
