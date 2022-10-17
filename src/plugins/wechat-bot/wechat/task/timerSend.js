// 定时器，定时推送消息
import schedule from 'node-schedule'
import axios from 'axios'

const timerSend = ({ wechatBot, onBeforeSend, CODES, targetKey, targetValue, content, timeRule }) => {
  schedule.scheduleJob(timeRule, async() => {
    if (onBeforeSend) {
      const flag = await onBeforeSend()
      // 如果返回false，则不发送
      if (!flag) return
    }
    const _content = typeof content === 'function' ? content() : content

    wechatBot.sendByTarget({
      targetKey: targetKey,
      targetValue: targetValue,
      content: _content
    })
  })
}

export default timerSend

/**
 * 基友群基金操作定时推送，每周一到周五14点40分提醒操作基金
 */
export const JiYouGroupPush = wechatBot => {
  const contentFn = () => {
    const contentPool = [
      '[imgMsg]C:\\Users\\iamc\\Desktop\\wechat-bot-imgs\\2.jpg',
      '2点40啦，请各位老板系好安全带，准备起飞！！！！',
      '2点40啦，祝各位老板起飞！！！！',
      '2点40啦，老板们起飞了别忘记打赏我哦'
    ]
    return contentPool[Math.floor(Math.random() * contentPool.length)]
  }

  timerSend({
    wechatBot,
    onBeforeSend: async() => {
      // 判断是否是工作日，避免节假日推送
      const { data } = await axios.get('https://timor.tech/api/holiday/info', {
        params: {
          t: new Date(new Date().toLocaleDateString()).getTime()
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36'
        }
      })
      if (data?.type?.type === 0) {
        return true
      }
      return false
    },
    timeRule: {
      dayOfWeek: [new schedule.Range(1, 5)],
      hour: 14,
      minute: 40
    },
    targetKey: 'remarks',
    targetValue: '熊猫阁基友群',
    content: contentFn
  })
}
