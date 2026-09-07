import { create } from 'zustand';
import type { GameAction, GameState } from '../types/game';
import { createInitialState, defaultProfile, dispatch } from '../engine/state-machine';
import { ALL_TARGETS } from '../data/target-library';
import type { TargetState } from '../types/target';

const SAVE_KEY = 'beng_save_v1';

export interface GameStore {
  state: GameState;
  dispatch(action: GameAction): void;
  reset(): void;
  save(): void;
  load(): boolean;
  hasSave(): boolean;
}

/** v1 存档 → v2：补默认字段（profile/流水/归档/incoming/计划/麻木日限 + 老头新字段 + 45 人库）。
 *  旧档的五个老头视为第 1 天认识；库目标由 state.targets 数量决定补哪些。 */
function migrate(saved: GameState): GameState {
  const base = createInitialState();
  // 1) 老头运行时状态：按 v2 全量名单补齐（旧档只有主五人 → 库目标以"未认识"入场）。
  const byId = new Map(saved.targets.map((t) => [t.targetId, t]));
  const targets: TargetState[] = ALL_TARGETS.map((def) => {
    const old = byId.get(def.id);
    if (!old) {
      const fresh = base.targets.find((t) => t.targetId === def.id)!;
      return { ...fresh, discoveredDay: 0 };
    }
    return {
      ...old,
      discoveredDay: old.discoveredDay ?? 1,
      pingedToday: old.pingedToday ?? false,
      recentPacks: old.recentPacks ?? [],
      recentGreetingIdx: old.recentGreetingIdx ?? -1,
      recentPhotoIdx: old.recentPhotoIdx ?? -1,
    };
  });
  // 2) 顶层 v2 新字段。
  return {
    ...saved,
    targets,
    profile: saved.profile ?? defaultProfile(),
    ledger: saved.ledger ?? [],
    archives: saved.archives ?? [],
    incoming: saved.incoming ?? [],
    todayPlan: saved.todayPlan ?? '',
    numbnessToday: saved.numbnessToday ?? 0,
    energyMax: saved.energyMax ?? base.energyMax,
    // v2.3：朋友圈 + 商店。
    moments: saved.moments ?? [],
    unseenMoments: saved.unseenMoments ?? 0,
    inventory: saved.inventory ?? {},
    // v3.1："新的一天"简报（旧档没有 → 不补弹，避免读档突袭）。
    briefingDay: saved.briefingDay ?? 0,
    // v4.1：节奏日决策状态（旧档没有 → 视为已过/未决均可，0 = 无待决）。
    pendingBeat: saved.pendingBeat ?? '',
    beatResolved: saved.beatResolved ?? false,
  };
}

function loadSaved(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw) as GameState);
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
