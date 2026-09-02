import { useEffect, useState } from 'react';
import { useGame } from './store/gameStore';
import { TitleScreen, NewGameScreen } from './components/screens';
import { MainScreen } from './components/main-screen';
import { EndingScreen } from './components/ending-screen';
import { loadMutePref } from './utils/sound';
import type { PersonaId } from './types/persona';

export default function App() {
  const store = useGame();
  const [newGameOpen, setNewGameOpen] = useState(false);
  useEffect(() => {
    loadMutePref();
    const onNewGame = () => setNewGameOpen(true);
    window.addEventListener('beng:newgame', onNewGame);
    return () => window.removeEventListener('beng:newgame', onNewGame);
  }, []);

  if (newGameOpen) {
    return (
      <NewGameScreen
        onStart={(name: string, personaId: PersonaId) => {
          store.dispatch({ type: 'new_game', name, motive: 'debt', personaId });
          setNewGameOpen(false);
        }}
      />
    );
  }
  if (store.state.phase === 'title') return <TitleScreen />;
  if (store.state.phase === 'ended') return <EndingScreen />;
  return <MainScreen />;
}
