import { basename, dirname, join } from 'path'
import { readdirSync } from 'fs'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const _basename = basename(__filename)
const excludeFiles = [_basename]

export default async function(sequelize) {
  const db = {}
  const files = readdirSync(__dirname)
    .filter(file => {
      return ((!excludeFiles.includes(file)) && (file.endsWith('.js')))
    })

  for (const file of files) {
    const { default: model } = await import(join(__dirname, file))
    const modelName = file.replace('.js', '')
    db[modelName] = model(sequelize)
  }

  return db
}
