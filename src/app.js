import path from 'path'
import AutoLoad from 'fastify-autoload'
import { wechatBotInit, wechatBots } from './wechat/index.js'
const __dirname = path.resolve('src')

export default async(fastify, opts) => {
  // 先初始化微信机器人
  await wechatBotInit()

  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: Object.assign({}, opts)
  })

  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: Object.assign({}, opts)
  })

  if (process.env.NODE_ENV !== 'development') {
    wechatBots.熊小二.sendByName({
      remarkName: '主人',
      content: `【${process.env.NODE_ENV}】微信机器人服务启动成功`
    })
  }
}
