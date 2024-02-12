const COMPLETE_TURN = Math.PI * 2;
export class Projectile {
  /**
   *
   * @param {import("./main").Game} game
   */
  constructor(game) {
    this.game = game;
    this.x = this.game.width * 0.5;
    this.y = this.game.height * 0.5;
    this.radius = 5;
    this.speedX = 1;
    this.speedY = 1;
    this.free = true;
    this.power = 0;
  }

  start({x, y, aimX, aimY, speed = -5, power = 1}) {
    this.power = power;
    this.x = x;
    this.y = y;
    this.speedX = speed * aimX;
    this.speedY = speed * aimY;
    this.free = false;
  }
  reset() {
    this.free = true;
  }

  /**
   *
   * @param {CanvasRenderingContext2D} context
   */
  draw(context) {
    context.save();
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, COMPLETE_TURN);
    context.fillStyle = "gold";
    context.fill();
    context.restore();
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (!this.game.isInside(this)) {
      this.reset();
    }
  }
}
