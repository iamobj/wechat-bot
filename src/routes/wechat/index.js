import { wechatBots } from '../../wechat/index.js'

export default async(fastify, opts) => {
  fastify.get('/', async(req, reply) => {
    const res = await wechatBots.熊小三.getPersonList()
    // await wechatBots.熊小三.sendByName({
    //   remarkName: '主人',
    //   content: '消息内容'
    // })
    return res
  })
}
