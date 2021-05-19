/**
 * Created by 不羡仙 on 2021/5/14 上午 11:33
 * 描述：patch用来渲染和更新视图
 */
export function patch(oldVnode, vnode) {
  if (!oldVnode) {
    // 组件的创建过程是没有el属性的
    return createElm(vnode)
  }
  // 判断传入的oldVnode是否是一个真实元素
  // 这里很关键，初次渲染，传入的vm.$el就是咱们传入的el选项，所以是真实dom
  // 如果不是初始渲染而是视图更新的时候，vm.$el就被替换成了更新之前的老的虚拟dom
  const isRealElement = oldVnode.nodeType // 真实dom是HTMLElement对象，有nodeType字段
  if (isRealElement) {
    // 这里是初次渲染的逻辑
    const oldElement = oldVnode
    const parentElement = oldElement.parentNode
    // 将虚拟dom转化成真实dom节点
    const el = createElm(vnode)
    // 插入到老的el节点下一个节点的前面，就相当于插入到老的el节点的后面
    // 这里不直接使用父元素appendChild是为了不破坏替换的位置
    parentElement.replaceChild(el, oldElement)
    return el
  }

  // oldVnode是虚拟dom，就是更新过程，使用diff算法
  if (oldVnode.tag !== vnode.tag) {
    // 如果新旧标签不一致，用新的替换旧的，oldVnode.el代表的是真实dom节点--同级比较
    oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el)
  } else if (!oldVnode.tag && !vnode.tag && oldVnode.text !== vnode.text) {
    // 如果旧节点是一个文本节点
    oldVnode.el.textContent = vnode.text
  } else {
    // 不符合上面两种，代表标签一致，并且不是文本节点
    // 为了节点复用，所以直接把旧的虚拟dom对应的真实dom赋值给新的虚拟dom的el属性
    const el = vnode.el = oldVnode.el
    updateProperties(vnode, oldVnode.data) // 更新属性
    const oldChildren = oldVnode.children || [] // 老的儿子
    const newChildren = vnode.children || [] // 新的儿子
    if (oldChildren.length > 0 && newChildren.length > 0) {
      // 新老都存在子节点
      updateChildren(el, oldChildren, newChildren)
    } else if (oldChildren.length) {
      // 老的有儿子，新的没有
      el.innerHTML = ''
    } else if (newChildren.length) {
      // 老的没有，新的有儿子
      for (let i = 0; i < newChildren.length; i++) {
        el.appendChild(createElm(newChildren[i]))
      }
    }
  }
}

// 判断是否是组件Vnode
function createComponent(vnode) {
  // 初始化组件
  // 创建组件实例
  let i = vnode.data
  // 下面这句话很关键
  // 调用组件data.hook.init方法进行组件初始化过程
  // 最终组件的vnode.componentInstance.$el就是组件渲染好的真实dom
  if ((i = i.__hook__) && (i = i.__init__)) {
    i(vnode)
  }
  // 如果组件实例化完毕有componentInstance属性，那证明是组件
  return Boolean(vnode.componentInstance)
}

/**
 * 描述：虚拟dom转成真实dom，就是调用原生方法生成dom树
 */
function createElm(vnode) {
  const { tag, data, key, children, text } = vnode
  if (typeof tag === 'string') {
    if (createComponent(vnode)) {
      // 如果是组件，返回真实组件渲染的真实dom
      return vnode.el = vnode.componentInstance.$el
    }
    // 虚拟dom的el属性指向真实dom
    vnode.el = document.createElement(tag)
    // 解析虚拟dom属性
    updateProperties(vnode)
    // 如果有子节点就递归插入到父节点里面
    children.forEach((child) => {
      vnode.el.appendChild(createElm(child))
    })
  } else {
    // 文本节点
    vnode.el = document.createTextNode(text)
  }
  return vnode.el
}

/**
 * 描述：解析vnode的data属性，映射到真实dom上
 */
function updateProperties(vnode, oldProps = {}) {
  const { el, data: newProps = {} } = vnode
  // 如果新的节点没有，需要把老的节点属性移除
  for (let k in oldProps) {
    if (!newProps[k]) {
      el.removeAttribute(k)
    }
  }
  // 对style样式做特殊处理，如果新的没有，需要把老的style值置为空
  const newStyle = newProps.style || {}
  const oldStyle = oldProps.style || {}
  for (let s in oldStyle) {
    if (!newStyle[s]) {
      el.style[s] = ''
    }
  }
  for (let key in newProps) {
    // style需要特殊处理下
    if (key === 'style') {
      for (let styleName in newProps.style) {
        el.style[styleName] = newProps.style[styleName]
      }
    } else if (key === 'class') {
      el.className = newProps.class
    } else {
      el.setAttribute(key, newProps[key])
    }
  }
}

// 根据key来创建老的儿子的index映射表，类似{'a':0,'b':1}，代表key为'a'的节点在第一个位置，key为'b'的节点在第二个位置
function makeIndexByKey(children) {
  const map = {}
  children.forEach((item, index) => {
    map[item.key] = index
  })
  return map
}

// 判断两个vnode的标签和key是否相同，如果相同，就可以认为是同一节点就地复用
function isSameVnode(oldVnode, newVnode) {
  return oldVnode.tag === newVnode.tag && oldVnode.key === newVnode.key
}

// diff算法核心，采用双指针的方式，对比新老vnode的儿子节点
function updateChildren(parent, oldCh, newCh) {
  let oldStartIndex = 0 // 老儿子的起始下标
  let oldStartVnode = oldCh[0] // 老儿子的第一个节点
  let oldEndIndex = oldCh.length - 1 // 老儿子的结束下标
  let oldEndVnode = oldCh[oldEndIndex] // 老儿子的结束节点

  let newStartIndex = 0 // 同上，新儿子的
  let newStartVnode = newCh[0]
  let newEndIndex = newCh.length - 1
  let newEndVnode = newCh[newEndIndex]

  const map = makeIndexByKey(oldCh) // 生成的映射表

  // 只有当新老儿子的双指标的起始位置不大于结束位置的时候，才能循环，一方停止了就需要结束循环
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    // 因为暴力对比过程把移动的vnode置为undefined，如果不存在vnode节点，直接跳过
    if (!oldStartVnode) {
      oldStartVnode = oldCh[++oldStartIndex]
    } else if (!oldEndVnode) {
      oldEndVnode = oldCh[--oldEndIndex]
    } else if (isSameVnode(oldStartVnode, newStartVnode)) {
      // 头和头对比，依次向后追加
      patch(oldStartVnode, newStartVnode) //递归比较儿子以及他们的子节点
      oldStartVnode = oldCh[++oldStartIndex]
      newStartVnode = newCh[++newStartIndex]
    } else if (isSameVnode(oldEndVnode, newEndVnode)) {
      //尾和尾对比，依次向前追加
      patch(oldEndVnode, newEndVnode)
      oldEndVnode = oldCh[--oldEndIndex]
      newEndVnode = newCh[--newEndIndex]
    } else if (isSameVnode(oldStartVnode, newEndVnode)) {
      // 老的头和新的尾相同，把老的头部移动到尾部
      patch(oldStartVnode, newEndVnode)
      parent.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling)
      oldStartVnode = oldCh[++oldStartIndex]
      newEndVnode = newCh[--newEndIndex]
    } else if (isSameVnode(oldEndVnode, newStartVnode)) {
      // 老的尾和新的头相同，把老的尾部移动到头部
      patch(oldEndVnode, newStartVnode)
      parent.insertBefore(oldEndVnode.el, oldStartVnode.el)
      oldEndVnode = oldCh[--oldEndIndex]
      newStartVnode = newCh[++newStartIndex]
    } else {
      // 上述四种情况都不满足，那么需要暴力对比
      // 根据老的子节点的key和index的映射表，从新的开始子节点进行查找，如果可以找到就进行移动操作，如果找不到则直接进行插入
      const moveIndex = map[newStartVnode.key]
      if (moveIndex === undefined) {
        // 老的节点找不到，直接插入
        parent.insertBefore(createElm(newStartVnode), oldStartVnode.el)
      } else {
        const moveVnode = oldCh[moveIndex] // 找得到就拿到老的节点
        oldCh[moveIndex] = undefined // 这个是占位操作，避免数组塌陷，防止老节点移动走了之后破坏了初始的映射表位置
        parent.insertBefore(moveVnode.el, oldStartVnode.el) // 把找到的节点移动到最前面
        patch(moveVnode, oldStartVnode)
      }
      newStartVnode = newCh[++newStartIndex]
    }
  }

  if (newStartIndex <= newEndIndex) {
    newEndVnode = newCh[newEndIndex + 1]
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      const ele = newEndVnode ? newEndVnode.el : null
      parent.insertBefore(createElm(newCh[i]), ele)
    }
  }

  if (oldStartIndex <= oldEndIndex) {
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      const child = oldCh[i]
      if (child) {
        parent.removeChild(child.el)
      }
    }
  }
}
