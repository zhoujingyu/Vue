export * from './shared'
export * from './env'

// 全局的组件、指令、过滤器
export const ASSET_TYPES = [
  'component',
  'directive',
  'filter',
]

// 定义生命周期
export const LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
]

const RESERVED_TAGS = new Set(
('html,body,base,head,link,meta,style,title,' +
'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
'embed,object,param,source,canvas,script,noscript,del,ins,' +
'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
'output,progress,select,textarea,' +
'details,dialog,menu,menuitem,summary,' +
'content,element,shadow,template,blockquote,iframe,tfoot').split(',')
)

// 合并策略
const strats = {}

// 生命周期合并策略
function mergeHook(parent, child) {
  if (child) {
    return parent ? parent.concat(child) : [child]
  }
  return parent
}

// 为生命周期添加合并策略
LIFECYCLE_HOOKS.forEach((hook) => {
  strats[hook] = mergeHook
})

// mixin核心方法
export function mergeOptions(parent = {}, child = {}) {
  const options = {}
  // 遍历父亲
  if (parent) {
    for (let k in parent) {
      mergeField(k)
    }
  }

  if (child) {
    for (let k in child) {
      mergeField(k)
    }
  }

  function mergeField(k) {
    if (strats[k]) {
      options[k] = strats[k](parent[k], child[k])
    } else {
      options[k] = child[k] || parent[k]
    }
  }

  return options
}

// 组件、指令、过滤器的合并策略
function mergeAssets(parent = {}, child = {}) {
  const res = Object.create(parent)
  if (child) {
    for (let k in child) {
      res[k] = child[k]
    }
  }
  return res
}

ASSET_TYPES.forEach((asset) => {
  strats[`${asset}s`] = mergeAssets
})

// 判断是不是常规html标签
export function isReservedTag(tagName) {
  return RESERVED_TAGS.has(tagName)
}
