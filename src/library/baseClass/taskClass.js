/**
 * 基础任务类 让子类具备任务机制功能
 */
class Task {
  constructor() {
    this.taskPool = {}// 任务池
    this.queue = []// 队列
  }

  /**
   * 定义任务
   * @param {string} name 任务名称
   * @param {string[]} deps 当前任务所依赖的任务名称，待依赖任务完成后再执行
   * @param {function} handle 任务方法
   * @param {*} config 任务额外参数
   * @returns 实例
   */
  task({ name, deps = [], handle, config }) {
    if (!name) {
      throw new Error('task(name, deps, handle, config) 缺少name参数')
    }

    if (this.taskPool[name]) {
      throw new Error('任务已存在，请勿重复添加')
    }

    this.taskPool[name] = {
      name,
      deps,
      handle,
      config
    }
    return this
  }

  /**
   * 执行任务方法
   * @param {object | function} task 任务方法
   * @param {*} arg 任务参数
   * @returns
   */
  _taskHandle(task, arg) {
    if (typeof task.install === 'function') {
      return task.install.apply(task.install, arg)
    } else if (typeof task === 'function') {
      return task.apply(task, arg)
    }
  }

  /**
   * 任务的 promise
   * @param {string} key 任务名称
   * @returns 任务的 promise
   */
  async _getTaskPromise(key) {
    const task = this.taskPool[key]
    if (!task.promise) {
      task.promise = new Promise(async resolve => {
        await Promise.all(task.deps.map(key => this._getTaskPromise(key)))
        // 改用settimeout，可以让外层的promise 异常捕获更快
        setTimeout(async() => {
          await this._taskHandle(task.handle, [this].concat(task.config))
          resolve(true)
        }, 0)
      })
    }
    return task.promise
  }

  /**
   * 注入任务
   * @param {string | string[] | function} task 任务名、任务名数组、任务方法
   * @param {*} config 任务额外参数，task 为任务方法时需要才需要传
   * @returns 实例
   */
  use(task, config) {
    if (typeof task === 'string' || Array.isArray(task)) {
      // 注入任务池中的任务
      const tasks = [].concat(task) // 转为数组
      this.queue.push(async() => {
        await Promise.all(tasks
          .map(key => this._getTaskPromise(key)))
      })
    } else {
      // 注入指定任务
      this.queue.push(() => this._taskHandle(task, [this].concat(config)))
    }
    return this
  }

  /**
   * 执行任务池里的任务
   */
  async run() {
    for (const task of this.queue) {
      await task()
    }

    return this
  }

  /**
   * 模拟 sleep 功能
   * @param {number} timeout 等待的时间，单位毫秒
   */
  sleep(timeout = 0) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true)
      }, timeout)
    })
  }

  /**
   * 获取所有定义的任务
   */
  getAllTask() {
    return Object.keys(this.taskPool)
  }
}

export default Task
