import { parse } from './parser'
import { generate } from './codegen'

/**
 * Created by 不羡仙 on 2021/5/13 下午 05:25
 * 描述：模板转化核心方法，把html字符串变成render函数
 */
export function compileToFunctions(template) {
  // 1.把html代码转成ast语法树，ast用来描述代码本身形成树结构，不仅可以描述html，也能描述css以及js语法
  // 很多库都运用到了ast，比如：webpack、babel、eslint等等
  const ast = parse(template.trim())
  // 2.优化静态节点
  // if (options.optimize !== false) {
  //   optimize(ast, options);
  // }
  // 3.通过ast重新生成代码
  // 我们最后生成的代码需要和render函数一样
  // 类似_c('div',{id:"app"},_c('div',undefined,_v("hello"+_s(name)),_c('span',undefined,_v("world"))))
  // _c代表创建元素，_v代表创建文本，_s代表Json.stringify--把对象解析成文本
  const code = generate(ast)
  return new Function(`with(this){return ${code}}`)
}
