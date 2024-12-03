import * as Phaser from 'phaser';

enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

type Position = { x: number; y: number };
type Body = Position & { gameObject: Phaser.GameObjects.Arc | null; pIndex: number };

export class Game {
  private game: Phaser.Game | null = null;

  initGame() {
    this.game = new Phaser.Game({
      parent: 'game-container',
      scene: MainScene,
      type: Phaser.AUTO,
      width: 1600,
      height: 1600,
      canvasStyle: 'width: 800px;height:800px',
      backgroundColor: '#fef9c3',
    });
  }

  destroyGame() {
    this.game?.destroy(true);
  }
}

class MainScene extends Phaser.Scene {
  private body: Array<Body> = [];
  private bodySize = 80;
  private direction: Direction = Direction.RIGHT;
  private speed = 8;
  private movePoints: Array<Position> = [];

  constructor() {
    super({ key: 'MainScene' });
  }

  init() {
    this.body = [];
  }

  create() {
    const { width, height } = this.scale.gameSize;
    // init body
    const head: Body = { x: width / 2, y: height / 2, gameObject: null, pIndex: 0 };
    const body = [head];
    this.movePoints.push({ x: head.x, y: head.y });
    Array(4)
      .fill(1)
      .forEach((_, index) => {
        const prev = body[index];
        const curr: Body = {
          x: prev.x - this.bodySize,
          y: prev.y,
          gameObject: null,
          pIndex: 0,
        };
        body.push(curr);
        let len = this.speed;
        while (len <= this.bodySize) {
          this.movePoints.push({ x: prev.x - len, y: prev.y });
          len += this.speed;
        }
        curr.pIndex = this.movePoints.length - 1;
      });
    body.forEach((b) => (b.gameObject = this.add.circle(b.x, b.y, this.bodySize / 2, 0x0ea5e9)));
    this.body = body;
    // listen event
    this.input.keyboard?.on('keydown-UP', () => {
      if (this.direction === Direction.DOWN) return;
      this.direction = Direction.UP;
    });
    this.input.keyboard?.on('keydown-LEFT', () => {
      if (this.direction === Direction.RIGHT) return;
      this.direction = Direction.LEFT;
    });
    this.input.keyboard?.on('keydown-DOWN', () => {
      if (this.direction === Direction.UP) return;
      this.direction = Direction.DOWN;
    });
    this.input.keyboard?.on('keydown-RIGHT', () => {
      if (this.direction === Direction.LEFT) return;
      this.direction = Direction.RIGHT;
    });
  }

  update() {
    this.moveSnake();
  }

  moveSnake() {
    // move head
    this.moveHead(this.body[0]);
    // move body
    for (let i = 1; i < this.body.length; i++) {
      const body = this.body[i];
      const nextPosition = this.movePoints[body.pIndex];
      body.x = nextPosition.x;
      body.y = nextPosition.y;
      body.gameObject?.setPosition(body.x, body.y);
      if (i === this.body.length - 1) {
        this.movePoints.pop();
      }
    }
  }

  getDirection(p1: Position, p2: Position) {
    if (p2.x === p1.x && p2.y === p1.y) return null;
    if (p2.x > p1.x) return Direction.RIGHT;
    if (p2.x < p1.x) return Direction.LEFT;
    if (p2.y > p1.y) return Direction.DOWN;
    if (p2.y < p1.y) return Direction.UP;
  }

  moveHead(body: Body) {
    const { width, height } = this.scale.gameSize;
    if (this.direction === Direction.RIGHT) body.x += this.speed;
    if (this.direction === Direction.LEFT) body.x -= this.speed;
    if (this.direction === Direction.UP) body.y -= this.speed;
    if (this.direction === Direction.DOWN) body.y += this.speed;
    if (body.x > width + this.bodySize / 2) body.x = 0;
    if (body.x < -this.bodySize / 2) body.x = width;
    if (body.y > height + this.bodySize / 2) body.y = 0;
    if (body.y < -this.bodySize / 2) body.y = height;
    body.gameObject?.setPosition(body.x, body.y);
    this.movePoints.unshift({ x: body.x, y: body.y });
  }
}
