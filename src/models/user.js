import { Sequelize } from 'sequelize'
import { BaseModel } from './helper/baseModel.js'

class User extends BaseModel {}

export default function(sequelize) {
  User.init({
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '名称'
    },
    mobilePhone: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      comment: '手机号'
    },
    password: {
      type: Sequelize.STRING,
      comment: '密码'
    },
    wxCode: {
      type: Sequelize.STRING,
      comment: '微信号'
    },
    wxId: {
      type: Sequelize.STRING,
      unique: true,
      comment: '微信id'
    },
    wxName: {
      type: Sequelize.STRING,
      comment: '微信名'
    },
    isDisable: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: '是否禁用'
    },
    authCode: {
      type: Sequelize.STRING,
      unique: true,
      comment: '授权码'
    },
    expirationDate: {
      type: Sequelize.DATE,
      comment: '过期时间'
    },
    remark: {
      type: Sequelize.STRING,
      comment: '备注'
    }
  }, {
    sequelize,
    modelName: 'user'
  })

  return User
}
