import axios from 'axios'

export class Wxhelper {
  constructor(baseUrl) {
    this.fetch = this.#createAxiosInstance(baseUrl)
  }

  async checkLogin() {
    const { data } = await this.fetch.post('/checkLogin')
    return data.code === 1
  }

  async sendTextMsg({ wxid, msg }) {
    const { data } = await this.fetch.post('/sendTextMsg', {
      wxid,
      msg,
    })
    return data
  }

  /**
   * 发送 AT 消息
   * @param {object} param0
   * @param {string[]} param0.wxids 多个用,隔开
   * @param {string} param0.chatRoomId 群id
   * @param {string} param0.msg
   * @returns
   */
  async sendAtMsg({ wxids, chatRoomId, msg }) {
    const { data } = await this.fetch.post('/sendAtText', {
      wxids,
      chatRoomId,
      msg,
    })
    return data
  }

  #createAxiosInstance(baseUrl) {
    const instance = axios.create({
      baseURL: baseUrl,
    })

    return instance
  }
}
