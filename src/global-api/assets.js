import { ASSET_TYPES } from '../util'

export function initAssetRegisters(Vue) {
  ASSET_TYPES.forEach((type) => {
    Vue[type] = function (id, definition) {
      if (type === 'component') {
        // this指向Vue
        // 全局组件注册
        // 子组件可能也有extend方法，VueComponent.component方法
        definition = this.options._base.extend(definition)
      }
      this.options[`${type}s`][id] = definition
    }
  })
}
