/* eslint-disable unicorn/consistent-function-scoping */
// 指令控制软路由 TODO:有时间用类重写 op 类
import { db } from '#src/models/index.js'
import { openSsh } from '#src/utils/ssh.js'

let wechatBotIns
let sshIns
let wxData // 微信接收到的数据
const defaults = {
  eventName: 'op',
}

/**
 * 获取端口转发所有规则
 * @param {boolean} isSort 是否开启排序 端口状态为on的排前面
 * @returns 返回规则列表
 */
async function getPortForwardList(isSort = true) {
  const { stdout, stderr } = await sshIns.execCommand('ubus call uci get \'{"config": "firewall", "type": "redirect"}\'')
  if (stderr) {
    return Promise.reject(stderr)
  }

  const { values: obj } = JSON.parse(stdout)
  if (isSort) {
    return Object.values(obj).sort((v1, v2) => {
      if (v1.enabled === '0') {
        return 1
      }
      if (v2.enabled === '0') {
        return -1
      }
      return 0
    })
  }
  return Object.values(obj)
}

// 端口转发开关
async function portForwardSwitch(type, port) {
  const forwardTypeMap = {
    on,
    off,
  }

  try {
    await forwardTypeMap?.[type]?.(port)
    await wechatBotIns.sendByTarget({
      targetKey: 'wxid',
      targetValue: wxData.wxid,
      content: `${type} ${port} success`,
    })

    portForwardList()
  }
  catch (e) {
    await wechatBotIns.sendByTarget({
      targetKey: 'wxid',
      targetValue: wxData.wxid,
      content: `${type} ${port} fail`,
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
    }
    catch (e) {
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

    await wechatBotIns.sendByTarget({
      targetKey: 'wxid',
      targetValue: wxData.wxid,
      content,
    })
  }
  catch (e) {
    await wechatBotIns.sendByTarget({
      targetKey: 'wxid',
      targetValue: wxData.wxid,
      content: 'get port forward list fail',
    })
    return Promise.reject(e)
  }
}

// 重启路由
async function restartRouter() {
  try {
    await sshIns.execCommand('reboot')
    await wechatBotIns.sendByTarget({
      targetKey: 'wxid',
      targetValue: wxData.wxid,
      content: 'reboot success',
    })
  }
  catch (e) {
    await wechatBotIns.sendByTarget({
      targetKey: 'wxid',
      targetValue: wxData.wxid,
      content: 'reboot fail',
    })
    return Promise.reject(e)
  }
}

// 获取公网ip
async function getPublicIp() {
  try {
    const { stdout, stderr } = await sshIns.execCommand('curl -s https://ip.3322.net/')
    if (stderr) {
      return Promise.reject(stderr)
    }
    await wechatBotIns.sendByTarget({
      targetKey: 'wxid',
      targetValue: wxData.wxid,
      content: stdout,
    })
  }
  catch (e) {
    await wechatBotIns.sendByTarget({
      targetKey: 'wxid',
      targetValue: wxData.wxid,
      content: 'get public ip fail',
    })
    return Promise.reject(e)
  }
}

// 指令映射方法
const fnMap = {
  dkzf: portForwardSwitch,
  dkzfls: portForwardList,
  reboot: restartRouter,
  ip: getPublicIp,
}

async function handleOpenwrt(data) {
  wxData = data
  const { pc } = db
  const pcData = await pc.findByPk(1)

  if (!pcData.authWxids.includes(data.wxid)) {
    await wechatBotIns.sendByTarget({
      targetKey: 'wxid',
      targetValue: data.wxid,
      content: '你没有权限使用该功能',
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
    fn: handleOpenwrt,
  })
}
