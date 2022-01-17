import { Model, Sequelize } from 'sequelize'

class BaseModel extends Model {
  constructor(...args) {
    super(...args)
    this.model = this.constructor
  }

  static init(attributes, options) {
    const attrs = {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ...attributes
    }

    const ops = {
      paranoid: true, // 软删除
      ...options
    }
    const model = super.init(attrs, ops)
    return model
  }
}

export { BaseModel }
