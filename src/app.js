/* ============================================================================
   Buba Tea — клиентский скрипт.
   Ванильный JS, ~4 КБ, грузится с defer. Никаких библиотек: страница должна
   открываться мгновенно даже на слабой мобильной сети — от этого напрямую
   зависит цена клика в Google Ads.
   ========================================================================== */
;(function () {
  'use strict'

  var BALI_TZ = 'Asia/Makassar' // WITA, UTC+8 — часовой пояс кафе, а не гостя
  var CONSENT_KEY = 'buba-consent'
  var cfg = window.BUBA || { adsId: null, labels: {} }

  /* ── Мобильное меню ─────────────────────────────────────────────────── */

  var burger = document.querySelector('.burger')
  var mobileNav = document.getElementById('mobile-nav')

  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true'
      burger.setAttribute('aria-expanded', String(!open))
      mobileNav.hidden = open
    })
  }

  /* ── Часы работы ────────────────────────────────────────────────────── */

  var DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

  /** Текущее время на Бали как {day:'mon', minutes: 754}. */
  function baliNow() {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: BALI_TZ,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date())

    var get = function (type) {
      for (var i = 0; i < parts.length; i++) if (parts[i].type === type) return parts[i].value
      return ''
    }

    var weekday = get('weekday').toLowerCase().slice(0, 3)
    var hour = parseInt(get('hour'), 10)
    // Некоторые движки отдают 24 вместо 00 для полуночи.
    if (hour === 24) hour = 0
    return { day: weekday, minutes: hour * 60 + parseInt(get('minute'), 10) }
  }

  var toMinutes = function (hhmm) {
    var bits = String(hhmm).split(':')
    return parseInt(bits[0], 10) * 60 + parseInt(bits[1], 10)
  }

  var fmt = function (template, time) {
    return String(template).replace('{time}', time)
  }

  /**
   * Открыто ли сейчас. Учитывает смены, уходящие за полночь (например 08:00–01:00):
   * в этом случае проверяем ещё и вчерашний интервал.
   */
  function openState(hours) {
    var now = baliNow()
    var todayIndex = DAYS.indexOf(now.day)
    if (todayIndex < 0) return null

    var today = hours[now.day]
    if (today) {
      var opens = toMinutes(today[0])
      var closes = toMinutes(today[1])
      var overnight = closes <= opens
      if (!overnight && now.minutes >= opens && now.minutes < closes) {
        return { open: true, until: today[1], today: now.day }
      }
      if (overnight && now.minutes >= opens) {
        return { open: true, until: today[1], today: now.day }
      }
      if (!overnight && now.minutes < opens) {
        return { open: false, next: today[0], today: now.day }
      }
    }

    // Вчерашняя смена могла ещё не закончиться.
    var yesterday = hours[DAYS[(todayIndex + 6) % 7]]
    if (yesterday && toMinutes(yesterday[1]) <= toMinutes(yesterday[0])) {
      if (now.minutes < toMinutes(yesterday[1])) {
        return { open: true, until: yesterday[1], today: now.day }
      }
    }

    // Ищем ближайший день, когда откроемся.
    for (var step = 1; step <= 7; step++) {
      var day = DAYS[(todayIndex + step) % 7]
      if (hours[day]) return { open: false, next: hours[day][0], today: now.day }
    }
    return { open: false, today: now.day }
  }

  function readHours(el) {
    try {
      return JSON.parse(el.getAttribute('data-hours'))
    } catch (e) {
      return null
    }
  }

  document.querySelectorAll('[data-open-badge]').forEach(function (badge) {
    var hours = readHours(badge)
    if (!hours) return
    var state = openState(hours)
    if (!state) return

    if (state.open) {
      badge.textContent = state.until
        ? badge.dataset.labelOpen + ' · ' + fmt(badge.dataset.labelUntil, state.until)
        : badge.dataset.labelOpen
      badge.setAttribute('data-state', 'open')
    } else {
      badge.textContent = state.next
        ? badge.dataset.labelClosed + ' · ' + fmt(badge.dataset.labelOpens, state.next)
        : badge.dataset.labelClosed
      badge.setAttribute('data-state', 'closed')
    }
    badge.hidden = false
  })

  document.querySelectorAll('.hours[data-hours]').forEach(function (table) {
    var hours = readHours(table)
    if (!hours) return
    var state = openState(hours)
    if (!state) return
    var row = table.querySelector('tr[data-day="' + state.today + '"]')
    if (row) row.setAttribute('data-today', '')
  })

  /* ── Cookie и режим согласия ────────────────────────────────────────── */

  var banner = document.getElementById('consent')

  function storedConsent() {
    try {
      return localStorage.getItem(CONSENT_KEY)
    } catch (e) {
      return null
    }
  }

  function applyConsent(value) {
    try {
      localStorage.setItem(CONSENT_KEY, value)
    } catch (e) {
      /* приватный режим — просто не запоминаем */
    }
    if (typeof window.gtag === 'function') {
      var granted = value === 'granted' ? 'granted' : 'denied'
      window.gtag('consent', 'update', {
        ad_storage: granted,
        ad_user_data: granted,
        ad_personalization: granted,
        analytics_storage: granted,
      })
    }
    if (banner) banner.hidden = true
  }

  if (banner) {
    if (!storedConsent()) banner.hidden = false
    banner.querySelectorAll('[data-consent]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyConsent(btn.getAttribute('data-consent'))
      })
    })
  }

  document.querySelectorAll('[data-consent-reopen]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (banner) banner.hidden = false
    })
  })

  /* ── Окно выбора доставки ───────────────────────────────────────────── */

  var orderModal = document.getElementById('order-modal')

  if (orderModal && typeof orderModal.showModal === 'function') {
    document.querySelectorAll('[data-order-open]').forEach(function (trigger) {
      trigger.addEventListener('click', function (event) {
        // Отменяем переход на страницу доставки только если окно реально открылось.
        event.preventDefault()
        orderModal.showModal()
      })
    })

    orderModal.querySelectorAll('[data-order-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        orderModal.close()
      })
    })

    // Клик по затемнению вокруг окна — тоже закрытие.
    orderModal.addEventListener('click', function (event) {
      if (event.target === orderModal) orderModal.close()
    })

    // Выбрали сервис — окно больше не нужно, гость уходит в приложение.
    orderModal.querySelectorAll('a[href]').forEach(function (link) {
      link.addEventListener('click', function () {
        orderModal.close()
      })
    })
  }

  /* ── Карусель напитков на первом экране ─────────────────────────────── */

  var ROTATE_MS = 4200
  var calmMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  document.querySelectorAll('[data-carousel]').forEach(function (car) {
    var cups = [].slice.call(car.querySelectorAll('.hero-cup'))
    var dots = [].slice.call(car.querySelectorAll('.hero-dot'))
    if (cups.length < 2) return

    var current = 0
    var timer = null

    function render() {
      cups.forEach(function (cup, n) {
        // Сдвиг относительно переднего: 0 — впереди, 1 — справа, дальше слева.
        var rel = (n - current + cups.length) % cups.length
        cup.dataset.pos = rel === 0 ? 'front' : rel === 1 ? 'right' : 'left'
      })
      dots.forEach(function (dot, n) {
        dot.setAttribute('aria-selected', String(n === current))
        dot.tabIndex = n === current ? 0 : -1
      })
    }

    function show(index) {
      current = (index + cups.length) % cups.length
      render()
    }

    function start() {
      // При просьбе уменьшить движение стаканы не крутятся сами.
      if (calmMotion || timer) return
      timer = setInterval(function () {
        show(current + 1)
      }, ROTATE_MS)
    }

    function stop() {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    dots.forEach(function (dot, n) {
      dot.addEventListener('click', function () {
        show(n)
        // После ручного выбора даём посмотреть, не выдёргивая следующий стакан.
        stop()
        start()
      })
    })

    // Наведение и фокус останавливают вращение — иначе не разглядеть.
    car.addEventListener('mouseenter', stop)
    car.addEventListener('mouseleave', start)
    car.addEventListener('focusin', stop)
    car.addEventListener('focusout', start)

    // Во вкладке на фоне крутить незачем.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop()
      else start()
    })

    render()
    start()
  })

  /* ── Карусель отзывов ───────────────────────────────────────────────── */

  var REVIEW_MS = 6500

  document.querySelectorAll('[data-reviews]').forEach(function (box) {
    var slides = [].slice.call(box.querySelectorAll('[data-review]'))
    var dots = [].slice.call(box.querySelectorAll('.hero-dot'))
    if (slides.length < 2) return

    var current = 0
    var timer = null

    function render() {
      slides.forEach(function (slide, n) {
        slide.hidden = n !== current
      })
      dots.forEach(function (dot, n) {
        dot.setAttribute('aria-selected', String(n === current))
        dot.tabIndex = n === current ? 0 : -1
      })
    }

    function show(index) {
      current = (index + slides.length) % slides.length
      render()
    }

    function start() {
      if (calmMotion || timer) return
      timer = setInterval(function () {
        show(current + 1)
      }, REVIEW_MS)
    }

    function stop() {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    dots.forEach(function (dot, n) {
      dot.addEventListener('click', function () {
        show(n)
        // После ручного выбора отсчёт начинается заново — иначе отзыв
        // мог бы смениться через полсекунды после клика.
        stop()
        start()
      })
    })

    // Читающему нужно время: наведение и фокус останавливают листание.
    box.addEventListener('mouseenter', stop)
    box.addEventListener('mouseleave', start)
    box.addEventListener('focusin', stop)
    box.addEventListener('focusout', start)

    render()
    start()
  })

  /* ── Вкладки с напитками ────────────────────────────────────────────── */

  document.querySelectorAll('.drinks-tabs').forEach(function (tablist) {
    var tabs = [].slice.call(tablist.querySelectorAll('[role="tab"]'))
    if (!tabs.length) return

    function select(tab, moveFocus) {
      tabs.forEach(function (other) {
        var chosen = other === tab
        other.setAttribute('aria-selected', String(chosen))
        other.tabIndex = chosen ? 0 : -1
        var panel = document.getElementById(other.getAttribute('aria-controls'))
        if (panel) panel.hidden = !chosen
      })
      if (moveFocus) tab.focus()
      // Активная вкладка подъезжает в видимую часть полосы на телефоне.
      if (tab.scrollIntoView) tab.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        select(tab, false)
      })
    })

    // Стрелки, Home и End — как в обычном наборе вкладок.
    tablist.addEventListener('keydown', function (event) {
      var i = tabs.indexOf(document.activeElement)
      if (i < 0) return
      var next =
        event.key === 'ArrowRight' ? i + 1
        : event.key === 'ArrowLeft' ? i - 1
        : event.key === 'Home' ? 0
        : event.key === 'End' ? tabs.length - 1
        : -1
      if (next === -1) return
      event.preventDefault()
      select(tabs[(next + tabs.length) % tabs.length], true)
    })
  })

  /* ── Конверсии ──────────────────────────────────────────────────────── */

  /**
   * Отправляет событие в GA4 и, если для действия задана метка, конверсию в Google Ads.
   * Пока ID не заполнены в business.json, gtag просто отсутствует и мы молча выходим.
   * `params` — необязательные параметры события (outlet, platform, page).
   */
  function track(action, params) {
    if (typeof window.gtag !== 'function') return
    if (params) window.gtag('event', 'buba_' + action, params)
    else window.gtag('event', 'buba_' + action)

    // Своих измерений в GA4 нет, поэтому точку и сервис кладём ещё и в имя
    // второго события: delivery_ubud_grab, delivery_canggu_gofood. buba_delivery
    // остаётся общим итогом.
    if (action === 'delivery' && params && params.outlet && params.platform) {
      var name = ('delivery_' + params.outlet + '_' + params.platform).toLowerCase()
      window.gtag('event', name, params)
    }

    var label = cfg.labels && cfg.labels[action]
    if (cfg.adsId && label) {
      window.gtag('event', 'conversion', { send_to: cfg.adsId + '/' + label })
    }
  }

  // Кнопки на /links/ и /ubud/ несут data-outlet (canggu|ubud), data-platform
  // (gofood|grab) и data-page — по ним в GA4 видно, какая точка и какой сервис.
  var TRACK_PARAMS = ['outlet', 'platform', 'page']

  document.addEventListener('click', function (event) {
    var el = event.target.closest ? event.target.closest('[data-track]') : null
    if (!el) return
    var params = null
    TRACK_PARAMS.forEach(function (name) {
      var value = el.getAttribute('data-' + name)
      if (value) {
        params = params || {}
        params[name] = value
      }
    })
    track(el.getAttribute('data-track'), params)
  })

  /* ── Форма кейтеринга → WhatsApp ────────────────────────────────────── */

  document.querySelectorAll('.quote-form').forEach(function (form) {
    var errorBox = form.querySelector('[data-form-error]')

    form.addEventListener('submit', function (event) {
      event.preventDefault()

      // Читаем номер при отправке, а не при загрузке: атрибут может быть
      // подставлен позже (например, из CMS или при тестировании).
      var number = (form.getAttribute('data-whatsapp') || '').replace(/\D/g, '')

      var data = new FormData(form)
      var value = function (name) {
        return String(data.get(name) || '').trim()
      }

      if (!value('name') || !value('date')) {
        if (errorBox) {
          errorBox.textContent = form.getAttribute('data-error') || ''
          errorBox.hidden = false
        }
        var firstEmpty = form.querySelector(value('name') ? '[name="date"]' : '[name="name"]')
        if (firstEmpty) firstEmpty.focus()
        return
      }
      if (errorBox) errorBox.hidden = true

      // Собираем читаемое сообщение: подписи берём из самой формы, поэтому
      // текст автоматически приходит на языке страницы.
      var lines = ['Buba Tea — catering request', '']
      form.querySelectorAll('.field').forEach(function (field) {
        var input = field.querySelector('input, select, textarea')
        var labelEl = field.querySelector('span')
        if (!input || !labelEl) return
        var v = String(data.get(input.name) || '').trim()
        // Поле даты отдаёт 2026-09-12 — в сообщении читабельнее 12.09.2026.
        if (input.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
          var d = v.split('-')
          v = d[2] + '.' + d[1] + '.' + d[0]
        }
        if (v) lines.push(labelEl.textContent + ': ' + v)
      })

      var href = 'https://wa.me/' + number + '?text=' + encodeURIComponent(lines.join('\n'))

      track('cateringLead')

      if (!number) {
        // Номер ещё не заполнен в business.json — не отправляем гостя в никуда.
        if (errorBox) {
          errorBox.textContent = 'WhatsApp number is not configured yet.'
          errorBox.hidden = false
        }
        return
      }
      window.open(href, '_blank', 'noopener')
    })
  })
})()
