/** Страница «как найти» — под запросы «bubble tea near me» и клик «маршрут». */

import { esc, join, waLink } from '../lib/html.mjs'
import { real, directionsUrl } from '../lib/layout.mjs'
import { button, hoursTable, openBadge } from '../lib/blocks.mjs'
import { url } from '../lib/routes.mjs'
import { businessJsonLd } from './home.mjs'

/**
 * Названия матча-напитков берём из меню, то есть из кассы, а не пишем руками:
 * иначе список протухнет при первой же правке в Poster. Ловим по названию, а не
 * по категории — так сюда попадают и Matcha Cloud из фирменных, и Matcha Gelato.
 */
const matchaItems = (menu) =>
  (menu?.categories ?? [])
    .flatMap((c) => c.items)
    .filter((i) => /matcha/i.test(i.name))
    .slice(0, 9)

/**
 * Еду берём тем же способом — из кассы, а не списком в коде. Но ловим не по
 * названию позиции, а по КАТЕГОРИИ: у «Plain Croissant» и «Onigiri» нет общего
 * слова, по которому их можно было бы выбрать, а категории «Poke and Bowls» и
 * «Bakery» в Poster заведены именно под это.
 *
 * Зачем блок вообще. Performance Max решает, по каким запросам нас показывать,
 * во многом по посадочной странице. Пока здесь были только адрес, часы и матча,
 * Google считал нас заведением с напитками и по breakfast/brunch не показывал
 * вовсе — хотя темы с этими словами в кампании стоят. См. scripts/reklama_teksty.py.
 */
const foodItems = (menu) =>
  (menu?.categories ?? [])
    .filter((c) => /poke|bowls|bakery/i.test(c.name))
    .flatMap((c) => c.items)
    .slice(0, 9)

export default function visit({ t, business, menu, lang, origin }) {
  const p = t.pages.visit
  const location = business.locations[0]
  const address = real(location?.address)
  const directions = directionsUrl(location)
  const phone = real(business.contacts.phone)
  const wa = waLink(
    real(business.contacts.whatsapp),
    lang === 'ru' ? 'Здравствуйте! Хочу заказать заранее.' : 'Hi! I would like to order ahead.',
  )

  // Пока адрес, маршрут и контакты не заполнены, колонка была бы пустым
  // заголовком — тогда показываем только часы работы, во всю ширину.
  const hasContactColumn = Boolean(address || directions || wa || phone)
  const matcha = matchaItems(menu)
  const food = foodItems(menu)

  const contactColumn = join(
    `<div>`,
    `<h2>${esc(p.addressTitle)}</h2>`,
    address ? `<p class="address">${esc(address)}</p>` : '',
    (directions || wa) &&
      join(
        `<div class="cta-row">`,
        directions &&
          button({ href: directions, label: t.common.getDirections, track: 'directions', external: true }),
        wa && button({ href: wa, label: t.common.whatsapp, variant: 'btn-ghost', track: 'whatsapp', external: true }),
        `</div>`,
      ),
    phone ? `<p><a class="plain" href="tel:${esc(phone.replace(/[^\d+]/g, ''))}" data-track="call">${esc(phone)}</a></p>` : '',
    `</div>`,
  )

  const body = join(
    `<section class="page-head">`,
    `<div class="wrap narrow">`,
    `<h1>${esc(p.h1)}</h1>`,
    `<p class="lead">${esc(p.lead)}</p>`,
    openBadge({ t, location }),
    `</div>`,
    `</section>`,

    `<section class="section">`,
    `<div class="wrap${hasContactColumn ? ' split' : ' narrow'}">`,
    hasContactColumn && contactColumn,
    join(`<div>`, `<h2>${esc(p.hoursTitle)}</h2>`, hoursTable({ t, location }), `</div>`),
    `</div>`,
    `</section>`,

    // Зачем блок: на эту страницу ведём объявления по запросам про матчу.
    // Человеку, который выбирает, куда дойти, нужен ответ «а что у вас есть»,
    // и он же показывает Google, что страница про матчу, а не только про адрес.
    // Если матчи в меню не осталось — блок просто не рисуется.
    p.matcha &&
      matcha.length &&
      join(
        `<section class="section">`,
        `<div class="wrap narrow">`,
        `<h2>${esc(p.matcha.title)}</h2>`,
        `<p class="lead">${esc(p.matcha.lead)}</p>`,
        `<ul class="chips">`,
        matcha.map((i) => `<li class="chip">${esc(i.name)}</li>`).join(''),
        `</ul>`,
        `<p><a class="plain" href="${esc(url(lang, 'menu'))}">${esc(p.matcha.linkLabel)}</a></p>`,
        `</div>`,
        `</section>`,
      ),

    // Завтраки и еда. Блок необязательный: если в кассе не осталось ни поке,
    // ни выпечки, он просто не рисуется — как и блок про матчу.
    p.food &&
      food.length &&
      join(
        `<section class="section">`,
        `<div class="wrap narrow">`,
        `<h2>${esc(p.food.title)}</h2>`,
        `<p class="lead">${esc(p.food.lead)}</p>`,
        `<ul class="chips">`,
        food.map((i) => `<li class="chip">${esc(i.name)}</li>`).join(''),
        `</ul>`,
        `<p><a class="plain" href="${esc(url(lang, 'menu'))}">${esc(p.food.linkLabel)}</a></p>`,
        `</div>`,
        `</section>`,
      ),

    `<section class="section section-tint">`,
    `<div class="wrap">`,
    `<h2>${esc(p.gettingHere.title)}</h2>`,
    `<div class="cards cards-3">`,
    p.gettingHere.items
      .map((item) => `<article class="card"><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></article>`)
      .join(''),
    `</div>`,
    `</div>`,
    `</section>`,

    // Блок про работу из кафе — необязательный: пока не подтверждено,
    // что есть Wi-Fi и розетки, его в текстах просто нет.
    p.workFriendly &&
      join(
        `<section class="section">`,
        `<div class="wrap split">`,
        `<div>`,
        `<h2>${esc(p.workFriendly.title)}</h2>`,
        `<p class="lead">${esc(p.workFriendly.text)}</p>`,
        `</div>`,
        `<img class="rounded" src="/photos/terrace@600.webp" alt="${esc(t.pages.home.gallery.alts[1])}" loading="lazy" width="600" height="800">`,
        `</div>`,
        `</section>`,
      ),
  )

  return {
    title: p.title,
    description: p.description,
    body,
    ogImage: 'photos/terrace.webp',
    structuredData: [businessJsonLd({ business, menu, lang, origin })],
  }
}
