#!/usr/bin/env node
/**
 * Проверяет собранный dist/ перед публикацией:
 *  • внутренние ссылки ведут на существующие страницы
 *  • все картинки, шрифты и скрипты на месте
 *  • в HTML не утекли заглушки TODO
 *  • у каждой страницы есть title, description и все три hreflang
 *  • длина title и description укладывается в то, что показывает Google
 *
 * Запуск: npm run check
 */

import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { activeLangs } from '../src/lib/routes.mjs'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const DIST = join(ROOT, 'dist')

const TITLE_MAX = 60
const DESCRIPTION_MAX = 160

const problems = []
const warnings = []

async function htmlFiles(dir = DIST, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await htmlFiles(path, acc)
    else if (entry.name.endsWith('.html')) acc.push(path)
  }
  return acc
}

const label = (file) => file.replace(DIST, '').replace(/\\/g, '/') || '/'

/** Превращает /ru/menu/ в путь файла, а /styles.css — в сам файл. */
function targetPath(href) {
  const clean = href.split('#')[0].split('?')[0]
  if (!clean.startsWith('/')) return null
  const asFile = join(DIST, clean)
  if (clean.endsWith('/') || !clean.includes('.')) {
    return join(asFile, 'index.html')
  }
  return asFile
}

async function main() {
  if (!existsSync(DIST)) {
    console.error('❌ Нет папки dist/. Сначала `npm run build`.')
    process.exit(1)
  }

  const business = JSON.parse(await readFile(join(ROOT, 'content', 'business.json'), 'utf8'))
  const langs = activeLangs(business)

  const files = await htmlFiles()
  console.log(`Языки в сборке: ${langs.join(', ')}`)

  for (const file of files) {
    const html = await readFile(file, 'utf8')
    const where = label(file)

    // ── Заглушки ──────────────────────────────────────────────────────
    if (/TODO[: ]/.test(html)) {
      problems.push(`${where}: в HTML попала заглушка TODO`)
    }

    // ── Мета ──────────────────────────────────────────────────────────
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ''

    if (!title) problems.push(`${where}: нет <title>`)
    else if (title.length > TITLE_MAX)
      warnings.push(`${where}: title ${title.length} символов — Google обрежет после ~${TITLE_MAX}`)

    if (!description) problems.push(`${where}: нет description`)
    else if (description.length > DESCRIPTION_MAX)
      warnings.push(
        `${where}: description ${description.length} символов — обрежется после ~${DESCRIPTION_MAX}`,
      )

    if (!/rel="canonical"/.test(html)) problems.push(`${where}: нет canonical`)

    // hreflang нужен только когда языков больше одного.
    if (langs.length > 1) {
      const hreflangs = [...html.matchAll(/hreflang="([a-z-]+)"/g)].map((m) => m[1])
      for (const lang of [...langs, 'x-default']) {
        if (!hreflangs.includes(lang)) problems.push(`${where}: нет hreflang="${lang}"`)
      }
    }

    if (!/<h1[ >]/.test(html)) problems.push(`${where}: нет <h1>`)
    if ((html.match(/<h1[ >]/g) ?? []).length > 1) warnings.push(`${where}: больше одного <h1>`)

    // ── Ссылки и ресурсы ──────────────────────────────────────────────
    const refs = [
      ...[...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]),
      ...[...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]),
      ...[...html.matchAll(/srcset="([^"]+)"/g)].flatMap((m) =>
        m[1].split(',').map((part) => part.trim().split(/\s+/)[0]),
      ),
    ]

    for (const ref of new Set(refs)) {
      if (/^(https?:|mailto:|tel:|#|data:)/.test(ref)) continue
      const target = targetPath(ref)
      if (!target) continue
      if (!existsSync(target)) problems.push(`${where}: битая ссылка ${ref}`)
    }

    // ── Доступность картинок ──────────────────────────────────────────
    for (const tag of html.match(/<img[^>]*>/g) ?? []) {
      if (!/\salt="/.test(tag)) problems.push(`${where}: <img> без alt — ${tag.slice(0, 70)}…`)
    }
  }

  // ── Обязательные файлы ──────────────────────────────────────────────
  for (const required of ['sitemap.xml', 'robots.txt', '404.html', 'styles.css', 'app.js']) {
    if (!existsSync(join(DIST, required))) problems.push(`Не хватает ${required}`)
  }

  // ── Итог ────────────────────────────────────────────────────────────
  console.log(`Проверено страниц: ${files.length}\n`)

  if (warnings.length) {
    console.log(`⚠️  Замечания (${warnings.length}):`)
    for (const w of warnings) console.log(`   • ${w}`)
    console.log('')
  }

  if (problems.length) {
    console.log(`❌ Ошибки (${problems.length}):`)
    for (const p of problems) console.log(`   • ${p}`)
    process.exit(1)
  }

  console.log('✅ Ошибок нет.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
