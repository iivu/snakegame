import * as Phaser from 'phaser';

const { Vector2, Distance } = Phaser.Math;

type TVector2 = Phaser.Math.Vector2;

enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

export class Game {
  private game: Phaser.Game | null = null;

  initGame() {
    this.game = new Phaser.Game({
      parent: 'game-container',
      scene: MainScene,
      type: Phaser.CANVAS,
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
  private direction: Direction = Direction.RIGHT;
  private head: TVector2 = Vector2.ZERO;
  private tail: TVector2 = Vector2.ZERO;
  private breakPoints: Array<{ pos: TVector2; direction: Direction }> = [];
  private headGraphics: Phaser.GameObjects.Arc | null = null;
  private tailGraphics: Phaser.GameObjects.Arc | null = null;
  private bodyGraphics: Phaser.GameObjects.Graphics | null = null;
  private bodySize = 60;
  private bodyCount = 8;
  private baseSpeed = 10;
  private rightSpeed: TVector2 = Vector2.ZERO;
  private upSpeed: TVector2 = Vector2.ZERO;
  private downSpeed: TVector2 = Vector2.ZERO;
  private leftSpeed: TVector2 = Vector2.ZERO;
  // input lock
  private inputLock = false;
  private distanceAfterLastInput = 0;
  // colors
  private readonly primaryColor = 0x0ea5e9;
  // debug
  private debugLine: Phaser.GameObjects.Graphics | null = null;

  init() {
    const { width, height } = this.scale.gameSize;
    this.head = new Vector2(width / 2, height / 2);
    this.tail = new Vector2(width / 2 - this.bodySize * this.bodyCount, height / 2);
    this.rightSpeed = new Vector2(this.baseSpeed, 0);
    this.upSpeed = new Vector2(0, -this.baseSpeed);
    this.leftSpeed = new Vector2(-this.baseSpeed, 0);
    this.downSpeed = new Vector2(0, this.baseSpeed);
  }

  create() {
    this.headGraphics = this.add.circle(this.head.x, this.head.y, this.bodySize / 2, this.primaryColor);
    this.tailGraphics = this.add.circle(this.head.x, this.head.y, this.bodySize / 2, this.primaryColor);
    this.bodyGraphics = this.add.graphics({ lineStyle: { width: this.bodySize, color: this.primaryColor } });
    // listen event
    this.input.keyboard?.on('keydown-UP', () => this.processCursorKey(Direction.UP));
    this.input.keyboard?.on('keydown-LEFT', () => this.processCursorKey(Direction.LEFT));
    this.input.keyboard?.on('keydown-DOWN', () => this.processCursorKey(Direction.DOWN));
    this.input.keyboard?.on('keydown-RIGHT', () => this.processCursorKey(Direction.RIGHT));
  }

  update() {
    this.moveHead();
    this.breakPoints.length > 0 ? this.updateTailWithBreakPoints() : this.updateTail();
    this.updateBody();
    this.processInputLock();
    // this.debug();
  }

  private moveHead() {
    const { head, rightSpeed, leftSpeed, upSpeed, downSpeed, direction, bodySize, headGraphics } = this;
    const { width, height } = this.scale.gameSize;
    if (direction === Direction.RIGHT) head.add(rightSpeed!);
    if (direction === Direction.LEFT) head.add(leftSpeed!);
    if (direction === Direction.UP) head.add(upSpeed!);
    if (direction === Direction.DOWN) head.add(downSpeed!);
    if (head.x > width + bodySize / 2) head.x = 0;
    if (head.x < -bodySize / 2) head.x = width;
    if (head.y > height + bodySize / 2) head.y = 0;
    if (head.y < -bodySize / 2) head.y = height;
    if (headGraphics !== null) {
      headGraphics.setPosition(head.x, head.y);
    }
  }

  private updateTail() {
    const bodyLength = this.bodySize * this.bodyCount;
    this.tail = this.head.clone();
    this.positionTail(this.direction, bodyLength);
    if (this.tailGraphics) {
      this.tailGraphics.setPosition(this.tail.x, this.tail.y);
    }
  }

  private updateTailWithBreakPoints() {
    const p = this.breakPoints[this.breakPoints.length - 1];
    const bodyLength = this.bodyCount * this.bodySize;
    let d = Distance.Between(this.head.x, this.head.y, p.pos.x, p.pos.y);
    if (d >= bodyLength) {
      this.breakPoints = [];
      this.updateTail();
      return;
    }
    let index = this.breakPoints.length - 1;
    while (index > 0) {
      const curr = this.breakPoints[index];
      const prev = this.breakPoints[index - 1];
      const _d = Distance.Between(prev.pos.x, prev.pos.y, curr.pos.x, curr.pos.y);
      if (d + _d >= bodyLength) {
        this.breakPoints = this.breakPoints.slice(index);
        break;
      } else {
        d += _d;
        index--;
      }
    }
    this.tail = this.breakPoints[0].pos.clone();
    this.positionTail(this.breakPoints[0].direction, bodyLength - d);
    if (this.tailGraphics) {
      this.tailGraphics.setPosition(this.tail.x, this.tail.y);
    }
  }

  private updateBody() {
    this.bodyGraphics?.clear().moveTo(this.head.x, this.head.y);
    for (let i = this.breakPoints.length - 1; i >= 0; i--) {
      const p = this.breakPoints[i];
      this.bodyGraphics?.lineTo(p.pos.x, p.pos.y);
    }
    this.bodyGraphics?.lineTo(this.tail.x, this.tail.y);
    this.bodyGraphics?.strokePath();
  }

  private positionTail(direction: Direction, bodyLength: number) {
    switch (direction) {
      case Direction.UP:
        this.tail.add(this.getMoveVector(Vector2.DOWN.clone(), bodyLength));
        break;
      case Direction.DOWN:
        this.tail.add(this.getMoveVector(Vector2.UP.clone(), bodyLength));
        break;
      case Direction.LEFT:
        this.tail.add(this.getMoveVector(Vector2.RIGHT.clone(), bodyLength));
        break;
      case Direction.RIGHT:
        this.tail.add(this.getMoveVector(Vector2.LEFT.clone(), bodyLength));
        break;
    }
  }

  private processCursorKey(direction: Direction) {
    if (this.inputLock) return;
    if (
      (direction === Direction.UP && this.direction !== Direction.DOWN) ||
      (direction === Direction.DOWN && this.direction !== Direction.UP) ||
      (direction === Direction.LEFT && this.direction !== Direction.RIGHT) ||
      (direction === Direction.RIGHT && this.direction !== Direction.LEFT)
    ) {
      this.breakPoints.push({ pos: this.head.clone(), direction: this.direction });
      this.direction = direction;
      this.inputLock = true;
    }
  }

  private processInputLock() {
    if (this.inputLock) {
      this.distanceAfterLastInput += this.baseSpeed;
      if (this.distanceAfterLastInput >= this.bodySize) {
        this.distanceAfterLastInput = 0;
        this.inputLock = false;
      }
    }
  }

  private getMoveVector(direction: TVector2, distance: number) {
    return direction.multiply(new Vector2(distance, distance));
  }

  private debug() {
    if (this.debugLine === null) {
      this.debugLine = this.add.graphics({ lineStyle: { width: 2, color: 0xff0000 } });
    }
    this.debugLine.clear().moveTo(this.head.x, this.head.y);
    for (let i = this.breakPoints.length - 1; i >= 0; i--) {
      const p = this.breakPoints[i];
      this.debugLine.lineTo(p.pos.x, p.pos.y);
    }
    this.debugLine.lineTo(this.tail.x, this.tail.y);
    this.debugLine.strokePath();
  }
}
