#!/usr/bin/env node
/**
 * Собирает статический сайт в dist/.
 *
 *   npm run build     — собрать
 *   npm run dev       — собрать и поднять локальный сервер
 *   npm run sync      — обновить меню из Poster
 *
 * Ничего не устанавливает: только Node. Результат — обычные HTML-файлы,
 * которые кладутся на любой хостинг.
 */

import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { minify } from './src/lib/html.mjs'
import { page as renderShell, real, isTodo } from './src/lib/layout.mjs'
import { activeLangs, PAGES, DEFAULT_LANG, url, outputPath, absolute } from './src/lib/routes.mjs'

import home from './src/pages/home.mjs'
import menuPage from './src/pages/menu.mjs'
import delivery from './src/pages/delivery.mjs'
import catering from './src/pages/catering.mjs'
import visit from './src/pages/visit.mjs'
import { privacy, terms } from './src/pages/legal.mjs'

const ROOT = dirname(fileURLToPath(import.meta.url))
const DIST = join(ROOT, 'dist')

const RENDERERS = { home, menu: menuPage, delivery, catering, visit, privacy, terms }

/** Юридические страницы из карты сайта исключаем — они не для поиска. */
const SITEMAP_SKIP = new Set(['privacy', 'terms'])

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))

/** Рекурсивно собирает все TODO из business.json, чтобы предупредить о незаполненном. */
function findTodos(value, path = []) {
  if (typeof value === 'string') return isTodo(value) ? [path.join('.')] : []
  if (Array.isArray(value)) return value.flatMap((v, i) => findTodos(v, [...path, i]))
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter(([key]) => !key.startsWith('_'))
      .flatMap(([key, v]) => findTodos(v, [...path, key]))
  }
  return []
}

function resolveOrigin(business) {
  const domain = real(business.brand.domain)
  if (process.env.SITE_ORIGIN) return process.env.SITE_ORIGIN.replace(/\/$/, '')
  if (domain) return domain.startsWith('http') ? domain.replace(/\/$/, '') : `https://${domain}`
  return 'https://buba-tea.example' // временный, пока нет домена
}

async function main() {
  const business = await readJson(join(ROOT, 'content', 'business.json'))

  const menuPath = join(ROOT, 'content', 'menu.json')
  const menu = existsSync(menuPath) ? await readJson(menuPath) : { categories: [] }
  if (!menu.categories.length) {
    console.warn('⚠️  Меню пустое. Запусти `npm run sync`, чтобы забрать его из Poster.')
  }

  const LANGS = activeLangs(business)

  const photoMapPath = join(ROOT, 'content', 'drink-photos.json')
  const photoMapRaw = existsSync(photoMapPath) ? await readJson(photoMapPath) : {}
  // Служебные ключи и незаполненные строки отбрасываем сразу.
  const photoMap = Object.fromEntries(
    Object.entries(photoMapRaw).filter(([k, v]) => !k.startsWith('_') && v),
  )

  // Кусочки фрукта для первого экрана — просто файлы в папке, по алфавиту.
  const fruitDir = join(ROOT, 'public', 'photos', 'fruit')
  const heroFruit = existsSync(fruitDir)
    ? readdirSync(fruitDir)
        .filter((f) => /\.(webp|png|jpe?g)$/i.test(f))
        .sort()
    : []

  const reviewsPath = join(ROOT, 'content', 'reviews.json')
  const reviews = existsSync(reviewsPath) ? await readJson(reviewsPath) : null

  const translations = Object.fromEntries(
    await Promise.all(
      LANGS.map(async (lang) => [lang, await readJson(join(ROOT, 'content', 'i18n', `${lang}.json`))]),
    ),
  )

  const origin = resolveOrigin(business)
  const buildDate = new Date().toISOString().slice(0, 10)

  await rm(DIST, { recursive: true, force: true })
  await mkdir(DIST, { recursive: true })

  // ── Страницы ────────────────────────────────────────────────────────
  let count = 0
  for (const lang of LANGS) {
    const t = translations[lang]
    for (const pageKey of Object.keys(PAGES)) {
      const render = RENDERERS[pageKey]
      const result = render({ t, business, menu, lang, origin, buildDate, photoMap, heroFruit, reviews })

      const html = minify(
        renderShell({
          t,
          business,
          lang,
          langs: LANGS,
          page: pageKey,
          origin,
          title: result.title,
          description: result.description,
          ogImage: result.ogImage,
          body: result.body,
          structuredData: result.structuredData,
          bodyClass: `page-${pageKey}`,
        }),
      )

      const target = join(DIST, outputPath(lang, pageKey))
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, html)
      count++
    }
  }

  // ── 404 ─────────────────────────────────────────────────────────────
  const t404 = translations[DEFAULT_LANG]
  const nf = t404.pages.notFound
  await writeFile(
    join(DIST, '404.html'),
    minify(
      renderShell({
        t: t404,
        business,
        lang: DEFAULT_LANG,
        langs: LANGS,
        page: 'home',
        origin,
        title: nf.title,
        description: nf.description,
        body: `<section class="section"><div class="wrap narrow center"><h1>${nf.h1}</h1><p class="lead">${nf.lead}</p><div class="cta-row center"><a class="btn" href="${url(DEFAULT_LANG, 'menu')}">${nf.cta}</a></div></div></section>`,
        bodyClass: 'page-404',
      }),
    ),
  )

  // ── Карта сайта и robots ────────────────────────────────────────────
  const urls = LANGS.flatMap((lang) =>
    Object.keys(PAGES)
      .filter((p) => !SITEMAP_SKIP.has(p))
      .map((pageKey) => ({ lang, pageKey })),
  )

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    urls
      .map(({ lang, pageKey }) =>
        [
          '<url>',
          `<loc>${absolute(origin, lang, pageKey)}</loc>`,
          `<lastmod>${buildDate}</lastmod>`,
          // Языковые связки — только когда языков реально больше одного.
          LANGS.length > 1
            ? LANGS.map(
                (alt) =>
                  `<xhtml:link rel="alternate" hreflang="${alt}" href="${absolute(origin, alt, pageKey)}"/>`,
              ).join('') +
              `<xhtml:link rel="alternate" hreflang="x-default" href="${absolute(origin, DEFAULT_LANG, pageKey)}"/>`
            : '',
          '</url>',
        ].join(''),
      )
      .join(''),
    '</urlset>',
  ].join('')
  await writeFile(join(DIST, 'sitemap.xml'), sitemap)

  await writeFile(
    join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
  )

  // ── Статика ─────────────────────────────────────────────────────────
  await cp(join(ROOT, 'public'), DIST, { recursive: true })
  await cp(join(ROOT, 'src', 'styles.css'), join(DIST, 'styles.css'))
  await cp(join(ROOT, 'src', 'app.js'), join(DIST, 'app.js'))

  // ── Итог ────────────────────────────────────────────────────────────
  console.log(`✅ ${count} страниц + 404, sitemap и robots → dist/`)
  console.log(`   Адрес сайта в разметке: ${origin}`)
  console.log(`   Кусочков фрукта на первом экране: ${heroFruit.length}`)

  // Выдуманные отзывы не должны уехать в публикацию незамеченными.
  if (reviews?.placeholder && reviews.items?.length) {
    console.log('')
    console.log('🚨 ОТЗЫВЫ — ЗАГЛУШКА. На сайте сейчас ' + reviews.items.length + ' выдуманных отзыва.')
    console.log('   Публиковать нельзя: это обман гостя, а для Google — повод понизить сайт.')
    console.log('   Замени тексты в content/reviews.json и поставь "placeholder": false.')
  }

  // Позиция могла быть скрыта в кассе — тогда она молча пропадёт с сайта.
  const menuNames = new Set(menu.categories.flatMap((c) => c.items.map((i) => i.name)))
  const missing = [
    ...(business.featured?.signature ?? []),
    ...(business.featured?.travelsWell ?? []),
  ].filter((name) => !menuNames.has(name))
  if (missing.length) {
    console.log('')
    console.log('⚠️  Выбранные позиции пропали из кассы — блоки на сайте стали короче:')
    for (const name of [...new Set(missing)]) console.log('   • ' + name)
    console.log('   Замени их в business.json → featured.')
  }

  const todos = findTodos(business)
  if (todos.length) {
    console.log(`\n⚠️  Не заполнено в content/business.json (${todos.length}):`)
    for (const todo of todos) console.log(`   • ${todo}`)
    console.log('   Блоки с этими данными на сайте пока просто скрыты.')
  }
}

main().catch((err) => {
  console.error(`\n❌ Сборка упала: ${err.stack}\n`)
  process.exit(1)
})
