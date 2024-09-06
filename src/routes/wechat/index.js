export default async (fastify, opts) => {
  const { wechatBots, sequelize } = fastify

  fastify.get('/', async (req, reply) => {
    // const res = await wechatBots.熊小三.getPersonList()
    // await wechatBots.熊小三.sendByTarget({
    //   targetKey: 'wxcode',
    //   targetValue: 'xh-boss',
    //   content: '消息内容'
    // })
    // return res
    return 'ok'
  })

  fastify.post('/sendMsg', async (req, reply) => {
    const { authCode, wechatBotName = '熊小三', content, targetKey, toWxId } = req.body
    const user = await sequelize.user.findOne({
      where: { authCode },
    })
    if (!user) {
      reply.send({
        statusCode: 1,
        message: '无效的authCode',
      })
      return
    }

    if (user.isDisable) {
      reply.send({
        statusCode: 1,
        message: 'authCode已被禁用',
      })
      return
    }

    if (user.expirationDate && new Date() > user.expirationDate) {
      reply.send({
        statusCode: 1,
        message: 'authCode已过期',
      })
      return
    }

    let _targetValue = user.wxId
    if (user.wxId === 'wxid_d52rxumg20z022' && toWxId) {
      _targetValue = toWxId
    }

    // 暂时只支持对自己发送消息，后续可以考虑开发支持群发消息、指定接受者，但需要注意权限，不能每个人都能群发和指定接受者
    // let _targetKey = targetKey
    // let _targetValue = targetValue
    // if (!targetKey) {
    //   _targetKey = 'wxid'
    //   _targetValue = user.wxId
    // }

    await wechatBots[wechatBotName].sendByTarget({
      targetKey: 'wxid',
      targetValue: _targetValue,
      content,
    })

    reply.send({
      statusCode: 0,
      message: 'success',
    })
  })
}
