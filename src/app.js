import path from 'path'
import AutoLoad from 'fastify-autoload'
const __dirname = path.resolve('src')

export default async(fastify, opts) => {
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    maxDepth: 1, // 限制嵌套插件加载的深度，不然会递归所有文件夹
    options: Object.assign({}, opts)
  })

  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: Object.assign({}, opts)
  })
}
