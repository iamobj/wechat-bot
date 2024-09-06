import fp from 'fastify-plugin'
import { Wxhelper } from './wxhelper.js'

const defaults = {
  pluginName: 'wxhelper',
  instance: 'wxhelper',
}

export default fp(async (fastify, opts, done) => {
  const wxhelperIns = new Wxhelper('http://192.168.50.115:29088/api')
  if (process.env.NODE_ENV !== 'development') {
    const isLogin = await wxhelperIns.checkLogin()
    if (isLogin) {
      await wxhelperIns.sendTextMsg({
        wxid: 'wxid_d52rxumg20z022',
        msg: `【${process.env.NODE_ENV}】微信机器人服务启动成功`,
      })
    }
  }

  fastify.decorate(defaults.instance, wxhelperIns)

  done()
}, {
  name: defaults.pluginName,
})
