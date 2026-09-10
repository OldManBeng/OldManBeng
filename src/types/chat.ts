/** Chat bubbles in a session transcript.
 *  narrator：v4.2.1（S1）旁白通道——"（你…"开头的她的内心独白不再借
 *  他的名义发出。渲染上与（…）叙事段同款（居中、淡色、斜体）。 */
export type ChatSpeaker = 'target' | 'player' | 'system' | 'narrator';

export interface ChatMessage {
  speaker: ChatSpeaker;
  /** Optional label above system messages, e.g. 「他给你发来一个红包」. */
  label?: string;
  text: string;
  /** Minute-of-day timestamp for display, e.g. 03:12. */
  stamp?: string;
  /** v2.2：附带照片的 photoId——渲染程序化 SVG 立绘（character-art.tsx）。 */
  photoId?: string;
  /** v4.12：照片变体 1..6——1=基准图 {photoId}.png，2..6=_v2.._v6（png 直查表）。
   *  旧存档缺省 → 渲染基准图。变体在发送时由 pickVariant 确定性算好存此，跨渲染站点稳定。 */
  variant?: number;
}
