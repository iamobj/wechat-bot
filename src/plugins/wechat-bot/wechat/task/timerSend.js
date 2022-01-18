// 定时器，定时推送消息
import schedule from 'node-schedule'

export default ({ wechatBot, CODES, targetKey, targetValue, content, timeRule }) => {
  schedule.scheduleJob(timeRule, () => {
    wechatBot.sendByTarget({
      targetKey: targetKey,
      targetValue: targetValue,
      content
    })
  })
}
