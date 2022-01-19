/* eslint-disable no-unused-vars */
import WebSocket from 'ws'
import schedule from 'node-schedule'
import dayjs from 'dayjs'
import { Task } from '#src/library/baseClass/index.js'
import { timerSend, openwrt } from './task/index.js'

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

    this._personCache = {} // 微信联系人缓存

    this.recvMsgEvents = {} // 接收消息事件
    return this
  }

  _createId() {
    return Date.now().toString()
  }

  /**
   * 注册接收消息事件
   * @param {string} eventName 事件名称
   * @param {string} type 消息类型 text-文本消息 pic-图片消息
   * @param {function} fn 回调函数
   */
  registerRecvMsgEvent({ eventName, type, fn }) {
    const obj = this.recvMsgEvents?.[type] || (this.recvMsgEvents[type] = {})

    if (eventName in obj) {
      throw new Error(`注册接收${type}消息事件: ${eventName} 已经被注册`)
    } else {
      obj[eventName] = fn
    }
  }

  /**
   * 处理接收到的消息
   */
  handleRecvMsg() {
    const that = this
    this.wechatWebSocket.addEventListener('message', async function handleRecvMsg(d) {
      const data = JSON.parse(d.data)
      let eventName

      switch (data.type) {
        case CODES.RECV_TXT_MSG:
          eventName = data.content.split(' ')[0]
          that.recvMsgEvents?.text?.[eventName]?.(data)
          break
        case CODES.RECV_PIC_MSG:
          console.log(data)
          break
        default:
          break
      }
    })
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
   * 通过匹配目标字段发送消息（最好是通过微信号发送，因为微信号是唯一的）
   * @param {string} targetKey 目标key（可以是personList属性中任一） eg:name-微信名称 remarks-备注名称 wxcode-微信号
   * @param {string} targetValue 对应目标key的值
   */
  async sendByTarget({ targetKey, targetValue, ...options }) {
    // 先从缓存里找
    let targetWxid = this._personCache?.[targetKey]?.[targetValue]

    // 缓存里没有找到就实时请求寻找，找到了缓存起来方便下次查找
    if (!targetWxid) {
      const { content: list } = await this.getPersonList()
      const target = list.find(item => item[targetKey] === targetValue)
      if (target) {
        targetWxid = target.wxid

        if (Object.prototype.toString.call(this._personCache[targetKey]) === '[object Object]') {
          this._personCache[targetKey][targetValue] = targetWxid
        } else {
          this._personCache[targetKey] = {
            [targetValue]: targetWxid
          }
        }
      } else {
        return Promise.reject(new Error('没有找到对应人或群'))
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
      resolve()
      // 实例完成 当前这个机器人有初始化函数就执行
      wechatBotItem.init && wechatBotItem.init()
    })

    wechatBotItem.ws.on('error', async e => {
      console.error(`${dayjs().format('YYYY-MM-DD HH:mm:ss')} 微信机器人【${wechatBotItem.name}】webSocket出错`, e)

      wechatBotItem.wechatBot = null

      // 重新创建机器人实例
      await webSocketReconnect(wechatBotItem)
      resolve()
    })

    wechatBotItem.ws.on('close', async() => {
      console.log(`${dayjs().format('YYYY-MM-DD HH:mm:ss')} 微信机器人【${wechatBotItem.name}】webSocket断开`)

      wechatBotItem.wechatBot = null

      // 重新创建机器人实例
      await webSocketReconnect(wechatBotItem)
      resolve()
    })
  })
}

/**
 * 重新初始化微信机器人
 * @param {object} wechatBotItem 微信机器人配置item
 */
const webSocketReconnect = (wechatBotItem) => {
  return new Promise((resolve, reject) => {
    if (wechatBotItem._reconnectTimer) {
      clearTimeout(wechatBotItem._reconnectTimer)
      wechatBotItem._reconnectTimer = null
    }
    // 使用定时器控制请求频率，避免请求过多 失败会再次调用重新初始化方法，直到连接成功
    wechatBotItem._reconnectTimer = setTimeout(async() => {
      console.log(`${dayjs().format('YYYY-MM-DD HH:mm:ss')} 正在尝试重连微信机器人【${wechatBotItem.name}】webSocket...`)

      // 创建成功就把定时器变量置空释放内存
      await createWeChatInstance(wechatBotItem)
      wechatBotItem._reconnectTimer = null
      resolve()
    }, 4000)
  })
}

/**
 * proxy 劫持 wechatBots，方便 wechatBots.熊小三.send() 直接访问机器人实例方法，而不是 wechatBots.熊小三.wechatBot.send()
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
        if (!wechatBot) {
          throw new Error(`【${target.name}】机器人下线或没有实例化，请联系管理员检查该机器人`)
        }
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
  熊小三: {
    name: '熊小三',
    wsUrl: 'ws://192.168.50.16:5555',
    ws: null, // 微信机器人webSocket实例
    wechatBot: null, // 微信机器人实例
    // 微信机器人实例创建完成后需要执行多个任务
    init() {
      const { wechatBot } = this
      wechatBot.handleRecvMsg()

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
            targetKey: 'remarks',
            targetValue: '熊猫阁基友群',
            content: '基友们，2点40啦，该抛就抛，该抄就抄'
          })
        })
        .task({
          name: '指令控制软路由',
          handle: wechatBot => openwrt({ wechatBot })
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
  }))

  proxyWechatBots(wechatBots)

  return wechatBots
}

export {
  wechatBotInit,
  wechatBots,
  CODES
}
