/**
 * Programmatic SVG portraits (GL2 character-art pattern, zero image assets).
 * v2.2: 三层渲染——背景场景 + 人脸表情 + 配饰图标。
 * 老李：深夜公路背景、方向盘配饰、发际线后退、胡茬、微胖脸。
 * 表情由信任/警惕驱动——警惕高时眯眼审视。下线老头头像置灰。
 * 主角头像按人设卡变化。
 */
import type { Target, TargetState, BgScene, Accessory } from '../types/target';
import type { PersonaId } from '../types/persona';
import type { ReactElement } from 'react';

// ---------------------------------------------------------------------------
// 背景场景渲染——按 bgScene 画一个简化场景（3-5 个几何图形，追求辨识度）
// ---------------------------------------------------------------------------
function BgLayer({ scene, accent }: { scene: BgScene; accent: string }) {
  switch (scene) {
    case 'night_road':
      return (
        <>
          <rect x="0" y="0" width="54" height="54" fill="#0d1a2a" />
          <rect x="0" y="38" width="54" height="16" fill="#1a2a1a" />
          <circle cx="14" cy="10" r="2.5" fill="#f4d03f" opacity="0.8" />
          <circle cx="40" cy="14" r="1.5" fill="#f4d03f" opacity="0.6" />
          <rect x="22" y="40" width="3" height="2" fill="#f4d03f" opacity="0.7" />
        </>
      );
    case 'study':
      return (
        <>
          <rect x="0" y="0" width="54" height="54" fill="#3a2e1e" />
          <rect x="0" y="38" width="54" height="16" fill="#5a4a2e" />
          <rect x="4" y="6" width="8" height="30" fill="#2a1e0e" opacity="0.5" />
          <rect x="14" y="4" width="8" height="32" fill="#2a1e0e" opacity="0.4" />
          <circle cx="40" cy="14" r="5" fill="#f4d03f" opacity="0.25" />
        </>
      );
    case 'garage':
      return (
        <>
          <rect x="0" y="0" width="54" height="54" fill="#2a2a2a" />
          <rect x="8" y="8" width="38" height="24" rx="2" fill="#3a3a3a" />
          <rect x="12" y="12" width="30" height="14" fill="#1a1a1a" opacity="0.6" />
          <rect x="0" y="40" width="54" height="14" fill="#1a1a1a" />
        </>
      );
    case 'internet_cafe':
      return (
        <>
          <rect x="0" y="0" width="54" height="54" fill="#0a1a2a" />
          <rect x="4" y="8" width="10" height="7" rx="1" fill="#1a3a5a" />
          <rect x="18" y="8" width="10" height="7" rx="1" fill="#1a3a5a" />
          <rect x="32" y="8" width="10" height="7" rx="1" fill="#1a3a5a" />
          <rect x="11" y="17" width="10" height="7" rx="1" fill="#1a3a5a" />
          <rect x="25" y="17" width="10" height="7" rx="1" fill="#1a3a5a" />
          <rect x="0" y="40" width="54" height="14" fill="#0a0a1a" />
        </>
      );
    case 'balcony':
      return (
        <>
          <rect x="0" y="0" width="54" height="54" fill="#2a3a2a" />
          <rect x="0" y="36" width="54" height="18" fill="#4a5a3a" />
          <rect x="6" y="30" width="4" height="8" fill="#3a5a3a" />
          <circle cx="8" cy="28" r="3" fill="#5a8a5a" opacity="0.6" />
          <rect x="40" y="32" width="4" height="6" fill="#3a5a3a" />
          <circle cx="42" cy="30" r="2.5" fill="#8a5a5a" opacity="0.5" />
          <line x1="0" y1="36" x2="54" y2="36" stroke="#3a3a3a" strokeWidth="1" />
        </>
      );
    case 'guard_booth':
      return (
        <>
          <rect x="0" y="0" width="54" height="54" fill="#1a1a2a" />
          <rect x="6" y="10" width="42" height="30" rx="1" fill="#2a2a3a" />
          <rect x="10" y="14" width="34" height="18" fill="#0a0a1a" />
          <circle cx="44" cy="6" r="2" fill="#f4d03f" opacity="0.4" />
          <rect x="0" y="42" width="54" height="12" fill="#1a1a1a" />
        </>
      );
    case 'roadside':
      return (
        <>
          <rect x="0" y="0" width="54" height="54" fill="#0d1a1a" />
          <rect x="0" y="40" width="54" height="14" fill="#2a2a1a" />
          <rect x="10" y="26" width="3" height="14" fill="#3a3a2a" />
          <circle cx="11.5" cy="24" r="2" fill="#f4d03f" opacity="0.5" />
          <rect x="40" y="28" width="3" height="12" fill="#3a3a2a" />
          <circle cx="41.5" cy="26" r="2" fill="#f4d03f" opacity="0.4" />
        </>
      );
    case 'fishing':
      return (
        <>
          <rect x="0" y="0" width="54" height="28" fill="#1a2a3a" />
          <rect x="0" y="28" width="54" height="26" fill="#2a3a4a" />
          <path d="M 0 28 Q 27 25 54 28" fill="none" stroke="#4a6a8a" strokeWidth="0.8" opacity="0.5" />
          <path d="M 0 32 Q 27 29 54 32" fill="none" stroke="#4a6a8a" strokeWidth="0.6" opacity="0.3" />
          <rect x="8" y="24" width="2" height="6" fill="#3a3a2a" />
        </>
      );
    case 'chess':
      return (
        <>
          <rect x="0" y="0" width="54" height="54" fill="#3a2e1e" />
          <rect x="6" y="30" width="42" height="20" fill="#5a4a2e" />
          <g opacity="0.3">
            <rect x="6" y="30" width="10.5" height="10" fill="#3a2e1e" />
            <rect x="16.5" y="40" width="10.5" height="10" fill="#3a2e1e" />
            <rect x="27" y="30" width="10.5" height="10" fill="#3a2e1e" />
            <rect x="37.5" y="40" width="10.5" height="10" fill="#3a2e1e" />
          </g>
        </>
      );
    case 'square':
      return (
        <>
          <rect x="0" y="0" width="54" height="54" fill="#1a1a2a" />
          <rect x="0" y="36" width="54" height="18" fill="#2a2a1a" />
          <circle cx="27" cy="6" r="3" fill={accent} opacity="0.3" />
          <circle cx="14" cy="8" r="2" fill={accent} opacity="0.2" />
          <circle cx="40" cy="8" r="2" fill={accent} opacity="0.2" />
        </>
      );
    default:
      return <rect x="0" y="0" width="54" height="54" fill="#22303c" />;
  }
}

// ---------------------------------------------------------------------------
// 配饰渲染——按 accessory 在头像右下角画一个小图标
// ---------------------------------------------------------------------------
function AccessoryLayer({ accessory }: { accessory: Accessory }) {
  switch (accessory) {
    case 'steering_wheel':
      return (
        <g stroke="#888" strokeWidth="1.2" fill="none" opacity="0.7">
          <circle cx="46" cy="46" r="5" />
          <line x1="46" y1="41" x2="46" y2="51" />
          <line x1="41" y1="46" x2="51" y2="46" />
        </g>
      );
    case 'calligraphy_brush':
      return (
        <g opacity="0.7">
          <rect x="44" y="38" width="1.5" height="12" fill="#5a4a2e" />
          <rect x="43.5" y="48" width="2.5" height="4" rx="0.5" fill="#2a1a0a" />
        </g>
      );
    case 'cigarette':
      return (
        <g opacity="0.6">
          <rect x="40" y="46" width="8" height="1.5" fill="#ddd" rx="0.5" />
          <rect x="47" y="45.5" width="2" height="2.5" fill="#e74c3c" rx="0.5" />
          <circle cx="50" cy="44" r="1" fill="#aaa" opacity="0.3" />
        </g>
      );
    case 'gamepad':
      return (
        <g fill="#3a6a3a" opacity="0.6">
          <rect x="39" y="42" width="10" height="6" rx="2" />
          <circle cx="42" cy="45" r="0.8" fill="#8a8a8a" />
          <circle cx="46" cy="45" r="0.8" fill="#8a8a8a" />
        </g>
      );
    case 'wrench':
      return (
        <g fill="#8a8a9a" opacity="0.6">
          <rect x="44" y="38" width="2" height="10" rx="0.5" transform="rotate(30 45 43)" />
          <circle cx="48" cy="40" r="2.5" fill="none" stroke="#8a8a9a" strokeWidth="1.2" />
        </g>
      );
    case 'flashlight':
      return (
        <g opacity="0.6">
          <rect x="42" y="40" width="3" height="8" rx="0.5" fill="#5a5a5a" />
          <rect x="41.5" y="39" width="4" height="2" rx="0.5" fill="#8a8a8a" />
          <circle cx="43.5" cy="37" r="2" fill="#f4d03f" opacity="0.25" />
        </g>
      );
    case 'fishing_rod':
      return (
        <g stroke="#5a4a2e" strokeWidth="1" opacity="0.6">
          <line x1="38" y1="50" x2="52" y2="36" />
          <circle cx="52" cy="36" r="1" fill="none" stroke="#5a4a2e" strokeWidth="0.8" />
          <line x1="52" y1="36" x2="52" y2="42" stroke="#8a8a8a" strokeWidth="0.4" />
        </g>
      );
    case 'chess_piece':
      return (
        <g fill="#ddd" opacity="0.5">
          <circle cx="46" cy="43" r="2" />
          <rect x="44" y="45" width="4" height="3" rx="0.5" />
          <rect x="43" y="48" width="6" height="2" rx="0.5" />
        </g>
      );
    case 'speaker':
      return (
        <g fill="#2a2a2a" opacity="0.6">
          <rect x="40" y="40" width="8" height="10" rx="1" />
          <circle cx="44" cy="44" r="2" fill="none" stroke="#666" strokeWidth="0.8" />
          <circle cx="44" cy="47" r="1.2" fill="none" stroke="#666" strokeWidth="0.6" />
        </g>
      );
    case 'helmet':
      return (
        <g fill="#8a6a3a" opacity="0.5">
          <path d="M 40 48 Q 46 42 52 48 L 52 52 L 40 52 Z" />
          <rect x="42" y="47" width="8" height="1.5" fill="#5a4a2a" />
        </g>
      );
    default:
      return null;
  }
}

export function OldManAvatar({ target, state, size = 44 }: { target: Target; state?: TargetState; size?: number }) {
  const spec = target.portraitSpec;
  const wary = (state?.wariness ?? 10) >= 45;
  const smiling = (state?.trust ?? 0) >= 60;
  const blocked = state?.blocked ?? false;
  // Eye shape: wary → narrow slits; smiling → crescent.
  const eyeH = wary ? 1.2 : smiling ? 1.5 : 2;
  const mouth = smiling
    ? 'M 22 32 Q 27 35 32 32'
    : wary
      ? 'M 23 33 L 31 33'
      : 'M 23 32 Q 27 34 31 32';
  const hairlineY = spec.hair === 2 ? 13 : 9;
  return (
    <svg width={size} height={size} viewBox="0 0 54 54" role="img" aria-label={target.name}
      style={blocked ? { filter: 'grayscale(1) opacity(0.4)' } : undefined}
    >
      {/* v2.2 三层：背景场景 → 人脸 → 配饰 */}
      <BgLayer scene={spec.bgScene ?? 'default'} accent={spec.accent ?? spec.shirtColor} />
      {/* face */}
      <ellipse cx="27" cy="28" rx={11 + spec.cheeks * 5} ry={13 + spec.cheeks * 3} fill="#e8b98e" />
      {/* receding hair */}
      <path d={`M 15 ${hairlineY + 2} Q 27 ${hairlineY - 6} 39 ${hairlineY + 2} L 39 16 Q 27 8 15 16 Z`} fill={spec.hairColor} />
      {spec.hair === 2 && <ellipse cx="27" cy={hairlineY + 3} rx="6" ry="2" fill="#e8b98e" opacity="0.5" />}
      {/* brows: wary = lowered */}
      <line x1="20" y1={wary ? 21.5 : 20.5} x2="24" y2={wary ? 21 : 20} stroke="#2b2b2b" strokeWidth="1.4" />
      <line x1="30" y1={wary ? 21 : 20} x2="34" y2={wary ? 21.5 : 20.5} stroke="#2b2b2b" strokeWidth="1.4" />
      {/* eyes */}
      <ellipse cx="22" cy="24" rx="1.8" ry={eyeH} fill="#1c1c1c" />
      <ellipse cx="32" cy="24" rx="1.8" ry={eyeH} fill="#1c1c1c" />
      {/* nose */}
      <path d="M 27 25 L 26 29 L 28 29" fill="none" stroke="#c49a6c" strokeWidth="1" />
      {/* mouth */}
      <path d={mouth} fill="none" stroke="#7a4a3a" strokeWidth="1.3" />
      {/* beard stubble */}
      {spec.beard > 0 && <ellipse cx="27" cy="34" rx="7" ry="5" fill="#00000022" />}
      {/* collar */}
      <path d="M 14 44 L 27 38 L 40 44 L 40 54 L 14 54 Z" fill={spec.shirtColor} />
      {spec.glasses > 0 && (
        <g stroke="#333" strokeWidth="1" fill="none">
          <circle cx="22" cy="24" r="4" />
          <circle cx="32" cy="24" r="4" />
          <line x1="26" y1="24" x2="28" y2="24" />
        </g>
      )}
      {/* v2.2 配饰层 */}
      <AccessoryLayer accessory={spec.accessory ?? 'none'} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// v2.2：照片立绘渲染器——比头像更大（200×150），场景更丰富
// ---------------------------------------------------------------------------
export function PhotoRender({ photoId }: { photoId: string }) {
  const scenes = PHOTO_SCENES[photoId];
  if (!scenes) return null;
  return (
    <svg width="200" height="150" viewBox="0 0 200 150" role="img" aria-label="照片">
      {scenes}
    </svg>
  );
}

/** 照片场景库——按 photoId 索引。每张是一段 SVG 几何抽象。 */
const PHOTO_SCENES: Record<string, ReactElement> = {
  // 老李：夜间出租车内视角
  lao_li_taxi_night: (
    <>
      <rect width="200" height="150" fill="#0a0f1a" />
      <rect x="0" y="100" width="200" height="50" fill="#1a1510" />
      {/* 挡风玻璃外的路灯 */}
      <circle cx="30" cy="25" r="4" fill="#f4d03f" opacity="0.7" />
      <circle cx="60" cy="20" r="3" fill="#f4d03f" opacity="0.5" />
      <circle cx="150" cy="22" r="3.5" fill="#f4d03f" opacity="0.6" />
      <circle cx="180" cy="18" r="4" fill="#f4d03f" opacity="0.8" />
      {/* 方向盘 */}
      <circle cx="100" cy="110" r="28" fill="none" stroke="#555" strokeWidth="4" />
      <line x1="100" y1="82" x2="100" y2="138" stroke="#555" strokeWidth="3" />
      <line x1="72" y1="110" x2="128" y2="110" stroke="#555" strokeWidth="3" />
      <circle cx="100" cy="110" r="5" fill="#333" />
      {/* 仪表盘微光 */}
      <rect x="80" y="100" width="12" height="5" rx="1" fill="#2a4a6a" opacity="0.6" />
      <rect x="108" y="100" width="12" height="5" rx="1" fill="#2a4a6a" opacity="0.6" />
    </>
  ),
  // 周老师：书桌俯拍
  zhou_calligraphy: (
    <>
      <rect width="200" height="150" fill="#3a2e1e" />
      <rect x="0" y="0" width="200" height="150" fill="#5a4a2e" opacity="0.3" />
      {/* 宣纸 */}
      <rect x="40" y="30" width="120" height="80" fill="#f0e8d0" />
      {/* 毛笔 */}
      <rect x="130" y="20" width="3" height="60" fill="#5a3a1e" transform="rotate(15 131 50)" />
      <rect x="128" y="74" width="9" height="12" rx="1" fill="#2a1a0a" transform="rotate(15 131 50)" />
      {/* 挂钟 */}
      <circle cx="170" cy="25" r="12" fill="none" stroke="#caa" strokeWidth="2" />
      <line x1="170" y1="25" x2="170" y2="17" stroke="#caa" strokeWidth="1.5" />
      <line x1="170" y1="25" x2="176" y2="25" stroke="#caa" strokeWidth="1" />
      {/* 墨迹 */}
      <ellipse cx="70" cy="60" rx="8" ry="3" fill="#1a1a1a" opacity="0.7" />
      <ellipse cx="90" cy="75" rx="6" ry="2" fill="#1a1a1a" opacity="0.5" />
    </>
  ),
  // 王总：车库视角
  wang_garage_smoke: (
    <>
      <rect width="200" height="150" fill="#1a1a1a" />
      <rect x="0" y="100" width="200" height="50" fill="#0a0a0a" />
      {/* 车窗轮廓 */}
      <rect x="20" y="30" width="160" height="60" rx="4" fill="#2a2a2a" />
      <rect x="30" y="38" width="65" height="44" fill="#1a1a2a" opacity="0.6" />
      <rect x="105" y="38" width="65" height="44" fill="#1a1a2a" opacity="0.6" />
      {/* 方向盘 */}
      <circle cx="100" cy="115" r="20" fill="none" stroke="#444" strokeWidth="3" />
      {/* 烟 */}
      <rect x="140" y="108" width="12" height="2" rx="0.5" fill="#ddd" opacity="0.7" />
      <rect x="150" y="107" width="3" height="3" rx="0.5" fill="#e74c3c" opacity="0.7" />
      <circle cx="158" cy="100" r="3" fill="#aaa" opacity="0.2" />
      <circle cx="162" cy="92" r="4" fill="#aaa" opacity="0.12" />
      <circle cx="166" cy="82" r="5" fill="#aaa" opacity="0.06" />
    </>
  ),
  // 阿豪：网吧柜台
  hao_cafe_cats: (
    <>
      <rect width="200" height="150" fill="#0a0a1a" />
      <rect x="0" y="100" width="200" height="50" fill="#1a1a2a" />
      {/* 显示器排 */}
      <rect x="10" y="15" width="35" height="25" rx="2" fill="#1a3a5a" />
      <rect x="50" y="15" width="35" height="25" rx="2" fill="#1a3a5a" />
      <rect x="90" y="15" width="35" height="25" rx="2" fill="#1a3a5a" />
      <rect x="130" y="15" width="35" height="25" rx="2" fill="#1a3a5a" />
      {/* 屏幕蓝光 */}
      <rect x="14" y="19" width="27" height="17" fill="#3a7aaa" opacity="0.4" />
      <rect x="54" y="19" width="27" height="17" fill="#3a7aaa" opacity="0.3" />
      <rect x="94" y="19" width="27" height="17" fill="#3a7aaa" opacity="0.5" />
      <rect x="134" y="19" width="27" height="17" fill="#3a7aaa" opacity="0.35" />
      {/* 柜台 */}
      <rect x="0" y="80" width="200" height="20" fill="#2a2a3a" />
      {/* 橘猫 */}
      <ellipse cx="100" cy="95" rx="14" ry="8" fill="#e89a3a" />
      <circle cx="86" cy="90" r="7" fill="#e89a3a" />
      <path d="M 80 85 L 82 80 M 90 83 L 92 78" stroke="#e89a3a" strokeWidth="2" />
      <circle cx="83" cy="90" r="0.8" fill="#1a1a1a" />
    </>
  ),
  // 陈工：阳台台钳
  chen_balcony_vise: (    <>
      <rect width="200" height="150" fill="#2a3a2a" />
      <rect x="0" y="100" width="200" height="50" fill="#4a5a3a" />
      {/* 栏杆 */}
      <rect x="0" y="95" width="200" height="3" fill="#5a5a3a" />
      <rect x="20" y="98" width="3" height="50" fill="#5a5a3a" />
      <rect x="60" y="98" width="3" height="50" fill="#5a5a3a" />
      <rect x="100" y="98" width="3" height="50" fill="#5a5a3a" />
      <rect x="140" y="98" width="3" height="50" fill="#5a5a3a" />
      <rect x="180" y="98" width="3" height="50" fill="#5a5a3a" />
      {/* 台钳 */}
      <rect x="75" y="70" width="50" height="30" rx="2" fill="#5a5a5a" />
      <rect x="80" y="65" width="40" height="8" fill="#7a7a7a" />
      <circle cx="100" cy="69" r="3" fill="#3a3a3a" />
      {/* 图纸 */}
      <rect x="20" y="40" width="40" height="30" fill="#f0e8d0" opacity="0.8" />
      <line x1="25" y1="50" x2="55" y2="50" stroke="#3a3a3a" strokeWidth="0.5" />
      <line x1="25" y1="55" x2="50" y2="55" stroke="#3a3a3a" strokeWidth="0.5" />
      <line x1="25" y1="60" x2="52" y2="60" stroke="#3a3a3a" strokeWidth="0.5" />
      {/* 花盆 */}
      <rect x="150" y="75" width="20" height="20" fill="#8a5a3a" />
      <ellipse cx="160" cy="73" rx="12" ry="5" fill="#5a8a5a" opacity="0.6" />
    </>
  ),
  // 老李：收车后的驾驶座——收音机还亮着
  lao_li_radio_night: (
    <>
      <rect width="200" height="150" fill="#0a0f1a" />
      {/* 收音机面板 */}
      <rect x="30" y="40" width="90" height="60" rx="3" fill="#1a1a1a" />
      <circle cx="55" cy="70" r="14" fill="none" stroke="#3a4a5a" strokeWidth="2" />
      <line x1="55" y1="70" x2="63" y2="63" stroke="#3a4a5a" strokeWidth="1.5" />
      <rect x="80" y="50" width="30" height="14" rx="1" fill="#1a3a2a" />
      <rect x="80" y="70" width="24" height="8" rx="1" fill="#2a2a2a" />
      <rect x="80" y="82" width="24" height="8" rx="1" fill="#2a2a2a" />
      {/* 频道指示灯 */}
      <circle cx="36" cy="46" r="2" fill="#e74c3c" opacity="0.8" />
      {/* 车窗外的夜 */}
      <rect x="140" y="20" width="60" height="110" fill="#0d1a2a" />
      <circle cx="170" cy="40" r="3" fill="#f4d03f" opacity="0.6" />
      <circle cx="185" cy="60" r="2" fill="#f4d03f" opacity="0.4" />
      {/* 空车灯 */}
      <rect x="46" y="26" width="58" height="10" rx="2" fill="#e74c3c" opacity="0.7" />
    </>
  ),
  // 周老师：阳台上的花——浇花是他一天的开始
  zhou_flower_balcony: (
    <>
      <rect width="200" height="150" fill="#3a4a3a" />
      <rect x="0" y="0" width="200" height="90" fill="#5a6a7a" opacity="0.3" />
      {/* 花架 */}
      <rect x="30" y="80" width="140" height="8" fill="#5a4a2e" />
      <rect x="40" y="88" width="8" height="50" fill="#4a3a1e" />
      <rect x="152" y="88" width="8" height="50" fill="#4a3a1e" />
      {/* 花盆排 */}
      <path d="M 50 60 L 80 60 L 76 80 L 54 80 Z" fill="#8a5a3a" />
      <circle cx="65" cy="52" r="10" fill="#5a8a5a" />
      <circle cx="60" cy="46" r="4" fill="#8aaa6a" opacity="0.7" />
      <path d="M 100 55 L 130 55 L 126 80 L 104 80 Z" fill="#7a4a2a" />
      <circle cx="115" cy="48" r="9" fill="#4a7a4a" />
      <circle cx="120" cy="42" r="3.5" fill="#8a6a4a" opacity="0.6" />
      {/* 洒水壶 */}
      <rect x="150" y="62" width="16" height="16" rx="2" fill="#5a6a7a" />
      <path d="M 166 66 L 182 60" stroke="#5a6a7a" strokeWidth="2.5" />
    </>
  ),
  // 王总：建材店门脸——白天赔笑的地方
  wang_store_front: (
    <>
      <rect width="200" height="150" fill="#3a3a3a" />
      {/* 卷帘门 */}
      <rect x="30" y="50" width="140" height="90" fill="#2a2a2a" />
      <g opacity="0.4">
        <line x1="30" y1="60" x2="170" y2="60" stroke="#4a4a4a" strokeWidth="1" />
        <line x1="30" y1="70" x2="170" y2="70" stroke="#4a4a4a" strokeWidth="1" />
        <line x1="30" y1="80" x2="170" y2="80" stroke="#4a4a4a" strokeWidth="1" />
        <line x1="30" y1="90" x2="170" y2="90" stroke="#4a4a4a" strokeWidth="1" />
        <line x1="30" y1="100" x2="170" y2="100" stroke="#4a4a4a" strokeWidth="1" />
        <line x1="30" y1="110" x2="170" y2="110" stroke="#4a4a4a" strokeWidth="1" />
        <line x1="30" y1="120" x2="170" y2="120" stroke="#4a4a4a" strokeWidth="1" />
        <line x1="30" y1="130" x2="170" y2="130" stroke="#4a4a4a" strokeWidth="1" />
      </g>
      {/* 招牌 */}
      <rect x="35" y="20" width="130" height="24" rx="2" fill="#8a4a3a" />
      <rect x="45" y="27" width="8" height="10" fill="#f4d03f" opacity="0.5" />
      <rect x="58" y="27" width="40" height="10" fill="#f4d03f" opacity="0.3" />
      {/* 门口的瓷砖样品堆 */}
      <rect x="20" y="120" width="24" height="24" fill="#6a6a7a" opacity="0.6" />
      <rect x="26" y="114" width="24" height="24" fill="#7a7a8a" opacity="0.6" />
    </>
  ),
  // 阿豪：柜台上的泡面——加蛋是给熟客的
  hao_counter_noodles: (
    <>
      <rect width="200" height="150" fill="#0a0a1a" />
      {/* 柜台面 */}
      <rect x="0" y="90" width="200" height="60" fill="#2a2a3a" />
      {/* 泡面桶 */}
      <path d="M 70 60 L 110 60 L 104 95 L 76 95 Z" fill="#d4a017" />
      <ellipse cx="90" cy="60" rx="20" ry="6" fill="#f0e8d0" />
      {/* 蛋 */}
      <ellipse cx="90" cy="60" rx="7" ry="3.5" fill="#f4d03f" opacity="0.7" />
      <ellipse cx="86" cy="58" rx="3" ry="1.5" fill="#fff" opacity="0.5" />
      {/* 热气 */}
      <path d="M 90 50 Q 86 42 90 34 Q 94 28 90 20" stroke="#aaa" strokeWidth="1.5" fill="none" opacity="0.25" />
      {/* 筷子 */}
      <line x1="115" y1="70" x2="140" y2="55" stroke="#8a6a3a" strokeWidth="2" />
      <line x1="118" y1="74" x2="143" y2="59" stroke="#8a6a3a" strokeWidth="2" />
      {/* 柜台上的扫码牌 */}
      <rect x="150" y="80" width="24" height="16" rx="2" fill="#1a3a2a" />
      <rect x="155" y="83" width="14" height="10" fill="#3a7aaa" opacity="0.4" />
    </>
  ),
  // 陈工：书桌上的图纸——给手机支架画的
  chen_blueprint_desk: (
    <>
      <rect width="200" height="150" fill="#1a2a3a" />
      {/* 图纸 */}
      <rect x="20" y="30" width="120" height="90" fill="#0d2a4a" />
      {/* 网格 */}
      <g opacity="0.15">
        <line x1="40" y1="30" x2="40" y2="120" stroke="#4a8aaa" strokeWidth="0.5" />
        <line x1="60" y1="30" x2="60" y2="120" stroke="#4a8aaa" strokeWidth="0.5" />
        <line x1="80" y1="30" x2="80" y2="120" stroke="#4a8aaa" strokeWidth="0.5" />
        <line x1="100" y1="30" x2="100" y2="120" stroke="#4a8aaa" strokeWidth="0.5" />
        <line x1="120" y1="30" x2="120" y2="120" stroke="#4a8aaa" strokeWidth="0.5" />
        <line x1="20" y1="50" x2="140" y2="50" stroke="#4a8aaa" strokeWidth="0.5" />
        <line x1="20" y1="70" x2="140" y2="70" stroke="#4a8aaa" strokeWidth="0.5" />
        <line x1="20" y1="90" x2="140" y2="90" stroke="#4a8aaa" strokeWidth="0.5" />
        <line x1="20" y1="110" x2="140" y2="110" stroke="#4a8aaa" strokeWidth="0.5" />
      </g>
      {/* 手机支架结构线 */}
      <rect x="55" y="60" width="40" height="30" fill="none" stroke="#4aaa8a" strokeWidth="1.5" />
      <line x1="75" y1="60" x2="75" y2="90" stroke="#4aaa8a" strokeWidth="1" />
      <path d="M 55 90 L 45 105 M 95 90 L 105 105" stroke="#4aaa8a" strokeWidth="1.5" />
      {/* 尺寸标注 */}
      <line x1="55" y1="125" x2="95" y2="125" stroke="#8aaa6a" strokeWidth="0.8" />
      <line x1="55" y1="121" x2="55" y2="129" stroke="#8aaa6a" strokeWidth="0.8" />
      <line x1="95" y1="121" x2="95" y2="129" stroke="#8aaa6a" strokeWidth="0.8" />
      {/* 铅笔 */}
      <rect x="150" y="70" width="30" height="4" rx="1" fill="#d4a017" transform="rotate(-20 165 72)" />
    </>
  ),
  // 库人物照片（按原型）
  arch_guard_booth: (
    <>
      <rect width="200" height="150" fill="#1a1a2a" />
      <rect x="20" y="30" width="160" height="80" rx="2" fill="#2a2a3a" />
      <rect x="30" y="40" width="140" height="50" fill="#0a0a1a" />
      {/* 监控屏幕排 */}
      <rect x="35" y="45" width="40" height="22" fill="#1a3a2a" opacity="0.6" />
      <rect x="80" y="45" width="40" height="22" fill="#1a3a2a" opacity="0.5" />
      <rect x="125" y="45" width="40" height="22" fill="#1a3a2a" opacity="0.4" />
      <rect x="0" y="120" width="200" height="30" fill="#0a0a0a" />
      <rect x="80" y="125" width="40" height="15" rx="1" fill="#2a2a2a" />
    </>
  ),
  arch_roadside: (
    <>
      <rect width="200" height="150" fill="#0d1a1a" />
      <rect x="0" y="100" width="200" height="50" fill="#2a2a1a" />
      {/* 路灯 */}
      <rect x="30" y="40" width="3" height="60" fill="#3a3a2a" />
      <circle cx="31.5" cy="38" r="4" fill="#f4d03f" opacity="0.5" />
      <rect x="160" y="40" width="3" height="60" fill="#3a3a2a" />
      <circle cx="161.5" cy="38" r="4" fill="#f4d03f" opacity="0.4" />
      {/* 折叠电动车 */}
      <rect x="85" y="115" width="30" height="15" rx="2" fill="#3a3a3a" />
      <circle cx="92" cy="132" r="5" fill="#2a2a2a" />
      <circle cx="108" cy="132" r="5" fill="#2a2a2a" />
    </>
  ),
  arch_fishing: (
    <>
      <rect width="200" height="80" fill="#1a2a3a" />
      <rect x="0" y="80" width="200" height="70" fill="#2a3a4a" />
      <path d="M 0 80 Q 100 75 200 80" fill="none" stroke="#4a6a8a" strokeWidth="1" opacity="0.4" />
      {/* 钓竿 */}
      <line x1="20" y1="120" x2="120" y2="30" stroke="#5a4a2e" strokeWidth="2" />
      <line x1="120" y1="30" x2="120" y2="75" stroke="#8a8a8a" strokeWidth="0.6" />
      {/* 浮漂 */}
      <circle cx="120" cy="78" r="2.5" fill="#e74c3c" />
      {/* 鱼护 */}
      <rect x="140" y="110" width="20" height="25" rx="2" fill="#3a3a2a" opacity="0.6" />
    </>
  ),
  arch_chess: (
    <>
      <rect width="200" height="150" fill="#3a2e1e" />
      <rect x="20" y="60" width="160" height="70" fill="#5a4a2e" />
      {/* 棋盘格 */}
      <g opacity="0.25">
        <rect x="20" y="60" width="20" height="17.5" fill="#1a1505" />
        <rect x="60" y="60" width="20" height="17.5" fill="#1a1505" />
        <rect x="100" y="60" width="20" height="17.5" fill="#1a1505" />
        <rect x="140" y="60" width="20" height="17.5" fill="#1a1505" />
        <rect x="40" y="77.5" width="20" height="17.5" fill="#1a1505" />
        <rect x="80" y="77.5" width="20" height="17.5" fill="#1a1505" />
        <rect x="120" y="77.5" width="20" height="17.5" fill="#1a1505" />
        <rect x="160" y="77.5" width="20" height="17.5" fill="#1a1505" />
      </g>
      {/* 棋子 */}
      <circle cx="50" cy="55" r="7" fill="#ddd" />
      <rect x="45" y="58" width="10" height="4" fill="#ddd" />
      <circle cx="150" cy="55" r="7" fill="#1a1a1a" />
      <rect x="145" y="58" width="10" height="4" fill="#1a1a1a" />
    </>
  ),
  arch_square: (
    <>
      <rect width="200" height="150" fill="#1a1a2a" />
      <rect x="0" y="110" width="200" height="40" fill="#2a2a1a" />
      {/* 音响 */}
      <rect x="30" y="40" width="30" height="65" rx="2" fill="#2a2a2a" />
      <circle cx="45" cy="60" r="8" fill="none" stroke="#666" strokeWidth="2" />
      <circle cx="45" cy="85" r="5" fill="none" stroke="#666" strokeWidth="1.5" />
      <rect x="140" y="40" width="30" height="65" rx="2" fill="#2a2a2a" />
      <circle cx="155" cy="60" r="8" fill="none" stroke="#666" strokeWidth="2" />
      <circle cx="155" cy="85" r="5" fill="none" stroke="#666" strokeWidth="1.5" />
      {/* 舞步虚影 */}
      <circle cx="100" cy="100" r="3" fill="#8a3a5a" opacity="0.3" />
      <circle cx="80" cy="105" r="2" fill="#8a3a5a" opacity="0.2" />
      <circle cx="120" cy="103" r="2" fill="#8a3a5a" opacity="0.2" />
    </>
  ),
};

// ---------------------------------------------------------------------------
// 女主角头像系统（保留不变）
// ---------------------------------------------------------------------------
const PERSONA_STYLE: Record<PersonaId, { bg: string; hair: string; hairStyle: 'long' | 'twin' | 'bob' | 'bun'; accent: string }> = {
  femme_fatale: { bg: '#1a1216', hair: '#1c1c1c', hairStyle: 'long', accent: '#c0392b' },
  sweet_daughter: { bg: '#141c22', hair: '#4a3020', hairStyle: 'twin', accent: '#e67e22' },
  wise_sister: { bg: '#121a14', hair: '#2c2018', hairStyle: 'bun', accent: '#27ae60' },
  artistic_soul: { bg: '#16141c', hair: '#242424', hairStyle: 'bob', accent: '#8e44ad' },
};

/** 6 款可选头像（发型×发色×领色组合，数据驱动）。 */
export const AVATAR_PRESETS: { id: number; bg: string; hair: string; hairStyle: 'long' | 'twin' | 'bob' | 'bun'; accent: string }[] = [
  { id: 1, bg: '#1a1216', hair: '#1c1c1c', hairStyle: 'long', accent: '#c0392b' },
  { id: 2, bg: '#141c22', hair: '#4a3020', hairStyle: 'twin', accent: '#e67e22' },
  { id: 3, bg: '#121a14', hair: '#2c2018', hairStyle: 'bun', accent: '#27ae60' },
  { id: 4, bg: '#16141c', hair: '#242424', hairStyle: 'bob', accent: '#8e44ad' },
  { id: 5, bg: '#1c1418', hair: '#6b3a2a', hairStyle: 'long', accent: '#d4a017' },
  { id: 6, bg: '#10161c', hair: '#38506b', hairStyle: 'bob', accent: '#2e86ab' },
];

/** 可选头像渲染（AvatarId 1-6）。 */
export function ProfileAvatar({ avatarId, size = 44 }: { avatarId: number; size?: number }) {
  const st = AVATAR_PRESETS[(avatarId - 1) % AVATAR_PRESETS.length];
  return <PersonaFace st={st} size={size} />;
}

export function PersonaAvatar({ personaId, size = 44 }: { personaId: PersonaId; size?: number }) {
  return <PersonaFace st={PERSONA_STYLE[personaId]} size={size} />;
}

function PersonaFace({ st, size }: { st: { bg: string; hair: string; hairStyle: 'long' | 'twin' | 'bob' | 'bun'; accent: string }; size: number }) {
  const hair = st.hairStyle;
  return (
    <svg width={size} height={size} viewBox="0 0 54 54" role="img" aria-label="你">
      <circle cx="27" cy="27" r="26" fill={st.bg} />
      {hair === 'long' && <path d="M 13 30 Q 13 10 27 10 Q 41 10 41 30 L 41 46 L 36 46 L 36 32 Q 36 18 27 16 Q 18 18 18 32 L 18 46 L 13 46 Z" fill={st.hair} />}
      {hair === 'twin' && (
        <g fill={st.hair}>
          <path d="M 15 26 Q 15 11 27 11 Q 39 11 39 26 L 39 34 L 36 34 L 36 28 Q 36 18 27 17 Q 18 18 18 28 L 18 34 L 15 34 Z" />
          <rect x="11" y="30" width="5" height="12" rx="2" />
          <rect x="38" y="30" width="5" height="12" rx="2" />
        </g>
      )}
      {hair === 'bun' && (
        <g fill={st.hair}>
          <circle cx="27" cy="10" r="4" />
          <path d="M 15 26 Q 15 12 27 12 Q 39 12 39 26 L 39 30 Q 33 20 27 20 Q 21 20 15 30 Z" />
        </g>
      )}
      {hair === 'bob' && <path d="M 14 32 Q 13 10 27 10 Q 41 10 40 32 L 37 32 Q 38 16 27 15 Q 16 16 17 32 Z" fill={st.hair} />}
      {/* face */}
      <ellipse cx="27" cy="28" rx="9.5" ry="11" fill="#f2cba5" />
      {/* fringe */}
      <path d="M 18 20 Q 27 12 36 20 Q 30 17 27 19 Q 23 17 18 20" fill={st.hair} />
      {/* eyes: anime-lite */}
      <ellipse cx="23" cy="27" rx="1.7" ry="2.3" fill="#222" />
      <ellipse cx="31" cy="27" rx="1.7" ry="2.3" fill="#222" />
      <circle cx="23.6" cy="26.3" r="0.5" fill="#fff" />
      <circle cx="31.6" cy="26.3" r="0.5" fill="#fff" />
      <path d="M 24.5 31.5 Q 27 33 29.5 31.5" fill="none" stroke="#b05a4a" strokeWidth="1.2" />
      {/* collar accent */}
      <path d="M 18 44 L 27 39 L 36 44 L 36 54 L 18 54 Z" fill={st.accent} />
    </svg>
  );
}
