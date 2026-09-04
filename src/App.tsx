import { useEffect, useState } from 'react';
import { useGame } from './store/gameStore';
import { TitleScreen, NewGameScreen, PrologueScreen } from './components/screens';
import { MainScreen } from './components/main-screen';
import { EndingScreen } from './components/ending-screen';
import { loadMutePref } from './utils/sound';
import type { PersonaId } from './types/persona';

export default function App() {
  const store = useGame();
  const [screen, setScreen] = useState<'none' | 'prologue' | 'newgame'>('none');
  useEffect(() => {
    loadMutePref();
    const onNewGame = () => setScreen('prologue');
    window.addEventListener('beng:newgame', onNewGame);
    return () => window.removeEventListener('beng:newgame', onNewGame);
  }, []);

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
  if (store.state.phase === 'title') return <TitleScreen />;
  if (store.state.phase === 'ended') return <EndingScreen />;
  return <MainScreen />;
}
