import { noop, isIOS } from './'

const callbacks = []
let pending = false

function flushCallbacks() {
  // 依次执行回调
  callbacks.forEach((cb) => {
    cb()
  })
  pending = false // 把标志还原为false
}

/**
 * 描述：
 * 这里解释一下，一共有Promise、MutationObserver、setTimeout、setImmediate（node环境）4种尝试得到timerFunc的方法,
 * 优先使用Promise，在Promise不存在的情况下使用MutationObserver
 * 这两个方法的回调函数都会在microtask中执行，它们会比setTimeout更早执行，所以优先使用
 * 如果上述两种方法都不支持的环境则会使用setTimeout，在task尾部推入这个函数，等待调用执行
 */
let timerFunc

const setPromiseTimerFunc = () => {
  const p = Promise.resolve()
  const logError = (err) => { console.error(err) }
  timerFunc = () => {
    p.then(flushCallbacks).catch(logError)
    // in problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    // 在有问题的UIWebViews中，Promise.then并没有完全中断，
    // 但它可能会陷入一种奇怪的状态，即回调被推送到微任务队列中，
    // 但队列没有被刷新，直到浏览器需要执行其他一些工作，例如处理计时器。
    // 因此，我们可以通过添加一个空计时器来“强制”刷新微任务队列。
    if (isIOS) setTimeout(noop)
  }
}

const setMutationObserverTimerFunc = () => {
  let counter = 1
  const mutationObserver = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  mutationObserver.observe(textNode, {
    characterData: true,
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
}

const setTimeoutTimerFunc = () => {
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}

const setImmediateTimerFunc = () => {
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
}
if (typeof Promise !== 'undefined') {
  setPromiseTimerFunc()
} else if (typeof MutationObserver !== 'undefined') {
  setMutationObserverTimerFunc()
} else if (typeof setImmediate !== 'undefined') {
  setImmediateTimerFunc()
} else if (typeof setTimeout !== 'undefined') {
  setTimeoutTimerFunc()
}

export function nextTick(cb) {
  // 除了渲染watcher，还有用户自己手动调用的nextTick，一起被收集到数组
  callbacks.push(cb)
  if (!pending) {
    // 如果多次调用nextTick，只会执行一次异步，等异步队列清空之后再把标志变为false
    pending = true
    timerFunc()
  }
}
