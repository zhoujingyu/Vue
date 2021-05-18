import { initAssetRegisters } from './assets'
import { initExtend } from './extend'
import { initMixin } from './mixin'
import { ASSET_TYPES } from '../util'

export function initGlobalAPI(Vue) {
  // TODO Vue.config配置

  Vue.options = {}
  ASSET_TYPES.forEach((type) => {
    Vue.options[`${type}s`] = {}
  })
  Vue.options._base = Vue // _base指向Vue
  initExtend(Vue) // extend方法定义
  initMixin(Vue) // mixin方法定义
  initAssetRegisters(Vue) // assets注册方法
}
