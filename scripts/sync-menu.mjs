#!/usr/bin/env node
/**
 * Тянет меню из Poster POS и кладёт в content/menu.json.
 *
 * Poster — единственный источник правды по меню (то же правило, что и в приложении,
 * см. BubaApp/blueprint/DATA_PRINCIPLES.md). Меняешь меню в Poster → пересобираешь
 * сайт → меню обновилось. Руками menu.json не правим.
 *
 * Токен читается из переменных окружения (GitHub Actions) или из .env
 * (локально) и НИКОГДА не попадает в собранный сайт.
 *
 * Запуск:  npm run sync
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// Ищем .env: сначала свой, потом бэкенда приложения (чтобы не дублировать секреты).
const ENV_CANDIDATES = [
  join(ROOT, '.env'),
  join(ROOT, '..', '..', 'Claude Projects', 'BubaApp', 'apps', 'backend', '.env'),
]

async function loadEnv() {
  // В GitHub Actions файла .env нет — секреты приходят переменными окружения.
  if (process.env.POSTER_TOKEN) {
    return { env: process.env, path: 'переменные окружения' }
  }
  for (const path of ENV_CANDIDATES) {
    if (!existsSync(path)) continue
    const text = await readFile(path, 'utf8')
    const env = {}
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
    if (env.POSTER_TOKEN) return { env, path }
  }
  throw new Error(
    'Не нашёл POSTER_TOKEN — ни в переменных окружения, ни в .env. '
      + 'Локально: создай site/.env со строками POSTER_TOKEN=... и POSTER_ACCOUNT_ID=... '
      + 'В GitHub Actions: задай секрет POSTER_TOKEN в настройках репозитория.',
  )
}

/** `[Toppings]` целиком — служебная категория Poster, в меню не показываем. */
const isInternalName = (name) => /^\s*\[.*\]\s*$/.test(name ?? '')

/** `[Sweetness]Reg` → `Reg`. Скобочные сегменты внутри названия — для персонала. */
const cleanName = (name) => (name ?? '').replace(/\[[^\]]*\]/g, '').trim()

async function poster(env, method, params = {}) {
  const base = (env.POSTER_BASE_URL || 'https://joinposter.com/api/').replace(/\/$/, '')
  const url = new URL(`${base}/${method}`)
  url.searchParams.set('token', env.POSTER_TOKEN)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Poster ${method}: HTTP ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(`Poster ${method}: ${JSON.stringify(json.error)}`)
  return json.response ?? []
}

/** Цена товара в Poster хранится в копейках: делим на 100 → IDR. */
function productPrice(product) {
  const raw = product.price
  if (raw == null) return null
  const values = typeof raw === 'object' ? Object.values(raw) : [raw]
  const numbers = values.map(Number).filter((n) => Number.isFinite(n) && n > 0)
  if (!numbers.length) return null
  return Math.round(Math.min(...numbers) / 100)
}

/**
 * Видимость в Poster устроена по-разному у категорий и у товаров:
 *   категория — массив `visible`  → [{spot_id, visible}]
 *   товар     — массив `spots`    → [{spot_id, visible}]
 * Раньше проверялось только поле `visible`, поэтому скрытые в кассе товары
 * всё равно попадали на сайт: у товара этого поля просто нет.
 */
const visibleSomewhere = (list) =>
  !Array.isArray(list) || !list.length || list.some((s) => Number(s.visible) === 1)

const isVisibleCategory = (category) => visibleSomewhere(category.visible)
const isVisibleProduct = (product) => visibleSomewhere(product.spots)

async function main() {
  const { env, path } = await loadEnv()
  console.log(`→ Читаю Poster (токен из ${path.replace(process.env.HOME, '~')})`)

  const [categories, products] = await Promise.all([
    poster(env, 'menu.getCategories'),
    poster(env, 'menu.getProducts'),
  ])

  // Служебные категории и все их подкатегории вырезаем целиком.
  const internalIds = new Set(
    categories.filter((c) => isInternalName(c.category_name)).map((c) => String(c.category_id)),
  )
  let grew = true
  while (grew) {
    grew = false
    for (const c of categories) {
      const id = String(c.category_id)
      if (!internalIds.has(id) && internalIds.has(String(c.parent_category))) {
        internalIds.add(id)
        grew = true
      }
    }
  }

  const visibleCategories = categories
    .filter((c) => !internalIds.has(String(c.category_id)))
    .filter((c) => String(c.parent_category) === '0')
    .filter((c) => Number(c.category_hidden) !== 1)
    .filter(isVisibleCategory)
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || a.left - b.left)

  const byCategory = new Map()
  for (const p of products) {
    const catId = String(p.menu_category_id)
    if (internalIds.has(catId)) continue
    if (Number(p.hidden) === 1) continue
    if (!isVisibleProduct(p)) continue
    const name = cleanName(p.product_name)
    if (!name) continue

    const price = productPrice(p)
    if (price == null) continue // подарочные карты, служебные позиции

    if (!byCategory.has(catId)) byCategory.set(catId, [])
    byCategory.get(catId).push({
      id: String(p.product_id),
      sortOrder: Number(p.sort_order) || 0,
      name,
      price,
      photo: p.photo ? `https://joinposter.com${p.photo}` : null,
    })
  }

  const menu = {
    syncedAt: new Date().toISOString(),
    currency: 'IDR',
    categories: visibleCategories
      .map((c) => ({
        id: String(c.category_id),
        name: cleanName(c.category_name),
        // Порядок берём из кассы, а не выдумываем свой. У товаров Poster
        // sort_order не заполняет (везде 999), поэтому решает порядок ответа
        // API — тот же, что видно в самой кассе. Сортировка стабильная,
        // так что при равных sort_order исходный порядок сохраняется.
        items: (byCategory.get(String(c.category_id)) ?? []).sort(
          (a, b) => a.sortOrder - b.sortOrder,
        ),
      }))
      .filter((c) => c.items.length > 0),
  }

  await mkdir(join(ROOT, 'content'), { recursive: true })
  await writeFile(join(ROOT, 'content', 'menu.json'), JSON.stringify(menu, null, 2) + '\n')

  const total = menu.categories.reduce((n, c) => n + c.items.length, 0)
  console.log(`✅ ${menu.categories.length} категорий, ${total} позиций → content/menu.json`)
  for (const c of menu.categories) console.log(`   ${c.name} — ${c.items.length}`)
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}\n`)
  process.exit(1)
})
