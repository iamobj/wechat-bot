import { Sequelize } from 'sequelize'
import { BaseModel } from './helper/baseModel.js'

class Pc extends BaseModel {}

export default function(sequelize) {
  Pc.init({
    type: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '类型：sshAccount-通过ssh账号登录，sshKey-通过ssh密钥登录'
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '名称'
    },
    account: {
      type: Sequelize.STRING,
      comment: '账号'
    },
    password: {
      type: Sequelize.STRING,
      comment: '密码'
    },
    sshKey: {
      type: Sequelize.STRING,
      comment: 'ssh密钥'
    },
    remark: {
      type: Sequelize.STRING,
      comment: '备注'
    }
  }, {
    sequelize,
    modelName: 'pc'
  })

  return Pc
}
