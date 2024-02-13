import {
  Asteroid,
  Beetlemorph,
  Enemy,
  Lobstermorph,
  Rhinomorph,
} from "./enemy.js";
import { Player } from "./player.js";
import { Projectile } from "./weapon.js";

const COMPLETE_TURN = Math.PI * 2;

export class Planet {
  /**
   *
   * @param {Game} game
   */
  constructor(game) {
    this.game = game;
    this.radius = 80;
    this.x = this.game.width * 0.5;
    this.y = this.game.height * 0.5;
    this.possitionX = this.x - 100;
    this.possitionY = this.y - 100;
    this.image = document.getElementById("planet");
    this.health = 25;
    this.maxHealth = 25;
    this.healthBarWidth = 250;
    this.healthBarHeight = 10;
    this.healthBarX = (this.game.width - this.healthBarWidth) * 0.5;
    this.healthBarY = 50;
  }

  /**
   *
   * @param {CanvasRenderingContext2D} context
   */
  draw(context) {
    context.drawImage(this.image, this.possitionX, this.possitionY);
    if (this.game.debug) {
      context.strokeRect(this.x, this.y, this.radius, this.radius);
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, COMPLETE_TURN);
      context.stroke();
    }
  }

  /**
   *
   * @param {number} damage
   */
  hit(damage) {
    if (this.game.paused) {
      this.hit = this._pausedHit;
    } else {
      this.hit = this._runningHit;
    }
    this.hit(damage);
  }
  _runningHit(damage) {
    this.health -= damage;
  }
  _pausedHit(damage) {}

  applyDestroy() {
    this.health = 0;
    this.game.scoreModifier(-Infinity);
  }

  // Function to get color based on health level
  getHealthStates() {
    // Calculate the ratio of current health to max health
    const healthRatio = this.health / this.maxHealth;

    // Interpolate between green (100% health) and red (0% health)
    const red = Math.floor(255 * (1 - healthRatio));
    const green = Math.floor(255 * healthRatio);
    const blue = 0;

    // Return the color string
    return { color: `rgb(${red}, ${green}, ${blue})`, ratio: healthRatio };
  }

  /**
   *
   * @param {CanvasRenderingContext2D} context
   */
  drawStatus(context) {
    const healthStates = this.getHealthStates();
    context.save();
    context.strokeRect(
      this.healthBarX,
      this.healthBarY,
      this.healthBarWidth + 2,
      this.healthBarHeight + 2
    );
    // context.fillStyle = "rgb(204, 51, 0)";
    context.shadowOffsetY = 0;
    // context.fillRect(21 + 0.4 * this.maxHealth, this.healthBarY, 1, 15);
    context.restore();

    context.save();
    context.fillStyle = healthStates.color;
    context.fillRect(
      this.healthBarX + 1,
      this.healthBarY + 1,
      this.healthBarWidth * healthStates.ratio,
      this.healthBarHeight
    );
    context.restore();
  }
}
export class Game {
  /**
   *
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.planet = new Planet(this);
    this.player = new Player(this);
    this.keys = {};

    /**
     * @type {Projectile[]}
     */
    this.projectilesPool = [];
    this.numberOfProjectiles = 35;
    this.createProjectiles();

    /**
     * @type {Enemy[]}
     */
    this.enemiesPool = [];
    this.numberOfEnemies = 25;
    this.enemyTimer = 0;
    this.enemyInterval = 1000;
    this.createEnemies();
    for (let i = 0; i < 3; i++) {
      this.enemiesPool[i].start({});
    }

    this.waveCount = 0;
    this.bossCount = 0;

    this.columns = 1;
    this.rows = 1;
    this.enemySize = 80;

    this.spriteUpdate = false;
    this.spriteTimer = 0;
    this.spriteInterval = 150;
    // this.spriteInterval = 500;

    this.score = 0;
    this.gameOver = false;
    this.winningScore = 10;
    this.level = 1;
    this.paused = true;

    this.mouse = {
      x: this.width * 0.5,
      y: this.height * 0.5,
    };

    // const canvasX = ;
    // const canvasY = ;
    // Event listeners
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.offsetX;
      this.mouse.y = e.offsetY;
      // console.log(console.log(this.player.aim));
      // this.player.shoot();
    });
    window.addEventListener("mousedown", (e) => {
      this.keys[this.player.keyMap.shoot] = true;
      // this.togglePaused()
    });
    window.addEventListener("mouseup", (e) => {
      this.keys[this.player.keyMap.shoot] = false;
    });

    this.debug = false;
    this.paused = false;
  }

  togglePaused() {
    this.paused = !this.paused;
    if (this.paused) {
      this.render = this._pausedRender;
      this.scoreModifier = this._pausedscoreModifier;
      this.planet.hit = this.planet._pausedHit;
    } else {
      this.render = this._runningRender;
      this.scoreModifier = this._runningscoreModifier;
      this.planet.hit = this.planet._runningHit;
    }
  }

  /**
   *
   * @param {CanvasRenderingContext2D} context
   * @param {number} deltaTime
   */
  render(context, deltaTime) {
    if (this.paused) {
      this.render = this._pausedRender;
    } else {
      this.render = this._runningRender;
    }
    this.render(context, deltaTime);
  }

  /**
   *
   * @param {CanvasRenderingContext2D} context
   * @param {number} deltaTime
   */
  _runningRender(context, deltaTime) {
    if (this.spriteTimer > this.spriteInterval) {
      this.spriteUpdate = true;
      this.spriteTimer = 0;
    } else {
      this.spriteUpdate = false;
      this.spriteTimer += deltaTime;
    }
    this.planet.draw(context);
    this.player.update();
    this.projectilesPool.forEach((projectile) => {
      if (!projectile.free) {
        projectile.update();
        projectile.draw(context);
      }
    });
    if (this.enemyTimer < this.enemyInterval) {
      this.enemyTimer += deltaTime;
    } else {
      const newEnemy = this.getEnemy();
      if (newEnemy) {
        newEnemy.start({});
        this.enemyTimer = 0;
      }
    }
    this.enemiesPool.forEach((enemy) => {
      if (!enemy.free) {
        enemy.update();
        enemy.draw(context);
      }
    });

    this.player.draw(context);
    this.drawStatusText(context);
  }

  /**
   *
   * @param {number} points
   */
  scoreModifier(points) {
    if (this.paused) {
      this.scoreModifier = this._pausedscoreModifier;
    } else {
      this.scoreModifier = this._runningscoreModifier;
    }
    this.scoreModifier(points);
  }
  _runningscoreModifier(points) {
    this.score += points;
    if (this.score < 0) {
      this.score = 0;
      this.gameOver = true;
      this.paused = false;
      this.togglePaused();
    } else if (this.score >= this.winningScore) {
      this.gameOver = true;
      this.paused = false;
      this.togglePaused();
    }
  }

  _pausedscoreModifier(points) {}

  /**
   *
   * @param {CanvasRenderingContext2D} context
   * @param {number} deltaTime
   */
  _pausedRender(context, deltaTime) {
    if (this.spriteTimer > this.spriteInterval) {
      this.spriteUpdate = true;
      this.spriteTimer = 0;
    } else {
      this.spriteUpdate = false;
      this.spriteTimer += deltaTime;
    }
    this.planet.draw(context);
    // this.player.update();
    this.projectilesPool.forEach((projectile) => {
      if (!projectile.free) {
        projectile.update();
        projectile.draw(context);
      }
    });
    // if (this.enemyTimer < this.enemyInterval) {
    //   this.enemyTimer += deltaTime;
    // } else {
    //   const newEnemy = this.getEnemy();
    //   if (newEnemy) {
    //     newEnemy.start({});
    //     this.enemyTimer = 0;
    //   }
    // }
    this.enemiesPool.forEach((enemy) => {
      if (!enemy.free) {
        enemy.update();
        enemy.draw(context);
      }
    });

    // this.player.draw(context);
    this.drawStatusText(context);
    // @todo make this work the way of paused and running
    if (this.gameOver) {
      context.save();
      context.textAlign = "center";
      context.font = "100px Protest Revolution";
      context.fillStyle = "white";
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      if (this.score >= this.winningScore) {
        const message1 = `You win!`;
        const message2 = `Your score : ${this.score}`;
        context.shadowColor = "green";
        context.fillText(message1, this.width * 0.5, 200);
        context.font = "50px Protest Revolution";
        context.fillText(message2, this.width * 0.5, 600);
      } else {
        const message1 = `You lose!`;
        const message2 = `Try again!`;
        context.shadowColor = "red";
        context.fillText(message1, this.width * 0.5, 200);
        context.font = "50px Protest Revolution";
        context.fillText(message2, this.width * 0.5, 600);
      }
      context.restore();
    }
  }

  // createEnemyProjectiles() {
  //   for (let i = 0; i < this.numberOfEnemyProjectiles; i++) {
  //     this.enemyProjectilesPool.push(new EnemyProjectile(this));
  //   }
  // }
  // getEnemyProjectile() {
  //   return this.enemyProjectilesPool.find(
  //     (enemyProjectile) => enemyProjectile.free
  //   );
  // }

  createProjectiles() {
    for (let i = 0; i < this.numberOfProjectiles; i++) {
      this.projectilesPool.push(new Projectile(this));
    }
  }
  getProjectile() {
    return this.projectilesPool.find((projectile) => projectile.free);
  }
  createEnemies() {
    for (let i = 0; i < this.numberOfEnemies; i++) {
      const randNum = Math.random();
      if (randNum > 0.75) {
        this.enemiesPool.push(new Lobstermorph(this));
      } else if (randNum > 0.5) {
        this.enemiesPool.push(new Beetlemorph(this));
      } else if (randNum > 0.25) {
        this.enemiesPool.push(new Rhinomorph(this));
      } else {
        this.enemiesPool.push(new Asteroid(this));
      }
    }
  }
  getEnemy() {
    return this.enemiesPool.find((enemy) => enemy.free);
  }
  /**
   *
   * @param {{x:number; y:number;radius:number;}} a
   * @param {{x:number; y:number;radius:number;}} b
   */
  checkCollision(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius;
  }
  /**
   *
   * @param {Enemy} enemy
   */
  applyProjectilesCollision(enemy) {
    for (let i = 0; i < this.numberOfProjectiles; i++) {
      const projectile = this.projectilesPool[i];
      if (
        Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) <
        enemy.radius + projectile.radius
      ) {
        if (!projectile.free) {
          enemy.hit(projectile.power);
          projectile.reset();
          if (enemy.health > 0) {
            continue;
          } else {
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   *
   * @param {CanvasRenderingContext2D} context
   */
  drawStatusText(context) {
    context.save();
    // context.shadowOffsetX = 2;
    // context.shadowOffsetY = 2;
    context.textAlign = "start";
    context.font = "30px Protest Revolution";
    context.fillStyle = "white";
    context.fillText("Score: " + this.score, 20, 30);
    // context.fillText("Wave: " + this.waveCount, 20, 70);
    for (let i = 0; i < this.player.maxHealth; i++) {
      context.strokeRect(20 + 20 * i, 100, 10, 15);
    }
    context.fillStyle = "red";
    for (let i = 0; i < this.player.health; i++) {
      context.fillRect(20 + 20 * i, 100, 10, 15);
    }
    context.restore();

    this.planet.drawStatus(context);
  }

  calcAim(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const displacement = Math.hypot(dx, dy) || 1;
    // cos
    const aimX = dx / displacement;
    // sin
    const aimY = dy / displacement;

    return {
      aimX,
      aimY,
      dx,
      dy,
    };
  }

  isInside({ x, y, radius }) {
    return x > -radius && x < this.width && y > -radius && y < this.height;
  }
}
window.addEventListener("load", startGame);
/**
 * @type {HTMLCanvasElement}
 */
const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 800;
ctx.strokeStyle = "white";
ctx.lineWidth = 2;
function startGame() {
  const game = new Game(canvas);
  // event listeners
  /**
   *
   * @param {KeyboardEvent} e
   */
  function keyDownListener(e) {
    if (!game.keys[e.code]) game.keys[e.code] = true;
    if (!game.keys[e.key]) game.keys[e.key] = true;
    if (e.key === "d") {
      game.debug = !game.debug;
    }
  }
  /**
   *
   * @param {KeyboardEvent} e
   */
  function keyUpListener(e) {
    if (game.keys[e.code]) delete game.keys[e.code];
    if (game.keys[e.key]) delete game.keys[e.key];
  }
  window.addEventListener("keydown", keyDownListener);
  window.addEventListener("keyup", keyUpListener);
  let lastTime = 0;
  /**
   * @type {FrameRequestCallback}
   */
  function animate(timesTamp) {
    const deltaTime = timesTamp - lastTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.render(ctx, deltaTime);
    lastTime = timesTamp;
    // if (!game.gameOver) {
    window.requestAnimationFrame(animate);
    // } else {
    //   game.overGame(ctx);
    //   window.removeEventListener("keydown", keyDownListener);
    //   window.removeEventListener("keyup", keyUpListener);
    // }
  }
  animate(0);
}

// exports = {
//     Game
// }
