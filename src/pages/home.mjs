/** Главная. Задача — за один экран объяснить, что мы за место, и дать действие. */

import { esc, join } from '../lib/html.mjs'
import { url } from '../lib/routes.mjs'
import { USP_ICONS } from '../lib/uspIcons.mjs'
import { real, directionsUrl } from '../lib/layout.mjs'
import {
  button,
  ctaRow,
  itemCard,
  pickItems,
  colsFor,
  faq,
  faqJsonLd,
  openBadge,
  hoursTable,
  closingCta,
  drinksExplorer,
} from '../lib/blocks.mjs'

/**
 * Карточка преимущества: круглый медальон, заголовок, короткий текст.
 * В медальоне либо фотография (если у пункта задано поле `photo`),
 * либо рисованная иконка — так фото можно подставлять по одному,
 * не дожидаясь, пока соберётся весь комплект.
 */
function uspCard(item) {
  const medallion = item.photo
    ? `<img src="/photos/usp/${esc(item.photo)}" alt="" loading="lazy" width="200" height="200">`
    : (USP_ICONS[item.icon] ?? '')

  return join(
    `<article class="usp-card">`,
    medallion && `<div class="usp-icon${item.photo ? ' usp-icon-photo' : ''}">${medallion}</div>`,
    `<h3>${esc(item.title)}</h3>`,
    `<p>${esc(item.text)}</p>`,
    `</article>`,
  )
}

export default function home({ t, business, menu, lang, origin, photoMap = {}, heroFruit = [] }) {
  const p = t.pages.home
  const location = business.locations[0]
  const address = real(location?.address)
  const directions = directionsUrl(location)
  const signature = pickItems(menu, business.featured?.signature ?? []).slice(0, 6)

  const body = join(
    // ── Первый экран ────────────────────────────────────────────────
    `<section class="hero">`,
    `<div class="wrap hero-inner">`,
    `<div class="hero-text">`,
    `<p class="kicker">${esc(p.hero.kicker)}</p>`,
    `<h1>${esc(p.hero.h1)}</h1>`,
    `<p class="lead">${esc(p.hero.lead)}</p>`,
    // На первом экране главное действие — довести до кафе, а не до доставки.
    ctaRow({ t, business, lang, primary: 'directions' }),
    openBadge({ t, location }),
    `</div>`,
    // Первый экран: три стакана по кругу. Передний крупный и резкий,
    // боковые уменьшены и размыты — видно и наполнение, и что напитков много.
    // Кусочки фрукта берутся из public/photos/fruit; нет файлов — нет слоя.
    `<div class="hero-media">`,
    `<div class="hero-shot">`,
    heroFruit
      .slice(0, 6)
      .map(
        (file, i) =>
          `<img class="hero-fruit hero-fruit-${i + 1}" src="/photos/fruit/${esc(file)}" alt="" aria-hidden="true" loading="eager">`,
      )
      .join(''),
    `<div class="hero-carousel" data-carousel>`,
    `<div class="hero-stage">`,
    p.hero.cups
      .map(
        (alt, i) =>
          `<img class="hero-cup" data-pos="${i === 0 ? 'front' : i === 1 ? 'right' : 'left'}" src="/photos/drinks/cup-${i + 1}.webp" srcset="/photos/drinks/cup-${i + 1}@600.webp 600w, /photos/drinks/cup-${i + 1}.webp 1000w" sizes="(max-width: 900px) 60vw, 30vw" alt="${esc(alt)}" width="1000" height="1000"${i === 0 ? ' fetchpriority="high"' : ' loading="eager"'}>`,
      )
      .join(''),
    `</div>`,
    `<div class="hero-dots" role="tablist" aria-label="${esc(p.hero.cupsLabel)}">`,
    p.hero.cups
      .map(
        (alt, i) =>
          `<button class="hero-dot" type="button" role="tab" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span class="visually-hidden">${esc(alt)}</span></button>`,
      )
      .join(''),
    `</div>`,
    `</div>`,
    `</div>`,
    `</section>`,

    // ── Почему мы ───────────────────────────────────────────────────
    `<section class="section">`,
    `<div class="wrap">`,
    `<h2>${esc(p.usp.title)}</h2>`,
    `<div class="usp-grid">`,
    p.usp.items.map(uspCard).join(''),
    `</div>`,
    `</div>`,
    `</section>`,

    // ── Напитки: вкладки по категориям ──────────────────────────────
    drinksExplorer({ t, business, menu, lang, photoMap }),

    // ── Интерьер ────────────────────────────────────────────────────
    `<section class="section">`,
    `<div class="wrap">`,
    `<h2>${esc(p.gallery.title)}</h2>`,
    `<div class="gallery">`,
    ['hall', 'flowers', 'counter', 'terrace', 'matcha', 'facade']
      .map(
        (name, i) =>
          `<img src="/photos/${name}.webp" srcset="/photos/${name}@600.webp 600w, /photos/${name}.webp 900w" sizes="(max-width: 700px) 90vw, 30vw" alt="${esc(p.gallery.alts[i])}" loading="lazy" width="900" height="1200">`,
      )
      .join(''),
    `</div>`,
    `</div>`,
    `</section>`,

    // ── Доставка и кейтеринг ────────────────────────────────────────
    `<section class="section">`,
    `<div class="wrap split">`,
    join(
      `<article class="panel">`,
      `<h2>${esc(p.deliveryBlock.title)}</h2>`,
      `<p>${esc(p.deliveryBlock.lead)}</p>`,
      button({ href: url(lang, 'delivery'), label: p.deliveryBlock.cta }),
      `</article>`,
    ),
    join(
      `<article class="panel panel-dark">`,
      `<h2>${esc(p.cateringBlock.title)}</h2>`,
      `<p>${esc(p.cateringBlock.lead)}</p>`,
      button({ href: url(lang, 'catering'), label: p.cateringBlock.cta, variant: 'btn-light' }),
      `</article>`,
    ),
    `</div>`,
    `</section>`,

    // ── Как найти ───────────────────────────────────────────────────
    `<section class="section section-tint">`,
    `<div class="wrap split">`,
    join(
      `<div>`,
      `<h2>${esc(p.visitBlock.title)}</h2>`,
      `<p class="lead">${esc(p.visitBlock.lead)}</p>`,
      address ? `<p class="address">${esc(address)}</p>` : '',
      `<div class="cta-row">`,
      directions &&
        button({
          href: directions,
          label: t.common.getDirections,
          track: 'directions',
          external: true,
        }),
      button({ href: url(lang, 'visit'), label: t.nav.visit, variant: 'btn-ghost' }),
      `</div>`,
      `</div>`,
    ),
    join(`<div>`, `<h3 class="h-small">${esc(t.pages.visit.hoursTitle)}</h3>`, hoursTable({ t, location }), `</div>`),
    `</div>`,
    `</section>`,

    // Благотворительность — не про продукт, поэтому стоит после него:
    // сначала причина купить, потом причина запомнить.
    `<section class="section section-tint">`,
    `<div class="wrap narrow center">`,
    `<h2>${esc(p.community.title)}</h2>`,
    `<p class="lead">${esc(p.community.text)}</p>`,
    `</div>`,
    `</section>`,

    faq({ title: p.faq.title, items: p.faq.items }),

    closingCta({ t, business, lang, title: p.closing.title, lead: p.closing.lead }),
  )

  return {
    title: p.title,
    description: p.description,
    body,
    structuredData: [businessJsonLd({ business, menu, lang, origin }), faqJsonLd(p.faq.items)].filter(
      Boolean,
    ),
  }
}

/**
 * Карточка заведения для Google. Без неё локальная выдача и Maps не связывают
 * сайт с точкой — а для локальной рекламы это половина эффекта.
 */
export function businessJsonLd({ business, menu, lang, origin, includeMenuItems = false }) {
  const location = business.locations[0]
  const address = real(location?.address)
  const phone = real(business.contacts.phone)
  const geo = location?.geo
  const sameAs = [
    real(business.social.instagram),
    real(business.social.tiktok),
    real(business.social.googleMapsProfile),
  ].filter(Boolean)

  const openingHours = Object.entries(location?.hours ?? {})
    .filter(([day, value]) => Array.isArray(value) && !day.startsWith('_'))
    .map(([day, [opens, closes]]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${DAY_SCHEMA[day]}`,
      opens,
      closes,
    }))

  const data = {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    '@id': `${origin.replace(/\/$/, '')}/#business`,
    name: business.brand.name,
    url: `${origin.replace(/\/$/, '')}${url(lang, 'home')}`,
    image: `${origin.replace(/\/$/, '')}/photos/hall.webp`,
    servesCuisine: ['Tea', 'Coffee', 'Bakery', 'Gelato'],
    priceRange: 'Rp25.000–Rp119.000',
    currenciesAccepted: 'IDR',
    hasMenu: `${origin.replace(/\/$/, '')}${url(lang, 'menu')}`,
  }

  if (address) {
    data.address = { '@type': 'PostalAddress', streetAddress: address, addressCountry: 'ID' }
  }
  // Год открытия Google использует как признак живого, а не брошенного бизнеса.
  const founded = real(business.brand.founded)
  if (founded) data.foundingDate = founded
  if (phone) data.telephone = phone
  if (geo?.lat && geo?.lng) {
    data.geo = { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lng }
  }
  if (openingHours.length) data.openingHoursSpecification = openingHours
  if (sameAs.length) data.sameAs = sameAs
  // Полный список позиций отдаём только на странице меню — на остальных
  // это лишние килобайты в каждой загрузке.
  if (includeMenuItems && menu?.categories?.length) {
    data.hasMenu = {
      '@type': 'Menu',
      url: `${origin.replace(/\/$/, '')}${url(lang, 'menu')}`,
      hasMenuSection: menu.categories.map((c) => ({
        '@type': 'MenuSection',
        name: c.name,
        hasMenuItem: c.items.map((i) => ({
          '@type': 'MenuItem',
          name: i.name,
          offers: { '@type': 'Offer', price: i.price, priceCurrency: 'IDR' },
        })),
      })),
    }
  }

  return data
}

const DAY_SCHEMA = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}
