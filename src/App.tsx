import { useEffect, useState } from 'react';
import { useGame } from './store/gameStore';
import { TitleScreen, NewGameScreen, PrologueScreen } from './components/screens';
import { MainScreen } from './components/main-screen';
import { EndingScreen } from './components/ending-screen';
import { loadMutePref, setAmbient, currentAmbientId, type AmbientId } from './utils/sound';
import type { PersonaId } from './types/persona';

export default function App() {
  const store = useGame();
  const { state } = store;
  const [screen, setScreen] = useState<'none' | 'prologue' | 'newgame'>('none');
  useEffect(() => {
    loadMutePref();
    const onNewGame = () => setScreen('prologue');
    window.addEventListener('beng:newgame', onNewGame);
    return () => window.removeEventListener('beng:newgame', onNewGame);
  }, []);

  // v4.14 环境音乐：按 phase/标题/结局切换音景（crossfade）。幂等——同态不重复切。
  useEffect(() => {
    let want: AmbientId = 'none';
    if (screen !== 'none') want = 'title';            // 序章/建档仍在标题氛围
    else if (state.phase === 'title') want = 'title';
    else if (state.phase === 'ended') want = 'ending';
    else if (state.dayPhase === 'chat' || state.dayPhase === 'night') want = 'night';
    else want = 'morning';
    if (currentAmbientId() !== want) setAmbient(want);
  }, [screen, state.phase, state.dayPhase]);

  // v2.2：新游戏流程 = 序章（交代现象/她/动机）→ 建档（起名+选人设）→ 主线。
  if (screen === 'prologue') {
    return <PrologueScreen onDone={() => setScreen('newgame')} />;
  }
  if (screen === 'newgame') {
    return (
      <NewGameScreen
        onStart={(name: string, personaId: PersonaId) => {
          store.dispatch({ type: 'new_game', name, motive: 'debt', personaId });
          setScreen('none');
        }}
      />
    );
  }
  if (state.phase === 'title') return <TitleScreen />;
  if (state.phase === 'ended') return <EndingScreen />;
  return <MainScreen />;
}
