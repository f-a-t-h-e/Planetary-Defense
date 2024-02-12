const COMPLETE_TURN = Math.PI * 2;
export class Enemy {
  /**
   *
   * @param {import("./main").Game} game
   */
  constructor(
    game,
    {
      health = 1,
      score = 1,
      frameX = 0,
      frameY = 0,
      maxFrameX = 0,
      maxFrameY = 0,
      image,
      speed = 1,
      angle = 0,
      rotationSpeed = 0,
      destroyFrameX = 0,
      destroyFrameY = 0,
      explosionFrames = 0,
    }
  ) {
    this.game = game;
    this.x = 100;
    this.y = 100;
    this.radius = 40;
    this.width = this.radius * 2;
    this.height = this.radius * 2;
    /**
     * @type {HTMLImageElement}
     */
    this.image = image;
    this.frameX = frameX;
    this.frameY = frameY;
    this.maxFrameX = maxFrameX;
    this.maxFrameY = maxFrameY;
    this.destroyFrameX = destroyFrameX;
    this.destroyFrameY = destroyFrameY;
    this.explosionFrames = explosionFrames;
    this.defaultExplosionFrames = explosionFrames;
    this.health = health;
    this.maxHealth = health;
    this.score = score;
    this.speedX = 0;
    this.speedY = 0;
    this.speed = speed;
    this.defaultSpeed = speed;
    this.angle = angle;
    this.rotationSpeed = rotationSpeed;
    this.defaultRotationSpeed = rotationSpeed;
    this.free = true;
    this.colliededPlayer = false;
  }

  start({
    speed = this.defaultSpeed,
    health = this.maxHealth,
    frameY = Math.floor(Math.random() * this.maxFrameY),
    frameX = 0,
    explosionFrames = this.defaultExplosionFrames,
    rotationSpeed = this.defaultRotationSpeed,
    colliededPlayer = false,
    angle,
  }) {
    // console.log({
    //     speed ,
    //     health ,
    //     frameY ,
    //     frameX ,
    //     explosionFrames ,
    //     rotationSpeed ,

    //   });
    this.speed = speed;
    this.health = health;
    this.frameY = frameY;
    this.frameX = frameX;
    this.explosionFrames = explosionFrames;
    this.rotationSpeed = rotationSpeed;

    if (Math.random() < 0.5) {
      this.x = Math.random() * this.game.width;
      this.y =
        Math.random() < 0.5 ? this.game.height + this.radius : -this.radius;
    } else {
      this.x =
        Math.random() < 0.5 ? this.game.width + this.radius : -this.radius;
      this.y = Math.random() * this.game.height;
    }
    const aim = this.game.calcAim(this, this.game.planet);
    this.speedX = -speed * aim.aimX;
    this.speedY = -speed * aim.aimY;
    this.angle =
      typeof angle === "number"
        ? angle
        : Math.atan2(aim.dy, aim.dx) + Math.PI * 0.5;
    this.free = false;
    this.colliededPlayer = colliededPlayer;
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
    context.translate(this.x, this.y);
    context.rotate(this.angle);
    context.drawImage(
      this.image,
      this.frameX * this.width,
      this.frameY * this.height,
      this.width,
      this.height,
      -this.radius,
      -this.radius,
      this.width,
      this.height
    );
    if (this.game.debug) {
      context.strokeRect(0, 0, this.radius, this.radius);
      context.beginPath();
      context.arc(0, 0, this.radius, 0, COMPLETE_TURN);
      context.stroke();
      context.restore();
      context.save();
      //   this.drawStatus(context);
      this.writeStatus(context);
    }
    context.restore();
  }

  /**
   *
   * @param {CanvasRenderingContext2D} context
   */
  drawStatus(context) {
    // Define the dimensions and position of the health bar
    const barWidth = 100; // Width of the health bar
    const barHeight = 10; // Height of the health bar
    const barX = this.x - this.radius; // X position of the health bar
    const barY = this.y - 20; // Y position of the health bar (adjust as needed)

    // Calculate the percentage of current health relative to max health
    const healthPercentage = this.health / this.maxHealth;

    // Draw the background of the health bar
    context.fillStyle = "gray";
    context.fillRect(barX, barY, barWidth, barHeight);

    // Draw the actual health bar
    context.fillStyle = "green";
    context.fillRect(barX, barY, barWidth * healthPercentage, barHeight);

    // Optionally, you can also draw the text for current and max health
    context.fillStyle = "red";
    context.fillText(
      Math.round(this.health) + " / " + this.maxHealth,
      barX,
      barY - 10
    );
  }
  /**
   *
   * @param {CanvasRenderingContext2D} context
   */
  writeStatus(context) {
    context.textAlign = "center";
    context.fillStyle = "white";
    context.font = "50px Protest Revolution";
    context.fillText(Math.round(this.health), this.x, this.y - 20);
  }
  update() {
    if (this.health > 0) {
      this.x += this.speedX;
      this.y += this.speedY;
      this.angle += this.rotationSpeed;

      // against projectiles
      if (this.game.applyProjectilesCollision(this)) {
        // show receiving damage reaction
      } else {
        this.applyDestroy(1);
        return;
      }
      // against the player
      if (this.game.checkCollision(this, this.game.player)) {
        if (!this.colliededPlayer) {
          this.colliededPlayer = true;
          //   const enemyHealth = this.health;
          this.hit(!!this.game.player.health);
          this.game.player.hit(1);
          if (this.game.player.health <= 0) {
            this.game.player.applyDestroy();
            this.colliededPlayer = false;
          }
          this.game.scoreModifier(-this.score);
          if (this.health <= 0) {
            this.applyDestroy(0);
            return;
          }
        }
      } else {
        this.colliededPlayer = false;
      }
      // against the planet
      if (this.game.checkCollision(this, this.game.planet)) {
        this.speedX = 0;
        this.speedY = 0;
        if (this.game.spriteUpdate) {
          this.hit(1);
          this.game.planet.hit(1);
          if (this.game.planet.health <= 0) {
            this.game.planet.applyDestroy()
          }
          if (this.health <= 0) {
            this.applyDestroy(0);
            return;
          }
        }
      }
    } else {
      this.destroyed();
    }
  }
  /**
   *
   * @param {number} damage
   */
  hit(damage) {
    this.health -= damage;
    this.frameX =
      this.destroyFrameX -
      Math.ceil(this.destroyFrameX * (this.health / this.maxHealth));
  }

  /**
   * This has to run even if paused
   * @param {1|-|-1} increase
   */
  applyDestroy(increase = 0) {
    this.frameX = this.destroyFrameX;
    this.health = 0;
    this.game.scoreModifier(this.score * increase);
  }
  destroyed() {
    if (this.game.spriteUpdate) {
      if (this.explosionFrames) {
        --this.explosionFrames;
        ++this.frameX;
      } else {
        this.reset();
      }
    }
  }
}

export class Asteroid extends Enemy {
  /**
   *
   * @param {import("./main").Game} game
   */
  constructor(game) {
    super(game, {
      image: document.getElementById("asteroid"),
      health: 1,
      score: 1,
      maxFrameY: 4,
      frameX: 0,
      maxFrameX: 7,
      rotationSpeed: COMPLETE_TURN * 0.01 * Math.random(),
      destroyFrameX: 1,
      explosionFrames: 6,
      speed: 1 * randBetween(0.5, 0.7),
    });
  }
}
export class Lobstermorph extends Enemy {
  /**
   *
   * @param {import("./main").Game} game
   */
  constructor(game) {
    super(game, {
      image: document.getElementById("lobstermorph"),
      health: 8,
      score: 5,
      maxFrameY: 4,
      frameX: 0,
      maxFrameX: 14,
      rotationSpeed: 0,
      destroyFrameX: 8,
      explosionFrames: 6,
      speed: 1 * randBetween(0.5, 0.7),
    });
  }
}
export class Beetlemorph extends Enemy {
  /**
   *
   * @param {import("./main").Game} game
   */
  constructor(game) {
    super(game, {
      image: document.getElementById("beetlemorph"),
      health: 2,
      score: 1,
      maxFrameY: 4,
      frameX: 0,
      maxFrameX: 3,
      rotationSpeed: 0,
      destroyFrameX: 2,
      explosionFrames: 1,
      speed: 1 * randBetween(0.5, 0.7),
    });
  }
}
export class Rhinomorph extends Enemy {
  /**
   *
   * @param {import("./main").Game} game
   */
  constructor(game) {
    super(game, {
      image: document.getElementById("rhinomorph"),
      health: 5,
      score: 3,
      maxFrameY: 4,
      frameX: 0,
      maxFrameX: 6,
      rotationSpeed: 0,
      destroyFrameX: 5,
      explosionFrames: 1,
      speed: 1 * randBetween(0.5, 0.7),
    });
  }
}

function randBetween(fromNum, ratioNum) {
    return Math.random() * ratioNum + fromNum
}