/** Мелкие помощники для сборки HTML строками. Никаких зависимостей. */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/** Экранирует текст для вставки в HTML. Всё, что приходит из контента, проходит через неё. */
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c])

/** Экранирует строку для вставки в JS-литерал внутри <script>. */
export const escJs = (value) => JSON.stringify(String(value ?? '')).slice(1, -1)

/**
 * `t('Открыто до {time}', { time: '22:00' })` → `Открыто до 22:00`.
 * Значения экранируются, шаблон — нет (он наш).
 */
export function fill(template, values = {}) {
  return String(template ?? '').replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? esc(values[key]) : match,
  )
}

/** Собирает список атрибутов, пропуская пустые. `attrs({href:'/x', rel:null})` → ` href="/x"`. */
export function attrs(map) {
  return Object.entries(map)
    .filter(([, v]) => v !== null && v !== undefined && v !== false && v !== '')
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`))
    .join('')
}

/** Убирает пустые куски, чтобы можно было писать `${condition && block}`. */
export const join = (...parts) => parts.filter(Boolean).join('')

/** Схлопывает лишние пробелы между тегами — минус пара килобайт на страницу. */
export function minify(html) {
  return html
    .replace(/\n\s*\n/g, '\n')
    .replace(/>\s+</g, (m) => (m.includes('\n') ? '><' : m))
    .trim()
}

/** Форматирует цену в рупиях: 119000 → "119.000 IDR". */
export function idr(amount) {
  return `${Number(amount).toLocaleString('id-ID')} IDR`
}

/** Ссылка на WhatsApp с готовым текстом. */
export function waLink(number, text = '') {
  const digits = String(number ?? '').replace(/\D/g, '')
  if (!digits) return null
  const query = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${digits}${query}`
}
