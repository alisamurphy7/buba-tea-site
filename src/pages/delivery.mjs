/** Посадочная под рекламу «доставка бабл-ти / матчи». Одно действие: заказать. */

import { esc, join, waLink } from '../lib/html.mjs'
import { real } from '../lib/layout.mjs'
import { button, itemCard, pickItems, colsFor, faq, faqJsonLd } from '../lib/blocks.mjs'

export default function delivery({ t, business, menu, lang }) {
  const p = t.pages.delivery
  const gofood = real(business.delivery?.gofood)
  const grabfood = real(business.delivery?.grabfood)
  const radiusNote = real(business.delivery?.radiusNote)
  const wa = waLink(
    real(business.contacts.whatsapp),
    lang === 'ru' ? 'Здравствуйте! Хочу заказать доставку.' : 'Hi! I would like to order delivery.',
  )
  const travels = pickItems(menu, business.featured?.travelsWell ?? []).slice(0, 4)

  const option = ({ key, href, external = true, track }) => {
    if (!href) return ''
    const copy = p.options[key]
    return join(
      `<article class="panel panel-option">`,
      `<h3>${esc(copy.title)}</h3>`,
      `<p>${esc(copy.text)}</p>`,
      button({ href, label: copy.cta, track, external }),
      `</article>`,
    )
  }

  const body = join(
    `<section class="page-head">`,
    `<div class="wrap narrow">`,
    `<h1>${esc(p.h1)}</h1>`,
    `<p class="lead">${esc(p.lead)}</p>`,
    radiusNote ? `<p class="note">${esc(radiusNote)}</p>` : '',
    `</div>`,
    `</section>`,

    // Пока ни один канал заказа не заполнен, секцию не показываем —
    // заголовок без карточек читается как сломанная страница.
    (gofood || grabfood || wa) &&
      join(
        `<section class="section">`,
        `<div class="wrap">`,
        `<h2>${esc(p.options.title)}</h2>`,
        `<div class="cards cards-3">`,
        option({ key: 'gofood', href: gofood, track: 'delivery' }),
        option({ key: 'grabfood', href: grabfood, track: 'delivery' }),
        option({ key: 'whatsapp', href: wa, track: 'whatsapp' }),
        `</div>`,
        `</div>`,
        `</section>`,
      ),

    // Главное возражение к доставке напитков — «привезут тёплым и разбавленным».
    // Отвечаем на него сразу после кнопок заказа, пока гость ещё думает.
    p.packing &&
      join(
        `<section class="section section-tint">`,
        `<div class="wrap">`,
        `<h2>${esc(p.packing.title)}</h2>`,
        `<p class="lead">${esc(p.packing.lead)}</p>`,
        `<div class="cards cards-3">`,
        p.packing.items
          .map((item) => `<article class="card"><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></article>`)
          .join(''),
        `</div>`,
        `</div>`,
        `</section>`,
      ),

    travels.length &&
      join(
        `<section class="section">`,
        `<div class="wrap">`,
        `<h2>${esc(p.travelsWell.title)}</h2>`,
        `<p class="lead">${esc(p.travelsWell.lead)}</p>`,
        `<ul class="items" data-cols="${colsFor(travels.length)}">`,
        travels.map((item) => itemCard(item)).join(''),
        `</ul>`,
        `</div>`,
        `</section>`,
      ),

    faq({ title: p.faq.title, items: p.faq.items }),
  )

  return {
    title: p.title,
    description: p.description,
    body,
    structuredData: [faqJsonLd(p.faq.items)].filter(Boolean),
  }
}
