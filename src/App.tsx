import { useEffect, useState } from 'react';
import { useGame } from './store/gameStore';
import { TitleScreen, NewGameScreen, PrologueScreen } from './components/screens';
import { MainScreen } from './components/main-screen';
import { EndingScreen } from './components/ending-screen';
import { loadMutePref, setBgm, currentBgmId, type MusicId, loadMusicMutePref } from './utils/sound';
import type { PersonaId } from './types/persona';

export default function App() {
  const store = useGame();
  const { state } = store;
  const [screen, setScreen] = useState<'none' | 'prologue' | 'newgame'>('none');
  useEffect(() => {
    loadMutePref();
    loadMusicMutePref();
    const onNewGame = () => setScreen('prologue');
    window.addEventListener('beng:newgame', onNewGame);
    return () => window.removeEventListener('beng:newgame', onNewGame);
  }, []);

  // v4.14 独立背景音乐：按 phase/屏幕切换。与音效系统独立静音。
  useEffect(() => {
    let want: MusicId = 'none';
    if (screen !== 'none') want = 'title';
    else if (state.phase === 'title') want = 'title';
    else if (state.phase === 'ended') want = 'ending';
    else if (state.dayPhase === 'chat' || state.dayPhase === 'night') want = 'night';
    else want = 'morning';
    if (currentBgmId() !== want) setBgm(want);
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
