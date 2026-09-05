/** Persona archetypes she can run. Each unlocks its own reply-flavour set. */
export type PersonaId = 'femme_fatale' | 'sweet_daughter' | 'wise_sister' | 'artistic_soul';

export interface Persona {
  id: PersonaId;
  name: string;
  tagline: string;
  bio: string;
  /** Topics this persona naturally handles. */
  topics: string[];
  /** v3.0：场次被动说明（UI 显示）。 */
  passiveNote?: string;
  /** v3.0：剧情分岔提示——谁能吃到这条线（UI 显示）。 */
  hook?: string;
  /** v3.0：这条人设的代价/演砸谁（UI 显示）。 */
  risk?: string;
}

export const PERSONA_IDS: PersonaId[] = [
  'femme_fatale',
  'sweet_daughter',
  'wise_sister',
  'artistic_soul',
];
