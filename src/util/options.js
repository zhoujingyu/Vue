import { ASSET_TYPES, LIFECYCLE_HOOKS } from './constants'

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
