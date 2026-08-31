/**
 * Посадочная под рекламу кейтеринга — самый дорогой чек, поэтому у страницы
 * своя форма. Форма ничего не отправляет на сервер: она собирает текст и
 * открывает WhatsApp. Так нет ни бэкенда, ни хранения персональных данных.
 */

import { esc, join, waLink, attrs } from '../lib/html.mjs'
import { real } from '../lib/layout.mjs'
import { button, cateringNote } from '../lib/blocks.mjs'
import { CART_SVG } from '../lib/cartIllustration.mjs'
import { VAN_SVG, KITCHEN_SVG } from '../lib/formatIllustrations.mjs'
import { FORMAT_ICONS, HIGHLIGHT_ICONS } from '../lib/formatIcons.mjs'

export default function catering({ t, business, lang, reviews = null }) {
  const p = t.pages.catering
  const number = real(business.contacts.whatsapp)
  const wa = waLink(number, lang === 'ru' ? 'Здравствуйте! Интересует кейтеринг.' : 'Hi! I am interested in catering.')

  // Плашки вместо карточек с описанием: форматы понятны по названию,
  // а абзацы под каждым только замедляли чтение.
  const formatChips = p.formats.items
    .map(
      (item) =>
        `<li class="chip"><span class="chip-icon">${FORMAT_ICONS[item.icon] ?? ''}</span>${esc(item.title)}</li>`,
    )
    .join('')

  const steps = p.how.steps
    .map(
      (step, index) =>
        `<li class="step"><span class="step-num">${index + 1}</span><div><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p></div></li>`,
    )
    .join('')


  // Три формата выезда — заказчик выбирает глазами, поэтому у каждого
  // своя иллюстрация. Те же картинки, что в печатной брошюре.
  const FORMAT_ART = { kitchen: KITCHEN_SVG, cart: CART_SVG, van: VAN_SVG }
  const serviceFormats = (p.serviceFormats?.items ?? [])
    .map((item, i) => {
      const id = `fmt-${item.key}`
      const art = (FORMAT_ART[item.key] ?? '')
        .replace(/\{\{id\}\}/g, id)
        .replace(/\{\{title\}\}/g, esc(item.name))
      return join(
        `<li class="format-card">`,
        `<div class="format-art">${art}</div>`,
        `<h3>${esc(item.name)}</h3>`,
        `<p>${esc(item.note)}</p>`,
        `</li>`,
      )
    })
    .join('')

  // Цены — главное, за чем сюда приходят: карточки, а не таблица,
  // чтобы читались с телефона одной колонкой.
  const packageCards = (p.packages?.items ?? [])
    .map((pack) =>
      join(
        `<li class="pack-card">`,
        `<div class="pack-card-head">`,
        `<span class="pack-from">${esc(p.packages.from)}</span>`,
        `<span class="pack-price">${esc(pack.price)}</span>`,
        `</div>`,
        `<div class="pack-card-body">`,
        `<h3>${esc(pack.name)}</h3>`,
        pack.sub ? `<p class="pack-sub">${esc(pack.sub)}</p>` : '',
        `<ul>${pack.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`,
        pack.add ? `<p class="pack-add">+ ${esc(pack.add)}</p>` : '',
        `</div>`,
        `</li>`,
      ),
    )
    .join('')

  const addonRows = (p.addons?.items ?? [])
    .map((a) => `<tr><td>${esc(a.label)}</td><td class="num">${esc(a.price)}</td></tr>`)
    .join('')

  const body = join(
    // Заказчик выбирает выездной бар глазами: голая плашка с текстом
    // не показывает, что именно приедет.
    `<section class="page-head page-head-media">`,
    `<div class="wrap catering-hero">`,
    `<div>`,
    `<h1>${esc(p.h1)}</h1>`,
    `<p class="lead">${esc(p.lead)}</p>`,
    cateringNote(t, business) && `<p class="note">${esc(cateringNote(t, business))}</p>`,
    `<div class="cta-row">`,
    button({ href: '#quote', label: p.form.title }),
    `</div>`,
    `</div>`,
    `<div class="cart-shot">`,
    CART_SVG.replace('{{title}}', esc(p.heroImageAlt)),
    `</div>`,
    `</div>`,
    `</section>`,

    `<section class="section">`,
    `<div class="wrap">`,
    `<h2>${esc(p.formats.title)}</h2>`,
    `<ul class="chips">${formatChips}</ul>`,
    `</div>`,
    `</section>`,


    p.serviceFormats &&
      join(
        `<section class="section">`,
        `<div class="wrap">`,
        `<h2>${esc(p.serviceFormats.title)}</h2>`,
        `<p class="lead narrow">${esc(p.serviceFormats.lead)}</p>`,
        `<ul class="format-cards">${serviceFormats}</ul>`,
        `</div>`,
        `</section>`,
      ),

    p.packages &&
      join(
        `<section class="section section-tint" id="packages">`,
        `<div class="wrap">`,
        `<h2>${esc(p.packages.title)}</h2>`,
        `<p class="lead narrow">${esc(p.packages.lead)}</p>`,
        `<ul class="pack-cards">${packageCards}</ul>`,
        p.packages.pastry ? `<p class="pastry-note">${esc(p.packages.pastry)}</p>` : '',
        `</div>`,
        `</section>`,
      ),

    `<section class="section">`,
    `<div class="wrap split">`,
    join(
      `<div>`,
      `<h2>${esc(p.included.title)}</h2>`,
      `<ul class="ticks">`,
      // Пункт может быть строкой либо объектом с подсветкой: то, чего
      // нет у других, не должно теряться в общем перечне галочек.
      p.included.items
        .map((item) =>
          typeof item === 'string'
            ? `<li>${esc(item)}</li>`
            : `<li class="tick-wow"><span class="tick-wow-icon">${HIGHLIGHT_ICONS[item.icon] ?? ''}</span>${esc(item.text)}</li>`,
        )
        .join(''),
      `</ul>`,
      `</div>`,
    ),
    join(`<div>`, `<h2>${esc(p.how.title)}</h2>`, `<ol class="steps">${steps}</ol>`, `</div>`),
    `</div>`,
    `</section>`,

    p.addons &&
      join(
        `<section class="section">`,
        `<div class="wrap narrow">`,
        `<h2>${esc(p.addons.title)}</h2>`,
        `<p class="lead">${esc(p.addons.lead)}</p>`,
        `<table class="addons"><tbody>${addonRows}</tbody></table>`,
        `<p class="note">${esc(p.addons.note)}</p>`,
        `</div>`,
        `</section>`,
      ),

    p.onSite &&
      join(
        `<section class="section">`,
        `<div class="wrap">`,
        `<h2>${esc(p.onSite.title)}</h2>`,
        `<div class="onsite-grid">`,
        `<img src="/photos/catering/serving.webp" srcset="/photos/catering/serving@600.webp 600w, /photos/catering/serving.webp 900w" sizes="(max-width: 700px) 90vw, 45vw" alt="${esc(p.onSite.alts[0])}" loading="lazy" width="900" height="1200">`,
        `<img src="/photos/catering/drinks-table.webp" srcset="/photos/catering/drinks-table@600.webp 600w, /photos/catering/drinks-table.webp 900w" sizes="(max-width: 700px) 90vw, 45vw" alt="${esc(p.onSite.alts[1])}" loading="lazy" width="900" height="1200">`,
        `</div>`,
        `</div>`,
        `</section>`,
      ),

    reviewsCarousel({ t, reviews }),

    quoteForm({ t, business, lang, number }),
  )

  return {
    title: p.title,
    description: p.description,
    body,
    structuredData: [serviceJsonLd({ t, business })],
  }
}

/**
 * Карусель отзывов: имя, тип мероприятия и текст. Листается сама, точки под ней
 * переключают вручную. Разметку Review для Google намеренно НЕ выводим, пока
 * отзывы помечены заглушкой — отдавать поисковику выдуманные отзывы нельзя.
 */
function reviewsCarousel({ t, reviews }) {
  const items = reviews?.items ?? []
  if (!items.length) return ''
  const p = t.pages.catering.reviews

  const slides = items
    .map(
      (item, i) =>
        `<figure class="review" data-review${i === 0 ? '' : ' hidden'}>` +
        `<blockquote>${esc(item.text)}</blockquote>` +
        `<figcaption><span class="review-name">${esc(item.name)}</span><span class="review-event">${esc(item.event)}</span></figcaption>` +
        `</figure>`,
    )
    .join('')

  const dots = items
    .map(
      (item, i) =>
        `<button class="hero-dot" type="button" role="tab" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span class="visually-hidden">${esc(item.name)} — ${esc(item.event)}</span></button>`,
    )
    .join('')

  return join(
    `<section class="section section-tint">`,
    `<div class="wrap narrow center">`,
    `<h2>${esc(p.title)}</h2>`,
    `<div class="reviews" data-reviews>`,
    `<div class="reviews-stage">${slides}</div>`,
    `<div class="hero-dots" role="tablist" aria-label="${esc(p.label)}">${dots}</div>`,
    `</div>`,
    reviews.placeholder
      ? `<p class="note review-warning">Placeholder reviews — replace before publishing.</p>`
      : '',
    `</div>`,
    `</section>`,
  )
}

function quoteForm({ t, business, number }) {
  const p = t.pages.catering.form
  const f = p.fields
  const typeOptions = Object.entries(p.typeOptions)
    .map(([value, label]) => `<option value="${esc(label)}">${esc(label)}</option>`)
    .join('')

  const field = (name, label, input) =>
    `<label class="field"><span>${esc(label)}</span>${input}</label>`

  return join(
    `<section class="section" id="quote">`,
    `<div class="wrap narrow">`,
    `<h2>${esc(p.title)}</h2>`,
    `<p class="lead">${esc(p.lead)}</p>`,

    // data-whatsapp — номер, куда уйдёт собранное сообщение; собирает app.js.
    `<form class="quote-form"${attrs({ 'data-whatsapp': number, 'data-error': p.required })} novalidate>`,

    `<div class="field-grid">`,
    field('name', f.name, `<input type="text" name="name" required autocomplete="name" placeholder="${esc(p.placeholders.name)}">`),
    field('date', f.date, `<input type="date" name="date" required>`),
    // Гостей спрашиваем, потому что заказчик знает именно это число.
    // Минимум у нас в напитках, поэтому к полю его не привязываем.
    field('guests', f.guests, `<input type="number" name="guests" min="1" step="1" inputmode="numeric">`),
    // Часы напрямую влияют на смету — без них всё равно пришлось бы переспрашивать.
    field(
      'hours',
      f.hours,
      `<input type="number" name="hours" min="1" step="1" inputmode="numeric" placeholder="${esc(p.placeholders.hours)}">`,
    ),
    field('place', f.place, `<input type="text" name="place" placeholder="${esc(p.placeholders.place)}">`),
    field('type', f.type, `<select name="type">${typeOptions}</select>`),
    `</div>`,
    field('notes', f.notes, `<textarea name="notes" rows="4" placeholder="${esc(p.placeholders.notes)}"></textarea>`),

    `<p class="form-error" data-form-error hidden></p>`,
    `<div class="cta-row">`,
    button({ type: 'submit', label: p.submit, track: 'cateringLead' }),
    `</div>`,
    `<p class="note">${esc(p.note)}</p>`,
    `</form>`,

    `</div>`,
    `</section>`,
  )
}

function serviceJsonLd({ t, business }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: t.pages.catering.h1,
    provider: { '@type': 'CafeOrCoffeeShop', name: business.brand.name },
    areaServed: { '@type': 'Place', name: 'Bali, Indonesia' },
    description: t.pages.catering.description,
  }
}
