/**
 * 判断路径是不是图片
 */
export const pathIsImg = path => {
  const reg = /\.(jpg|jpeg|png|gif|bmp|webp)$/i
  return reg.test(path)
}
