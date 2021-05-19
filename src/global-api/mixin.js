import { mergeOptions } from '../util'

/**
 * Created by 不羡仙 on 2021/5/19 下午 01:41
 * 描述：初始化mixin
 */
export function initMixin(Vue) {
  Vue.mixin = function (mixin) {
    this.options = mergeOptions(this.options, mixin)
  }
}
