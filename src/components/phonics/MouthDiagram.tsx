"use client";

import type { MouthShape } from "@/lib/ipa";

const L = "#d4788e";   // upper lip
const LL = "#b85e72";  // lower lip
const D = "#1a0808";   // dark interior
const T = "#f5f3f0";   // upper teeth
const TL = "#e8e5e3";  // lower teeth
const TG = "#e0506a";  // tongue
const BG = "#fdf0ec";  // skin background

function renderShape(shape: MouthShape) {
  switch (shape) {
    case "wide-open":
      return <>
        {/* upper lip band */}
        <path fill={L} d="M 10 27 Q 22 6 40 8 Q 58 6 70 27 Q 60 18 40 18 Q 20 18 10 27 Z"/>
        {/* dark interior */}
        <ellipse cx="40" cy="30" rx="23" ry="13" fill={D}/>
        {/* upper teeth */}
        <rect x="18" y="22" width="44" height="7" rx="3" fill={T}/>
        {/* lower teeth */}
        <rect x="20" y="31" width="40" height="5" rx="2" fill={TL}/>
        {/* tongue */}
        <ellipse cx="40" cy="40" rx="15" ry="5" fill={TG}/>
        {/* lower lip band */}
        <path fill={LL} d="M 10 29 Q 22 52 40 50 Q 58 52 70 29 Q 60 42 40 42 Q 20 42 10 29 Z"/>
      </>;

    case "mid-open-spread":
      return <>
        <path fill={L} d="M 12 27 Q 22 10 40 11 Q 58 10 68 27 Q 58 20 40 20 Q 22 20 12 27 Z"/>
        <ellipse cx="40" cy="30" rx="20" ry="8" fill={D}/>
        <rect x="21" y="24" width="38" height="5" rx="2.5" fill={T}/>
        <rect x="23" y="32" width="34" height="4" rx="2" fill={TL}/>
        <path fill={LL} d="M 12 31 Q 22 46 40 46 Q 58 46 68 31 Q 58 40 40 40 Q 22 40 12 31 Z"/>
      </>;

    case "close-spread":
      return <>
        {/* wide-smile upper lip */}
        <path fill={L} d="M 6 27 Q 18 12 40 13 Q 62 12 74 27 Q 62 21 40 22 Q 18 21 6 27 Z"/>
        {/* narrow opening — mostly teeth */}
        <rect x="10" y="25.5" width="60" height="5" rx="2" fill={D}/>
        <rect x="12" y="25.5" width="56" height="5" rx="2" fill={T}/>
        {/* lower lip */}
        <path fill={LL} d="M 6 29 Q 18 42 40 42 Q 62 42 74 29 Q 62 35 40 35 Q 18 35 6 29 Z"/>
      </>;

    case "mid-open-round":
      return <>
        {/* rounded border ring */}
        <ellipse cx="40" cy="28" rx="22" ry="15" fill="none" stroke={L} strokeWidth="3"/>
        <path fill={L} d="M 18 24 Q 26 8 40 9 Q 54 8 62 24 Q 52 18 40 18 Q 28 18 18 24 Z"/>
        <ellipse cx="40" cy="30" rx="16" ry="10" fill={D}/>
        <path fill={LL} d="M 18 32 Q 26 50 40 48 Q 54 50 62 32 Q 52 42 40 42 Q 28 42 18 32 Z"/>
      </>;

    case "close-round":
      return <>
        {/* rounded forward lips ring */}
        <ellipse cx="40" cy="28" rx="19" ry="16" fill="none" stroke={L} strokeWidth="3"/>
        <path fill={L} d="M 24 24 Q 30 12 40 12 Q 50 12 56 24 Q 50 19 40 19 Q 30 19 24 24 Z"/>
        <circle cx="40" cy="28" r="8" fill={D}/>
        <path fill={LL} d="M 24 32 Q 30 44 40 44 Q 50 44 56 32 Q 50 40 40 40 Q 30 40 24 32 Z"/>
      </>;

    case "mid-neutral":
      return <>
        <path fill={L} d="M 14 26 Q 24 12 40 12 Q 56 12 66 26 Q 56 20 40 20 Q 24 20 14 26 Z"/>
        <ellipse cx="40" cy="29" rx="18" ry="8" fill={D}/>
        <path fill={LL} d="M 14 30 Q 24 46 40 46 Q 56 46 66 30 Q 56 40 40 40 Q 24 40 14 30 Z"/>
      </>;

    case "closed":
      return <>
        <path fill={L} d="M 12 27 Q 22 8 40 10 Q 58 8 68 27 Q 58 22 40 22 Q 22 22 12 27 Z"/>
        {/* lip-press line */}
        <path fill="none" stroke="#c87088" strokeWidth="2" strokeLinecap="round"
              d="M 14 28 Q 28 25 40 26 Q 52 25 66 28"/>
        <path fill={LL} d="M 12 29 Q 22 48 40 46 Q 58 48 68 29 Q 58 34 40 34 Q 22 34 12 29 Z"/>
      </>;

    case "teeth-lip":
      return <>
        {/* upper lip */}
        <path fill={L} d="M 10 21 Q 22 4 40 6 Q 58 4 70 21 Q 60 14 40 14 Q 20 14 10 21 Z"/>
        {/* upper teeth resting on lower lip */}
        <rect x="16" y="18" width="48" height="9" rx="3" fill={T}/>
        {/* lower lip tucked under teeth */}
        <path fill={LL} d="M 14 27 Q 24 44 40 44 Q 56 44 66 27 Q 56 36 40 36 Q 24 36 14 27 Z"/>
      </>;

    case "tongue-between":
      return <>
        {/* upper lip */}
        <path fill={L} d="M 10 22 Q 22 4 40 6 Q 58 4 70 22 Q 60 16 40 16 Q 20 16 10 22 Z"/>
        {/* upper teeth */}
        <rect x="18" y="18" width="44" height="8" rx="3" fill={T}/>
        {/* tongue tip protruding between teeth */}
        <ellipse cx="40" cy="27" rx="13" ry="5" fill={TG}/>
        {/* lower teeth */}
        <rect x="20" y="30" width="40" height="7" rx="2" fill={TL}/>
        {/* lower lip */}
        <path fill={LL} d="M 10 35 Q 22 52 40 52 Q 58 52 70 35 Q 60 46 40 46 Q 20 46 10 35 Z"/>
      </>;

    case "sibilant":
      return <>
        {/* upper lip */}
        <path fill={L} d="M 11 24 Q 22 8 40 9 Q 58 8 69 24 Q 59 18 40 18 Q 21 18 11 24 Z"/>
        {/* upper teeth — close together */}
        <rect x="16" y="20" width="48" height="7" rx="3" fill={T}/>
        {/* narrow dark gap */}
        <rect x="18" y="27" width="44" height="3" fill={D}/>
        {/* lower teeth */}
        <rect x="16" y="30" width="48" height="7" rx="2" fill={TL}/>
        {/* lower lip */}
        <path fill={LL} d="M 11 34 Q 22 50 40 50 Q 58 50 69 34 Q 59 44 40 44 Q 21 44 11 34 Z"/>
      </>;

    case "sh-forward":
      return <>
        {/* forward-rounded border ring */}
        <ellipse cx="40" cy="28" rx="20" ry="16" fill="none" stroke={L} strokeWidth="2.5"/>
        <path fill={L} d="M 22 24 Q 28 10 40 10 Q 52 10 58 24 Q 52 18 40 18 Q 28 18 22 24 Z"/>
        <ellipse cx="40" cy="29" rx="12" ry="8" fill={D}/>
        <path fill={LL} d="M 22 32 Q 28 48 40 46 Q 52 48 58 32 Q 52 40 40 40 Q 28 40 22 32 Z"/>
      </>;

    case "h-open":
      return <>
        <path fill={L} d="M 14 26 Q 24 10 40 12 Q 56 10 66 26 Q 56 19 40 19 Q 24 19 14 26 Z"/>
        <ellipse cx="40" cy="29" rx="19" ry="9" fill={D}/>
        <path fill={LL} d="M 14 30 Q 24 48 40 46 Q 56 48 66 30 Q 56 42 40 42 Q 24 42 14 30 Z"/>
      </>;
  }
}

export function MouthDiagram({ shape, size = 120 }: { shape: MouthShape; size?: number }) {
  const h = Math.round((size * 56) / 80);
  return (
    <svg
      viewBox="0 0 80 56"
      width={size}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="80" height="56" rx="8" fill={BG}/>
      {renderShape(shape)}
    </svg>
  );
}
