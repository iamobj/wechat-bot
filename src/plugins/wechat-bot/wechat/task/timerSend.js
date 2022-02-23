// 定时器，定时推送消息
import schedule from 'node-schedule'

const timerSend = ({ wechatBot, CODES, targetKey, targetValue, content, timeRule }) => {
  schedule.scheduleJob(timeRule, () => {
    wechatBot.sendByTarget({
      targetKey: targetKey,
      targetValue: targetValue,
      content
    })
  })
}

export default timerSend

/**
 * 基友群基金操作定时推送，每周一到周五14点40分提醒操作基金
 */
export const JiYouGroupPush = wechatBot => {
  const contentPool = [
    '[imgMsg]C:\\Users\\iamc\\Desktop\\wechat-bot-imgs\\2.jpg',
    '2点40啦，请各位老板系好安全带，准备起飞！！！！',
    '2点40啦，祝各位老板起飞！！！！',
    '2点40啦，老板们起飞了别忘记打赏我哦'
  ]

  timerSend({
    wechatBot,
    timeRule: {
      dayOfWeek: [new schedule.Range(1, 5)],
      hour: 14,
      minute: 40
    },
    targetKey: 'remarks',
    targetValue: '熊猫阁基友群',
    content: contentPool[Math.floor(Math.random() * contentPool.length)]
  })
}
