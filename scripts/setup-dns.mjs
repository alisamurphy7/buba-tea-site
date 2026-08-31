#!/usr/bin/env node
/**
 * Создаёт DNS-записи, чтобы домен показывал сайт из Cloudflare Pages.
 *
 *   npm run dns
 *
 * Ключ читается из site/.env (CLOUDFLARE_API_TOKEN) и никуда не отправляется,
 * кроме самого Cloudflare. В собранный сайт он не попадает.
 *
 * Нужен токен с одним правом: Zone → DNS → Edit для нужной зоны.
 * Тот ключ, что выдаёт `wrangler login`, DNS менять не может — только читать.
 */

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const API = 'https://api.cloudflare.com/client/v4'

const PROJECT = 'buba-tea'
const TARGET = `${PROJECT}.pages.dev`

async function token() {
  const fromEnv = process.env.CLOUDFLARE_API_TOKEN
  if (fromEnv) return fromEnv

  const path = join(ROOT, '.env')
  if (!existsSync(path)) throw new Error('Нет файла site/.env с ключом CLOUDFLARE_API_TOKEN')
  const text = await readFile(path, 'utf8')
  const m = text.match(/^\s*CLOUDFLARE_API_TOKEN\s*=\s*"?([^"\n]*)"?/m)
  const value = (m?.[1] ?? '').trim()
  if (!value) throw new Error('В site/.env строка CLOUDFLARE_API_TOKEN пустая — вставь ключ между кавычками')
  return value
}

async function cf(key, path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...options.headers },
  })
  const json = await res.json()
  if (!json.success) {
    const why = (json.errors ?? []).map((e) => `${e.code}: ${e.message}`).join('; ')
    throw new Error(why || `HTTP ${res.status}`)
  }
  return json.result
}

async function main() {
  const domain = process.argv[2] ?? 'bubateabali.com'
  const key = await token()

  const zones = await cf(key, `/zones?name=${encodeURIComponent(domain)}`)
  const zone = zones[0]
  if (!zone) throw new Error(`Зона ${domain} не найдена в аккаунте`)
  console.log(`→ зона ${zone.name} (${zone.status})`)

  const existing = await cf(key, `/zones/${zone.id}/dns_records`)

  for (const name of [domain, `www.${domain}`]) {
    const already = existing.find((r) => r.name === name)

    // Запись должна идти через Cloudflare (proxied) — иначе не будет https.
    const body = JSON.stringify({ type: 'CNAME', name, content: TARGET, proxied: true })

    if (already) {
      await cf(key, `/zones/${zone.id}/dns_records/${already.id}`, { method: 'PUT', body })
      console.log(`  ✅ обновлено: ${name} → ${TARGET}`)
    } else {
      await cf(key, `/zones/${zone.id}/dns_records`, { method: 'POST', body })
      console.log(`  ✅ создано:   ${name} → ${TARGET}`)
    }
  }

  console.log('\nГотово. Сертификат выпускается несколько минут, потом домен откроется по https.')
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}\n`)
  process.exit(1)
})
