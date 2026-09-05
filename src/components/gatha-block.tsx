import type { Gatha } from '../data/gathas';

/**
 * v2.4 偈语块：诗句 / 出处 / 释义——三行一副面孔。
 * 序章页脚、结局卷首、终章收尾共用这一个组件，偈语在游戏里始终长同一个样子。
 */
export function GathaBlock({ gatha, className = '' }: { gatha: Gatha; className?: string }) {
  return (
    <div className={`gatha-block ${className}`.trim()}>
      <p className="gatha-verse">{gatha.verse}</p>
      <p className="gatha-source">——{gatha.source}</p>
      <p className="gatha-gloss">{gatha.gloss}</p>
    </div>
  );
}
