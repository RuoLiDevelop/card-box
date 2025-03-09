// 使用更短的字符集，去掉容易混淆的字符
const urlAlphabet = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

/**
 * 生成指定长度的随机ID
 * @param length ID长度，默认8位
 * @returns 随机ID
 */
function nanoid(length = 8) {
  let id = ''
  const step = urlAlphabet.length

  // 使用时间戳作为额外的随机源
  const now = Date.now()

  for (let i = 0; i < length; i++) {
    // 混合多个随机源：
    // 1. Math.random() 提供基础随机性
    // 2. 时间戳的不同位提供额外随机性
    const timeFragment = (now >> (i * 4)) & 0xf
    const random = Math.floor(Math.random() * step * (1 + timeFragment / 16))
    id += urlAlphabet.charAt(random % step)
  }

  return id
}

export default nanoid
