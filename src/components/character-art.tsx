/**
 * Programmatic SVG portraits (GL2 character-art pattern, zero image assets).
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

export function OldManAvatar({ target, state, size = 44 }: { target: Target; state?: TargetState; size?: number }) {
  const spec = target.portraitSpec;
  const wary = (state?.wariness ?? 10) >= 45;
  const smiling = (state?.trust ?? 0) >= 60;
  const blocked = state?.blocked ?? false;
  // 三档表情：警惕眯眼审视 / 常态 / 高信任含笑（眼弯 + 苹果肌抬）。
  const eyeH = wary ? 0.9 : smiling ? 1.7 : 2.1;
  const eyeRx = wary ? 2.1 : 1.9;
  const rx = 11 + spec.cheeks * 4.5;          // 脸宽
  const ry = 12.5 + spec.cheeks * 2.5;         // 脸长
  const hairlineY = spec.hair === 2 ? 13 : 9; // 发际线档位
  const mouth = smiling
    ? 'M 22.5 32.4 Q 27 35.6 31.5 32.4'
    : wary
      ? 'M 23.5 33.4 L 30.5 33.2'
      : 'M 23 32.3 Q 27 34.2 31 32.3';
  const browY = wary ? 22 : 20.6;
  const browTilt = wary ? 2 : 0.8;
  const uid = `av-${target.id}`;
  return (
    <svg width={size} height={size} viewBox="0 0 54 54" role="img" aria-label={target.name}
      style={blocked ? { filter: 'grayscale(1) opacity(0.4)' } : undefined}
    >
      <Defs />
      {/* v2.2 三层（v2.4 精修）：背景场景 → 人脸 → 配饰，最后圆形裁切 + 暗角。 */}
      <g clipPath={`url(#clip-${uid})`}>
        <BgLayer scene={spec.bgScene ?? 'default'} accent={spec.accent ?? spec.shirtColor} />
        {/* ---- 人脸 ---- */}
        {/* 后脑（发色延伸到脸缘，剪影不悬浮） */}
        <ellipse cx="27" cy="27" rx={rx + 1.5} ry={ry + 1.5} fill={spec.hairColor} opacity="0.55" />
        {/* 颈部 + 衣领肩线 */}
        <rect x="23" y="38" width="8" height="10" fill="#caa27c" />
        <path d={`M 14 46 Q 27 37.5 40 46 L 40 54 L 14 54 Z`} fill={spec.shirtColor} />
        <path d="M 23.5 44 L 27 48 L 30.5 44 L 29 43 L 27 45.4 L 25 43 Z" fill="#00000030" />
        <rect x="14" y="46.4" width="26" height="0.8" fill="#ffffff" opacity="0.06" />
        {/* 耳朵（老男人的大耳垂） */}
        <ellipse cx={27 - rx - 0.4} cy="28.5" rx="2" ry="3.4" fill="#d9a678" />
        <ellipse cx={27 + rx + 0.4} cy="28.5" rx="2" ry="3.4" fill="#d9a678" />
        <path d={`M ${27 - rx + 0.4} 27.5 q 0.8 0.8 0 2.2`} stroke="#b98c62" strokeWidth="0.6" fill="none" />
        <path d={`M ${27 + rx - 0.4} 27.5 q -0.8 0.8 0 2.2`} stroke="#b98c62" strokeWidth="0.6" fill="none" />
        {/* 脸（皮肤渐变 + 顶光） */}
        <ellipse cx="27" cy="27.5" rx={rx} ry={ry} fill="url(#omFace)" />
        <ellipse cx="24" cy="23" rx={rx * 0.6} ry={ry * 0.42} fill="#f6d4ac" opacity="0.35" />
        {/* 发际线（档位2=地中海，露顶光） */}
        <path
          d={`M ${27 - rx + 1.5} ${hairlineY + 3} Q 27 ${hairlineY - 6} ${27 + rx - 1.5} ${hairlineY + 3}
              L ${27 + rx - 1.5} 15.5 Q 27 7.5 ${27 - rx + 1.5} 15.5 Z`}
          fill={spec.hairColor}
        />
        {/* 发高光 */}
        <path d={`M 19.5 ${hairlineY - 1} Q 27 ${hairlineY - 4.5} 34.5 ${hairlineY - 1}`} stroke="#ffffff" strokeWidth="1.2" opacity="0.14" fill="none" />
        {/* 两鬓霜色（年纪感） */}
        <path d={`M ${27 - rx + 1} ${hairlineY + 3} L ${27 - rx + 2.6} 22 L ${27 - rx + 3.6} ${hairlineY + 5} Z`} fill="#cfd4d9" opacity="0.5" />
        <path d={`M ${27 + rx - 1} ${hairlineY + 3} L ${27 + rx - 2.6} 22 L ${27 + rx - 3.6} ${hairlineY + 5} Z`} fill="#cfd4d9" opacity="0.5" />
        {spec.hair === 2 && (
          <>
            <ellipse cx="27" cy={hairlineY + 2.5} rx="5.5" ry="2" fill="#f0c49a" opacity="0.55" />
            <path d={`M 23 ${hairlineY + 2} Q 27 ${hairlineY + 4.5} 31 ${hairlineY + 2}`} stroke="#e0b48c" strokeWidth="0.6" fill="none" opacity="0.7" />
          </>
        )}
        {/* 眉（警惕压低内挑，含笑舒展） */}
        <path d={`M 20.4 ${browY - 0.2} Q 22.2 ${browY - browTilt - 0.8} 24.2 ${browY - 0.4}`} stroke="#3a342c" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d={`M 29.8 ${browY - 0.4} Q 31.8 ${browY - browTilt - 0.8} 33.6 ${browY - 0.2}`} stroke="#3a342c" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {/* 眼（形态 + 高光 + 下睑） */}
        <ellipse cx="22.2" cy="24" rx={eyeRx} ry={eyeH} fill="#26221c" />
        <ellipse cx="31.8" cy="24" rx={eyeRx} ry={eyeH} fill="#26221c" />
        <circle cx="22.9" cy={23.4} r="0.5" fill="#e8e4d0" opacity="0.9" />
        <circle cx="32.5" cy={23.4} r="0.5" fill="#e8e4d0" opacity="0.9" />
        {wary && <path d="M 20.2 22.4 Q 22.2 21.4 24.2 22.5" stroke="#caa27c" strokeWidth="0.55" fill="none" opacity="0.8" />}
        {wary && <path d="M 29.8 22.5 Q 31.8 21.4 33.8 22.4" stroke="#caa27c" strokeWidth="0.55" fill="none" opacity="0.8" />}
        {/* 眼袋（岁月） */}
        <path d="M 20.5 26.4 Q 22.2 27.3 24 26.5" stroke="#b98c62" strokeWidth="0.5" fill="none" opacity="0.55" />
        <path d="M 30 26.5 Q 31.8 27.3 33.5 26.4" stroke="#b98c62" strokeWidth="0.5" fill="none" opacity="0.55" />
        {/* 鼻（鼻梁 + 鼻头 + 鼻翼） */}
        <path d="M 27.4 24.5 Q 26.4 27.6 26.1 29" stroke="#c49a6c" strokeWidth="1" fill="none" strokeLinecap="round" />
        <ellipse cx="26.1" cy="29.4" rx="1.5" ry="1" fill="#d9a678" />
        <path d="M 24.6 30 Q 25.2 30.7 26 30.4 M 29.4 30 Q 28.8 30.7 28 30.4" stroke="#b98c62" strokeWidth="0.55" fill="none" />
        {/* 法令纹（年纪） */}
        <path d="M 23.6 29.8 Q 22.9 31.8 23 33.4" stroke="#c49a6c" strokeWidth="0.5" fill="none" opacity="0.45" />
        <path d="M 30.4 29.8 Q 31.1 31.8 31 33.4" stroke="#c49a6c" strokeWidth="0.5" fill="none" opacity="0.45" />
        {/* 嘴（含笑带嘴角窝） */}
        <path d={mouth} fill="none" stroke="#8a5a44" strokeWidth="1.4" strokeLinecap="round" />
        {smiling && (
          <>
            <circle cx="22" cy="32.6" r="0.55" fill="#c49a6c" opacity="0.6" />
            <circle cx="32" cy="32.6" r="0.55" fill="#c49a6c" opacity="0.6" />
          </>
        )}
        {wary && <path d="M 24.6 34.8 Q 27 35.4 29.4 34.8" stroke="#8a5a44" strokeWidth="0.8" fill="none" opacity="0.35" />}
        {/* 胡茬（色块→渐淡点阵） */}
        {spec.beard > 0 && (
          <g fill="#3a2c1e" opacity="0.28">
            <ellipse cx="27" cy="34.6" rx="7.4" ry="4.6" />
            <ellipse cx="21.5" cy="33.4" rx="1.8" ry="2.6" opacity="0.6" />
            <ellipse cx="32.5" cy="33.4" rx="1.8" ry="2.6" opacity="0.6" />
            <ellipse cx="27" cy="37.6" rx="3.4" ry="1.6" opacity="0.7" />
            <ellipse cx="24" cy="36.2" rx="1" ry="1.6" opacity="0.5" />
            <ellipse cx="30" cy="36.2" rx="1" ry="1.6" opacity="0.5" />
          </g>
        )}
        {/* 颧骨高光 + 太阳穴阴影 */}
        <ellipse cx="21.5" cy="29.5" rx="2.4" ry="1.4" fill="#f0c49a" opacity="0.3" />
        <ellipse cx="32.5" cy="29.5" rx="2.4" ry="1.4" fill="#f0c49a" opacity="0.3" />
        <ellipse cx="19.5" cy="24.5" rx="1.6" ry="2.4" fill="#b98c62" opacity="0.22" />
        <ellipse cx="34.5" cy="24.5" rx="1.6" ry="2.4" fill="#b98c62" opacity="0.22" />
        {/* 眼镜（金属细框 + 镜片反光 + 鼻托） */}
        {spec.glasses > 0 && (
          <g>
            <rect x="18.2" y="21.2" width="8" height="6" rx="2.4" fill="url(#omGlass)" stroke="#7a828c" strokeWidth="0.9" />
            <rect x="27.8" y="21.2" width="8" height="6" rx="2.4" fill="url(#omGlass)" stroke="#7a828c" strokeWidth="0.9" />
            <path d="M 26.2 23.6 Q 27 23.2 27.8 23.6" stroke="#7a828c" strokeWidth="0.8" fill="none" />
            <path d="M 18.2 22.4 L 21 22.9" stroke="#ffffff" strokeWidth="0.5" opacity="0.55" />
            <path d="M 27.8 22.4 L 30.6 22.9" stroke="#ffffff" strokeWidth="0.5" opacity="0.55" />
            <circle cx="26.6" cy="24.9" r="0.4" fill="#5a5f66" />
            <circle cx="27.4" cy="24.9" r="0.4" fill="#5a5f66" />
          </g>
        )}
        {/* ---- 配饰层 ---- */}
        <AccessoryLayer accessory={spec.accessory ?? 'none'} />
        {/* 暗角收光 */}
        <rect width="54" height="54" fill="url(#omVig)" />
      </g>
      {/* 圆形裁切描边 */}
      <clipPath id={`clip-${uid}`}>
        <circle cx="27" cy="27" r="26" />
      </clipPath>
      <circle cx="27" cy="27" r="26" fill="none" stroke="#00000055" strokeWidth="1.4" />
      <circle cx="27" cy="27" r="26" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.08" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// v2.2：照片立绘渲染器——比头像更大（200×150），场景更丰富
// v2.4 美化重绘：统一暗角 + 光源方向 + 材质细节（金属/水波/烟雾/木纹），
//               保留每张原有的构图与叙事（谁的世界、哪个时辰）。
// ---------------------------------------------------------------------------
export function PhotoRender({ photoId }: { photoId: string }) {
  const scenes = PHOTO_SCENES[photoId];
  if (!scenes) return null;
  return (
    <svg width="200" height="150" viewBox="0 0 200 150" role="img" aria-label="照片">
      <defs>
        <radialGradient id="phVig" cx="50%" cy="44%" r="75%">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="78%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.38" />
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
// v2.4 美化重绘：统一暗角 + 手机摄影质感（大光圈虚化、点光、暖色氛围）。
// ---------------------------------------------------------------------------
export function MomentPhoto({ selfieId }: { selfieId: string }) {
  const scene = SELFIE_SCENES[selfieId];
  if (!scene) return null;
  return (
    <svg width="200" height="150" viewBox="0 0 200 150" role="img" aria-label="朋友圈自拍">
      <defs>
        <radialGradient id="sfVig" cx="50%" cy="44%" r="75%">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="80%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.3" />
        </radialGradient>
      </defs>
      {scene}
      <rect width="200" height="150" fill="url(#sfVig)" />
    </svg>
  );
}

/** 自拍场景库——按 SelfieId 索引（200×150，与照片系统同规格，v2.4 精修）。 */
const SELFIE_SCENES: Record<string, ReactElement> = {
  // 蛋糕照：甜品店暖光 + 一块奶油蛋糕
  cake: (
    <>
      <rect width="200" height="150" fill="#2a1a14" />
      <rect x="0" y="104" width="200" height="46" fill="#3a2a1e" />
      {/* 店内暖光（吊灯串） */}
      <g>
        <circle cx="34" cy="16" r="2.6" fill="#f4d03f" opacity="0.85" />
        <circle cx="34" cy="16" r="8" fill="#f4d03f" opacity="0.14" />
        <circle cx="170" cy="20" r="2.2" fill="#f4d03f" opacity="0.7" />
        <circle cx="170" cy="20" r="7" fill="#f4d03f" opacity="0.12" />
      </g>
      {/* 背景虚化的蛋糕柜 */}
      <g opacity="0.28" fill="#1c1210">
        <rect x="128" y="34" width="66" height="52" rx="3" />
        <rect x="136" y="40" width="50" height="42" fill="#241a16" opacity="0.6" />
      </g>
      {/* 桌面（木纹） */}
      <path d="M 0 150 L 0 96 L 200 92 L 200 150 Z" fill="#33241a" />
      <g stroke="#1c120c" strokeWidth="0.8" opacity="0.4">
        <path d="M 0 108 Q 100 104 200 106" fill="none" />
        <path d="M 0 122 Q 100 118 200 120" fill="none" />
      </g>
      {/* 蛋糕三层（侧面拉丝 + 顶层奶油裱花） */}
      <rect x="64" y="72" width="68" height="13" fill="#5a3a24" />
      <rect x="64" y="72" width="68" height="3" fill="#6e4a2e" />
      <rect x="64" y="85" width="68" height="13" fill="#7a5a3a" />
      <rect x="64" y="85" width="68" height="3" fill="#8e6a44" />
      <rect x="64" y="98" width="68" height="13" fill="#5a3a24" />
      {/* 夹心奶油线 */}
      <line x1="66" y1="84" x2="130" y2="84" stroke="#efe8e0" strokeWidth="1.8" opacity="0.75" />
      <line x1="66" y1="97" x2="130" y2="97" stroke="#efe8e0" strokeWidth="1.8" opacity="0.75" />
      {/* 奶油顶（裱花边） */}
      <ellipse cx="98" cy="71" rx="35" ry="8" fill="#f4ede4" />
      <g fill="#f4ede4">
        {[68, 83, 98, 113, 128].map((x) => <circle key={x} cx={x} cy="69" r="4.4" />)}
      </g>
      <circle cx="98" cy="63" r="5.4" fill="#f4ede4" />
      <circle cx="95.4" cy="61" r="1.8" fill="#fff" opacity="0.7" />
      {/* 草莓（蒂叶） */}
      <path d="M 93 56 L 98 47 L 103 56 Q 98 52 93 56 Z" fill="#c0392b" />
      <path d="M 93 56 Q 98 59 103 56" stroke="#4a7a3a" strokeWidth="1.6" fill="none" />
      <circle cx="96" cy="51" r="0.5" fill="#e8b8a8" opacity="0.9" />
      <circle cx="100" cy="53" r="0.5" fill="#e8b8a8" opacity="0.9" />
      {/* 一根蜡烛（没点——自己买的） */}
      <rect x="96.5" y="38" width="3" height="12" rx="1.4" fill="#d4553f" />
      <line x1="98" y1="34" x2="98" y2="38" stroke="#5a5f66" strokeWidth="1" />
      <circle cx="98" cy="33" r="1.6" fill="#f4a03f" opacity="0.85" />
      <circle cx="98" cy="33" r="4.4" fill="#f4a03f" opacity="0.2" />
      {/* 叉子（金属反光） */}
      <g transform="rotate(16 152 90)">
        <rect x="150" y="74" width="3.4" height="30" rx="1.6" fill="url(#phMetal)" />
        {[148, 152, 156].map((x) => <rect key={x} x={x - 0.8} y="68" width="1.6" height="8" rx="0.8" fill="url(#phMetal)" />)}
        <rect x="148" y="74" width="10" height="2.2" fill="url(#phMetal)" />
      </g>
    </>
  ),
  // 夜跑照：深蓝操场 + 路灯 + 手环荧光
  gym: (
    <>
      <rect width="200" height="150" fill="#0a1020" />
      {/* 夜空（星点 + 月） */}
      <g fill="#e8e4d0">
        <circle cx="22" cy="14" r="0.8" opacity="0.6" />
        <circle cx="58" cy="10" r="0.6" opacity="0.4" />
        <circle cx="78" cy="20" r="0.7" opacity="0.5" />
        <circle cx="170" cy="12" r="0.6" opacity="0.4" />
      </g>
      <path d="M 38 18 A 13 13 0 1 0 51 32 A 10 10 0 1 1 38 18 Z" fill="#e8e4d0" opacity="0.85" />
      <circle cx="51" cy="32" r="24" fill="#e8e4d0" opacity="0.05" />
      {/* 远处居民楼（几户灯亮着） */}
      <g opacity="0.55">
        <rect x="0" y="34" width="36" height="44" fill="#131c2c" />
        <rect x="44" y="38" width="30" height="40" fill="#101a28" />
        <rect x="4" y="40" width="5" height="4" fill="#f4d03f" opacity="0.8" />
        <rect x="14" y="46" width="5" height="4" fill="#5b8db8" opacity="0.6" />
        <rect x="24" y="40" width="5" height="4" fill="#f4d03f" opacity="0.5" />
        <rect x="50" y="44" width="5" height="4" fill="#f4d03f" opacity="0.65" />
        <rect x="58" y="52" width="5" height="4" fill="#f4d03f" opacity="0.35" />
      </g>
      {/* 操场跑道 */}
      <path d="M 0 150 L 0 96 L 200 92 L 200 150 Z" fill="#1a2233" />
      <g stroke="#3a4a5a" fill="none">
        <line x1="0" y1="108" x2="200" y2="106" strokeWidth="2.4" strokeDasharray="16 12" />
        <line x1="0" y1="128" x2="200" y2="127" strokeWidth="1.6" strokeDasharray="10 9" opacity="0.6" />
      </g>
      {/* 路灯（锥光） */}
      <rect x="152" y="8" width="3.4" height="84" fill="#3a3f45" />
      <path d="M 146 10 L 163 10 L 154.5 21 Z" fill="#5a5f66" />
      <circle cx="154.5" cy="24" r="4.4" fill="#f4d03f" opacity="0.9" />
      <circle cx="154.5" cy="24" r="13" fill="#f4d03f" opacity="0.14" />
      <circle cx="154.5" cy="24" r="26" fill="#f4d03f" opacity="0.05" />
      <path d="M 142 26 L 167 26 L 180 100 L 128 100 Z" fill="#f4d03f" opacity="0.045" />
      {/* 近景：手腕 + 手环荧光（屏幕亮着 23:47） */}
      <ellipse cx="58" cy="118" rx="34" ry="20" fill="#1a2a3a" opacity="0.95" />
      <ellipse cx="58" cy="118" rx="30" ry="16" fill="#22344a" opacity="0.9" />
      <path d="M 30 112 Q 34 104 42 100" stroke="#d4a678" strokeWidth="5" fill="none" opacity="0.5" strokeLinecap="round" />
      <rect x="46" y="110" width="26" height="14" rx="7" fill="#0c2418" />
      <rect x="48.5" y="112" width="21" height="10" rx="5" fill="#16382a" />
      <text x="52" y="120" font-size="7.5" fill="#4ade80" fontFamily="monospace" opacity="0.95">23:47</text>
      <circle cx="74" cy="117" r="1.6" fill="#2ecc71" opacity="0.8" />
      <circle cx="74" cy="117" r="4" fill="#2ecc71" opacity="0.25" />
      <ellipse cx="58" cy="142" rx="26" ry="6" fill="#2ecc71" opacity="0.05" />
    </>
  ),
  // 泳池照：水波 + 泳圈 + 遮阳伞一角
  pool: (
    <>
      <rect width="200" height="150" fill="#7ab8d4" />
      {/* 天光（正午） */}
      <rect width="200" height="70" fill="#9ad4e8" opacity="0.5" />
      <circle cx="36" cy="24" r="9" fill="#fff" opacity="0.75" />
      <circle cx="36" cy="24" r="20" fill="#fff" opacity="0.15" />
      {/* 远处躺椅排（虚化） */}
      <g opacity="0.4">
        <rect x="150" y="52" width="40" height="6" rx="3" fill="#d8c8b4" />
        <rect x="158" y="58" width="3" height="8" fill="#b8a894" />
        <rect x="176" y="58" width="3" height="8" fill="#b8a894" />
      </g>
      {/* 泳池水 */}
      <path d="M 0 70 L 200 66 L 200 150 L 0 150 Z" fill="#4a9ac4" />
      <g stroke="#e4f4fa" fill="none">
        <path d="M 0 84 Q 25 78 50 84 T 100 84 T 150 84 T 200 84" strokeWidth="2.6" opacity="0.65" />
        <path d="M 0 100 Q 25 94 50 100 T 100 100 T 150 100 T 200 100" strokeWidth="2" opacity="0.5" />
        <path d="M 0 116 Q 25 110 50 116 T 100 116 T 150 116 T 200 116" strokeWidth="1.6" opacity="0.38" />
        <path d="M 0 132 Q 25 126 50 132 T 100 132 T 150 132 T 200 132" strokeWidth="1.2" opacity="0.26" />
      </g>
      {/* 池底瓷砖暗示 */}
      <g opacity="0.14" stroke="#e4f4fa">
        <line x1="0" y1="92" x2="200" y2="90" strokeWidth="0.8" />
        <line x1="50" y1="70" x2="46" y2="150" strokeWidth="0.8" />
        <line x1="150" y1="68" x2="154" y2="150" strokeWidth="0.8" />
      </g>
      {/* 泳圈（红白条纹 + 高光） */}
      <ellipse cx="128" cy="88" rx="34" ry="15" fill="none" stroke="#d4553f" strokeWidth="10" />
      <ellipse cx="128" cy="88" rx="34" ry="15" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="9 9" />
      <path d="M 106 78 Q 120 74 134 76" stroke="#fff" strokeWidth="2.4" opacity="0.5" fill="none" strokeLinecap="round" />
      <ellipse cx="128" cy="95" rx="26" ry="6" fill="#3a7a9a" opacity="0.25" />
      {/* 水花 */}
      <g fill="#fff">
        <circle cx="62" cy="94" r="2.4" opacity="0.7" />
        <circle cx="76" cy="80" r="1.8" opacity="0.55" />
        <circle cx="90" cy="98" r="2.8" opacity="0.45" />
        <circle cx="70" cy="104" r="1.4" opacity="0.4" />
      </g>
      {/* 遮阳伞一角（近景） */}
      <path d="M 0 0 L 66 0 Q 32 32 0 42 Z" fill="#f0e8d8" />
      <path d="M 22 0 L 36 0 Q 29 24 21 33 Z" fill="#d4553f" opacity="0.75" />
      <path d="M 44 0 L 56 0 Q 52 14 44 22 Z" fill="#4a9ac4" opacity="0.6" />
      <path d="M 8 0 L 18 0 Q 12 14 7 24 Z" fill="#f4d03f" opacity="0.55" />
      <rect x="30" y="34" width="4" height="18" rx="2" fill="#8a6a3e" transform="rotate(-8 32 43)" />
    </>
  ),
  // 橘猫照：沙发 + 蜷成一团的橘猫
  cat: (
    <>
      <rect width="200" height="150" fill="#2a2018" />
      {/* 台灯暖光 */}
      <circle cx="170" cy="30" r="5" fill="#f4d03f" opacity="0.6" />
      <circle cx="170" cy="30" r="16" fill="#f4d03f" opacity="0.1" />
      {/* 墙上虚化的相框 */}
      <g opacity="0.3">
        <rect x="22" y="18" width="26" height="32" rx="2" fill="#1c1610" />
        <rect x="26" y="22" width="18" height="24" fill="#3a3028" />
      </g>
      {/* 地毯 */}
      <ellipse cx="100" cy="140" rx="80" ry="14" fill="#3a2c22" opacity="0.6" />
      {/* 沙发（靠垫 + 扶手 + 毛毯） */}
      <rect x="6" y="62" width="188" height="52" rx="12" fill="#5a4632" />
      <rect x="6" y="62" width="188" height="10" rx="6" fill="#6a563e" />
      <rect x="94" y="64" width="2.4" height="48" fill="#4a3a28" />
      <path d="M 18 70 Q 50 66 90 70 L 90 104 L 18 104 Z" fill="#4e3c2a" opacity="0.5" />
      <path d="M 110 70 Q 150 66 188 70 L 188 104 L 110 104 Z" fill="#4e3c2a" opacity="0.5" />
      <rect x="0" y="76" width="18" height="58" rx="8" fill="#6a563e" />
      <rect x="182" y="76" width="18" height="58" rx="8" fill="#6a563e" />
      <path d="M 0 76 L 18 76 L 18 96 Q 9 92 0 96 Z" fill="#8a6a4e" opacity="0.7" />
      <path d="M 4 78 L 16 80 M 4 84 L 16 86" stroke="#6a4e36" strokeWidth="0.8" opacity="0.6" />
      {/* 橘猫（蜷成一团，条纹 + 闭眼） */}
      <ellipse cx="102" cy="102" rx="38" ry="20" fill="#e89a3a" />
      <ellipse cx="102" cy="98" rx="33" ry="14" fill="#f0b45a" opacity="0.38" />
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
      {/* 尾巴（绕过来盖住鼻子） */}
      <path d="M 138 104 Q 164 98 160 76 Q 158 68 150 70" stroke="#e89a3a" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M 138 104 Q 164 98 160 76 Q 158 68 150 70" stroke="#c8782a" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.4" />
      {/* 猫爪垫 */}
      <ellipse cx="94" cy="119" rx="8" ry="4" fill="#f0d8b8" opacity="0.9" />
      <circle cx="90" cy="117" r="1.2" fill="#e0a088" opacity="0.7" />
      <circle cx="95" cy="116" r="1.2" fill="#e0a088" opacity="0.7" />
    </>
  ),
  // 加班照：深夜工位 + 电脑屏光 + 外卖盒
  grind: (
    <>
      <rect width="200" height="150" fill="#12141a" />
      {/* 窗外城市（网格灯窗） */}
      <rect x="144" y="0" width="56" height="150" fill="#0a0c12" />
      <g>
        {[152, 164, 176, 188].map((x, i) => [10, 26, 42, 58, 74, 90].map((y, j) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="7" height="7" fill={(i * 3 + j * 5) % 7 < 3 ? '#f4d03f' : '#5b8db8'} opacity={((i + j) % 3) * 0.22 + 0.15} />
        )))}
      </g>
      <circle cx="28" cy="20" r="4" fill="#e8e4d0" opacity="0.35" />
      {/* 笔记本屏幕（编辑器配色） */}
      <rect x="22" y="30" width="112" height="68" rx="4" fill="#1a1f2a" />
      <rect x="22" y="30" width="112" height="68" rx="4" fill="none" stroke="#2a3240" strokeWidth="1.6" />
      <rect x="28" y="36" width="100" height="56" fill="#232c3e" />
      <g fill="#3a4658">
        {[42, 50, 58, 66, 74, 82].map((y) => <rect key={y} x="30" y={y} width="4" height="3" opacity="0.7" />)}
      </g>
      <g>
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
      <ellipse cx="78" cy="100" rx="52" ry="10" fill="#4a8ab8" opacity="0.07" />
      {/* 键盘 C 面与触控板 */}
      <path d="M 34 98 L 122 98 L 128 128 L 28 128 Z" fill="#1c222c" />
      <g opacity="0.5" fill="#2a3240">
        {[102, 108, 114].map((y) => <rect key={y} x="40" y={y} width="76" height="3.4" rx="1" />)}
      </g>
      <rect x="74" y="120" width="18" height="5" rx="2.4" fill="#2a3240" />
      {/* 咖啡杯（渍圈 + 热气） */}
      <rect x="14" y="96" width="11" height="13" rx="2" fill="#d8d0c4" />
      <path d="M 25 99 q 4 2 0 6" stroke="#d8d0c4" strokeWidth="2" fill="none" opacity="0.8" />
      <ellipse cx="19.5" cy="96" rx="5.5" ry="1.8" fill="#3a2c1e" opacity="0.8" />
      <path d="M 19.5 90 Q 17 86 19.5 82" stroke="#aab2ba" strokeWidth="1" fill="none" opacity="0.2" strokeLinecap="round" />
      {/* 外卖盒（筷子搭在上面） */}
      <rect x="142" y="106" width="42" height="22" rx="2.4" fill="#c9b892" />
      <rect x="145" y="109" width="36" height="4" fill="#a89a6e" opacity="0.55" />
      <line x1="150" y1="104" x2="176" y2="100" stroke="#8a6a3a" strokeWidth="2" strokeLinecap="round" />
      <line x1="151" y1="107" x2="177" y2="103" stroke="#9a7a44" strokeWidth="2" strokeLinecap="round" />
      <text x="34" y="140" font-size="10" fill="#5a6a7a" fontFamily="monospace" opacity="0.85">01:47</text>
    </>
  ),
  // 旅游照：车窗外的山与公路（落日）
  travel: (
    <>
      <defs>
        <linearGradient id="trSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0c898" />
          <stop offset="55%" stopColor="#e8a86a" />
          <stop offset="100%" stopColor="#c8884e" />
        </linearGradient>
      </defs>
      <rect width="200" height="150" fill="url(#trSky)" />
      {/* 太阳（半沉进山口） */}
      <circle cx="148" cy="52" r="20" fill="#f4a03f" />
      <circle cx="148" cy="52" r="30" fill="#f4a03f" opacity="0.25" />
      <circle cx="148" cy="52" r="44" fill="#f4a03f" opacity="0.1" />
      <path d="M 128 52 A 20 20 0 0 1 168 52 Z" fill="#f4b85e" opacity="0.7" />
      {/* 云带 */}
      <g fill="#f8dcb4" opacity="0.5">
        <ellipse cx="60" cy="30" rx="26" ry="4" />
        <ellipse cx="110" cy="22" rx="18" ry="3" opacity="0.7" />
        <ellipse cx="40" cy="44" rx="20" ry="3" opacity="0.6" />
      </g>
      {/* 远山（三层推远） */}
      <path d="M 0 92 L 40 52 L 76 92 Z" fill="#8a6a5a" opacity="0.55" />
      <path d="M 52 92 L 102 42 L 152 92 Z" fill="#6a5244" opacity="0.75" />
      <path d="M 118 92 L 162 58 L 200 92 Z" fill="#8a6a5a" opacity="0.6" />
      {/* 山脚雾带 */}
      <rect x="0" y="86" width="200" height="8" fill="#f0d8b4" opacity="0.3" />
      {/* 公路（盘山弯 + 中线） */}
      <path d="M 0 150 L 0 108 L 200 150 Z" fill="#5a4a3a" />
      <path d="M 0 150 L 0 124 Q 60 128 100 138 Q 140 146 200 150 Z" fill="#6a5a4a" opacity="0.6" />
      <path d="M 96 112 L 108 124 Q 100 138 88 150" stroke="#f0e8d8" strokeWidth="4" fill="none" opacity="0.55" strokeDasharray="12 10" />
      {/* 路边反光柱 */}
      <g fill="#f0e8d8" opacity="0.7">
        <rect x="30" y="130" width="2.4" height="8" rx="1" />
        <rect x="60" y="136" width="2.4" height="8" rx="1" />
      </g>
      <circle cx="152" cy="118" r="1.6" fill="#f4d03f" opacity="0.8" />
      {/* 车窗框（近景——随手拍感） */}
      <rect x="0" y="0" width="200" height="150" fill="none" stroke="#3a3026" strokeWidth="14" />
      <rect x="7" y="7" width="186" height="136" fill="none" stroke="#f0e8d8" strokeWidth="1" opacity="0.1" />
      <line x1="0" y1="0" x2="200" y2="150" stroke="#3a3026" strokeWidth="7" opacity="0.4" />
      {/* 车窗上的斜阳炫光 */}
      <path d="M 30 0 L 44 0 L 0 92 L 0 70 Z" fill="#fff" opacity="0.14" />
    </>
  ),
  // 奶茶咖啡照：一杯全糖去冰
  boba: (
    <>
      <rect width="200" height="150" fill="#2a1a1a" />
      {/* 店内氛围（灯串 + 菜单虚化） */}
      <g>
        {[28, 52, 76].map((x) => (
          <g key={x}>
            <circle cx={x} cy="18" r="2" fill="#f4d03f" opacity="0.8" />
            <circle cx={x} cy="18" r="6" fill="#f4d03f" opacity="0.12" />
          </g>
        ))}
        <path d="M 20 22 Q 52 26 84 22" stroke="#4a3a2a" strokeWidth="0.8" fill="none" opacity="0.6" />
      </g>
      <g opacity="0.22">
        <rect x="146" y="14" width="48" height="42" rx="2" fill="#1c1414" />
        <rect x="152" y="22" width="36" height="4" fill="#3a2a2a" />
        <rect x="152" y="32" width="28" height="3" fill="#3a2a2a" />
        <rect x="152" y="40" width="32" height="3" fill="#3a2a2a" />
      </g>
      {/* 桌面 */}
      <path d="M 0 150 L 0 108 L 200 104 L 200 150 Z" fill="#3a2a1e" />
      <g stroke="#2a1c12" strokeWidth="0.8" opacity="0.4">
        <path d="M 0 120 Q 100 116 200 118" fill="none" />
        <path d="M 0 136 Q 100 132 200 134" fill="none" />
      </g>
      {/* 杯身（锥形 + 高光条） */}
      <path d="M 66 46 L 134 46 L 124 122 L 76 122 Z" fill="#c9a37a" />
      <path d="M 66 46 L 84 46 L 78 122 L 76 122 Z" fill="#e0bc94" opacity="0.5" />
      <path d="M 70 64 L 130 64 L 124 122 L 76 122 Z" fill="#8a5a3a" />
      {/* 奶盖（波纹 + 挂壁） */}
      <path d="M 66 46 L 134 46 L 132 56 L 68 56 Z" fill="#f4ede4" />
      <path d="M 70 56 Q 78 58 88 56 Q 100 58 112 56 Q 124 58 130 56" stroke="#e8dccc" strokeWidth="1.6" fill="none" />
      <path d="M 70 50 Q 74 46 76 50" stroke="#fff" strokeWidth="1.4" fill="none" opacity="0.5" />
      {/* 珍珠（沉底 + 色阶 + 高光） */}
      <g>
        <circle cx="90" cy="112" r="4.4" fill="#241610" />
        <circle cx="103" cy="116" r="4.4" fill="#2a1a12" />
        <circle cx="112" cy="108" r="4.4" fill="#1e120c" />
        <circle cx="96" cy="102" r="3.8" fill="#3a2a1e" />
        <circle cx="108" cy="97" r="3.6" fill="#3a2a1e" opacity="0.8" />
        <circle cx="91" cy="109" r="1.4" fill="#4a3a2a" opacity="0.6" />
        <circle cx="103" cy="113" r="1.4" fill="#4a3a2a" opacity="0.6" />
      </g>
      {/* 吸管（红色斜插） */}
      <g transform="rotate(12 106 50)">
        <rect x="103" y="18" width="6.4" height="42" rx="2" fill="#d4553f" />
        <rect x="103" y="18" width="2.2" height="42" fill="#e8a098" opacity="0.5" rx="1" />
        <ellipse cx="106.2" cy="18" rx="3.2" ry="1.4" fill="#3a2018" />
      </g>
      {/* 杯套（纸感 + 字） */}
      <path d="M 77 86 L 123 86 L 120 106 L 80 106 Z" fill="#f0e8d8" />
      <path d="M 77 86 L 123 86 L 122.4 90 L 77.6 90 Z" fill="#e0d4bc" opacity="0.7" />
      <text x="88" y="100" font-size="9" fill="#5a3a24" fontFamily="serif" opacity="0.9">全糖</text>
      <line x1="82" y1="104" x2="118" y2="104" stroke="#c9b892" strokeWidth="0.8" opacity="0.6" />
      <ellipse cx="100" cy="126" rx="28" ry="6" fill="#000" opacity="0.3" />
    </>
  ),
  // 病床输液照：病房夜灯 + 吊瓶 + 输液管
  sick: (
    <>
      <rect width="200" height="150" fill="#39424a" />
      <rect width="200" height="150" fill="#414a52" opacity="0.4" />
      <rect x="0" y="0" width="200" height="10" fill="#2a3238" />
      <rect x="0" y="64" width="200" height="3.4" fill="#2e363c" opacity="0.7" />
      <rect x="0" y="120" width="200" height="30" fill="#333c44" />
      {/* 走廊夜灯（冷光） */}
      <rect x="8" y="16" width="20" height="30" rx="2" fill="#4a5a6a" opacity="0.5" />
      <rect x="10" y="18" width="16" height="26" fill="#5a7a9a" opacity="0.25" />
      <circle cx="18" cy="31" r="20" fill="#5a7a9a" opacity="0.06" />
      {/* 吊瓶架 */}
      <line x1="152" y1="8" x2="152" y2="128" stroke="#6a7278" strokeWidth="3.4" />
      <line x1="128" y1="10" x2="176" y2="10" stroke="#6a7278" strokeWidth="3.4" strokeLinecap="round" />
      {/* 吊瓶（药液余量 + 气泡 + 刻度） */}
      <rect x="141" y="18" width="22" height="38" rx="5" fill="#c9e0ea" opacity="0.35" />
      <rect x="141" y="32" width="22" height="24" rx="5" fill="#8ab8c8" opacity="0.55" />
      <g stroke="#6a8a9a" strokeWidth="0.5" opacity="0.6">
        <line x1="161" y1="34" x2="164" y2="34" />
        <line x1="161" y1="40" x2="164" y2="40" />
        <line x1="161" y1="46" x2="164" y2="46" />
      </g>
      <circle cx="150" cy="46" r="1" fill="#c9e0ea" opacity="0.8" />
      <circle cx="155" cy="50" r="0.8" fill="#c9e0ea" opacity="0.6" />
      <rect x="147" y="56" width="10" height="10" rx="2" fill="#8ab8c8" opacity="0.8" />
      <rect x="149.5" y="66" width="5" height="4" fill="#6a8a9a" opacity="0.8" />
      {/* 输液管（滴壶 + 螺旋细管） */}
      <path d="M 152 70 Q 132 80 122 92 Q 112 104 106 118" stroke="#c9e0ea" strokeWidth="2" fill="none" opacity="0.85" />
      <ellipse cx="152" cy="73" rx="3.4" ry="5" fill="none" stroke="#c9e0ea" strokeWidth="1" opacity="0.8" />
      <circle cx="152" cy="73" r="1" fill="#c9e0ea" opacity="0.9" />
      <path d="M 130 82 q 2 3 0 6 q -2 3 0 6" stroke="#c9e0ea" strokeWidth="0.6" fill="none" opacity="0.5" />
      {/* 病床（床架 + 被子 + 床腿） */}
      <rect x="18" y="94" width="96" height="14" rx="4" fill="#8a9298" />
      <rect x="18" y="94" width="96" height="4" rx="2" fill="#a2aab0" />
      <path d="M 20 108 L 112 108 L 116 124 L 16 124 Z" fill="#c2cad0" />
      <path d="M 20 108 L 60 108 L 58 124 L 16 124 Z" fill="#d4dce2" opacity="0.6" />
      <rect x="12" y="106" width="6" height="20" rx="2" fill="#5a6268" />
      <rect x="106" y="106" width="6" height="20" rx="2" fill="#5a6268" />
      {/* 枕头 */}
      <rect x="16" y="70" width="38" height="26" rx="6" fill="#dce4ea" />
      <rect x="18" y="72" width="34" height="20" rx="5" fill="#e8f0f4" opacity="0.6" />
      {/* 手背（胶布固定针头 + 指节） */}
      <ellipse cx="98" cy="106" rx="16" ry="6.4" fill="#d4b090" />
      <ellipse cx="95" cy="104.4" rx="8" ry="3.4" fill="#e4c4a4" opacity="0.7" />
      <path d="M 86 104 Q 84 108 88 110" stroke="#d4b090" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 110 104 Q 112 108 108 110" stroke="#d4b090" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="96" y="102" width="4" height="9" rx="2" fill="#f0e8d8" transform="rotate(-24 98 106)" />
      <rect x="92" y="106" width="14" height="5" rx="2.4" fill="#f0e8d8" opacity="0.95" />
      <line x1="93" y1="108" x2="105" y2="107" stroke="#d8ccb4" strokeWidth="0.8" opacity="0.7" />
      {/* 挂钟（23:40） */}
      <circle cx="52" cy="30" r="13" fill="#2a3238" />
      <circle cx="52" cy="30" r="13" fill="none" stroke="#6a7278" strokeWidth="1.6" />
      <circle cx="52" cy="30" r="10.4" fill="#333c44" />
      <g stroke="#c9e0ea" strokeWidth="1">
        <line x1="52" y1="20.6" x2="52" y2="22.6" />
        <line x1="61.4" y1="30" x2="59.4" y2="30" />
        <line x1="52" y1="39.4" x2="52" y2="37.4" />
        <line x1="42.6" y1="30" x2="44.6" y2="30" />
      </g>
      <line x1="52" y1="30" x2="52" y2="23" stroke="#c9e0ea" strokeWidth="1.5" />
      <line x1="52" y1="30" x2="47" y2="35" stroke="#c9e0ea" strokeWidth="1.2" />
      {/* 输液架轮 */}
      <circle cx="146" cy="136" r="4" fill="#2a3238" />
      <circle cx="158" cy="136" r="4" fill="#2a3238" />
    </>
  ),
};

// ---------------------------------------------------------------------------
// 女主角头像系统（v2.4 精修：完整面部 + 发丝高光 + 耳坠 + 圆形裁切）
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
      <defs>
        <radialGradient id="pfVig" cx="50%" cy="42%" r="72%">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="82%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.4" />
        </radialGradient>
        <linearGradient id="pfFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8d8b8" />
          <stop offset="100%" stopColor="#eec09a" />
        </linearGradient>
      </defs>
      <circle cx="27" cy="27" r="26" fill={st.bg} />
      <circle cx="27" cy="27" r="26" fill="#ffffff" opacity="0.03" />
      {/* 氛围光斑（accent 色调） */}
      <circle cx="38" cy="18" r="14" fill={st.accent} opacity="0.1" />
      <circle cx="14" cy="38" r="10" fill={st.accent} opacity="0.05" />
      <g clipPath="url(#pfClip)">
        {/* 发型（四种，带发丝高光） */}
        {hair === 'long' && (
          <g fill={st.hair}>
            <path d="M 13 30 Q 13 10 27 10 Q 41 10 41 30 L 41 48 L 36 48 L 36 32 Q 36 18 27 16 Q 18 18 18 32 L 18 48 L 13 48 Z" />
            <path d="M 15 24 Q 17 12 27 11 Q 37 12 39 24 Q 33 15 27 15 Q 21 15 15 24 Z" fill="#ffffff" opacity="0.14" />
          </g>
        )}
        {hair === 'twin' && (
          <g fill={st.hair}>
            <path d="M 15 26 Q 15 11 27 11 Q 39 11 39 26 L 39 34 L 36 34 L 36 28 Q 36 18 27 17 Q 18 18 18 28 L 18 34 L 15 34 Z" />
            {/* 双马尾（系带 + 发梢弧） */}
            <path d="M 11 30 Q 8 38 10 44 Q 12 47 14 44 Q 13 37 14 32 Z" />
            <path d="M 43 30 Q 46 38 44 44 Q 42 47 40 44 Q 41 37 40 32 Z" />
            <circle cx="13.5" cy="30" r="1.6" fill={st.accent} opacity="0.9" />
            <circle cx="40.5" cy="30" r="1.6" fill={st.accent} opacity="0.9" />
            <path d="M 15 22 Q 17 13 27 12 Q 37 13 39 22 Q 33 14.5 27 14.5 Q 21 14.5 15 22 Z" fill="#ffffff" opacity="0.16" />
          </g>
        )}
        {hair === 'bun' && (
          <g fill={st.hair}>
            {/* 丸子头（发髻 + 缠绕发丝） */}
            <circle cx="27" cy="9" r="4.6" />
            <path d="M 23.5 11.5 Q 27 14 30.5 11.5" stroke={st.hair} strokeWidth="1.6" fill="none" />
            <path d="M 15 26 Q 15 12 27 12 Q 39 12 39 26 L 39 30 Q 33 19 27 19 Q 21 19 15 30 Z" />
            <circle cx="25.4" cy="8" r="1.2" fill="#ffffff" opacity="0.2" />
          </g>
        )}
        {hair === 'bob' && (
          <g fill={st.hair}>
            <path d="M 14 32 Q 13 10 27 10 Q 41 10 40 32 L 37 32 Q 38 16 27 15 Q 16 16 17 32 Z" />
            <path d="M 14 32 Q 13 24 14.6 18 L 17 32 Z" />
            <path d="M 40 32 Q 41 24 39.4 18 L 37 32 Z" />
            <path d="M 16 22 Q 18 12 27 11.4 Q 36 12 38 22 Q 32 15 27 15 Q 22 15 16 22 Z" fill="#ffffff" opacity="0.16" />
          </g>
        )}
        {/* 耳朵 + 耳坠（小小的点缀，accent 色） */}
        <ellipse cx="19.5" cy="28.5" rx="1.7" ry="2.8" fill="#f2cba5" />
        <ellipse cx="34.5" cy="28.5" rx="1.7" ry="2.8" fill="#f2cba5" />
        <circle cx="19.5" cy="31.6" r="1" fill={st.accent} opacity="0.85" />
        <circle cx="34.5" cy="31.6" r="1" fill={st.accent} opacity="0.85" />
        {/* 脸（皮肤渐变 + 顶光） */}
        <ellipse cx="27" cy="28" rx="9.5" ry="11" fill="url(#pfFace)" />
        <ellipse cx="24.5" cy="23.5" rx="5.5" ry="3.8" fill="#fde8d4" opacity="0.4" />
        {/* 刘海（拱形，带发丝层次） */}
        <path d="M 18 20 Q 27 11.5 36 20 Q 31 16.5 27 18.6 Q 23 16.5 18 20 Z" fill={st.hair} />
        <path d="M 19.5 19.2 Q 27 13 34.5 19.2" stroke="#ffffff" strokeWidth="0.9" fill="none" opacity="0.14" />
        {/* 眼（anime-lite：瞳孔 + 双高光 + 上睫线） */}
        <path d="M 21 25.8 Q 23 24.4 25.2 25.9" stroke="#2a2018" strokeWidth="1.1" fill="none" opacity="0.75" strokeLinecap="round" />
        <path d="M 28.8 25.9 Q 31 24.4 33 25.8" stroke="#2a2018" strokeWidth="1.1" fill="none" opacity="0.75" strokeLinecap="round" />
        <ellipse cx="23" cy="27.6" rx="1.9" ry="2.5" fill="#26221c" />
        <ellipse cx="31" cy="27.6" rx="1.9" ry="2.5" fill="#26221c" />
        <circle cx="23.6" cy="26.7" r="0.7" fill="#fff" opacity="0.95" />
        <circle cx="31.6" cy="26.7" r="0.7" fill="#fff" opacity="0.95" />
        <circle cx="22.5" cy="28.4" r="0.35" fill="#fff" opacity="0.5" />
        <circle cx="30.5" cy="28.4" r="0.35" fill="#fff" opacity="0.5" />
        {/* 眉（细淡） */}
        <path d="M 21 24 Q 23 23 25 23.8" stroke="#4a3a2e" strokeWidth="0.9" fill="none" opacity="0.8" />
        <path d="M 29 23.8 Q 31 23 33 24" stroke="#4a3a2e" strokeWidth="0.9" fill="none" opacity="0.8" />
        {/* 鼻（一点） */}
        <path d="M 27.3 29.2 Q 27 30 26.8 30.6" stroke="#d8a882" strokeWidth="0.7" fill="none" />
        {/* 嘴（浅笑 + 唇色） */}
        <path d="M 24.4 32.6 Q 27 34.2 29.6 32.6" fill="none" stroke="#c46a5a" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M 24.4 32.6 Q 27 33.3 29.6 32.6" fill="none" stroke="#e88a78" strokeWidth="0.7" opacity="0.5" />
        {/* 腮红（虚两团） */}
        <ellipse cx="20.8" cy="30.8" rx="2.2" ry="1.3" fill="#f0a898" opacity="0.35" />
        <ellipse cx="33.2" cy="30.8" rx="2.2" ry="1.3" fill="#f0a898" opacity="0.35" />
        {/* 领口（accent + 白领衬） */}
        <path d="M 18 44 L 27 38.6 L 36 44 L 36 54 L 18 54 Z" fill={st.accent} />
        <path d="M 18 44 L 27 38.6 L 36 44 L 34.4 45.2 L 27 40.8 L 19.6 45.2 Z" fill="#f4ede4" opacity="0.85" />
        <path d="M 19 49 Q 27 46.5 35 49 L 35 54 L 19 54 Z" fill="#00000022" />
        {/* 暗角 */}
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
