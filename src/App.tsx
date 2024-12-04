import { useEffect, useRef } from 'react';

import { Game } from './game.ts';
import './App.css';

const App = () => {
  const game = useRef<Game>();

  useEffect(() => {
    game.current = new Game();
    game.current.initGame();
    return () => game.current?.destroyGame();
  }, []);

  return (
    <section className="w-screen h-screen flex justify-center items-center">
      <div
        className="w-[600px] h-[600px] rounded-md overflow-hidden"
        id="game-container"
      />
    </section>
  );
};

export default App;
