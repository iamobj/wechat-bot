// 指令控制软路由 TODO:有时间用类重写 op 类
import { db } from '#src/models/index.js'
import { openSsh } from '#src/utils/ssh.js'

let wechatBotIns
let sshIns
let wxData // 微信接收到的数据
const defaults = {
  eventName: 'op'
}

/**
 * 获取端口转发所有规则
 * @returns 返回规则列表
 */
async function getPortForwardList() {
  const { stdout, stderr } = await sshIns.execCommand('ubus call uci get \'{"config": "firewall", "type": "redirect"}\'')
  if (stderr) {
    return Promise.reject(stderr)
  }

  const { values: obj } = JSON.parse(stdout)
  return Object.values(obj)
}

// 端口转发开关
async function portForwardSwitch(type, port) {
  const forwardTypeMap = {
    on: on,
    off: off
  }

  try {
    await forwardTypeMap?.[type]?.(port)
    wechatBotIns.sendByTarget({
      targetKey: 'wxid',
      targetValue: wxData.wxid,
      content: `${type} ${port} success`
    })

    portForwardList()
  } catch (e) {
    wechatBotIns.sendByTarget({
      targetKey: 'wxid',
      targetValue: wxData.wxid,
      content: `${type} ${port} fail`
    })

    portForwardList()
    return Promise.reject(e)
  }

  async function off(port) {
    const target = await getTarget(port)
    const { stdout, stderr } = await sshIns.execCommand(`
      ubus call uci set '{"config": "firewall", "section": "${target['.name']}", "values": {"enabled": "0"}}'
      ubus call uci commit '{"config": "firewall"}'
      /etc/init.d/firewall restart`)

    if (typeof stdout === 'string') {
      return stdout
    }
    return Promise.reject(stderr)
  }

  async function on(port) {
    const target = await getTarget(port)
    const { stdout, stderr } = await sshIns.execCommand(`
      ubus call uci delete '{"config": "firewall", "section": "${target['.name']}", "option": "enabled"}'
      ubus call uci commit '{"config": "firewall"}'
      /etc/init.d/firewall restart`)

    if (typeof stdout === 'string') {
      return stdout
    }
    return Promise.reject(stderr)
  }

  // 根据端口获取目标端口防火墙转发规则配置
  async function getTarget(port) {
    try {
      const list = await getPortForwardList()

      const target = list.find(item => item.src_dport === port)
      return target
    } catch (e) {
      return Promise.reject(e)
    }
  }
}

// 查看端口转发规则列表
async function portForwardList() {
  try {
    const list = await getPortForwardList()
    const content = list.reduce((acc, item) => {
      acc += `
        ${item.name}--${item.src_dport}--${item.enabled ? 'off' : 'on'}
      `
      return acc
    }, '')

    wechatBotIns.sendByTarget({
      targetKey: 'wxid',
      targetValue: wxData.wxid,
      content
    })
  } catch (e) {
    wechatBotIns.sendByTarget({
      targetKey: 'wxid',
      targetValue: wxData.wxid,
      content: 'get port forward list fail'
    })
    return Promise.reject(e)
  }
}

// 重启路由
async function restartRouter() {
  try {
    await sshIns.execCommand('reboot')
    wechatBotIns.sendByTarget({
      targetKey: 'wxid',
      targetValue: wxData.wxid,
      content: 'reboot success'
    })
  } catch (e) {
    wechatBotIns.sendByTarget({
      targetKey: 'wxid',
      targetValue: wxData.wxid,
      content: 'reboot fail'
    })
    return Promise.reject(e)
  }
}

// 指令映射方法
const fnMap = {
  dkzf: portForwardSwitch,
  dkzfls: portForwardList,
  reboot: restartRouter
}

async function handleOpenwrt(data) {
  wxData = data
  const { pc } = db
  const pcData = await pc.findByPk(1)

  if (!pcData.authWxids.includes(data.wxid)) {
    wechatBotIns.sendByTarget({
      targetKey: 'wxid',
      targetValue: data.wxid,
      content: '你没有权限使用该功能'
    })
    return
  }

  sshIns = await openSsh(pcData)

  const [eventName, fnName, ...params] = data.content.split(' ')
  await fnMap[fnName]?.(...params)

  const noExitInstructions = ['reboot'] // 不需要退出的指令
  if (!noExitInstructions.includes(fnName)) {
    sshIns.execCommand('exit')
  }
}

export default ({ wechatBot }) => {
  wechatBotIns = wechatBot
  wechatBot.registerRecvMsgEvent({
    eventName: defaults.eventName,
    type: 'text',
    fn: handleOpenwrt
  })
}
