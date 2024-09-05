/**
 * 判断路径是不是图片
 */
export function pathIsImg(path) {
  const reg = /\.(?:jpg|jpeg|png|gif|bmp|webp)$/i
  return reg.test(path)
}
