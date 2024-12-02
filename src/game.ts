import * as Phaser from 'phaser';

export class Game {
  private game: Phaser.Game | null = null;

  initGame() {
    this.game = new Phaser.Game({
      parent: 'game-container',
      scene: [MainScene],
      type: Phaser.AUTO,
      width: 800,
      height: 800,
      backgroundColor: '#fde047',
    });
  }

  destroyGame() {
    this.game?.destroy(true);
  }
}

class MainScene extends Phaser.Scene {
  constructor() {
    super('Main');
  }
}
