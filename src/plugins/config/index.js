import fp from 'fastify-plugin'

const defaults = {
  pluginName: 'configs',
  instance: 'configs'
}

async function configPlugin(fastify, opts, done) {
  const { default: config } = await import(`./configs/${process.env.NODE_ENV}.js`)

  fastify.decorate(defaults.instance, config)
  done()
}

export default fp(configPlugin, {
  name: defaults.pluginName
})

export const configDefaults = defaults
