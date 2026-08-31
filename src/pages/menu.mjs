/** Меню целиком. Данные — из Poster, руками ничего не правится. */

import { esc, join } from '../lib/html.mjs'
import { itemCard, closingCta } from '../lib/blocks.mjs'
import { businessJsonLd } from './home.mjs'

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')

export default function menuPage({ t, business, menu, lang, origin }) {
  const p = t.pages.menu
  const categories = menu.categories ?? []

  const body = join(
    `<section class="page-head">`,
    `<div class="wrap narrow">`,
    `<h1>${esc(p.h1)}</h1>`,
    `<p class="lead">${esc(p.lead)}</p>`,
    // Вопрос про молоко возникает именно здесь, у карточек напитков.
    p.milkNote && `<p class="note">${esc(p.milkNote)}</p>`,
    `</div>`,
    `</section>`,

    categories.length === 0
      ? `<section class="section"><div class="wrap narrow"><p>${esc(p.emptyNote)}</p></div></section>`
      : join(
          // Якорная навигация — на телефоне это единственный способ не скроллить 55 позиций.
          `<nav class="menu-jump" aria-label="${esc(p.jumpTo)}">`,
          `<div class="wrap">`,
          categories
            .map((c) => `<a href="#${esc(slug(c.name))}">${esc(c.name)}</a>`)
            .join(''),
          `</div>`,
          `</nav>`,

          categories
            .map((category) =>
              join(
                `<section class="section menu-section" id="${esc(slug(category.name))}">`,
                `<div class="wrap">`,
                `<h2>${esc(category.name)}</h2>`,
                `<ul class="items">`,
                category.items.map((item) => itemCard(item)).join(''),
                `</ul>`,
                `</div>`,
                `</section>`,
              ),
            )
            .join(''),

          `<div class="wrap narrow"><p class="note">${esc(t.common.menuSyncedNote)}</p></div>`,
        ),

    closingCta({ t, business, lang, title: p.ctaTitle, lead: p.ctaLead }),
  )

  return {
    title: p.title,
    description: p.description,
    body,
    structuredData: [businessJsonLd({ business, menu, lang, origin, includeMenuItems: true })],
  }
}
