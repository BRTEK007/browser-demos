"use strict";

function frame() {
  let timestamp = window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
  deltaTime = (timestamp - oldTimeStamp) / 1000;
  oldTimeStamp = timestamp;
  if (game != null)
    game.update();
  for (var i = 0; i < keys.length; i++) {
    keys[i].pressed = false;
    keys[i].released = false;
  }
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', function (event) {

  switch (event.key) {
    //case "F11" : ; break;
    case "ArrowRight": event.preventDefault(); if (keys[ARROW_RIGHT].isPressed) break; keys[ARROW_RIGHT].pressed = true; keys[ARROW_RIGHT].isPressed = true; break;
    case "ArrowLeft": event.preventDefault(); if (keys[ARROW_LEFT].isPressed) break; keys[ARROW_LEFT].pressed = true; keys[ARROW_LEFT].isPressed = true; break;
    case "ArrowUp": event.preventDefault(); if (keys[ARROW_UP].isPressed) break; keys[ARROW_UP].pressed = true; keys[ARROW_UP].isPressed = true; break;
    case "r":
    event.preventDefault();
    if (keys[R_KEY].isPressed) break;
    keys[R_KEY].pressed = true;
    keys[R_KEY].isPressed = true;
    if(isWaitingForConfirm) confirmLevelStats(true);
    break;
    case "Enter": event.preventDefault(); if(isWaitingForConfirm) confirmLevelStats(false); break;
  }

}, true);

window.addEventListener("keyup", function (event) {

  switch (event.key) {
    case "ArrowRight": event.preventDefault(); keys[ARROW_RIGHT].released = true; keys[ARROW_RIGHT].isPressed = false; break;
    case "ArrowLeft": event.preventDefault(); keys[ARROW_LEFT].released = true; keys[ARROW_LEFT].isPressed = false; break;
    case "ArrowUp": event.preventDefault(); keys[ARROW_UP].released = true; keys[ARROW_UP].isPressed = false; break;
    case "r": event.preventDefault(); keys[R_KEY].released = true; keys[R_KEY].isPressed = false; break;
  }

}, true);

const clamp = (a, b, c) => Math.max(b, Math.min(c, a));
const isInRange = (a, min, max) => (a <= max && a >= min);
const polarity = (a) => a == 0 ? 0 : a / Math.abs(a);
const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

var now,
  deltaTime = 0,
  oldTimeStamp = window.performance && window.performance.now ? window.performance.now() : new Date().getTime();

const keys = [
  { pressed: false, released: false, isPressed: false },
  { pressed: false, released: false, isPressed: false },
  { pressed: false, released: false, isPressed: false },
  { pressed: false, released: false, isPressed: false }
];
const ARROW_RIGHT = 0, ARROW_LEFT = 1, ARROW_UP = 2, R_KEY = 3;
const TILE_WALL = 0, TILE_SPIKES = 1, TILE_START = 2, TILE_CHECKPOINT = 3, TILE_COIN = 4,
  TILE_MOVING_SPIKES = 5, TILE_MONSTER_SIDE = 6, TILE_MONSTER_FLY = 7, TILE_MONSTER_DROPPER = 8, TILE_MONSTER_ROCKET = 9;


var game, level, canvas, context, frameWindow;
var levelNumber = 1;
var isWaitingForConfirm = false;

var entitiesSprite = new Image();
entitiesSprite.src = '../sprites/entities.png';

var animationSprite = new Image();
animationSprite.src = '../sprites/animations.png';

var tilemapSprite = new Image();
tilemapSprite.src = '../sprites/tilemap.png';

function levelFinished(frames, deaths){
  game = null;
  canvas.style.display = "none";
  document.getElementById("finishedMenu").style.display = "inline-block";
  document.getElementById('levelNumber').innerHTML = levelNumber == Infinity ? "test" : levelNumber;
  document.getElementById('framesNumber').innerHTML = frames;
  document.getElementById('deathsNumber').innerHTML = deaths;
  isWaitingForConfirm = true;
}

function confirmLevelStats(replay){
  isWaitingForConfirm = false;

  if(levelNumber == Infinity){
    document.getElementById("finishedMenu").style.display = "none";
    canvas.style.display = "inline-block";
    loadHtmlLevel();
    return;
  }

  if(!replay) levelNumber++;

  if(levelNumber < 10){
    document.getElementById("finishedMenu").style.display = "none";
    canvas.style.display = "inline-block";
    loadLevelFromFile(levelNumber);
  }else{
    alert("no more levels bro :/");
    isWaitingForConfirm = true;
  }


}

function loadLevelFromFile(n) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      level = JSON.parse(this.responseText);
      if(level.frameLimit == null)
        level.frameLimit = 1000;
      // console.log(level);
      game = new Game(n);
      loadObjectsToGame();
    }
  };
  xmlhttp.open("GET", "../levels/level" + n + ".json", true);
  xmlhttp.send();
}

function loadObjectsToGame(){
  for (var i = 0; i < level.tiles.length; i++) {
    if (level.tiles[i] == false) continue;

    let x = i % level.width;
    let y = (i - x) / level.width;

    switch (level.tiles[i].type) {
      case TILE_MOVING_SPIKES:
        game.enemies.push(EntityFactory.MovingSpikes(x * level.tileSize, y * level.tileSize, level.tiles[i].offset));
        //level.tiles[i] = false;
        break;
      case TILE_MONSTER_SIDE:
        game.enemies.push(EntityFactory.SideWalkingEnemy(x * level.tileSize, y * level.tileSize, level.tiles[i].rangeN, level.tiles[i].rangeP));
        //level.tiles[i] = false;
        break;
      case TILE_MONSTER_FLY:
        game.enemies.push(EntityFactory.FlyingEnemy(x * level.tileSize, y * level.tileSize, level.tiles[i].rangeN, level.tiles[i].rangeP));
        //level.tiles[i] = false;
        break;
      case TILE_MONSTER_DROPPER:
        game.enemies.push(EntityFactory.DropperEnemy(x * level.tileSize, y * level.tileSize, level.tiles[i].offset));
        //level.tiles[i] = false;
        break;
      case TILE_MONSTER_ROCKET:
        game.enemies.push(EntityFactory.RocketEnemy(x * level.tileSize, y * level.tileSize, level.tiles[i].offset, level.tiles[i].direction));
        //level.tiles[i] = false;
        break;
      case TILE_COIN :
      game.coins.push(EntityFactory.Coin(x * level.tileSize, y * level.tileSize));
      game.coinsToCollect++;
      //level.tiles[i] = false;
      break;
    }

  }
}

function loadHtmlLevel() {
  console.log(level);
  if(level.frameLimit == null)
    level.frameLimit = 1000;
  levelNumber = Infinity;
  game = new Game(Infinity);
  loadObjectsToGame();
}

function windowLoaded() {
  canvas = document.getElementById('myCanvas');
  canvas.width = 576;
  canvas.height = 320;
  context = canvas.getContext('2d', { alpha: false });

  frameWindow = document.getElementById('frameCounterDiv');


  if (level) {
    loadHtmlLevel();
  }
  else{
    let url = new URL(window.location.href);
    levelNumber = url.searchParams.get("x");
    loadLevelFromFile(levelNumber);
  }


  requestAnimationFrame(frame);
}

const ScreenDrawer = function () {
  this.size = { x: canvas.width, y: canvas.height };
  this.cameraPos = { x: this.size.x / 2, y: this.size.y / 2 };
  this.cameraZoom = 1;
  this.cameraShake = { strength: 0, duration: 0, timeCounter: 0 };
  this.speed = 0.1;
  this.vel = 0;
  this.travelled = 0;
  this.desiredPos = { x: this.size.x / 2, y: this.size.y / 2 };

  this.clear = (color = "black") =>  {
    context.fillStyle = color;
    context.fillRect(0, 0, this.size.x, this.size.y);
  }

  this.update =  () => {

    //camera Shake
    if (this.cameraShake.timeCounter > 0) {
      this.cameraShake.timeCounter -= deltaTime;
      let range = this.cameraShake.timeCounter / this.cameraShake.duration;
      let strengthMod = this.cameraShake.strength * range * range * range;
      this.cameraPos.x += strengthMod * 2 * Math.random() - strengthMod;
      this.cameraPos.y += strengthMod * 2 * Math.random() - strengthMod;
    }

    //readjust after shake
    if (Math.abs(this.desiredPos.x - this.cameraPos.x) >= 1)
      this.cameraPos.x += this.speed * (this.desiredPos.x - this.cameraPos.x);
    if (Math.abs(this.desiredPos.y - this.cameraPos.y) >= 1)
      this.cameraPos.y += this.speed * (this.desiredPos.y - this.cameraPos.y);
  }

  this.invokeShake = (strength, duration) => {
    this.cameraShake.strength = strength;
    this.cameraShake.duration = duration;
    this.cameraShake.timeCounter = duration;
  }

  this.drawTiles = () => {

    context.imageSmoothingEnabled = false;

    const xRange = {
      start: Math.max(0, Math.floor((this.cameraPos.x - this.size.x / 2) / level.tileSize)),
      end: Math.min(level.width - 1, Math.ceil((this.cameraPos.x + this.size.x / 2) / level.tileSize))
    };
    const yRange = {
      start: Math.max(0, Math.floor((this.cameraPos.y - this.size.y / 2) / level.tileSize)),
      end: Math.min(level.height - 1, Math.ceil((this.cameraPos.y + this.size.y / 2) / level.tileSize))
    };

    for (let x = xRange.start; x <= xRange.end; x++) {
      for (let y = yRange.start; y <= yRange.end; y++) {
        const tileId = y * level.width + x;
        const tileValue = level.tiles[tileId];
        if (tileValue != false) {

          let tx = Math.round(x * level.tileSize - this.cameraPos.x + this.size.x / 2);
          let ty = Math.round(y * level.tileSize - this.cameraPos.y + this.size.y / 2);

          switch (tileValue.type) {
            case TILE_WALL:
              {
                if (tileValue.spriteId != 5) {
                  let sy = Math.floor(tileValue.spriteId / 4);
                  let sx = tileValue.spriteId - sy * 4;
                  context.drawImage(tilemapSprite, sx * 17, sy * 17, 16, 16, tx, ty, level.tileSize, level.tileSize);
                }
              } break;
            case TILE_SPIKES: {
              let sy = Math.floor(tileValue.spriteId / 4) + 4;
              let sx = tileValue.spriteId - (sy - 4) * 4;
              context.drawImage(tilemapSprite, sx * 17, sy * 17, 16, 16, tx, ty, level.tileSize, level.tileSize);
            } break;
          }

        }
      }
    }

  }

  this.nextRomm = () => {
    //this.cameraPos.x += this.size.x;
    this.desiredPos.x += this.size.x - 16;
  }

}

const Game = function () {
  this.screenDrawer = new ScreenDrawer();
  this.player = new Game.Player(level.startX * level.tileSize, level.startY * level.tileSize);
  this.enemies = new Array();

  this.enemyBullets = new Array();
  this.animations = new Array();

  this.coins = new Array();
  this.coinsToCollect = 0;
  this.collectedCoins = 0;

  this.finished = false;
  this.finishCounter = 0;
  this.finishDelay = 60;

  this.frameTime = 0;
  this.deaths = 1;
  this.playerMoved = false;

  this.update = () => {
    //console.log(this);
    if(!this.finished && this.playerMoved)
      this.frameTime++;

    frameWindow.innerHTML = this.frameTime;

    this.screenDrawer.clear();
 
    this.player.update();
    if(!this.playerMoved && !this.player.dead && this.player.acc.x != 0){
      this.playerMoved = true;
    }

    this.screenDrawer.update();

    //update and draw enemies
    for (let i = 0; i < this.enemies.length; i++) {
      let enemy = this.enemies[i];
      enemy.update();
      enemy.draw(this.screenDrawer);
    }

    //update and draw enemyBullets
    for (let i = 0; i < this.enemyBullets.length; i++) {
      let bullet = this.enemyBullets[i];

      bullet.update();
      bullet.draw(this.screenDrawer);

      //check for walls collision
      let tiles = getWallsInRect(bullet.getMomentumRect());
      for (let j = 0; j < tiles.length; j++) {

        let framesToCollision = dynamicRectTileCollisionTime(bullet, tiles[j]);

        if (framesToCollision <= 1) {
          //this.animations.push(EntityFactory.BulletExplosion(bullet.pos.x, bullet.pos.y));
          this.enemyBullets.splice(i, 1);
          i--;
          continue;
        }
      }

    }

    this.screenDrawer.drawTiles();

    //update and draw animations
    for (let i = 0; i < this.animations.length; i++) {
      this.animations[i].update();
      this.animations[i].draw(this.screenDrawer);
      if (this.animations[i].finished) {
        this.animations.splice(i, 1);
        i--;
      }
    }

    //update and draw coins
    for (let i = 0; i < this.coins.length; i++) {
      if(!this.coins[i].active) continue;
        this.coins[i].draw(this.screenDrawer);
    }

    this.player.draw(this.screenDrawer);

    if (this.player.dead) return;

    //tilemap
    limitPlayerTileVelocity(this.player);

    if(this.finished){
      this.finishCounter++;
      if(this.finishCounter >= this.finishDelay){
        this.nextLevel();
      }
      return;
    }

    //check for enemyCollision
    for (let i = 0; i < this.enemies.length; i++) {

      let framesToCollision = dynamicRectsCollisionTime(this.player.getCollider(), this.enemies[i].getCollider());

      if (framesToCollision <= 1) {
        this.restartLevel();
        return;
      }
    }

    //check for bulletCollision
    for (let i = 0; i < this.enemyBullets.length; i++) {
      let bullet = this.enemyBullets[i];

      //check for player collision
      let framesToCollision = dynamicRectsCollisionTime(this.player.getCollider(), bullet.getCollider());
      if (framesToCollision <= 1) {
        this.restartLevel();
        this.enemyBullets.splice(i, 1);
        i--;
        return;
      }


    }

    //check for static spikes collision
    let objects = getObjectsInRect(this.player.getMomentumRect());

    for (let i = 0; i < objects.length; i++) {
      let object = objects[i];
      let framesToCollision = dynamicRectsCollisionTime(this.player.getCollider(), object.collider);

      if (framesToCollision <= 1) {

        if (object.type == TILE_SPIKES) {
          this.restartLevel();
          break;
        } else if (object.type == TILE_CHECKPOINT) {
          this.player.setCheckpoint(object.collider.x, object.collider.y);
        }

      }

    }

    //check for coin collision
    for (let i = 0; i < this.coins.length; i++) {
      if(!this.coins[i].active) continue;
      let framesToCollision = dynamicRectsCollisionTime(this.player.getCollider(), this.coins[i].getCollider());

      if (framesToCollision <= 1) {
        this.animations.push(EntityFactory.CoinAnimation(this.coins[i].pos.x+5, this.coins[i].pos.y+5));
        this.coins[i].active = false;
        i--;
        this.collectedCoin();
        return;
      }

    }

    if(keys[R_KEY].pressed){
      this.restartLevel();
    }

  }

  this.collectedCoin = () => {
    this.collectedCoins++;
    if(this.collectedCoins == this.coinsToCollect){
      this.finished = true;
      this.player.finished = true;
    }
  }

  this.nextLevel = () => {
    levelFinished(this.frameTime, this.deaths);
    //loadLevelFromFile(this.level+1);
  }

  this.restartLevel = () => {
    this.player.die();
    this.playerMoved = false;
    this.frameTime = 0;
    this.deaths++;
    this.animations.push(EntityFactory.PlayerExplosion(this.player.center.x, this.player.center.y));

    this.screenDrawer.invokeShake(10, 0.5);


    this.player.pos.x = level.startX * level.tileSize;
    this.player.pos.y = level.startY * level.tileSize;

    this.collectedCoins = 0;

    for(var i = 0; i < this.coins.length; i++){
      this.coins[i].active = true;
    }

    //reload Objects
  }

}

Game.Player = function (x, y) {
  this.pos = { x: x, y: y };
  this.vel = { x: 0, y: 0 };
  this.acc = { x: 0, y: 0 };
  this.size = { x: 10, y: 15 };
  this.center = { x: x + this.size.x / 2, y: y + this.size.y / 2 };

  this.direction = { x: 0, y: 0 };
  this.horizontalSpeed = 0.8;
  this.gravity = 0.5;
  this.drag = 0.8;
  this.grounded = false;
  this.jumpSpeed = 7;
  this.coyoteTime = 0.08;
  this.coyoteTimeCounter = 0;
  this.animFrame = 0;
  this.animFrameCounter = 0;
  this.jumpPressCounter = 0;
  this.jumpPressTime = 0.08;
  this.dead = false;
  this.deadTime = 0.5;
  this.deadTimer = 0;
  this.finished = false;

  this.update = () => {
    // console.log(this);
    if (this.dead) {
      this.deadTimer += deltaTime;
      if (this.deadTimer >= this.deadTime)
        this.respawn();
      return;
    }

    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y

    this.vel.x += this.acc.x;
    this.vel.y += this.acc.y

    this.center.x = this.pos.x + this.size.x / 2;
    this.center.y = this.pos.y + this.size.y / 2;

    this.vel.x *= this.drag;
    this.acc.y = this.gravity;
    if (Math.abs(this.vel.x) < 0.5) this.vel.x = 0;

    if (this.vel.x == 0) {
      this.animFrame = 0;
      this.animFrameCounter = 0;
    }

    else if (this.vel.x != 0) {
      if (this.grounded) {
        this.animFrameCounter += Math.abs(this.vel.x / this.horizontalSpeed);
        if (this.animFrameCounter >= 25) {
          this.animFrameCounter = 0;
          this.animFrame = (this.animFrame == 1) ? 2 : 1;
        }
      } else {
        this.animFrame = (this.vel.x > 0) ? 1 : 2;
      }
    }

    if(this.finished) {
      this.animFrame = 0;
      return;
    }

    if (keys[ARROW_RIGHT].isPressed) this.acc.x = this.horizontalSpeed;
    else if (keys[ARROW_LEFT].isPressed) this.acc.x = -this.horizontalSpeed;
    else this.acc.x = 0;

    if (this.grounded) this.coyoteTimeCounter = this.coyoteTime;
    else this.coyoteTimeCounter -= deltaTime;

    if (keys[ARROW_UP].pressed) this.jumpPressCounter = this.jumpPressTime;
    else this.jumpPressCounter -= deltaTime;

    if (this.jumpPressCounter > 0 && this.coyoteTimeCounter > 0) {
      this.vel.y = -this.jumpSpeed;
      this.coyoteTimeCounter = 0;
    } else if (keys[ARROW_UP].released && this.vel.y < 0) {
      this.vel.y *= 0.5;
    }
  }

  this.getMomentumRect = () => {
    let left = Math.floor(Math.min(this.pos.x, this.pos.x + this.vel.x));
    let right = Math.ceil(Math.max(this.pos.x, this.pos.x + this.vel.x) + this.size.x);
    let top = Math.floor(Math.min(this.pos.y, this.pos.y + this.vel.y));
    let bottom = Math.ceil(Math.max(this.pos.y, this.pos.y + this.vel.y) + this.size.y);

    return { left: left, right: right, top: top, bottom: bottom }
  }

  this.respawn = () => {
    this.dead = false;
    this.vel.x = 0;
    this.vel.y = 0;
  }

  this.die = () => {
    if (this.dead) return;
    this.dead = true;
    this.deadTimer = 0;
    this.jumpPressCounter = 0;
    this.coyoteTimeCounter = 0;
    this.vel.x = 0;
    this.vel.y = 0;
    this.acc.x = 0;
    this.acc.y = 0;
  }

  this.draw = (viewManager) => {
    if (this.dead) return;
    let sx = this.pos.x - viewManager.cameraPos.x + viewManager.size.x / 2;
    let sy = this.pos.y - viewManager.cameraPos.y + viewManager.size.y / 2;
    context.drawImage(entitiesSprite, this.animFrame * 11, 0, 10, 15, Math.round(sx), Math.round(sy), 10, 15);
  }

  this.setCheckpoint = (x, y) => {
    this.checkpoint = { x: x, y: y }
  }

  this.getCollider = () => {
    return { x: this.pos.x, y: this.pos.y, w: this.size.x, h: this.size.y, vx: this.vel.x, vy: this.vel.y };
  }

}

const EntityFactory = {
  RocketEnemy: (x, y, offset = 0, direction = 1) => {
    const self = EntityFactory.staticRectBody(direction == 1 ? x : x + 3, y + 3, 13, 10);

    self.launchTimeCounter = -offset * 10;

    Object.assign(self, PartFactory.launcherUpdatePart(self, 60));
    Object.assign(self, PartFactory.rocketLaunchPart(direction == 1 ? x + 13 : x - 8, y + 5, direction));
    Object.assign(self, PartFactory.drawNoAnimPart(self, direction == 1 ? 58 : 44, 5, 13, 10));
    return self;
  },

  DropperEnemy: (x, y, offset = 0) => {
    const self = EntityFactory.staticRectBody(x + 1, y, 13, 10);

    self.launchTimeCounter = -offset * 3;
    self.animFrame = 0;

    Object.assign(self, PartFactory.dropperUpdatePart(self, 60));
    Object.assign(self, PartFactory.dropperLaunchPart(self));
    Object.assign(self, PartFactory.drawWithAnimPart(self, 0, 32, 14, 15));
    return self;
  },

  SideWalkingEnemy: (x, y, rN = 1, rP = 1) => {
    const self = EntityFactory.dynamicRectBody(x, y + 1, 15, 15)

    self.direction = 1;

    self.animFrameCounter = 0;
    self.animFrame = 0;

    Object.assign(self, PartFactory.sideMonsterUpdatePart(self, x - rN * 16, x + rP * 16, 0.3));
    Object.assign(self, PartFactory.drawWithAnimPart(self, 48, 48, 15, 15));

    return self;
  },

  FlyingEnemy: (x, y, rN = 1, rP = 1) => {
    const self = EntityFactory.dynamicRectBody(x, y + 1, 15, 15);
    self.direction = 1;

    self.range = { n: y - rN * 16, p: y + rP * 16 };

    self.animFrameCounter = 0;
    self.animFrame = 0;
    self.animFrameDir = 1;

    Object.assign(self, PartFactory.flyingMonsterUpdatePart(self, 0.6));
    self.vel.y = 0.6;
    Object.assign(self, PartFactory.drawWithAnimPart(self, 0, 48, 15, 15));

    return self;
  },

  DropperBullet: (x, y) => {
    const self = EntityFactory.dynamicRectBody(x, y, 10, 9);

    self.acc = { x: 0, y: 0 };

    Object.assign(self, PartFactory.drawNoAnimPart(self, 60, 32, 10, 9));
    Object.assign(self, PartFactory.bulletSetPart(self));
    Object.assign(self, PartFactory.bulletUpdatePart(self));
    Object.assign(self, PartFactory.momentumRectPart(self, 10, 9));
    return self;
  },

  RocketBullet: (x, y, direction) => {
    const self = EntityFactory.dynamicRectBody(x, y, 8, 6);

    self.acc = { x: 0, y: 0 };

    Object.assign(self, PartFactory.drawNoAnimPart(self, direction == 1 ? 81 : 72, 9, 8, 6));
    Object.assign(self, PartFactory.bulletSetPart(self));
    Object.assign(self, PartFactory.bulletUpdatePart(self));
    Object.assign(self, PartFactory.momentumRectPart(self, 8, 6));
    return self;
  },

  PlayerExplosion: (x, y) => {
    const self = {};
    self.pos = { x: x - 12, y: y - 15 };
    self.animFrameCounter = 0;
    self.animFrame = 0;
    Object.assign(self, PartFactory.animFrameUpdatePart(self, 3, 4));
    Object.assign(self, PartFactory.spriteAnimDrawPart(self, 0,25, 24, 30));
    return self;
  },

  CoinAnimation: (x, y) => {
    const self = {};
    self.pos = { x: x - 12, y: y - 12 };
    self.animFrameCounter = 0;
    self.animFrame = 0;
    Object.assign(self, PartFactory.animFrameUpdatePart(self, 3, 4));
    Object.assign(self, PartFactory.spriteAnimDrawPart(self, 0,0, 24, 24));
    return self;
  },

  BulletExplosion: (x, y) => {
    const self = {};
    self.pos = { x: x, y: y };
    self.animFrameCounter = 0;
    self.animFrame = 0;
    Object.assign(self, PartFactory.animFrameUpdatePart(self, 3, 4));
    Object.assign(self, PartFactory.spriteAnimDrawPart(self, bulletanimationSprite, 9, 9));
    return self;
  },

  MovingSpikes: (x, y, offset = 0) => {
    const self = {};
    self.pos = { x: x, y: y+1 };
    self.animFrame = 0;
    self.animFrameCounter = -offset * 3;
    self.animFrameDir = 1;
    Object.assign(self, PartFactory.movingSpikesUpdatePart(self));
    Object.assign(self, PartFactory.movingSpikesDrawPart(self));
    Object.assign(self, PartFactory.movingSpikesColliderPart(self));
    return self;
  },

  dynamicRectBody: (x, y, w = 16, h = 16) => {
    const self = {
      pos: { x: x, y: y },
      vel: { x: 0, y: 0 },
      size: { x: w, y: h },
      getCollider: () => { return { x: self.pos.x, y: self.pos.y, w: w, h: h, vx: self.vel.x, vy: self.vel.y } }
    };
    return self;
  },

  staticRectBody: (x, y, w = 16, h = 16) => {
    const self = {
      pos: { x: x, y: y },
      size: { x: w, y: h },
      getCollider: () => { return { x: self.pos.x, y: self.pos.y, w: w, h: h, vx: 0, vy: 0 } }
    };
    return self;
  },

  Coin: (x, y) => {
    const self = EntityFactory.staticRectBody(x + 3, y + 3, 10, 10);
    self.active = true;
    Object.assign(self, PartFactory.drawNoAnimPart(self, 33, 5, 10, 10));
    return self;
  }
}

const PartFactory = {
  momentumRectPart: (self, w, h) => ({
    getMomentumRect: () => {
      let left = Math.floor(Math.min(self.pos.x, self.pos.x + self.vel.x));
      let right = Math.ceil(Math.max(self.pos.x, self.pos.x + self.vel.x) + w);
      let top = Math.floor(Math.min(self.pos.y, self.pos.y + self.vel.y));
      let bottom = Math.ceil(Math.max(self.pos.y, self.pos.y + self.vel.y) + h);

      return { left: left, right: right, top: top, bottom: bottom }
    }
  }),

  bulletUpdatePart: self => ({
    update: () => {
      self.pos.x += self.vel.x;
      self.pos.y += self.vel.y;

      self.vel.x += self.acc.x;
      self.vel.y += self.acc.y
    }
  }),

  bulletSetPart: self => ({

    setVel: (x, y) => {
      self.vel.x = x;
      self.vel.y = y;
    },

    setAcc: (x, y) => {
      self.acc.x = x;
      self.acc.y = y;
    }

  }),

  rocketLaunchPart: (x, y, direction) => ({
    launch: () => {
      const bullet = EntityFactory.RocketBullet(x, y, direction);
      bullet.setVel(direction * 4, 0);
      game.enemyBullets.push(bullet);
    }
  }),

  dropperLaunchPart: self => ({
    launch: () => {
      const bullet = EntityFactory.DropperBullet(self.pos.x + 2, self.pos.y + 8);
      bullet.setVel(0, 2);//2
      bullet.setAcc(0, 0.2);//0.2
      game.enemyBullets.push(bullet);
    }
  }),

  drawNoAnimPart: (self, sourceX, sourceY, sourceW, sourceH) => ({
    draw: (camera) => {
      const screenX = self.pos.x - camera.cameraPos.x + camera.size.x / 2;
      const screenY = self.pos.y - camera.cameraPos.y + camera.size.y / 2;
      if (screenX <= -sourceW || screenX >= camera.size.x || screenY <= -sourceH || screenY >= camera.size.y) return;
      context.drawImage(entitiesSprite, sourceX, sourceY, sourceW, sourceH, Math.round(screenX), Math.round(screenY), sourceW, sourceH);
    }
  }),

  drawWithAnimPart: (self, sourceX, sourceY, sourceW, sourceH) => ({
    draw: (camera) => {
      const sx = self.pos.x - camera.cameraPos.x + camera.size.x / 2;
      const sy = self.pos.y - camera.cameraPos.y + camera.size.y / 2;
      if (sx <= -sourceW || sx >= camera.size.x || sy <= -sourceH || sy >= camera.size.y) return;
      context.drawImage(entitiesSprite, sourceX + self.animFrame * (sourceW + 1), sourceY, sourceW, sourceH, Math.round(sx), Math.round(sy), sourceW, sourceH);
    }
  }),

  launcherUpdatePart: (self, launchDelay) => ({
    update: () => {
      self.launchTimeCounter++;
      if (self.launchTimeCounter >= launchDelay) {
        self.launchTimeCounter = 0;
        self.launch();
      }
    }
  }),

  dropperUpdatePart: (self, launchDelay) => ({
    update: () => {
      self.launchTimeCounter++;
      const delay = self.animFrame == 0 ? launchDelay : 3;

      if (self.launchTimeCounter >= delay) {
        self.animFrame++;
        self.launchTimeCounter = 0;

        if (self.animFrame >= 4) {
          self.animFrame = 0;
          self.launch();
        }

      }
    }
  }),

  sideMonsterUpdatePart: (self, rN, rP, speed) => ({
    update: () => {
      self.pos.x += self.vel.x;
      self.vel.x += self.direction * speed;
      self.vel.x *= 0.65;

      if (self.pos.x >= rP && self.direction == 1)
        self.direction = -1;
      else if (self.pos.x <= rN && self.direction == -1)
        self.direction = 1;

      self.animFrameCounter++;
      if (self.animFrameCounter > 12) {
        self.animFrameCounter = 0;
        self.animFrame = (self.animFrame == 1) ? 2 : 1;
      }

    }
  }),

  flyingMonsterUpdatePart: (self, speed) => ({
    update: () => {
      self.pos.y += self.vel.y;

      if (self.pos.y >= self.range.p && self.direction == 1) {
        self.direction = -1;
        self.vel.y = self.direction * speed;
      }
      else if (self.pos.y <= self.range.n && self.direction == -1) {
        self.direction = 1;
        self.vel.y = self.direction * speed;
      }

      self.animFrameCounter++;
      if (self.animFrameCounter >= 10 + self.direction * 3) {
        self.animFrameCounter = 0;
        self.animFrame += self.animFrameDir;
        if (self.animFrame <= 0 || self.animFrame >= 2)
          self.animFrameDir = -self.animFrameDir;
      }


    }
  }),

  animFrameUpdatePart: (self, timesPerFrame, frameCount) => ({
    update: () => {
      self.animFrameCounter++;
      if (self.animFrameCounter > timesPerFrame) {
        self.animFrameCounter = 0;
        self.animFrame++;
        if (self.animFrame >= frameCount)
          self.finished = true;
      }
    }
  }),

  spriteAnimDrawPart: (self, sourceX, sourceY, sourceW, sourceH) => ({
    draw: (camera) => {
      let sx = self.pos.x - camera.cameraPos.x + camera.size.x / 2;
      let sy = self.pos.y - camera.cameraPos.y + camera.size.y / 2;
      if (sx <= -sourceW || sx >= camera.size.x || sy <= -sourceH || sy >= camera.size.y) return;
      context.drawImage(animationSprite, sourceX + self.animFrame * sourceW, sourceY, sourceW, sourceH, Math.round(sx), Math.round(sy), sourceW, sourceH);
    }
  }),

  movingSpikesUpdatePart: (self) => ({
    update: () => {
      self.animFrameCounter++;
      var duration = (self.animFrame == 0) ? 60 : 3;

      if (self.animFrameCounter > duration) {
        self.animFrameCounter = 0;

        self.animFrame += self.animFrameDir;
        if (self.animFrame >= 5 || self.animFrame <= 0) self.animFrameDir = - self.animFrameDir;
      }
    }
  }),

  movingSpikesDrawPart: (self) => ({
    draw: (camera) => {
      if (self.animFrame > 0) {
        let sx = self.pos.x - camera.cameraPos.x + camera.size.x / 2;
        let sy = self.pos.y - camera.cameraPos.y + camera.size.y / 2;
        if (sx < 0 || sx >= camera.size.x || sy < 0 || sy >= camera.size.y) return;
        context.drawImage(entitiesSprite, (self.animFrame - 1) * 17, 16, 16, 15, Math.round(sx), Math.round(sy), 16, 15);
      }
    }
  }),

  movingSpikesColliderPart: (self) => ({
    getCollider: () => {
      if (self.animFrame == 0)
        return {};
      return { x: self.pos.x + 1, y: self.pos.y + (5 - self.animFrame) * 3 + 1, w: 14, h: self.animFrame * 3, vx: 0, vy: 0 };
    }
  })
}

function dynamicRectTileCollisionTime(rect, tile) {

  let nearestCollisionFrames = Infinity;

  let xColFrames = Infinity;

  if (rect.vel.x > 0) xColFrames = (tile.x - rect.pos.x - rect.size.x) / rect.vel.x;
  else if (rect.vel.x < 0) xColFrames = (rect.pos.x - tile.x - tile.size) / Math.abs(rect.vel.x);

  if (xColFrames >= 0 && isInRange(rect.pos.y + rect.vel.y * xColFrames, tile.y - rect.size.y, tile.y + tile.size + rect.size.y))
    nearestCollisionFrames = Math.min(nearestCollisionFrames, xColFrames);

    let yColFrames = Infinity;

  if (rect.vel.y > 0) yColFrames = (tile.y - rect.pos.y - rect.size.y) / rect.vel.y;
  else if (rect.vel.y < 0) yColFrames = (rect.pos.y - tile.y - tile.size) / Math.abs(rect.vel.y);

  if (yColFrames >= 0 && isInRange(rect.pos.x + rect.vel.x * yColFrames, tile.x - rect.size.x, tile.x + tile.size + rect.size.x))
    nearestCollisionFrames = Math.min(nearestCollisionFrames, yColFrames);

  return nearestCollisionFrames;
}

function dynamicRectsCollisionTime(rectA, rectB) {

  let nearestCollisionFrames = Infinity;
  let xColFrames = Infinity;

  if (rectB.x + rectB.w < rectA.x) {
    let v = rectB.vx - rectA.vx;
    if (v > 0) xColFrames = (rectA.x - rectB.x - rectB.w) / v;
  }
  else if (rectA.x + rectA.w < rectB.x) {
    let v = rectA.vx - rectB.vx;
    if (v > 0) xColFrames = (rectB.x - rectA.x - rectA.w) / v;
  }
  else xColFrames = 0;

  if (isInRange(rectA.y + rectA.vy * xColFrames, rectB.y + rectB.vy * xColFrames - rectA.h, rectB.y + rectB.vy * xColFrames + rectB.h))
    nearestCollisionFrames = Math.min(nearestCollisionFrames, xColFrames);

    let yColFrames = Infinity;

  if (rectB.y + rectB.h < rectA.y) {
    let v = rectB.vy - rectA.vy;
    if (v > 0) yColFrames = (rectA.y - rectB.y - rectB.h) / v;
  }
  else if (rectA.y + rectA.h < rectB.y) {
    let v = rectA.vy - rectB.vy;
    if (v > 0) yColFrames = (rectB.y - rectA.y - rectA.h) / v;
  }
  else yColFrames = 0;

  if (isInRange(rectA.x + rectA.vx * yColFrames, rectB.x + rectB.vx * yColFrames - rectA.w, rectB.x + rectB.vx * yColFrames + rectB.w))
    nearestCollisionFrames = Math.min(nearestCollisionFrames, yColFrames);

  return nearestCollisionFrames;
}

function getObjectsInRect(rect) {
  let objects = new Array();

  let xRange = {
    start: Math.max(0, Math.floor(rect.left / level.tileSize)),
    end: Math.min(level.width - 1, Math.floor(rect.right / level.tileSize))
  };
  let yRange = {
    start: Math.max(0, Math.floor(rect.top / level.tileSize)),
    end: Math.min(level.height - 1, Math.floor(rect.bottom / level.tileSize))
  };

  for (let x = xRange.start; x <= xRange.end; x++) {
    for (let y = yRange.start; y <= yRange.end; y++) {
      let tileId = y * level.width + x;
      if (level.tiles[tileId] != false && level.tiles[tileId].type != TILE_WALL) {

        if (level.tiles[tileId].type == TILE_SPIKES) {
          let sides = level.tiles[tileId].sides;

          if (sides == true) {
            objects.push({ type: TILE_SPIKES, collider: { x: x * level.tileSize + 1, y: y * level.tileSize + 1, w: 14, h: 14, vx: 0, vy: 0 } });
            continue;
          }

          if (sides[0] == -1)
            objects.push({ type: TILE_SPIKES, collider: { x: x * level.tileSize, y: y * level.tileSize + 1, w: 5, h: 14, vx: 0, vy: 0 } });
          else if (sides[0] == 1) {
            objects.push({ type: TILE_SPIKES, collider: { x: x * level.tileSize + 11, y: y * level.tileSize + 1, w: 5, h: 14, vx: 0, vy: 0 } });
          }

          if (sides[1] == -1)
            objects.push({ type: TILE_SPIKES, collider: { x: x * level.tileSize + 1, y: y * level.tileSize, w: 14, h: 5, vx: 0, vy: 0 } });
          else if (sides[1] == 1)
            objects.push({ type: TILE_SPIKES, collider: { x: x * level.tileSize + 1, y: y * level.tileSize + 11, w: 14, h: 5, vx: 0, vy: 0 } });
        }

      }
    }
  }

  return objects;
}

function getWallsInRect(rect) {
  let walls = new Array();

  let xRange = {
    start: Math.max(0, Math.floor(rect.left / level.tileSize)),
    end: Math.min(level.width - 1, Math.floor(rect.right / level.tileSize))
  };
  let yRange = {
    start: Math.max(0, Math.floor(rect.top / level.tileSize)),
    end: Math.min(level.height - 1, Math.floor(rect.bottom / level.tileSize))
  };

  for (let x = xRange.start; x <= xRange.end; x++) {
    for (let y = yRange.start; y <= yRange.end; y++) {
      let tileId = y * level.width + x;
      if (level.tiles[tileId] != false && level.tiles[tileId].type == TILE_WALL) {
        walls.push({ x: x * level.tileSize, y: y * level.tileSize, size: level.tileSize, sides: level.tiles[tileId].sides });
      }
    }
  }
  return walls;
}

function limitPlayerTileVelocity(player) {

  player.grounded = false;

  const tiles = getWallsInRect(player.getMomentumRect());

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];

    if (isInRange(player.pos.x + player.vel.x, tile.x - player.size.x, tile.x + tile.size)) {//vertical
      if (player.vel.y > 0 && tile.sides[0] == 1 && tile.y >= player.pos.y + player.size.y) {//bottom
        player.vel.y = Math.min(player.vel.y, tile.y - (player.pos.y + player.size.y));
        if (player.vel.y == 0) player.grounded = true;
      }
      else if (player.vel.y < 0 && tile.sides[2] == 1 && tile.y + tile.size <= player.pos.y)//top
        player.vel.y = Math.max(player.vel.y, tile.y + tile.size - player.pos.y);
    }

    if (isInRange(player.pos.y + player.vel.y, tile.y - player.size.y, tile.y + tile.size)) {//vertical
      if (player.vel.x > 0 && tile.sides[3] == 1 && tile.x >= player.pos.x + player.size.x)//right
        player.vel.x = Math.min(player.vel.x, tile.x - (player.pos.x + player.size.x));
      else if (player.vel.x < 0 && tile.sides[1] == 1 && tile.x + tile.size <= player.pos.x)//left
        player.vel.x = Math.max(player.vel.x, tile.x + tile.size - player.pos.x);
    }

    if (player.vel.x == 0 && player.vel.y == 0)
      break;
  }

}
