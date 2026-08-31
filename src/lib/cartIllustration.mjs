/**
 * Рисованная кейтеринг-тележка Buba Tea.
 *
 * Заменила вырезанную фотографию: у вырезки по контуру оставалась бахрома
 * от травы, и на крупном размере это бросалось в глаза. Вектор чёткий на любом
 * экране, весит пару килобайт и живёт в фирменных цветах.
 *
 * Пропорции, цвета и детали сняты с настоящей тележки: мятный корпус #A5C8B7,
 * почти чёрные стойки, навес с логотипом, алфавитный блок на передней панели,
 * спицованное колесо слева и ножки справа.
 *
 * Логотип подключён внешним файлом, а не скопирован путями: один и тот же
 * файл уже загружен для шапки, поэтому это бесплатно.
 * Буквы — обычный текст, поэтому берут Comfortaa со страницы.
 */
export const CART_SVG = `
<svg class="cart-svg" viewBox="0 0 720 1010" role="img" aria-labelledby="cart-title" xmlns="http://www.w3.org/2000/svg">
  <title id="cart-title">{{title}}</title>
  <defs>
    <linearGradient id="cart-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#B2D3C3"/>
      <stop offset="1" stop-color="#96BCAA"/>
    </linearGradient>
    <linearGradient id="cart-roof" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#BBD9CA"/>
      <stop offset="1" stop-color="#A0C4B2"/>
    </linearGradient>
    <clipPath id="cart-panel-clip">
      <rect x="78" y="520" width="564" height="330" rx="14"/>
    </clipPath>
  </defs>

  <!-- Тень-пятно под тележкой -->
  <ellipse cx="360" cy="978" rx="290" ry="20" fill="#3C5148" opacity="0.16"/>

  <!-- Навес -->
  <g>
    <rect x="34" y="28" width="652" height="96" rx="12" fill="url(#cart-roof)"/>
    <rect x="34" y="112" width="652" height="16" rx="8" fill="#7FA692"/>
    <image href="/logo/logo_short_black.svg" x="250" y="52" width="220" height="48" opacity="0.82"/>
  </g>

  <!-- Стойки навеса -->
  <g fill="#131E25">
    <rect x="72" y="124" width="17" height="360" rx="6"/>
    <rect x="631" y="124" width="17" height="360" rx="6"/>
  </g>

  <!-- Утварь на стойке -->
  <g>
    <!-- меню на подставке -->
    <rect x="112" y="330" width="86" height="118" rx="6" fill="#FFFFFF"/>
    <g fill="#C9D3D0">
      <rect x="126" y="352" width="58" height="7" rx="3.5"/>
      <rect x="126" y="370" width="46" height="6" rx="3"/>
      <rect x="126" y="386" width="52" height="6" rx="3"/>
      <rect x="126" y="402" width="38" height="6" rx="3"/>
    </g>

    <!-- два диспенсера с напитками -->
    <g>
      <rect x="216" y="316" width="74" height="132" rx="10" fill="#EDE7DF"/>
      <rect x="224" y="352" width="58" height="88" rx="7" fill="#C0563F"/>
      <rect x="212" y="304" width="82" height="20" rx="8" fill="#2A211C"/>
      <rect x="244" y="440" width="18" height="14" rx="4" fill="#2A211C"/>
    </g>
    <g>
      <rect x="306" y="330" width="70" height="118" rx="10" fill="#EDE7DF"/>
      <rect x="314" y="362" width="54" height="76" rx="7" fill="#D08A3C"/>
      <rect x="302" y="318" width="78" height="19" rx="8" fill="#2A211C"/>
      <rect x="330" y="440" width="18" height="14" rx="4" fill="#2A211C"/>
    </g>

    <!-- растение -->
    <g>
      <path d="M410 448v-40" stroke="#4E7A55" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M410 416c-16-6-26-20-24-36 16 2 27 16 24 36Z" fill="#5B8C61"/>
      <path d="M410 420c14-8 22-24 18-40-15 4-24 20-18 40Z" fill="#6FA477"/>
    </g>

    <!-- ваза с цветами -->
    <g>
      <path d="M470 448h44l-6-52h-32Z" fill="#EFEAE2"/>
      <path d="M492 396v-40" stroke="#5B8C61" stroke-width="5" stroke-linecap="round" fill="none"/>
      <circle cx="492" cy="344" r="15" fill="#E8C13F"/>
      <circle cx="470" cy="360" r="11" fill="#EFD067"/>
      <circle cx="513" cy="358" r="10" fill="#EFD067"/>
    </g>

    <!-- стопка стаканов -->
    <g fill="#FFFFFF">
      <path d="M556 448h50l-7-96h-36Z"/>
      <rect x="551" y="342" width="60" height="14" rx="7"/>
    </g>
    <path d="M563 448h36l-6-84h-24Z" fill="#F1F1F1"/>
  </g>

  <!-- Столешница -->
  <g>
    <rect x="22" y="452" width="676" height="40" rx="14" fill="#FFFFFF"/>
    <rect x="22" y="482" width="676" height="14" rx="7" fill="#DDE5E1"/>
  </g>

  <!-- Корпус -->
  <g>
    <rect x="78" y="496" width="564" height="358" rx="16" fill="url(#cart-body)"/>
    <g clip-path="url(#cart-panel-clip)">
      <image href="/logo/logo_short_black.svg" x="240" y="556" width="200" height="44" opacity="0.86"/>
      <g fill="#1B2A24" font-family="Comfortaa, system-ui, sans-serif" font-size="30" letter-spacing="6" text-anchor="middle" opacity="0.86">
        <text x="340" y="656">a b c d e f g h</text>
        <text x="340" y="700">i j k l m n o p</text>
        <text x="340" y="744">q r s t u v w</text>
        <text x="340" y="788">x y z</text>
      </g>
    </g>
    <rect x="78" y="838" width="564" height="16" rx="8" fill="#7FA692"/>
  </g>

  <!-- Колесо -->
  <g>
    <circle cx="176" cy="884" r="106" fill="none" stroke="#131E25" stroke-width="13"/>
    <circle cx="176" cy="884" r="92" fill="none" stroke="#131E25" stroke-width="3" opacity="0.35"/>
    <g stroke="#9AA6A2" stroke-width="2.6">
      <path d="M176 792v184M84 884h184M111 819l130 130M241 819 111 949"/>
    </g>
    <circle cx="176" cy="884" r="19" fill="#B4483C"/>
    <circle cx="176" cy="884" r="8" fill="#131E25"/>
  </g>

  <!-- Ножки -->
  <g fill="#131E25">
    <rect x="556" y="854" width="15" height="118" rx="6"/>
    <rect x="612" y="854" width="15" height="118" rx="6"/>
    <rect x="540" y="962" width="103" height="14" rx="7"/>
  </g>
</svg>
`.trim()
