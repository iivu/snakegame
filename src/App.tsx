import { useEffect } from 'react';

import { destroyGame, initGame } from './game.ts';
import './App.css';

const App = () => {
  useEffect(() => {
    initGame();
    return () => destroyGame();
  }, []);

  return (
    <section className="w-screen h-screen flex justify-center items-center">
      <div className="w-[800px] h-[800px] rounded-md overflow-hidden" id="game-container"></div>
    </section>
  );
};

export default App;
