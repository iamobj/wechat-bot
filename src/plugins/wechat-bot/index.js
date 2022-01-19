import fp from 'fastify-plugin'
import { wechatBotInit, wechatBots } from './wechat/index.js'
import { sequelizeDefaults } from '../sequelize.js'

const defaults = {
  pluginName: 'wechatBot',
  instance: 'wechatBots'
}

function wechatBotPlugin(fastify, opts, done) {
  wechatBotInit().then(wechatBots => {
    if (process.env.NODE_ENV !== 'development') {
      // 机器人初始化成功且不是开发环境就让熊小三机器人通知服务启动成功
      wechatBots.熊小三.sendByTarget({
        targetKey: 'wxcode',
        targetValue: 'xh-boss',
        content: `【${process.env.NODE_ENV}】微信机器人服务启动成功`
      })
    }
  })

  fastify.decorate(defaults.instance, wechatBots)

  done()
}

export default fp(wechatBotPlugin, {
  name: defaults.pluginName,
  dependencies: [sequelizeDefaults.pluginName]
})
