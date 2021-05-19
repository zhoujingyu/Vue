import { nextTick } from '../util'

let queue = []
let has = new Set()

function flushSchedulerQueue() {
  queue.forEach((item) => {
    item.run() // 调用watcher的run方法，执行真正的更新操作
  })
  queue = []
  has.clear()
}

// 实现异步队列机制
export function queueWatcher(watcher) {
  const { id } = watcher
  // watcher去重
  if (!has.has(id)) {
    // 同步代码执行，把全部的watcher都放到队列里面去
    queue.push(watcher)
    has.add(id)
    // 进行异步调用
    nextTick(flushSchedulerQueue)
  }
}
