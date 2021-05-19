import { initAssetRegisters } from './assets'
import { initExtend } from './extend'
import { initMixin } from './mixin'
import { initUse } from './use'
import { set, del } from '../observer'
import { ASSET_TYPES, nextTick } from '../util'

export function initGlobalAPI(Vue) {
  // TODO Vue.config配置
  // TODO Vue.util常用工具

  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  Vue.options = {}
  ASSET_TYPES.forEach((type) => {
    Vue.options[`${type}s`] = {}
  })

  // _base被用来标识基本构造函数（也就是Vue），以便在多场景下添加组件扩展
  Vue.options._base = Vue

  initUse(Vue) // use方法定义
  initMixin(Vue) // mixin方法定义
  initExtend(Vue) // extend方法定义
  initAssetRegisters(Vue) // assets注册方法
}
