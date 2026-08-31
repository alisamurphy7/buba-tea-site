/** Переиспользуемые куски разметки: кнопки, часы работы, карточки меню, FAQ. */

import { esc, attrs, join, idr, waLink, fill } from './html.mjs'
import { real, directionsUrl } from './layout.mjs'
import { url } from './routes.mjs'

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

/** Кнопка. `track` — имя конверсии, которую отправит app.js по клику. */
export function button({ href, label, variant = '', track, external, type }) {
  if (!href && !type) return ''
  const classes = ['btn', variant].filter(Boolean).join(' ')
  if (type === 'submit') {
    return `<button type="submit" class="${classes}"${attrs({ 'data-track': track })}>${esc(label)}</button>`
  }
  return `<a${attrs({
    class: classes,
    href,
    'data-track': track,
    target: external ? '_blank' : null,
    rel: external ? 'noopener' : null,
  })}>${esc(label)}</a>`
}

/**
 * Ряд главных действий: доставка, маршрут, WhatsApp — то, за что мы платим в рекламе.
 * Если ни одна ссылка ещё не заполнена, всё равно показываем кнопку на меню:
 * экран без действия — это оплаченный клик впустую.
 */
export function ctaRow({ t, business, lang, variant = '', primary = 'delivery' }) {
  const location = business.locations[0]
  const directions = directionsUrl(location)
  const gofood = real(business.delivery?.gofood)
  const grabfood = real(business.delivery?.grabfood)
  const wa = waLink(
    real(business.contacts.whatsapp),
    lang === 'ru' ? 'Здравствуйте! Хочу сделать заказ.' : 'Hi! I would like to order.',
  )
  const deliveryHref = gofood || grabfood

  // Пока ссылки на Google Maps нет, кнопка ведёт на страницу «как найти»:
  // там адрес, часы и та же кнопка маршрута. Тупика не получается.
  const directionsButton = (isPrimary) =>
    button({
      href: directions || url(lang, 'visit'),
      label: t.common.getDirections,
      variant: isPrimary ? '' : 'btn-ghost',
      track: directions ? 'directions' : null,
      external: Boolean(directions),
    })

  /**
   * Кнопка заказа. Когда сервисы доставки подключены, она открывает окно
   * выбора GoFood / GrabFood — сам выбор дальше и есть конверсия, поэтому
   * здесь событие не шлём, чтобы не считать один заказ дважды.
   * Ссылка ведёт на страницу доставки: это и запасной путь без JS.
   */
  const orderButton = (isPrimary) => {
    const hasDialog = Boolean(deliveryHref)
    const markup = button({
      href: url(lang, 'delivery'),
      label: t.common.orderOnline ?? t.common.orderDelivery,
      variant: isPrimary ? '' : 'btn-ghost',
      track: hasDialog ? null : 'delivery',
    })
    return hasDialog ? markup.replace('<a ', '<a data-order-open ') : markup
  }

  const buttons =
    primary === 'directions'
      ? [directionsButton(true), orderButton(false)]
      : [
          deliveryHref && orderButton(true),
          directions && directionsButton(!deliveryHref),
          !deliveryHref &&
            wa &&
            button({
              href: wa,
              label: t.common.whatsapp,
              variant: 'btn-ghost',
              track: 'whatsapp',
              external: true,
            }),
        ].filter(Boolean)

  if (!buttons.length) {
    buttons.push(button({ href: url(lang, 'menu'), label: t.common.seeMenu }))
  }

  return join(`<div class="cta-row ${variant}">`, ...buttons, `</div>`)
}

/** Таблица часов работы. Сегодняшний день подсвечивается скриптом на клиенте. */
export function hoursTable({ t, location }) {
  const hours = location?.hours ?? {}
  const rows = DAY_KEYS.map((day) => {
    const value = hours[day]
    const text = Array.isArray(value) ? `${value[0]} – ${value[1]}` : t.common.closed
    return join(
      `<tr data-day="${day}">`,
      `<th scope="row">${esc(t.common.days[day])}</th>`,
      `<td>${esc(text)}</td>`,
      `</tr>`,
    )
  }).join('')

  return join(
    `<table class="hours" data-hours='${esc(JSON.stringify(pickHours(hours)))}'>`,
    `<tbody>${rows}</tbody>`,
    `</table>`,
  )
}

/** Убирает служебные ключи вроде `_todo` перед отдачей в JSON. */
export function pickHours(hours) {
  return Object.fromEntries(DAY_KEYS.map((d) => [d, Array.isArray(hours?.[d]) ? hours[d] : null]))
}

/** Бейдж «сейчас открыто / закрыто». Текст проставляет app.js по местному времени Бали. */
export function openBadge({ t, location }) {
  if (!location?.hours) return ''
  return `<p class="open-badge" data-open-badge data-hours='${esc(
    JSON.stringify(pickHours(location.hours)),
  )}' data-label-open="${esc(t.common.openNow)}" data-label-closed="${esc(
    t.common.closedNow,
  )}" data-label-until="${esc(t.common.closesAt)}" data-label-opens="${esc(t.common.opensAt)}" hidden></p>`
}

/** Карточка позиции меню. */
export function itemCard(item, { withPhoto = true } = {}) {
  return join(
    `<li class="item${item.photo && withPhoto ? '' : ' item-nophoto'}">`,
    item.photo && withPhoto
      ? `<img class="item-photo" src="${esc(item.photo)}" alt="${esc(item.name)}" loading="lazy" width="300" height="300">`
      : '',
    `<div class="item-body">`,
    `<span class="item-name">${esc(item.name)}</span>`,
    `<span class="item-price">${esc(idr(item.price))}</span>`,
    `</div>`,
    `</li>`,
  )
}

/** Сколько колонок дать подборке, чтобы последний ряд не остался с одной карточкой. */
export const colsFor = (count) => (count % 4 === 0 ? 4 : 3)

/** Достаёт из меню позиции по названиям — для блока «фирменные напитки». */
export function pickItems(menu, names) {
  const all = menu.categories.flatMap((c) => c.items.map((i) => ({ ...i, category: c.name })))
  return names
    .map((name) => all.find((i) => i.name.toLowerCase() === String(name).toLowerCase()))
    .filter(Boolean)
}

/** Аккордеон вопросов. Работает без JS — на <details>. */
export function faq({ title, items }) {
  if (!items?.length) return ''
  return join(
    `<section class="section faq">`,
    `<div class="wrap narrow">`,
    `<h2>${esc(title)}</h2>`,
    items
      .map(
        (item) =>
          `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`,
      )
      .join(''),
    `</div>`,
    `</section>`,
  )
}

/** JSON-LD для блока вопросов — из него Google собирает раскрывашки в выдаче. */
export function faqJsonLd(items) {
  if (!items?.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

/** Заметный блок в конце страницы, чтобы клик по рекламе не заканчивался ничем. */
export function closingCta({ t, business, lang, title, lead }) {
  return join(
    `<section class="section closing">`,
    `<div class="wrap narrow center">`,
    `<h2>${esc(title)}</h2>`,
    lead && `<p class="lead">${esc(lead)}</p>`,
    ctaRow({ t, business, lang, variant: 'center' }),
    `</div>`,
    `</section>`,
  )
}

/**
 * Условия кейтеринга одной строкой: минимум в напитках, срок брони, предоплата.
 * Числа живут только в business.json — в текстах их нет, чтобы при изменении
 * условий не пришлось искать цифры по всем страницам.
 * Пока что-то не подтверждено, строки нет вовсе.
 */
export function cateringNote(t, business) {
  const min = real(business.catering?.minDrinks)
  const days = real(business.catering?.leadTimeDays)
  const prepay = real(business.catering?.prepaymentPercent)
  if (!min || !days) return ''
  const template = prepay
    ? t.pages.catering.form.minOrderNoteWithPrepayment
    : t.pages.catering.form.minOrderNote
  return fill(template, { min, days, prepay })
}

/**
 * Интерактивный блок напитков: вкладки по категориям из Poster.
 *
 * Все карточки рендерятся сразу, скрипт только переключает видимость панелей —
 * поэтому блок работает мгновенно, а поисковики видят весь текст. Без скрипта
 * открытой остаётся первая вкладка, остальные доступны на странице меню.
 *
 * Фото ищется по цепочке: файл соответствий (снимки из Figma) → фото из Poster →
 * карточка без картинки. Ни один шаг не обязателен.
 */
export function drinksExplorer({ t, business, menu, lang, photoMap = {} }) {
  const p = t.pages.home.signature
  const cfg = business.featured?.explorer ?? {}
  const exclude = new Set(cfg.exclude ?? [])
  const perCategory = Number(cfg.perCategory) || 8

  const withPhoto = (item) => {
    const mapped = photoMap[item.name]
    return mapped
      ? { ...item, figma: String(mapped).padStart(2, '0') }
      : item
  }

  const signature = pickItems(menu, business.featured?.signature ?? []).map(withPhoto)

  const tabs = [
    signature.length && { id: 'signature', label: p.signatureTab, items: signature },
    ...menu.categories
      .filter((c) => !exclude.has(c.name))
      .map((c) => ({
        id: slugify(c.name),
        label: c.name,
        items: c.items.slice(0, perCategory).map(withPhoto),
      })),
  ].filter(Boolean)

  if (!tabs.length) return ''

  const tabButtons = tabs
    .map(
      (tab, i) =>
        `<button type="button" role="tab" id="tab-${esc(tab.id)}" aria-controls="panel-${esc(tab.id)}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(tab.label)}</button>`,
    )
    .join('')

  const panels = tabs
    .map(
      (tab, i) =>
        `<div class="drinks-panel" role="tabpanel" id="panel-${esc(tab.id)}" aria-labelledby="tab-${esc(tab.id)}"${i === 0 ? '' : ' hidden'}>` +
        `<ul class="items" data-cols="${colsFor(tab.items.length)}">` +
        tab.items.map(drinkCard).join('') +
        `</ul></div>`,
    )
    .join('')

  return join(
    `<section class="section section-tint drinks">`,
    `<div class="wrap">`,
    `<h2>${esc(p.title)}</h2>`,
    `<p class="lead">${esc(p.lead)}</p>`,
    `<div class="drinks-tabs" role="tablist" aria-label="${esc(p.title)}">${tabButtons}</div>`,
    panels,
    `<div class="cta-row">`,
    button({ href: url(lang, 'menu'), label: p.cta, variant: 'btn-ghost' }),
    `</div>`,
    `</div>`,
    `</section>`,
  )
}

/** Карточка напитка. Снимок из Figma лежит локально, из Poster — на их сервере. */
function drinkCard(item) {
  const photo = item.figma
    ? `<img class="item-photo" src="/photos/drinks/${esc(item.figma)}.webp" srcset="/photos/drinks/${esc(item.figma)}@320.webp 320w, /photos/drinks/${esc(item.figma)}.webp 512w" sizes="(max-width: 700px) 45vw, 22vw" alt="${esc(item.name)}" loading="lazy" width="512" height="512">`
    : item.photo
      ? `<img class="item-photo" src="${esc(item.photo)}" alt="${esc(item.name)}" loading="lazy" width="300" height="300">`
      : ''

  return join(
    `<li class="item${photo ? '' : ' item-nophoto'}">`,
    photo,
    `<div class="item-body">`,
    `<span class="item-name">${esc(item.name)}</span>`,
    `<span class="item-price">${esc(idr(item.price))}</span>`,
    `</div>`,
    `</li>`,
  )
}

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
