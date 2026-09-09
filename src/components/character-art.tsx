/**
 * Programmatic SVG portraits (GL2 character-art pattern).
 * v4.9: 老头头像改用文生图 PNG（public/oldmen/，pytools/generate_oldmen.py 管线）——
 *   11 款去重造型覆盖 50 人（6 真脸 + 5 照片型场景），OldManSvg 保留为加载失败兜底，
 *   wary/smiling 表情反应仅存于兜底路径（PNG 为中性表情）。
 * v4.8: 女主角头像改用文生图 PNG（public/avatars/，pytools/generate_avatars.py 管线），
 *   PersonaFace SVG 保留为加载失败兜底；老头头像仍是程序化 SVG。
 * v2.2: 三层渲染——背景场景 + 人脸表情 + 配饰图标。
 * v2.4 美化重绘：三层全部升级——
 *   背景：渐变天空/地面 + 场景光影 + 圆形头像裁切遮罩（构图收紧成证件照感）；
 *   人脸：完整面部结构（耳朵/颞部/下颌/眼袋/法令/眉骨/酒窝/白发高光/皮肤渐变），
 *         三档表情（警惕眯眼/常态/高信任含笑）眼神与眉形联动；
 *   配饰：带渐变金属质感的细节图标，落在右下角光斑上。
 * 老李：深夜公路背景、方向盘配饰、发际线后退、胡茬、微胖脸。
 * 表情由信任/警惕驱动——警惕高时眯眼审视。下线老头头像置灰。
 * 主角头像按人设卡变化。
 */
import { useState } from 'react';
import type { Target, TargetState, BgScene, Accessory } from '../types/target';
import type { PersonaId } from '../types/persona';
import type { ReactElement } from 'react';

/** 头像共用的渐变/滤镜定义（每个 SVG 内部引用；id 冲突无碍——同定义覆盖）。 */
const Defs = () => (
  <defs>
    <radialGradient id="omVig" cx="50%" cy="42%" r="72%">
      <stop offset="0%" stopColor="#000" stopOpacity="0" />
      <stop offset="82%" stopColor="#000" stopOpacity="0" />
      <stop offset="100%" stopColor="#000" stopOpacity="0.42" />
    </radialGradient>
    <linearGradient id="omFace" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f0c49a" />
      <stop offset="100%" stopColor="#d9a678" />
    </linearGradient>
    {/* v4.7 老头肤色竖向渐变三档（顶=hi 调亮 / 底=base）——替代平涂 */}
    <linearGradient id="omFace0" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f8debc" />
      <stop offset="100%" stopColor="#eec69e" />
    </linearGradient>
    <linearGradient id="omFace1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f0cc9e" />
      <stop offset="100%" stopColor="#dfae82" />
    </linearGradient>
    <linearGradient id="omFace2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#dcba88" />
      <stop offset="100%" stopColor="#c69567" />
    </linearGradient>
    {/* v4.7 老头虹膜渐变（上浅下深——男性化暖棕）+ 前置硬闪光热点（左上） */}
    <linearGradient id="omIris" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#6a4e30" />
      <stop offset="100%" stopColor="#2a1e14" />
    </linearGradient>
    <radialGradient id="omFlash" cx="41%" cy="34%" r="66%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
      <stop offset="45%" stopColor="#ffffff" stopOpacity="0.04" />
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="omGlass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#a8c4d8" stopOpacity="0.32" />
      <stop offset="100%" stopColor="#5b8db8" stopOpacity="0.10" />
    </linearGradient>
    <radialGradient id="omSpot" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#f4d03f" stopOpacity="0.18" />
      <stop offset="100%" stopColor="#f4d03f" stopOpacity="0" />
    </radialGradient>
  </defs>
);

// ---------------------------------------------------------------------------
// 背景场景渲染——渐变天空/场景 + 光斑 + 底部渐隐，最后统一圆形裁切
// ---------------------------------------------------------------------------
function BgLayer({ scene, accent }: { scene: BgScene; accent: string }) {
  // 渐变 id 唯一化前缀（多个头像同屏时不互相覆盖）。
  const u = `bg-${scene}`;
  const sky = (top: string, bottom: string) => (
    <linearGradient id={u} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={top} />
      <stop offset="100%" stopColor={bottom} />
    </linearGradient>
  );
  switch (scene) {
    case 'night_road':
      return (
        <>
          <defs>{sky('#0b1626', '#16283a')}</defs>
          <rect width="54" height="54" fill={`url(#${u})`} />
          <circle cx="9" cy="8" r="3.5" fill="#e8e4d0" opacity="0.5" />
          <circle cx="44" cy="12" r="1" fill="#e8e4d0" opacity="0.35" />
          {/* 远处城市灯带 */}
          <g opacity="0.5">
            <rect x="0" y="30" width="6" height="10" fill="#22344a" />
            <rect x="7" y="33" width="5" height="7" fill="#1d2e42" />
            <rect x="46" y="31" width="8" height="9" fill="#22344a" />
            <rect x="42" y="24" width="1.5" height="3" fill="#f4d03f" opacity="0.8" />
            <rect x="48" y="27" width="1.5" height="2" fill="#5b8db8" opacity="0.7" />
          </g>
          {/* 路面 */}
          <path d="M 0 54 L 0 42 L 54 38 L 54 54 Z" fill="#22301f" />
          <path d="M 0 47.5 L 54 44.5" stroke="#c9b96a" strokeWidth="1" strokeDasharray="4 5" opacity="0.55" />
          {/* 车灯掠过 */}
          <circle cx="14" cy="36" r="1.6" fill="#f4d03f" opacity="0.85" />
          <circle cx="41" cy="41" r="1.2" fill="#f4d03f" opacity="0.6" />
          <ellipse cx="27" cy="52" rx="30" ry="7" fill="#f4d03f" opacity="0.05" />
        </>
      );
    case 'study':
      return (
        <>
          <defs>{sky('#332718', '#4a3a22')}</defs>
          <rect width="54" height="54" fill={`url(#${u})`} />
          {/* 书脊 */}
          <g>
            <rect x="3" y="5" width="8.5" height="31" rx="1" fill="#241a0d" />
            <rect x="3.7" y="6" width="7.1" height="29" fill="#5a4a2e" opacity="0.85" />
            <rect x="4.6" y="9" width="5.3" height="1.4" fill="#8a6a3e" opacity="0.55" />
            <rect x="12.8" y="4" width="8" height="32" rx="1" fill="#2a1e0f" />
            <rect x="13.5" y="5" width="6.6" height="30" fill="#6a5232" opacity="0.8" />
            <rect x="14.4" y="8" width="4.9" height="1.4" fill="#9a7a4e" opacity="0.5" />
            <rect x="21.4" y="6" width="7.5" height="30" rx="1" fill="#241a0d" />
            <rect x="22.1" y="7" width="6.1" height="28" fill="#4e4028" opacity="0.85" />
          </g>
          {/* 台灯光晕 */}
          <circle cx="41" cy="12" r="10" fill="#f4d03f" opacity="0.10" />
          <circle cx="41" cy="12" r="5.5" fill="#f4d03f" opacity="0.28" />
          <path d="M 36 16 L 46 16 L 44.5 10 L 37.5 10 Z" fill="#7a5a2e" />
          <rect x="40.5" y="16" width="1.6" height="14" fill="#5a4426" />
          <ellipse cx="41.3" cy="31.5" rx="5.5" ry="1.4" fill="#3a2c18" />
          {/* 案头宣纸一角 */}
          <path d="M 0 46 L 20 43 L 24 54 L 0 54 Z" fill="#e8dcc0" opacity="0.16" />
          <path d="M 4 49.5 L 18 48" stroke="#2a1e0e" strokeWidth="0.7" opacity="0.4" />
        </>
      );
    case 'garage':
      return (
        <>
          <defs>{sky('#242628', '#16171a')}</defs>
          <rect width="54" height="54" fill={`url(#${u})`} />
          {/* 车库纵深：透视搁架 */}
          <rect x="2" y="4" width="50" height="36" rx="2" fill="#2e3134" />
          <rect x="2" y="4" width="50" height="36" rx="2" fill="none" stroke="#3c4045" strokeWidth="0.7" />
          <g opacity="0.85">
            <line x1="2" y1="16" x2="52" y2="16" stroke="#3c4045" strokeWidth="0.7" />
            <line x1="2" y1="28" x2="52" y2="28" stroke="#3c4045" strokeWidth="0.7" />
            <rect x="6" y="11.5" width="4" height="4.5" fill="#5a5f66" />
            <rect x="12" y="10.5" width="5" height="5.5" fill="#4e535a" />
            <rect x="24" y="23.5" width="6" height="4.5" fill="#5a5f66" />
            <rect x="38" y="23.5" width="4" height="4.5" fill="#43484e" />
            <rect x="20" y="12" width="3" height="4" fill="#43484e" />
          </g>
          {/* 吸顶灯管 */}
          <rect x="19" y="1" width="16" height="2.4" rx="1.2" fill="#e8e4d0" opacity="0.65" />
          <ellipse cx="27" cy="6" rx="13" ry="4" fill="#fff" opacity="0.05" />
          {/* 地面反光 */}
          <path d="M 0 54 L 0 42 L 54 42 L 54 54 Z" fill="#121316" />
          <ellipse cx="27" cy="47" rx="16" ry="3" fill="#3c4045" opacity="0.3" />
          <ellipse cx="27" cy="50" rx="20" ry="5" fill="#8fb8d8" opacity="0.03" />
        </>
      );
    case 'internet_cafe':
      return (
        <>
          <defs>{sky('#081222', '#0e1e32')}</defs>
          <rect width="54" height="54" fill={`url(#${u})`} />
          {/* 荧幕光带（顶灯带） */}
          <rect x="0" y="0" width="54" height="2" fill="#2a5a7a" opacity="0.6" />
          {/* 显示器排 + 屏光 */}
          {[4, 19, 34].map((x, i) => (
            <g key={x}>
              <rect x={x} y="7" width="16" height="11" rx="1.4" fill="#141c26" />
              <rect x={x + 1.4} y="8.4" width="13.2" height="8.2" fill="#2a5a7a" opacity={0.28 + i * 0.14} />
              <rect x={x + 2.4} y="9.4" width="11.2" height="6.2" fill="#4a8aaa" opacity={0.2 + i * 0.1} />
              <rect x={x + 5.5} y="18" width="5" height="2.2" fill="#10161e" />
            </g>
          ))}
          {[11.5, 26.5].map((x) => (
            <g key={x}>
              <rect x={x} y="21" width="16" height="10" rx="1.2" fill="#121a24" />
              <rect x={x + 1.2} y="22.2" width="13.6" height="7.6" fill="#2a5a7a" opacity="0.5" />
            </g>
          ))}
          {/* 屏幕蓝辉 */}
          <ellipse cx="27" cy="16" rx="26" ry="10" fill="#4a8aaa" opacity="0.05" />
          {/* 柜台 */}
          <path d="M 0 54 L 0 38 L 54 38 L 54 54 Z" fill="#10161e" />
          <line x1="0" y1="38" x2="54" y2="38" stroke="#2a3a4a" strokeWidth="0.8" />
          <rect x="18" y="41" width="18" height="7" rx="1" fill="#1c2632" />
          <circle cx="22" cy="44.5" r="1.4" fill="#2ecc71" opacity="0.5" />
        </>
      );
    case 'balcony':
      return (
        <>
          <defs>{sky('#24352c', '#1a2a20')}</defs>
          <rect width="54" height="54" fill={`url(#${u})`} />
          {/* 暮色天光 */}
          <rect width="54" height="54" fill="#7a6a8a" opacity="0.08" />
          <circle cx="45" cy="9" r="4" fill="#e8d8a0" opacity="0.3" />
          {/* 远楼剪影 */}
          <g opacity="0.5">
            <path d="M 30 24 L 30 14 L 36 14 L 36 24 Z" fill="#16221a" />
            <path d="M 38 24 L 38 18 L 44 18 L 44 24 Z" fill="#16221a" />
            <rect x="31.5" y="16" width="1.2" height="1.2" fill="#f4d03f" opacity="0.7" />
            <rect x="40.5" y="20" width="1.2" height="1.2" fill="#f4d03f" opacity="0.5" />
          </g>
          {/* 栏杆 */}
          <rect x="0" y="34" width="54" height="2" fill="#3c4a3a" />
          <rect x="0" y="37.5" width="54" height="1" fill="#2e3a2e" />
          {[6, 16, 26, 36, 46].map((x) => (
            <rect key={x} x={x} y="36" width="1.4" height="18" fill="#354232" />
          ))}
          {/* 盆栽：茉莉/绿萝，叶有层次 */}
          <path d="M 8 40 h9 l-1 10 h-7 z" fill="#7a4a2e" />
          <path d="M 8.5 40 L 6 32 M 12.5 40 L 9 29 M 16 40 L 13.5 31" stroke="#3c5c38" strokeWidth="1" />
          <circle cx="12.5" cy="27" r="6.5" fill="#4a7a4a" opacity="0.85" />
          <circle cx="9.5" cy="29" r="3.6" fill="#5a8a56" opacity="0.7" />
          <circle cx="15.5" cy="29.5" r="3.2" fill="#3e6e40" opacity="0.7" />
          <circle cx="11" cy="24" r="0.8" fill="#e8e4d0" opacity="0.8" />
          <circle cx="14.5" cy="26" r="0.8" fill="#e8e4d0" opacity="0.6" />
          {/* 墙面砖线 */}
          <g opacity="0.2">
            <line x1="0" y1="12" x2="30" y2="12" stroke="#16221a" strokeWidth="0.6" />
            <line x1="0" y1="20" x2="30" y2="20" stroke="#16221a" strokeWidth="0.6" />
          </g>
        </>
      );
    case 'guard_booth':
      return (
        <>
          <defs>{sky('#141826', '#1c2233')}</defs>
          <rect width="54" height="54" fill={`url(#${u})`} />
          {/* 岗亭外墙 + 檐 */}
          <rect x="4" y="9" width="46" height="34" rx="1.4" fill="#262c3d" />
          <rect x="3" y="7" width="48" height="2.4" fill="#39415a" />
          {/* 玻璃窗：夜色反光 */}
          <rect x="8" y="12" width="38" height="19" rx="1" fill="#0c101c" />
          <rect x="8" y="12" width="38" height="19" rx="1" fill="url(#omGlass)" opacity="0.5" />
          {/* 窗内监控屏绿光 */}
          <rect x="12" y="16" width="12" height="8" rx="0.8" fill="#1a3a2a" />
          <rect x="13.5" y="17.5" width="9" height="5" fill="#2a6a4a" opacity="0.7" />
          <rect x="27" y="16" width="12" height="8" rx="0.8" fill="#14322a" />
          <rect x="28.5" y="17.5" width="9" height="5" fill="#22605a" opacity="0.55" />
          <rect x="12" y="26" width="27" height="3" rx="0.6" fill="#141c28" />
          {/* 顶灯 */}
          <circle cx="47" cy="5" r="1.8" fill="#f4d03f" opacity="0.75" />
          <circle cx="47" cy="5" r="5" fill="#f4d03f" opacity="0.12" />
          {/* 地面 */}
          <path d="M 0 54 L 0 43 L 54 43 L 54 54 Z" fill="#10131c" />
          <line x1="0" y1="43" x2="54" y2="43" stroke="#2a324a" strokeWidth="0.8" />
        </>
      );
    case 'roadside':
      return (
        <>
          <defs>{sky('#0c1a1e', '#14262a')}</defs>
          <rect width="54" height="54" fill={`url(#${u})`} />
          {/* 深夜天 + 残月 */}
          <circle cx="10" cy="10" r="5" fill="#e8e4d0" opacity="0.5" />
          <circle cx="12.5" cy="8.5" r="4.2" fill="#0c1a1e" opacity="0.85" />
          {/* 酒吧街灯牌（远处霓虹） */}
          <g opacity="0.75">
            <rect x="36" y="12" width="14" height="8" rx="1.2" fill="#3a1a2e" />
            <rect x="38" y="14" width="3" height="4" fill="#c0564f" opacity="0.8" />
            <rect x="43" y="14" width="5" height="4" fill="#d4a24e" opacity="0.6" />
            <circle cx="36" cy="14" r="4.5" fill="#c0564f" opacity="0.1" />
          </g>
          {/* 路灯：锥形光 */}
          <rect x="20" y="12" width="2.4" height="30" fill="#2e3438" />
          <path d="M 21.2 13 L 26 15 L 21.2 17 Z" fill="#5a5f66" />
          <path d="M 16 18 L 27 18 L 31 46 L 12 46 Z" fill="#f4d03f" opacity="0.07" />
          <circle cx="21.2" cy="15.5" r="2.2" fill="#f4d03f" opacity="0.85" />
          {/* 人行道 */}
          <path d="M 0 54 L 0 44 L 54 42 L 54 54 Z" fill="#1a2622" />
          <line x1="0" y1="48" x2="54" y2="46.6" stroke="#2e3a34" strokeWidth="0.7" opacity="0.7" />
          {/* 折叠车轮廓 */}
          <g opacity="0.65">
            <rect x="38" y="37" width="12" height="6" rx="2" fill="#262c2e" />
            <circle cx="40.5" cy="44" r="2.4" fill="#14181a" />
            <circle cx="47" cy="44" r="2.4" fill="#14181a" />
          </g>
        </>
      );
    case 'fishing':
      return (
        <>
          <defs>{sky('#1b2f3e', '#25404e')}</defs>
          <rect width="54" height="54" fill={`url(#${u})`} />
          {/* 晨雾水汽 */}
          <rect x="0" y="0" width="54" height="54" fill="#cde4ea" opacity="0.04" />
          <circle cx="12" cy="8" r="4" fill="#e8e4d0" opacity="0.4" />
          {/* 远岸 */}
          <path d="M 0 26 Q 14 20 28 26 L 54 24 L 54 30 L 0 30 Z" fill="#1e3441" opacity="0.8" />
          {/* 水面 */}
          <rect x="0" y="29" width="54" height="25" fill="#2a4a56" />
          <path d="M 0 31 Q 13.5 28 27 31 T 54 31" stroke="#8fc4d4" strokeWidth="0.7" fill="none" opacity="0.4" />
          <path d="M 0 38 Q 13.5 35 27 38 T 54 38" stroke="#8fc4d4" strokeWidth="0.55" fill="none" opacity="0.28" />
          <path d="M 0 46 Q 13.5 43 27 46 T 54 46" stroke="#8fc4d4" strokeWidth="0.4" fill="none" opacity="0.16" />
          {/* 岸与钓位 */}
          <path d="M 0 54 L 0 44 L 18 42 L 22 54 Z" fill="#3c4436" />
          <rect x="6" y="42.5" width="10" height="2" rx="1" fill="#2a2f26" />
          {/* 芦苇 */}
          <path d="M 47 42 Q 46 34 48 30" stroke="#5c7a52" strokeWidth="0.9" fill="none" />
          <path d="M 49.5 42 Q 50 35 48.5 31" stroke="#4c6a46" strokeWidth="0.7" fill="none" />
          <ellipse cx="48.2" cy="29.5" rx="1" ry="2.6" fill="#7a6a3e" opacity="0.8" />
          <path d="M 50.5 42 Q 52 36 51 32" stroke="#5c7a52" strokeWidth="0.7" fill="none" />
        </>
      );
    case 'chess':
      return (
        <>
          <defs>{sky('#3a2d1a', '#493a22')}</defs>
          <rect width="54" height="54" fill={`url(#${u})`} />
          {/* 树荫光斑（午后） */}
          <circle cx="12" cy="8" r="7" fill="#f4d03f" opacity="0.08" />
          <circle cx="44" cy="6" r="5" fill="#f4d03f" opacity="0.06" />
          {/* 石桌 */}
          <rect x="5" y="28" width="44" height="22" rx="2" fill="#5c4a2c" />
          <rect x="5" y="28" width="44" height="3" fill="#6e5a38" />
          {/* 棋盘（红木镶边） */}
          <rect x="8" y="31" width="38" height="18" fill="#c9b68a" />
          <rect x="8" y="31" width="38" height="18" fill="none" stroke="#7a4a2e" strokeWidth="1.2" />
          <g>
            {[8, 17.5, 27, 36.5].map((x, i) => [31, 40.5].map((y, j) => (
              <rect key={`${i}-${j}`} x={x + ((i + j) % 2 ? 9.5 : 0)} y={y} width="9.5" height="9" fill="#7a5232" opacity={((i + j) % 2 ? 0.55 : 0)} />
            )))}
          </g>
          {/* 对弈中的两枚棋子 */}
          <circle cx="23" cy="30.5" r="3.2" fill="#efe6d4" />
          <rect x="20.5" y="32.5" width="5" height="2" fill="#efe6d4" />
          <circle cx="33" cy="39" r="3.2" fill="#2a1c10" />
          <rect x="30.5" y="41" width="5" height="2" fill="#2a1c10" />
        </>
      );
    case 'square':
      return (
        <>
          <defs>{sky('#1c1a2c', '#26243a')}</defs>
          <rect width="54" height="54" fill={`url(#${u})`} />
          {/* 华灯初上 */}
          {[9, 27, 45].map((x) => (
            <g key={x}>
              <rect x={x - 1} y="2" width="2" height="9" fill="#3c3a4e" />
              <circle cx={x} cy="12" r="2.6" fill="#f4d03f" opacity="0.85" />
              <circle cx={x} cy="12" r="6.5" fill="#f4d03f" opacity="0.10" />
            </g>
          ))}
          {/* 广场砖地（透视） */}
          <path d="M 0 54 L 0 34 L 54 34 L 54 54 Z" fill="#2c2a3c" />
          <g opacity="0.35">
            <line x1="0" y1="38" x2="54" y2="38" stroke="#3a384e" strokeWidth="0.6" />
            <line x1="0" y1="44" x2="54" y2="44" stroke="#3a384e" strokeWidth="0.6" />
            <line x1="0" y1="50" x2="54" y2="50" stroke="#3a384e" strokeWidth="0.6" />
            <line x1="12" y1="34" x2="8" y2="54" stroke="#3a384e" strokeWidth="0.6" />
            <line x1="27" y1="34" x2="27" y2="54" stroke="#3a384e" strokeWidth="0.6" />
            <line x1="42" y1="34" x2="46" y2="54" stroke="#3a384e" strokeWidth="0.6" />
          </g>
          {/* 音箱一角（顶光 + 单元） */}
          <rect x="4" y="30" width="13" height="22" rx="1.2" fill="#22212e" />
          <circle cx="10.5" cy="37" r="4.2" fill="none" stroke="#4c4a5e" strokeWidth="1.4" />
          <circle cx="10.5" cy="37" r="1.6" fill="#3a384e" />
          <circle cx="10.5" cy="46" r="2.6" fill="none" stroke="#4c4a5e" strokeWidth="1" />
          {/* 红绸一角 */}
          <path d="M 44 34 Q 50 30 54 33 L 54 44 Q 49 40 44 42 Z" fill={accent} opacity="0.35" />
        </>
      );
    default:
      return (
        <>
          <defs>{sky('#1c242e', '#25303c')}</defs>
          <rect width="54" height="54" fill={`url(#${u})`} />
          <circle cx="42" cy="10" r="3.5" fill="#e8e4d0" opacity="0.3" />
        </>
      );
  }
}

// ---------------------------------------------------------------------------
// 配饰渲染——金属渐变 + 落点光斑，嵌在头像右下角
// ---------------------------------------------------------------------------
function AccessoryLayer({ accessory }: { accessory: Accessory }) {
  // 光斑底座：所有配饰统一落在一小片光上，避免悬空感。
  const Spot = () => <circle cx="47" cy="48" r="8.5" fill="url(#omSpot)" />;
  switch (accessory) {
    case 'steering_wheel':
      return (
        <g>
          <Spot />
          <circle cx="47" cy="48" r="5.5" fill="none" stroke="#3c3c3c" strokeWidth="2.6" />
          <circle cx="47" cy="48" r="5.5" fill="none" stroke="#9aa0a6" strokeWidth="0.9" opacity="0.8" />
          <line x1="47" y1="42.5" x2="47" y2="53.5" stroke="#9aa0a6" strokeWidth="1.1" />
          <line x1="41.5" y1="48" x2="52.5" y2="48" stroke="#9aa0a6" strokeWidth="1.1" />
          <circle cx="47" cy="48" r="1.6" fill="#5a5f66" />
          <rect x="44.2" y="53.4" width="5.6" height="1.6" rx="0.8" fill="#8a4a3e" />
        </g>
      );
    case 'calligraphy_brush':
      return (
        <g>
          <Spot />
          {/* 笔杆（竹节） */}
          <rect x="45.2" y="37" width="2.2" height="12" rx="1" fill="#7a5a34" />
          <line x1="45.2" y1="41.5" x2="47.4" y2="41.5" stroke="#5a4326" strokeWidth="0.5" opacity="0.8" />
          <line x1="45.2" y1="44.5" x2="47.4" y2="44.5" stroke="#5a4326" strokeWidth="0.5" opacity="0.8" />
          {/* 笔斗 */}
          <rect x="44.2" y="49" width="4.2" height="3" rx="0.6" fill="#2a1a0c" />
          {/* 笔锋（蘸墨） */}
          <path d="M 45 52 L 47.6 52 L 46.3 56 Z" fill="#141414" />
          <circle cx="46.3" cy="53" r="0.7" fill="#2a2a4a" opacity="0.6" />
        </g>
      );
    case 'cigarette':
      return (
        <g>
          <Spot />
          <g transform="rotate(-18 46 48)">
            <rect x="38.5" y="47" width="13" height="2.4" rx="1.2" fill="#e8e4d8" />
            <rect x="49" y="46.6" width="2.6" height="3.2" rx="0.6" fill="#d4553f" />
            <circle cx="51.6" cy="48.2" r="1.1" fill="#f4a03f" opacity="0.5" />
          </g>
          {/* 一缕烟 */}
          <path d="M 52 44 Q 49.5 41 51 38 Q 52.4 35.6 51 33.5" stroke="#b8bec4" strokeWidth="0.8" fill="none" opacity="0.35" strokeLinecap="round" />
          <path d="M 52.8 44.5 Q 51 42 52 39.5" stroke="#b8bec4" strokeWidth="0.5" fill="none" opacity="0.2" strokeLinecap="round" />
        </g>
      );
    case 'gamepad':
      return (
        <g>
          <Spot />
          <rect x="38" y="43" width="16" height="8" rx="3.5" fill="#26323a" />
          <rect x="38" y="43" width="16" height="8" rx="3.5" fill="none" stroke="#3c4a56" strokeWidth="0.7" />
          {/* 十字键 */}
          <rect x="41" y="46.4" width="4.6" height="1.6" rx="0.4" fill="#4c5a66" />
          <rect x="42.5" y="45" width="1.6" height="4.4" rx="0.4" fill="#4c5a66" />
          {/* AB 键 */}
          <circle cx="49.5" cy="46.3" r="1.3" fill="#2ecc71" opacity="0.75" />
          <circle cx="51.8" cy="48" r="1.3" fill="#d4553f" opacity="0.75" />
          <circle cx="41.5" cy="44.4" r="0.4" fill="#5b8db8" opacity="0.6" />
        </g>
      );
    case 'wrench':
      return (
        <g>
          <Spot />
          <g transform="rotate(38 46 47)">
            <rect x="44.9" y="40" width="2.2" height="14" rx="1.1" fill="#7a828c" />
            <rect x="44.9" y="40" width="1" height="14" fill="#a8b0ba" opacity="0.6" />
            <path d="M 43.2 41 L 48.8 41 L 50.5 38.5 L 47.4 36.8 L 44.6 36.8 L 41.5 38.5 Z" fill="#8a929c" />
            <circle cx="46" cy="39.3" r="1.2" fill="#1c222a" />
          </g>
        </g>
      );
    case 'flashlight':
      return (
        <g>
          <Spot />
          <rect x="41.5" y="44" width="3" height="9" rx="1.2" fill="#4c545c" />
          <rect x="41" y="41.5" width="4" height="3" rx="0.8" fill="#7a828c" />
          <circle cx="43" cy="40" r="2.4" fill="#f4d03f" opacity="0.85" />
          <circle cx="43" cy="40" r="5.5" fill="#f4d03f" opacity="0.15" />
          <rect x="42.3" y="46" width="1.4" height="4" rx="0.7" fill="#c0392b" opacity="0.8" />
        </g>
      );
    case 'fishing_rod':
      return (
        <g>
          <Spot />
          <line x1="38" y1="52" x2="53" y2="35" stroke="#6a4e2a" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="38" y1="52" x2="53" y2="35" stroke="#8a6a3e" strokeWidth="0.5" strokeLinecap="round" opacity="0.7" />
          <circle cx="53" cy="35" r="1.1" fill="none" stroke="#9aa0a6" strokeWidth="0.8" />
          <path d="M 53 36 Q 51.5 42 52 47" stroke="#b8bec4" strokeWidth="0.5" fill="none" opacity="0.75" />
          <ellipse cx="52" cy="47.6" rx="1" ry="1.7" fill="#d4553f" opacity="0.9" />
        </g>
      );
    case 'chess_piece':
      return (
        <g>
          <Spot />
          {/* 一枚红方"帅" */}
          <circle cx="46.5" cy="43.5" r="3" fill="#efe6d4" />
          <rect x="43.5" y="46" width="6" height="2.4" rx="0.5" fill="#efe6d4" />
          <rect x="42.5" y="48.6" width="8" height="2" rx="0.8" fill="#d8ccb4" />
          <circle cx="46.5" cy="43.5" r="1.9" fill="none" stroke="#a43a2e" strokeWidth="0.5" />
          <rect x="45.9" y="43.1" width="1.2" height="0.9" fill="#a43a2e" />
        </g>
      );
    case 'speaker':
      return (
        <g>
          <Spot />
          <rect x="39.5" y="39" width="13" height="12" rx="1.4" fill="#1e1c28" />
          <rect x="39.5" y="39" width="13" height="12" rx="1.4" fill="none" stroke="#3c3a4e" strokeWidth="0.8" />
          <circle cx="46" cy="42.5" r="2.8" fill="none" stroke="#5c5a6e" strokeWidth="1.4" />
          <circle cx="46" cy="42.5" r="0.9" fill="#3c3a4e" />
          <circle cx="46" cy="47.5" r="1.7" fill="none" stroke="#5c5a6e" strokeWidth="1" />
          <circle cx="46" cy="47.5" r="0.5" fill="#3c3a4e" />
        </g>
      );
    case 'helmet':
      return (
        <g>
          <Spot />
          <path d="M 40 50 Q 40 40 46.5 40 Q 53 40 53 50 Z" fill="#d4a24e" />
          <path d="M 40 50 Q 40 40 46.5 40 Q 53 40 53 50 Z" fill="#f0d8a0" opacity="0.25" />
          <rect x="40" y="48" width="13" height="2.4" rx="1" fill="#8a6a2e" />
          <path d="M 44.5 46 Q 46.5 40.5 48.5 46" stroke="#8a6a2e" strokeWidth="1" fill="none" opacity="0.8" />
        </g>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// v3.0 老头头像重绘：真·结构化面孔。
//  - 脸型：颅骨椭圆 + 下颌路径拼合，cheeks 驱动下颌宽度（瘦削/适中/富态三档剪影）；
//  - 肤色三档（书生白皙/常年风吹/夜班黝黑）+ 顶光、颧骨光、下颌投影；
//  - 发型三档（中年密发/稀疏后梳/地中海 M 退）+ 霜白两鬓、发丝高光；
//  - 五官：眼白+瞳仁+瞳孔+高光的真眼睛，浓/细眉分档，鼻梁-鼻翼-人中，
//          法令纹、眼袋、鱼尾纹、警惕眉心纹；表情三档联动（眯眼/常态/含笑）；
//  - 胡茬两档（青灰胡茬点阵 / 山羊胡）；
//  - 衣领：翻领 V 领 + 领尖 + 纽扣，翻领阴影。
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// v3.2 老头头像重绘：脸型五档——刻板印象的脸，一眼认出谁是谁。
//  0 国字方脸：下颌垂直、下巴平宽、咬肌鼓（出租车司机/保安——吃方向盘饭的脸）
//  1 富态圆脸：颅宽颌宽、双下巴、脸颊鼓（建材老板——酒桌养出来的脸）
//  2 清瘦尖脸：下颌收窄到尖下巴、面颊凹陷、颧骨高（退休教师——书生的脸）
//  3 瘦长脸：脸长颌窄、人中长、额头高（工程师/钓友—— drawings 的脸）
//  4 年轻短圆脸：脸短、下巴圆、五官紧凑（网吧老板——熬夜的 90 后）
// 每档配专属阴影（咬肌/双下巴/凹颊/颧骨），肤色三档、发际线三档、胡茬两档照旧。
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// v3.3 头像类型学：中国直男社交头像还原——不是人人都拿脸当头像。
// 全部按 96px 圆裁可读标准绘制：高对比剪影 + 真实拍摄瑕疵（乱打的光/歪构图/穿帮背景）。
// ---------------------------------------------------------------------------
function ShotScene({ kind }: { kind: NonNullable<Target['portraitSpec']['shotType']> }) {
  switch (kind) {
    case 'wheel':
      // v4.7 夜间驾驶舱自拍——远景城市散景 → 仪表台 → 前景方向盘+握轮的手（全游戏最常消费的一张）
      return (
        <g>
          <defs>
            <linearGradient id="whDash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#242c34" />
              <stop offset="100%" stopColor="#161c22" />
            </linearGradient>
            <radialGradient id="whGauge" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3a2c1a" />
              <stop offset="72%" stopColor="#1c1814" />
              <stop offset="100%" stopColor="#12100c" />
            </radialGradient>
          </defs>
          {/* 挡风玻璃外的夜（渐变底 + 地平线光带） */}
          <rect width="54" height="54" fill="#0c1218" />
          <path d="M 0 26 Q 27 20 54 26 L 54 36 L 0 36 Z" fill="#1a2430" opacity="0.9" />
          {/* 城市灯散景（两档：远的大糊 / 近的小实） */}
          <g>
            <circle cx="9" cy="12" r="4" fill="#f4b04a" opacity="0.12" />
            <circle cx="43" cy="9" r="5" fill="#f4b04a" opacity="0.1" />
            <circle cx="24" cy="7" r="3.4" fill="#7ab0cc" opacity="0.12" />
            <circle cx="37" cy="15" r="2.6" fill="#f4d03f" opacity="0.14" />
            <circle cx="14" cy="18" r="2" fill="#7ab0cc" opacity="0.16" />
            <circle cx="48" cy="18" r="1.8" fill="#e8684a" opacity="0.16" />
          </g>
          {/* 仪表台暗带 + 双仪表盘（表圈/暗面/指针/琥珀背光） */}
          <rect x="0" y="26" width="54" height="10" fill="url(#whDash)" />
          <circle cx="14" cy="31" r="4.6" fill="none" stroke="#2c343c" strokeWidth="1.2" />
          <circle cx="14" cy="31" r="3.4" fill="url(#whGauge)" />
          <path d="M 14 31 L 12.6 28.6" stroke="#f4d03f" strokeWidth="0.7" strokeLinecap="round" />
          <path d="M 14 31 L 15.8 32.4" stroke="#c8422e" strokeWidth="0.55" strokeLinecap="round" />
          <circle cx="14" cy="31" r="0.5" fill="#4a525a" />
          <circle cx="40" cy="31" r="4.6" fill="none" stroke="#2c343c" strokeWidth="1.2" />
          <circle cx="40" cy="31" r="3.4" fill="url(#whGauge)" />
          <path d="M 40 31 L 38.8 33.2" stroke="#f4d03f" strokeWidth="0.7" strokeLinecap="round" />
          <circle cx="40" cy="31" r="0.5" fill="#4a525a" />
          {/* 收音机绿点 + 出风口 */}
          <circle cx="24.6" cy="30.4" r="0.7" fill="#3acc6e" opacity="0.7" />
          <rect x="20" y="32.4" width="9" height="1.8" rx="0.9" fill="#0e1418" />
          <g stroke="#20282e" strokeWidth="0.6">
            <line x1="21.6" y1="32.8" x2="21.6" y2="33.8" />
            <line x1="24.5" y1="32.8" x2="24.5" y2="33.8" />
            <line x1="27.4" y1="32.8" x2="27.4" y2="33.8" />
          </g>
          {/* 前景方向盘：斜置圆环（深色皮质外圈 + 顶缘高光弧出立体感） */}
          <g transform="rotate(-14 27 50)">
            <circle cx="27" cy="50" r="19.5" fill="none" stroke="#171a1e" strokeWidth="5" />
            <circle cx="27" cy="50" r="19.5" fill="none" stroke="#3a4046" strokeWidth="1.2" />
            {/* 顶缘高光弧（硬闪光方向自洽：左上） */}
            <path d="M 12.6 41.5 A 19.5 19.5 0 0 1 34 33.4" fill="none" stroke="#7a848e" strokeWidth="0.8" opacity="0.5" />
            {/* 轮缘缝线（虚线两段） */}
            <path d="M 14 40 A 19.5 19.5 0 0 1 26 30.6" fill="none" stroke="#4a525a" strokeWidth="0.4" strokeDasharray="1 1.6" opacity="0.7" />
            {/* 辐条三根汇于轮毂 */}
            <path d="M 27 50 L 27 33" stroke="#171a1e" strokeWidth="3.4" strokeLinecap="round" />
            <path d="M 27 50 L 11 56" stroke="#171a1e" strokeWidth="3.4" strokeLinecap="round" />
            <path d="M 27 50 L 43 56" stroke="#171a1e" strokeWidth="3.4" strokeLinecap="round" />
            <circle cx="27" cy="50" r="3.2" fill="#22282e" />
            <circle cx="27" cy="50" r="1.2" fill="#3c444c" />
          </g>
          {/* 握轮的手（左下——自拍时另一只手举机，这只手扶着轮缘） */}
          <g>
            <path d="M 38.6 44.4 Q 42.6 43.4 45.4 45.6 Q 47.4 48 45.8 51.4 Q 43.4 54 39.4 53 Q 36.4 51.6 36.8 48.2 Z" fill="#caa27c" />
            {/* 指节三道 */}
            <path d="M 40.8 45.9 Q 41.4 46.5 40.9 47.3 M 42.6 46.3 Q 43.2 47 42.7 47.8" stroke="#a87e56" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.8" />
            {/* 袖口（深色夹克） */}
            <path d="M 44.8 52.6 L 54 50 L 54 54 L 46.6 54 Z" fill="#2a2e34" />
            <path d="M 45 53.2 L 53.8 50.8" stroke="#14181c" strokeWidth="0.5" opacity="0.7" />
          </g>
          {/* 挡风玻璃斜向反光带 */}
          <path d="M 30 0 L 38 0 L 22 54 L 16 54 Z" fill="#ffffff" opacity="0.045" />
          {/* 顶灯仪表辉光 */}
          <rect x="0" y="0" width="54" height="8" fill="#f4d03f" opacity="0.05" />
        </g>
      );
    case 'business':
      return (
        <g>
          <rect width="54" height="54" fill="#5a6a80" />
          <rect width="54" height="54" fill="#4a5a70" opacity="0.5" />
          <rect x="4" y="4" width="46" height="30" fill="#6a7a90" opacity="0.4" />
          <path d="M 12 54 Q 13 38 27 36 Q 41 38 42 54 Z" fill="#2a3648" />
          <path d="M 24 38 L 27 44 L 30 38 L 28.4 37 L 27 38.6 L 25.6 37 Z" fill="#f4f0e8" />
          <path d="M 27 44 L 25 52 L 29 52 Z" fill="#8a3a3a" />
          <path d="M 21 37 L 24.6 40 L 22 42 Z M 33 37 L 29.4 40 L 32 42 Z" fill="#e8ecf0" />
          <circle cx="27" cy="26" r="8.4" fill="#d9a678" />
          <path d="M 18.6 26 Q 18 15 27 14.4 Q 36 15 35.4 26 L 33 24 Q 33 19 27 18.6 Q 21 19 21 24 Z" fill="#1c1c1e" />
          <rect x="0" y="0" width="54" height="54" fill="#f4d03f" opacity="0.04" />
        </g>
      );
    case 'gym':
      return (
        <g>
          <rect width="54" height="54" fill="#2c3436" />
          <rect x="2" y="6" width="8" height="40" rx="1.6" fill="#3a4448" />
          <rect x="44" y="12" width="7" height="30" rx="1.6" fill="#333c40" />
          <circle cx="27" cy="34" r="12" fill="#22282c" />
          <path d="M 20 26 L 24 32 L 21 34 Z" fill="#c8d4d8" opacity="0.5" />
          <path d="M 14 54 Q 16 40 27 38.6 Q 38 40 40 54 Z" fill="#3a4a52" />
          <rect x="23" y="44" width="8" height="6" rx="1" fill="#14181c" />
          <circle cx="27" cy="24" r="7.6" fill="#d9a678" />
          <path d="M 19.4 24 Q 19 15 27 14.6 Q 35 15 34.6 24 L 32.6 22.4 Q 32.6 18 27 17.6 Q 21.4 18 21.4 22.4 Z" fill="#2a2622" />
          <rect x="0" y="0" width="54" height="8" fill="#8ac4a8" opacity="0.1" />
        </g>
      );
    case 'lowangle':
      return (
        <g>
          <rect width="54" height="54" fill="#9a948c" />
          <rect x="30" y="8" width="20" height="26" fill="#7a746c" opacity="0.6" />
          <rect x="34" y="12" width="4" height="9" fill="#5c564e" />
          <circle cx="27" cy="34" r="15" fill="#d9a678" />
          <ellipse cx="27" cy="42" rx="9" ry="6.4" fill="#c19268" />
          <ellipse cx="23" cy="28" rx="2.6" ry="1.9" fill="#26221c" />
          <ellipse cx="31.6" cy="28.4" rx="2.6" ry="1.9" fill="#26221c" />
          <path d="M 22 39.6 Q 27 42.4 32.4 39.8" stroke="#8a5a3e" strokeWidth="1.4" fill="none" />
          <ellipse cx="24" cy="45" rx="1.9" ry="1.1" fill="#8a5a3e" opacity="0.5" />
          <ellipse cx="30" cy="45" rx="1.9" ry="1.1" fill="#8a5a3e" opacity="0.5" />
          <circle cx="27" cy="30" r="13" fill="#fff" opacity="0.13" />
          <path d="M 19 20 Q 27 15 35 20" stroke="#4a3a2c" strokeWidth="2.4" fill="none" />
        </g>
      );
    case 'zen':
      return (
        <g>
          <rect width="54" height="54" fill="#3a2e22" />
          <rect width="54" height="30" fill="#f4e0b4" opacity="0.14" />
          <rect x="6" y="30" width="42" height="14" rx="2" fill="#5a442c" />
          <rect x="6" y="30" width="42" height="2.4" fill="#6e5638" />
          <ellipse cx="22" cy="26" rx="9" ry="6" fill="#2c2420" />
          <path d="M 30 26 Q 35 25 36 21 L 38 23 Q 36 28 30 28.6 Z" fill="#2c2420" />
          <ellipse cx="22" cy="23" rx="5.6" ry="2.2" fill="#4a3c30" />
          <ellipse cx="40" cy="33" rx="4" ry="2.6" fill="#2c2420" />
          <ellipse cx="14" cy="34" rx="4" ry="2.6" fill="#2c2420" />
          <g fill="#6a4a2c">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
              <circle key={a} cx={27 + 3.2 * Math.cos((a * Math.PI) / 180)} cy={45 + 3.2 * Math.sin((a * Math.PI) / 180)} r="1.05" />
            ))}
          </g>
          <circle cx="46" cy="10" r="6" fill="#f4e0b4" opacity="0.2" />
        </g>
      );
    case 'cap':
      // v4.7 保安帽照——夜色岗亭 + 日光灯辉光下的正脸：帽檐投影横带压额（关键真实感线索）
      return (
        <g>
          <defs>
            <linearGradient id="cpWall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1c222e" />
              <stop offset="100%" stopColor="#12161f" />
            </linearGradient>
            <linearGradient id="cpFace" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d8ae80" />
              <stop offset="100%" stopColor="#c29268" />
            </linearGradient>
            <linearGradient id="cpIris" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6a4e30" />
              <stop offset="100%" stopColor="#2a1e14" />
            </linearGradient>
          </defs>
          {/* 背景：岗亭墙面 + 日光灯管辉光（夜巡的冷白光） */}
          <rect width="54" height="54" fill="url(#cpWall)" />
          <rect x="0" y="8" width="54" height="1.6" fill="#e8ecf0" opacity="0.5" />
          <ellipse cx="27" cy="10" rx="24" ry="9" fill="#c8d4e0" opacity="0.06" />
          <g stroke="#262c38" strokeWidth="0.5" opacity="0.6">
            <line x1="0" y1="20" x2="54" y2="20" />
            <line x1="0" y1="34" x2="54" y2="34" />
          </g>
          {/* 制服肩 + 领（藏蓝） */}
          <path d="M 8 54 Q 10 44 18 41.5 L 27 44 L 36 41.5 Q 44 44 46 54 Z" fill="#3a4a5a" />
          <path d="M 20.4 42.6 L 27 46.6 L 33.6 42.6 L 35.4 43.6 L 27 49.4 L 18.6 43.6 Z" fill="#2a3644" />
          {/* 肩章带 + 胸口徽记 */}
          <rect x="11" y="45" width="7" height="2.4" rx="0.8" fill="#2a3644" />
          <rect x="36" y="45" width="7" height="2.4" rx="0.8" fill="#2a3644" />
          <circle cx="41" cy="51.4" r="1" fill="#c8b06a" opacity="0.7" />
          {/* 脸基座（颅骨+下颌，face 路径同语言小号版） */}
          <ellipse cx="27" cy="28" rx="10.6" ry="11" fill="url(#cpFace)" />
          <path d="M 16.4 30.8 Q 16.8 39.6 27 40.4 Q 37.2 39.6 37.6 30.8 Q 37.2 26.5 27 26.2 Q 16.8 26.5 16.4 30.8 Z" fill="url(#cpFace)" />
          <ellipse cx="27" cy="38.6" rx="2.4" ry="1.2" fill="#dcc09a" opacity="0.35" />
          <ellipse cx="21.4" cy="31.6" rx="2" ry="1.2" fill="#dcc09a" opacity="0.3" />
          <ellipse cx="32.6" cy="31.6" rx="2" ry="1.2" fill="#dcc09a" opacity="0.3" />
          {/* 帽檐投影横带（檐下眉眼压暗——真实感锚点） */}
          <rect x="16.4" y="22.4" width="21.2" height="5.4" fill="#8c6a48" opacity="0.3" />
          {/* 眼（结构化：虹膜渐变+缘环+双高光+粗睑线） */}
          <g>
            <ellipse cx="22.8" cy="26.2" rx="2" ry="1.45" fill="#f0ead8" />
            <ellipse cx="31.2" cy="26.2" rx="2" ry="1.45" fill="#f0ead8" />
            <circle cx="22.8" cy="26.3" r="1" fill="url(#cpIris)" />
            <circle cx="31.2" cy="26.3" r="1" fill="url(#cpIris)" />
            <circle cx="22.8" cy="26.3" r="1" fill="none" stroke="#3d2c1c" strokeWidth="0.2" opacity="0.7" />
            <circle cx="31.2" cy="26.3" r="1" fill="none" stroke="#3d2c1c" strokeWidth="0.2" opacity="0.7" />
            <circle cx="22.8" cy="26.3" r="0.48" fill="#1c1610" />
            <circle cx="31.2" cy="26.3" r="0.48" fill="#1c1610" />
            <circle cx="23.1" cy="25.9" r="0.38" fill="#fff" opacity="0.92" />
            <circle cx="31.5" cy="25.9" r="0.38" fill="#fff" opacity="0.92" />
            <circle cx="22.55" cy="26.8" r="0.17" fill="#fff" opacity="0.55" />
            <circle cx="30.95" cy="26.8" r="0.17" fill="#fff" opacity="0.55" />
            <path d="M 20.9 25.4 Q 22.8 24.9 24.7 25.45" stroke="#26221c" strokeWidth="1.05" fill="none" strokeLinecap="round" />
            <path d="M 29.3 25.45 Q 31.2 24.9 33.1 25.4" stroke="#26221c" strokeWidth="1.05" fill="none" strokeLinecap="round" />
          </g>
          {/* 帽檐下的浓眉 */}
          <path d="M 20.8 23.9 Q 22.8 23.2 24.6 23.8" stroke="#3a342c" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M 29.4 23.8 Q 31.2 23.2 33.2 23.9" stroke="#3a342c" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          {/* 鼻 + 嘴 + 法令纹 */}
          <path d="M 27.6 26.8 Q 26.9 29 26.5 30.4" stroke="#a87e56" strokeWidth="0.85" fill="none" strokeLinecap="round" />
          <ellipse cx="25.8" cy="30.6" rx="0.8" ry="0.5" fill="#a87e56" opacity="0.6" />
          <ellipse cx="28.2" cy="30.6" rx="0.8" ry="0.5" fill="#a87e56" opacity="0.6" />
          <path d="M 23.6 33.4 Q 27 35 30.4 33.4" stroke="#7c4a38" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M 23.8 30.8 Q 23.4 32 23.7 33 M 30.2 30.8 Q 30.6 32 30.3 33" stroke="#a87e56" strokeWidth="0.45" fill="none" opacity="0.45" />
          {/* 胡茬点阵 */}
          <g fill="#3a3026" opacity="0.24">
            <circle cx="24.2" cy="35.6" r="0.45" /><circle cx="26" cy="36.4" r="0.45" /><circle cx="28" cy="36.5" r="0.45" /><circle cx="29.8" cy="35.7" r="0.45" /><circle cx="25.4" cy="34.9" r="0.4" /><circle cx="28.6" cy="35" r="0.4" />
          </g>
          {/* 帽体（帽檐压到眉上方 + 顶钮 + 缝线） */}
          <path d="M 16.6 22.2 Q 17 10.4 27 10 Q 37 10.4 37.4 22.2 L 38.6 23.6 Q 27 19.8 15.4 23.6 Z" fill="#2c2620" />
          <path d="M 15.4 23.4 Q 27 19.6 38.6 23.4" stroke="#4a4438" strokeWidth="1.6" fill="none" />
          <rect x="19.6" y="23.2" width="14.8" height="4.2" rx="2" fill="#1c1a16" />
          <circle cx="27" cy="13.4" r="0.9" fill="#4a4438" />
          <path d="M 20.4 16.4 Q 27 14.6 33.6 16.4" stroke="#141210" strokeWidth="0.5" fill="none" opacity="0.6" />
          {/* 制服反光条（袖口/门襟一道） */}
          <path d="M 12 54 Q 14 40 18 41.5" stroke="#c8d4e0" strokeWidth="1" fill="none" opacity="0.35" />
        </g>
      );
    case 'kid':
      return (
        <g>
          <rect width="54" height="54" fill="#4a3e34" />
          <rect width="54" height="18" fill="#f4c88a" opacity="0.16" />
          <path d="M 6 44 L 20 22 L 30 30 L 24 44 Z" fill="#c0564f" opacity="0.75" />
          <path d="M 34 44 L 34 30 L 44 30 L 44 44 Z" fill="#5a8a8a" opacity="0.6" />
          <circle cx="30" cy="26" r="5" fill="#f0c8a0" opacity="0.9" />
          <path d="M 26 40 Q 30 30 34 40 Z" fill="#e89a5a" opacity="0.9" />
          <path d="M 25 42 Q 30 34 35 42" stroke="#f0c8a0" strokeWidth="1.4" opacity="0.3" fill="none" />
          <rect x="0" y="44" width="54" height="10" fill="#3a322a" />
        </g>
      );
    case 'wallpaper':
      return (
        <g>
          <defs>
            <linearGradient id="wpSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0b070" />
              <stop offset="60%" stopColor="#d8885a" />
              <stop offset="100%" stopColor="#8a5a5a" />
            </linearGradient>
          </defs>
          <rect width="54" height="54" fill="url(#wpSky)" />
          <circle cx="27" cy="22" r="7" fill="#fff0c0" opacity="0.9" />
          <path d="M 0 32 L 14 20 L 26 32 L 38 22 L 54 34 L 54 54 L 0 54 Z" fill="#4a3644" />
          <rect x="0" y="38" width="54" height="16" fill="#3a2c3a" />
          <path d="M 0 40 Q 14 38 27 40 T 54 40" stroke="#fff" strokeWidth="0.6" fill="none" opacity="0.35" />
          <path d="M 0 47 L 54 45" stroke="#fff" strokeWidth="0.4" opacity="0.2" />
        </g>
      );
    case 'fishing':
      // v4.7 钓鱼照——黎明水面：锥形鱼竿斜贯 + 立漂 + 漂周同心水波（钓友头像的情感锚点）
      return (
        <g>
          <defs>
            <linearGradient id="fsSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8a97a4" />
              <stop offset="52%" stopColor="#c9a878" />
              <stop offset="100%" stopColor="#e8c894" />
            </linearGradient>
            <linearGradient id="fsWater" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5a7a6e" />
              <stop offset="100%" stopColor="#2a4640" />
            </linearGradient>
          </defs>
          {/* 黎明天空 + 晨雾 */}
          <rect width="54" height="30" fill="url(#fsSky)" />
          <circle cx="14" cy="12" r="5" fill="#fff4d8" opacity="0.55" />
          <rect x="0" y="0" width="54" height="30" fill="#cde4ea" opacity="0.07" />
          {/* 远岸剪影 + 芦苇 */}
          <path d="M 0 26 Q 14 20.5 28 26 L 54 24 L 54 30 L 0 30 Z" fill="#1e3441" opacity="0.85" />
          <path d="M 47 26 Q 45.8 18 48 14" stroke="#4c6a46" strokeWidth="0.9" fill="none" />
          <path d="M 50 26 Q 51.4 20 49.6 16" stroke="#4c6a46" strokeWidth="0.7" fill="none" />
          <ellipse cx="48" cy="13.4" rx="0.9" ry="2.2" fill="#7a6a3e" opacity="0.8" />
          {/* 水面（渐变 + 三道横纹） */}
          <rect x="0" y="29" width="54" height="25" fill="url(#fsWater)" />
          <path d="M 0 31.5 Q 13.5 29.5 27 31.5 T 54 31.5" stroke="#c4d4cc" strokeWidth="0.7" fill="none" opacity="0.4" />
          <path d="M 0 38 Q 13.5 36 27 38 T 54 38" stroke="#c4d4cc" strokeWidth="0.5" fill="none" opacity="0.28" />
          <path d="M 0 46 Q 13.5 44 27 46 T 54 46" stroke="#c4d4cc" strokeWidth="0.4" fill="none" opacity="0.16" />
          {/* 漂周同心水波（鱼线入水的涟漪） */}
          <g fill="none" stroke="#c4d4cc">
            <ellipse cx="36" cy="43.4" rx="4.4" ry="1.3" strokeWidth="0.55" opacity="0.5" />
            <ellipse cx="36" cy="43.4" rx="8" ry="2.3" strokeWidth="0.45" opacity="0.32" />
            <ellipse cx="36" cy="43.4" rx="12.4" ry="3.6" strokeWidth="0.35" opacity="0.18" />
          </g>
          {/* 鱼竿锥形（粗把→细梢斜贯）+ 导线环 + 线轮鼓包 */}
          <path d="M 6 54 L 7.6 53.4 L 46 10.4 L 44.6 9 Z" fill="#5a3e22" />
          <path d="M 7 54 L 8.6 53.4 L 46.8 10.8 L 45.6 9.6 Z" fill="#7a5a34" opacity="0.45" />
          <ellipse cx="13.6" cy="47.8" rx="2.4" ry="3.2" transform="rotate(38 13.6 47.8)" fill="#2a2c28" />
          <ellipse cx="13.6" cy="47.8" rx="1.1" ry="1.8" transform="rotate(38 13.6 47.8)" fill="#4c545a" />
          <g fill="none" stroke="#c4c8c0" strokeWidth="0.55">
            <path d="M 16.8 44.4 L 19.2 46" />
            <path d="M 22 38.8 L 24.6 40.2" />
            <path d="M 27.6 33.2 L 30.4 34.4" />
            <path d="M 33.6 27.2 L 36.6 28" />
            <path d="M 40 21.6 L 42.8 22" />
          </g>
          {/* 鱼线（竿梢垂弧到立漂） */}
          <path d="M 44.6 9.6 Q 42 26 36 42.6" stroke="#c4c8c0" strokeWidth="0.4" fill="none" opacity="0.7" />
          {/* 立漂（红顶段 + 白身 + 细天线——水面上只露一点） */}
          <line x1="36" y1="40.4" x2="36" y2="42.4" stroke="#e8e4d8" strokeWidth="0.6" />
          <rect x="35.5" y="42.2" width="1" height="1.4" fill="#c8422e" />
          <ellipse cx="36" cy="43.6" rx="0.8" ry="1" fill="#e8e4d8" />
          {/* 岸/钓箱一角（近景压角） */}
          <path d="M 0 54 L 0 46 L 10 44.4 L 14 54 Z" fill="#3c4436" />
          <rect x="2.6" y="45.8" width="8" height="1.6" rx="0.8" fill="#2a2f26" />
        </g>
      );
    case 'brunch':
      // v4.7 精致摆拍——中老年男性朋友圈的「生活品质」：蛋糕+拿铁拉花+盘边折起来的老花镜
      return (
        <g>
          <defs>
            <linearGradient id="brWood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a8845e" />
              <stop offset="100%" stopColor="#8a6a48" />
            </linearGradient>
            <radialGradient id="brGlow" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#fff0cc" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#fff0cc" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* 暖光氛围 + 木桌面（板缝） */}
          <rect width="54" height="54" fill="#c8a888" />
          <rect x="0" y="24" width="54" height="30" fill="url(#brWood)" />
          <g stroke="#6e5236" strokeWidth="0.5" opacity="0.5">
            <line x1="0" y1="36" x2="54" y2="36" />
            <line x1="0" y1="46" x2="54" y2="46" />
            <line x1="18" y1="24" x2="16" y2="54" />
            <line x1="40" y1="24" x2="42" y2="54" />
          </g>
          {/* 头顶暖光池 */}
          <rect width="54" height="54" fill="url(#brGlow)" />
          {/* 白瓷盘 + 蛋糕 + 草莓 */}
          <ellipse cx="19" cy="38" rx="12.5" ry="8" fill="#f4f0e8" />
          <ellipse cx="19" cy="37.4" rx="9.6" ry="6.2" fill="#e8dcc4" />
          <path d="M 13.4 38.6 Q 19 32.6 24.6 38.6 Q 19 41.6 13.4 38.6 Z" fill="#e8b878" />
          <path d="M 14.8 38.4 Q 19 34.4 23.2 38.4" stroke="#d49a56" strokeWidth="0.5" fill="none" opacity="0.7" />
          <path d="M 16.6 33.4 Q 19 31.2 21.4 33.4 L 20.6 35.4 L 17.4 35.4 Z" fill="#d4553f" />
          <circle cx="18" cy="34.6" r="0.3" fill="#fff" opacity="0.5" />
          <ellipse cx="24.4" cy="35.4" rx="1.4" ry="1" fill="#d4553f" opacity="0.9" />
          {/* 拿铁：杯身 + 心形拉花（一撇奶泡） */}
          <path d="M 33 26.5 L 43 26.5 L 42 38.5 Q 38 42 34 38.5 Z" fill="#f4f0e8" />
          <ellipse cx="38" cy="26.5" rx="5" ry="1.6" fill="#e8dcc4" />
          <path d="M 36 26.6 Q 38 24.9 40 26.6 Q 38 28.3 36 26.6 Z" fill="#c9a274" />
          <path d="M 37 26.6 Q 38 25.8 39 26.6" stroke="#f4f0e8" strokeWidth="0.45" fill="none" />
          <rect x="34.5" y="38.8" width="7" height="1.4" rx="0.5" fill="#d8ccb4" opacity="0.7" />
          {/* 盘边一副折起来的老花镜（点题：这份精致是租来的） */}
          <g transform="rotate(-8 44 45)">
            <rect x="38.4" y="43.2" width="10.4" height="2.2" rx="1" fill="#d8c4a4" stroke="#8a7454" strokeWidth="0.45" />
            <line x1="43.4" y1="43.2" x2="43.4" y2="45.4" stroke="#8a7454" strokeWidth="0.5" />
            <circle cx="40.6" cy="44.3" r="0.4" fill="none" stroke="#6e5a3e" strokeWidth="0.3" opacity="0.7" />
            <circle cx="46.4" cy="44.3" r="0.4" fill="none" stroke="#6e5a3e" strokeWidth="0.3" opacity="0.7" />
          </g>
          {/* 餐巾一角 */}
          <path d="M 4 46 L 14 44 L 16.5 54 L 4.5 54 Z" fill="#f4f0e8" opacity="0.85" />
          <path d="M 7 49.5 L 13 48.4" stroke="#c8b89a" strokeWidth="0.4" opacity="0.7" />
        </g>
      );
    default:
      return null;
  }
}

/** v4.9 前的 SVG 老头渲染器（wary/smiling 表情 + 全部场景），保留为 PNG 加载失败兜底。 */
function OldManSvg({ target, state, size = 44 }: { target: Target; state?: TargetState; size?: number }) {
  const spec = target.portraitSpec;
  const wary = (state?.wariness ?? 10) >= 45;
  const smiling = (state?.trust ?? 0) >= 60;
  const blocked = state?.blocked ?? false;
  const uid = `av-${target.id}`;

  // 肤色三档：高光 / 基色 / 阴影 / 线稿色
  const SKIN: Record<number, { hi: string; base: string; shade: string; line: string }> = {
    0: { hi: '#f6d6ae', base: '#eec69e', shade: '#d5a87c', line: '#b9885c' },
    1: { hi: '#eec094', base: '#dfae82', shade: '#c29268', line: '#a87a50' },
    2: { hi: '#d8a878', base: '#c69567', shade: '#a87a4e', line: '#8c6238' },
  };
  const sk = SKIN[spec.skin ?? 1];
  const hairFrost = '#cfd0ce';
  // v3.3 头像类型学：非 face 类型整张头像就是"那张照片"
  const typed = spec.shotType && spec.shotType !== 'face' ? spec.shotType : null;
  // 真实感：按目标 id 的确定性不对称（眼位差 + 一颗痣）
  const h = (target.id.charCodeAt(0) * 31 + target.id.length * 7) % 97;
  const eyeYAsym = ((h % 5) - 2) * 0.16;
  const hasMole = h % 3 === 0;

  // ---- 脸型五档：颅骨宽高 / 下颌半宽 / 下巴位置 / 轮廓类型 / 嘴位移 / 脖宽 ----
  const FACE: Record<number, { rx: number; ry: number; jaw: number; chin: number; type: 'square' | 'round' | 'point' | 'long'; mouthDy: number; neckW: number }> = {
    0: { rx: 11.3, ry: 11.0, jaw: 9.7, chin: 38.0, type: 'square', mouthDy: 0, neckW: 4.3 },
    1: { rx: 11.9, ry: 11.5, jaw: 9.9, chin: 39.6, type: 'round', mouthDy: 0.5, neckW: 4.7 },
    2: { rx: 10.2, ry: 11.2, jaw: 8.0, chin: 37.6, type: 'point', mouthDy: -0.4, neckW: 3.7 },
    3: { rx: 10.7, ry: 12.2, jaw: 8.4, chin: 40.2, type: 'long', mouthDy: 1.0, neckW: 3.8 },
    4: { rx: 10.9, ry: 10.6, jaw: 8.8, chin: 37.8, type: 'round', mouthDy: -0.6, neckW: 3.9 },
  };
  const F = FACE[spec.face ?? 1];
  const rx = F.rx + spec.cheeks * 0.4;
  const jawW = F.jaw + spec.cheeks * 0.7;
  const chinY = F.chin + spec.cheeks * 0.5;
  const mDy = F.mouthDy;
  const hairStyle = spec.hair;                  // 0 密发 / 1 稀疏 / 2 退发
  const bushyBrow = (spec.brow ?? 0) === 1;

  // 下颌轮廓：四种剪影（方/圆/尖/长）
  const JAW_PATH: Record<string, string> = {
    square: `M ${27 - jawW} 24.4 L ${27 - jawW} 31.6 Q ${27 - jawW + 0.1} ${chinY - 2.4} ${27 - 3.3} ${chinY - 0.3} Q ${27} ${chinY + 0.6} ${27 + 3.3} ${chinY - 0.3} Q ${27 + jawW - 0.1} ${chinY - 2.4} ${27 + jawW} 31.6 L ${27 + jawW} 24.4 Z`,
    round: `M ${27 - jawW} 24.4 Q ${27 - jawW - 0.7} ${chinY - 7.5} ${27 - 4.6} ${chinY - 1.1} Q ${27} ${chinY + 1.2} ${27 + 4.6} ${chinY - 1.1} Q ${27 + jawW + 0.7} ${chinY - 7.5} ${27 + jawW} 24.4 Z`,
    point: `M ${27 - jawW} 24.4 Q ${27 - jawW + 0.8} ${chinY - 7.6} ${27 - 1.7} ${chinY - 0.5} Q ${27} ${chinY + 0.5} ${27 + 1.7} ${chinY - 0.5} Q ${27 + jawW - 0.8} ${chinY - 7.6} ${27 + jawW} 24.4 Z`,
    long: `M ${27 - jawW} 24.4 Q ${27 - jawW - 0.1} ${chinY - 7.8} ${27 - 2.7} ${chinY - 0.2} Q ${27} ${chinY + 0.7} ${27 + 2.7} ${chinY - 0.2} Q ${27 + jawW + 0.1} ${chinY - 7.8} ${27 + jawW} 24.4 Z`,
  };

  // 眼睛几何：警惕 → 上睑压低（眯眼审视）；含笑 → 换成月牙眼
  const eyeY = 24.6 + eyeYAsym;
  const scleraRy = wary ? 1.05 : 1.5;
  const lidY = eyeY - scleraRy;

  return (
    <svg width={size} height={size} viewBox="0 0 54 54" role="img" aria-label={target.name}
      style={blocked ? { filter: 'grayscale(1) opacity(0.4)' } : undefined}
    >
      <Defs />
      <g clipPath={`url(#clip-${uid})`}>
        {typed ? <ShotScene kind={typed} /> : (<>
        <BgLayer scene={spec.bgScene ?? 'default'} accent={spec.accent ?? spec.shirtColor} />

        {/* ---- 脖颈与肩（脖宽随脸型：老板的脖子壮，书生的脖子细） ---- */}
        <path d={`M ${27 - F.neckW} 35.5 L ${27 + F.neckW} 35.5 L ${27 + F.neckW - 0.3} 43 L ${27 - F.neckW + 0.3} 43 Z`} fill={sk.shade} />
        <path d={`M ${27 - F.neckW} 35.5 L ${27 + F.neckW} 35.5 L ${27 + F.neckW - 0.1} 38.2 Q 27 40.4 ${27 - F.neckW + 0.1} 38.2 Z`} fill="#00000030" />
        <path d={`M 9.5 54 Q 10.5 45.4 17.5 43.2 Q 22.5 41.6 27 41.6 Q 31.5 41.6 36.5 43.2 Q 43.5 45.4 44.5 54 Z`} fill={spec.shirtColor} />
        <path d={`M 20.2 42.4 L 27 47.4 L 33.8 42.4 L 35.6 43.4 L 27 49.6 L 18.4 43.4 Z`} fill="#00000038" />
        <path d={`M 20.4 42.6 L 24.4 41.4 L 26.4 45.4 L 27 47.4 Z`} fill={spec.shirtColor} />
        <path d={`M 33.6 42.6 L 29.6 41.4 L 27.6 45.4 L 27 47.4 Z`} fill={spec.shirtColor} />
        <path d={`M 20.4 42.6 L 24.4 41.4 L 26.4 45.4 L 27 47.4 Z`} fill="#ffffff" opacity="0.10" />
        <path d={`M 33.6 42.6 L 29.6 41.4 L 27.6 45.4 L 27 47.4 Z`} fill="#ffffff" opacity="0.10" />
        <circle cx="27" cy="51.2" r="0.9" fill="#00000045" />
        <circle cx="27" cy="47.9" r="0.9" fill="#00000045" />

        {/* ---- 耳朵（随颅宽展开） ---- */}
        <ellipse cx={27 - rx - 0.2} cy="27.8" rx="2.1" ry="3.5" fill={sk.base} />
        <ellipse cx={27 + rx + 0.2} cy="27.8" rx="2.1" ry="3.5" fill={sk.base} />
        <path d={`M ${27 - rx + 0.5} 26.8 q 0.9 0.9 0.1 2.3`} stroke={sk.line} strokeWidth="0.6" fill="none" />
        <path d={`M ${27 + rx - 0.5} 26.8 q -0.9 0.9 -0.1 2.3`} stroke={sk.line} strokeWidth="0.6" fill="none" />
        <ellipse cx={27 - rx - 0.2} cy="30.6" rx="1" ry="0.8" fill={sk.shade} opacity="0.5" />
        <ellipse cx={27 + rx + 0.2} cy="30.6" rx="1" ry="0.8" fill={sk.shade} opacity="0.5" />

        {/* ---- 脸基座：颅骨椭圆 + 按脸型的下颌剪影（v4.7 竖向渐变肤） ---- */}
        <ellipse cx="27" cy="24.8" rx={rx} ry={F.ry} fill={`url(#omFace${spec.skin ?? 1})`} />
        <path d={JAW_PATH[F.type]} fill={`url(#omFace${spec.skin ?? 1})`} />
        {/* 下颌两侧阴影（沿各自的轮廓线走） */}
        {F.type === 'square' && (
          <g>
            <path d={`M ${27 - jawW + 0.5} 26 L ${27 - jawW + 0.5} 31.6 Q ${27 - jawW + 0.6} ${chinY - 3} ${27 - 4.4} ${chinY - 1.6}`} stroke={sk.shade} strokeWidth="0.8" fill="none" opacity="0.5" />
            <path d={`M ${27 + jawW - 0.5} 26 L ${27 + jawW - 0.5} 31.6 Q ${27 + jawW - 0.6} ${chinY - 3} ${27 + 4.4} ${chinY - 1.6}`} stroke={sk.shade} strokeWidth="0.8" fill="none" opacity="0.5" />
          </g>
        )}
        {F.type === 'round' && (
          <g>
            <path d={`M ${27 - jawW + 0.7} 25.8 Q ${27 - jawW + 0.2} ${chinY - 6.4} ${27 - 4.8} ${chinY - 2}`} stroke={sk.shade} strokeWidth="0.8" fill="none" opacity="0.45" />
            <path d={`M ${27 + jawW - 0.7} 25.8 Q ${27 + jawW - 0.2} ${chinY - 6.4} ${27 + 4.8} ${chinY - 2}`} stroke={sk.shade} strokeWidth="0.8" fill="none" opacity="0.45" />
          </g>
        )}
        {F.type === 'point' && (
          <g>
            {/* 凹颊：书生瘦脸上的两道凹陷 */}
            <ellipse cx={27 - jawW + 1.2} cy="30.6" rx="1.3" ry="3" fill={sk.shade} opacity="0.4" />
            <ellipse cx={27 + jawW - 1.2} cy="30.6" rx="1.3" ry="3" fill={sk.shade} opacity="0.4" />
          </g>
        )}
        {F.type === 'long' && (
          <g>
            <path d={`M ${27 - jawW + 0.6} 26 Q ${27 - jawW + 0.4} ${chinY - 6} ${27 - 3.2} ${chinY - 1.6}`} stroke={sk.shade} strokeWidth="0.7" fill="none" opacity="0.45" />
            <path d={`M ${27 + jawW - 0.6} 26 Q ${27 + jawW - 0.4} ${chinY - 6} ${27 + 3.2} ${chinY - 1.6}`} stroke={sk.shade} strokeWidth="0.7" fill="none" opacity="0.45" />
          </g>
        )}
        {/* 下巴反光 + 额头顶光 + 太阳穴阴影 */}
        <ellipse cx="27" cy={chinY - 1.6} rx="2.2" ry="1.1" fill={sk.hi} opacity="0.35" />
        <ellipse cx="25" cy="19.6" rx={rx * 0.62} ry="4.2" fill={sk.hi} opacity="0.4" />
        <ellipse cx={27 - rx + 1.4} cy="23.4" rx="1.5" ry="2.6" fill={sk.shade} opacity="0.3" />
        <ellipse cx={27 + rx - 1.4} cy="23.4" rx="1.5" ry="2.6" fill={sk.shade} opacity="0.3" />
        {/* 脸型专属的辨识记号 */}
        {F.type === 'square' && (
          <g>
            {/* 咬肌：吃方向盘饭的脸 */}
            <ellipse cx={27 - jawW + 1.9} cy="29.8" rx="1.7" ry="1.2" fill={sk.hi} opacity="0.3" />
            <ellipse cx={27 + jawW - 1.9} cy="29.8" rx="1.7" ry="1.2" fill={sk.hi} opacity="0.3" />
          </g>
        )}
        {F.type === 'round' && (
          <g>
            {/* 脸颊鼓 + 双下巴：酒桌养出来的脸 */}
            <ellipse cx={27 - jawW + 1.8} cy="32.4" rx="2.4" ry="1.6" fill={sk.hi} opacity="0.4" />
            <ellipse cx={27 + jawW - 1.8} cy="32.4" rx="2.4" ry="1.6" fill={sk.hi} opacity="0.4" />
            {spec.cheeks > 0.6 && (
              <path d={`M ${27 - 3.7} ${chinY - 3.6} Q 27 ${chinY - 2} ${27 + 3.7} ${chinY - 3.6}`} stroke={sk.shade} strokeWidth="0.65" fill="none" opacity="0.5" />
            )}
          </g>
        )}
        {F.type === 'point' && (
          <g>
            {/* 高颧骨：清瘦但骨相分明 */}
            <ellipse cx={27 - 4.9} cy="26.3" rx="1.7" ry="1" fill={sk.hi} opacity="0.4" />
            <ellipse cx={27 + 4.9} cy="26.3" rx="1.7" ry="1" fill={sk.hi} opacity="0.4" />
          </g>
        )}

                {/* ---- 发型八档：发型也是身份（0 蓬乱密发 / 1 三七分厚发 / 2 板寸 / 3 中年短发 / 4 重地中海 / 5 油头背头 / 6 花白背头 / 7 稀疏分头） ---- */}
        {hairStyle === 0 && (
          <g>
            {/* 蓬乱密发：年轻、熬夜、没心思打理 */}
            <path d="M 16.6 25.8 Q 15.8 9 27 8.8 Q 38.2 9 37.4 25.8 L 33.9 25.8 Q 34.1 14.8 27 13.9 Q 19.9 14.8 20.1 25.8 Z" fill={spec.hairColor} />
            <path d="M 20.4 12.2 Q 22 9.6 24.4 10.2 M 27.6 9.4 Q 29.8 9 31.4 10.4" stroke={spec.hairColor} strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M 21.6 17.4 Q 24.4 14.8 27.2 15.2 Q 30.4 14.8 32.6 17.2" stroke={spec.hairColor} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.75" />
            <path d="M 19.6 14.6 Q 27 10.6 34.4 14.6" stroke="#ffffff" strokeWidth="1.1" opacity="0.16" fill="none" />
            <path d="M 16.9 24 Q 16.7 21.4 17.7 19.3 L 19 20.1 Q 18.2 22 18.3 24.6 Z" fill={spec.hairColor} />
            <path d="M 37.1 24 Q 37.3 21.4 36.3 19.3 L 35 20.1 Q 35.8 22 35.7 24.6 Z" fill={spec.hairColor} />
          </g>
        )}
        {hairStyle === 1 && (
          <g>
            {/* 三七分厚发：规整的中年厚发，分缝在左 */}
            <path d="M 16.9 25.7 Q 16.3 9.7 27 9.4 Q 37.7 9.7 37.1 25.7 L 33.9 25.7 Q 34.1 14.9 27 14 Q 19.9 14.9 20.1 25.7 Z" fill={spec.hairColor} />
            <path d="M 22.8 12.4 Q 26.4 10.8 30.8 11.6 Q 34 12.4 35.4 15.2 L 33.6 16 Q 32 13.8 28.6 13.2 Q 25 12.8 22.8 14 Z" fill={spec.hairColor} />
            <path d="M 22.7 12.7 Q 25 11.6 27.4 11.7" stroke="#ffffff" strokeWidth="0.9" opacity="0.28" fill="none" />
            <path d="M 19.8 15 Q 27 11 34.2 15" stroke="#ffffff" strokeWidth="1" opacity="0.15" fill="none" />
          </g>
        )}
        {hairStyle === 2 && (
          <g>
            {/* 板寸：贴着头皮的短茬，天不怕地不怕的发型 */}
            <path d="M 17.2 24.6 Q 16.9 12.7 27 12.3 Q 37.1 12.7 36.8 24.6 L 34.5 24.6 Q 34.8 15.7 27 15.2 Q 19.2 15.7 19.5 24.6 Z" fill={spec.hairColor} />
            <path d="M 17.6 22.6 L 17.2 25.7 L 19.3 25.7 L 19.5 23.2 Z" fill={spec.hairColor} />
            <path d="M 36.4 22.6 L 36.8 25.7 L 34.7 25.7 L 34.5 23.2 Z" fill={spec.hairColor} />
            <path d="M 20.6 14.2 L 20.2 15.4 M 25 13.3 L 24.8 14.5 M 30 13.4 L 30.2 14.6" stroke={spec.hairColor} strokeWidth="0.8" opacity="0.6" />
            <path d="M 20.4 14.4 Q 27 11.9 33.6 14.4" stroke="#ffffff" strokeWidth="0.9" opacity="0.14" fill="none" />
          </g>
        )}
        {hairStyle === 3 && (
          <g>
            {/* 中年短发：发际线略退，但头顶货真价实有头发 */}
            <path d="M 17.1 25.7 Q 16.6 10.2 27 9.8 Q 37.4 10.2 36.9 25.7 L 33.9 25.7 Q 34.1 16.2 27 15.3 Q 19.9 16.2 20.1 25.7 Z" fill={spec.hairColor} />
            <path d="M 21.2 13.2 Q 27 11.5 32.8 13.2" stroke="#ffffff" strokeWidth="1.1" opacity="0.2" fill="none" />
            <path d="M 20.6 16.4 Q 26.8 15 33.2 16.4" stroke={sk.shade} strokeWidth="0.4" fill="none" opacity="0.3" />
            <path d="M 17.4 22.6 L 17.1 25.7 L 19.2 25.7 L 19.4 23.6 Z" fill={spec.hairColor} />
            <path d="M 36.6 22.6 L 36.9 25.7 L 34.8 25.7 L 34.6 23.6 Z" fill={spec.hairColor} />
          </g>
        )}
        {hairStyle === 4 && (
          <g>
            {/* 重地中海：M 形退发 + 头顶秃亮——真正的秃顶才用这档 */}
            <path d="M 17 26 Q 16.6 12.4 23.2 11.6 Q 26.4 11.4 26.4 16.8 Q 26.4 11.4 30.8 11.6 Q 37.4 12.4 37 26 L 34.2 26 Q 34.2 16.4 30 15.4 Q 27.8 15 27.8 18.4 L 26.2 18.4 Q 26.2 15 24 15.4 Q 19.8 16.4 19.8 26 Z" fill={spec.hairColor} />
            <path d="M 18.6 13.8 Q 21 11.8 23.4 11.7" stroke="#ffffff" strokeWidth="1" opacity="0.14" fill="none" />
            <path d="M 32.6 13.8 Q 30.8 11.9 28.8 11.7" stroke="#ffffff" strokeWidth="0.9" opacity="0.12" fill="none" />
            <ellipse cx="27" cy="13.8" rx="2.6" ry="1.6" fill={sk.hi} opacity="0.35" />
            <path d="M 17.2 21.8 L 19.2 22 L 18.8 25.8 L 17 25.8 Z" fill={hairFrost} opacity="0.6" />
            <path d="M 36.8 21.8 L 34.8 22 L 35.2 25.8 L 37 25.8 Z" fill={hairFrost} opacity="0.6" />
          </g>
        )}
        {hairStyle === 5 && (
          <g>
            {/* 油头背头：全数后梳、额头发际平整、发量壮实——老板的头 */}
            <path d="M 16.9 25.2 Q 16.2 9.9 27 9.6 Q 37.8 9.9 37.1 25.2 L 34.1 24.9 Q 34.4 15.2 30.2 14.1 Q 27 13.3 23.8 14.1 Q 19.6 15.2 19.9 24.9 Z" fill={spec.hairColor} />
            <path d="M 27.2 13.7 Q 27.4 11 31.2 10.2" stroke={spec.hairColor} strokeWidth="1.3" fill="none" strokeLinecap="round" />
            <path d="M 23 14.6 Q 22.2 11.8 24.6 10.4" stroke={spec.hairColor} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.8" />
            <path d="M 19.6 13.6 Q 26.8 9.9 34.4 13.6" stroke="#ffffff" strokeWidth="1.6" opacity="0.22" fill="none" />
            <path d="M 22.4 11.6 Q 27 10 31.8 11.6" stroke="#ffffff" strokeWidth="0.9" opacity="0.18" fill="none" />
            <path d="M 17.5 22.8 L 17.2 25.4 L 19.3 25.4 L 19.5 23.6 Z" fill={spec.hairColor} />
            <path d="M 36.5 22.8 L 36.8 25.4 L 34.7 25.4 L 34.5 23.6 Z" fill={spec.hairColor} />
          </g>
        )}
        {hairStyle === 6 && (
          <g>
            {/* 花白背头：银丝后梳，服帖、体面、见岁月 */}
            <path d="M 17.2 25.2 Q 16.6 10.4 27 10.1 Q 37.4 10.4 36.8 25.2 L 34 24.9 Q 34.2 15.8 30 14.8 Q 27 14 24 14.8 Q 19.8 15.8 20 24.9 Z" fill={spec.hairColor} />
            <path d="M 19.2 13.4 Q 26.8 9.9 34.6 13.4" stroke={hairFrost} strokeWidth="1.2" opacity="0.7" fill="none" />
            <path d="M 21.6 11.9 Q 27 10.1 32.6 12" stroke={hairFrost} strokeWidth="0.9" opacity="0.55" fill="none" />
            <path d="M 20.4 17.8 Q 26.6 16.2 33 17.8" stroke={hairFrost} strokeWidth="0.7" opacity="0.4" fill="none" />
            <path d="M 17.6 22.4 L 17.3 25.4 L 19.4 25.4 L 19.6 23.4 Z" fill={hairFrost} opacity="0.7" />
            <path d="M 36.4 22.4 L 36.7 25.4 L 34.6 25.4 L 34.4 23.4 Z" fill={hairFrost} opacity="0.7" />
          </g>
        )}
        {hairStyle === 7 && (
          <g>
            {/* 稀疏分头：发量薄、发际高，但梳理得一丝不苟 */}
            <path d="M 17.4 25.8 Q 17 11.6 27 11.2 Q 37 11.6 36.6 25.8 L 33.8 25.8 Q 33.8 16.6 27 15.8 Q 20.2 16.6 20.2 25.8 Z" fill={spec.hairColor} />
            <path d="M 21.6 13.8 Q 27 12 32.4 13.8" stroke="#ffffff" strokeWidth="1.2" opacity="0.2" fill="none" />
            <path d="M 22.8 12.9 Q 26.6 12.1 30.6 13" stroke="#ffffff" strokeWidth="0.7" opacity="0.16" fill="none" />
            <path d="M 17.6 22.4 L 19.4 22.6 L 18.8 25.8 L 17.4 25.8 Z" fill={hairFrost} opacity="0.55" />
            <path d="M 36.4 22.4 L 34.6 22.6 L 35.2 25.8 L 36.6 25.8 Z" fill={hairFrost} opacity="0.55" />
            <path d="M 21.6 17.4 Q 27 16.2 32.4 17.4" stroke={sk.shade} strokeWidth="0.5" fill="none" opacity="0.5" />
            <path d="M 22.4 20 Q 27 19 31.6 20" stroke={sk.shade} strokeWidth="0.4" fill="none" opacity="0.35" />
          </g>
        )}

        {/* ---- 眉（浓/细两档 × 警惕压低） ---- */}
        {bushyBrow ? (
          <g stroke="#3a342c" strokeLinecap="round" fill="none">
            <path d={`M 20 ${wary ? 21.6 : 20.4} Q 22.2 ${wary ? 21.2 : 19.4} 24.4 ${wary ? 21.8 : 20.6}`} strokeWidth="2" />
            <path d={`M 20.4 ${wary ? 22 : 20.9} Q 22.2 ${wary ? 21.7 : 20} 24.2 ${wary ? 22.3 : 21.1}`} strokeWidth="1.2" opacity="0.7" />
            <path d={`M 29.6 ${wary ? 21.8 : 20.6} Q 31.8 ${wary ? 21.2 : 19.4} 34 ${wary ? 21.6 : 20.4}`} strokeWidth="2" />
            <path d={`M 29.8 ${wary ? 22.3 : 21.1} Q 31.8 ${wary ? 21.7 : 20} 33.6 ${wary ? 22 : 20.9}`} strokeWidth="1.2" opacity="0.7" />
          </g>
        ) : (
          <g stroke="#3a342c" strokeWidth="1.4" strokeLinecap="round" fill="none">
            <path d={`M 20.2 ${wary ? 21.8 : 20.6} Q 22.2 ${wary ? 21.3 : 19.6} 24.2 ${wary ? 21.9 : 20.7}`} />
            <path d={`M 29.8 ${wary ? 21.9 : 20.7} Q 31.8 ${wary ? 21.3 : 19.6} 33.8 ${wary ? 21.8 : 20.6}`} />
          </g>
        )}
        {wary && <path d="M 25.8 21.4 L 26.6 23 M 28.2 21.4 L 27.4 23" stroke={sk.shade} strokeWidth="0.7" strokeLinecap="round" />}

        {/* ---- 眼（v4.7 结构化：虹膜渐变+缘环+双高光+粗睑线；含笑换月牙眼） ---- */}
        {smiling ? (
          <g stroke="#26221c" strokeWidth="1.5" strokeLinecap="round" fill="none">
            <path d="M 20.4 24.4 Q 22.4 22.6 24.4 24.4" />
            <path d="M 29.6 24.4 Q 31.6 22.6 33.6 24.4" />
            <path d="M 20.8 25.4 Q 22.4 26.1 24 25.4" strokeWidth="0.6" opacity="0.5" />
            <path d="M 30 25.4 Q 31.6 26.1 33.2 25.4" strokeWidth="0.6" opacity="0.5" />
          </g>
        ) : (
          <g>
            {/* 眼白（老年人微黄一档） */}
            <ellipse cx="22.4" cy={eyeY} rx="2.1" ry={scleraRy} fill={target.age >= 50 ? '#f0ead8' : '#f6f1e6'} />
            <ellipse cx="31.6" cy={eyeY} rx="2.1" ry={scleraRy} fill={target.age >= 50 ? '#f0ead8' : '#f6f1e6'} />
            {/* 虹膜（渐变 + 缘环） */}
            <circle cx="22.4" cy={eyeY + 0.1} r="1.05" fill="url(#omIris)" />
            <circle cx="31.6" cy={eyeY + 0.1} r="1.05" fill="url(#omIris)" />
            <circle cx="22.4" cy={eyeY + 0.1} r="1.05" fill="none" stroke="#3d2c1c" strokeWidth="0.22" opacity="0.7" />
            <circle cx="31.6" cy={eyeY + 0.1} r="1.05" fill="none" stroke="#3d2c1c" strokeWidth="0.22" opacity="0.7" />
            {/* 瞳孔 */}
            <circle cx="22.4" cy={eyeY + 0.1} r="0.5" fill="#1c1610" />
            <circle cx="31.6" cy={eyeY + 0.1} r="0.5" fill="#1c1610" />
            {/* 双高光：主（左上，随硬闪光方向）+ 次（右下小点） */}
            <circle cx="22.75" cy={eyeY - 0.4} r="0.4" fill="#fff" opacity="0.92" />
            <circle cx="31.95" cy={eyeY - 0.4} r="0.4" fill="#fff" opacity="0.92" />
            <circle cx="22.1" cy={eyeY + 0.55} r="0.18" fill="#fff" opacity="0.55" />
            <circle cx="31.3" cy={eyeY + 0.55} r="0.18" fill="#fff" opacity="0.55" />
            {/* 上睑线（加粗成真睫毛线；自然弧、外眼角平收——不上挑） */}
            <path d={`M 20.3 ${lidY + 0.1} Q 22.4 ${lidY - 0.55} 24.5 ${lidY + (wary ? 0.85 : 0.15)}`} stroke="#26221c" strokeWidth={wary ? 1.05 : 1.15} fill="none" strokeLinecap="round" />
            <path d={`M 29.5 ${lidY + (wary ? 0.85 : 0.15)} Q 31.6 ${lidY - 0.55} 33.7 ${lidY + 0.1}`} stroke="#26221c" strokeWidth={wary ? 1.05 : 1.15} fill="none" strokeLinecap="round" />
            {/* 上睑褶线（极淡一笔） */}
            <path d={`M 20.5 ${lidY - 1} Q 22.4 ${lidY - 1.5} 24.3 ${lidY - 0.9}`} stroke={sk.line} strokeWidth="0.45" fill="none" opacity="0.45" />
            <path d={`M 29.7 ${lidY - 0.9} Q 31.6 ${lidY - 1.5} 33.5 ${lidY - 1}`} stroke={sk.line} strokeWidth="0.45" fill="none" opacity="0.45" />
          </g>
        )}
        <path d="M 20.8 26.6 Q 22.4 27.4 24 26.7" stroke={sk.shade} strokeWidth="0.5" fill="none" opacity="0.55" />
        <path d="M 30 26.7 Q 31.6 27.4 33.2 26.6" stroke={sk.shade} strokeWidth="0.5" fill="none" opacity="0.55" />
        <path d="M 19.6 24.2 L 18.6 23.8 M 19.7 25.2 L 18.7 25.3" stroke={sk.shade} strokeWidth="0.4" opacity="0.4" />
        <path d="M 34.4 24.2 L 35.4 23.8 M 34.3 25.2 L 35.3 25.3" stroke={sk.shade} strokeWidth="0.4" opacity="0.4" />

        {/* ---- 鼻 ---- */}
        <path d="M 27.5 24.6 Q 26.7 27.4 26.3 29.4" stroke={sk.shade} strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <path d="M 26.3 29.4 Q 27 30.1 28 29.5" stroke={sk.line} strokeWidth="0.7" fill="none" />
        <ellipse cx="25.6" cy="29.6" rx="0.9" ry="0.55" fill={sk.shade} opacity="0.65" />
        <ellipse cx="28.6" cy="29.6" rx="0.9" ry="0.55" fill={sk.shade} opacity="0.65" />
        <ellipse cx="27.2" cy="28.6" rx="1.3" ry="0.7" fill={sk.hi} opacity="0.3" />
        {/* v4.7 鼻尖油光（闪光下的 T 区反光——老头油皮，与女主磨皮哑光对照） */}
        <circle cx="27.2" cy="29.2" r="0.5" fill="#ffffff" opacity="0.12" />

        {/* v4.7 额纹（年龄驱动：50+ 三道，年轻的一道更淡） */}
        {target.age >= 50 ? (
          <g stroke={sk.shade} strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.28">
            <path d="M 23 18.6 Q 27 17.9 31 18.6" />
            <path d="M 23.4 20.1 Q 27 19.5 30.6 20.1" />
            <path d="M 23.8 21.6 Q 27 21 30.2 21.6" opacity="0.6" />
          </g>
        ) : (
          <path d="M 23.6 19.8 Q 27 19.2 30.4 19.8" stroke={sk.shade} strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.18" />
        )}

        {hasMole && <circle cx={21.4 + (h % 3)} cy="35.4" r="0.55" fill={sk.line} opacity="0.65" />}

        {/* ---- 法令纹 ---- */}
        <path d={`M 23.6 ${30.2 + mDy} Q 23 ${32.2 + mDy} 23.4 ${33.8 + mDy}`} stroke={sk.shade} strokeWidth="0.5" fill="none" opacity="0.45" />
        <path d={`M 30.4 ${30.2 + mDy} Q 31 ${32.2 + mDy} 30.6 ${33.8 + mDy}`} stroke={sk.shade} strokeWidth="0.5" fill="none" opacity="0.45" />

        {/* ---- 嘴（三档表情 × 脸型的嘴位） ---- */}
        {smiling ? (
          <g>
            <path d={`M 23.2 ${32.4 + mDy} Q 27 ${35.6 + mDy} 30.8 ${32.4 + mDy}`} stroke="#7c4a38" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d={`M 24.4 ${34.4 + mDy} Q 27 ${35.2 + mDy} 29.6 ${34.4 + mDy}`} stroke={sk.shade} strokeWidth="0.6" fill="none" opacity="0.6" />
            <circle cx="22" cy={32.4 + mDy} r="0.7" fill={sk.shade} opacity="0.6" />
            <circle cx="32" cy={32.4 + mDy} r="0.7" fill={sk.shade} opacity="0.6" />
          </g>
        ) : wary ? (
          <path d={`M 24 ${33.6 + mDy} Q 27 ${33 + mDy} 30 ${33.7 + mDy}`} stroke="#7c4a38" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        ) : (
          <path d={`M 23.6 ${32.8 + mDy} Q 27 ${34 + mDy} 30.4 ${32.8 + mDy}`} stroke="#7c4a38" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        )}

        {/* ---- 胡茬：1 青灰点阵 / 2 山羊胡（随嘴位微移） ---- */}
        {spec.beard === 1 && (
          <g fill="#3a3026" opacity="0.26">
            <ellipse cx="27" cy={35 + mDy * 0.6} rx="6.4" ry="3.4" opacity="0.5" />
            <circle cx="22.2" cy={33.4 + mDy * 0.6} r="0.5" /><circle cx="23.4" cy={34.6 + mDy * 0.6} r="0.5" /><circle cx="24.4" cy={35.8 + mDy * 0.6} r="0.5" />
            <circle cx="25.8" cy={36.6 + mDy * 0.6} r="0.5" /><circle cx="27.4" cy={37 + mDy * 0.6} r="0.5" /><circle cx="29" cy={36.4 + mDy * 0.6} r="0.5" />
            <circle cx="30.4" cy={35.4 + mDy * 0.6} r="0.5" /><circle cx="31.6" cy={34 + mDy * 0.6} r="0.5" /><circle cx="32.4" cy={32.8 + mDy * 0.6} r="0.5" />
            <circle cx="21.6" cy={31.8 + mDy * 0.6} r="0.5" /><circle cx="26.4" cy={34.8 + mDy * 0.6} r="0.5" /><circle cx="28.6" cy={34.9 + mDy * 0.6} r="0.5" />
          </g>
        )}
        {spec.beard === 2 && (
          <g fill="#2e2620" opacity="0.5">
            <path d={`M 24 ${31.6 + mDy} Q 27 ${30.8 + mDy} 30 ${31.6 + mDy} L 29.6 ${32.8 + mDy} Q 27 ${32.2 + mDy} 24.4 ${32.8 + mDy} Z`} />
            <path d={`M 24.8 ${34.6 + mDy} Q 27 ${34 + mDy} 29.2 ${34.6 + mDy} Q 29 ${37.6 + mDy} 27 ${38.6 + mDy} Q 25 ${37.6 + mDy} 24.8 ${34.6 + mDy} Z`} />
          </g>
        )}

        {/* ---- 颧骨高光（清瘦脸已单独画，这里给其余脸型） ---- */}
        {F.type !== 'point' && (
          <g>
            <ellipse cx="21.6" cy="29.2" rx="2" ry="1.2" fill={sk.hi} opacity="0.32" />
            <ellipse cx="32.4" cy="29.2" rx="2" ry="1.2" fill={sk.hi} opacity="0.32" />
          </g>
        )}

        {/* ---- 眼镜（细金属框 + 斜向反光 + 鼻托） ---- */}
        {spec.glasses > 0 && (
          <g>
            <rect x="19.6" y="21.6" width="5.8" height="5.2" rx="2.2" fill="url(#omGlass)" stroke="#7c848c" strokeWidth="0.8" />
            <rect x="28.6" y="21.6" width="5.8" height="5.2" rx="2.2" fill="url(#omGlass)" stroke="#7c848c" strokeWidth="0.8" />
            <path d="M 25.4 23.6 Q 27 23.1 28.6 23.6" stroke="#7c848c" strokeWidth="0.7" fill="none" />
            <path d="M 19.6 22.8 L 17.4 23.6" stroke="#7c848c" strokeWidth="0.7" />
            <path d="M 34.4 22.8 L 36.6 23.6" stroke="#7c848c" strokeWidth="0.7" />
            <path d="M 20.4 22.4 L 22.4 23.1" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" />
            <path d="M 29.4 22.4 L 31.4 23.1" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" />
          </g>
        )}

        <AccessoryLayer accessory={spec.accessory ?? 'none'} />

        {/* ---- v4.7 摄影后期（face 路径）：鼻尖油光之上、暗角之下的颗粒 ---- */}
        </>)}
        {/* ---- v4.7 摄影后期（全路径共用）：前置硬闪光热点 + 感光颗粒（位置按 id 哈希确定性派生） ---- */}
        <rect width="54" height="54" fill="url(#omFlash)" />
        <g fill="#ffffff">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const gx = 6 + ((h * (i + 3)) % 43);
            const gy = 6 + ((h * (i + 7)) % 43);
            const gr = 0.3 + ((h + i * 13) % 5) * 0.09;
            return <circle key={i} cx={gx} cy={gy} r={gr} opacity={0.08 + ((h + i * 31) % 7) * 0.01} />;
          })}
        </g>
        <rect width="54" height="54" fill="url(#omVig)" />
      </g>
      <clipPath id={`clip-${uid}`}>
        <circle cx="27" cy="27" r="26" />
      </clipPath>
      <circle cx="27" cy="27" r="26" fill="none" stroke="#00000055" strokeWidth="1.4" />
      <circle cx="27" cy="27" r="26" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.08" />
    </svg>
  );
}

/**
 * v4.9 老头头像：文生图 PNG（public/oldmen/，pytools/generate_oldmen.py 管线）。
 * 50 个目标按 (archetype, shotType) 归并为 11 款去重造型——组合在全库唯一，直接查表。
 * 加载失败时 onError 回退 OldManSvg（保留 wary/smiling/blocked 全部逻辑）；
 * 下线态（blocked）在 img 上用同一 CSS 滤镜复刻 SVG 的灰度+透明。
 */
function oldManSlug(target: Target): string {
  const spec = target.portraitSpec;
  const shot = spec.shotType && spec.shotType !== 'face' ? spec.shotType : 'face';
  const MAP: Record<string, string> = {
    'divorced_driver:wheel': 'lao_li',
    'designated_driver:wheel': 'driver',
    'night_guard:cap': 'guard',
    'fisherman:fishing': 'fish',
    'square_dancer:brunch': 'dance2',
    'square_dancer:face': 'dance',
    'chess_uncle:face': 'chess',
    'widowed_teacher:face': 'zhou',
    'married_boss:face': 'wang',
    'cafe_owner_ninety:face': 'hao',
    'lonely_engineer:face': 'chen',
  };
  return MAP[`${target.archetype}:${shot}`] ?? '';
}

function OldManImg({ slug, target, state, size }: { slug: string; target: Target; state?: TargetState; size: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <OldManSvg target={target} state={state} size={size} />;
  const filter = state?.blocked ? 'grayscale(1) opacity(0.4)' : undefined;
  return (
    <img
      src={`/oldmen/${slug}.png`}
      alt={target.name}
      width={size}
      height={size}
      style={{
        borderRadius: '50%',
        display: 'block',
        // 对应 SVG 的外圈暗描边环（视觉延续）
        boxShadow: '0 0 0 1px rgba(0,0,0,0.33)',
        filter,
      }}
      onError={() => setFailed(true)}
    />
  );
}

export function OldManAvatar({ target, state, size = 44 }: { target: Target; state?: TargetState; size?: number }) {
  const slug = oldManSlug(target);
  if (!slug) return <OldManSvg target={target} state={state} size={size} />; // 未覆盖的造型走 SVG
  return <OldManImg slug={slug} target={target} state={state} size={size} />;
}

// ---------------------------------------------------------------------------
// v2.2：照片立绘渲染器——比头像更大（200×150），场景更丰富
// v2.4 美化重绘：统一暗角 + 光源方向 + 材质细节（金属/水波/烟雾/木纹），
//               保留每张原有的构图与叙事（谁的世界、哪个时辰）。
// ---------------------------------------------------------------------------
export function PhotoRender({ photoId }: { photoId: string }) {
  const scenes = PHOTO_SCENES[photoId];
  if (!scenes) return null;
  // v3.0 摄影后期：光渗方向按 photoId 稳定哈希——每张照片有自己的光，但同图不变。
  let h = 0;
  for (let i = 0; i < photoId.length; i++) h = (h * 31 + photoId.charCodeAt(i)) >>> 0;
  const warmLeak = h % 2 === 0;
  const lx = warmLeak ? 12 : 188;
  const ly = h % 3 === 0 ? 14 : 136;
  return (
    <svg width="200" height="150" viewBox="0 0 200 150" role="img" aria-label="照片">
      <defs>
        <radialGradient id="phVig" cx="50%" cy="44%" r="75%">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="78%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.38" />
        </radialGradient>
        <radialGradient id="phLeak" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={warmLeak ? '#f4b06a' : '#7aa8cc'} stopOpacity="0.13" />
          <stop offset="60%" stopColor={warmLeak ? '#f4b06a' : '#7aa8cc'} stopOpacity="0.05" />
          <stop offset="100%" stopColor={warmLeak ? '#f4b06a' : '#7aa8cc'} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="phMetal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9aa0a6" />
          <stop offset="50%" stopColor="#5a5f66" />
          <stop offset="100%" stopColor="#3a3f45" />
        </linearGradient>
        <linearGradient id="phSky0" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1220" />
          <stop offset="100%" stopColor="#16222f" />
        </linearGradient>
      </defs>
      {scenes}
      {h % 3 === 0 && <circle cx={lx} cy={ly} r="30" fill="#fff" opacity="0.11" />}
      <rect width="200" height="150" fill={h % 2 === 0 ? '#f4a03f' : '#7aa8cc'} opacity="0.045" />
      <circle cx={lx} cy={ly} r="80" fill="url(#phLeak)" />
      <g fill="#fff">
        <circle cx="26" cy="30" r="0.5" opacity="0.1" />
        <circle cx="64" cy="14" r="0.45" opacity="0.09" />
        <circle cx="102" cy="52" r="0.5" opacity="0.08" />
        <circle cx="146" cy="24" r="0.45" opacity="0.1" />
        <circle cx="178" cy="66" r="0.5" opacity="0.08" />
        <circle cx="118" cy="96" r="0.45" opacity="0.08" />
        <circle cx="44" cy="118" r="0.5" opacity="0.07" />
        <circle cx="170" cy="126" r="0.45" opacity="0.09" />
      </g>
      <rect width="200" height="150" fill="url(#phVig)" />
    </svg>
  );
}

/** 照片场景库——按 photoId 索引。每张是一段 SVG 几何抽象（v2.4 精修重绘）。 */
const PHOTO_SCENES: Record<string, ReactElement> = {
  // 老李：夜间出租车内视角——挡风玻璃外的城市、方向盘、仪表微光
  lao_li_taxi_night: (
    <>
      <rect width="200" height="150" fill="url(#phSky0)" />
      {/* 挡风玻璃外：渐变夜空 + 城市灯带 */}
      <rect x="0" y="0" width="200" height="105" fill="#101a28" />
      <g opacity="0.85">
        <path d="M 0 78 L 200 74 L 200 105 L 0 105 Z" fill="#0d1622" />
        <path d="M 14 60 L 14 78 L 38 78 L 38 66 Z" fill="#141f2c" />
        <path d="M 42 56 L 42 78 L 66 78 L 66 62 Z" fill="#101a26" />
        <path d="M 138 62 L 138 78 L 160 78 L 160 58 Z" fill="#141f2c" />
        <path d="M 166 58 L 166 78 L 192 78 L 192 63 Z" fill="#101a26" />
      </g>
      {/* 路灯光晕 */}
      <circle cx="30" cy="24" r="5" fill="#f4d03f" opacity="0.85" />
      <circle cx="30" cy="24" r="14" fill="#f4d03f" opacity="0.12" />
      <circle cx="62" cy="19" r="3.4" fill="#f4d03f" opacity="0.55" />
      <circle cx="62" cy="19" r="9" fill="#f4d03f" opacity="0.08" />
      <circle cx="152" cy="21" r="3.8" fill="#e8e4d0" opacity="0.5" />
      <circle cx="182" cy="17" r="4.6" fill="#f4d03f" opacity="0.75" />
      <circle cx="182" cy="17" r="12" fill="#f4d03f" opacity="0.1" />
      {/* 对向车流红点 */}
      <circle cx="96" cy="52" r="1.6" fill="#e05646" opacity="0.7" />
      <circle cx="78" cy="58" r="1.2" fill="#e05646" opacity="0.5" />
      {/* 仪表台 */}
      <path d="M 0 150 L 0 104 L 200 100 L 200 150 Z" fill="#171310" />
      <path d="M 0 112 L 200 108" stroke="#241e18" strokeWidth="2" />
      {/* 方向盘（金属渐变 + 辐条） */}
      <circle cx="100" cy="118" r="30" fill="none" stroke="url(#phMetal)" strokeWidth="5" />
      <line x1="100" y1="88" x2="100" y2="112" stroke="url(#phMetal)" strokeWidth="4.4" />
      <line x1="70" y1="118" x2="96" y2="118" stroke="url(#phMetal)" strokeWidth="4.4" />
      <line x1="104" y1="118" x2="130" y2="118" stroke="url(#phMetal)" strokeWidth="4.4" />
      <circle cx="100" cy="118" r="6.5" fill="#22262b" />
      <circle cx="100" cy="118" r="2.6" fill="#3a4048" />
      {/* 仪表盘微光（转速/时速） */}
      <rect x="76" y="104" width="13" height="5.4" rx="1.4" fill="#2a4a6a" opacity="0.85" />
      <rect x="111" y="104" width="13" height="5.4" rx="1.4" fill="#2a4a6a" opacity="0.85" />
      {/* 挂挡杆 */}
      <path d="M 148 128 Q 154 122 158 116" stroke="#3a3f45" strokeWidth="3" fill="none" />
      <circle cx="158" cy="114" r="3.4" fill="#4a5058" />
      {/* 空车灯（后视镜里的红） */}
      <rect x="16" y="118" width="14" height="6" rx="2" fill="#d4553f" opacity="0.28" />
    </>
  ),
  // 周老师：书桌俯拍——宣纸、毛笔、挂钟、墨迹
  zhou_calligraphy: (
    <>
      <rect width="200" height="150" fill="#33281a" />
      <rect width="200" height="150" fill="#5a4a2e" opacity="0.25" />
      {/* 桌面木纹 */}
      <g opacity="0.14" stroke="#1a120a">
        <path d="M 0 128 Q 60 124 200 130" strokeWidth="1" fill="none" />
        <path d="M 0 138 Q 80 132 200 140" strokeWidth="1" fill="none" />
        <path d="M 30 0 L 24 150" strokeWidth="1" fill="none" />
        <path d="M 170 0 L 176 150" strokeWidth="1" fill="none" />
      </g>
      {/* 宣纸（带毛边） */}
      <path d="M 38 28 L 160 26 L 158 112 L 36 114 Z" fill="#efe8d4" />
      <path d="M 38 28 L 160 26 L 158 112 L 36 114 Z" fill="#d9cfae" opacity="0.28" />
      {/* 字帖格线 */}
      <g stroke="#a89878" strokeWidth="0.6" opacity="0.55">
        <line x1="64" y1="30" x2="64" y2="110" />
        <line x1="92" y1="30" x2="92" y2="110" />
        <line x1="120" y1="30" x2="120" y2="110" />
        <line x1="146" y1="30" x2="146" y2="110" />
        <line x1="38" y1="54" x2="160" y2="52" />
        <line x1="38" y1="80" x2="160" y2="78" />
      </g>
      {/* 正在写的"远"字笔迹 */}
      <g stroke="#1a1a1a" fill="none" strokeLinecap="round">
        <path d="M 68 40 Q 74 36 80 40" strokeWidth="2.4" />
        <path d="M 74 36 L 74 52" strokeWidth="2.4" />
        <path d="M 66 46 L 82 46" strokeWidth="2.4" />
        <path d="M 66 60 Q 74 56 80 62" strokeWidth="2.4" />
        <path d="M 70 68 Q 78 74 84 66" strokeWidth="2.2" />
      </g>
      {/* 毛笔（搁在笔山上） */}
      <rect x="152" y="34" width="3.4" height="52" rx="1.4" fill="#7a5a34" transform="rotate(14 154 60)" />
      <line x1="153" y1="42" x2="154.5" y2="84" stroke="#5a4326" strokeWidth="0.7" transform="rotate(14 154 60)" opacity="0.8" />
      <rect x="149.5" y="86" width="9.5" height="12" rx="2" fill="#241608" transform="rotate(14 154 60)" />
      <path d="M 152.5 98 L 156.5 98 L 154.5 108 Z" fill="#141414" transform="rotate(14 154 60)" />
      <path d="M 138 92 L 172 84" stroke="#4a3a22" strokeWidth="3.4" strokeLinecap="round" />
      {/* 镇纸 */}
      <rect x="30" y="96" width="8" height="16" rx="2" fill="#3a3a4a" opacity="0.85" />
      <rect x="30" y="96" width="8" height="3" fill="#5a5a6a" opacity="0.8" />
      {/* 挂钟（秒针在走） */}
      <circle cx="176" cy="24" r="13" fill="#f0e8d4" />
      <circle cx="176" cy="24" r="13" fill="none" stroke="#7a5a34" strokeWidth="2" />
      <g stroke="#3a2c1a">
        <line x1="176" y1="12.4" x2="176" y2="14.6" strokeWidth="1.2" />
        <line x1="187.6" y1="24" x2="185.4" y2="24" strokeWidth="1.2" />
        <line x1="176" y1="35.6" x2="176" y2="33.4" strokeWidth="1.2" />
        <line x1="164.4" y1="24" x2="166.6" y2="24" strokeWidth="1.2" />
        <line x1="176" y1="24" x2="176" y2="16" strokeWidth="1.6" />
        <line x1="176" y1="24" x2="182" y2="27" strokeWidth="1.4" />
      </g>
      <line x1="176" y1="24" x2="171" y2="30" stroke="#a43a2e" strokeWidth="0.8" />
      {/* 墨迹与朱印 */}
      <ellipse cx="64" cy="104" rx="7" ry="2.6" fill="#1a1a1a" opacity="0.72" />
      <ellipse cx="88" cy="110" rx="4.6" ry="1.8" fill="#1a1a1a" opacity="0.5" />
      <rect x="128" y="98" width="10" height="10" rx="1" fill="#a43a2e" opacity="0.75" />
    </>
  ),
  // 王总：车库视角——车内望出去的烟、方向盘、夜
  wang_garage_smoke: (
    <>
      <rect width="200" height="150" fill="#141416" />
      {/* 车库顶灯（冷光管） */}
      <rect x="76" y="4" width="48" height="3" rx="1.5" fill="#e8e4d0" opacity="0.55" />
      <ellipse cx="100" cy="10" rx="42" ry="8" fill="#fff" opacity="0.045" />
      {/* 车窗外：车库纵深 */}
      <rect x="20" y="26" width="160" height="62" rx="5" fill="#1d1f22" />
      <g opacity="0.8">
        <rect x="30" y="38" width="60" height="42" fill="#17181b" />
        <rect x="106" y="38" width="60" height="42" fill="#17181b" />
        {/* 搁架上的旧物 */}
        <rect x="36" y="44" width="8" height="10" fill="#2a2d31" />
        <rect x="48" y="46" width="6" height="8" fill="#25282c" />
        <rect x="112" y="42" width="10" height="12" fill="#2a2d31" />
        <rect x="126" y="46" width="7" height="8" fill="#25282c" />
      </g>
      <rect x="20" y="26" width="160" height="62" rx="5" fill="none" stroke="#2c2f33" strokeWidth="2" />
      <path d="M 20 74 L 180 74" stroke="#24272b" strokeWidth="1.4" opacity="0.7" />
      {/* 地面（反光） */}
      <path d="M 0 150 L 0 104 L 200 104 L 200 150 Z" fill="#0e0f11" />
      <ellipse cx="100" cy="120" rx="70" ry="12" fill="#8fb8d8" opacity="0.03" />
      {/* 方向盘 */}
      <circle cx="96" cy="122" r="22" fill="none" stroke="url(#phMetal)" strokeWidth="4" />
      <line x1="96" y1="100" x2="96" y2="118" stroke="url(#phMetal)" strokeWidth="3.4" />
      <line x1="74" y1="122" x2="92" y2="122" stroke="url(#phMetal)" strokeWidth="3.4" />
      <line x1="100" y1="122" x2="118" y2="122" stroke="url(#phMetal)" strokeWidth="3.4" />
      <circle cx="96" cy="122" r="4.6" fill="#22262b" />
      {/* 车：指间的烟（多层烟霭） */}
      <g transform="rotate(-16 148 116)">
        <rect x="132" y="114" width="15" height="2.8" rx="1.4" fill="#e8e4d8" />
        <rect x="144" y="113.4" width="3" height="3.8" rx="0.8" fill="#e0563e" />
        <circle cx="147" cy="116.2" r="1.4" fill="#f4a03f" opacity="0.6" />
      </g>
      <g fill="#aab2ba">
        <circle cx="152" cy="104" r="3" opacity="0.16" />
        <circle cx="157" cy="94" r="4.4" opacity="0.11" />
        <circle cx="163" cy="81" r="5.8" opacity="0.07" />
        <circle cx="170" cy="66" r="7" opacity="0.04" />
      </g>
      <g fill="#c9d0d6">
        <circle cx="149" cy="108" r="2" opacity="0.2" />
        <circle cx="144" cy="100" r="2.8" opacity="0.12" />
      </g>
      {/* 副驾上的安全带 */}
      <path d="M 12 100 Q 30 108 34 128" stroke="#2a2d31" strokeWidth="4" fill="none" />
    </>
  ),
  // 阿豪：网吧柜台——显示器排的蓝光、泡面、橘猫
  hao_cafe_cats: (
    <>
      <rect width="200" height="150" fill="url(#phSky0)" />
      {/* 顶灯光带 */}
      <rect x="0" y="0" width="200" height="3" fill="#3a6a8a" opacity="0.5" />
      {/* 显示器排（带屏幕内容与光晕） */}
      {[8, 58, 108, 158].map((x, i) => (
        <g key={x}>
          <rect x={x} y="12" width="34" height="24" rx="2.4" fill="#121a24" />
          <rect x={x + 2} y="14" width="30" height="20" fill="#2a5a7a" opacity={0.26 + i * 0.13} />
          <rect x={x + 3.5} y="15.5" width="27" height="17" fill="#4a8aaa" opacity={0.2 + i * 0.1} />
          <rect x={x + 4.5} y="17" width="12" height="2" fill="#8fd0e8" opacity="0.5" />
          <rect x={x + 4.5} y="21" width="18" height="2" fill="#6ab0d0" opacity="0.4" />
          <rect x={x + 4.5} y="25" width="9" height="2" fill="#8fd0e8" opacity="0.45" />
          <rect x={x + 13} y="36" width="8" height="3" fill="#10161e" />
          <ellipse cx={x + 17} cy="20" rx="20" ry="14" fill="#4a8aaa" opacity="0.05" />
        </g>
      ))}
      {/* 屏幕蓝辉（整面墙） */}
      <ellipse cx="100" cy="26" rx="95" ry="20" fill="#4a8aaa" opacity="0.05" />
      {/* 柜台 */}
      <rect x="0" y="82" width="200" height="24" fill="#232830" />
      <rect x="0" y="82" width="200" height="3" fill="#39414c" />
      <g opacity="0.5" stroke="#1a1e24">
        <line x1="0" y1="94" x2="200" y2="94" strokeWidth="0.7" />
        <line x1="0" y1="100" x2="200" y2="100" strokeWidth="0.7" />
      </g>
      <rect x="0" y="106" width="200" height="44" fill="#161a20" />
      {/* 柜台上的泡面（热气） */}
      <path d="M 148 66 L 182 66 L 176 96 L 154 96 Z" fill="#d4a017" />
      <path d="M 148 66 L 182 66 L 176 96 L 154 96 Z" fill="#f0c860" opacity="0.3" />
      <ellipse cx="165" cy="66" rx="17" ry="5" fill="#efe8d4" />
      <ellipse cx="160" cy="65" rx="5" ry="2.2" fill="#f4d03f" opacity="0.85" />
      <path d="M 165 56 Q 161 48 165 40 Q 169 34 165 28" stroke="#aab2ba" strokeWidth="1.6" fill="none" opacity="0.3" strokeLinecap="round" />
      <path d="M 159 58 Q 156 52 158 46" stroke="#aab2ba" strokeWidth="1" fill="none" opacity="0.18" strokeLinecap="round" />
      {/* 橘猫（蜷在柜台上，尾巴绕身） */}
      <ellipse cx="66" cy="86" rx="24" ry="13" fill="#e89a3a" />
      <ellipse cx="66" cy="82" rx="20" ry="9" fill="#f0b45a" opacity="0.4" />
      <circle cx="44" cy="80" r="10.5" fill="#e89a3a" />
      <path d="M 36 72 L 38 64 L 45 71 Z" fill="#e89a3a" />
      <path d="M 48 70 L 52 62 L 56 72 Z" fill="#e89a3a" />
      <path d="M 37 70 L 40 66 L 42 71 Z" fill="#d4882e" opacity="0.7" />
      <path d="M 49 68 L 52 64 L 54 69 Z" fill="#d4882e" opacity="0.7" />
      <path d="M 88 88 Q 104 84 100 68 Q 99 64 96 66" stroke="#e89a3a" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M 36 79 Q 40 82 44 79" stroke="#1a1a1a" strokeWidth="1.4" fill="none" />
      <path d="M 34 86 L 26 84 M 34 89 L 27 90" stroke="#f0d8b8" strokeWidth="0.8" />
      <ellipse cx="66" cy="97" rx="10" ry="3.4" fill="#d4882e" opacity="0.5" />
      <circle cx="40" cy="78" r="1" fill="#1a1a1a" opacity="0.9" />
    </>
  ),
  // 陈工：阳台台钳——图纸、栏杆、1974 年的闹钟
  chen_balcony_vise: (
    <>
      <rect width="200" height="150" fill="#26352c" />
      {/* 暮色天光 */}
      <rect width="200" height="150" fill="#7a6a8a" opacity="0.07" />
      <circle cx="168" cy="22" r="9" fill="#e8d8a0" opacity="0.35" />
      <circle cx="168" cy="22" r="22" fill="#e8d8a0" opacity="0.07" />
      {/* 远楼 */}
      <g opacity="0.5" fill="#1a2620">
        <path d="M 0 76 L 0 52 L 22 52 L 22 76 Z" />
        <path d="M 128 76 L 128 60 L 152 60 L 152 76 Z" />
        <rect x="6" y="58" width="2" height="3" fill="#f4d03f" opacity="0.7" />
        <rect x="138" y="64" width="2" height="3" fill="#f4d03f" opacity="0.5" />
      </g>
      {/* 阳台栏板 */}
      <rect x="0" y="76" width="200" height="12" fill="#3c4a3e" />
      <rect x="0" y="88" width="200" height="62" fill="#313e33" />
      <g stroke="#26312a" strokeWidth="1" opacity="0.6">
        <line x1="0" y1="100" x2="200" y2="100" />
        <line x1="0" y1="112" x2="200" y2="112" />
        <line x1="0" y1="124" x2="200" y2="124" />
        <line x1="0" y1="136" x2="200" y2="136" />
      </g>
      {/* 台面（工作台） */}
      <path d="M 0 150 L 0 96 L 200 96 L 200 150 Z" fill="#2c382e" />
      <path d="M 0 96 L 200 96" stroke="#4a5a4a" strokeWidth="1.6" />
      {/* 图纸（工程网格） */}
      <g transform="rotate(-3 50 62)">
        <rect x="20" y="40" width="60" height="44" fill="#e8e0c8" />
        <g stroke="#7a8a7a" strokeWidth="0.4" opacity="0.5">
          <line x1="32" y1="40" x2="32" y2="84" />
          <line x1="44" y1="40" x2="44" y2="84" />
          <line x1="56" y1="40" x2="56" y2="84" />
          <line x1="68" y1="40" x2="68" y2="84" />
          <line x1="20" y1="51" x2="80" y2="51" />
          <line x1="20" y1="62" x2="80" y2="62" />
          <line x1="20" y1="73" x2="80" y2="73" />
        </g>
        <path d="M 24 44 L 24 80 L 76 80" stroke="#3a4a3a" strokeWidth="1.2" fill="none" />
        <path d="M 24 44 L 44 62" stroke="#3a4a3a" strokeWidth="0.8" fill="none" />
        <circle cx="24" cy="44" r="1.4" fill="none" stroke="#3a4a3a" strokeWidth="0.7" />
      </g>
      {/* 台钳（主角） */}
      <rect x="120" y="92" width="10" height="30" fill="#4a5058" />
      <rect x="104" y="80" width="52" height="14" rx="2" fill="url(#phMetal)" />
      <rect x="146" y="78" width="12" height="18" rx="2" fill="#6a7078" />
      <path d="M 112 80 L 112 94 M 148 80 L 148 94" stroke="#2a2f35" strokeWidth="1" />
      {/* 夹着的 1974 闹钟 */}
      <circle cx="126" cy="64" r="15" fill="#8a8072" />
      <circle cx="126" cy="64" r="15" fill="none" stroke="#4a463e" strokeWidth="2" />
      <circle cx="126" cy="64" r="11.4" fill="#d0c8b4" />
      <g stroke="#3a342c" strokeWidth="1">
        <line x1="126" y1="54" x2="126" y2="56.4" />
        <line x1="135" y1="64" x2="132.6" y2="64" />
        <line x1="126" y1="74" x2="126" y2="71.6" />
        <line x1="117" y1="64" x2="119.4" y2="64" />
      </g>
      <line x1="126" y1="64" x2="126" y2="56.6" stroke="#3a342c" strokeWidth="1.6" />
      <line x1="126" y1="64" x2="131.5" y2="67" stroke="#3a342c" strokeWidth="1.4" />
      <line x1="126" y1="64" x2="121" y2="70" stroke="#a43a2e" strokeWidth="0.8" />
      <rect x="118" y="46" width="16" height="4" rx="2" fill="#c0b8a0" opacity="0.7" />
      {/* 拧到一半的螺丝刀 */}
      <rect x="36" y="108" width="30" height="4" rx="2" fill="#d4a24e" transform="rotate(-14 51 110)" />
      <rect x="62" y="106" width="10" height="8" rx="2" fill="#7a828c" transform="rotate(-14 51 110)" />
    </>
  ),
  // 老李：收车后的驾驶座——收音机还亮着
  lao_li_radio_night: (
    <>
      <rect width="200" height="150" fill="url(#phSky0)" />
      {/* 车窗外夜色 */}
      <rect x="0" y="0" width="200" height="110" fill="#0d1622" />
      <circle cx="24" cy="20" r="7" fill="#e8e4d0" opacity="0.4" />
      <circle cx="24" cy="20" r="4.8" fill="#e8e4d0" opacity="0.55" />
      <path d="M 0 96 L 200 92 L 200 110 L 0 110 Z" fill="#0a1119" />
      {/* 收音机面板（磨砂 + 旋钮 + 频道窗） */}
      <rect x="26" y="36" width="96" height="66" rx="5" fill="#1a1c1e" />
      <rect x="26" y="36" width="96" height="66" rx="5" fill="none" stroke="#2c2f33" strokeWidth="1.6" />
      <rect x="26" y="36" width="96" height="8" rx="5" fill="#23262a" />
      {/* 调谐旋钮（金属） */}
      <circle cx="52" cy="76" r="15" fill="none" stroke="url(#phMetal)" strokeWidth="3" />
      <circle cx="52" cy="76" r="9" fill="#22262b" />
      <line x1="52" y1="62.5" x2="52" y2="67" stroke="#8fd0e8" strokeWidth="1.4" opacity="0.85" />
      <line x1="52" y1="76" x2="60" y2="70" stroke="#8fd0e8" strokeWidth="1.4" opacity="0.85" />
      <circle cx="52" cy="52" r="3" fill="none" stroke="#5a5f66" strokeWidth="1.6" />
      {/* 频道指示屏（荧光绿） */}
      <rect x="76" y="46" width="38" height="16" rx="2" fill="#0e2416" />
      <rect x="76" y="46" width="38" height="16" rx="2" fill="#1e5a3a" opacity="0.3" />
      <text x="82" y="58" font-size="9" fill="#4ade80" fontFamily="monospace" opacity="0.9">FM 87.6</text>
      {/* 预置键 */}
      <g fill="#3a3f45">
        {[76, 88, 100, 112].map((x) => <rect key={x} x={x} y="70" width="8" height="5" rx="1.4" transform={`translate(0 ${x === 112 ? 12 : 0})`} />)}
      </g>
      <rect x="76" y="86" width="40" height="8" rx="1.4" fill="#2a2d31" />
      <rect x="76" y="98" width="40" height="2.4" rx="1.2" fill="#3c4045" />
      {/* 电源灯（红） */}
      <circle cx="31" cy="42" r="2.2" fill="#e0563e" />
      <circle cx="31" cy="42" r="5" fill="#e0563e" opacity="0.25" />
      {/* 收音机光晕洒在座椅上 */}
      <ellipse cx="74" cy="102" rx="55" ry="14" fill="#1e5a3a" opacity="0.08" />
      {/* 仪表台与车窗分界 */}
      <path d="M 0 150 L 0 102 L 200 98 L 200 150 Z" fill="#171310" />
      <path d="M 0 106 L 200 102" stroke="#241e18" strokeWidth="2" />
      {/* 车窗右半：路灯与空车灯反光 */}
      <rect x="140" y="18" width="60" height="84" fill="#0d1622" />
      <circle cx="172" cy="40" r="3.4" fill="#f4d03f" opacity="0.6" />
      <circle cx="188" cy="62" r="2.2" fill="#f4d03f" opacity="0.4" />
      <rect x="150" y="22" width="44" height="10" rx="2" fill="#d4553f" opacity="0.55" />
      <rect x="150" y="22" width="44" height="10" rx="2" fill="none" stroke="#e8e4d0" strokeWidth="0.6" opacity="0.4" />
      {/* 挂在镜上的平安符 */}
      <path d="M 128 0 L 128 26" stroke="#c9b96a" strokeWidth="0.8" opacity="0.5" />
      <circle cx="128" cy="30" r="5" fill="#a43a2e" opacity="0.75" />
      <circle cx="128" cy="30" r="7.5" fill="#a43a2e" opacity="0.2" />
    </>
  ),
  // 周老师：阳台上的花——浇花是他一天的开始
  zhou_flower_balcony: (
    <>
      <rect width="200" height="150" fill="#3c4a42" />
      {/* 清晨天光 */}
      <rect width="200" height="90" fill="#8aa4b4" opacity="0.24" />
      <circle cx="152" cy="30" r="13" fill="#f4e0a8" opacity="0.5" />
      <circle cx="152" cy="30" r="30" fill="#f4e0a8" opacity="0.12" />
      {/* 远楼与晨雾 */}
      <g opacity="0.45" fill="#2a3a34">
        <path d="M 0 90 L 0 56 L 26 56 L 26 90 Z" />
        <path d="M 116 90 L 116 64 L 140 64 L 140 90 Z" />
        <path d="M 150 90 L 150 48 L 184 48 L 184 90 Z" />
      </g>
      <rect x="0" y="76" width="200" height="14" fill="#c9d4ce" opacity="0.14" />
      {/* 阳台栏板 */}
      <rect x="0" y="90" width="200" height="10" fill="#4a4234" />
      <rect x="0" y="100" width="200" height="50" fill="#3a352a" />
      <g stroke="#2c2820" strokeWidth="1" opacity="0.6">
        <line x1="0" y1="112" x2="200" y2="112" />
        <line x1="0" y1="124" x2="200" y2="124" />
        <line x1="0" y1="136" x2="200" y2="136" />
      </g>
      {/* 花架（木质） */}
      <rect x="24" y="82" width="152" height="7" rx="2" fill="#5a4a2e" />
      <rect x="24" y="82" width="152" height="2.4" fill="#7a6a44" opacity="0.7" />
      <rect x="34" y="89" width="7" height="54" fill="#4a3a22" />
      <rect x="160" y="89" width="7" height="54" fill="#4a3a22" />
      {/* 茉莉（白花点点） */}
      <path d="M 42 58 L 74 58 L 69 82 L 47 82 Z" fill="#8a5a3a" />
      <circle cx="58" cy="48" r="13" fill="#4a7a4a" />
      <circle cx="52" cy="44" r="5" fill="#5a8a56" opacity="0.8" />
      <circle cx="64" cy="46" r="4.4" fill="#3e6e40" opacity="0.8" />
      <g fill="#f4f0e4">
        <circle cx="55" cy="52" r="1.7" />
        <circle cx="62" cy="49" r="1.7" />
        <circle cx="58" cy="55" r="1.5" />
        <circle cx="66" cy="55" r="1.4" />
      </g>
      {/* 月季（红苞） */}
      <path d="M 96 54 L 126 54 L 121 82 L 101 82 Z" fill="#7a4a2e" />
      <circle cx="111" cy="46" r="11" fill="#4a6a3e" />
      <circle cx="105" cy="42" r="4.6" fill="#5a7a4a" opacity="0.8" />
      <circle cx="118" cy="44" r="3.6" fill="#3a5a34" opacity="0.8" />
      <circle cx="111" cy="38" r="4" fill="#a43a2e" />
      <circle cx="105" cy="43" r="2.6" fill="#c05a4e" opacity="0.85" />
      {/* 洒水壶（铁皮） */}
      <rect x="146" y="58" width="20" height="20" rx="2.4" fill="#6a7a82" />
      <rect x="146" y="58" width="20" height="4" fill="#8a9aa2" opacity="0.7" />
      <path d="M 164 62 L 182 54" stroke="#6a7a82" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M 182 54 L 186 50 L 186 58 L 182 56 Z" fill="#6a7a82" />
      <path d="M 152 58 Q 156 50 162 58" stroke="#6a7a82" strokeWidth="2" fill="none" />
      {/* 壶嘴洒出的水珠 */}
      <g fill="#b8d4dc" opacity="0.6">
        <circle cx="128" cy="52" r="1.1" />
        <circle cx="122" cy="58" r="0.9" />
        <circle cx="130" cy="60" r="0.8" />
      </g>
      {/* 落在架板上的花瓣 */}
      <ellipse cx="90" cy="84" rx="2.4" ry="1" fill="#f4f0e4" opacity="0.7" transform="rotate(16 90 84)" />
    </>
  ),
  // 王总：建材店门脸——白天赔笑的地方
  wang_store_front: (
    <>
      <rect width="200" height="150" fill="#5a6168" />
      <rect width="200" height="90" fill="#8aa0ac" opacity="0.3" />
      <circle cx="46" cy="34" r="10" fill="#f4e8c8" opacity="0.5" />
      <circle cx="46" cy="34" r="26" fill="#f4e8c8" opacity="0.1" />
      {/* 街对面楼房 */}
      <g opacity="0.4" fill="#3c4650">
        <path d="M 0 90 L 0 40 L 26 40 L 26 90 Z" />
        <path d="M 160 90 L 160 52 L 200 52 L 200 90 Z" />
        <rect x="8" y="50" width="6" height="8" fill="#2c343c" opacity="0.7" />
        <rect x="16" y="50" width="6" height="8" fill="#2c343c" opacity="0.7" />
      </g>
      {/* 招牌（灯箱式，字亮着） */}
      <rect x="32" y="14" width="136" height="26" rx="3" fill="#8a4a3a" />
      <rect x="32" y="14" width="136" height="26" rx="3" fill="none" stroke="#6a3a2e" strokeWidth="1.6" />
      <rect x="40" y="21" width="9" height="12" rx="1" fill="#f4d03f" opacity="0.85" />
      <rect x="54" y="21" width="42" height="12" rx="1" fill="#f4d03f" opacity="0.5" />
      <rect x="102" y="21" width="26" height="12" rx="1" fill="#f4d03f" opacity="0.35" />
      <rect x="134" y="21" width="26" height="12" rx="1" fill="#f4d03f" opacity="0.5" />
      {/* 卷帘门（横纹金属 + 锈迹） */}
      <rect x="28" y="48" width="144" height="92" fill="#2e3236" />
      <g stroke="#3c4248" strokeWidth="1.4">
        {[56, 66, 76, 86, 96, 106, 116, 126, 136].map((y) => <line key={y} x1="28" y1={y} x2="172" y2={y} />)}
      </g>
      <g stroke="#262a2e" strokeWidth="0.8" opacity="0.8">
        {[61, 71, 81, 91, 101, 111, 121, 131].map((y) => <line key={y} x1="28" y1={y} x2="172" y2={y} />)}
      </g>
      <path d="M 60 48 Q 58 90 64 140" stroke="#4a3a2a" strokeWidth="3" opacity="0.35" fill="none" />
      <ellipse cx="126" cy="118" rx="7" ry="3" fill="#4a3a2a" opacity="0.4" />
      {/* 卷帘门中缝锁孔 */}
      <rect x="96" y="92" width="8" height="14" rx="2" fill="#1e2226" />
      <circle cx="100" cy="99" r="1.6" fill="#5a5f66" />
      {/* 门口台阶 */}
      <path d="M 24 150 L 24 140 L 176 140 L 176 150 Z" fill="#3c434a" />
      <path d="M 24 140 L 176 140" stroke="#525a62" strokeWidth="1.4" />
      {/* 样品堆：瓷砖 + 马桶圈样品 */}
      <g>
        <rect x="8" y="122" width="18" height="18" fill="#8a94a0" opacity="0.75" transform="rotate(-4 17 131)" />
        <rect x="14" y="116" width="18" height="18" fill="#9aa4b0" opacity="0.7" transform="rotate(3 23 125)" />
        <rect x="12" y="110" width="16" height="16" fill="#b0bac6" opacity="0.65" transform="rotate(-7 20 118)" />
        <path d="M 14 122 L 30 122" stroke="#6a747e" strokeWidth="0.6" opacity="0.6" transform="rotate(-4 17 131)" />
      </g>
      {/* 电线杆一角 */}
      <rect x="186" y="0" width="5" height="150" fill="#3a444c" />
      <line x1="182" y1="22" x2="192" y2="22" stroke="#2c343c" strokeWidth="1.4" />
    </>
  ),
  // 阿豪：柜台上的泡面——加蛋是给熟客的
  hao_counter_noodles: (
    <>
      <rect width="200" height="150" fill="#0c0c18" />
      {/* 柜台后墙（贴纸菜单一角） */}
      <rect x="0" y="0" width="200" height="88" fill="#141428" />
      <g opacity="0.55">
        <rect x="12" y="12" width="34" height="44" rx="2" fill="#1e1e36" />
        <rect x="16" y="18" width="26" height="3" fill="#3a5a7a" opacity="0.7" />
        <rect x="16" y="25" width="20" height="2.4" fill="#3a5a7a" opacity="0.5" />
        <rect x="16" y="31" width="24" height="2.4" fill="#3a5a7a" opacity="0.5" />
        <rect x="16" y="37" width="18" height="2.4" fill="#3a5a7a" opacity="0.5" />
        <rect x="160" y="16" width="28" height="40" rx="2" fill="#1e1e36" />
        <rect x="164" y="22" width="20" height="3" fill="#a05a4a" opacity="0.6" />
        <rect x="164" y="29" width="16" height="2.4" fill="#a05a4a" opacity="0.4" />
      </g>
      {/* 顶灯光晕（打在杯面） */}
      <circle cx="100" cy="30" r="5" fill="#e8e4d0" opacity="0.6" />
      <circle cx="100" cy="30" r="30" fill="#e8e4d0" opacity="0.06" />
      {/* 柜台面 */}
      <path d="M 0 150 L 0 88 L 200 88 L 200 150 Z" fill="#26262e" />
      <path d="M 0 88 L 200 88" stroke="#3e3e4a" strokeWidth="2.4" />
      <g opacity="0.35" stroke="#1c1c26">
        <line x1="0" y1="104" x2="200" y2="104" strokeWidth="0.8" />
        <line x1="0" y1="120" x2="200" y2="120" strokeWidth="0.8" />
      </g>
      {/* 泡面桶（桶身反光 + 面盖掀起） */}
      <path d="M 64 52 L 116 52 L 108 100 L 72 100 Z" fill="#d4a017" />
      <path d="M 64 52 L 116 52 L 108 100 L 72 100 Z" fill="#f0c860" opacity="0.28" />
      <path d="M 72 100 L 108 100 L 104 122 L 76 122 Z" fill="#b8891a" />
      <path d="M 76 122 L 104 122 L 102 132 L 78 132 Z" fill="#9a7315" />
      {/* 桶身标签 */}
      <path d="M 69.5 64 L 110.5 64 L 107.6 92 L 72.4 92 Z" fill="#f0e8d8" opacity="0.9" />
      <rect x="78" y="70" width="26" height="3.4" rx="1" fill="#a43a2e" opacity="0.85" />
      <rect x="81" y="77" width="20" height="2.4" rx="1" fill="#8a5a44" opacity="0.6" />
      <rect x="81" y="82" width="24" height="2.4" rx="1" fill="#8a5a44" opacity="0.5" />
      {/* 面盖（掀开一角，蛋黄卧中央） */}
      <path d="M 64 52 L 116 52 L 112 58 L 68 58 Z" fill="#efe8d4" />
      <path d="M 112 52 L 122 46 L 118 58 Z" fill="#e0d8c4" />
      <ellipse cx="90" cy="55" rx="22" ry="6" fill="#e8dcc4" />
      <ellipse cx="90" cy="55" rx="8" ry="3.4" fill="#f4b03a" />
      <ellipse cx="88" cy="54" rx="3.2" ry="1.5" fill="#f8d878" opacity="0.85" />
      {/* 热气（三缕） */}
      <path d="M 88 42 Q 84 34 88 26 Q 92 20 88 12" stroke="#aab2ba" strokeWidth="1.8" fill="none" opacity="0.28" strokeLinecap="round" />
      <path d="M 98 44 Q 95 38 98 32" stroke="#aab2ba" strokeWidth="1.2" fill="none" opacity="0.18" strokeLinecap="round" />
      <path d="M 78 44 Q 75 37 78 31" stroke="#aab2ba" strokeWidth="1" fill="none" opacity="0.14" strokeLinecap="round" />
      {/* 筷子（搭在桶沿） */}
      <line x1="118" y1="72" x2="146" y2="56" stroke="#8a6a3a" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="121" y1="77" x2="149" y2="61" stroke="#9a7a44" strokeWidth="2.4" strokeLinecap="round" />
      {/* 柜台上的扫码牌 + 烟灰缸 */}
      <rect x="156" y="72" width="26" height="18" rx="2" fill="#12322a" />
      <rect x="159" y="75" width="20" height="12" fill="#3a7a5a" opacity="0.35" />
      <circle cx="169" cy="81" r="3.4" fill="none" stroke="#8fc4a8" strokeWidth="1" opacity="0.5" />
      <ellipse cx="36" cy="104" rx="13" ry="4" fill="#3a3f45" opacity="0.85" />
      <ellipse cx="36" cy="103" rx="10" ry="2.6" fill="#22262b" />
      {/* 台面上落的两枚游戏币 */}
      <circle cx="132" cy="118" r="5.4" fill="#d4a24e" opacity="0.8" />
      <circle cx="132" cy="118" r="3.6" fill="none" stroke="#8a6a2e" strokeWidth="0.8" />
      <circle cx="147" cy="128" r="5.4" fill="#b0bec8" opacity="0.7" />
      <circle cx="147" cy="128" r="3.6" fill="none" stroke="#6a7882" strokeWidth="0.8" />
    </>
  ),
  // 陈工：书桌上的图纸——给手机支架画的
  chen_blueprint_desk: (
    <>
      <rect width="200" height="150" fill="#16222e" />
      {/* 台灯（冷白光） */}
      <path d="M 168 118 L 168 54 Q 168 46 176 46 L 184 46" stroke="#3c4248" strokeWidth="2.6" fill="none" />
      <path d="M 172 44 L 190 44 L 186 56 L 176 56 Z" fill="#4a5058" />
      <path d="M 176 56 L 186 56 L 183 62 L 179 62 Z" fill="#e8f0f4" opacity="0.85" />
      <circle cx="181" cy="66" r="16" fill="#e8f0f4" opacity="0.08" />
      <ellipse cx="168" cy="120" rx="14" ry="3.4" fill="#22262b" />
      {/* 图纸（蓝图） */}
      <g transform="rotate(-2 80 75)">
        <rect x="16" y="26" width="126" height="94" fill="#123252" />
        <rect x="16" y="26" width="126" height="94" fill="none" stroke="#2a5a8a" strokeWidth="1.4" />
        {/* 蓝图网格 */}
        <g opacity="0.22" stroke="#4a8ac8">
          {[32, 48, 64, 80, 96, 112].map((x) => <line key={x} x1={x} y1="26" x2={x} y2="120" strokeWidth="0.5" />)}
          {[42, 58, 74, 90, 106].map((y) => <line key={y} x1="16" y1={y} x2="142" y2={y} strokeWidth="0.5" />)}
        </g>
        {/* 手机支架结构（主视图） */}
        <rect x="48" y="52" width="44" height="34" fill="none" stroke="#7ac8e8" strokeWidth="1.8" />
        <line x1="70" y1="52" x2="70" y2="86" stroke="#7ac8e8" strokeWidth="1" />
        <path d="M 48 86 L 38 102 M 92 86 L 102 102" stroke="#7ac8e8" strokeWidth="1.6" />
        <circle cx="70" cy="62" r="3" fill="none" stroke="#7ac8e8" strokeWidth="1" />
        {/* 侧视图 */}
        <rect x="106" y="66" width="18" height="20" fill="none" stroke="#7ac8e8" strokeWidth="1.2" />
        <path d="M 106 86 L 100 96 M 124 86 L 130 96" stroke="#7ac8e8" strokeWidth="1" />
        {/* 尺寸标注（双侧） */}
        <line x1="48" y1="112" x2="92" y2="112" stroke="#a8d89a" strokeWidth="0.9" />
        <line x1="48" y1="108" x2="48" y2="116" stroke="#a8d89a" strokeWidth="0.9" />
        <line x1="92" y1="108" x2="92" y2="116" stroke="#a8d89a" strokeWidth="0.9" />
        <text x="60" y="120" font-size="7" fill="#a8d89a" fontFamily="monospace">120</text>
        <line x1="30" y1="52" x2="30" y2="86" stroke="#a8d89a" strokeWidth="0.9" />
        <line x1="26" y1="52" x2="34" y2="52" stroke="#a8d89a" strokeWidth="0.9" />
        <line x1="26" y1="86" x2="34" y2="86" stroke="#a8d89a" strokeWidth="0.9" />
        <text x="22" y="72" font-size="7" fill="#a8d89a" fontFamily="monospace">86</text>
        {/* 标题栏（右下角） */}
        <rect x="98" y="98" width="44" height="22" fill="none" stroke="#7ac8e8" strokeWidth="0.8" />
        <line x1="98" y1="106" x2="142" y2="106" stroke="#7ac8e8" strokeWidth="0.5" opacity="0.7" />
        <line x1="98" y1="114" x2="142" y2="114" stroke="#7ac8e8" strokeWidth="0.5" opacity="0.7" />
        <text x="102" y="104" font-size="5.4" fill="#a8d89a" fontFamily="monospace">手机支架 v3</text>
      </g>
      {/* 桌沿 */}
      <path d="M 0 150 L 0 128 L 200 128 L 200 150 Z" fill="#1c2834" />
      <path d="M 0 128 L 200 128" stroke="#324252" strokeWidth="2" />
      {/* 图纸压角：铅笔 + 三角板 */}
      <rect x="24" y="130" width="34" height="4.4" rx="2" fill="#d4a24e" transform="rotate(-8 41 132)" />
      <path d="M 52 130 L 58 124 L 58 130 Z" fill="#3a3a2a" transform="rotate(-8 41 132)" opacity="0.8" />
      <path d="M 150 128 L 176 128 L 176 104 Z" fill="#4a8ab8" opacity="0.4" transform="rotate(4 163 116)" />
      <path d="M 150 128 L 176 128 L 176 104 Z" fill="none" stroke="#5b8db8" strokeWidth="0.8" opacity="0.6" transform="rotate(4 163 116)" />
    </>
  ),
  // 私发照片钩子①：王总"刚加完班"——深夜办公室摆拍，时钟是时间证据
  wang_overtime: (
    <>
      <rect width="200" height="150" fill="#1a1c22" />
      {/* 显示器：表格荧光 */}
      <rect x="14" y="24" width="86" height="62" rx="3" fill="#0e1218" />
      <rect x="18" y="28" width="78" height="54" fill="#1e2c3a" />
      {[34, 44, 54, 64, 74].map((y) => (
        <rect key={y} x="22" y={y} width={70 - (y % 12)} height="4" fill="#3a5a7a" opacity="0.7" />
      ))}
      <ellipse cx="57" cy="55" rx="40" ry="26" fill="#4a8ab8" opacity="0.08" />
      {/* 挂钟：01:30——时间证据 */}
      <circle cx="158" cy="38" r="15" fill="#2a2e34" />
      <circle cx="158" cy="38" r="15" fill="none" stroke="#4a505a" strokeWidth="1.6" />
      <circle cx="158" cy="38" r="11.6" fill="#33383e" />
      <g stroke="#c9e0ea" strokeWidth="1">
        <line x1="158" y1="28" x2="158" y2="30" />
        <line x1="168" y1="38" x2="166" y2="38" />
        <line x1="158" y1="48" x2="158" y2="46" />
        <line x1="148" y1="38" x2="150" y2="38" />
      </g>
      <line x1="158" y1="38" x2="158" y2="30" stroke="#c9e0ea" strokeWidth="1.4" />
      <line x1="158" y1="38" x2="151.6" y2="33.4" stroke="#c9e0ea" strokeWidth="1.4" />
      {/* 桌面 */}
      <path d="M 0 96 L 200 92 L 200 150 L 0 150 Z" fill="#241e18" />
      <path d="M 0 96 L 200 92" stroke="#3a322a" strokeWidth="1.6" />
      {/* 键盘 + 咖啡 */}
      <path d="M 96 104 L 168 100 L 172 122 L 100 126 Z" fill="#2a2e36" />
      <g opacity="0.5" fill="#3a3f48">
        {[108, 113, 118].map((y) => <rect key={y} x="106" y={y} width="54" height="3" rx="1" />)}
      </g>
      <rect x="30" y="106" width="13" height="15" rx="2" fill="#4a3a2c" />
      <path d="M 43 109 q 5 2.4 0 7" stroke="#4a3a2c" strokeWidth="2.4" fill="none" />
      {/* 他：衬衫领带 熬夜脸 只露半身 闪光打在脸上 */}
      <path d="M 96 150 Q 100 122 128 118 Q 156 114 170 122 Q 186 130 190 150 Z" fill="#d8dde2" />
      <path d="M 128 118 L 140 128 L 132 136 L 126 126 Z" fill="#8a3a3a" />
      <path d="M 118 122 L 124 126 L 121 131 Z" fill="#aab2ba" opacity="0.7" />
      <ellipse cx="146" cy="96" rx="15" ry="17" fill="#d9a678" />
      <path d="M 131 94 Q 132 78 146 77 Q 160 78 161 94 Q 154 85 146 84.6 Q 138 85 131 94 Z" fill="#3a3630" />
      <ellipse cx="140.4" cy="96" rx="2.4" ry="2" fill="#26221c" />
      <ellipse cx="151.6" cy="96.4" rx="2.4" ry="2" fill="#26221c" />
      <path d="M 140 105 Q 146 107.6 152.6 104.8" stroke="#8a5a3e" strokeWidth="1.4" fill="none" opacity="0.8" />
      <ellipse cx="136" cy="101" rx="3" ry="1.8" fill="#c19268" opacity="0.5" />
      {/* 强制笑 + 闪光热斑 */}
      <path d="M 139 104 Q 146 108 153 104" stroke="#7c4a38" strokeWidth="1.2" fill="none" opacity="0.5" />
      <circle cx="146" cy="94" r="17" fill="#fff" opacity="0.1" />
      <rect width="200" height="150" fill="#7aa8cc" opacity="0.05" />
    </>
  ),
  // 私发照片钩子②：奶茶外卖——殷勤供养型"给你也点了"，小票入镜
  milktea_gift: (
    <>
      <rect width="200" height="150" fill="#d8cfc2" />
      <rect width="200" height="150" fill="#cfc4b4" opacity="0.5" />
      {/* 木桌纹 */}
      <g stroke="#b8a88e" strokeWidth="1.2" opacity="0.6">
        <line x1="0" y1="28" x2="200" y2="24" />
        <line x1="0" y1="62" x2="200" y2="56" />
        <line x1="0" y1="98" x2="200" y2="90" />
        <line x1="0" y1="132" x2="200" y2="124" />
      </g>
      {/* 奶茶（全糖 去冰） */}
      <path d="M 52 38 L 106 38 L 98 108 L 60 108 Z" fill="#c9a37a" />
      <path d="M 56 44 L 102 44 L 96 102 L 62 102 Z" fill="#a87848" opacity="0.8" />
      <path d="M 54 38 L 104 38 L 103 48 L 55 48 Z" fill="#f4ede4" />
      <circle cx="70" cy="94" r="4" fill="#2a1a12" />
      <circle cx="82" cy="98" r="4" fill="#2a1a12" />
      <circle cx="92" cy="92" r="3.6" fill="#2a1a12" />
      <path d="M 92 26 L 88 44" stroke="#d4553f" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="90" cy="25" rx="4" ry="1.8" fill="#3a2018" />
      {/* 甜品袋 */}
      <rect x="118" y="30" width="64" height="74" rx="4" fill="#e8b86a" />
      <path d="M 118 38 L 182 38" stroke="#c89a4a" strokeWidth="2" />
      <path d="M 138 30 Q 150 18 162 30" stroke="#c89a4a" strokeWidth="3" fill="none" />
      <circle cx="150" cy="62" r="12" fill="#f0d8a0" />
      <path d="M 143 58 Q 150 52 157 58" stroke="#c89a4a" strokeWidth="1.6" fill="none" />
      {/* 小票（价格入镜——供养的证据） */}
      <rect x="34" y="96" width="52" height="40" rx="1" fill="#f8f4ec" transform="rotate(-6 60 116)" />
      <g stroke="#a89a84" strokeWidth="1" opacity="0.8" transform="rotate(-6 60 116)">
        <line x1="42" y1="104" x2="78" y2="102" />
        <line x1="42" y1="110" x2="74" y2="108" />
        <line x1="42" y1="116" x2="78" y2="114" />
        <line x1="42" y1="124" x2="70" y2="122" />
      </g>
      <text x="44" y="130" font-size="9" fill="#5a4a34" fontFamily="monospace" transform="rotate(-6 60 116)">¥38</text>
      {/* 手机拍摄阴影一角 */}
      <path d="M 0 150 L 0 120 Q 30 140 60 150 Z" fill="#00000022" />
      <rect width="200" height="150" fill="#f4a03f" opacity="0.05" />
    </>
  ),
  // 库人物照片（按原型）——保安岗亭
  arch_guard_booth: (
    <>
      <rect width="200" height="150" fill="#141826" />
      {/* 夜空 */}
      <rect width="200" height="150" fill="#1a2030" opacity="0.5" />
      <circle cx="30" cy="26" r="6" fill="#e8e4d0" opacity="0.4" />
      <circle cx="30" cy="26" r="3.8" fill="#e8e4d0" opacity="0.55" />
      {/* 岗亭 */}
      <rect x="24" y="34" width="152" height="82" rx="3" fill="#262c3d" />
      <rect x="20" y="28" width="160" height="8" rx="2" fill="#39415a" />
      <rect x="20" y="28" width="160" height="2.4" fill="#4a5470" />
      {/* 玻璃窗（内透监控绿光） */}
      <rect x="32" y="44" width="136" height="46" fill="#0c101c" />
      <rect x="32" y="44" width="136" height="46" fill="url(#omGlass)" opacity="0.4" />
      {[40, 86, 132].map((x, i) => (
        <g key={x}>
          <rect x={x} y="50" width="42" height="28" rx="1.4" fill="#12241c" />
          <rect x={x + 2} y="52" width="38" height="24" fill="#1e4a34" opacity={0.75 - i * 0.15} />
          {/* 监控画面里的微光点 */}
          <circle cx={x + 12} cy="62" r="1.4" fill="#4ade80" opacity="0.5" />
          <rect x={x + 6} y="68" width="14" height="3" fill="#0c1a14" />
          <rect x={x + 24} y="68" width="12" height="3" fill="#0c1a14" />
          <rect x={x} y="78" width="42" height="2" fill="#1a2c24" />
        </g>
      ))}
      {/* 窗台上的茶缸 */}
      <rect x="60" y="86" width="10" height="9" rx="1.4" fill="#8a4a3e" />
      <ellipse cx="65" cy="86" rx="5" ry="1.8" fill="#d8ccb4" />
      {/* 岗亭门 */}
      <rect x="72" y="90" width="56" height="26" fill="#1c2230" />
      <circle cx="120" cy="103" r="1.6" fill="#5a6278" />
      {/* 地面 + 拦车杆一角 */}
      <path d="M 0 150 L 0 116 L 200 116 L 200 150 Z" fill="#10131c" />
      <path d="M 0 116 L 200 116" stroke="#2a324a" strokeWidth="1.6" />
      <g transform="rotate(-24 178 124)">
        <rect x="150" y="122" width="58" height="5" rx="2.4" fill="#c0564f" opacity="0.85" />
        <rect x="150" y="122" width="58" height="5" rx="2.4" fill="none" stroke="#e8e4d0" strokeWidth="0.8" opacity="0.4" strokeDasharray="10 6" />
      </g>
      <circle cx="178" cy="124" r="4" fill="#39415a" />
      <circle cx="178" cy="124" r="6.4" fill="none" stroke="#4a5470" strokeWidth="1.6" />
    </>
  ),
  // 库人物照片——代驾等单的路边
  arch_roadside: (
    <>
      <rect width="200" height="150" fill="#0c1a1e" />
      <rect width="200" height="100" fill="#122430" opacity="0.7" />
      <circle cx="36" cy="26" r="8" fill="#e8e4d0" opacity="0.45" />
      <circle cx="39" cy="24" r="6.6" fill="#0c1a1e" opacity="0.9" />
      {/* 酒吧街霓虹（远处） */}
      <g opacity="0.8">
        <rect x="128" y="20" width="64" height="38" rx="3" fill="#1c1424" />
        <rect x="136" y="28" width="20" height="22" rx="2" fill="#3a1a2e" />
        <rect x="140" y="32" width="12" height="4" fill="#d4553f" opacity="0.85" />
        <rect x="140" y="40" width="8" height="3" fill="#d4553f" opacity="0.5" />
        <circle cx="136" cy="28" r="10" fill="#d4553f" opacity="0.12" />
        <rect x="164" y="30" width="20" height="18" rx="2" fill="#2a2418" />
        <rect x="168" y="34" width="12" height="4" fill="#f4d03f" opacity="0.6" />
        <circle cx="164" cy="30" r="9" fill="#f4d03f" opacity="0.1" />
      </g>
      {/* 路灯锥形光 */}
      <rect x="52" y="30" width="4" height="76" fill="#2e3438" />
      <path d="M 54 32 L 62 35 L 54 38 Z" fill="#5a5f66" />
      <circle cx="54" cy="36" r="3.4" fill="#f4d03f" opacity="0.9" />
      <path d="M 44 40 L 64 40 L 76 116 L 32 116 Z" fill="#f4d03f" opacity="0.06" />
      <circle cx="54" cy="36" r="10" fill="#f4d03f" opacity="0.14" />
      {/* 人行道 */}
      <path d="M 0 150 L 0 112 L 200 108 L 200 150 Z" fill="#1a2622" />
      <line x1="0" y1="124" x2="200" y2="121" stroke="#2e3a34" strokeWidth="0.8" opacity="0.7" />
      <line x1="0" y1="136" x2="200" y2="134" stroke="#2e3a34" strokeWidth="0.8" opacity="0.5" />
      {/* 折叠电动车（开着手机闪光等单） */}
      <rect x="36" y="96" width="34" height="12" rx="4" fill="#262c2e" />
      <rect x="44" y="92" width="8" height="6" rx="2" fill="#1c2224" />
      <circle cx="44" cy="112" r="7" fill="#14181a" />
      <circle cx="44" cy="112" r="3" fill="#3c4248" />
      <circle cx="66" cy="112" r="7" fill="#14181a" />
      <circle cx="66" cy="112" r="3" fill="#3c4248" />
      {/* 头盔（挂在车把上，贴着反光条） */}
      <path d="M 74 102 Q 74 92 81 92 Q 88 92 88 102 Z" fill="#d4a24e" opacity="0.9" />
      <rect x="74" y="100" width="14" height="3" rx="1.4" fill="#8a6a2e" />
      <rect x="77" y="94" width="2" height="8" rx="1" fill="#e8e4d0" opacity="0.6" />
      {/* 手机支架上的光（等单导航） */}
      <rect x="26" y="102" width="7" height="10" rx="1.4" fill="#101418" />
      <rect x="27" y="103.4" width="5" height="7.2" fill="#3a8a5a" opacity="0.8" />
      <circle cx="29.5" cy="107" r="5.4" fill="#3a8a5a" opacity="0.2" />
    </>
  ),
  // 库人物照片——水边钓位
  arch_fishing: (
    <>
      <rect width="200" height="86" fill="#1e3441" />
      <rect width="200" height="86" fill="#2a4a58" opacity="0.3" />
      {/* 晨光 */}
      <circle cx="56" cy="24" r="10" fill="#e8d8a0" opacity="0.5" />
      <circle cx="56" cy="24" r="28" fill="#e8d8a0" opacity="0.1" />
      {/* 远岸薄雾 */}
      <path d="M 0 70 Q 50 58 100 66 Q 150 72 200 62 L 200 86 L 0 86 Z" fill="#24404e" />
      <rect x="0" y="66" width="200" height="8" fill="#cde4ea" opacity="0.08" />
      {/* 水面 */}
      <rect x="0" y="86" width="200" height="64" fill="#2c4e5a" />
      <g stroke="#8fc4d4" fill="none">
        <path d="M 0 92 Q 25 88 50 92 T 100 92 T 150 92 T 200 92" strokeWidth="1.4" opacity="0.4" />
        <path d="M 0 104 Q 25 100 50 104 T 100 104 T 150 104 T 200 104" strokeWidth="1.1" opacity="0.28" />
        <path d="M 0 116 Q 25 112 50 116 T 100 116 T 150 116 T 200 116" strokeWidth="0.9" opacity="0.18" />
        <path d="M 0 128 Q 25 124 50 128 T 100 128 T 150 128 T 200 128" strokeWidth="0.7" opacity="0.1" />
      </g>
      {/* 光柱倒影 */}
      <path d="M 48 86 L 64 86 L 76 150 L 40 150 Z" fill="#e8d8a0" opacity="0.05" />
      {/* 岸（近景土岸 + 钓箱） */}
      <path d="M 0 150 L 0 118 Q 40 112 74 122 L 82 150 Z" fill="#3c4436" />
      <rect x="16" y="112" width="30" height="12" rx="2" fill="#2a3026" />
      <rect x="16" y="112" width="30" height="3" fill="#3c4a3a" opacity="0.8" />
      {/* 钓竿（碳素杆身，弧度） */}
      <path d="M 24 116 Q 90 68 150 44" stroke="#3a2c1a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M 24 116 Q 90 68 150 44" stroke="#6a5434" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* 渔线与浮漂 */}
      <path d="M 150 44 Q 148 70 146 96" stroke="#c9d4dc" strokeWidth="0.7" fill="none" opacity="0.75" />
      <ellipse cx="146" cy="99" rx="2.4" ry="4.4" fill="#d4553f" />
      <rect x="144.6" y="94" width="2.8" height="3" fill="#f4d03f" />
      {/* 水波纹（浮漂周围） */}
      <ellipse cx="146" cy="104" rx="9" ry="2.4" fill="none" stroke="#8fc4d4" strokeWidth="0.7" opacity="0.4" />
      <ellipse cx="146" cy="107" rx="14" ry="3.4" fill="none" stroke="#8fc4d4" strokeWidth="0.5" opacity="0.22" />
      {/* 芦苇（近景剪影） */}
      <g stroke="#2e3a2c" fill="none" strokeLinecap="round">
        <path d="M 168 150 Q 166 128 170 112" strokeWidth="1.6" />
        <path d="M 174 150 Q 178 132 174 118" strokeWidth="1.2" />
        <path d="M 184 150 Q 182 134 188 122" strokeWidth="1.4" />
        <path d="M 194 150 Q 196 138 192 128" strokeWidth="1" />
      </g>
      <ellipse cx="170" cy="110" rx="1.4" ry="3.4" fill="#7a6a3e" opacity="0.9" />
      <ellipse cx="188" cy="120" rx="1.2" ry="3" fill="#7a6a3e" opacity="0.8" />
      {/* 鱼护（浸在水里） */}
      <path d="M 60 126 Q 66 138 62 150 L 54 150 Q 50 138 54 126 Z" fill="#2c362a" opacity="0.85" />
      <path d="M 56 132 L 61 132 M 55 138 L 61 138" stroke="#3c4a3c" strokeWidth="0.7" />
    </>
  ),
  // 库人物照片——棋摊
  arch_chess: (
    <>
      <rect width="200" height="150" fill="#3a2d1a" />
      {/* 午后树荫光斑 */}
      <circle cx="40" cy="30" r="26" fill="#f4d03f" opacity="0.09" />
      <circle cx="160" cy="24" r="18" fill="#f4d03f" opacity="0.07" />
      <circle cx="90" cy="14" r="12" fill="#f4d03f" opacity="0.06" />
      {/* 石桌 */}
      <rect x="16" y="72" width="168" height="70" rx="3" fill="#5c4a2c" />
      <rect x="16" y="72" width="168" height="8" fill="#6e5a38" />
      <rect x="16" y="72" width="168" height="70" rx="3" fill="none" stroke="#4a3a22" strokeWidth="1.6" />
      {/* 棋盘（红木框） */}
      <rect x="30" y="82" width="140" height="58" fill="#c9b68a" />
      <rect x="30" y="82" width="140" height="58" fill="none" stroke="#7a4a2e" strokeWidth="3" />
      {/* 楚河汉界 */}
      <rect x="33" y="106" width="134" height="10" fill="#b8a478" />
      <text x="70" y="114.4" font-size="9" fill="#7a4a2e" fontFamily="serif" opacity="0.85">楚河</text>
      <text x="120" y="114.4" font-size="9" fill="#7a4a2e" fontFamily="serif" opacity="0.85">汉界</text>
      {/* 格纹 */}
      <g stroke="#7a5232" strokeWidth="1.2" opacity="0.55">
        {[45, 70, 95, 120, 145].map((x) => <line key={x} x1={x} y1="82" x2={x} y2="106" />)}
        <line x1="30" y1="94" x2="170" y2="94" />
        {[45, 70, 95, 120, 145].map((x) => <line key={`b${x}`} x1={x} y1="116" x2={x} y2="140" />)}
        <line x1="30" y1="128" x2="170" y2="128" />
      </g>
      {/* 炮架（十字位标记） */}
      <path d="M 41 89 v 4 M 39 91 h 4" stroke="#7a5232" strokeWidth="0.8" opacity="0.6" />
      <path d="M 41 123 v 4 M 39 125 h 4" stroke="#7a5232" strokeWidth="0.8" opacity="0.6" />
      {/* 对弈棋子（红黑各一，立体感） */}
      <g>
        <ellipse cx="64" cy="98" rx="9" ry="3.4" fill="#3a2c14" opacity="0.4" />
        <circle cx="64" cy="93" r="9" fill="#efe6d4" />
        <circle cx="64" cy="93" r="6.6" fill="none" stroke="#a43a2e" strokeWidth="0.9" />
        <text x="61.4" y="96" font-size="7" fill="#a43a2e" fontFamily="serif">帥</text>
        <rect x="56" y="100.4" width="16" height="3" rx="1.4" fill="#d8ccb4" />
      </g>
      <g>
        <ellipse cx="128" cy="121" rx="9" ry="3.4" fill="#241a0c" opacity="0.5" />
        <circle cx="128" cy="116" r="9" fill="#241a10" />
        <circle cx="128" cy="116" r="6.6" fill="none" stroke="#c9b68a" strokeWidth="0.9" />
        <text x="125.4" y="119" font-size="7" fill="#c9b68a" fontFamily="serif">將</text>
        <rect x="120" y="123.4" width="16" height="3" rx="1.4" fill="#3a2c1a" />
      </g>
      {/* 观棋者的茶缸（搁在桌角） */}
      <ellipse cx="184" cy="86" rx="9" ry="2.6" fill="#3a2c14" opacity="0.35" />
      <rect x="176" y="74" width="16" height="12" rx="2" fill="#8a6a3e" />
      <ellipse cx="184" cy="74" rx="8" ry="2.6" fill="#5a4426" />
      <path d="M 184 68 Q 181 64 184 60" stroke="#aab2ba" strokeWidth="1" fill="none" opacity="0.25" />
    </>
  ),
  // 库人物照片——广场舞
  arch_square: (
    <>
      <rect width="200" height="150" fill="#1c1a2c" />
      {/* 华灯 */}
      {[36, 100, 164].map((x) => (
        <g key={x}>
          <rect x={x - 1.6} y="0" width="3.2" height="14" fill="#3c3a4e" />
          <path d={`M ${x - 7} 14 Q ${x} 6 ${x + 7} 14 Z`} fill="#4c4a5e" />
          <circle cx={x} cy="18" r="4" fill="#f4d03f" opacity="0.85" />
          <circle cx={x} cy="18" r="11" fill="#f4d03f" opacity="0.14" />
          <circle cx={x} cy="18" r="20" fill="#f4d03f" opacity="0.05" />
        </g>
      ))}
      {/* 地砖（透视广场） */}
      <path d="M 0 150 L 0 96 L 200 96 L 200 150 Z" fill="#2c2a3c" />
      <g opacity="0.4" stroke="#3a384e">
        <line x1="0" y1="106" x2="200" y2="106" strokeWidth="0.7" />
        <line x1="0" y1="118" x2="200" y2="118" strokeWidth="0.7" />
        <line x1="0" y1="130" x2="200" y2="130" strokeWidth="0.7" />
        <line x1="0" y1="142" x2="200" y2="142" strokeWidth="0.7" />
        <line x1="46" y1="96" x2="34" y2="150" strokeWidth="0.7" />
        <line x1="100" y1="96" x2="100" y2="150" strokeWidth="0.7" />
        <line x1="154" y1="96" x2="166" y2="150" strokeWidth="0.7" />
      </g>
      {/* 音箱双阵（左侧一列，单元有层次） */}
      {[10, 58].map((x, i) => (
        <g key={x} transform={`translate(0 ${i * 4})`}>
          <rect x={x} y="44" width="34" height="54" rx="2.4" fill="#22212e" />
          <rect x={x} y="44" width="34" height="54" rx="2.4" fill="none" stroke="#3c3a4e" strokeWidth="1.2" />
          <circle cx={x + 17} cy="60" r="10" fill="none" stroke="#5c5a6e" strokeWidth="2.4" />
          <circle cx={x + 17} cy="60" r="3.4" fill="#3c3a4e" />
          <circle cx={x + 17} cy="82" r="6.4" fill="none" stroke="#5c5a6e" strokeWidth="1.8" />
          <circle cx={x + 17} cy="82" r="2" fill="#3c3a4e" />
          {/* 音箱工作指示灯 */}
          <circle cx={x + 30} cy="48" r="1.2" fill="#4ade80" opacity="0.7" />
        </g>
      ))}
      {/* 红绸（从灯柱上垂下的一角） */}
      <path d="M 164 24 Q 186 34 188 58 Q 178 52 172 54 Q 180 44 172 34 Z" fill="#c0564f" opacity="0.4" />
      {/* 舞步残影（虚点——夜里晃动的人） */}
      <g fill="#8a3a5a">
        <circle cx="118" cy="104" r="3" opacity="0.3" />
        <circle cx="106" cy="112" r="2.2" opacity="0.2" />
        <circle cx="130" cy="110" r="2.2" opacity="0.2" />
        <circle cx="122" cy="120" r="1.8" opacity="0.14" />
        <ellipse cx="114" cy="112" rx="7" ry="3" fill="none" stroke="#8a3a5a" strokeWidth="0.5" opacity="0.16" />
      </g>
    </>
  ),
};

// ---------------------------------------------------------------------------
// v2.3：朋友圈自拍照——8 种程序化 SVG"手机随手拍"
// v3.0 重绘：真实手机摄影语言——大光圈散景（前景虚化光斑）、定向光源、
//            画面主体偏离中心（三分法）、光渗 + 颗粒的统一后期层。
// ---------------------------------------------------------------------------
/** 统一后期层：光渗（一角的暖/冷光斑）+ 感光颗粒 + 轻暗角。 */
function PhotoFx({ leak, lx, ly, warm = true }: { leak: string; lx: number; ly: number; warm?: boolean }) {
  return (
    <g>
      <defs>
        <radialGradient id="fxLeak" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={leak} stopOpacity="0.14" />
          <stop offset="60%" stopColor={leak} stopOpacity="0.05" />
          <stop offset="100%" stopColor={leak} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={lx} cy={ly} r="78" fill="url(#fxLeak)" />
      <g fill={warm ? '#fff' : '#dce8f4'}>
        <circle cx="21" cy="33" r="0.5" opacity="0.13" />
        <circle cx="52" cy="12" r="0.45" opacity="0.11" />
        <circle cx="88" cy="46" r="0.5" opacity="0.1" />
        <circle cx="131" cy="18" r="0.45" opacity="0.12" />
        <circle cx="167" cy="62" r="0.5" opacity="0.09" />
        <circle cx="113" cy="89" r="0.45" opacity="0.1" />
        <circle cx="39" cy="122" r="0.5" opacity="0.09" />
        <circle cx="176" cy="131" r="0.45" opacity="0.1" />
      </g>
    </g>
  );
}

export function MomentPhoto({ selfieId }: { selfieId: string }) {
  const scene = SELFIE_SCENES[selfieId];
  if (!scene) return null;
  // v3.3 手机摄影质感：每张照片自己的白平衡偏移 + 偶发闪光热斑
  let hh = 0;
  for (let i = 0; i < selfieId.length; i++) hh = (hh * 31 + selfieId.charCodeAt(i)) >>> 0;
  const wb = hh % 2 === 0 ? '#f4a03f' : '#7aa8cc';
  return (
    <svg width="200" height="150" viewBox="0 0 200 150" role="img" aria-label="朋友圈自拍">
      <defs>
        <radialGradient id="sfVig" cx="50%" cy="44%" r="75%">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="80%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.3" />
        </radialGradient>
        <linearGradient id="sfMetal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9aa0a6" />
          <stop offset="50%" stopColor="#5a5f66" />
          <stop offset="100%" stopColor="#3a3f45" />
        </linearGradient>
      </defs>
      {scene}
      {hh % 3 === 0 && <circle cx={hh % 2 ? 38 : 162} cy={hh % 5 < 2 ? 30 : 120} r="26" fill="#fff" opacity="0.1" />}
      <rect width="200" height="150" fill={wb} opacity="0.05" />
      <rect width="200" height="150" fill="url(#sfVig)" />
    </svg>
  );
}

/** 自拍场景库——按 SelfieId 索引（200×150，v3.0 重绘）。 */
const SELFIE_SCENES: Record<string, ReactElement> = {
  // 闺蜜照：两人自拍——左为主角（深色双马尾），右为闺蜜（波波头），举起的手臂与手机入镜，奶茶店暖光
  bestie: (
    <>
      <rect width="200" height="150" fill="#241a20" />
      {/* 奶茶店暖光：灯串散景 */}
      {[24, 58, 92, 126, 160, 188].map((x, i) => (
        <circle key={x} cx={x} cy={18 + (i % 2) * 8} r={5 + (i % 3) * 1.8} fill="#f4c88a" opacity={0.12 + (i % 2) * 0.05} />
      ))}
      <circle cx="170" cy="26" r="13" fill="#f4d03f" opacity="0.14" />
      {/* 背景：虚化的奶茶店柜台与菜单牌 */}
      <g opacity="0.22">
        <rect x="8" y="40" width="52" height="26" rx="2" fill="#1c1216" />
        <rect x="14" y="46" width="40" height="3" fill="#4a3a42" />
        <rect x="14" y="52" width="32" height="2.6" fill="#4a3a42" />
        <rect x="150" y="44" width="42" height="30" rx="2" fill="#1c1216" />
        <rect x="156" y="50" width="30" height="3" fill="#4a3a42" />
      </g>
      {/* 闺蜜（右，波波头，稍后侧）——v4.6 同步新头像语言：结构眼 + 卧蚕 + 唇高光 + 发泽带 */}
      <g>
        <path d="M 128 96 Q 122 58 148 55 Q 176 57 172 96 Q 176 100 174 106 L 126 106 Q 124 100 128 96 Z" fill="#3a2a26" />
        <ellipse cx="149" cy="80" rx="16" ry="17" fill="#f8dcc2" />
        <path d="M 133 78 Q 133 60 149 58.5 Q 165 60 165 78 Q 158 68 149 67.5 Q 140 68 133 78 Z" fill="#3a2a26" />
        {/* 波波头发泽带 */}
        <path d="M 135 66 Q 142 59 152 60" stroke="#ffffff" strokeWidth="1.6" opacity="0.18" fill="none" strokeLinecap="round" />
        <path d="M 135 76 Q 141 72 146 73" stroke="#ffffff" strokeWidth="1" opacity="0.2" fill="none" />
        {/* 眼：结构化（虹膜渐变 + 双高光 + 双眼皮 + 卧蚕） */}
        <g>
          <ellipse cx="143" cy="82" rx="2.3" ry="2.4" fill="#f6f2ea" />
          <ellipse cx="155" cy="82" rx="2.3" ry="2.4" fill="#f6f2ea" />
          <circle cx="143" cy="82.3" r="1.7" fill="#6a4c2e" />
          <circle cx="155" cy="82.3" r="1.7" fill="#6a4c2e" />
          <circle cx="143" cy="82.3" r="0.8" fill="#1c1410" />
          <circle cx="155" cy="82.3" r="0.8" fill="#1c1410" />
          <circle cx="143.6" cy="81.4" r="0.75" fill="#ffffff" opacity="0.95" />
          <circle cx="155.6" cy="81.4" r="0.75" fill="#ffffff" opacity="0.95" />
          <circle cx="142.5" cy="83.6" r="0.35" fill="#ffffff" opacity="0.6" />
          <circle cx="154.5" cy="83.6" r="0.35" fill="#ffffff" opacity="0.6" />
          <path d="M 140.7 81 Q 143 79.5 145.3 81" stroke="#241a12" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M 152.7 81 Q 155 79.5 157.3 81" stroke="#241a12" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          {/* 双眼皮 */}
          <path d="M 141 78.9 Q 143 78.4 145.2 79" stroke="#c89878" strokeWidth="0.5" fill="none" opacity="0.6" />
          <path d="M 152.8 79 Q 155 78.4 157 78.9" stroke="#c89878" strokeWidth="0.5" fill="none" opacity="0.6" />
          {/* 卧蚕 */}
          <path d="M 141 85.6 Q 143 86.3 145 85.6" stroke="#ffead2" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M 153 85.6 Q 155 86.3 157 85.6" stroke="#ffead2" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.7" />
        </g>
        {/* 渐变唇（抿嘴笑 + 中央高光） */}
        <path d="M 142 89.5 Q 149 92.5 156 89.5 Q 149 91.4 142 89.5 Z" fill="#c46a5a" />
        <path d="M 144 90 Q 149 92 154 90" stroke="#ffffff" strokeWidth="0.5" opacity="0.4" fill="none" />
        <ellipse cx="139" cy="87" rx="2.6" ry="1.5" fill="#f0a08c" opacity="0.45" />
        <ellipse cx="159" cy="87" rx="2.6" ry="1.5" fill="#f0a08c" opacity="0.45" />
        {/* 闺蜜的肩膀（紫色上衣） */}
        <path d="M 118 126 Q 124 100 148 98 Q 172 100 180 126 Z" fill="#7a4a7a" />
      </g>
      {/* 主角（左，深色双马尾，更近镜头）——v4.6 与新头像同语言：结构眼/渐变唇/发际线/光泽带 */}
      <g>
        <path d="M 46 108 Q 38 62 70 58 Q 102 62 94 108 Q 98 114 96 122 L 44 122 Q 42 114 46 108 Z" fill="#241c20" />
        {/* 双马尾 + 内侧阴影 + 光泽带 */}
        <path d="M 42 84 Q 30 92 32 112 L 42 108 Z" fill="#241c20" />
        <path d="M 98 84 Q 110 92 108 112 L 98 108 Z" fill="#241c20" />
        <path d="M 34 100 Q 33 106 35.5 110" stroke="#000000" strokeWidth="2.4" fill="none" opacity="0.25" strokeLinecap="round" />
        <path d="M 106 100 Q 107 106 104.5 110" stroke="#000000" strokeWidth="2.4" fill="none" opacity="0.25" strokeLinecap="round" />
        <path d="M 36 92 Q 35 98 37 103" stroke="#ffffff" strokeWidth="1.6" opacity="0.14" fill="none" strokeLinecap="round" />
        <path d="M 104 92 Q 105 98 103 103" stroke="#ffffff" strokeWidth="1.6" opacity="0.14" fill="none" strokeLinecap="round" />
        <ellipse cx="70" cy="84" rx="21" ry="22" fill="#fbdfc0" />
        <path d="M 49 82 Q 49 56 70 54.5 Q 91 56 91 82 Q 82 68 70 67.5 Q 58 68 49 82 Z" fill="#241c20" />
        {/* 发际线 */}
        <path d="M 52 74 Q 70 63 88 76" stroke="#d8a67e" strokeWidth="0.9" fill="none" opacity="0.55" />
        {/* 空气刘海中分 */}
        <path d="M 70 68 Q 66 70 64 75 M 70 68 Q 74 70 76 75" stroke="#241c20" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {/* 前发光泽带 */}
        <path d="M 53 70 Q 60 62 70 61.5" stroke="#ffffff" strokeWidth="1.6" opacity="0.16" fill="none" strokeLinecap="round" />
        <path d="M 87 70 Q 80 62 70 61.5" stroke="#ffffff" strokeWidth="1.6" opacity="0.16" fill="none" strokeLinecap="round" />
        {/* 眼：结构化（虹膜渐变 + 缘环 + 双高光 + 睫线 + 双眼皮 + 卧蚕） */}
        <g>
          <ellipse cx="63" cy="86" rx="3.1" ry="3.7" fill="#f6f2ea" />
          <ellipse cx="77" cy="86" rx="3.1" ry="3.7" fill="#f6f2ea" />
          <circle cx="63" cy="86.4" r="2.3" fill="#6a4c2e" />
          <circle cx="77" cy="86.4" r="2.3" fill="#6a4c2e" />
          <circle cx="63" cy="86.4" r="2.3" fill="none" stroke="#5a4028" strokeWidth="0.4" opacity="0.5" />
          <circle cx="77" cy="86.4" r="2.3" fill="none" stroke="#5a4028" strokeWidth="0.4" opacity="0.5" />
          <circle cx="63" cy="86.4" r="1.05" fill="#1c1410" />
          <circle cx="77" cy="86.4" r="1.05" fill="#1c1410" />
          <circle cx="63.9" cy="85.2" r="0.95" fill="#ffffff" opacity="0.98" />
          <circle cx="77.9" cy="85.2" r="0.95" fill="#ffffff" opacity="0.98" />
          <circle cx="62.2" cy="87.8" r="0.45" fill="#ffffff" opacity="0.6" />
          <circle cx="76.2" cy="87.8" r="0.45" fill="#ffffff" opacity="0.6" />
          {/* 上睫线（自然弧，外眼角不上挑） */}
          <path d="M 60.1 85.8 Q 63 81.8 65.9 85.8" stroke="#241a12" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M 79.9 85.8 Q 77 81.8 74.1 85.8" stroke="#241a12" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          {/* 双眼皮褶线 */}
          <path d="M 60.8 81.6 Q 63 80.8 65.2 81.5" stroke="#c89878" strokeWidth="0.55" fill="none" opacity="0.65" />
          <path d="M 74.8 81.5 Q 77 80.8 79.2 81.6" stroke="#c89878" strokeWidth="0.55" fill="none" opacity="0.65" />
          {/* 下睫 */}
          <path d="M 65.3 89.4 L 66.1 89.9 M 61.3 89.6 L 62 90.2" stroke="#241a12" strokeWidth="0.5" strokeLinecap="round" />
          <path d="M 74.7 89.4 L 73.9 89.9 M 78.7 89.6 L 78 90.2" stroke="#241a12" strokeWidth="0.5" strokeLinecap="round" />
          {/* 卧蚕 */}
          <path d="M 60.5 90.6 Q 63 91.5 65.5 90.6" stroke="#ffead2" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.75" />
          <path d="M 74.5 90.6 Q 77 91.5 79.5 90.6" stroke="#ffead2" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.75" />
        </g>
        {/* 渐变咬唇（开口笑 + 中央高光） */}
        <path d="M 63 96.5 Q 70 102.5 77 96.5 Q 70 99 63 96.5 Z" fill="#c4554a" />
        <path d="M 65 97.4 Q 70 100.8 75 97.4 Q 70 99.2 65 97.4 Z" fill="#000000" opacity="0.18" />
        <ellipse cx="70" cy="96.9" rx="4.6" ry="1.6" fill="#ffffff" opacity="0.7" />
        <path d="M 65.8 96.4 Q 70 95.6 74.2 96.4" stroke="#ffffff" strokeWidth="0.55" opacity="0.45" fill="none" />
        <ellipse cx="56.6" cy="92" rx="3.4" ry="2" fill="#f0a08c" opacity="0.4" />
        <ellipse cx="83.4" cy="92" rx="3.4" ry="2" fill="#f0a08c" opacity="0.4" />
        {/* 樱花发卡（五瓣 + 花心高光 + 一叶） */}
        <g transform="rotate(10 47 66)">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="47" cy="64" rx="1.5" ry="2.2" fill="#f6b8c8" transform={`rotate(${a} 47 66)`} />
          ))}
          <circle cx="47" cy="66" r="1.1" fill="#f4d03f" />
          <circle cx="46.7" cy="65.7" r="0.32" fill="#ffffff" opacity="0.85" />
          <path d="M 48.6 69 Q 51 70 50.4 72.4 Q 48.4 71.4 48.6 69 Z" fill="#8ab87a" opacity="0.85" />
        </g>
        {/* 主角肩膀（奶白上衣） */}
        <path d="M 36 132 Q 44 102 70 100 Q 96 102 104 132 Z" fill="#f4ede4" />
        <path d="M 62 100 L 70 106 L 78 100" stroke="#e67e22" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      {/* 两头相靠：头挨头的剪影暗示 */}
      <path d="M 88 66 Q 96 62 104 66" stroke="#00000030" strokeWidth="2" fill="none" />
      {/* 举起的手臂 + 手机（右上角入镜） */}
      <path d="M 104 128 Q 126 96 148 52" stroke="#f8dcc2" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M 104 128 Q 126 96 148 52" stroke="#eec49e" strokeWidth="4.6" fill="none" strokeLinecap="round" />
      <g transform="rotate(24 156 40)">
        <rect x="144" y="22" width="24" height="42" rx="4" fill="#14161a" />
        <rect x="146" y="24" width="20" height="38" rx="3" fill="#23262c" />
        <circle cx="150" cy="30" r="2.2" fill="#0c0e10" />
        <circle cx="156" cy="30" r="2.2" fill="#0c0e10" />
        <rect x="150" y="52" width="14" height="2" rx="1" fill="#0c0e10" />
      </g>
      {/* 桌沿两只奶茶（前景虚化） */}
      <g opacity="0.85">
        <path d="M 26 150 L 34 122 L 50 122 L 58 150 Z" fill="#c9a37a" />
        <rect x="30" y="116" width="24" height="8" rx="3" fill="#f4ede4" />
        <path d="M 36 118 L 44 104" stroke="#d4553f" strokeWidth="3" strokeLinecap="round" />
        <path d="M 152 150 L 160 124 L 174 124 L 182 150 Z" fill="#c9a37a" />
        <rect x="156" y="118" width="24" height="8" rx="3" fill="#f4ede4" />
        <path d="M 162 120 L 170 106" stroke="#d4553f" strokeWidth="3" strokeLinecap="round" />
      </g>
      <PhotoFx leak="#f4c88a" lx={150} ly={26} />
    </>
  ),

  // 夜跑照：操场夜色，手表荧光屏占前景右下，路灯锥光+月亮
  gym: (
    <>
      <rect width="200" height="150" fill="#0a1020" />
      <g fill="#e8e4d0">
        <circle cx="24" cy="14" r="0.8" opacity="0.6" />
        <circle cx="58" cy="9" r="0.6" opacity="0.4" />
        <circle cx="84" cy="20" r="0.7" opacity="0.5" />
        <circle cx="172" cy="10" r="0.6" opacity="0.4" />
      </g>
      <path d="M 34 16 A 12 12 0 1 0 46 28 A 9.4 9.4 0 1 1 34 16 Z" fill="#e8e4d0" opacity="0.8" />
      <circle cx="47" cy="30" r="20" fill="#e8e4d0" opacity="0.05" />
      {/* 居民楼灯窗（远处，两栋） */}
      <g opacity="0.6">
        <rect x="0" y="36" width="34" height="42" fill="#131c2c" />
        <rect x="42" y="40" width="28" height="38" fill="#101a28" />
        {[[6, 42], [16, 48], [26, 42], [48, 46], [56, 54]].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="4.4" height="3.6" fill={i % 2 ? '#f4d03f' : '#5b8db8'} opacity="0.7" />
        ))}
      </g>
      {/* 跑道（近大远小两条分道线） */}
      <path d="M 0 150 L 0 98 L 200 94 L 200 150 Z" fill="#182234" />
      <path d="M 0 112 L 200 108" stroke="#3c4c5e" strokeWidth="2.2" strokeDasharray="15 11" fill="none" />
      <path d="M 0 132 L 200 130" stroke="#2e3c4e" strokeWidth="1.6" strokeDasharray="10 8" fill="none" opacity="0.6" />
      {/* 路灯（右侧，锥形光洒在跑道上） */}
      <rect x="154" y="8" width="3" height="82" fill="#3a3f45" />
      <path d="M 148 10 L 164 10 L 156 20 Z" fill="#5a5f66" />
      <circle cx="156" cy="23" r="4" fill="#f4d03f" opacity="0.9" />
      <circle cx="156" cy="23" r="12" fill="#f4d03f" opacity="0.14" />
      <path d="M 144 25 L 168 25 L 182 100 L 130 100 Z" fill="#f4d03f" opacity="0.05" />
      {/* 前景：手腕 + 运动手环（荧光绿屏，右下三分位） */}
      <ellipse cx="66" cy="120" rx="38" ry="22" fill="#141f30" />
      <path d="M 30 116 Q 36 106 46 102" stroke="#d4a678" strokeWidth="5.5" fill="none" opacity="0.55" strokeLinecap="round" />
      <rect x="48" y="112" width="27" height="15" rx="7.5" fill="#0c2418" />
      <rect x="50.5" y="114" width="22" height="11" rx="5.5" fill="#16382a" />
      <text x="54" y="122.5" font-size="7.5" fill="#4ade80" fontFamily="monospace" opacity="0.95">23:47</text>
      <circle cx="76" cy="119" r="1.5" fill="#2ecc71" opacity="0.85" />
      <circle cx="76" cy="119" r="4" fill="#2ecc71" opacity="0.22" />
      {/* 呼出的白气（冬夜证据） */}
      <path d="M 108 128 Q 116 122 112 114 Q 109 108 114 102" stroke="#dce8f4" strokeWidth="2.6" fill="none" opacity="0.12" strokeLinecap="round" />
      <PhotoFx leak="#4a8ab8" lx={44} ly={26} warm={false} />
    </>
  ),
  // 泳池照：正午顶光，泳圈斜置三分位，水面波光+瓷砖
  pool: (
    <>
      <rect width="200" height="150" fill="#7ab8d4" />
      <rect width="200" height="66" fill="#9ad4e8" opacity="0.5" />
      <circle cx="40" cy="22" r="8.5" fill="#fff" opacity="0.7" />
      <circle cx="40" cy="22" r="18" fill="#fff" opacity="0.13" />
      {/* 远处躺椅（虚化） */}
      <g opacity="0.35">
        <rect x="148" y="52" width="42" height="6" rx="3" fill="#e8dcc8" />
        <rect x="156" y="58" width="3" height="9" fill="#c8b8a4" />
        <rect x="176" y="58" width="3" height="9" fill="#c8b8a4" />
      </g>
      {/* 泳池水 */}
      <path d="M 0 66 L 200 62 L 200 150 L 0 150 Z" fill="#4a9ac4" />
      <g stroke="#e4f4fa" fill="none">
        <path d="M 0 80 Q 25 74 50 80 T 100 80 T 150 80 T 200 80" strokeWidth="2.4" opacity="0.6" />
        <path d="M 0 98 Q 25 92 50 98 T 100 98 T 150 98 T 200 98" strokeWidth="1.8" opacity="0.46" />
        <path d="M 0 116 Q 25 110 50 116 T 100 116 T 150 116 T 200 116" strokeWidth="1.4" opacity="0.32" />
        <path d="M 0 134 Q 25 128 50 134 T 100 134 T 150 134 T 200 134" strokeWidth="1" opacity="0.2" />
      </g>
      {/* 池底瓷砖（隐约网格） */}
      <g opacity="0.12" stroke="#e4f4fa">
        <line x1="0" y1="88" x2="200" y2="86" strokeWidth="0.7" />
        <line x1="52" y1="66" x2="48" y2="150" strokeWidth="0.7" />
        <line x1="148" y1="64" x2="152" y2="150" strokeWidth="0.7" />
      </g>
      {/* 泳圈（斜置三分位，红白条 + 水面投影） */}
      <g transform="rotate(-9 122 96)">
        <ellipse cx="122" cy="94" rx="33" ry="14.5" fill="none" stroke="#d4553f" strokeWidth="9.5" />
        <ellipse cx="122" cy="94" rx="33" ry="14.5" fill="none" stroke="#fff" strokeWidth="2.8" strokeDasharray="8.5 8.5" />
        <path d="M 102 84 Q 114 80 128 82" stroke="#fff" strokeWidth="2.2" opacity="0.55" fill="none" strokeLinecap="round" />
      </g>
      <ellipse cx="122" cy="106" rx="27" ry="6" fill="#2a6a8a" opacity="0.28" />
      {/* 水花（左侧点缀） */}
      <g fill="#fff">
        <circle cx="58" cy="92" r="2.2" opacity="0.65" />
        <circle cx="72" cy="80" r="1.6" opacity="0.5" />
        <circle cx="86" cy="96" r="2.6" opacity="0.42" />
        <circle cx="66" cy="103" r="1.3" opacity="0.36" />
      </g>
      {/* 遮阳伞一角（左上前景，占角构图） */}
      <path d="M 0 0 L 70 0 Q 34 34 0 44 Z" fill="#f2ead8" />
      <path d="M 24 0 L 38 0 Q 30 26 22 35 Z" fill="#d4553f" opacity="0.72" />
      <path d="M 48 0 L 60 0 Q 55 15 46 23 Z" fill="#4a9ac4" opacity="0.55" />
      <path d="M 8 0 L 19 0 Q 13 15 7 25 Z" fill="#f4d03f" opacity="0.5" />
      <PhotoFx leak="#ffe8b0" lx={180} ly={20} />
    </>
  ),
  // 橘猫照：暖台灯下蜷成一团的橘猫（沙发），散景灯串
  cat: (
    <>
      <rect width="200" height="150" fill="#2a2018" />
      {/* 背景灯串（散景光斑一排） */}
      {[22, 54, 86, 118, 150, 182].map((x, i) => (
        <circle key={x} cx={x} cy={16 + (i % 2) * 7} r={4.5 + (i % 3) * 1.6} fill="#f4c88a" opacity={0.13 + (i % 2) * 0.05} />
      ))}
      <circle cx="168" cy="30" r="5" fill="#f4d03f" opacity="0.5" />
      <circle cx="168" cy="30" r="15" fill="#f4d03f" opacity="0.1" />
      {/* 沙发 */}
      <rect x="4" y="62" width="192" height="54" rx="12" fill="#5a4632" />
      <rect x="4" y="62" width="192" height="10" rx="6" fill="#6a563e" />
      <rect x="94" y="64" width="2.2" height="50" fill="#4a3a28" />
      <rect x="0" y="76" width="17" height="60" rx="8" fill="#6a563e" />
      <rect x="183" y="76" width="17" height="60" rx="8" fill="#6a563e" />
      <path d="M 14 70 Q 50 66 90 70 L 90 106 L 14 106 Z" fill="#4e3c2a" opacity="0.5" />
      {/* 橘猫（蜷团闭眼，条纹 + 尾巴搭鼻） */}
      <ellipse cx="102" cy="102" rx="38" ry="20" fill="#e89a3a" />
      <ellipse cx="102" cy="98" rx="33" ry="14" fill="#f0b45a" opacity="0.4" />
      <g stroke="#c8782a" strokeWidth="2" opacity="0.5" strokeLinecap="round" fill="none">
        <path d="M 116 88 Q 119 94 117 100" />
        <path d="M 126 92 Q 128 98 126 104" />
        <path d="M 136 98 Q 137 103 135 108" />
      </g>
      <circle cx="66" cy="94" r="16" fill="#e89a3a" />
      <path d="M 54 86 L 56.5 74 L 64 83 Z" fill="#e89a3a" />
      <path d="M 68 82 L 72.5 71 L 76.5 84 Z" fill="#e89a3a" />
      <path d="M 55 84 L 57 78 L 61 83 Z" fill="#d4882e" opacity="0.7" />
      <path d="M 69 80 L 72 75 L 74.5 81 Z" fill="#d4882e" opacity="0.7" />
      <path d="M 56 92 Q 60 95 64 92" stroke="#1a1a1a" strokeWidth="1.6" fill="none" />
      <path d="M 48 99 L 38 97 M 48 102 L 39 103" stroke="#f0d8b8" strokeWidth="0.9" />
      <ellipse cx="52" cy="98" rx="3.4" ry="2.4" fill="#f0b8a0" opacity="0.8" />
      <path d="M 138 104 Q 164 98 160 76 Q 158 68 150 70" stroke="#e89a3a" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M 138 104 Q 164 98 160 76 Q 158 68 150 70" stroke="#c8782a" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.4" />
      {/* 爪垫 + 前景地毯绒毛 */}
      <ellipse cx="94" cy="119" rx="8" ry="4" fill="#f0d8b8" opacity="0.9" />
      <circle cx="90" cy="117" r="1.2" fill="#e0a088" opacity="0.7" />
      <circle cx="95" cy="116" r="1.2" fill="#e0a088" opacity="0.7" />
      <ellipse cx="100" cy="142" rx="86" ry="12" fill="#3a2c22" opacity="0.75" />
      <g stroke="#46362a" strokeWidth="0.8" opacity="0.6">
        <path d="M 30 138 l 3 -4 M 58 142 l 3 -4 M 120 140 l 3 -4 M 154 138 l 3 -4" />
      </g>
      <PhotoFx leak="#f4b06a" lx={162} ly={24} />
    </>
  ),
  // 加班照：01:47 的工位，屏幕光是唯一光源，屏幕光打亮键盘
  grind: (
    <>
      <rect width="200" height="150" fill="#101218" />
      {/* 窗外城市（网格灯窗 + 一粒月） */}
      <rect x="142" y="0" width="58" height="150" fill="#0a0c12" />
      {[152, 164, 176, 188].map((x, i) => [10, 26, 42, 58, 74, 90].map((y, j) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="7" height="7" fill={(i * 3 + j * 5) % 7 < 3 ? '#f4d03f' : '#5b8db8'} opacity={((i + j) % 3) * 0.2 + 0.13} />
      )))}
      <circle cx="26" cy="18" r="3.6" fill="#e8e4d0" opacity="0.32" />
      {/* 屏幕（编辑器）+ 屏幕光晕（这是这张照片的太阳） */}
      <rect x="22" y="30" width="112" height="68" rx="4" fill="#1a1f2a" />
      <rect x="28" y="36" width="100" height="56" fill="#232c3e" />
      <g>
        <rect x="30" y="42" width="4" height="3" fill="#3a4658" opacity="0.7" />
        <rect x="38" y="42" width="14" height="3.4" rx="1.2" fill="#c678dd" opacity="0.8" />
        <rect x="54" y="42" width="30" height="3.4" rx="1.2" fill="#61afef" opacity="0.8" />
        <rect x="38" y="50" width="22" height="3.4" rx="1.2" fill="#98c379" opacity="0.75" />
        <rect x="62" y="50" width="42" height="3.4" rx="1.2" fill="#61afef" opacity="0.6" />
        <rect x="46" y="58" width="38" height="3.4" rx="1.2" fill="#d19a66" opacity="0.7" />
        <rect x="46" y="66" width="26" height="3.4" rx="1.2" fill="#98c379" opacity="0.6" />
        <rect x="76" y="66" width="34" height="3.4" rx="1.2" fill="#61afef" opacity="0.5" />
        <rect x="38" y="74" width="18" height="3.4" rx="1.2" fill="#e5c07b" opacity="0.7" />
        <rect x="58" y="74" width="40" height="3.4" rx="1.2" fill="#abb2bf" opacity="0.45" />
      </g>
      <rect x="58" y="82" width="6.4" height="5.4" fill="#e8f0f4" opacity="0.9" />
      <ellipse cx="78" cy="104" rx="56" ry="14" fill="#4a8ab8" opacity="0.1" />
      <ellipse cx="78" cy="112" rx="40" ry="10" fill="#4a8ab8" opacity="0.08" />
      {/* 键盘（被屏幕光照亮的上缘） */}
      <path d="M 34 98 L 122 98 L 128 128 L 28 128 Z" fill="#1c222c" />
      <path d="M 34 98 L 122 98" stroke="#4a6a8a" strokeWidth="1" opacity="0.6" />
      <g opacity="0.5" fill="#2a3240">
        {[103, 109, 115].map((y) => <rect key={y} x="40" y={y} width="76" height="3.4" rx="1" />)}
      </g>
      <rect x="74" y="120" width="18" height="5" rx="2.4" fill="#2a3240" />
      {/* 咖啡（凉了——没热气）+ 外卖盒 */}
      <rect x="12" y="96" width="11" height="13" rx="2" fill="#8a8478" />
      <path d="M 23 99 q 4 2 0 6" stroke="#8a8478" strokeWidth="2" fill="none" opacity="0.8" />
      <ellipse cx="17.5" cy="96" rx="5.5" ry="1.8" fill="#241a10" />
      <rect x="140" y="106" width="44" height="23" rx="2.4" fill="#c9b892" />
      <rect x="143" y="109" width="38" height="4" fill="#a89a6e" opacity="0.55" />
      <line x1="148" y1="104" x2="174" y2="100" stroke="#8a6a3a" strokeWidth="2" strokeLinecap="round" />
      <text x="34" y="142" font-size="10" fill="#5a6a7a" fontFamily="monospace" opacity="0.9">01:47</text>
      <PhotoFx leak="#4a8ab8" lx={100} ly={58} warm={false} />
    </>
  ),
  // 旅行照：落日盘山公路（车窗框 + 斜阳炫光）
  travel: (
    <>
      <defs>
        <linearGradient id="trSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2ca9a" />
          <stop offset="55%" stopColor="#e8a86a" />
          <stop offset="100%" stopColor="#c8884e" />
        </linearGradient>
      </defs>
      <rect width="200" height="150" fill="url(#trSky)" />
      <circle cx="148" cy="52" r="19" fill="#f4a03f" />
      <circle cx="148" cy="52" r="30" fill="#f4a03f" opacity="0.24" />
      <circle cx="148" cy="52" r="46" fill="#f4a03f" opacity="0.1" />
      <g fill="#f8dcb4" opacity="0.5">
        <ellipse cx="60" cy="30" rx="26" ry="4" />
        <ellipse cx="110" cy="22" rx="18" ry="3" opacity="0.7" />
        <ellipse cx="40" cy="44" rx="20" ry="3" opacity="0.6" />
      </g>
      <path d="M 0 92 L 40 52 L 76 92 Z" fill="#8a6a5a" opacity="0.55" />
      <path d="M 52 92 L 102 42 L 152 92 Z" fill="#6a5244" opacity="0.75" />
      <path d="M 118 92 L 162 58 L 200 92 Z" fill="#8a6a5a" opacity="0.6" />
      <rect x="0" y="86" width="200" height="8" fill="#f0d8b4" opacity="0.3" />
      <path d="M 0 150 L 0 108 L 200 150 Z" fill="#5a4a3a" />
      <path d="M 0 150 L 0 124 Q 60 128 100 138 Q 140 146 200 150 Z" fill="#6a5a4a" opacity="0.6" />
      <path d="M 96 112 L 108 124 Q 100 138 88 150" stroke="#f0e8d8" strokeWidth="4" fill="none" opacity="0.55" strokeDasharray="12 10" />
      <g fill="#f0e8d8" opacity="0.7">
        <rect x="30" y="130" width="2.4" height="8" rx="1" />
        <rect x="60" y="136" width="2.4" height="8" rx="1" />
      </g>
      {/* 车窗框 + 斜阳炫光（摄影感的关键：入射光划过镜头） */}
      <rect x="0" y="0" width="200" height="150" fill="none" stroke="#3a3026" strokeWidth="14" />
      <line x1="0" y1="0" x2="200" y2="150" stroke="#3a3026" strokeWidth="7" opacity="0.4" />
      <path d="M 28 0 L 46 0 L 0 96 L 0 68 Z" fill="#fff" opacity="0.15" />
      <path d="M 60 0 L 68 0 L 0 130 L 0 112 Z" fill="#fff" opacity="0.07" />
      <circle cx="52" cy="10" r="7" fill="#fff" opacity="0.1" />
      <PhotoFx leak="#f4a05a" lx={170} ly={46} />
    </>
  ),
  // 奶茶照：侧窗光打在杯身上，杯身透光，珍珠沉底
  boba: (
    <>
      <rect width="200" height="150" fill="#241616" />
      {/* 右侧窗光（斜光带打亮桌面与杯身） */}
      <path d="M 200 0 L 200 150 L 118 150 Q 148 74 132 0 Z" fill="#f4d8a8" opacity="0.06" />
      {[30, 56, 82].map((x) => (
        <circle key={x} cx={x} cy="16" r="2" fill="#f4d03f" opacity="0.7" />
        ))}
      <g opacity="0.2">
        <rect x="146" y="12" width="48" height="44" rx="2" fill="#1a1212" />
        <rect x="152" y="20" width="36" height="4" fill="#3a2a2a" />
        <rect x="152" y="30" width="28" height="3" fill="#3a2a2a" />
        <rect x="152" y="38" width="32" height="3" fill="#3a2a2a" />
      </g>
      <path d="M 0 150 L 0 106 L 200 100 L 200 150 Z" fill="#3a2a1e" />
      <path d="M 0 122 Q 100 114 200 110" stroke="#241810" strokeWidth="1" fill="none" opacity="0.6" />
      <ellipse cx="104" cy="130" rx="34" ry="7" fill="#000" opacity="0.32" />
      {/* 杯身（透光：右侧亮，左侧暗） */}
      <path d="M 64 44 L 136 44 L 126 124 L 74 124 Z" fill="#a87852" />
      <path d="M 92 44 L 136 44 L 126 124 L 92 124 Z" fill="#c99a6e" opacity="0.9" />
      <path d="M 70 62 L 130 62 L 126 124 L 74 124 Z" fill="#8a5a3a" />
      <path d="M 100 62 L 130 62 L 126 124 L 100 124 Z" fill="#a06a44" opacity="0.9" />
      <path d="M 64 44 L 74 44 L 76 122 L 78 122 Z" fill="#f4e0c0" opacity="0.25" />
      {/* 奶盖 + 波纹 */}
      <path d="M 64 44 L 136 44 L 134 55 L 66 55 Z" fill="#f4ede4" />
      <path d="M 68 55 Q 78 57.4 90 55 Q 102 57.4 114 55 Q 124 57 132 55" stroke="#e8dccc" strokeWidth="1.5" fill="none" />
      <path d="M 68 48 Q 72 44.6 75 48" stroke="#fff" strokeWidth="1.3" fill="none" opacity="0.5" />
      {/* 珍珠（沉底三层，带高光） */}
      <g>
        <circle cx="90" cy="114" r="4.4" fill="#241610" /><circle cx="88.6" cy="112.6" r="1.2" fill="#4a3a2e" opacity="0.8" />
        <circle cx="104" cy="118" r="4.4" fill="#2a1a12" /><circle cx="102.6" cy="116.6" r="1.2" fill="#4a3a2e" opacity="0.8" />
        <circle cx="114" cy="110" r="4.2" fill="#1e120c" /><circle cx="112.8" cy="108.8" r="1.1" fill="#4a3a2e" opacity="0.7" />
        <circle cx="97" cy="104" r="3.6" fill="#3a2a1e" />
        <circle cx="110" cy="98" r="3.2" fill="#3a2a1e" opacity="0.85" />
        <circle cx="86" cy="100" r="3" fill="#3a2a1e" opacity="0.7" />
      </g>
      {/* 吸管（红，斜插）+ 杯套 */}
      <g transform="rotate(10 108 48)">
        <rect x="105" y="16" width="6" height="42" rx="2" fill="#d4553f" />
        <rect x="105" y="16" width="2.2" height="42" fill="#e8a098" opacity="0.5" />
        <ellipse cx="108" cy="16" rx="3" ry="1.3" fill="#3a2018" />
      </g>
      <path d="M 76 86 L 124 86 L 121 107 L 79 107 Z" fill="#f0e8d8" />
      <path d="M 76 86 L 124 86 L 123.4 90 L 76.6 90 Z" fill="#e0d4bc" opacity="0.7" />
      <text x="88" y="100" font-size="9" fill="#5a3a24" fontFamily="serif" opacity="0.9">全糖</text>
      <PhotoFx leak="#f4c88a" lx={190} ly={110} />
    </>
  ),
  // 病床照：夜里两点四十的病房，冷走廊灯 + 吊瓶一滴
  sick: (
    <>
      <rect width="200" height="150" fill="#39424a" />
      <rect width="200" height="150" fill="#414a52" opacity="0.4" />
      <rect x="0" y="0" width="200" height="10" fill="#2a3238" />
      <rect x="0" y="120" width="200" height="30" fill="#333c44" />
      {/* 走廊夜灯（冷光，左侧） */}
      <rect x="8" y="16" width="20" height="30" rx="2" fill="#4a5a6a" opacity="0.5" />
      <rect x="10" y="18" width="16" height="26" fill="#5a7a9a" opacity="0.25" />
      <circle cx="18" cy="31" r="19" fill="#5a7a9a" opacity="0.06" />
      {/* 床头暖灯（一点橘——冷房间里的暖） */}
      <circle cx="88" cy="26" r="3" fill="#f4b06a" opacity="0.7" />
      <circle cx="88" cy="26" r="10" fill="#f4b06a" opacity="0.08" />
      {/* 吊瓶架 + 吊瓶（药液剩一半，一滴正落） */}
      <line x1="152" y1="8" x2="152" y2="128" stroke="#6a7278" strokeWidth="3.2" />
      <line x1="128" y1="10" x2="176" y2="10" stroke="#6a7278" strokeWidth="3.2" strokeLinecap="round" />
      <rect x="141" y="18" width="22" height="38" rx="5" fill="#c9e0ea" opacity="0.32" />
      <rect x="141" y="33" width="22" height="23" rx="5" fill="#8ab8c8" opacity="0.55" />
      <g stroke="#6a8a9a" strokeWidth="0.5" opacity="0.6">
        <line x1="161" y1="34" x2="164" y2="34" />
        <line x1="161" y1="40" x2="164" y2="40" />
        <line x1="161" y1="46" x2="164" y2="46" />
      </g>
      <rect x="147" y="56" width="10" height="10" rx="2" fill="#8ab8c8" opacity="0.8" />
      <path d="M 152 70 Q 132 80 122 92 Q 112 104 106 118" stroke="#c9e0ea" strokeWidth="2" fill="none" opacity="0.85" />
      <ellipse cx="152" cy="73" rx="3.2" ry="5" fill="none" stroke="#c9e0ea" strokeWidth="1" opacity="0.8" />
      <circle cx="152" cy="78" r="1.1" fill="#c9e0ea" opacity="0.95" />
      <circle cx="152" cy="82.5" r="0.9" fill="#c9e0ea" opacity="0.8" />
      {/* 病床 + 被子 + 枕头 */}
      <rect x="18" y="94" width="96" height="14" rx="4" fill="#8a9298" />
      <rect x="18" y="94" width="96" height="4" rx="2" fill="#a2aab0" />
      <path d="M 20 108 L 112 108 L 116 124 L 16 124 Z" fill="#c2cad0" />
      <path d="M 20 108 L 60 108 L 58 124 L 16 124 Z" fill="#d4dce2" opacity="0.6" />
      <rect x="12" y="106" width="6" height="20" rx="2" fill="#5a6268" />
      <rect x="106" y="106" width="6" height="20" rx="2" fill="#5a6268" />
      <rect x="16" y="70" width="38" height="26" rx="6" fill="#dce4ea" />
      <rect x="18" y="72" width="34" height="20" rx="5" fill="#e8f0f4" opacity="0.6" />
      {/* 手背 + 针头胶布 */}
      <ellipse cx="98" cy="106" rx="16" ry="6.4" fill="#d4b090" />
      <ellipse cx="95" cy="104.4" rx="8" ry="3.4" fill="#e4c4a4" opacity="0.7" />
      <path d="M 86 104 Q 84 108 88 110" stroke="#d4b090" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 110 104 Q 112 108 108 110" stroke="#d4b090" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="92" y="106" width="14" height="5" rx="2.4" fill="#f0e8d8" opacity="0.95" />
      <line x1="93" y1="108" x2="105" y2="107" stroke="#d8ccb4" strokeWidth="0.8" opacity="0.7" />
      {/* 挂钟 02:40 */}
      <circle cx="52" cy="30" r="12.6" fill="#2a3238" />
      <circle cx="52" cy="30" r="12.6" fill="none" stroke="#6a7278" strokeWidth="1.5" />
      <circle cx="52" cy="30" r="10" fill="#333c44" />
      <g stroke="#c9e0ea" strokeWidth="1">
        <line x1="52" y1="21" x2="52" y2="23" />
        <line x1="61" y1="30" x2="59" y2="30" />
        <line x1="52" y1="39" x2="52" y2="37" />
        <line x1="43" y1="30" x2="45" y2="30" />
      </g>
      <line x1="52" y1="30" x2="52" y2="23.4" stroke="#c9e0ea" strokeWidth="1.4" />
      <line x1="52" y1="30" x2="57.4" y2="33.6" stroke="#c9e0ea" strokeWidth="1.2" />
      <PhotoFx leak="#8ab8d4" lx={186} ly={16} warm={false} />
    </>
  ),
};

// ---------------------------------------------------------------------------
// 女主角头像系统（v4.6 重绘：结构层 + 美颜自拍氛围）：
//  - 结构层（与老头头像 v3.0 同代技法）：颅骨+下颌剪影拼合、三档肤质
//    （base 渐变/shade 修容/hi 高光）、真眼四件（虹膜渐变+双高光+上下睫线+
//    卧蚕）、前后发层分离 + 发际线 + 光泽带、脖颈 + 肩 + 衣领投影；
//  - 自拍氛围层：45° 定向柔光、两档虚化散景背景、面部 bloom、感光颗粒、暗角
//    ——观感是「用美颜相机拍的、但底子是真结构」的自拍；
//  - 4 种眼型（上挑/圆亮/温软/平静）× 4 种唇形（咬唇红/张口笑/抿嘴笑/淡然）；
//  - 4 种发型（长发/双马尾/丸子头/波波头）+ 4 款衣领（V领/白领/套头/暗领）；
//  - 人设专属配饰：耳坠 / 樱花发卡 / 素色发髻 / 贝雷帽；
//  - 10 款可选头像 = 发型×发色×瞳型×唇色×配饰×衣领组合，数据驱动。
//  - 红线（v3.3 设计原则）：净版皮肤——不做眼位不对称、不加痣。她的好看
//    是修过但没修过头的，与 NPC 的「不讲究」形成对照。
// ---------------------------------------------------------------------------
type EyeStyle = 'up' | 'round' | 'soft' | 'calm';
type HairStyle = 'long' | 'twin' | 'bun' | 'bob';
type Extra = 'earring' | 'flower' | 'beret' | 'none';
type Outfit = 'vneck' | 'collar' | 'sweater' | 'hoodie';

interface GirlSpec {
  bg: string;
  hair: string;
  hairStyle: HairStyle;
  accent: string;
  lip: string;
  eye: EyeStyle;
  extra: Extra;
  /** v4.6：衣领款（解耦自眼型——同一双眼睛可以穿不同的领口）。 */
  outfit: Outfit;
}

const PERSONA_STYLE: Record<PersonaId, GirlSpec> = {
  femme_fatale: { bg: '#1c1016', hair: '#181418', hairStyle: 'long', accent: '#c0392b', lip: '#c22a44', eye: 'up', extra: 'earring', outfit: 'vneck' },
  sweet_daughter: { bg: '#14202a', hair: '#4a3020', hairStyle: 'twin', accent: '#e67e22', lip: '#e07856', eye: 'round', extra: 'flower', outfit: 'collar' },
  wise_sister: { bg: '#101a14', hair: '#2c2018', hairStyle: 'bun', accent: '#27ae60', lip: '#c96a5e', eye: 'soft', extra: 'none', outfit: 'sweater' },
  artistic_soul: { bg: '#16141c', hair: '#262428', hairStyle: 'bob', accent: '#8e44ad', lip: '#b05a68', eye: 'calm', extra: 'beret', outfit: 'hoodie' },
};

/** 10 款可选头像（发型×发色×瞳型×唇色×配饰×衣领组合）——每款一套完整造型身份。 */
export const AVATAR_PRESETS: (GirlSpec & { id: number; label: string })[] = [
  { id: 1, label: '御姐款', bg: '#1c1016', hair: '#181418', hairStyle: 'long', accent: '#c0392b', lip: '#c22a44', eye: 'up', extra: 'earring', outfit: 'vneck' },
  { id: 2, label: '学妹款', bg: '#14202a', hair: '#4a3020', hairStyle: 'twin', accent: '#e67e22', lip: '#e07856', eye: 'round', extra: 'flower', outfit: 'collar' },
  { id: 3, label: '姐姐款', bg: '#101a14', hair: '#2c2018', hairStyle: 'bun', accent: '#27ae60', lip: '#c96a5e', eye: 'soft', extra: 'none', outfit: 'sweater' },
  { id: 4, label: '文青款', bg: '#16141c', hair: '#262428', hairStyle: 'bob', accent: '#8e44ad', lip: '#b05a68', eye: 'calm', extra: 'beret', outfit: 'hoodie' },
  { id: 5, label: '栗发耳坠', bg: '#1c1618', hair: '#6b3a2a', hairStyle: 'long', accent: '#d4a017', lip: '#c75850', eye: 'soft', extra: 'earring', outfit: 'hoodie' },
  { id: 6, label: '冷淡波波', bg: '#10161c', hair: '#38506b', hairStyle: 'bob', accent: '#2e86ab', lip: '#d4705e', eye: 'round', extra: 'none', outfit: 'vneck' },
  { id: 7, label: '紫调马尾', bg: '#1a1420', hair: '#52425e', hairStyle: 'twin', accent: '#a569bd', lip: '#b86a78', eye: 'up', extra: 'none', outfit: 'sweater' },
  { id: 8, label: '棕丸子', bg: '#201416', hair: '#7a4a3a', hairStyle: 'bun', accent: '#cb7623', lip: '#cc6f62', eye: 'calm', extra: 'flower', outfit: 'collar' },
  { id: 9, label: '长直文艺', bg: '#141c16', hair: '#3a5240', hairStyle: 'long', accent: '#52b788', lip: '#c2705f', eye: 'round', extra: 'beret', outfit: 'sweater' },
  { id: 10, label: '复古波波', bg: '#1c1a14', hair: '#5e5236', hairStyle: 'bob', accent: '#b5a642', lip: '#bf5f58', eye: 'soft', extra: 'earring', outfit: 'collar' },
];

/**
 * v4.8 女主角头像：文生图 PNG（public/avatars/avatar-{id}.png，256×256）。
 * 加载失败时 onError 回退到 PersonaFace SVG——生成脚本见 pytools/generate_avatars.py。
 */
const PNG_AVATAR = (id: number) => `/avatars/avatar-${id}.png`;
/** 四个人设与头像库 1-4 同款（PERSONA_STYLE === AVATAR_PRESETS[0..3]）。 */
const PERSONA_TO_PRESET: Record<PersonaId, number> = {
  femme_fatale: 1, sweet_daughter: 2, wise_sister: 3, artistic_soul: 4,
};

function FemaleAvatar({ presetId, st, size }: { presetId: number; st: GirlSpec; size: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <PersonaFace st={st} size={size} />;
  return (
    <img
      src={PNG_AVATAR(presetId)}
      alt="你"
      width={size}
      height={size}
      style={{
        borderRadius: '50%',
        display: 'block',
        // 对应当前 SVG 的外圈暗描边环（视觉延续）
        boxShadow: '0 0 0 1px rgba(0,0,0,0.33)',
      }}
      onError={() => setFailed(true)}
    />
  );
}

/** 可选头像渲染（AvatarId 1-10）。 */
export function ProfileAvatar({ avatarId, size = 44 }: { avatarId: number; size?: number }) {
  const st = AVATAR_PRESETS[(avatarId - 1) % AVATAR_PRESETS.length];
  return <FemaleAvatar presetId={st.id} st={st} size={size} />;
}

export function PersonaAvatar({ personaId, size = 44 }: { personaId: PersonaId; size?: number }) {
  return <FemaleAvatar presetId={PERSONA_TO_PRESET[personaId]} st={PERSONA_STYLE[personaId]} size={size} />;
}

function PersonaFace({ st, size }: { st: GirlSpec; size: number }) {
  // ---- 脸基座几何（女款：颅骨椭圆 + 收窄下颌剪影拼合——软尖下巴） ----
  const chinY = 41.2;
  const jawW = 6.9;
  // 瞳色从发色派生（深发深瞳/浅发暖瞳）
  const irisDark = st.eye === 'round' ? '#3a2a1a' : '#2e2418';

  // 上睫线（flip=±1）：内→外自然弧，拱顶略偏中，外眼角与内眼角平齐（不做上挑）
  const lashPath = (cx: number, flip: number) => {
    const outer = cx + flip * 2.7;
    const peak = st.eye === 'up' ? 23.3 : 23.7;
    return `M ${cx - flip * 2.6} 27.1 Q ${cx} ${peak} ${outer} 27.15`;
  };

  return (
    <svg width={size} height={size} viewBox="0 0 54 54" role="img" aria-label="你">
      <defs>
        <radialGradient id="pfVig" cx="50%" cy="42%" r="72%">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="82%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.4" />
        </radialGradient>
        <linearGradient id="pfFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fce0c4" />
          <stop offset="100%" stopColor="#f2c6a2" />
        </linearGradient>
        <linearGradient id="pfIris" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a5634" />
          <stop offset="100%" stopColor={irisDark} />
        </linearGradient>
        <linearGradient id="pfSoft" x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.07" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ===== 氛围层：底色 + 两档虚化散景 + 45° 柔光 + 星点 ===== */}
      <circle cx="27" cy="27" r="26" fill={st.bg} />
      {/* 外档散景（大而糊——像手机镜头里融掉的灯） */}
      <g fill={st.accent}>
        <circle cx="40" cy="13" r="9" opacity="0.11" />
        <circle cx="10" cy="42" r="7.5" opacity="0.07" />
        <circle cx="44" cy="38" r="6" opacity="0.06" />
        <circle cx="8" cy="12" r="4.5" opacity="0.08" />
        <circle cx="22" cy="49" r="5" opacity="0.05" />
      </g>
      {/* 内档散景（小而实——对上焦的那几粒） */}
      <g fill={st.accent}>
        <circle cx="43" cy="9" r="2" opacity="0.16" />
        <circle cx="6.5" cy="33" r="1.6" opacity="0.12" />
        <circle cx="47" cy="28" r="1.4" opacity="0.1" />
      </g>
      {/* 45° 定向柔光（左上打下来的一带——自拍的顺光方向） */}
      <path d="M 0 0 L 54 0 L 54 30 Q 26 44 0 20 Z" fill="url(#pfSoft)" />
      <g fill="#ffffff">
        <circle cx="42" cy="34" r="1" opacity="0.16" />
        <circle cx="10" cy="18" r="0.85" opacity="0.13" />
        <circle cx="44" cy="9" r="0.65" opacity="0.12" />
      </g>

      <g clipPath="url(#pfClip)">
        {/* ===== 后发层（脸后面的发体：块面 + 内侧阴影 + 顺光光泽带） ===== */}
        {st.hairStyle === 'long' && (
          <g>
            <path d="M 12 26 Q 11 9 27 8.4 Q 43 9 42 26 L 43.5 50 Q 39 48 36.5 49 L 36.5 24 Q 36 14 27 13.2 Q 18 14 17.5 24 L 17.5 49 Q 15 48 10.5 50 Z" fill={st.hair} />
            {/* 内侧阴影（发缝里见不到光的那层） */}
            <path d="M 17.5 24 Q 17.5 40 17 49 L 15.5 49 Q 14 36 14.5 26 Z" fill="#000000" opacity="0.22" />
            <path d="M 36.5 24 Q 36.5 40 37 49 L 38.5 49 Q 40 36 39.5 26 Z" fill="#000000" opacity="0.22" />
            {/* 顺光光泽带（美颜自拍的发丝反光——平行两弧） */}
            <path d="M 14.5 17 Q 15 11 20 9.4" stroke="#ffffff" strokeWidth="1.6" opacity="0.16" fill="none" strokeLinecap="round" />
            <path d="M 18 16 Q 18.6 11.6 22.6 10.2" stroke="#ffffff" strokeWidth="1" opacity="0.1" fill="none" strokeLinecap="round" />
            <path d="M 39.5 17 Q 39 11 34 9.4" stroke="#ffffff" strokeWidth="1.6" opacity="0.16" fill="none" strokeLinecap="round" />
          </g>
        )}
        {st.hairStyle === 'twin' && (
          <g fill={st.hair}>
            <path d="M 14 27 Q 12.8 10.5 27 10 Q 41.2 10.5 40 27 L 40 34 L 36.5 34 L 36.5 22 Q 36 14.5 27 13.8 Q 18 14.5 17.5 22 L 17.5 34 L 14 34 Z" />
            {/* 双马尾（卷发梢 + 内侧阴影 + 光泽带） */}
            <path d="M 13.2 25.5 Q 7.8 32.5 9.4 41.5 Q 10.4 46.5 14.4 45 Q 12 37.5 13.8 29.5 Z" />
            <path d="M 40.8 25.5 Q 46.2 32.5 44.6 41.5 Q 43.6 46.5 39.6 45 Q 42 37.5 40.2 29.5 Z" />
            <path d="M 11.4 39.5 Q 12.2 42.4 14.4 43.8" stroke="#000000" strokeWidth="1.3" fill="none" opacity="0.2" strokeLinecap="round" />
            <path d="M 42.6 39.5 Q 41.8 42.4 39.6 43.8" stroke="#000000" strokeWidth="1.3" fill="none" opacity="0.2" strokeLinecap="round" />
          </g>
        )}
        {st.hairStyle === 'bun' && (
          <g fill={st.hair}>
            {/* 丸子（缠绕结构：主球 + 裹条） */}
            <circle cx="27" cy="8.4" r="5" />
            <path d="M 22.4 7 Q 27 10.6 31.6 7.4 Q 30.4 10.4 27 11.2 Q 23.8 10.4 22.4 7 Z" fill="#000000" opacity="0.18" />
            <path d="M 22.8 10.4 Q 27 13 31.2 10.4 L 31.2 12.8 Q 27 14.8 22.8 12.8 Z" />
            <path d="M 14.5 28 Q 13.6 11.5 27 11 Q 40.4 11.5 39.5 28 L 36.5 28 L 36.5 21.5 Q 36 14.8 27 14 Q 18 14.8 17.5 21.5 L 17.5 28 Z" />
            {/* 丸顶光泽 */}
            <path d="M 23.6 6.4 Q 26 5.2 28.8 6" stroke="#ffffff" strokeWidth="1" opacity="0.22" fill="none" strokeLinecap="round" />
          </g>
        )}
        {st.hairStyle === 'bob' && (
          <g fill={st.hair}>
            <path d="M 13.5 30 Q 12.2 10.5 27 10 Q 41.8 10.5 40.5 30 Q 40.4 35 37.6 35.4 L 36.8 31 Q 37.4 21.5 27 15.4 Q 16.6 21.5 17.2 31 L 16.4 35.4 Q 13.6 35 13.5 30 Z" />
            {/* 内扣发梢的阴影 */}
            <path d="M 16.4 31.4 Q 14.8 34.8 16.4 35.4 L 17.2 31.4 Z" fill="#000000" opacity="0.18" />
            <path d="M 37.6 31.4 Q 39.2 34.8 37.6 35.4 L 36.8 31.4 Z" fill="#000000" opacity="0.18" />
            {/* 光泽带 */}
            <path d="M 15.4 18 Q 16.4 12.4 21 10" stroke="#ffffff" strokeWidth="1.4" opacity="0.15" fill="none" strokeLinecap="round" />
            <path d="M 38.6 18 Q 37.6 12.4 33 10" stroke="#ffffff" strokeWidth="1.4" opacity="0.15" fill="none" strokeLinecap="round" />
          </g>
        )}

        {/* ===== 脖颈 + 肩（细脖 + 下颌投影 + 衣领） ===== */}
        <path d="M 23.9 35.4 L 30.1 35.4 L 29.8 42.8 L 24.2 42.8 Z" fill="#f2c6a2" />
        <path d="M 23.9 35.4 L 30.1 35.4 L 29.9 38.4 Q 27 40.4 24.1 38.4 Z" fill="#d8a67e" opacity="0.45" />
        {st.outfit === 'vneck' && (
          <g>
            <path d="M 9.5 54 Q 10.5 45.2 17.5 43 Q 20 42.2 22 42.2 L 27 48.6 L 32 42.2 Q 34 42.2 36.5 43 Q 43.5 45.2 44.5 54 Z" fill="#241822" />
            <path d="M 22 42.2 L 27 48.6 L 32 42.2" stroke={st.accent} strokeWidth="1.1" fill="none" opacity="0.85" />
            <path d="M 18 45.6 Q 19 47.6 18.4 49.4 M 36 45.6 Q 35 47.6 35.6 49.4" stroke="#000000" strokeWidth="0.6" fill="none" opacity="0.3" strokeLinecap="round" />
            <circle cx="27" cy="51.8" r="0.9" fill={st.accent} opacity="0.9" />
          </g>
        )}
        {st.outfit === 'collar' && (
          <g>
            <path d="M 9.5 54 Q 10.5 45.2 17.5 43 Q 22.5 41.4 27 41.4 Q 31.5 41.4 36.5 43 Q 43.5 45.2 44.5 54 Z" fill="#f4ede4" />
            <path d="M 20.6 42.2 L 24.4 46 L 27 43.4 L 29.6 46 L 33.4 42.2" stroke={st.accent} strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M 12 47.4 Q 13 49.2 12.4 50.8 M 42 47.4 Q 41 49.2 41.6 50.8" stroke="#d8ccb4" strokeWidth="0.6" fill="none" opacity="0.7" strokeLinecap="round" />
          </g>
        )}
        {st.outfit === 'sweater' && (
          <g>
            <path d="M 9.5 54 Q 10.3 44.8 17.5 42.8 Q 22.5 41.4 27 41.4 Q 31.5 41.4 36.5 42.8 Q 43.7 44.8 44.5 54 Z" fill={st.accent} />
            {/* 套头领口 + 织纹 */}
            <path d="M 21.8 42.4 Q 27 45.4 32.2 42.4 L 32.2 45.4 Q 27 48 21.8 45.4 Z" fill="#ffffff" opacity="0.22" />
            <path d="M 13 47.4 Q 14.4 49.2 13.6 51 M 41 47.4 Q 39.6 49.2 40.4 51 M 20 50.4 Q 21.4 52 20.8 53.6 M 34 50.4 Q 32.6 52 33.2 53.6" stroke="#000000" strokeWidth="0.5" fill="none" opacity="0.16" strokeLinecap="round" />
          </g>
        )}
        {st.outfit === 'hoodie' && (
          <g>
            <path d="M 9.5 54 Q 10.5 45.2 17.5 43 Q 20 42.2 22 42.2 L 27 47.4 L 32 42.2 Q 34 42.2 36.5 43 Q 43.5 45.2 44.5 54 Z" fill="#2a2430" />
            <path d="M 20.8 44.4 L 24.6 48.2 L 27 45.6 L 29.4 48.2 L 33.2 44.4" stroke={st.accent} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.85" />
            {/* 帽绳两根 */}
            <path d="M 23.4 46.4 Q 23.2 49.4 24 52" stroke="#d8ccb4" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M 30.6 46.4 Q 30.8 49.4 30 52" stroke="#d8ccb4" strokeWidth="1" fill="none" strokeLinecap="round" />
            <circle cx="24" cy="52.6" r="0.7" fill="#d8ccb4" />
            <circle cx="30" cy="52.6" r="0.7" fill="#d8ccb4" />
          </g>
        )}

        {/* ===== 脸基座：颅骨椭圆 + 下颌剪影拼合 ===== */}
        <ellipse cx="27" cy="26.8" rx="9" ry="10" fill="url(#pfFace)" />
        <path d={`M ${27 - jawW} 28.4 Q ${27 - jawW - 0.6} 35.8 27 ${chinY} Q ${27 + jawW + 0.6} 35.8 ${27 + jawW} 28.4 Z`} fill="#f2c6a2" />
        {/* 修容（美颜压平后的极淡阴影） */}
        <ellipse cx={27 - 7.6} cy="23.8" rx="1.5" ry="2.8" fill="#d8a67e" opacity="0.22" />
        <ellipse cx={27 + 7.6} cy="23.8" rx="1.5" ry="2.8" fill="#d8a67e" opacity="0.22" />
        <path d={`M ${27 - jawW + 0.6} 29.4 Q ${27 - jawW + 0.2} 35.4 27 ${chinY - 0.7}`} stroke="#d8a67e" strokeWidth="0.55" fill="none" opacity="0.4" />
        <path d={`M ${27 + jawW - 0.6} 29.4 Q ${27 + jawW - 0.2} 35.4 27 ${chinY - 0.7}`} stroke="#d8a67e" strokeWidth="0.55" fill="none" opacity="0.4" />
        {/* 高光：额带 / 颧骨顶 / 鼻梁 / 下巴尖 */}
        <ellipse cx="25.6" cy="20.4" rx="5.6" ry="3" fill="#ffead2" opacity="0.5" />
        <ellipse cx="21.4" cy="28.8" rx="2" ry="1.2" fill="#ffead2" opacity="0.4" />
        <ellipse cx="32.6" cy="28.8" rx="2" ry="1.2" fill="#ffead2" opacity="0.4" />
        <ellipse cx="27" cy={chinY - 1.4} rx="2" ry="1" fill="#ffead2" opacity="0.4" />

        {/* ===== 眉（主形一笔 + 上方淡晕一笔 = 雾眉；四档眉弓随眼型） ===== */}
        {(() => {
          // up 挑眉 / round 平直少女眉 / soft 弯眉 / calm 自然平眉
          // [起点x, y, 控制点x, qy, 终点x, y] —— 右眉按 54−x 镜像，y 不动。
          const brows: Record<EyeStyle, [number, number, number, number, number, number]> = {
            up: [21.2, 23.4, 23.4, 22.2, 25.4, 23.2],
            round: [21.4, 23.7, 23.4, 23.1, 25.4, 23.7],
            soft: [21.3, 23.8, 23.4, 22.6, 25.4, 23.4],
            calm: [21.4, 23.7, 23.4, 22.9, 25.3, 23.6],
          };
          const [x1, y1, qx, qy, x2, y2] = brows[st.eye];
          const brow = (mirrored: boolean) => {
            const mx = (x: number) => (mirrored ? 54 - x : x);
            return `M ${mx(x1)} ${y1} Q ${mx(qx)} ${qy} ${mx(x2)} ${y2}`;
          };
          return (
            <g>
              {/* 左眉：主形 + 上方淡晕（雾眉） */}
              <path d={brow(false)} stroke="#4a3626" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.88" />
              <path d={brow(false)} stroke="#4a3626" strokeWidth="1.7" fill="none" strokeLinecap="round" opacity="0.18" transform="translate(0 -0.35)" />
              {/* 右眉（镜像） */}
              <path d={brow(true)} stroke="#4a3626" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.88" />
              <path d={brow(true)} stroke="#4a3626" strokeWidth="1.7" fill="none" strokeLinecap="round" opacity="0.18" transform="translate(0 -0.35)" />
            </g>
          );
        })()}

        {/* ===== 眼（四型结构化重建：共用底件 + 各自变体） ===== */}
        {(() => {
          // 共用参数：各型虹膜半径 / 眼白高
          const R: Record<EyeStyle, { ir: number; wr: number; wry: number; eyeCx: number }> = {
            up: { ir: 1.45, wr: 2.35, wry: 1.35, eyeCx: 0.2 },
            round: { ir: 1.95, wr: 2.5, wry: 3.1, eyeCx: 0 },
            soft: { ir: 1.6, wr: 2.15, wry: 2.45, eyeCx: 0 },
            calm: { ir: 1.7, wr: 2.25, wry: 2.55, eyeCx: 0 },
          };
          const r = R[st.eye];
          const cy = 27.5;
          const eyes = [23.2 - r.eyeCx, 30.8 + r.eyeCx];
          return (
            <g>
              {eyes.map((cx, i) => {
                const flip = i === 0 ? -1 : 1;
                return (
                  <g key={cx}>
                    {/* 眼白（微蓝灰底——比纯白柔） */}
                    <ellipse cx={cx} cy={cy} rx={r.wr} ry={r.wry} fill="#f6f2ea" />
                    {/* 虹膜（渐变 + 虹膜缘环） */}
                    <circle cx={cx} cy={cy + 0.2} r={r.ir} fill="url(#pfIris)" />
                    <circle cx={cx} cy={cy + 0.2} r={r.ir} fill="none" stroke="#5a4028" strokeWidth="0.35" opacity="0.5" />
                    {/* 瞳孔 */}
                    <circle cx={cx} cy={cy + 0.2} r={r.ir * 0.46} fill="#1c1410" />
                    {/* 双高光：主（左上大）+ 次（右下小） */}
                    <circle cx={cx + flip * 0.7} cy={cy - 0.7} r={r.ir * 0.42} fill="#ffffff" opacity={st.eye === 'round' ? 0.98 : 0.92} />
                    <circle cx={cx - flip * 0.6} cy={cy + 1.1} r={r.ir * 0.2} fill="#ffffff" opacity="0.6" />
                    {/* 上睫线（自然弧，外眼角不上挑） */}
                    <path d={lashPath(cx, flip)} stroke="#241a12" strokeWidth={st.eye === 'up' ? 1.65 : 1.45} fill="none" strokeLinecap="round" />
                    {/* 双眼皮褶线 */}
                    <path d={`M ${cx - flip * 2.4} ${cy - r.wry - 0.7} Q ${cx} ${cy - r.wry - 1.3} ${cx + flip * 2.6} ${cy - r.wry - 0.6}`} stroke="#c89878" strokeWidth="0.5" fill="none" opacity="0.65" />
                    {/* 下睫 2 根（外眼角侧） */}
                    <path d={`M ${cx + flip * 2} ${cy + r.wry - 0.4} L ${cx + flip * 2.7} ${cy + r.wry + 0.1}`} stroke="#241a12" strokeWidth="0.45" strokeLinecap="round" />
                    <path d={`M ${cx + flip * 1} ${cy + r.wry} L ${cx + flip * 1.5} ${cy + r.wry + 0.5}`} stroke="#241a12" strokeWidth="0.4" strokeLinecap="round" opacity="0.7" />
                    {/* 卧蚕（美颜自拍的标志结构） */}
                    <path d={`M ${cx - flip * 2.1} ${cy + r.wry + 0.9} Q ${cx} ${cy + r.wry + 1.7} ${cx + flip * 2.1} ${cy + r.wry + 0.9}`} stroke="#ffead2" strokeWidth="0.75" fill="none" strokeLinecap="round" opacity="0.75" />
                  </g>
                );
              })}
              {/* soft 型：半垂上睑（温柔感） */}
              {st.eye === 'soft' && (
                <g>
                  <path d={`M 21.2 26.4 Q 23.2 25.8 25.2 26.5`} stroke="#e8c8a8" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                  <path d={`M 28.8 26.5 Q 30.8 25.8 32.8 26.4`} stroke="#e8c8a8" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                </g>
              )}
              {/* round 型：眼下内眼角淡晕 */}
              {st.eye === 'round' && (
                <g>
                  <path d="M 21.6 30.1 Q 23.2 30.7 24.9 30.1" stroke="#c89878" strokeWidth="0.5" fill="none" opacity="0.6" />
                  <path d="M 29.1 30.1 Q 30.8 30.7 32.4 30.1" stroke="#c89878" strokeWidth="0.5" fill="none" opacity="0.6" />
                </g>
              )}
            </g>
          );
        })()}

        {/* ===== 鼻（女性化极简：高光竖线 + 鼻头小阴影） ===== */}
        <path d="M 27.2 29.2 Q 27 30.4 26.9 31.1" stroke="#ffd9b8" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.85" />
        <ellipse cx="26.2" cy="31.4" rx="0.5" ry="0.4" fill="#d8a67e" opacity="0.5" />
        <ellipse cx="27.9" cy="31.4" rx="0.5" ry="0.4" fill="#d8a67e" opacity="0.5" />

        {/* ===== 唇（四型渐变咬唇妆：外圈主色 + 中央高光点） ===== */}
        {st.eye === 'up' && (
          <g>
            <path d="M 24 33.9 Q 25.3 33.1 27 33.8 Q 28.7 33.1 30 33.9 Q 29 35.6 27 35.7 Q 25 35.6 24 33.9 Z" fill={st.lip} />
            <path d="M 25.1 34.6 Q 27 35.9 28.9 34.6 Q 27 35.4 25.1 34.6 Z" fill="#000000" opacity="0.22" />
            <path d="M 25.2 34 Q 27 33.5 28.8 34" stroke="#ffffff" strokeWidth="0.4" opacity="0.55" fill="none" />
          </g>
        )}
        {st.eye === 'round' && (
          <g>
            <path d="M 24.2 33.6 Q 27 37.1 29.8 33.6 Q 27 34.9 24.2 33.6 Z" fill={st.lip} />
            <path d="M 24.2 33.6 Q 27 32.7 29.8 33.6" stroke={st.lip} strokeWidth="0.95" fill="none" strokeLinecap="round" />
            <ellipse cx="27" cy="34.5" rx="1.1" ry="0.55" fill="#ffffff" opacity="0.55" />
            <path d="M 25.6 33.9 Q 27 34.6 28.4 33.9" stroke="#ffffff" strokeWidth="0.5" opacity="0.45" fill="none" />
          </g>
        )}
        {st.eye === 'soft' && (
          <g>
            <path d="M 24.5 33.9 Q 27 35.5 29.5 33.9" stroke={st.lip} strokeWidth="1.35" fill="none" strokeLinecap="round" />
            <path d="M 25.4 34.1 Q 27 35.2 28.6 34.1" stroke={st.lip} strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.5" />
          </g>
        )}
        {st.eye === 'calm' && (
          <g>
            <path d="M 24.9 34 Q 27 34.9 29.1 34" stroke={st.lip} strokeWidth="1.15" fill="none" strokeLinecap="round" />
            <path d="M 25.8 34.2 Q 27 34.8 28.2 34.2" stroke="#ffffff" strokeWidth="0.35" opacity="0.4" fill="none" />
          </g>
        )}

        {/* ===== 腮红（磨皮后晕开的软晕——比旧版大一圈、淡一档） ===== */}
        <ellipse cx="20.6" cy="31.2" rx="2.6" ry="1.55" fill="#f0a08c" opacity={st.eye === 'round' ? 0.38 : 0.24} />
        <ellipse cx="33.4" cy="31.2" rx="2.6" ry="1.55" fill="#f0a08c" opacity={st.eye === 'round' ? 0.38 : 0.24} />

        {/* ===== 前发层（刘海 + 发际线 + 鬓角碎发 + 光泽带三段式） ===== */}
        {st.hairStyle === 'long' && (
          <g fill={st.hair}>
            <path d="M 17.5 26 Q 16.8 11.8 27 11.2 Q 37.2 11.8 36.5 26 L 34.4 22.4 Q 34 15.4 27 14.4 Q 21.4 15 20.3 19.6 Q 19.5 22.6 19.5 26 Z" />
            {/* 发际线（头皮缘——比肤色深一档的弧） */}
            <path d="M 20.3 19.6 Q 27 14 34.4 22.4" stroke="#d8a67e" strokeWidth="0.55" fill="none" opacity="0.55" />
            <path d="M 20.4 19.4 Q 22.4 15.6 27 15 Q 24 16.2 22.8 19.7 Q 22 22.2 22 25.4 L 20.6 25.8 Z" opacity="0.85" />
            <path d="M 33.6 19.4 Q 31.6 15.6 27 15 Q 30 16.2 31.2 19.7 Q 32 22.2 32 25.4 L 33.4 25.8 Z" opacity="0.85" />
            {/* 鬓角碎发 */}
            <path d="M 18.2 20.5 Q 17.2 23.6 17.6 26.6" stroke={st.hair} strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.8" />
            <path d="M 35.8 20.5 Q 36.8 23.6 36.4 26.6" stroke={st.hair} strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.8" />
            {/* 光泽带（三段式） */}
            <path d="M 19.8 15.2 Q 27 11.4 34.4 15.2" stroke="#ffffff" strokeWidth="1.1" opacity="0.18" fill="none" />
            <path d="M 21.4 14.2 Q 27 11 32.6 14.2" stroke="#ffffff" strokeWidth="0.7" opacity="0.1" fill="none" />
          </g>
        )}
        {st.hairStyle === 'twin' && (
          <g fill={st.hair}>
            <path d="M 17.5 24.5 Q 16.9 11.4 27 10.9 Q 37.1 11.4 36.5 24.5 L 34.2 21.7 Q 33.8 15.2 27 14.3 Q 20.2 15.2 19.8 21.7 Z" />
            {/* 空气刘海中分线 */}
            <path d="M 27 14.2 Q 24.6 15.9 23.6 19.4" stroke={st.bg} strokeWidth="0.5" fill="none" opacity="0.4" />
            {/* 发际线 */}
            <path d="M 19.8 21.7 Q 27 14.2 34.2 21.7" stroke="#d8a67e" strokeWidth="0.5" fill="none" opacity="0.5" />
            {/* 鬓角碎发 */}
            <path d="M 18 20 Q 17.2 22.8 17.6 25.6" stroke={st.hair} strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.8" />
            <path d="M 36 20 Q 36.8 22.8 36.4 25.6" stroke={st.hair} strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.8" />
            {/* 发绳（accent） */}
            <circle cx="13.6" cy="27" r="1.5" fill={st.accent} />
            <circle cx="40.4" cy="27" r="1.5" fill={st.accent} />
            <circle cx="13.2" cy="26.5" r="0.5" fill="#ffffff" opacity="0.55" />
            <circle cx="40" cy="26.5" r="0.5" fill="#ffffff" opacity="0.55" />
            <path d="M 19.4 14.4 Q 27 11 34.6 14.4" stroke="#ffffff" strokeWidth="1.1" opacity="0.18" fill="none" />
          </g>
        )}
        {st.hairStyle === 'bun' && (
          <g fill={st.hair}>
            <path d="M 17.5 26.5 Q 16.8 11.4 27 10.9 Q 37.2 11.4 36.5 26.5 L 34.4 23.3 Q 34 15.6 27 14.7 Q 20 15.6 19.6 23.3 Z" />
            {/* 发际线 */}
            <path d="M 19.6 23.3 Q 27 14.7 34.4 23.3" stroke="#d8a67e" strokeWidth="0.5" fill="none" opacity="0.5" />
            {/* 碎发两根（额前垂落——丸子头总有一两根不服帖） */}
            <path d="M 18.6 15.4 Q 17.4 18.6 17.8 21.8" stroke={st.hair} strokeWidth="0.7" fill="none" strokeLinecap="round" />
            <path d="M 35.4 15.4 Q 36.6 18.6 36.2 21.8" stroke={st.hair} strokeWidth="0.7" fill="none" strokeLinecap="round" />
            <path d="M 24.4 9.4 Q 26.4 7.8 28.8 8.6" stroke="#ffffff" strokeWidth="0.9" opacity="0.25" fill="none" strokeLinecap="round" />
            <path d="M 20 14.4 Q 27 11 34 14.4" stroke="#ffffff" strokeWidth="1" opacity="0.16" fill="none" />
          </g>
        )}
        {st.hairStyle === 'bob' && (
          <g fill={st.hair}>
            <path d="M 17 28.5 Q 15.9 11.3 27 10.8 Q 38.1 11.3 37 28.5 L 34.8 25.3 Q 34.6 16 27 14.6 Q 19.4 16 19.2 25.3 Z" />
            <path d="M 19.2 25.3 Q 18.6 28.6 19.4 31.4 L 21 30.2 Q 20.4 27.4 20.8 24.6 Z" />
            <path d="M 34.8 25.3 Q 35.4 28.6 34.6 31.4 L 33 30.2 Q 33.6 27.4 33.2 24.6 Z" />
            {/* 发际线 */}
            <path d="M 19.2 25.3 Q 27 14.6 34.8 25.3" stroke="#d8a67e" strokeWidth="0.5" fill="none" opacity="0.5" />
            {/* 鬓角碎发 */}
            <path d="M 18.4 21.6 Q 17.6 24.4 18 27.2" stroke={st.hair} strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.8" />
            <path d="M 35.6 21.6 Q 36.4 24.4 36 27.2" stroke={st.hair} strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.8" />
            <path d="M 19.8 14.4 Q 27 11 34.2 14.4" stroke="#ffffff" strokeWidth="1" opacity="0.17" fill="none" />
          </g>
        )}

        {/* ===== 配饰（材质细节版） ===== */}
        {/* 耳坠（水滴 + 闪点） */}
        <ellipse cx="18.6" cy="30.2" rx="1.6" ry="2.7" fill="#f4cba4" />
        <ellipse cx="35.4" cy="30.2" rx="1.6" ry="2.7" fill="#f4cba4" />
        {st.extra === 'earring' && (
          <g>
            <line x1="18.6" y1="32.4" x2="18.6" y2="33.6" stroke={st.accent} strokeWidth="0.7" />
            <path d="M 17.6 33.6 Q 18.6 36.4 19.6 33.6 Q 18.6 32.9 17.6 33.6 Z" fill={st.accent} />
            <circle cx="18.2" cy="34" r="0.45" fill="#ffd9d0" opacity="0.95" />
            <line x1="35.4" y1="32.4" x2="35.4" y2="33.6" stroke={st.accent} strokeWidth="0.7" />
            <path d="M 34.4 33.6 Q 35.4 36.4 36.4 33.6 Q 35.4 32.9 34.4 33.6 Z" fill={st.accent} />
            <circle cx="35" cy="34" r="0.45" fill="#ffd9d0" opacity="0.95" />
          </g>
        )}
        {/* 贝雷帽（针织纹理 + 绒球 + 帽沿投影） */}
        {st.extra === 'beret' && (
          <g transform="rotate(-9 30 12)">
            <path d="M 19.5 13.4 Q 20.5 5.6 30.5 5.4 Q 39.5 5.6 39.5 12 Q 34 9.6 27 10.2 Q 22 10.7 19.5 13.4 Z" fill={st.accent} />
            {/* 帽沿投影（帽压在头发上的那条影） */}
            <path d="M 20.2 13.6 Q 27 10.8 39.3 12.4 L 39 14.2 Q 30 11.9 20.4 14.8 Z" fill="#000000" opacity="0.25" />
            {/* 针织纹理 */}
            <path d="M 23 8.4 Q 28 6.6 33.8 8" stroke="#000000" strokeWidth="0.5" fill="none" opacity="0.18" />
            <path d="M 22 10.4 Q 28 8.6 34.6 10" stroke="#000000" strokeWidth="0.5" fill="none" opacity="0.14" />
            <circle cx="30.2" cy="6.2" r="1.15" fill={st.hair} />
            <circle cx="30" cy="6" r="0.35" fill="#ffffff" opacity="0.55" />
            <path d="M 24 7.2 Q 28 5.4 33.6 6.7" stroke="#ffffff" strokeWidth="0.8" opacity="0.24" fill="none" />
          </g>
        )}
        {/* 樱花发卡（五瓣 + 花心 + 一叶） */}
        {st.extra === 'flower' && (
          <g transform="rotate(8 35 16)">
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="35" cy="14.2" rx="1.15" ry="1.7" fill="#f6b8c8"
                transform={`rotate(${a} 35 16)`} />
            ))}
            <circle cx="35" cy="16" r="0.85" fill="#f4d03f" />
            <circle cx="34.7" cy="15.7" r="0.28" fill="#ffffff" opacity="0.8" />
            {/* 一片小叶 */}
            <path d="M 37 18.6 Q 38.8 19.6 38.2 21.4 Q 36.6 20.6 37 18.6 Z" fill="#8ab87a" opacity="0.85" />
          </g>
        )}

        {/* ===== 照片后期层：bloom + 感光颗粒 + 暗角 ===== */}
        <circle cx="20" cy="20" r="16" fill="#ffffff" opacity="0.045" />
        <g fill="#ffffff">
          <circle cx="22" cy="33" r="0.5" opacity="0.12" />
          <circle cx="42" cy="12" r="0.45" opacity="0.1" />
          <circle cx="14" cy="44" r="0.5" opacity="0.09" />
          <circle cx="36" cy="41" r="0.45" opacity="0.08" />
          <circle cx="45" cy="20" r="0.4" opacity="0.07" />
          <circle cx="10" cy="24" r="0.4" opacity="0.08" />
        </g>
        <rect width="54" height="54" fill="url(#pfVig)" />
      </g>
      <clipPath id="pfClip">
        <circle cx="27" cy="27" r="26" />
      </clipPath>
      <circle cx="27" cy="27" r="26" fill="none" stroke="#00000055" strokeWidth="1.4" />
      <circle cx="27" cy="27" r="26" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.1" />
    </svg>
  );
}
