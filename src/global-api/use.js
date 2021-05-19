/**
 * Created by 不羡仙 on 2021/5/19 下午 01:43
 * 描述：初始化use
 */
export function initUse(Vue) {
  Vue.use = function (plugin) {
    // 标识位检测该插件是否已经被安装
    if (plugin.installed) {
      return
    }
    const args = Array.from(arguments).slice(1)
    args.unshift(this)
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    plugin.installed = true
    return this
  }
}
