import { ASSET_TYPES, isPlainObject } from '../util'

export function initAssetRegisters(Vue) {
  ASSET_TYPES.forEach((type) => {
    Vue[type] = function (id, definition) {
      // 无定义的数据传入，则为取id对应的数据
      if (!definition) {
        return this.options[`${type}s`][id]
      }

      if (type === 'component' && isPlainObject(definition)) {
        definition.name = definition.name || id
        // 全局组件注册
        // 子组件可能也有extend方法，VueComponent.component方法
        definition = this.options._base.extend(definition)
      }

      // TODO 如果type为指令

      this.options[`${type}s`][id] = definition
      return definition
    }
  })
}
