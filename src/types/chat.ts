/** Chat bubbles in a session transcript. */
export type ChatSpeaker = 'target' | 'player' | 'system';

export interface ChatMessage {
  speaker: ChatSpeaker;
  /** Optional label above system messages, e.g. 「他给你发来一个红包」. */
  label?: string;
  text: string;
  /** Minute-of-day timestamp for display, e.g. 03:12. */
  stamp?: string;
}
