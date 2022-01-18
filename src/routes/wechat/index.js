export default async(fastify, opts) => {
  const { wechatBots } = fastify

  fastify.get('/', async(req, reply) => {
    const res = await wechatBots.熊小三.getPersonList()
    // await wechatBots.熊小三.sendByTarget({
    //   targetKey: 'wxcode',
    //   targetValue: 'xh-boss',
    //   content: '消息内容'
    // })
    return res
  })
}
