import path from 'path'
import AutoLoad from 'fastify-autoload'
import { wechatBotInit, wechatBots } from './wechat/index.js'
const __dirname = path.resolve('src')

export default async(fastify, opts) => {
  // 先初始化微信机器人
  wechatBotInit().then(() => {
    if (process.env.NODE_ENV !== 'development') {
      // 机器人初始化成功且不是开发环境就让熊小二机器人通知服务启动成功
      wechatBots.熊小二.sendByName({
        remarkName: '主人',
        content: `【${process.env.NODE_ENV}】微信机器人服务启动成功`
      })
    }
  })

  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: Object.assign({}, opts)
  })

  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: Object.assign({}, opts)
  })
}
