import fp from 'fastify-plugin'
import Sequelize from 'sequelize'
import { configDefaults } from './config/index.js'
import modelsInit from '#src/models/index.js'

const defaults = {
  pluginName: 'sequelize',
  instance: 'sequelize',
}

async function sequelizePlugin(fastify, opts, done) {
  const { configs } = fastify
  const sequelize = new Sequelize({
    dialect: 'postgres',
    database: configs.db.DATABASE_NAME,
    username: configs.db.DATABASE_USER_NAME,
    password: configs.db.DATABASE_USER_PASSWORD,
    host: configs.db.DATABASE_HOST,
    port: configs.db.DATABASE_PORT,
  })

  try {
    await sequelize.authenticate()
    const db = await modelsInit(sequelize)
    await sequelize.sync()
    fastify.decorate(defaults.instance, db)
  }
  catch (e) {
    console.error('数据库连接失败', e)
  }

  fastify.addHook(
    'onClose',
    (instance, done) => sequelize.close().then(() => done()),
  )

  done()
}

export default fp(sequelizePlugin, {
  name: defaults.pluginName,
  dependencies: [configDefaults.pluginName],
})

export const sequelizeDefaults = defaults
