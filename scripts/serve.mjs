#!/usr/bin/env node
/** Локальный сервер для просмотра dist/. Только для разработки. */

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, dirname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const PORT = Number(process.env.PORT) || 4321

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

async function resolve(pathname) {
  // normalize + отсечение `..` — чтобы сервер не отдавал файлы выше dist/
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '')
  const candidate = join(DIST, clean)
  if (!candidate.startsWith(DIST)) return null

  try {
    const info = await stat(candidate)
    if (info.isDirectory()) return join(candidate, 'index.html')
    return candidate
  } catch {
    return null
  }
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${PORT}`)
  const file = (await resolve(pathname)) ?? join(DIST, '404.html')

  try {
    const body = await readFile(file)
    res.writeHead(file.endsWith('404.html') ? 404 : 200, {
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    })
    res.end(body)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
  }
}).listen(PORT, () => {
  console.log(`\n  Сайт открыт: http://localhost:${PORT}\n  Остановить: Ctrl+C\n`)
})
