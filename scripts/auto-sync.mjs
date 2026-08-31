#!/usr/bin/env node
/**
 * Автоматическая синхронизация меню с Poster.
 *
 * Запускается по расписанию (launchd, каждые 5 часов) и делает ровно то,
 * что нужно, и не больше:
 *
 *   1. тянет меню из Poster;
 *   2. сравнивает с тем, что было — по имени, цене и фотографии;
 *   3. если ничего не изменилось, останавливается: собирать и выкладывать нечего;
 *   4. если изменилось — собирает сайт, проверяет его и выкладывает.
 *
 * Почему со сравнением, а не «собрать и выложить всегда»: каждый деплой
 * создаёт новую версию в Cloudflare и сбрасывает кэш у посетителей.
 * Делать это раз в пять часов без причины — вредно и шумно.
 *
 * Логи пишутся в logs/auto-sync.log рядом с проектом. Смотреть:
 *   tail -f "site/logs/auto-sync.log"
 *
 * Запустить вручную:  npm run auto-sync
 * Проверить без деплоя: npm run auto-sync -- --dry-run
 */

import { execFile } from 'node:child_process'
import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MENU = join(ROOT, 'content', 'menu.json')
const LOG_DIR = join(ROOT, 'logs')
const LOG = join(LOG_DIR, 'auto-sync.log')

const DRY = process.argv.includes('--dry-run')

/** Отпечаток меню: только то, что реально видно на сайте. */
function fingerprint(menu) {
  return JSON.stringify(
    (menu.categories ?? []).map((c) => [
      c.name,
      c.items.map((i) => [i.name, i.price, i.photo ?? '']),
    ]),
  )
}

const readMenu = async () => {
  if (!existsSync(MENU)) return { categories: [] }
  try {
    return JSON.parse(await readFile(MENU, 'utf8'))
  } catch {
    return { categories: [] }
  }
}

async function log(line) {
  // Локальное время, а не UTC: расписание задано в местных часах,
  // и лог должен читаться в тех же.
  const d = new Date()
  const p2 = (n) => String(n).padStart(2, '0')
  const stamp = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} `
    + `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`
  const text = `${stamp}  ${line}\n`
  process.stdout.write(text)
  await mkdir(LOG_DIR, { recursive: true })
  await appendFile(LOG, text)
}

/** npm-скрипт проекта. Ошибку не глотаем: пусть попадёт в лог. */
const npm = (script) => run('npm', ['run', script], { cwd: ROOT, maxBuffer: 8 * 1024 * 1024 })

async function main() {
  const before = fingerprint(await readMenu())

  await npm('sync')

  const menu = await readMenu()
  const after = fingerprint(menu)
  const positions = (menu.categories ?? []).reduce((n, c) => n + c.items.length, 0)

  if (before === after) {
    await log(`меню не менялось (${positions} позиций) — сборка и деплой не нужны`)
    return
  }

  await log(`меню изменилось (${positions} позиций) — пересобираю`)
  await npm('build')
  await npm('check')

  if (DRY) {
    await log('--dry-run: деплой пропущен')
    return
  }

  const { stdout } = await npm('deploy')
  const url = stdout.match(/https:\/\/[\w.-]+\.pages\.dev/)?.[0] ?? 'адрес не распознан'
  await log(`выложено → ${url}`)
}

main().catch(async (err) => {
  // stderr от npm полезнее, чем стек: там видно, что именно упало.
  await log(`ОШИБКА: ${String(err.stderr || err.message).trim().split('\n').slice(-4).join(' | ')}`)
  process.exit(1)
})
