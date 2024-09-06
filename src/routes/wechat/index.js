export default async (fastify, opts) => {
  const { wechatBots, wxhelper, sequelize } = fastify

  // fastify.get('/', async (req, reply) => {
  //   const res = await wechatBots.熊小三.getPersonList()
  //   // await wechatBots.熊小三.sendByTarget({
  //   //   targetKey: 'wxcode',
  //   //   targetValue: 'xh-boss',
  //   //   content: '消息内容'
  //   // })
  //   return res
  // })

  fastify.post('/sendMsg', async (req, reply) => {
    const { authCode, content, toWxIds, atMsg } = req.body
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

    if (atMsg) {
      if (user.wxId !== 'wxid_d52rxumg20z022') {
        reply.send({
          statusCode: 1,
          message: '无权限发送at消息',
        })
        return
      }

      await wxhelper.sendAtMsg({
        wxids: atMsg.wxIds.join(','),
        chatRoomId: atMsg.chatRoomId,
        msg: atMsg.content,
      })

      reply.send({
        statusCode: 0,
        message: 'success',
      })
      return
    }

    let _toWxid = user.wxId
    if (user.wxId === 'wxid_d52rxumg20z022' && toWxIds) {
      // 只允许自己指定发送对象
      _toWxid = toWxIds
    }

    if (Array.isArray(_toWxid)) {
      // 不用 promise.all ，一个一个的发避免被风控
      for (const _wxid of _toWxid) {
        await wxhelper.sendTextMsg({
          wxid: _wxid,
          msg: content,
        })
      }
    }
    else {
      await wxhelper.sendTextMsg({
        wxid: _toWxid,
        msg: content,
      })
    }

    reply.send({
      statusCode: 0,
      message: 'success',
    })
  })
}
