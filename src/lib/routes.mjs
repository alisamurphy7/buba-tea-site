/**
 * Адреса страниц. Английский живёт в корне (основной язык рекламы),
 * остальные — под префиксом: /ru/menu/, /id/menu/.
 */

export const DEFAULT_LANG = 'en'

/** Все языки, для которых есть файлы переводов. */
export const ALL_LANGS = ['en', 'ru', 'id']

/**
 * Какие языки реально собираются — задаётся в business.json → site.languages.
 * Английский подмешивается всегда: он живёт в корне и на него ведут
 * canonical и x-default.
 */
export function activeLangs(business) {
  const requested = business?.site?.languages
  if (!Array.isArray(requested) || !requested.length) return [DEFAULT_LANG]
  const known = requested.filter((lang) => ALL_LANGS.includes(lang))
  return known.includes(DEFAULT_LANG) ? known : [DEFAULT_LANG, ...known]
}

/** Ключ страницы → сегмент URL. Пустая строка = главная. */
export const PAGES = {
  home: '',
  menu: 'menu',
  delivery: 'delivery',
  catering: 'catering',
  visit: 'visit',
  privacy: 'privacy',
  terms: 'terms',
}

/** Что показываем в шапке и в каком порядке. */
export const NAV_PAGES = ['menu', 'delivery', 'catering', 'visit']

/** `url('ru', 'menu')` → `/ru/menu/` */
export function url(lang, page = 'home') {
  const segment = PAGES[page]
  if (segment === undefined) throw new Error(`Неизвестная страница: ${page}`)
  const prefix = lang === DEFAULT_LANG ? '' : `/${lang}`
  return segment ? `${prefix}/${segment}/` : `${prefix}/`
}

/** Путь файла в dist: `/ru/menu/` → `ru/menu/index.html`, `/` → `index.html`. */
export function outputPath(lang, page) {
  const dir = url(lang, page).replace(/^\/|\/$/g, '')
  return dir ? `${dir}/index.html` : 'index.html'
}

/** Абсолютный адрес для canonical / og / sitemap. */
export function absolute(origin, lang, page) {
  return `${origin.replace(/\/$/, '')}${url(lang, page)}`
}
