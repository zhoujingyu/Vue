import { initMixin } from './init'
import { stateMixin } from './state'
import { lifecycleMixin } from './lifecycle'
import { renderMixin } from './render'

/**
 * Created by 不羡仙 on 2021/5/13 下午 03:11
 * 描述：Vue构造器
 */
function Vue(options) {
  if (!(this instanceof Vue)) {

  }
  this._init(options) // 一些初始化的工作
}

initMixin(Vue)
stateMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
