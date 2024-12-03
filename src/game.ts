import * as Phaser from 'phaser';

enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

type Position = { x: number; y: number };
type Body = Position & {
  gameObject: Phaser.GameObjects.Arc | null;
  pIndex: number;
  direction: Direction;
  midLine: Position[];
};

export class Game {
  private game: Phaser.Game | null = null;

  initGame() {
    this.game = new Phaser.Game({
      parent: 'game-container',
      scene: MainScene,
      type: Phaser.AUTO,
      width: 1600,
      height: 1600,
      canvasStyle: 'width: 100%;height:100%',
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
  private speed = 2;
  private movePoints: Array<Position> = [];
  private bodyPolygon: Phaser.GameObjects.Graphics | null = null;

  // debug
  private midLines: Array<Phaser.GameObjects.Graphics> = [];
  private line: Phaser.GameObjects.Graphics | null = null;

  constructor() {
    super('MainScene');
  }

  init() {
    this.body = [];
    this.movePoints = [];
  }

  create() {
    const { width, height } = this.scale.gameSize;
    // init body
    const head: Body = {
      x: width / 2,
      y: height / 2,
      gameObject: null,
      pIndex: 0,
      midLine: [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ],
      direction: Direction.RIGHT,
    };
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
          midLine: [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
          ],
          direction: Direction.RIGHT,
        };
        body.push(curr);
        let len = this.speed;
        while (len <= this.bodySize) {
          this.movePoints.push({ x: prev.x - len, y: prev.y });
          len += this.speed;
        }
        curr.pIndex = this.movePoints.length - 1;
      });
    this.body = body;
    this.body.forEach((b, index) => {
      this.updateMidLine(b, index);
      if (index === 0 || index === this.body.length - 1) {
        b.gameObject = this.add.circle(b.x, b.y, Phaser.Math.Distance.Between(b.midLine[0].x, b.midLine[0].y, b.midLine[1].x, b.midLine[1].y) / 2, 0x0ea5e9);
      }
    });
    this.bodyPolygon = this.add.graphics({ fillStyle: { color: 0x0ea5e9 } });
    // this.updateBodyPolygon();
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
    console.log(this.body);
  }

  update() {
    this.moveSnake();
    // this.updateBodyPolygon();
    this.debug();
  }

  moveSnake() {
    // move head
    this.moveHead(this.body[0]);
    this.updateMidLine(this.body[0], 0);
    // move body
    for (let i = 1; i < this.body.length; i++) {
      const body = this.body[i];
      const nextPosition = this.movePoints[body.pIndex];
      body.x = nextPosition.x;
      body.y = nextPosition.y;
      body.gameObject?.setPosition(body.x, body.y);
      body.direction = this.getDirection(nextPosition, this.movePoints[body.pIndex - 1])!;
      this.updateMidLine(body, i);
      if (i === this.body.length - 1) {
        this.movePoints.pop();
      }
    }
  }

  updateMidLine(body: Body, index: number) {
    const vl = this.body.length * 5;
    const angle = Math.atan2(this.bodySize / 2, this.bodySize * (vl - 1) + this.bodySize / 2);
    const t = (this.bodySize * (vl - (index + 1)) + this.bodySize / 2) * Math.tan(angle);
    if (body.direction === Direction.RIGHT) {
      body.midLine[0].x = body.midLine[1].x = body.x;
      body.midLine[0].y = body.y - t;
      body.midLine[1].y = body.y + t;
    }
    if (body.direction === Direction.LEFT) {
      body.midLine[0].x = body.midLine[1].x = body.x;
      body.midLine[0].y = body.y + t;
      body.midLine[1].y = body.y - t;
    }
    if (body.direction === Direction.UP) {
      body.midLine[0].y = body.midLine[1].y = body.y;
      body.midLine[0].x = body.x - t;
      body.midLine[1].x = body.x + t;
    }
    if (body.direction === Direction.DOWN) {
      body.midLine[0].y = body.midLine[1].y = body.y;
      body.midLine[0].x = body.x + t;
      body.midLine[1].x = body.x - t;
    }
  }

  updateBodyPolygon() {
    if (this.bodyPolygon === null) return;
    const points: Position[] = [];
    for (let i = 0; i < this.body.length; i++) {
      const body = this.body[i];
      points.push(body.midLine[0]);
    }
    for (let i = this.body.length - 1; i >= 0; i--) {
      const body = this.body[i];
      points.push(body.midLine[1]);
    }
    this.bodyPolygon.clear();
    points.forEach((p, index) => {
      if (index === 0) {
        this.bodyPolygon?.moveTo(p.x, p.y);
      } else {
        this.bodyPolygon?.lineTo(p.x, p.y);
      }
    });
    this.bodyPolygon.closePath();
    this.bodyPolygon.fillPath();
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
    body.direction = this.direction;
    this.movePoints.unshift({ x: body.x, y: body.y });
  }

  debug() {
    if (this.midLines.length <= 0) {
      this.body.forEach(() => this.midLines.push(this.add.graphics({ lineStyle: { color: 0xff0000, width: 2 } })));
    }
    if (this.line === null) {
      this.line = this.add.graphics({ lineStyle: { color: 0xff0000, width: 2 } });
    }
    // this.midLines.forEach((g, index) => {
    //   const { midLine } = this.body[index];
    //   g.clear();
    //   g.beginPath();
    //   g.moveTo(midLine[0].x, midLine[0].y);
    //   g.lineTo(midLine[1].x, midLine[1].y);
    //   g.closePath();
    //   g.strokePath();
    // });
    this.line.clear();
    this.body.forEach((b, index) => {
      if (index === 0) {
        this.line?.moveTo(b.x, b.y);
      } else {
        this.line?.lineTo(b.x, b.y);
      }
    });
    this.line.strokePath();
  }

  getDirection(p1: Position, p2: Position) {
    if (p2.x === p1.x && p2.y === p1.y) return null;
    if (p2.x > p1.x) return Direction.RIGHT;
    if (p2.x < p1.x) return Direction.LEFT;
    if (p2.y > p1.y) return Direction.DOWN;
    if (p2.y < p1.y) return Direction.UP;
  }
}
