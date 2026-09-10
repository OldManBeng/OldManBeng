/**
 * SF-Symbols 风格描边图标（v4.11 HIG 化：全站不用 emoji）。
 * 与 NavIcon 同源参数：fill:none / stroke:currentColor / 1.6 / 圆头圆角。
 * 用法：<Ico name="park" size={18} />；未知 name 回退定位针。
 * 上下文里的块状摆位（简报行/自拍格）由 CSS 设 display:block。
 */
import type { ReactNode } from 'react';

const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export type IconName =
  | 'home' | 'park' | 'gym' | 'market' | 'chess' | 'square' | 'net' | 'car'
  | 'chat' | 'cash' | 'bill' | 'dice' | 'clock' | 'hourglass' | 'bolt' | 'pin'
  | 'heart' | 'spk-on' | 'spk-off' | 'chev-up' | 'chev-down'
  | 'bestie' | 'run' | 'pool' | 'cat' | 'laptop' | 'mountain' | 'boba' | 'iv';

const PATHS: Record<IconName, ReactNode> = {
  // ---- 每日计划 ----
  home: (
    <>
      <path d="M3 9.5 10 3.5l7 6" />
      <path d="M5 8.6v7.9h10V8.6" />
      <path d="M8.4 16.5v-4h3.2v4" />
    </>
  ),
  park: (
    <>
      <path d="M10 3.6 13.4 9h-2.2l3 4.4H5.8l3-4.4H6.6Z" />
      <path d="M10 13.4v3.6" />
    </>
  ),
  gym: (
    <>
      <path d="M6.6 6.4v7.2M4.2 7.9v4.2M13.4 6.4v7.2M15.8 7.9v4.2M6.6 10h6.8" />
    </>
  ),
  market: (
    <>
      <path d="M3.8 8h12.4l-1.2 7.6H5Z" />
      <path d="M6.8 8 10 3.6 13.2 8" />
    </>
  ),
  chess: (
    <>
      <circle cx="10" cy="5.8" r="2.2" />
      <path d="M7.9 14.6c0-3.2.8-4.6 2.1-6 1.3 1.4 2.1 2.8 2.1 6" />
      <path d="M6.4 16.6h7.2" />
    </>
  ),
  square: (
    <>
      <path d="M8.2 15.4V5.6l7-1.2v9.4" />
      <circle cx="6.4" cy="15.4" r="1.8" />
      <circle cx="13.4" cy="13.8" r="1.8" />
    </>
  ),
  net: (
    <>
      <rect x="3.2" y="4.8" width="13.6" height="9.6" rx="2" />
      <path d="M8 17.2h4M10 14.4v2.8" />
    </>
  ),
  car: (
    <>
      <path d="M4.2 12.2 5.4 8.8a2 2 0 0 1 1.9-1.4h5.4a2 2 0 0 1 1.9 1.4l1.2 3.4" />
      <rect x="3.2" y="12.2" width="13.6" height="3.4" rx="1.5" />
      <circle cx="6.6" cy="15.6" r="1.2" />
      <circle cx="13.4" cy="15.6" r="1.2" />
    </>
  ),
  // ---- 简报行 ----
  chat: (
    <>
      <path d="M3.5 7.6a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v4.2a3 3 0 0 1-3 3H8.6l-3.2 2.6v-3.1a3 3 0 0 1-1.9-2.7Z" />
      <path d="M7.2 8.2h5.6M7.2 10.8h3.6" />
    </>
  ),
  cash: (
    <>
      <rect x="3" y="6.4" width="14" height="8" rx="1.8" />
      <circle cx="10" cy="10.4" r="1.9" />
      <path d="M5.4 8.6v.01M14.6 12.2v.01" />
    </>
  ),
  bill: (
    <>
      <path d="M5.4 3.4h9.2v13.2l-1.9-1.4-1.7 1.4-1.7-1.4-1.6 1.4-1.7-1.4-1.6 1.4Z" />
      <path d="M7.8 7h4.4M7.8 9.8h4.4" />
    </>
  ),
  dice: (
    <>
      <rect x="3.8" y="3.8" width="12.4" height="12.4" rx="2.6" />
      <g fill="currentColor" stroke="none">
        <circle cx="7.2" cy="7.2" r="0.95" />
        <circle cx="12.8" cy="7.2" r="0.95" />
        <circle cx="10" cy="10" r="0.95" />
        <circle cx="7.2" cy="12.8" r="0.95" />
        <circle cx="12.8" cy="12.8" r="0.95" />
      </g>
    </>
  ),
  clock: (
    <>
      <circle cx="10" cy="10.4" r="6" />
      <path d="M10 7v3.5l2.5 1.5" />
    </>
  ),
  hourglass: (
    <>
      <path d="M6.6 3.6h6.8M6.6 16.4h6.8" />
      <path d="M7.5 3.6v1.8c0 1.9 5 2.3 5 4.6s-5 2.7-5 4.6v1.8M12.5 3.6v1.8c0 1.9-5 2.3-5 4.6s5 2.7 5 4.6v1.8" />
    </>
  ),
  bolt: <path d="M11.2 3.4 6.4 10.8h3L8.8 16.6l4.8-7.4h-3Z" />,
  pin: (
    <>
      <path d="M10 17c3.2-3.6 5-6.1 5-8.4A5 5 0 0 0 5 8.6C5 10.9 6.8 13.4 10 17Z" />
      <circle cx="10" cy="8.6" r="1.8" />
    </>
  ),
  // ---- 杂项 ----
  heart: (
    <path d="M10 16.4C5.6 13.6 3.2 11 3.2 8.2c0-2.1 1.6-3.6 3.4-3.6 1.3 0 2.5.6 3.4 1.8.9-1.2 2.1-1.8 3.4-1.8 1.8 0 3.4 1.5 3.4 3.6 0 2.8-2.4 5.4-6.8 8.2Z" />
  ),
  'spk-on': (
    <>
      <path d="M4 8.2v3.6h2.6l3.8 3V5.2l-3.8 3Z" />
      <path d="M12.8 8.1a2.9 2.9 0 0 1 0 3.8M14.7 6.4a5.6 5.6 0 0 1 0 7.2" />
    </>
  ),
  'spk-off': (
    <>
      <path d="M4 8.2v3.6h2.6l3.8 3V5.2l-3.8 3Z" />
      <path d="M13.2 8.2l4 4M17.2 8.2l-4 4" />
    </>
  ),
  'chev-up': <path d="M6 12.4 10 8.4l4 4" />,
  'chev-down': <path d="M6 8.4l4 4 4-4" />,
  // ---- 自拍（朋友圈发圈器）----
  bestie: (
    <>
      <circle cx="7.4" cy="7.2" r="2.4" />
      <circle cx="13.4" cy="8" r="2" />
      <path d="M3.4 16.4c.6-3 2-4.6 4-4.6s3.4 1.6 4 4.6" />
      <path d="M12.2 15.2c.4-2.2 1.5-3.4 3-3.4 1.3 0 2.3.9 2.9 2.9" />
    </>
  ),
  run: (
    <>
      <circle cx="12.6" cy="4.9" r="1.8" />
      <path d="M12.2 7.4 9.4 10l2.6 1.7-1.5 3.5" />
      <path d="M9.4 10 6.6 11.3M13.6 9.2l2.8 1" />
    </>
  ),
  pool: (
    <>
      <circle cx="13.8" cy="7" r="1.8" />
      <path d="M4 11.8q2.6-2.6 5-1l3.4 1.5" />
      <path d="M3.4 15.4c1.4-1.4 2.8-1.4 4.2 0s2.8 1.4 4.2 0 2.8-1.4 4.2 0" />
    </>
  ),
  cat: (
    <>
      <path d="M5.8 8.8 5 4.4l3.2 1.9M14.2 8.8 15 4.4l-3.2 1.9" />
      <circle cx="10" cy="11.4" r="4.8" />
      <g fill="currentColor" stroke="none">
        <circle cx="8.4" cy="10.8" r="0.7" />
        <circle cx="11.6" cy="10.8" r="0.7" />
      </g>
    </>
  ),
  laptop: (
    <>
      <rect x="4.2" y="4.8" width="11.6" height="7.4" rx="1.4" />
      <path d="M2.8 14.8h14.4" />
      <path d="M6.6 7.4h3.2M6.6 9.6h2.2" />
    </>
  ),
  mountain: (
    <>
      <path d="M3.2 15.6 8 7.2l3.1 5.1 1.8-2.9 3.9 6.2Z" />
      <circle cx="14.6" cy="5.4" r="1.6" />
    </>
  ),
  boba: (
    <>
      <path d="M6.4 6.6h7.2l-1 10H7.4Z" />
      <path d="M5.6 6.6h8.8M11.2 6.6l1.6-3.2" />
      <g fill="currentColor" stroke="none">
        <circle cx="8.6" cy="12.4" r="0.62" />
        <circle cx="10.6" cy="13.6" r="0.62" />
        <circle cx="9.6" cy="10.8" r="0.62" />
      </g>
    </>
  ),
  iv: (
    <>
      <rect x="7.4" y="3.4" width="5.2" height="6" rx="1.2" />
      <path d="M10 9.4v3M8.4 12.4h3.2" />
      <circle cx="10" cy="15.4" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
};

export function Ico({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      {...S}
      style={{ display: 'inline-block', verticalAlign: '-0.15em' }}
      aria-hidden
    >
      {PATHS[name] ?? PATHS.pin}
    </svg>
  );
}
