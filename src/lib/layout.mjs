/** Общая обвязка страницы: <head>, шапка, подвал, cookie-баннер, аналитика. */

import { esc, attrs, join, waLink } from './html.mjs'
import { NAV_PAGES, DEFAULT_LANG, url, absolute } from './routes.mjs'

/** Ссылка на маршрут в Google Maps с запасным вариантом по адресу. */
export function directionsUrl(location) {
  if (location?.mapsDirectionsUrl && !isTodo(location.mapsDirectionsUrl)) {
    return location.mapsDirectionsUrl
  }
  if (location?.address && !isTodo(location.address)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`
  }
  return null
}

/** Незаполненные поля business.json помечены TODO — их нельзя выводить на сайт. */
export const isTodo = (value) => typeof value === 'string' && value.trim().startsWith('TODO')

/** Значение, если оно заполнено; иначе null. */
export const real = (value) => (isTodo(value) || value === '' || value == null ? null : value)

function head({ t, business, lang, langs, page, origin, title, description, ogImage }) {
  const canonical = absolute(origin, lang, page)
  const image = `${origin.replace(/\/$/, '')}/${ogImage || business.seo.defaultOgImage}`
  const verification = real(business.analytics.googleSiteVerification)

  return join(
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${esc(canonical)}">`,
    verification && `<meta name="google-site-verification" content="${esc(verification)}">`,

    // Языковые версии. Пока язык один, hreflang не нужен вовсе —
    // Google расценивает ссылку страницы саму на себя как шум.
    langs.length > 1 &&
      join(
        langs
          .map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(absolute(origin, l, page))}">`)
          .join(''),
        `<link rel="alternate" hreflang="x-default" href="${esc(absolute(origin, DEFAULT_LANG, page))}">`,
      ),

    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(business.brand.name)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(canonical)}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    `<meta property="og:locale" content="${esc(t.meta.locale)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,

    `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`,
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
    `<meta name="theme-color" content="#8DB848">`,

    // Шрифт лежит у нас — без обращения к сторонним доменам, страница рисуется сразу.
    `<link rel="preload" href="/fonts/comfortaa-latin.woff2" as="font" type="font/woff2" crossorigin>`,
    `<link rel="stylesheet" href="/styles.css">`,
  )
}

/**
 * Google Consent Mode v2 + gtag. Скрипты подключаются только если в business.json
 * заданы ID — до этого сайт работает и без них.
 */
function analytics(business) {
  const ga4 = real(business.analytics.ga4MeasurementId)
  const ads = real(business.analytics.googleAdsId)
  if (!ga4 && !ads) return ''

  const ids = [ga4, ads].filter(Boolean)
  return join(
    `<script>`,
    `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}`,
    // По умолчанию всё запрещено, пока гость не согласился — требование для трафика из ЕС.
    `gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});`,
    `try{if(localStorage.getItem('buba-consent')==='granted'){gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'})}}catch(e){}`,
    `gtag('js',new Date());`,
    ids.map((id) => `gtag('config','${esc(id)}');`).join(''),
    `</script>`,
    `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(ids[0])}"></script>`,
  )
}

/** Метки конверсий уезжают в клиентский скрипт, чтобы он их отправлял по кликам. */
function conversionConfig(business) {
  const ads = real(business.analytics.googleAdsId)
  const labels = Object.fromEntries(
    Object.entries(business.analytics.conversionLabels ?? {}).filter(([, v]) => real(v)),
  )
  return `<script>window.BUBA={adsId:${JSON.stringify(ads)},labels:${JSON.stringify(labels)}};</script>`
}

/**
 * Иконки соцсетей и WhatsApp в правом верхнем углу.
 * SVG прямо в разметке: три иконки весят меньше килобайта и рисуются
 * вместе со страницей — никакого мигания пустых квадратов при загрузке.
 * Плашка появляется только у той сети, ссылка на которую заполнена.
 */
const ICONS = {
  instagram:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.15" fill="currentColor" stroke="none"/></svg>',
  tiktok:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.53.02c1.31-.02 2.6-.01 3.9-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97a10.6 10.6 0 0 1-1.62-.93c-.01 2.92.01 5.84-.02 8.75a7.6 7.6 0 0 1-1.35 3.94 7.44 7.44 0 0 1-5.91 3.21 7.3 7.3 0 0 1-4.08-1.03A7.6 7.6 0 0 1 1.59 17.2a12 12 0 0 1-.01-1.49 7.6 7.6 0 0 1 2.58-4.96 7.3 7.3 0 0 1 6.15-1.72c.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87a3.3 3.3 0 0 0 2.77-1.61c.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
  whatsapp:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.08-.12-.28-.2-.57-.35M12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.43 9.89-9.88 9.89m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45c6.55 0 11.89-5.34 11.89-11.9a11.82 11.82 0 0 0-3.48-8.4"/></svg>',
}

function socialBar({ t, business }) {
  const wa = waLink(real(business.contacts.whatsapp), 'Hi! I would like to order.')
  const items = [
    { key: 'instagram', href: real(business.social.instagram), label: 'Instagram' },
    { key: 'tiktok', href: real(business.social.tiktok), label: 'TikTok' },
    { key: 'whatsapp', href: wa, label: 'WhatsApp', track: 'whatsapp' },
  ].filter((item) => item.href)

  if (!items.length) return ''

  return join(
    `<div class="social-bar">`,
    items
      .map(
        (item) =>
          `<a${attrs({
            class: 'social-link',
            href: item.href,
            'aria-label': item.label,
            title: item.label,
            'data-track': item.track ?? null,
            target: '_blank',
            rel: 'noopener',
          })}>${ICONS[item.key]}</a>`,
      )
      .join(''),
    `</div>`,
  )
}

function header({ t, business, lang, langs, page }) {
  const wa = waLink(
    real(business.contacts.whatsapp),
    lang === 'ru' ? 'Здравствуйте! Хочу сделать заказ.' : 'Hi! I would like to order.',
  )

  const navLinks = NAV_PAGES.map((p) => {
    const href = url(lang, p)
    const current = p === page
    return `<a${attrs({ href, 'aria-current': current ? 'page' : null, class: current ? 'is-current' : null })}>${esc(t.nav[p])}</a>`
  }).join('')

  // Переключатель прячем, пока язык один — выбирать не из чего.
  const langLinks =
    langs.length > 1
      ? langs
          .map((l) => {
            const current = l === lang
            return `<a${attrs({
              href: url(l, page),
              lang: l,
              hreflang: l,
              class: current ? 'is-current' : null,
              'aria-current': current ? 'true' : null,
            })}>${esc(l.toUpperCase())}</a>`
          })
          .join('')
      : ''

  return join(
    `<a class="skip" href="#main">${esc(t.common.skipToContent)}</a>`,
    `<header class="site-header">`,
    `<div class="wrap header-inner">`,
    `<a class="logo" href="${url(lang, 'home')}" aria-label="${esc(business.brand.name)}">`,
    `<img src="/logo/logo_short_black.svg" alt="${esc(business.brand.name)}" width="112" height="30" fetchpriority="high">`,
    `</a>`,
    `<nav class="nav" aria-label="${esc(t.nav.menu)}">${navLinks}</nav>`,
    // Плашки видны на любой ширине — на телефоне это первое, что попадает
    // под большой палец, и самый короткий путь до заказа.
    socialBar({ t, business }),
    `<div class="header-actions">`,
    langLinks && `<nav class="lang" aria-label="${esc(t.common.langSwitcher)}">${langLinks}</nav>`,
    // Кнопка ведёт в то же окно выбора, что и «Order online» на первом экране:
    // WhatsApp у гостя теперь и так под рукой — в плашке рядом.
    `<a class="btn btn-sm" href="${url(lang, 'delivery')}" data-order-open>${esc(t.common.orderOnline)}</a>`,
    `</div>`,
    `<button class="burger" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="${esc(t.nav.menu)}"><span></span><span></span><span></span></button>`,
    `</div>`,
    `<nav class="mobile-nav" id="mobile-nav" hidden aria-label="${esc(t.nav.menu)}">`,
    `<div class="wrap">`,
    NAV_PAGES.map((p) => `<a href="${url(lang, p)}">${esc(t.nav[p])}</a>`).join(''),
    `<a class="btn" href="${url(lang, 'delivery')}" data-order-open>${esc(t.common.orderOnline)}</a>`,
    `</div>`,
    `</nav>`,
    `</header>`,
  )
}

function footer({ t, business, lang }) {
  const location = business.locations[0]
  const address = real(location?.address)
  const phone = real(business.contacts.phone)
  const email = real(business.contacts.email)
  const instagram = real(business.social.instagram)
  const tiktok = real(business.social.tiktok)
  const year = new Date().getFullYear()

  return join(
    `<footer class="site-footer">`,
    `<div class="wrap footer-grid">`,

    `<div class="footer-brand">`,
    `<img src="/logo/logo_short_white.svg" alt="${esc(business.brand.name)}" width="126" height="34" loading="lazy">`,
    address && `<p class="footer-address">${esc(address)}</p>`,
    `</div>`,

    `<div class="footer-col">`,
    `<h2>${esc(t.nav.menu)}</h2>`,
    NAV_PAGES.map((p) => `<a href="${url(lang, p)}">${esc(t.nav[p])}</a>`).join(''),
    `</div>`,

    // Колонка контактов появляется, только когда есть хоть один контакт.
    (phone || email || instagram || tiktok) &&
      join(
        `<div class="footer-col">`,
        `<h2>${esc(t.nav.visit)}</h2>`,
        phone && `<a href="tel:${esc(phone.replace(/[^\d+]/g, ''))}" data-track="call">${esc(phone)}</a>`,
        email && `<a href="mailto:${esc(email)}">${esc(email)}</a>`,
        instagram && `<a href="${esc(instagram)}" target="_blank" rel="noopener">Instagram</a>`,
        tiktok && `<a href="${esc(tiktok)}" target="_blank" rel="noopener">TikTok</a>`,
        `</div>`,
      ),

    `<div class="footer-col">`,
    `<h2>${esc(t.common.privacy)}</h2>`,
    `<a href="${url(lang, 'privacy')}">${esc(t.common.privacy)}</a>`,
    `<a href="${url(lang, 'terms')}">${esc(t.common.terms)}</a>`,
    `<button type="button" class="linklike" data-consent-reopen>${esc(t.consent.settings)}</button>`,
    `</div>`,

    `</div>`,
    `<div class="wrap footer-bottom">`,
    `<small>© ${year} ${esc(business.brand.name)}. ${esc(t.common.allRightsReserved)}</small>`,
    `</div>`,
    `</footer>`,
  )
}

/**
 * Окно выбора сервиса доставки. Рисуется один раз на страницу и открывается
 * любой кнопкой «Order online». Нативный <dialog> — сам закрывается по Esc,
 * сам блокирует фон и не требует библиотек.
 *
 * Кнопки при этом остаются обычными ссылками на страницу доставки: если
 * скрипт не загрузился, гость просто попадёт туда, а не упрётся в мёртвую кнопку.
 */
function orderDialog({ t, business }) {
  const gofood = real(business.delivery?.gofood)
  const grabfood = real(business.delivery?.grabfood)
  if (!gofood && !grabfood) return ''

  const option = (href, label, primary) =>
    href
      ? `<a class="btn${primary ? '' : ' btn-ghost'}" href="${esc(href)}" data-track="delivery" target="_blank" rel="noopener">${esc(label)}</a>`
      : ''

  return join(
    `<dialog class="order-modal" id="order-modal" aria-labelledby="order-modal-title">`,
    `<div class="order-modal-inner">`,
    `<button type="button" class="order-modal-close" data-order-close aria-label="${esc(t.common.orderModal.close)}">&times;</button>`,
    `<h2 id="order-modal-title">${esc(t.common.orderModal.title)}</h2>`,
    `<p>${esc(t.common.orderModal.lead)}</p>`,
    `<div class="order-modal-actions">`,
    option(gofood, t.pages.delivery.options.gofood.title, true),
    option(grabfood, t.pages.delivery.options.grabfood.title, false),
    `</div>`,
    `</div>`,
    `</dialog>`,
  )
}

function consentBanner({ t, lang }) {
  return join(
    `<div class="consent" id="consent" hidden role="dialog" aria-modal="false" aria-labelledby="consent-title">`,
    `<div class="consent-inner">`,
    `<div>`,
    `<strong id="consent-title">${esc(t.consent.title)}</strong>`,
    `<p>${esc(t.consent.text)} <a href="${url(lang, 'privacy')}">${esc(t.consent.more)}</a></p>`,
    `</div>`,
    `<div class="consent-actions">`,
    `<button type="button" class="btn btn-ghost" data-consent="denied">${esc(t.consent.decline)}</button>`,
    `<button type="button" class="btn" data-consent="granted">${esc(t.consent.accept)}</button>`,
    `</div>`,
    `</div>`,
    `</div>`,
  )
}

/**
 * Собирает страницу целиком.
 * `structuredData` — массив объектов JSON-LD, специфичных для страницы.
 */
export function page({
  t,
  business,
  lang,
  langs = [DEFAULT_LANG],
  page: pageKey,
  origin,
  title,
  description,
  ogImage,
  body,
  structuredData = [],
  bodyClass,
}) {
  const jsonLd = structuredData.length
    ? `<script type="application/ld+json">${JSON.stringify(
        structuredData.length === 1 ? structuredData[0] : structuredData,
      ).replace(/</g, '\\u003c')}</script>`
    : ''

  return join(
    `<!doctype html>`,
    `<html lang="${esc(lang)}">`,
    `<head>`,
    head({ t, business, lang, langs, page: pageKey, origin, title, description, ogImage }),
    analytics(business),
    conversionConfig(business),
    `</head>`,
    `<body${attrs({ class: bodyClass })}>`,
    header({ t, business, lang, langs, page: pageKey }),
    `<main id="main">${body}</main>`,
    footer({ t, business, lang }),
    orderDialog({ t, business }),
    consentBanner({ t, lang }),
    jsonLd,
    `<script src="/app.js" defer></script>`,
    `</body>`,
    `</html>`,
  )
}
