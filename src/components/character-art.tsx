/**
 * Programmatic SVG portraits (GL2 character-art pattern, zero image assets).
 * 老李：发际线后退、胡茬、微胖脸。表情由信任/警惕驱动——警惕高时眯眼审视。
 * 主角头像按人设卡变化。
 */
import type { Target, TargetState } from '../types/target';
import type { PersonaId } from '../types/persona';

export function OldManAvatar({ target, state, size = 44 }: { target: Target; state?: TargetState; size?: number }) {
  const spec = target.portraitSpec;
  const wary = (state?.wariness ?? 10) >= 45;
  const smiling = (state?.trust ?? 0) >= 60;
  // Eye shape: wary → narrow slits; smiling → crescent.
  const eyeH = wary ? 1.2 : smiling ? 1.5 : 2;
  const mouth = smiling
    ? 'M 22 32 Q 27 35 32 32'
    : wary
      ? 'M 23 33 L 31 33'
      : 'M 23 32 Q 27 34 31 32';
  const hairlineY = spec.hair === 2 ? 13 : 9;
  return (
    <svg width={size} height={size} viewBox="0 0 54 54" role="img" aria-label={target.name}>
      <circle cx="27" cy="27" r="26" fill="#22303c" />
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
    </svg>
  );
}

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
