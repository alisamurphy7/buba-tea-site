#!/usr/bin/env node
/**
 * Следит за кассой и пересобирает сайт, когда меню в Poster изменилось.
 *
 *   npm run watch
 *
 * Каждые несколько минут забирает меню, сравнивает с тем, что лежит в
 * content/menu.json, и пересобирает только при реальном отличии — чтобы
 * не гонять сборку вхолостую. Останавливается по Ctrl+C.
 *
 * Это временное решение на время работы над сайтом. Когда сайт переедет
 * на хостинг, то же самое будет делать расписание на стороне хостинга,
 * и держать открытым терминал не придётся.
 */

import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MENU = join(ROOT, 'content', 'menu.json')

const MINUTES = Number(process.env.WATCH_MINUTES) || 5
const INTERVAL = MINUTES * 60 * 1000

const stamp = () => new Date().toLocaleTimeString('ru-RU')

/** Запускает шаг сборки и ждёт его завершения. */
function run(script) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [join(ROOT, script)], { stdio: 'inherit' })
    child.on('close', (code) => resolve(code === 0))
  })
}

/** Сравниваем только то, что видно на сайте: состав, цены и фото. */
async function fingerprint() {
  if (!existsSync(MENU)) return ''
  const menu = JSON.parse(await readFile(MENU, 'utf8'))
  return JSON.stringify(
    menu.categories.map((c) => [c.name, c.items.map((i) => [i.name, i.price, i.photo])]),
  )
}

async function tick() {
  const before = await fingerprint()

  if (!(await run('scripts/sync-menu.mjs'))) {
    console.log(`${stamp()} — касса не ответила, попробую в следующий раз`)
    return
  }

  const after = await fingerprint()
  if (before === after) {
    console.log(`${stamp()} — в кассе без изменений`)
    return
  }

  console.log(`${stamp()} — меню изменилось, пересобираю сайт`)
  await run('build.mjs')
}

console.log(`Слежу за кассой каждые ${MINUTES} мин. Остановить — Ctrl+C.\n`)
await tick()
setInterval(tick, INTERVAL)
