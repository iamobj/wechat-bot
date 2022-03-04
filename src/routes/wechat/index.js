export default async(fastify, opts) => {
  const { wechatBots, sequelize } = fastify

  fastify.get('/', async(req, reply) => {
    const res = await wechatBots.熊小三.getPersonList()
    // await wechatBots.熊小三.sendByTarget({
    //   targetKey: 'wxcode',
    //   targetValue: 'xh-boss',
    //   content: '消息内容'
    // })
    return res
  })

  fastify.post('/sendMsg', async(req, reply) => {
    const { authCode, wechatBotName = '熊小三', content, targetKey, targetValue } = req.body
    const user = await sequelize.user.findOne({
      where: { authCode }
    })
    if (!user) {
      reply.send({
        statusCode: 1,
        message: '用户不存在'
      })
      return
    }

    const _targetKey = 'wxid'
    const _targetValue = user.wxId

    // 暂时只支持对自己发送消息，后续可以考虑开发支持群发消息、指定接受者，但需要注意权限，不能每个人都能群发和指定接受者
    // let _targetKey = targetKey
    // let _targetValue = targetValue
    // if (!targetKey) {
    //   _targetKey = 'wxid'
    //   _targetValue = user.wxId
    // }

    await wechatBots[wechatBotName].sendByTarget({
      targetKey: _targetKey,
      targetValue: _targetValue,
      content
    })

    reply.send({
      statusCode: 0,
      message: 'success'
    })
  })
}
