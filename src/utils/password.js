// 密码强度校验 —— 必须与后端 (POST /v1/user/register 和 /v1/user/password) 规则保持一致。
// 规则: 长度 8~64; 仅允许 字母/数字/安全符号 !@#$%^&*()-_=+[]{};:,.? (其它字符拒绝);
//       大写/小写/数字/符号 四类至少含 3 类。
//
// van-field rule 用法: 返回 true=通过, 返回字符串=错误提示。

const PWD_SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?'
const ALLOWED_RE = /^[A-Za-z0-9!@#$%^&*()\-_=+\[\]{};:,.?]+$/

export function validatePasswordStrength(v) {
  if (!v || v.length < 8) return '密码至少 8 位'
  if (v.length > 64) return '密码不超过 64 位'
  if (!ALLOWED_RE.test(v)) return '密码仅允许字母/数字及 ' + PWD_SYMBOLS
  const cats = [/[A-Z]/, /[a-z]/, /[0-9]/, /[!@#$%^&*()\-_=+\[\]{};:,.?]/].filter(r => r.test(v)).length
  if (cats < 3) return '密码需包含大写/小写/数字/符号中至少 3 类'
  return true
}
