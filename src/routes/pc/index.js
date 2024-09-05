export default async (fastify, opts) => {
  fastify.get('/', async (req, reply) => {
    return ''
  })

  fastify.post('/', async (req, reply) => {
    // const { pc } = fastify.sequelize
    // const { type, name, host, port, authWxids, account, password, sshKey, remark } = req.body
    // const result = await pc.create({ type, name, host, port, authWxids, account, password, sshKey, remark })
    // return result
  })
}
