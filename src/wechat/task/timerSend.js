// 定时器，定时推送消息
import schedule from 'node-schedule'

export default ({ wechatBot, CODES, wechatName, wechatRemarkName, content, timeRule }) => {
  schedule.scheduleJob(timeRule, () => {
    wechatBot.sendByName({
      name: wechatName,
      remarkName: wechatRemarkName,
      content
    })
  })
}
