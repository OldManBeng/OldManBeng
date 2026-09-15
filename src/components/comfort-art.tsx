/**
 * 1.1.0 舒适圈（常用手机）角色与场景渲染器。
 *
 * PNG 优先（public/comfort/，pytools/generate_comfort.py 管线），
 * 404 落程序化 SVG 兜底——与全站资产链一致。
 * 父亲恒为灰调（纪念位：grayscale + 半透明）。
 * 素颜小满是常用手机里唯一的她：眼镜、低马尾、无修容、小雀斑、眼下倦意。
 */
import { useState } from 'react';
import { BLIND_DATE_MAP } from '../data/comfort-dates';

export type ComfortAvatarKey = 'xiaoman' | 'mother' | 'boyfriend' | 'father' | 'auntie' | `bd:${string}`;

const COMFORT_PNG: Partial<Record<ComfortAvatarKey, string>> = {
  xiaoman: 'comfort/xiaoman_plain.png',
  mother: 'comfort/mother.png',
  boyfriend: 'comfort/boyfriend.png',
  father: 'comfort/father.png',
  auntie: 'comfort/auntie.png',
};

/** 候选人头像：public/comfort/dates/{id}.png。 */
function avatarSrc(who: ComfortAvatarKey): string | null {
  if (who === 'auntie') return COMFORT_PNG.auntie!;
  if (who.startsWith('bd:')) return `comfort/dates/${who.slice(3)}.png`;
  return COMFORT_PNG[who] ?? null;
}

/** 兜底：相亲对象画姓氏首字圆牌（生成图未就绪时）。 */
function InitialSvg({ label, size }: { label: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 54 54" role="img" aria-label={label}>
      <circle cx="27" cy="27" r="26" fill="#F4E8D2" />
      <circle cx="27" cy="27" r="26" fill="none" stroke="#00000022" strokeWidth="1.2" />
      <text x="27" y="36" textAnchor="middle" fontSize="24" fontWeight="600" fill="#8A6D3B" style={{ fontFamily: 'serif' }}>{label}</text>
    </svg>
  );
}

/** 舒适圈头像。 */
export function ComfortAvatar({ who, size = 44 }: { who: ComfortAvatarKey; size?: number }) {
  const [failed, setFailed] = useState(false);
  const src = avatarSrc(who);
  if (!failed && src) {
    return (
      <img
        src={src}
        width={size}
        height={size}
        alt=""
        draggable={false}
        style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover',
          filter: who === 'father' ? 'grayscale(1) opacity(0.55)' : undefined,
        }}
        onError={() => setFailed(true)}
      />
    );
  }
  if (who.startsWith('bd:')) {
    const name = BLIND_DATE_MAP[who.slice(3)]?.name;
    return <InitialSvg label={name?.[0] ?? '客'} size={size} />;
  }
  return <ComfortFaceSvg who={who as 'xiaoman' | 'mother' | 'boyfriend' | 'father'} size={size} />;
}

/** 程序化兜底脸：四张暖色系面孔（素颜小满/家政妈/电竞男友/父亲旧照位）。 */
function ComfortFaceSvg({ who, size }: { who: ComfortAvatarKey; size: number }) {
  if (who === 'xiaoman') {
    return (
      <svg width={size} height={size} viewBox="0 0 54 54" role="img" aria-label="小满">
        <defs>
          <clipPath id="cfClipX"><circle cx="27" cy="27" r="26" /></clipPath>
          <linearGradient id="cfSkinX" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0d3b4" /><stop offset="100%" stopColor="#e3b895" />
          </linearGradient>
        </defs>
        <circle cx="27" cy="27" r="26" fill="#f7e7d3" />
        <circle cx="42" cy="12" r="7" fill="#eec98f" opacity="0.25" />
        <g clipPath="url(#cfClipX)">
          <path d="M 15 28 Q 13.6 10 27 9.6 Q 40.4 10 39 28 L 39 38 Q 42 44 40 50 L 33 50 L 34 30 Z" fill="#3a2c22" />
          <path d="M 39 28 Q 41.4 36 38.8 46" stroke="#2c211a" strokeWidth="1" fill="none" opacity="0.6" />
          <path d="M 17.5 26 Q 16.8 11.8 27 11.2 Q 37.2 11.8 36.5 26 L 34.4 22 Q 34 15 27 14 Q 21.4 15 20.3 20 Q 19.5 23 19.5 26 Z" fill="#3a2c22" />
          <path d="M 23.9 36.4 L 30.1 36.4 L 29.8 43.4 L 24.2 43.4 Z" fill="#e3b895" />
          <path d="M 10 54 Q 11 45.6 18 43.4 Q 22.5 41.8 27 41.8 Q 31.5 41.8 36 43.4 Q 43 45.6 44 54 Z" fill="#c9b295" />
          <ellipse cx="27" cy="27.4" rx="9" ry="10" fill="url(#cfSkinX)" />
          <path d="M 20.1 29 Q 19.5 36.4 27 41.6 Q 34.5 36.4 33.9 29 Z" fill="#e3b895" />
          {/* 眼镜（素颜小满的标志） */}
          <g fill="none" stroke="#5a4a38" strokeWidth="0.8">
            <circle cx="22.6" cy="27.6" r="4" opacity="0.85" />
            <circle cx="31.4" cy="27.6" r="4" opacity="0.85" />
            <path d="M 26.6 27.4 L 27.4 27.4 M 18.6 27 L 16.8 26.6 M 35.4 27 L 37.2 26.6" />
          </g>
          <circle cx="22.6" cy="27.8" r="1.2" fill="#2c211a" />
          <circle cx="31.4" cy="27.8" r="1.2" fill="#2c211a" />
          <path d="M 21 24.6 Q 22.6 23.8 24.2 24.4 M 29.8 24.4 Q 31.4 23.8 33 24.6" stroke="#4a3626" strokeWidth="0.7" fill="none" strokeLinecap="round" />
          {/* 素颜：淡唇 + 眼下倦意 + 小雀斑 */}
          <path d="M 25.4 34.4 Q 27 35.3 28.6 34.4" stroke="#c98a7a" strokeWidth="1" fill="none" strokeLinecap="round" />
          <path d="M 19.8 31.4 Q 21.2 32 22.6 31.5 M 31.4 31.5 Q 32.8 32 34.2 31.4" stroke="#c89878" strokeWidth="0.5" fill="none" opacity="0.5" />
          <g fill="#b8815f" opacity="0.5">
            <circle cx="20.6" cy="29.4" r="0.3" /><circle cx="33.8" cy="29.8" r="0.3" /><circle cx="24.4" cy="32.4" r="0.28" />
          </g>
          <path d="M 19.8 15.2 Q 27 11.4 34.4 15.2" stroke="#ffffff" strokeWidth="0.9" opacity="0.1" fill="none" />
        </g>
        <circle cx="27" cy="27" r="26" fill="none" stroke="#00000030" strokeWidth="1.2" />
      </svg>
    );
  }
  if (who === 'mother') {
    return (
      <svg width={size} height={size} viewBox="0 0 54 54" role="img" aria-label="妈">
        <defs>
          <clipPath id="cfClipM"><circle cx="27" cy="27" r="26" /></clipPath>
          <linearGradient id="cfSkinM" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eccba8" /><stop offset="100%" stopColor="#d9ab80" />
          </linearGradient>
        </defs>
        <circle cx="27" cy="27" r="26" fill="#f2ddc4" />
        <circle cx="10" cy="12" r="8" fill="#e0b070" opacity="0.3" />
        <g clipPath="url(#cfClipM)">
          {/* 短卷发（55 岁，烫过的中年短发） */}
          <path d="M 14 30 Q 12 10 27 9 Q 42 10 40 30 L 36.5 30 Q 38.4 14 27 13 Q 15.6 14 17.5 30 Z" fill="#6b6259" />
          <path d="M 14 30 Q 12.6 34 14.6 37.4 Q 17 36.4 16.6 32 Z" fill="#6b6259" />
          <path d="M 40 30 Q 41.4 34 39.4 37.4 Q 37 36.4 37.4 32 Z" fill="#6b6259" />
          <path d="M 20.6 12.4 Q 27 9 33.8 12.6" stroke="#8a8078" strokeWidth="1" fill="none" opacity="0.7" />
          {/* 脖颈 + 肩 + 家政围裙领 */}
          <path d="M 23.9 36.4 L 30.1 36.4 L 29.8 43.4 L 24.2 43.4 Z" fill="#d9ab80" />
          <path d="M 10 54 Q 11 45.6 18 43.4 Q 22.5 41.8 27 41.8 Q 31.5 41.8 36 43.4 Q 43 45.6 44 54 Z" fill="#8fae9c" />
          <path d="M 21.4 43 L 24.4 46.4 L 27 44 L 29.6 46.4 L 32.6 43" stroke="#7a9a88" strokeWidth="1.1" fill="none" />
          {/* 脸 + 法令纹 + 眼下纹（岁月） */}
          <ellipse cx="27" cy="27.4" rx="9.2" ry="10" fill="url(#cfSkinM)" />
          <path d="M 19.9 29 Q 19.3 36.4 27 41.6 Q 34.7 36.4 34.1 29 Z" fill="#d9ab80" />
          <path d="M 22.4 33.2 Q 23 34.6 24.2 35.2 M 31.6 33.2 Q 31 34.6 29.8 35.2" stroke="#b98a5e" strokeWidth="0.5" fill="none" opacity="0.5" />
          <path d="M 21.2 23 Q 22.8 22.2 24.4 22.8 M 29.6 22.8 Q 31.2 22.2 32.8 23" stroke="#5a4a38" strokeWidth="0.75" fill="none" strokeLinecap="round" />
          <path d="M 23 27.8 Q 24 29 25.4 27.9 M 28.6 27.9 Q 30 29 31 27.8" stroke="#2c211a" strokeWidth="0.9" fill="none" strokeLinecap="round" />
          <circle cx="24.2" cy="27.6" r="1" fill="#2c211a" />
          <circle cx="29.8" cy="27.6" r="1" fill="#2c211a" />
          <path d="M 21.4 30.9 Q 22.6 31.5 23.8 31 M 30.2 31 Q 31.4 31.5 32.6 30.9" stroke="#b98a5e" strokeWidth="0.5" fill="none" opacity="0.6" />
          <path d="M 25 34 Q 27 35.5 29 34 Q 27 34.6 25 34 Z" fill="#b56a5a" />
          {/* 笑纹 */}
          <path d="M 19.6 29.6 Q 20.6 30.6 21.6 30.2 M 34.4 29.6 Q 33.4 30.6 32.4 30.2" stroke="#b98a5e" strokeWidth="0.5" fill="none" opacity="0.55" />
        </g>
        <circle cx="27" cy="27" r="26" fill="none" stroke="#00000030" strokeWidth="1.2" />
      </svg>
    );
  }
  if (who === 'boyfriend') {
    return (
      <svg width={size} height={size} viewBox="0 0 54 54" role="img" aria-label="阿凯">
        <defs>
          <clipPath id="cfClipB"><circle cx="27" cy="27" r="26" /></clipPath>
          <linearGradient id="cfSkinB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f2cfa8" /><stop offset="100%" stopColor="#dfae82" />
          </linearGradient>
        </defs>
        <circle cx="27" cy="27" r="26" fill="#dfe6ee" />
        <circle cx="44" cy="10" r="6" fill="#8fa8c8" opacity="0.4" />
        <g clipPath="url(#cfClipB)">
          {/* 游戏少年的乱发（睡醒感） */}
          <path d="M 16.8 24 Q 14.8 10 27 9.4 Q 39.2 10 37.2 24 L 34.6 20.4 Q 34 13.8 27 13 Q 20 13.8 19.4 20.4 Z" fill="#241d18" />
          <path d="M 18.4 15.4 Q 16 12.6 16.8 9.8 M 36 15.4 Q 38.4 12.6 37.4 9.8" stroke="#241d18" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M 23 10.6 Q 26 8.4 29.4 10.2 M 19.6 13.6 Q 18.4 11.4 19 9.4" stroke="#241d18" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          {/* 脖颈 + 卫衣 + 挂颈耳机 */}
          <path d="M 23.9 35.4 L 30.1 35.4 L 29.8 42.4 L 24.2 42.4 Z" fill="#dfae82" />
          <path d="M 9.5 54 Q 10.5 44.8 17.5 42.6 Q 22.5 41 27 41 Q 31.5 41 36.5 42.6 Q 43.5 44.8 44.5 54 Z" fill="#3d4350" />
          <path d="M 21.8 42.2 L 24.6 46 L 27 43.4 L 29.4 46 L 32.2 42.2" stroke="#565e6e" strokeWidth="1" fill="none" strokeLinecap="round" />
          <path d="M 15.4 40.8 Q 13.4 44.4 14.2 48.6 M 38.6 40.8 Q 40.6 44.4 39.8 48.6" stroke="#1c1e24" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <circle cx="14.2" cy="49.6" r="2" fill="#1c1e24" />
          <circle cx="39.8" cy="49.6" r="2" fill="#1c1e24" />
          <circle cx="14.2" cy="49.6" r="0.7" fill="#efc878" opacity="0.8" />
          <circle cx="39.8" cy="49.6" r="0.7" fill="#efc878" opacity="0.8" />
          {/* 脸：熬夜眼袋 + 玩闹眉 */}
          <ellipse cx="27" cy="26.8" rx="9" ry="10" fill="url(#cfSkinB)" />
          <path d="M 20.1 28.4 Q 19.5 35.8 27 41 Q 34.5 35.8 33.9 28.4 Z" fill="#dfae82" />
          <path d="M 21 23 Q 23 21.8 25 22.8 M 29 22.8 Q 31 21.8 33 23" stroke="#33261c" strokeWidth="0.9" fill="none" strokeLinecap="round" />
          <path d="M 22.4 27.2 Q 23.6 28.4 25 27.2 M 29 27.2 Q 30.4 28.4 31.6 27.2" stroke="#1c1410" strokeWidth="0.95" fill="none" strokeLinecap="round" />
          <circle cx="23.7" cy="27.2" r="1.15" fill="#1c1410" />
          <circle cx="30.3" cy="27.2" r="1.15" fill="#1c1410" />
          <circle cx="24.1" cy="26.8" r="0.4" fill="#ffffff" opacity="0.9" />
          <circle cx="30.7" cy="26.8" r="0.4" fill="#ffffff" opacity="0.9" />
          <path d="M 21.6 29.8 Q 23 30.4 24.4 30 M 29.6 30 Q 31 30.4 32.4 29.8" stroke="#b98a5e" strokeWidth="0.6" fill="none" opacity="0.65" />
          <path d="M 24.6 33.4 Q 26.2 34.6 27.8 33.6 M 26.2 34.7 Q 27.8 35.6 29.4 34.7" stroke="#b56a5a" strokeWidth="0.85" fill="none" strokeLinecap="round" />
        </g>
        <circle cx="27" cy="27" r="26" fill="none" stroke="#00000030" strokeWidth="1.2" />
      </svg>
    );
  }
  // 父亲（纪念位：黑白旧照质感）
  return (
    <svg width={size} height={size} viewBox="0 0 54 54" role="img" aria-label="爸">
      <defs>
        <clipPath id="cfClipF"><circle cx="27" cy="27" r="26" /></clipPath>
        <linearGradient id="cfSkinF" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9c9c9" /><stop offset="100%" stopColor="#a8a8a8" />
        </linearGradient>
      </defs>
      <circle cx="27" cy="27" r="26" fill="#d6d6d6" />
      <g clipPath="url(#cfClipF)">
        <path d="M 15.4 24 Q 14 9.6 27 9 Q 40 9.6 38.6 24 L 36 20.4 Q 35.6 13.6 27 12.8 Q 18.4 13.6 18 20.4 Z" fill="#4a4a4a" />
        <path d="M 16.4 20.4 Q 18 12 27 11.4" stroke="#5e5e5e" strokeWidth="1" fill="none" opacity="0.8" />
        <path d="M 23.9 34.4 L 30.1 34.4 L 29.8 41.4 L 24.2 41.4 Z" fill="#a8a8a8" />
        <path d="M 9.5 54 Q 10.5 44.4 17.5 42.2 Q 22.5 40.6 27 40.6 Q 31.5 40.6 36.5 42.2 Q 43.5 44.4 44.5 54 Z" fill="#3e3e3e" />
        <path d="M 22 42 L 25 45.4 L 27 43 L 29 45.4 L 32 42" stroke="#2c2c2c" strokeWidth="1.4" fill="none" />
        <ellipse cx="27" cy="26.4" rx="9.2" ry="10.2" fill="url(#cfSkinF)" />
        <path d="M 19.9 28 Q 19.3 35.6 27 40.8 Q 34.7 35.6 34.1 28 Z" fill="#a8a8a8" />
        <path d="M 21 22.4 Q 23 21.4 25 22.2 M 29 22.2 Q 31 21.4 33 22.4" stroke="#3a3a3a" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M 22.4 26.6 Q 23.6 27.6 25 26.6 M 29 26.6 Q 30.4 27.6 31.6 26.6" stroke="#2c2c2c" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <circle cx="23.7" cy="26.6" r="1" fill="#2c2c2c" />
        <circle cx="30.3" cy="26.6" r="1" fill="#2c2c2c" />
        <path d="M 22 30.4 Q 23.4 31 24.8 30.6 M 29.2 30.6 Q 30.6 31 32 30.4" stroke="#8a8a8a" strokeWidth="0.55" fill="none" opacity="0.7" />
        {/* 胡茬 + 老实人的平嘴 */}
        <path d="M 22.4 31.8 Q 21.8 34.6 23 36.6 M 31.6 31.8 Q 32.2 34.6 31 36.6 M 24 35.6 Q 25 36.6 26.2 36.4 M 30 36.4 Q 28.6 36.6 28 36.2" stroke="#5e5e5e" strokeWidth="0.5" fill="none" opacity="0.7" />
        <path d="M 25 33.2 Q 27 33.9 29 33.2" stroke="#4a4a4a" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      </g>
      <circle cx="27" cy="27" r="26" fill="none" stroke="#00000040" strokeWidth="1.2" />
    </svg>
  );
}

/** 舒适圈朋友圈配图：public/comfort/scenes/{id}.jpg（404 落 SVG 暖色场景）。 */
export function ComfortSceneRender({ photoId }: { photoId?: string }) {
  const [failed, setFailed] = useState(false);
  if (!photoId) return null;
  if (!failed) {
    return (
      <img
        src={`comfort/scenes/${photoId}.jpg`}
        alt=""
        draggable={false}
        style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block' }}
        onError={() => setFailed(true)}
      />
    );
  }
  return <ComfortSceneSvg photoId={photoId} />;
}

const COMFORT_SCENE_META: Record<string, { sky: string; ground: string; accent: string }> = {
  cm_soy: { sky: '#f7e3c2', ground: '#e8c896', accent: '#b98a5e' },
  cm_sunrise: { sky: '#fbd9a0', ground: '#f2b06a', accent: '#e8853b' },
  cm_road: { sky: '#f5e0c8', ground: '#c9b295', accent: '#8a8078' },
  cm_quilt: { sky: '#f2dcc4', ground: '#dcb88a', accent: '#b56a5a' },
  cm_video: { sky: '#e8eef4', ground: '#c2cedd', accent: '#5a7a9a' },
  cm_crab: { sky: '#f8d8c0', ground: '#e8a878', accent: '#c85a3a' },
  cm_old_phone: { sky: '#e5e0d5', ground: '#bfb8a8', accent: '#6b6259' },
  cm_boba: { sky: '#f4e2d0', ground: '#d8b892', accent: '#a87848' },
  cm_couple: { sky: '#fbd9c8', ground: '#f0a888', accent: '#e86a5a' },
  cm_chicken: { sky: '#f8e8c8', ground: '#e8c888', accent: '#c8955a' },
  cm_game: { sky: '#dfe6ee', ground: '#a8b8c8', accent: '#4a6a9a' },
};

/** 兜底场景：暖色渐变 + 物件剪影 + 颗粒暗角——一张随手拍的手机照。 */
function ComfortSceneSvg({ photoId }: { photoId: string }) {
  const m = COMFORT_SCENE_META[photoId] ?? { sky: '#f7e7d3', ground: '#e0c8a8', accent: '#b98a5e' };
  return (
    <svg viewBox="0 0 400 300" style={{ width: '100%', display: 'block', aspectRatio: '4 / 3' }} role="img" aria-label="照片">
      <defs>
        <linearGradient id={`cs_${photoId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={m.sky} /><stop offset="100%" stopColor={m.ground} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#cs_${photoId})`} />
      {/* 窗光 */}
      <rect x="250" y="30" width="110" height="90" rx="6" fill="#ffffff" opacity="0.35" />
      <rect x="305" y="30" width="4" height="90" fill={m.ground} opacity="0.5" />
      <rect x="0" y="200" width="400" height="100" fill={m.ground} opacity="0.75" />
      <ellipse cx="150" cy="205" rx="90" ry="14" fill="#00000018" />
      <g fill={m.accent}>
        {photoId === 'cm_boba' || photoId === 'cm_soy' ? (
          <g>
            <rect x="120" y="120" width="46" height="86" rx="8" />
            <rect x="114" y="112" width="58" height="12" rx="6" />
            <rect x="150" y="96" width="6" height="46" rx="3" fill="#ffffff" opacity="0.7" />
          </g>
        ) : photoId === 'cm_game' ? (
          <g>
            <rect x="96" y="104" width="120" height="76" rx="6" fill="#2c3444" />
            <rect x="104" y="112" width="104" height="60" fill={m.accent} opacity="0.85" />
            <path d="M 130 160 L 150 128 L 170 152 L 190 120" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
        ) : photoId === 'cm_old_phone' ? (
          <g>
            <rect x="118" y="100" width="64" height="110" rx="10" fill="#3a3a3a" />
            <rect x="126" y="118" width="48" height="66" fill="#c9c9c9" />
            <circle cx="150" cy="196" r="7" fill="#5e5e5e" />
          </g>
        ) : photoId === 'cm_couple' ? (
          <g>
            <circle cx="120" cy="118" r="26" fill="#e8b88a" />
            <path d="M 80 200 Q 84 148 120 146 Q 156 148 160 200 Z" fill={m.accent} />
            <circle cx="185" cy="112" r="28" fill="#2c3444" />
            <path d="M 143 200 Q 147 144 185 142 Q 223 144 227 200 Z" fill="#3d4350" />
          </g>
        ) : photoId === 'cm_crab' ? (
          <g>
            <ellipse cx="150" cy="168" rx="52" ry="30" fill={m.accent} />
            <path d="M 106 150 Q 84 132 92 116 M 194 150 Q 216 132 208 116" stroke={m.accent} strokeWidth="9" fill="none" strokeLinecap="round" />
            <path d="M 120 196 Q 116 210 106 214 M 150 200 L 150 214 M 180 196 Q 184 210 194 214" stroke={m.accent} strokeWidth="6" fill="none" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <path d="M 104 196 Q 106 130 150 128 Q 194 130 196 196 Z" fill={m.accent} />
            <circle cx="150" cy="102" r="30" fill="#e8b88a" />
          </g>
        )}
      </g>
      {/* 手机随拍质感：颗粒 + 暗角 + 时间戳 */}
      <g fill="#ffffff">
        <circle cx="60" cy="60" r="1" opacity="0.2" /><circle cx="340" cy="220" r="1" opacity="0.15" />
        <circle cx="90" cy="260" r="0.8" opacity="0.18" /><circle cx="300" cy="90" r="0.8" opacity="0.16" />
      </g>
      <rect width="400" height="300" fill="none" stroke="#00000012" strokeWidth="10" />
      <text x="308" y="282" fontSize="13" fill="#ffffff" opacity="0.55" style={{ fontFamily: 'monospace' }}>AM 07:42</text>
    </svg>
  );
}
