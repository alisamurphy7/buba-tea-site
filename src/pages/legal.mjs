/**
 * Политика конфиденциальности и условия использования.
 * Google Ads не пропускает объявления на сайт, где собираются данные,
 * а политики нет — поэтому эти страницы обязательны, а не «на будущее».
 */

import { esc, join, fill } from '../lib/html.mjs'
import { real } from '../lib/layout.mjs'

export function legalPage(key) {
  return function render({ t, business, buildDate }) {
    const p = t.pages[key]
    const values = {
      legalName: real(business.brand.legalName) ?? business.brand.name,
      email: real(business.contacts.email) ?? '',
      date: buildDate,
    }

    const sections = p.sections
      .map(
        (section) =>
          `<h2>${esc(section.title)}</h2><p>${fill(section.text, values)}</p>`,
      )
      .join('')

    const body = join(
      `<section class="page-head">`,
      `<div class="wrap narrow">`,
      `<h1>${esc(p.h1)}</h1>`,
      `<p class="note">${esc(fill(p.updated, values))}</p>`,
      `</div>`,
      `</section>`,
      `<section class="section">`,
      `<div class="wrap narrow prose">${sections}</div>`,
      `</section>`,
    )

    return { title: p.title, description: p.description, body, noindexInSitemap: true }
  }
}

export const privacy = legalPage('privacy')
export const terms = legalPage('terms')
