import { create } from 'zustand';
import type { GameAction, GameState } from '../types/game';
import { createInitialState, dispatch } from '../engine/state-machine';

const SAVE_KEY = 'beng_save_v1';

export interface GameStore {
  state: GameState;
  dispatch(action: GameAction): void;
  reset(): void;
  save(): void;
  load(): boolean;
  hasSave(): boolean;
}

function loadSaved(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export const useGame = create<GameStore>((set, get) => ({
  state: createInitialState(),
  dispatch: (action) => {
    const next = dispatch(get().state, action);
    set({ state: next });
    if (next.phase === 'main' || next.phase === 'ended') {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); } catch { /* quota */ }
    }
  },
  reset: () => {
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ok */ }
    set({ state: createInitialState() });
  },
  save: () => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(get().state)); } catch { /* quota */ }
  },
  load: () => {
    const saved = loadSaved();
    if (!saved) return false;
    set({ state: saved });
    return true;
  },
  hasSave: () => loadSaved() !== null,
}));
