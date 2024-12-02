import * as Phaser from 'phaser';

let game: null | Phaser.Game = null;

export function initGame() {
  game = new Phaser.Game({
    parent: 'game-container',
    scene: [MainScene],
    type: Phaser.AUTO,
    width: 800,
    height: 800,
    backgroundColor: '#fde047'
  });
}

export function destroyGame() {
  game?.destroy(true);
}

class MainScene extends Phaser.Scene {
  constructor() {
    super('Main');
  }
}
