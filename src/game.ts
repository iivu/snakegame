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
  direction: Direction;
  pIndex: number;
  middleLine: number[];
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
  private bodyPolygon: Phaser.GameObjects.Graphics | null = null;
  // input lock
  private inputLock = false;
  private distanceAfterLastInput = 0;
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
      direction: Direction.RIGHT,
      middleLine: [],
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
          direction: Direction.RIGHT,
          middleLine: [],
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
      b.middleLine = this.getMiddleLine(b, index);
      if (index === 0 || index === this.body.length - 1) {
        b.gameObject = this.add.circle(
          b.x,
          b.y,
          Phaser.Math.Distance.Between(b.middleLine[0], b.middleLine[1], b.middleLine[2], b.middleLine[3]) / 2,
          0x0ea5e9,
        );
      }
    });
    this.bodyPolygon = this.add.graphics({ fillStyle: { color: 0x0ea5e9 } });
    // listen event
    this.input.keyboard?.on('keydown-UP', () => this.processCursorKey(Direction.UP));
    this.input.keyboard?.on('keydown-LEFT', () => this.processCursorKey(Direction.LEFT));
    this.input.keyboard?.on('keydown-DOWN', () => this.processCursorKey(Direction.DOWN));
    this.input.keyboard?.on('keydown-RIGHT', () => this.processCursorKey(Direction.RIGHT));
    // test
    this.testSmoothPath();
  }

  update() {
    // this.moveSnake();
    // this.updateBodyPolygon();
    // this.processInputLock();
    this.debug();
  }

  processCursorKey(direction: Direction) {
    if (this.inputLock) return;
    if (
      (direction === Direction.UP && this.direction !== Direction.DOWN) ||
      (direction === Direction.DOWN && this.direction !== Direction.UP) ||
      (direction === Direction.LEFT && this.direction !== Direction.RIGHT) ||
      (direction === Direction.RIGHT && this.direction !== Direction.LEFT)
    ) {
      this.direction = direction;
      this.inputLock = true;
    }
  }

  processInputLock() {
    if (this.inputLock) {
      this.distanceAfterLastInput += this.speed;
      if (this.distanceAfterLastInput >= this.bodySize) {
        this.distanceAfterLastInput = 0;
        this.inputLock = false;
      }
    }
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
      body.direction = this.getDirection(nextPosition, this.movePoints[body.pIndex - 1])!;
      body.gameObject?.setPosition(body.x, body.y);
      body.middleLine = this.getMiddleLine(body, i);
      if (i === this.body.length - 1) {
        this.movePoints.pop();
      }
    }
  }

  updateBodyPolygon() {
    this.bodyPolygon?.clear();
    this.bodyPolygon?.beginPath();
    this.getBodyPolygon().forEach((p, index) => {
      if (index === 0) {
        this.bodyPolygon?.moveTo(p.x, p.y);
      } else {
        this.bodyPolygon?.lineTo(p.x, p.y);
      }
    });
    this.bodyPolygon?.closePath();
    this.bodyPolygon?.fillPath();
  }

  getMiddleLine(body: Body, index: number): number[] {
    const length = this.body.length * 5;
    const angle = Math.atan2(this.bodySize / 2, length * this.bodySize);
    const t = Math.tan(angle) * ((length - index) * this.bodySize);
    if (body.direction === Direction.RIGHT) return [body.x, body.y - t, body.x, body.y + t];
    if (body.direction === Direction.UP) return [body.x - t, body.y, body.x + t, body.y];
    if (body.direction === Direction.LEFT) return [body.x, body.y + t, body.x, body.y - t];
    if (body.direction === Direction.DOWN) return [body.x + t, body.y, body.x - t, body.y];
    return [];
  }

  getBodyPolygon(): Position[] {
    const r: Position[] = [];
    for (let i = 0; i < this.body.length; i++) {
      const body = this.body[i];
      r.push({ x: body.middleLine[0], y: body.middleLine[1] });
    }
    for (let i = this.body.length - 1; i >= 0; i--) {
      const body = this.body[i];
      r.push({ x: body.middleLine[2], y: body.middleLine[3] });
    }
    return r;
  }

  moveHead(body: Body) {
    const { width, height } = this.scale.gameSize;
    body.direction = this.direction;
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

  getDirection(p1: Position, p2: Position) {
    if (p2.x === p1.x && p2.y === p1.y) return null;
    if (p2.x > p1.x) return Direction.RIGHT;
    if (p2.x < p1.x) return Direction.LEFT;
    if (p2.y > p1.y) return Direction.DOWN;
    if (p2.y < p1.y) return Direction.UP;
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

  testSmoothPath() {
    const points = [
      { x: 100, y: 100 },
      { x: 200, y: 50 },
      { x: 300, y: 100 },
      { x: 400, y: 150 },
      { x: 500, y: 200 },
      { x: 300, y: 400 },
    ];
    // const smoothPoints = generateBezierPoints(points, 100);
    let graphics = this.add.graphics({ lineStyle: { width: 2, color: 0xff0000 } });
    let graphicsSmooth = this.add.graphics({ lineStyle: { width: 2, color: 0x0000ff } });

    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    points.forEach((p) => graphics.lineTo(p.x, p.y));
    graphics.strokePath();

    graphicsSmooth.beginPath();
    graphicsSmooth.moveTo(points[0].x, points[0].y);
    points.forEach((p) => {

    });
    graphicsSmooth.strokePath();
  }
}

function generateBezierPoints(points: Position[], segments: number) {
  let result = [];

  for (let i = -1; i < points.length - 2; i++) {
    let p0 = points[Math.max(i, 0)];
    let p1 = points[i + 1];
    let p2 = points[i + 2];
    let p3 = points[Math.min(i + 3, points.length - 1)];

    for (let t = 0; t <= segments; t++) {
      let tNormalized = t / segments;
      let t2 = tNormalized * tNormalized;
      let t3 = t2 * tNormalized;

      let x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * tNormalized + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

      let y = 0.5 * (2 * p1.y + (-p0.y + p2.y) * tNormalized + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

      result.push({ x, y });
    }
  }

  return result;
}
