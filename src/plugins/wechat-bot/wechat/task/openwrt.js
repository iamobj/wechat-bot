// 指令控制软路由
import { db } from '#src/models/index.js'
import { openSsh } from '#src/utils/ssh.js'

let wechatBotIns
let sshIns
let wxData // 微信接收到的数据
const defaults = {
  eventName: 'op'
}

// 端口转发开关 TODO:有时间用类重写
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
      content: `${type} ${port} 成功`
    })
  } catch (e) {
    wechatBotIns.sendByTarget({
      targetKey: 'wxid',
      targetValue: wxData.wxid,
      content: `${type} ${port} 失败`
    })
    return Promise.reject(e)
  }

  async function off(port) {
    const targetIndex = await getTargetIndex(port)
    const { stdout, stderr } = await sshIns.execCommand(`
    uci set firewall.@redirect[${targetIndex}].enabled=='0'
    uci commit firewall
    /etc/init.d/firewall restart`)
    if (typeof stdout === 'string') {
      return stdout
    }
    return Promise.reject(stderr)
  }

  async function on(port) {
    const targetIndex = await getTargetIndex(port)
    const { stdout, stderr } = await sshIns.execCommand(`
    uci delete firewall.@redirect[${targetIndex}].enabled
    uci commit firewall
    /etc/init.d/firewall restart`)
    if (typeof stdout === 'string') {
      return stdout
    }
    return Promise.reject(stderr)
  }

  async function getTargetIndex(port) {
    const { stdout, stderr } = await sshIns.execCommand('uci show firewall')
    if (stderr) {
      return Promise.reject(stderr)
    }

    const result = stdout.substring(stdout.indexOf('firewall.@redirect[') + 1, stdout.indexOf(`].src_dport='${port}'`))

    return result.charAt(result.length - 1)
  }
}

const fnMap = {
  dkzf: portForwardSwitch
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

  sshIns.execCommand('exit')
}

export default ({ wechatBot }) => {
  wechatBotIns = wechatBot
  wechatBot.registerRecvMsgEvent({
    eventName: defaults.eventName,
    type: 'text',
    fn: handleOpenwrt
  })
}
