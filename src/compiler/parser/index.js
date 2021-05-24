import { parseFilters } from './filter-parser'
import { camelize } from '../../util'

const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*` // 匹配标签名 形如：abc-123
const qnameCapture = `((?:${ncname}\\:)?${ncname})` // 匹配特殊标签，形如abc:234，前面的abc:可有可无
const startTagOpen = new RegExp(`^<${qnameCapture}`) // 匹配标签开始，形如<abc-123，捕获里面的标签名
const startTagClose = /^\s*(\/?)>/ // 匹配标签结束，>
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`) // 匹配标签结尾，如</abc-123>，捕获里面的标签名
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/ // 匹配属性，形如：id="app"
const dirRE = /^v-|^@|^:/ // 匹配v-、@以及:
const modifierRE = /\.[^.]+/g // 根据点来分开各个级别的正则，比如a.b.c.d解析后可以得到.b .c .d
const bindRE = /^:|^v-bind:/ // 匹配v-bind以及:
const onRE = /^@|^v-on:/ // 匹配@以及v-on，绑定事件
const argRE = /:(.*)$/ // 匹配参数，比如:task="currentTask"解析后可以得到task="currentTask"
const forAliasRE = /(.*?)\s+(?:in|of)\s+(.*)/ // 匹配v-for中的in以及of
const forIteratorRE = /\((\{[^}]*\}|[^,]*),([^,]*)(?:,([^,]*))?\)/ // v-for参数中带括号的情况匹配，比如(item, index)这样的参数

// 标识元素和文本type，同HTML DOM nodeType 属性
const ELEMENT_TYPE = 1
const TEXT_TYPE = 3

/**
 * 描述：生成ast方法
 */
function createASTElement(tagName, attrsList) {
  return {
    tag: tagName,
    type: ELEMENT_TYPE,
    children: [],
    attrsList,
    attrsMap: makeAttrsMap(attrsList),
    attrs: [],
    parent: null,
  }
}

function makeAttrsMap (attrs) {
  const map = {}
  for (let i = 0; i < attrs.lengt; i++) {
    map[attrs[i].name] = attrs[i].value
  }
  return map
}

/**
 * Created by 不羡仙 on 2021/5/13 下午 05:26
 * 描述：解析标签生成ast的核心代码
 */
export function parse(html) {
  let root, currentParent // 代表根节点和当前父节点
  let stack = [] // 栈结构，表示开始和结束标签

  /**
   * 描述：对开始标签进行处理
   */
  function startTagHandler({ tagName, attrsList }) {
    const element = createASTElement(tagName, attrsList)
    processFor(element)
    processAttrs(element)
    if (!root) {
      root = element
    }
    currentParent = element
    stack.push(element)
  }

  /**
   * 描述：对结束标签进行处理
   */
  function endTagHandler(tagName) {
    // 栈结构[]
    // 比如<div><span></span></div>，当遇到第一个结束标签</span>时，会匹配到栈顶<span>元素对应的ast并取出来
    const element = stack.pop()
    // 当前父元素就是栈顶的上一个元素（即pop后的stack最后一个元素），在这里就类似div
    currentParent = stack[stack.length - 1]
    // 建立parent和children关系
    if (currentParent) {
      element.parent = currentParent
      currentParent.children.push(element)
    }
  }

  /**
   * 描述：对文本进行处理
   */
  function textHandler(text) {
    text = text.trim()
    if (text) {
      currentParent.children.push({
        type: TEXT_TYPE,
        text,
      })
    }
  }

  /**
   * 描述：匹配开始标签
   */
  function parseStartTag() {
    const start = html.match(startTagOpen)
    if (start) {
      const match = {
        tagName: start[1],
        attrsList: [],
      }
      // 匹配到了开始标签，就截取掉
      advance(start[0].length)

      // 开始匹配属性
      // end代表结束符号>，如果不是匹配到了结束标签
      // attr表示匹配的属性
      let end, attr;
      while (
        !(end = html.match(startTagClose)) &&
        (attr = html.match(attribute))
      ) {
        advance(attr[0].length)
        attr = {
          name: attr[1],
          value: attr[3] || attr[4] || attr[5], // 这里是因为正则捕获支持双引号 单引号 和无引号的属性值
        }
        match.attrsList.push(attr)
      }
      if (end) {
        // 代表一个标签匹配到结束的>或/>了，代表开始标签解析完毕
        advance(end[0].length)
        return match
      }
    }
  }

  /**
   * 描述：截取html字符串，每次匹配到了就往前继续匹配
   */
  function advance(n) {
    html = html.substring(n)
  }

  while (html) {
    // 查找<
    const textEnd = html.indexOf('<')
    // 如果<在第一个，那么证明接下来就是一个标签，不管是开始还是结束标签
    if (textEnd === 0) {
      // 如果开始标签解析有结果
      const startTagMatch = parseStartTag()
      if (startTagMatch) {
        // 把解析好的标签名和属性解析生成ast
        startTagHandler(startTagMatch)
        continue
      }

      const endTagMatch = html.match(endTag)
      if (endTagMatch) {
        advance(endTagMatch[0].length)
        endTagHandler(endTagMatch[1])
        continue
      }
    }

    let text
    // 形如：hello<div></div>
    if (textEnd > 0) {
      text = html.substring(0, textEnd)
    }
    if (text) {
      advance(text.length)
      textHandler(text)
    }
  }

  return root
}

/**
 * 从ele的属性中获取name对应的值并将它从中删除
 * @param el
 * @param name
 * @returns {*}
 */
function getAndRemoveAttr (el, name) {
  let val
  if ((val = el.attrsMap[name]) != null) {
    const list = el.attrsList
    for (let i = 0, l = list.length; i < l; i++) {
      if (list[i].name === name) {
        list.splice(i, 1)
        break
      }
    }
  }
  return val
}

/**
 * 匹配v-for属性
 * @param el
 */
function processFor (el) {
  let exp
  // 取出v-for属性
  if ((exp = getAndRemoveAttr(el, 'v-for'))) {
    // 匹配v-for中的in以及of 以item in sz为例 inMatch = [ 'item of sz', 'item', 'sz', index: 0, input: 'item of sz' ]
    const inMatch = exp.match(forAliasRE)
    // 匹配失败则在非生产环境中打印v-for的无效表达式
    if (!inMatch) {
      return
    }
    // 在这里是sz
    el.for = inMatch[2].trim()
    // item
    const alias = inMatch[1].trim()
    /*
      因为item可能是被括号包裹的，比如(item, index) in sz这样的形式，匹配出这些项
      例：(item, index)匹配得到结果
      [ '(item, index, l)',
      'item',
      ' index',
      l,
      index: 0,
      input: '(item, index, l);' ]
    */
    const iteratorMatch = alias.match(forIteratorRE)
    if (iteratorMatch) {
      el.alias = iteratorMatch[1].trim()
      el.iterator1 = iteratorMatch[2].trim()
      if (iteratorMatch[3]) {
        el.iterator2 = iteratorMatch[3].trim()
      }
    } else {
      el.alias = alias
    }
  }
}

/**
 * 描述：处理属性
 */
function processAttrs (el) {
  const { attrsList } = el
  let name, rawName, value, modifiers, isProp
  attrsList.forEach((attr) => {
    name = rawName = attr.name
    value = attr.value
    // 匹配v-、@以及:，处理element的特殊属性，如v-on、@click、:task等
    if (dirRE.test(name)) {
      // 标记该element为动态的
      el.hasBindings = true

      // 解析表达式，比如a.b.c.d得到结果{b: true, c: true, d:true}
      modifiers = parseModifiers(name)
      if (modifiers) {
        // 得到第一级，比如a.b.c.d得到a，也就是上面的操作把所有子级取出来，这个把第一级取出来
        name = name.replace(modifierRE, '')
      }

      // 1、如果属性是v-bind
      if (bindRE.test(name)) {
        // 这样处理以后v-bind:aaa得到aaa
        name = name.replace(bindRE, '')
        // 解析过滤器
        value = parseFilters(value) // TODO 具体代码没看，太复杂
        isProp = false
        if (modifiers) {
          /**
           * https://cn.vuejs.org/v2/api/#v-bind
           * 描述：这里用来处理v-bind的修饰符
           */
          // .prop - 被用于绑定 DOM 属性。
          if (modifiers.prop) {
            isProp = true
            // 将原本用-连接的字符串变成驼峰 aaa-bbb-ccc => aaaBbbCcc
            name = camelize(name)
            if (name === 'innerHtml') name = 'innerHTML' // 这么特殊？？？
          }
          // .camel - (2.1.0+) 将 kebab-case 特性名转换为 camelCase. (从 2.1.0 开始支持)
          if (modifiers.camel) {
            name = camelize(name)
          }
          // TODO .sync (2.3.0+) 语法糖，会扩展成一个更新父组件绑定值的 v-on 侦听器。
          // if (modifiers.sync) {
          //   addHandler(el, `update:${camelize(name)}`, genAssignmentCode(value, `$event`))
          // }
        }
        // TODO 暂时不理prop修饰符
        // if (isProp || platformMustUseProp(el.tag, el.attrsMap.type, name)) {
          // 将属性放入element的props属性中
          // addProp(el, name, value)
        // } else {
          // 将属性放入element的attr属性中
          addAttr(el, name, value)
        // }
      } else if (onRE.test(name)) {
        // 2、v-on
        name = name.replace(onRE, '')
        addHandler(el, name, value, modifiers, false)
      } else {
        // 3、其它普通指令
        // 去除@、:、v-
        name = name.replace(dirRE, '')
        // parse arg
        const argMatch = name.match(argRE)
        // 比如:fun="functionA"解析出fun="functionA"
        const arg = argMatch && argMatch[1]
        if (arg) {
          name = name.slice(0, -(arg.length + 1))
        }
        // TODO 将参数加入到element的directives中去
        // addDirective(el, name, rawName, value, arg, modifiers)
      }
    } else {
      // TODO
      // 处理常规的字符串属性
      // 将属性放入element的attr属性中
      addAttr(el, name, JSON.stringify(value))
    }
  })
}

/**
 * 描述：解析表达式，比如a.b.c.d得到结果{b: true, c: true, d:true}
 */
function parseModifiers(name) {
  const match = name.match(modifierRE)
  if (match) {
    const ret = {}
    match.forEach((m) => {
      ret[m.slice(1)] = true
    })
    return ret
  }
}

function addHandler (el, name, value, modifiers, important) {
  // check capture modifier
  if (modifiers && modifiers.capture) {
    delete modifiers.capture
    name = '!' + name // mark the event as captured
  }
  // check once modifier
  if (modifiers && modifiers.once) {
    delete modifiers.once
    name = '~' + name // mark the event as once
  }
  // check passive modifier
  if (modifiers && modifiers.passive) {
    delete modifiers.passive
    name = '&' + name // mark the event as passive
  }
  let events
  if (modifiers && modifiers.native) {
    delete modifiers.native
    events = el.nativeEvents || (el.nativeEvents = {})
  } else {
    events = el.events || (el.events = {})
  }
  const newHandler = { value, modifiers }
  const handlers = events[name]
  if (Array.isArray(handlers)) {
    important ? handlers.unshift(newHandler) : handlers.push(newHandler) // 同一事件声明3次及以上
  } else if (handlers) {
    events[name] = important ? [newHandler, handlers] : [handlers, newHandler] // 同一事件声明2次
  } else {
    events[name] = newHandler // 同一事件声明1次
  }
}

function addAttr (el, name, value) {
  (el.attrs || (el.attrs = [])).push({ name, value })
}
