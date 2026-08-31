/**
 * Иллюстрации двух других форматов выезда — в пару к тележке из cartIllustration.mjs.
 *
 * Те же самые файлы, что в печатной брошюре (кейтеринг-брошюра/mini-*.svg),
 * поэтому сайт и брошюра показывают одно и то же, а не две похожие картинки.
 *
 * Плоский вектор с мягкими градиентами, без обводок. Пропорции фургона сняты
 * с фотографий: VW T2, длина к высоте примерно 2,2 : 1.
 *
 * {{id}} и {{title}} подставляет страница — из-за них подпись читается
 * скринридером, а id остаётся уникальным, если на странице несколько картинок.
 */

export const VAN_SVG = `
<svg class="format-svg" xmlns="http://www.w3.org/2000/svg" viewBox="108 188 954 514" role="img" aria-labelledby="{{id}}">
  <title id="{{id}}">{{title}}</title>
  <defs>
<linearGradient id="van-pink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#EE9AC0"/>
      <stop offset="1" stop-color="#DA78A6"/>
    </linearGradient>
    <linearGradient id="van-yellow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FBD75B"/>
      <stop offset="1" stop-color="#F0BE2C"/>
    </linearGradient>
    <linearGradient id="van-awning" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#FCE083"/>
      <stop offset="1" stop-color="#F0BE28"/>
    </linearGradient>
    <linearGradient id="van-glass" x1="0.1" y1="0" x2="0.5" y2="1">
      <stop offset="0" stop-color="#4C4844"/>
      <stop offset="1" stop-color="#2B2926"/>
    </linearGradient>
    <clipPath id="van-lower-clip">
      <path d="M150 400 H1050 V530 Q1050 600 990 600 H968 A88 88 0 0 0 792 600 H418 A88 88 0 0 0 242 600 H210 Q150 600 150 530 Z"/>
    </clipPath>
  </defs>

  <path d="M150 400 V272 Q150 200 226 200 H952 Q1050 200 1050 288 V400 Z" fill="url(#van-yellow)"/>
  <rect x="232" y="256" width="410" height="144" rx="12" fill="url(#van-glass)"/>
  <g opacity="0.45" fill="#7A756C">
    <circle cx="336" cy="308" r="26"/><path d="M306 400v-42a30 30 0 0 1 60 0v42z"/>
    <rect x="430" y="300" width="36" height="100" rx="7"/>
    <rect x="486" y="326" width="28" height="74" rx="7"/>
    <rect x="542" y="314" width="32" height="86" rx="7"/>
  </g>
  <g>
    <path d="M128 212 H656 Q666 212 666 222 V240 H128 Q118 240 118 230 V222 Q118 212 128 212 Z" fill="#E9A81C"/>
    <rect x="118" y="206" width="548" height="10" rx="5" fill="#D9971A"/>
    <g fill="#E9A81C">
      <circle cx="140" cy="242" r="9"/><circle cx="188" cy="242" r="9"/><circle cx="236" cy="242" r="9"/>
      <circle cx="284" cy="242" r="9"/><circle cx="332" cy="242" r="9"/><circle cx="380" cy="242" r="9"/>
      <circle cx="428" cy="242" r="9"/><circle cx="476" cy="242" r="9"/><circle cx="524" cy="242" r="9"/>
      <circle cx="572" cy="242" r="9"/><circle cx="620" cy="242" r="9"/><circle cx="656" cy="242" r="9"/>
    </g>
  </g>
  <path d="M906 400 L898 262 Q898 246 916 244 L1016 238 Q1036 240 1036 262 V400 Z" fill="url(#van-glass)"/>
  <rect x="874" y="244" width="16" height="156" rx="6" fill="#E6B428"/>
  <path d="M150 400 H1050 V530 Q1050 600 990 600 H968 A88 88 0 0 0 792 600 H418 A88 88 0 0 0 242 600 H210 Q150 600 150 530 Z" fill="url(#van-pink)"/>
  <rect x="150" y="396" width="900" height="9" fill="#C2648E" opacity="0.5"/>
  <path d="M224 396 H660 Q672 396 672 408 V424 Q672 436 660 436 H224 Q212 436 212 424 V408 Q212 396 224 396 Z" fill="url(#van-yellow)"/>
  <rect x="212" y="432" width="460" height="8" rx="4" fill="#D6A227"/>
  <g clip-path="url(#van-lower-clip)">
    <text x="605" y="480" text-anchor="middle" font-family="Comfortaa, Arial Rounded MT Bold, sans-serif"
          font-weight="700" font-size="54" fill="#F7CE45" letter-spacing="2">BUBA</text>
    <text x="605" y="536" text-anchor="middle" font-family="Comfortaa, Arial Rounded MT Bold, sans-serif"
          font-weight="700" font-size="54" fill="#F7CE45" letter-spacing="2">TEA</text>
    <g transform="translate(752 424)">
      <path d="M34 0 q36 2 46 30 q9 27 -12 44 q-22 18 -48 8 q-26 -10 -26 -38 q0 -30 40 -44z" fill="#F7CE45"/>
      <circle cx="26" cy="44" r="6" fill="#DA78A6"/><circle cx="54" cy="42" r="6" fill="#DA78A6"/>
      <path d="M28 60 q14 12 28 -2" stroke="#DA78A6" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M60 8 q14 -16 28 -10" stroke="#F7CE45" stroke-width="7" fill="none" stroke-linecap="round"/>
    </g>
    <g fill="none" stroke="#F7CE45" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
      <path d="M206 452 h46 l-7 68 h-32z"/><path d="M201 452 h56"/>
      <path d="M230 452 v-22 q0 -11 13 -11"/>
      <circle cx="216" cy="502" r="4.5" fill="#F7CE45" stroke="none"/>
      <circle cx="232" cy="510" r="4.5" fill="#F7CE45" stroke="none"/>
      <circle cx="242" cy="498" r="4.5" fill="#F7CE45" stroke="none"/>
      <path d="M306 462 q24 -12 42 6 q14 16 0 36 q-16 22 -34 10 q-20 -14 -8 -52z"/>
      <path d="M324 458 q4 -14 18 -16"/>
      <path d="M420 470 l9 20 20 4 -14 15 3 21 -18 -11 -18 11 3 -21 -14 -15 20 -4z"/>
    </g>
  </g>
  <circle cx="1004" cy="486" r="23" fill="#F7CE45"/>
  <circle cx="1004" cy="486" r="13" fill="#FCEBA6"/>
  <rect x="956" y="546" width="94" height="16" rx="8" fill="#E8E4DA"/>
  <g>
    <circle cx="330" cy="600" r="90" fill="#2E2B29"/>
    <circle cx="330" cy="600" r="51" fill="#EFECE3"/>
    <circle cx="330" cy="600" r="14" fill="#C7C2B6"/>
    <g fill="#C7C2B6">
      <circle cx="330" cy="569" r="6"/><circle cx="360" cy="591" r="6"/>
      <circle cx="348" cy="627" r="6"/><circle cx="312" cy="627" r="6"/><circle cx="300" cy="591" r="6"/>
    </g>
  </g>
  <g>
    <circle cx="880" cy="600" r="90" fill="#2E2B29"/>
    <circle cx="880" cy="600" r="51" fill="#EFECE3"/>
    <circle cx="880" cy="600" r="14" fill="#C7C2B6"/>
    <g fill="#C7C2B6">
      <circle cx="880" cy="569" r="6"/><circle cx="910" cy="591" r="6"/>
      <circle cx="898" cy="627" r="6"/><circle cx="862" cy="627" r="6"/><circle cx="850" cy="591" r="6"/>
    </g>
  </g>
</svg>
`.trim()

export const KITCHEN_SVG = `
<svg class="format-svg" xmlns="http://www.w3.org/2000/svg" viewBox="-8 -340 416 348" role="img" aria-labelledby="{{id}}">
  <title id="{{id}}">{{title}}</title>
  <defs>
<linearGradient id="ct-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#B2D3C3"/>
      <stop offset="1" stop-color="#96BCAA"/>
    </linearGradient>
    <linearGradient id="ct-roof" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#BBD9CA"/>
      <stop offset="1" stop-color="#A0C4B2"/>
    </linearGradient>
    <clipPath id="ct-panel-clip">
      <rect x="78" y="520" width="564" height="330" rx="14"/>
    </clipPath>
  </defs>
    <rect x="24" y="-332" width="352" height="188" rx="8" fill="#EFECE4"/>
    <g stroke="#E1DCD0" stroke-width="2.6">
      <path d="M24 -286 H376 M24 -240 H376 M24 -194 H376"/>
      <path d="M112 -332 V-144 M200 -332 V-144 M288 -332 V-144"/>
    </g>
    <rect x="62" y="-268" width="276" height="9" rx="4.5" fill="#D5D0C3"/>
    <g>
      <rect x="86" y="-306" width="30" height="38" rx="5" fill="#C0563F"/>
      <rect x="84" y="-312" width="34" height="9" rx="4" fill="#2A211C"/>
      <rect x="130" y="-298" width="28" height="30" rx="5" fill="#D08A3C"/>
      <rect x="128" y="-304" width="32" height="9" rx="4" fill="#2A211C"/>
      <rect x="176" y="-302" width="26" height="34" rx="5" fill="#8DB848"/>
      <rect x="174" y="-308" width="30" height="9" rx="4" fill="#2A211C"/>
      <path d="M262 -268 v-26" stroke="#5B8C61" stroke-width="5" stroke-linecap="round"/>
      <circle cx="262" cy="-300" r="13" fill="#E8C13F"/>
      <circle cx="246" cy="-290" r="9" fill="#EFD067"/>
      <circle cx="278" cy="-291" r="8" fill="#EFD067"/>
    </g>
    <rect x="0" y="-152" width="400" height="20" rx="9" fill="#FFFFFF"/>
    <rect x="0" y="-136" width="400" height="8" rx="4" fill="#DDE5E1"/>
    <rect x="20" y="-128" width="360" height="128" rx="10" fill="url(#ct-body)"/>
    <g fill="none" stroke="#7FA692" stroke-width="3">
      <rect x="44" y="-108" width="140" height="88" rx="6"/>
      <rect x="216" y="-108" width="140" height="88" rx="6"/>
    </g>
    <rect x="20" y="-18" width="360" height="12" rx="6" fill="#7FA692"/>
    <g>
      <rect x="58" y="-240" width="72" height="88" rx="9" fill="#EDE7DF"/>
      <rect x="66" y="-208" width="56" height="52" rx="6" fill="#C0563F"/>
      <rect x="54" y="-252" width="80" height="18" rx="8" fill="#2A211C"/>
      <rect x="85" y="-160" width="18" height="12" rx="4" fill="#2A211C"/>
    </g>
    <g>
      <rect x="150" y="-228" width="66" height="76" rx="9" fill="#EDE7DF"/>
      <rect x="158" y="-200" width="50" height="42" rx="6" fill="#D08A3C"/>
      <rect x="146" y="-240" width="74" height="17" rx="8" fill="#2A211C"/>
      <rect x="174" y="-160" width="18" height="12" rx="4" fill="#2A211C"/>
    </g>
    <g fill="#FFFFFF">
      <path d="M240 -152 h46 l-6 -82 h-34z"/>
      <rect x="236" y="-242" width="54" height="13" rx="6.5"/>
    </g>
    <g>
      <path d="M316 -186 h62 q-4 34 -31 34 q-27 0 -31 -34z" fill="#EFEAE2"/>
      <path d="M322 -182 h50 q-3 22 -25 22 q-22 0 -25 -22z" fill="#8DB848"/>
      <path d="M368 -190 v-30" stroke="#D8C9A8" stroke-width="7" stroke-linecap="round"/>
      <path d="M362 -186 q6 -20 12 0z" fill="#D8C9A8"/>
    </g>
</svg>
`.trim()
