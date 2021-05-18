import Vue from './instance'
import { initGlobalAPI } from './global-api'

initGlobalAPI(Vue)

Vue.version = '__VERSION__'

export {
  Vue
}
