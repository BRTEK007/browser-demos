const isInRange = (a, min, max) => (a <= max && a >= min);
const clamp = (a, b, c) => Math.max(b, Math.min(c, a));
const distSqr = (x1, y1, x2, y2) => (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);

var ctx;
var canvas;

var now,
  deltaTime = 0,
  oldTimeStamp = timestamp(),
  step = 1 / 30;

var level = {
  width : 36,
  height: 20,
  tiles : new Array(36*20).fill(false),
  startX : 0,
  startY : 0,
  tileSize : 16
};

var screenDrawer;
var tilemapIdTranslation;
var input = {
  mousePressed: false,
  mousePos: { x: 0, y: 0 },
  mouseHook: { x: 0, y: 0 },
  mouseButton: 0,
  ctrlPressed: false
};

const MODE_TILE = 0, MODE_OBJECT = 1, MODE_LOOSE = 2;
const TILE_WALL = 0, TILE_SPIKES = 1, TILE_START = 2, TILE_CHECKPOINT = 3, TILE_COIN = 4,
  TILE_MOVING_SPIKES = 5, TILE_MONSTER_SIDE = 6, TILE_MONSTER_FLY = 7, TILE_MONSTER_DROPPER = 8, TILE_MONSTER_ROCKET = 9;

var settings = {
  showGrid: true,
  tileSize: 64,
  chosenTile: TILE_WALL,
  mouseMode: MODE_TILE,
  popupOpenedID: 0
}

function timestamp() {
  return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
}

function frame() {
  deltaTime = (timestamp() - oldTimeStamp) / 1000;
  oldTimeStamp = timestamp();
  update();
  requestAnimationFrame(frame);
}

function saveChangesMonsterOffset(){
  let offset = parseInt(document.getElementById('offsetInput').value);
  if(Number.isNaN(offset)) return;

  level.tiles[settings.popupOpenedID].offset = offset;

  closePopup('monsterOffsetEditPopup');
}

function saveChangesMonsterRange(){
  let rangeP = parseInt(document.getElementById('rangePInput').value);
  let rangeN = parseInt(document.getElementById('rangeNInput').value);
  if(Number.isNaN(rangeP) || Number.isNaN(rangeN)) return;

  level.tiles[settings.popupOpenedID].rangeN = rangeN;
  level.tiles[settings.popupOpenedID].rangeP = rangeP;

  closePopup('monsterRangeEditPopup');
}

function openPopupDOM(id) {
  var el = document.getElementById(id);
  el.style.display = 'inline-block';
  let rect = canvas.getBoundingClientRect();

  el.style.left = input.mousePos.x + rect.left + 'px';
  el.style.top = input.mousePos.y + rect.top + 'px';

  settings.mouseMode = MODE_LOOSE;
}

function openPopup() {
  let worldPos = screenDrawer.screenToWorldPoint(input.mousePos.x, input.mousePos.y);
  let tileX = Math.floor(worldPos.x / 16);
  let tileY = Math.floor(worldPos.y / 16);

  if (
    !isInRange(tileX, 0, level.width - 1)
    || !isInRange(tileY, 0, level.height - 1)
    || level.tiles[tileX + tileY * level.width] == false)
  return;

  settings.popupOpenedID = tileX + tileY * level.width;

  switch (level.tiles[tileX + tileY * level.width].type) {
    case TILE_MONSTER_SIDE: openPopupDOM('monsterRangeEditPopup'); break;
    case TILE_MONSTER_FLY: openPopupDOM('monsterRangeEditPopup'); break;
    case TILE_MOVING_SPIKES: openPopupDOM('monsterOffsetEditPopup'); break;
    case TILE_MONSTER_DROPPER: openPopupDOM('monsterOffsetEditPopup'); break;
    case TILE_MONSTER_ROCKET: openPopupDOM('monsterOffsetEditPopup'); break;
    case TILE_SPIKES: flipSpikes(tileX + tileY * level.width); break;
  }

}

function closePopup(id) {
  var el = document.getElementById(id);
  el.style.display = 'none';
  settings.mouseMode = MODE_OBJECT;
}

function loadDeafaultLevel(){
  var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        level = JSON.parse(this.responseText);

        for(var i = 0; i < level.tiles.length; i++){
          if(level.tiles[i] != false){
            if(level.tiles[i].type == TILE_START){
              level.tiles[i] = false;
            }
          }
        }

      }
    };
    xmlhttp.open("GET", "defaultLevel.json", true);
    xmlhttp.send();
}

function windowLoaded() {
  canvas = document.getElementById("myCanvas");
  var canvas_width = canvas.getBoundingClientRect().width;
  var canvas_height = canvas.getBoundingClientRect().height;
  ctx = canvas.getContext("2d");

  canvas.addEventListener('mousedown', e => {
    input.mousePressed = true;
    input.mouseButton = e.button;
    if (input.ctrlPressed && input.mouseButton == 0) {
      var rect = canvas.getBoundingClientRect();
      input.mouseHook = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      screenDrawer.hookCamera();
    }
    else if (!input.ctrlPressed && input.mouseButton == 0 && settings.mouseMode == MODE_OBJECT) {
      openPopup();
    }
  });
  canvas.addEventListener('mouseup', e => { input.mousePressed = false; holdingPlayer = false; });
  canvas.addEventListener('mousemove', e => {
    var rect = canvas.getBoundingClientRect();
    input.mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  });
  canvas.addEventListener('mouseleave', e => { input.mousePressed = false; holdingPlayer = false; });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (settings.mouseMode == MODE_LOOSE) return;
    settings.tileSize *= 1 - e.deltaY / 400;
    settings.tileSize = clamp(settings.tileSize, 16, 160);
  });

  canvas.width = canvas_width;
  canvas.height = canvas_height;

  screenDrawer = new ScreenDrawer();

  tilemapIdTranslation = new Map();
  tilemapIdTranslation.set(1, 1);
  tilemapIdTranslation.set(6, 6);//
  tilemapIdTranslation.set(12, 9);//
  tilemapIdTranslation.set(24, 4);//
  tilemapIdTranslation.set(7, 2);
  tilemapIdTranslation.set(18, 10);//
  tilemapIdTranslation.set(36, 8);//
  tilemapIdTranslation.set(25, 0);
  tilemapIdTranslation.set(43, 15);
  tilemapIdTranslation.set(31, 3);//
  tilemapIdTranslation.set(19, 14);
  tilemapIdTranslation.set(42, 11);
  tilemapIdTranslation.set(37, 12);//
  tilemapIdTranslation.set(30, 7);//
  tilemapIdTranslation.set(13, 13);//
  tilemapIdTranslation.set(0, 5);//

  //loadDeafaultLevel();

  requestAnimationFrame(frame);
}

function update() {
  if(!level) return;
  screenDrawer.update();
  screenDrawer.clear("black");
  if (settings.showGrid)
    screenDrawer.drawGrid();
  screenDrawer.drawTiles();

  screenDrawer.drawStart();

  if (!input.ctrlPressed) {

    if (settings.mouseMode == MODE_OBJECT) {
      screenDrawer.highlightTileUnderMouse();
    }

    if (input.mousePressed) {
    if (input.mouseButton == 0) {
      if(settings.mouseMode == MODE_TILE){
            placeTile();
      }
      }
    else
        clearTile();
    }
  
  }

}

function clearTile() {
  let worldPos = screenDrawer.screenToWorldPoint(input.mousePos.x, input.mousePos.y);
  let tileX = Math.floor(worldPos.x / 16);
  let tileY = Math.floor(worldPos.y / 16);
  if (!isInRange(tileX, 0, level.width - 1) || !isInRange(tileY, 0, level.height - 1))
    return;

  let tileId = tileY * level.width + tileX;


  if (level.tiles[tileId] == false) return;
  level.tiles[tileId] = false;

  updateTilesAround(tileId);
}

function placeTile(){
  let worldPos = screenDrawer.screenToWorldPoint(input.mousePos.x, input.mousePos.y);
  let tileX = Math.floor(worldPos.x / 16);
  let tileY = Math.floor(worldPos.y / 16);
  if (!isInRange(tileX, 0, level.width - 1) || !isInRange(tileY, 0, level.height - 1))
    return;

  let tileId = tileY * level.width + tileX;

  if (level.tiles[tileId] != false) return;

  switch(settings.chosenTile){
    case TILE_WALL : level.tiles[tileId] = getWallTileValue(tileX, tileY);  updateTilesAround(tileId); break;
    case TILE_MONSTER_ROCKET :{
      let dir = 1;
      if(tileX < level.width-1 && level.tiles[tileX+1 + tileY * level.width].type == TILE_WALL) dir = -1;
       level.tiles[tileId] = {type : TILE_MONSTER_ROCKET, offset : 0, direction : dir}; 
    }break;
    case TILE_SPIKES : level.tiles[tileId] = getSpikesTileValue(tileX, tileY); break;
    case TILE_MOVING_SPIKES : level.tiles[tileId] = { type: TILE_MOVING_SPIKES,  offset : 0}; break;
    case TILE_MONSTER_FLY :  level.tiles[tileId] = { type: TILE_MONSTER_FLY, rangeN : 1, rangeP: 1 }; break;
    case TILE_MONSTER_DROPPER : level.tiles[tileId] = { type: TILE_MONSTER_DROPPER, offset : 0}; break;
    case TILE_MONSTER_SIDE : level.tiles[tileId] = { type: TILE_MONSTER_SIDE, rangeN : 1, rangeP: 1 }; break;
    case TILE_START : level.startX = tileX; level.startY = tileY; break;
    case TILE_COIN : level.tiles[tileId] = { type: TILE_COIN}; break;
    case TILE_CHECKPOINT : level.tiles[tileId] = {type : TILE_CHECKPOINT}; break;
  }

}

function updateTilesAround(tileId) {
  let tileX = tileId % level.width;
  let tileY = Math.floor(tileId / level.width);

  if (tileX > 0) {//left
    if (level.tiles[tileId - 1].type == TILE_WALL)
      level.tiles[tileId - 1] = getWallTileValue(tileX - 1, tileY);
    else if (level.tiles[tileId - 1].type == TILE_SPIKES)
      level.tiles[tileId - 1] = getSpikesTileValue(tileX - 1, tileY);
  }

  if (tileX < level.width - 1) {//right
    if (level.tiles[tileId + 1].type == TILE_WALL)
      level.tiles[tileId + 1] = getWallTileValue(tileX + 1, tileY);
    else if (level.tiles[tileId + 1].type == TILE_SPIKES)
      level.tiles[tileId + 1] = getSpikesTileValue(tileX + 1, tileY);
  }

  if (tileY > 0) {//top
    if (level.tiles[tileId - level.width].type == TILE_WALL)
      level.tiles[tileId - level.width] = getWallTileValue(tileX, tileY - 1);
    else if (level.tiles[tileId - level.width].type == TILE_SPIKES)
      level.tiles[tileId - level.width] = getSpikesTileValue(tileX, tileY - 1);
    else if (level.tiles[tileId - level.width].type == TILE_CHECKPOINT)
      level.tiles[tileId - level.width] = false;
  }

  if (tileY < level.height - 1) {//bottom
    if (level.tiles[tileId + level.width].type == TILE_WALL)
      level.tiles[tileId + level.width] = getWallTileValue(tileX, tileY + 1);
    else if (level.tiles[tileId + level.width].type == TILE_SPIKES)
      level.tiles[tileId + level.width] = getSpikesTileValue(tileX, tileY + 1);
  }

}

function getWallTileValue(tileX, tileY) {
  var value = { type: TILE_WALL, spriteId: 0, sides: [0, 0, 0, 0] };

  var sideSum = 0;

  if (tileY > 0 && level.tiles[tileX + (tileY - 1) * level.width].type != TILE_WALL) { //top
    sideSum += 1;
    value.sides[0] = 1;
  }
  if (tileY < level.height - 1 && level.tiles[tileX + (tileY + 1) * level.width].type != TILE_WALL) {//bottom 
    sideSum += 12;
    value.sides[2] = 1;
  }
  if (tileX > 0 && level.tiles[tileX - 1 + tileY * level.width].type != TILE_WALL) {//left 
    sideSum += 24;
    value.sides[3] = 1;
  }
  if (tileX < level.width - 1 && level.tiles[tileX + 1 + tileY * level.width].type != TILE_WALL) {//right 
    sideSum += 6;
    value.sides[1] = 1;
  }

  value.spriteId = tilemapIdTranslation.get(sideSum);

  return value;
}

function flipSpikes(id){
  switch(level.tiles[id].spriteId){
    case 1: level.tiles[id] = { type: TILE_SPIKES, spriteId: 6, sides: [1, 0] }; break;//T to R
    case 6: level.tiles[id] = { type: TILE_SPIKES, spriteId: 9, sides: [0, 1] }; break;//R to B
    case 9: level.tiles[id] = { type: TILE_SPIKES, spriteId: 4, sides: [-1, 0] }; break;//B to L
    case 4: level.tiles[id] = getSpikesTileValue(id % level.width, Math.floor(id / level.width)); break;//L to D
    default: level.tiles[id] = { type: TILE_SPIKES, spriteId: 1, sides: [0, -1] }; break;//D to T
  }
}

function getSpikesTileValue(tileX, tileY) {
  var value = { type: TILE_SPIKES, spriteId: 0, sides: [0, 0] };
  var sideSum = 0;
  var verticalNeighbours = 0;
  var horizontalNeighbours = 0;

  if (tileY > 0 && level.tiles[tileX + (tileY - 1) * level.width].type == TILE_WALL) { //top
    sideSum += 1;
    verticalNeighbours++;
    value.sides[1] = -1;
  }
  if (tileY < level.height - 1 && level.tiles[tileX + (tileY + 1) * level.width].type == TILE_WALL) {//bottom 
    sideSum += 12;
    verticalNeighbours++;
    value.sides[1] = 1;
  }
  if (tileX > 0 && level.tiles[tileX - 1 + tileY * level.width].type == TILE_WALL) {//left 
    sideSum += 24;
    horizontalNeighbours++;
    value.sides[0] = -1;
  }
  if (tileX < level.width - 1 && level.tiles[tileX + 1 + tileY * level.width].type == TILE_WALL) {//right 
    sideSum += 6;
    horizontalNeighbours++;
    value.sides[0] = 1;
  }

  if (verticalNeighbours == 2 || horizontalNeighbours == 2 || verticalNeighbours + horizontalNeighbours == 0)
    value.sides = true;

  value.spriteId = tilemapIdTranslation.get(sideSum);
  return value;
}

class ScreenDrawer {
  constructor() {
    this.size = { x: canvas.width, y: canvas.height };
    this.cameraPos = { x: 0, y: 0 };
    this.cameraZoom = 1;
    this.cameraShake = { strength: 0, duration: 0, timeCounter: 0 };
    this.speed = 0.1;
    this.hookPos = { x: 0, y: 0 };
    this.tilemapSprite = new Image();
    this.tilemapSprite.src = '../sprites/tilemap.png';
    this.entitiesSprite = new Image();
    this.entitiesSprite.src = '../sprites/entities.png';
  }

  drawSideMonser(x, y, rN, rP) {
    let sx = x * settings.tileSize - this.cameraPos.x + this.size.x / 2;
    let sy = y * settings.tileSize - this.cameraPos.y + this.size.y / 2;


    if (settings.mouseMode == MODE_OBJECT) {
      let x1 = (x - rN) * settings.tileSize - this.cameraPos.x + this.size.x / 2;
      let x2 = (x + rP +1 ) * settings.tileSize - this.cameraPos.x + this.size.x / 2;
      let ly = (y + 0.5) * settings.tileSize - this.cameraPos.y + this.size.y / 2;

      ctx.strokeStyle = "yellow";
      ctx.beginPath();
      ctx.moveTo(x1, ly);
      ctx.lineTo(x2, ly);
      ctx.stroke();
    }

    ctx.drawImage(this.entitiesSprite, 48, 48, 15, 15, sx, sy, settings.tileSize, settings.tileSize);
  }

  drawFlyingMonser(x, y, rN, rP) {
    let sx = x * settings.tileSize - this.cameraPos.x + this.size.x / 2;
    let sy = y * settings.tileSize - this.cameraPos.y + this.size.y / 2;

    if (settings.mouseMode == MODE_OBJECT) {
      let y1 = (y - rN) * settings.tileSize - this.cameraPos.y + this.size.y / 2;
      let y2 = (y + rP+1) * settings.tileSize - this.cameraPos.y + this.size.y / 2;
      let lx = (x + 0.5) * settings.tileSize - this.cameraPos.x + this.size.x / 2;


      ctx.strokeStyle = "yellow";
      ctx.beginPath();
      ctx.moveTo(lx, y1);
      ctx.lineTo(lx, y2);
      ctx.stroke();
    }

    ctx.drawImage(this.entitiesSprite, 0, 48, 15, 15, sx, sy, settings.tileSize, settings.tileSize);
  }

  update() {
    if (input.mousePressed && input.ctrlPressed && input.mouseButton == 0 && settings.mouseMode != MODE_LOOSE) {
      this.cameraPos.x = this.hookPos.x + input.mouseHook.x - input.mousePos.x;
      this.cameraPos.y = this.hookPos.y + input.mouseHook.y - input.mousePos.y;
    }
  }

  highlightTileUnderMouse() {
    let worldPos = screenDrawer.screenToWorldPoint(input.mousePos.x, input.mousePos.y);
    let tileX = Math.floor(worldPos.x / 16);
    let tileY = Math.floor(worldPos.y / 16);
    if (!isInRange(tileX, 0, level.width - 1) || !isInRange(tileY, 0, level.height - 1))
      return;
    let screenPos = screenDrawer.worldToScreenPoint(tileX * settings.tileSize, tileY * settings.tileSize);

    ctx.strokeStyle = "yellow";
    ctx.beginPath();
    ctx.rect(screenPos.x, screenPos.y, settings.tileSize, settings.tileSize);
    ctx.stroke();
  }

  clear(color = "black") {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, this.size.x, this.size.y);
  }

  drawGrid() {
    var xRange = {
      start: Math.max(0, Math.floor((this.cameraPos.x - this.size.x / 2) / settings.tileSize)),
      end: Math.min(level.width, Math.ceil((this.cameraPos.x + this.size.x / 2) / settings.tileSize))
    };
    var yRange = {
      start: Math.max(0, Math.floor((this.cameraPos.y - this.size.y / 2) / settings.tileSize)),
      end: Math.min(level.height, Math.ceil((this.cameraPos.y + this.size.y / 2) / settings.tileSize))
    };
    for (var y = yRange.start; y <= yRange.end; y++) {
      let posA = this.worldToScreenPoint(xRange.start * settings.tileSize, y * settings.tileSize);
      let posB = this.worldToScreenPoint(xRange.end * settings.tileSize, y * settings.tileSize);
      ctx.strokeStyle = y % yRange.end == 0 ? "red" : "#7d7d7d";
      ctx.lineWidth = y % yRange.end == 0 ? 3 : 1;
      ctx.beginPath();
      ctx.moveTo(posA.x, posA.y);
      ctx.lineTo(posB.x, posB.y);
      ctx.stroke();
    }


    for (var x = xRange.start; x <= xRange.end; x++) {
      let posA = this.worldToScreenPoint(x * settings.tileSize, yRange.start * settings.tileSize);
      let posB = this.worldToScreenPoint(x * settings.tileSize, yRange.end * settings.tileSize);
      ctx.strokeStyle = x % 36 == 0 ? "red" : "#7d7d7d";
      ctx.lineWidth = x % 36 == 0 ? 3 : 1;
      ctx.beginPath();
      ctx.moveTo(posA.x, posA.y);
      ctx.lineTo(posB.x, posB.y);
      ctx.stroke();
    }
  }

  drawTiles() {
    ctx.imageSmoothingEnabled = false;

    var xRange = {
      start: Math.max(0, Math.floor((this.cameraPos.x - this.size.x / 2) / settings.tileSize)),
      end: Math.min(level.width - 1, Math.ceil((this.cameraPos.x + this.size.x / 2) / settings.tileSize))
    };
    var yRange = {
      start: Math.max(0, Math.floor((this.cameraPos.y - this.size.y / 2) / settings.tileSize)),
      end: Math.min(level.height - 1, Math.ceil((this.cameraPos.y + this.size.y / 2) / settings.tileSize))
    };

    for (var y = yRange.start; y <= yRange.end; y++) {
      for (var x = xRange.start; x <= xRange.end; x++) {
        var id = y * level.width + x;
        if (level.tiles[id] != false) {
          let tx = x * settings.tileSize - this.cameraPos.x + this.size.x / 2;
          let ty = y * settings.tileSize - this.cameraPos.y + this.size.y / 2;

          switch (level.tiles[id].type) {
            case TILE_WALL:{
              let sy = Math.floor(level.tiles[id].spriteId / 4);
              let sx = level.tiles[id].spriteId - sy * 4;
          
              ctx.drawImage(this.tilemapSprite, sx * 17, sy * 17, 16, 16, tx, ty, settings.tileSize, settings.tileSize); 
            }break;
            case TILE_SPIKES:{
              let sy = Math.floor(level.tiles[id].spriteId / 4);
              let sx = level.tiles[id].spriteId - sy * 4;
          
              ctx.drawImage(this.tilemapSprite, sx * 17, (sy+4) * 17, 16, 16, tx, ty, settings.tileSize, settings.tileSize); 
            }break;
            case TILE_CHECKPOINT: ctx.drawImage(this.entitiesSprite, 0, 34, 16, 16, tx, ty, settings.tileSize, settings.tileSize); break;
            case TILE_MOVING_SPIKES: ctx.drawImage(this.entitiesSprite, 34, 16, 16, 15, tx, ty, settings.tileSize, settings.tileSize); break;
            case TILE_MONSTER_SIDE: this.drawSideMonser(x, y, level.tiles[id].rangeN, level.tiles[id].rangeP); break;
            case TILE_MONSTER_FLY: this.drawFlyingMonser(x, y, level.tiles[id].rangeN, level.tiles[id].rangeP); break;
            case TILE_MONSTER_DROPPER: ctx.drawImage(this.entitiesSprite, 29, 32, 16, 15, tx, ty, settings.tileSize, settings.tileSize); break;
            case TILE_MONSTER_ROCKET : ctx.drawImage(this.entitiesSprite, level.tiles[id].direction == 1 ? 58 : 44, 5, 13, 10, tx, ty, settings.tileSize, settings.tileSize); break;
            case TILE_COIN: ctx.drawImage(this.entitiesSprite, 33, 5, 10, 10, tx, ty, settings.tileSize, settings.tileSize); break;
          }

        }
      }
    }

  }

  drawStart() {
    let tx = level.startX * settings.tileSize - this.cameraPos.x + this.size.x / 2;
    let ty = level.startY * settings.tileSize - this.cameraPos.y + this.size.y / 2;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.entitiesSprite, 0, 0, 10, 15, tx, ty, settings.tileSize, settings.tileSize);
  }

  screenToWorldPoint(x, y) {
    let tx = (x + this.cameraPos.x - this.size.x / 2) / (settings.tileSize / 16);
    let ty = (y + this.cameraPos.y - this.size.y / 2) / (settings.tileSize / 16);
    return { x: tx, y: ty };
  }

  worldToScreenPoint(x, y) {
    let tx = x - this.cameraPos.x + this.size.x / 2;
    let ty = y - this.cameraPos.y + this.size.y / 2;
    return { x: tx, y: ty };
  }

  hookCamera() {
    this.hookPos = { x: this.cameraPos.x, y: this.cameraPos.y };
  }

}

function buttonCenter() {
  screenDrawer.cameraPos.x = 0;
  screenDrawer.cameraPos.y = 0;
}

function buttonGrid() {
  settings.showGrid = !settings.showGrid;
}

function buttonReset() {
  if (!confirm('Are you sure you want to clear the level?'))
    return;

  var newWidth = 0;
  while (newWidth <= 1)
    newWidth = parseInt(prompt('width: ', '20'));

  var newHeight = 0;
  while (newHeight <= 0)
    newHeight = parseInt(prompt('height: ', '10'));

  level.tiles = new Array(newHeight * newWidth).fill(false);

  level.width = newWidth;
  level.height = newHeight;
  level.startX = 0;
  level.startY = 0;
  level.endX = 16;
  level.endY = 0;
}

function buttonHelp(){
  alert("LMB to paint selected node \n RMB to erase \n CTRL + LMB to move around \n config lets you config some entities \n if you get lost use center button \n upload and download .json files");
}

function buttonPlay(){
  var w = window.open('../game/index.html');
  var levelCopy = JSON.parse(JSON.stringify(level));
  levelCopy.tiles[level.startX + level.startY * level.width] = { type: TILE_START };
  levelCopy.tileSize = 16;
  w.level = levelCopy;
}

function changeTileButton(tileType, button) {
  if (tileType == -1) {
    settings.mouseMode = MODE_OBJECT;
  }
  else {
    settings.chosenTile = tileType;
    settings.mouseMode = MODE_TILE;
  }

  var otherButtons = document.getElementsByClassName("tileChoiceDiv");

  for (let i = 0; i < otherButtons.length; i++)
    otherButtons[i].setAttribute("chosen", "false");

  button.setAttribute("chosen", "true");
}

function switchGridButton(button) {
  settings.showGrid = !settings.showGrid;
  button.setAttribute("state", settings.showGrid ? "on" : "off");
}

function loadFromFile(file) {
  console.log(file);

  var fr = new FileReader();

  fr.onload = function (e) {
    var result = JSON.parse(e.target.result);
    console.log(result);
    for (var i = 0; i < result.tiles.length; i++) {
      if (result.tiles[i] == false) continue;
      if (result.tiles[i] == null || result.tiles[i].type == 'b' || result.tiles[i].type == 'e') result.tiles[i] = false;
    }
    level = result;
  }

  fr.readAsText(file);
}

function buttonDownload() {
  var levelCopy = JSON.parse(JSON.stringify(level));

  levelString = JSON.stringify(levelCopy);

  console.log(levelString);

  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(levelString));
  element.setAttribute('download', 'levelData.json');

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function buttonUpload() {
  let input = document.getElementById("inputFile");
  input.click();
}

window.addEventListener('keydown', function (event) {

  switch (event.key) {
    case "Control":
      event.preventDefault();
      input.ctrlPressed = true;
      //canvas.style.cursor = "move";
      break;
  }

}, true);

window.addEventListener("keyup", function (event) {

  switch (event.key) {
    case "Control":
      event.preventDefault();
      input.ctrlPressed = false;
      //canvas.style.cursor = "default";
      break;
  }

}, true);

/*window.onbeforeunload = function(event)
{
  return confirm("Confirm refresh");
};*/