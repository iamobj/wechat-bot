import fp from 'fastify-plugin'
import fastifySensible from '@fastify/sensible'

export default fp(async (fastify, opts) => {
  fastify.register(fastifySensible, {
    errorHandler: false,
  })
})
