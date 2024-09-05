export default async (fastify, opts) => {
  fastify.get('/', async (req, reply) => {
    return ''
  })

  fastify.post('/', async (req, reply) => {
    // const { user } = fastify.sequelize
    // const result = await user.create(req.body)
    // return result
  })
}
