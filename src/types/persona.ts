/** Persona archetypes she can run. Each unlocks its own reply-flavour set. */
export type PersonaId = 'femme_fatale' | 'sweet_daughter' | 'wise_sister' | 'artistic_soul';

export interface Persona {
  id: PersonaId;
  name: string;
  tagline: string;
  bio: string;
  /** Topics this persona naturally handles. */
  topics: string[];
}

export const PERSONA_IDS: PersonaId[] = [
  'femme_fatale',
  'sweet_daughter',
  'wise_sister',
  'artistic_soul',
];
