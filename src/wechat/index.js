/* eslint-disable no-unused-vars */
import WebSocket from 'ws'
import schedule from 'node-schedule'
import dayjs from 'dayjs'
import { Task } from '#src/library/baseClass/index.js'
import { timerSend } from './task/index.js'

const CODES = {
  HEART_BEAT: 5005,
  RECV_TXT_MSG: 1,
  RECV_PIC_MSG: 3,
  USER_LIST: 5000,
  GET_USER_LIST_SUCCSESS: 5001,
  GET_USER_LIST_FAIL: 5002,
  TXT_MSG: 555,
  PIC_MSG: 500,
  AT_MSG: 550,
  CHATROOM_MEMBER: 5010,
  CHATROOM_MEMBER_NICK: 5020,
  PERSONAL_INFO: 6500,
  DEBUG_SWITCH: 6000,
  PERSONAL_DETAIL: 6550,
  DESTROY_ALL: 9999,
  NEW_FRIEND_REQUEST: 37, // 微信好友请求消息
  AGREE_TO_FRIEND_REQUEST: 10000, // 同意微信好友请求消息
  ATTATCH_FILE: 5003
}

class WechatBot extends Task {
  constructor(wechatWebSocket) {
    super()
    this.wechatWebSocket = wechatWebSocket

    this._personCache = {} // 微信联系人缓存 key是wxid value是微信名或者备注名称
    return this
  }

  _createId() {
    return Date.now().toString()
  }

  /**
   * 获取微信联系人列表
   */
  getPersonList() {
    return new Promise(async(resolve, reject) => {
      const params = {
        type: CODES.USER_LIST,
        roomid: 'null', // null
        wxid: 'null', // not null
        content: 'null', // not null
        nickname: 'null',
        ext: 'null'
      }
      const data = await this.send(params)
      resolve(data)
    })
  }

  send(options) {
    return new Promise((resolve, reject) => {
      const params = {
        id: this._createId(),
        type: CODES.TXT_MSG,
        wxid: '',
        roomid: '',
        content: '',
        nickname: 'null',
        ext: 'null',
        ...options
      }
      this.wechatWebSocket.send(JSON.stringify(params))

      const that = this
      this.wechatWebSocket.addEventListener('message', function handle(d) {
        const data = JSON.parse(d.data)
        switch (data.type) {
          case CODES.TXT_MSG:
            // 文本消息需要判断状态
            if (data.status === 'SUCCSESSED') {
              resolve(data)
            } else {
              reject(data)
            }
            break

          case params.type:
            resolve(data)
            break
          default:
            reject(data)
            break
        }

        // 移除监听事件
        that.wechatWebSocket.removeEventListener('message', handle)
      })
    })
  }

  /**
   * 通过联系人/群名称发送
   * 注意：名称重复的只会取第一个，微信名称/备注名称只要传其中一个，两个字段都传，备注名称优先级高，不做一个字段是避免联系人的微信名和一些备注名称重复导致发送给错误的人，建议通过备注名来做发送，维护备注名要唯一
   * @param {string} name 微信名称
   * @param {string} remarkName 微信备注名称
   */
  async sendByName({ name, remarkName, ...options }) {
    let nameValue = name
    let nameKey = 'name' // 联系人列表对比字段名，备注名就对比
    if (remarkName !== undefined) {
      nameValue = remarkName
      nameKey = 'remarks'
    }

    let targetWxid
    // 先从缓存里找
    for (const key in this._personCache) {
      if (Object.hasOwnProperty.call(this._personCache, key)) {
        if (this._personCache[key] === nameValue) {
          targetWxid = key
          break
        }
      }
    }

    // 缓存里没有找到就实时请求寻找，找到了缓存起来方便下次查找
    if (!targetWxid) {
      const { content: list } = await this.getPersonList()
      const target = list.find(item => item[nameKey] === nameValue)
      if (target) {
        targetWxid = target.wxid
        this._personCache[target.wxid] = target[nameKey]
      } else {
        return Promise.reject(new Error('没有找到对应名称的联系人或群'))
      }
    }

    await this.send({
      ...options,
      wxid: targetWxid
    })
  }
}

/**
 * 创建微信机器人实例
 * @param {object} wechatBotItem 微信机器人配置item
 */
const createWeChatInstance = (wechatBotItem) => {
  return new Promise((resolve, reject) => {
    wechatBotItem.ws = new WebSocket(wechatBotItem.wsUrl)

    wechatBotItem.ws.on('open', () => {
      console.log(`${dayjs().format('YYYY-MM-DD HH:mm:ss')} 微信机器人【${wechatBotItem.name}】webSocket已连接`)
      wechatBotItem.wechatBot = new WechatBot(wechatBotItem.ws)
      resolve(wechatBotItem.wechatBot)
    })

    wechatBotItem.ws.on('error', e => {
      console.error(`${dayjs().format('YYYY-MM-DD HH:mm:ss')} 微信机器人【${wechatBotItem.name}】webSocket出错`, e)
      wechatBotItem.wechatBot = null
      webSocketReconnect(wechatBotItem)
    })

    wechatBotItem.ws.on('close', () => {
      console.log(`${dayjs().format('YYYY-MM-DD HH:mm:ss')} 微信机器人【${wechatBotItem.name}】webSocket断开`)
      wechatBotItem.wechatBot = null
      webSocketReconnect(wechatBotItem)
    })
  })
}

/**
 * 重新初始化微信机器人
 */
const webSocketReconnect = (() => {
  let reconnectTimer
  const clearTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }
  return (args) => {
    clearTimer()
    // 每隔四秒就尝试重新连接，连接成功后就清除定时器
    reconnectTimer = setInterval(async() => {
      console.log(`${dayjs().format('YYYY-MM-DD HH:mm:ss')} 正在尝试重连微信机器人【${args.name}】webSocket...`)
      await createWeChatInstance(args)
      clearTimer()
    }, 4000)
  }
})()

/**
 * proxy 劫持 wechatBots，方便 wechatBots.熊小二.send() 直接访问机器人实例方法，而不是 wechatBots.熊小二.wechatBot.send()
 * @param {object} wechatBots 微信机器人配置对象
 */
const proxyWechatBots = (wechatBots) => {
  Object.keys(wechatBots).forEach(key => {
    wechatBots[key] = new Proxy(wechatBots[key], {
      get(target, property, receiver) {
        if (Reflect.has(target, property)) {
          return Reflect.get(target, property)
        }

        const wechatBot = Reflect.get(target, 'wechatBot')
        if (Reflect.has(wechatBot, property)) {
          return Reflect.get(wechatBot, property)
        }
        return undefined
      }
    })
  })
}

/**
 * 微信机器人配置
 */
const wechatBots = {
  熊小二: {
    name: '熊小二',
    wsUrl: 'ws://192.168.50.16:5555',
    ws: null, // 微信机器人webSocket实例
    wechatBot: null, // 微信机器人实例
    // 微信机器人实例创建完成后需要执行多个任务
    init() {
      const { wechatBot } = this
      wechatBot
        .task({
          name: '熊猫阁基友群定时推送',
          handle: wechatBot => timerSend({
            wechatBot,
            timeRule: {
              dayOfWeek: [new schedule.Range(1, 5)],
              hour: 14,
              minute: 40
            },
            wechatRemarkName: '熊猫阁基友群',
            content: '基友们，2点40啦，该抛就抛，该抄就抄'
          })
        })
        .use(wechatBot.getAllTask()) // 注入定义的所有任务
        .run()
    }
  }
}

/**
 * 初始化所有微信机器人
 */
const wechatBotInit = async() => {
  await Promise.all(Object.keys(wechatBots).map(async key => {
    await createWeChatInstance(wechatBots[key])
    wechatBots[key].init()
  }))

  proxyWechatBots(wechatBots)
}

export {
  wechatBotInit,
  wechatBots,
  CODES
}
