const COMPLETE_TURN = Math.PI * 2;
export class Player {
  /**
   *
   * @param {import("./main").Game} game
   */
  constructor(game) {
    this.game = game;
    this.radius = 40;
    this.x = this.game.width * 0.5;
    this.y = this.game.height * 0.5;
    this.positionRadius = this.radius + this.game.planet.radius;
    this.image = document.getElementById("player");

    this.aim = {
      aimX: 0,
      aimY: 0,
      dx: 0,
      dy: 0,
    };

    this.angle = 0;

    this.projectileSpeed = -10;
    this.shootSpeed = 1;
    this.shootCharge = 5;
    this.projectilePower = 1;
    this.keyMap = {
      left: "ArrowLeft",
      right: "ArrowRight",
      up: "ArrowUp",
      down: "ArrowDown",
      shoot: "Space",
      smallLaser: "1",
      smallFocusedLaser: "2",
      bigLaser: "3",
      bigFocusedLaser: "4",
    };
    this.health = 10;
    this.maxHealth = 10;
    // this.frameX = 1;
    // this.destroyFrameX = 2;
  }

  update() {
    this.aim = this.game.calcAim(this.game.planet, this.game.mouse);
    this.x = this.game.planet.x - this.positionRadius * this.aim.aimX;
    this.y = this.game.planet.y - this.positionRadius * this.aim.aimY;
    this.angle = Math.atan2(this.aim.dy, this.aim.dx);

    if (this.shootCharge < 10) {
      this.shootCharge = this.shootCharge + this.shootSpeed;
    }
    if (this.game.keys[this.keyMap.shoot] && this.shootCharge >= 10) {
      this.shoot();
      this.shootCharge = 0;
      // this.frameX = 1;
    }
  }

  /**
   *
   * @param {CanvasRenderingContext2D} context
   */
  draw(context) {
    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.angle);
    context.drawImage(this.image, -this.radius, -this.radius);
    if (this.game.debug) {
      context.strokeRect(0, 0, this.radius, this.radius);
      context.beginPath();
      context.arc(0, 0, this.radius, 0, COMPLETE_TURN);
      context.stroke();
    }
    context.restore();
  }

  shoot() {
    const projectile = this.game.projectilesPool.find((p) => p.free);
    if (projectile) {
      projectile.start({
        x: this.x - this.radius * this.aim.aimX,
        y: this.y - this.radius * this.aim.aimY,
        aimX: this.aim.aimX,
        aimY: this.aim.aimY,
        speed: this.projectileSpeed,
        power: this.projectilePower,
      });
    }
  }

  hit(damage) {
    this.health -= damage;
  }
  applyDestroy(decrease = 0) {
    // this.frameX = this.destroyFrameX;
    this.health = 0;
    // this.shootSpeed = 0;
  }
  /**
   *
   * @param {number} health
   */
  heal(health) {
    this.health += health;
    if (this.health > this.maxHealth) {
      this.health = this.maxHealth;
    }
  }
}
