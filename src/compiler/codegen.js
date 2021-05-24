const defaultTagReg = /\{\{((?:.|\r?\n)+?)\}\}/g; // 匹配花括号{{}}，捕获花括号里面的内容
const fnExpRE = /^\s*([\w$_]+|\([^)]*?\))\s*=>|^function\s*\(/
const simplePathRE = /^\s*[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['.*?']|\[".*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*\s*$/
const keyCodes = {
  esc: 27,
  tab: 9,
  enter: 13,
  space: 32,
  up: 38,
  left: 37,
  right: 39,
  down: 40,
  'delete': [8, 46]
}
const genGuard = condition => `if(${condition})return null;`
const modifierCode = {
  stop: '$event.stopPropagation();',
  prevent: '$event.preventDefault();',
  self: genGuard(`$event.target !== $event.currentTarget`),
  ctrl: genGuard(`!$event.ctrlKey`),
  shift: genGuard(`!$event.shiftKey`),
  alt: genGuard(`!$event.altKey`),
  meta: genGuard(`!$event.metaKey`),
  left: genGuard(`'button' in $event && $event.button !== 0`),
  middle: genGuard(`'button' in $event && $event.button !== 1`),
  right: genGuard(`'button' in $event && $event.button !== 2`)
}

/**
 * 描述：处理节点
 */
function gen(node) {
  // 判断节点类型
  // 主要包含处理文本核心
  // 源码这块包含了复杂的处理，比如v-once、v-for、v-if、自定义指令、slot等等，这里只考虑普通文本和变量表达式{{}}的处理

  if (node.type === 1) {
    // 如果是元素类型，递归创建
    return generate(node)
  } else {
    // 如果是文本节点
    const text = node.text
    // 不存在花括号变量表达式
    if (!defaultTagReg.test(text)) {
      return `_v(${JSON.stringify(text)})`
    }
    // 正则是全局模式，每次需要重置正则的lastIndex属性，不然会引发匹配bug
    const tokens = []
    let lastIndex = defaultTagReg.lastIndex = 0
    let match, index
    while ((match = defaultTagReg.exec(text))) {
      // index代表匹配到的位置
      index = match.index
      if (index > lastIndex) {
        // 匹配到的{{位置，在tokens里面放入普通文本
        tokens.push(JSON.stringify(text.slice(lastIndex, index)))
      }
      // 放入捕获到的变量内容
      tokens.push(`_s(${match[1].trim()})`)
      // 匹配指针后移
      lastIndex = index + match[0].length
    }
    // 如果匹配完了花括号，text里面还有剩余的普通文本，那么继续push
    if (lastIndex < text.length) {
      tokens.push(JSON.stringify(text.slice(lastIndex)))
    }
    return `_v(${tokens.join("+")})`
  }
}

/**
 * 生成data
 * @param node
 */
function genData(node) {
  let data = ''
  const { attrs, events } = node
  if (attrs.length) {
    data += genProps(attrs)
  }
  if (events) {
    data += genEvents(events, false)
  }
  return `{${data}}`
}

/**
 * 描述：处理attrs属性
 */
function genProps(attrs) {
  let str = ''
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i]
    // 对attrs属性里面的style做特殊处理
    if (attr.name === 'style') {
      const obj = {}
      attr.value.split(';').forEach((item) => {
        let [key, value] = item.split(':');
        obj[key] = value
      })
      attr.value = obj
    }
    str += `${attr.name}:${JSON.stringify(attr.value)},`
  }
  return str
}

/**
 * 处理events属性
 * @param events
 */
function genEvents(events, native) {
  let res = native ? 'nativeOn:{' : 'on:{'
  for (const name in events) {
    const handler = events[name]
    res += `"${name}":${genHandler(name, handler)},`
  }
  return res.slice(0, -1) + '},'
}

function genHandler (name, handler) {
  if (!handler) {
    return 'function(){}'
  }

  if (Array.isArray(handler)) {
    return `[${handler.map(handler => genHandler(name, handler)).join(',')}]`
  }

  const isMethodPath = simplePathRE.test(handler.value)
  const isFunctionExpression = fnExpRE.test(handler.value)

  if (!handler.modifiers) {
    return isMethodPath || isFunctionExpression
    ? handler.value
    : `function($event){${handler.value}}` // inline statement
  } else {
    // TODO 没细看
    let code = ''
    let genModifierCode = ''
    const keys = []
    for (const key in handler.modifiers) {
      if (modifierCode[key]) {
        genModifierCode += modifierCode[key]
        // left/right
        if (keyCodes[key]) {
          keys.push(key)
        }
      } else {
        keys.push(key)
      }
    }
    if (keys.length) {
      code += genKeyFilter(keys)
    }
    // Make sure modifiers like prevent and stop get executed after key filtering
    if (genModifierCode) {
      code += genModifierCode
    }
    const handlerCode = isMethodPath
    ? handler.value + '($event)'
    : isFunctionExpression
    ? `(${handler.value})($event)`
    : handler.value
    return `function($event){${code}${handlerCode}}`
  }
}

function genKeyFilter (keys) {
  return `if(!('button' in $event)&&${keys.map(genFilterCode).join('&&')})return null;`
}

function genFilterCode (key) {
  const keyVal = parseInt(key, 10)
  if (keyVal) {
    return `$event.keyCode!==${keyVal}`
  }
  const alias = keyCodes[key]
  return `_k($event.keyCode,${JSON.stringify(key)}${alias ? ',' + JSON.stringify(alias) : ''})`
}

/**
 * 描述：生成子节点，调用gen函数进行递归创建
 */
function getChildren(node) {
  const { children } = node
  if (children) {
    return `${children.map((c) => gen(c)).join(',')}`
  }
}

/**
 * Created by 不羡仙 on 2021/5/14 上午 10:26
 * 描述：递归创建生成code
 */
export function generate(node) {
  const children = getChildren(node)
  const { tag: tagName } = node
  const data = genData(node)
  const later = children ? `,[${children}]` : ''
  return `_c('${tagName}', ${data}${later})`
}
