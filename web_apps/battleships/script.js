const SHIPS = [4, 3, 3, 3, 2];
let canvas, ctx;
let playerBoard, botBoard;

const UP = -10,
  DOWN = 10,
  RIGHT = 1,
  LEFT = -1;

let playerPoints = 0,
  botPoints = 0,
  isPlaying = true;
let bot, bot2;

class Bot {
  constructor(_fboard) {
    this.shipOrigin = null;
    this.shipLastSlot = null;
    this.lastMove = null;
    this.direction = null;
    // this.focusedBoard = _fboard;
    this.shipsLeft = [...SHIPS];
    this.smallestShip = Infinity;
    for (let i = 0; i < this.shipsLeft.length; i++)
      this.smallestShip = Math.min(this.smallestShip, this.shipsLeft[i]);

    this.workingGrid = new Array(100); //true - covered, unknown - false
    for (let i = 0; i < 100; i++) this.workingGrid[i] = false;
  }

  getMove() {
    //to do, look for slots with most neighbours which neighbours count == 1
    if (this.shipOrigin == null) {
      const possibleSlots = [];

      const valuesArray = new Array(100);
      for (let i = 0; i < 100; i++) valuesArray[i] = 0;

      for (let i = 0; i < 100; i++) {
        if (!this.workingGrid[i]) {
          possibleSlots.push(i);
          let nc = 0;
          let nId = null;
          if (i > 9 && !this.workingGrid[i - 10]) {
            nc++;
            nId = i - 10;
          }
          if (i % 10 < 9 && !this.workingGrid[i + 1]) {
            nc++;
            nId = i + 1;
          }
          if (i % 10 > 0 && !this.workingGrid[i - 1]) {
            nc++;
            nId = i - 1;
          }
          if (i < 90 && !this.workingGrid[i + 10]) {
            nc++;
            nId = i + 10;
          }
          if (nc == 1) valuesArray[nId]++;
        }
      }
      //for each possible slot assign neighbours count value
      //for each possible slot with neighbours count value choose one which has the most neighbours having 1 negihbour
      const r = Math.floor(Math.random() * possibleSlots.length);
      const bestPossibleMove = {
        index: possibleSlots[r],
        value: valuesArray[r],
      };
      for (let i = 0; i < possibleSlots.length; i++) {
        if (r == i) continue;
        if (valuesArray[possibleSlots[i]] > bestPossibleMove.value) {
          // console.log('moveChange at', possibleSlots[i]);
          bestPossibleMove.index = possibleSlots[i];
          bestPossibleMove.value = valuesArray[possibleSlots[i]];
        }
      }
      this.lastMove = bestPossibleMove.index;
    } else {
      this.lastMove = this.shipLastSlot + this.direction;
    }
    return this.lastMove;
  }
  getAvailibleDirection() {
    const x = this.shipLastSlot % 10;
    const y = (this.shipLastSlot - x) / 10;

    if (
      this.direction != UP &&
      y > 0 &&
      !this.workingGrid[this.shipLastSlot - 10]
    ) {
      return UP;
    } else if (
      this.direction != RIGHT &&
      x < 9 &&
      !this.workingGrid[this.shipLastSlot + 1]
    ) {
      return RIGHT;
    } else if (
      this.direction != DOWN &&
      y < 9 &&
      !this.workingGrid[this.shipLastSlot + 10]
    ) {
      return DOWN;
    } else if (
      this.direction != LEFT &&
      x > 0 &&
      !this.workingGrid[this.shipLastSlot - 1]
    ) {
      return LEFT;
    }

    console.log("none bruh");
  }
  isDirectionLegit(_spot) {
    const x = _spot % 10;
    const y = (_spot - x) / 10;
    switch (this.direction) {
      case UP:
        if (y <= 0 || this.workingGrid[this.shipLastSlot - 10]) return false;
        break;
      case DOWN:
        if (y >= 9 || this.workingGrid[this.shipLastSlot + 10]) return false;
        break;
      case RIGHT:
        if (x >= 9 || this.workingGrid[this.shipLastSlot + 1]) return false;
        break;
      case LEFT:
        if (x <= 0 || this.workingGrid[this.shipLastSlot - 1]) return false;
        break;
    }
    return true;
  }
  notifyMiss() {
    this.workingGrid[this.lastMove] = true;
    if (this.shipOrigin != null) {
      if (this.shipLastSlot != this.shipOrigin) {
        //dir was good, so just flip it
        this.direction *= -1;
        // console.log('dir change 180');
        this.shipLastSlot = this.shipOrigin;
      } else {
        //choose availible dir
        this.shipLastSlot = this.shipOrigin;
        this.direction = this.getAvailibleDirection();
        // console.log('dir change twist');
      }
    }
    this.lookForSpacesTooSmall();
  }
  notifyDestroy(_ship) {
    this.workingGrid[this.lastMove] = true;
    //forget about the ship
    this.shipOrigin = null;
    this.shipLastSlot = null;
    this.direction = null;
    //remove slots around ship
    const surroundingSlots = getSlotsSurroundingShip(_ship);
    for (let i = 0; i < surroundingSlots.length; i++)
      this.workingGrid[surroundingSlots[i]] = true;
    //remove ship from remaining ships
    for (let i = 0; i < this.shipsLeft.length; i++) {
      if (this.shipsLeft[i] == _ship.size) {
        this.shipsLeft.splice(i, 1);
        break;
      }
    }
    //set new min ship size
    for (let i = 0; i < this.shipsLeft.length; i++)
      this.smallestShip = Math.min(this.smallestShip, this.shipsLeft[i]);
    // console.log('destroyed');
    this.lookForSpacesTooSmall();
  }
  lookForSpacesTooSmall() {
    for (let i = 0; i < 100; i++) {
      if (!this.workingGrid[i]) {
        let maxSizeHorizontal = 1;
        let maxSizeVertical = 1;

        const sx = i % 10;
        const sy = (i - sx) / 10;

        //right
        for (let x = sx + 1; x < 10; x++) {
          if (!this.workingGrid[sy * 10 + x]) maxSizeHorizontal++;
          else break;
        }
        //left
        for (let x = sx - 1; x >= 0; x--) {
          if (!this.workingGrid[sy * 10 + x]) maxSizeHorizontal++;
          else break;
        }

        //down
        for (let y = sy + 1; y < 10; y++) {
          if (!this.workingGrid[y * 10 + sx]) maxSizeVertical++;
          else break;
        }
        //up
        for (let y = sy - 1; y >= 0; y--) {
          if (!this.workingGrid[y * 10 + sx]) maxSizeVertical++;
          else break;
        }

        const maxSize = Math.max(maxSizeHorizontal, maxSizeVertical);

        if (maxSize < this.smallestShip) {
          this.workingGrid[i] = true;
          // console.log('removed for being small at', i)
        }
      }
    }
  }
  notifyHit() {
    this.workingGrid[this.lastMove] = true;

    this.shipLastSlot = this.lastMove;

    if (this.shipOrigin == null) {
      //first hit, choose direction and register
      // console.log('ship spotted');
      this.shipOrigin = this.lastMove;
      this.direction = this.getAvailibleDirection();
    } else {
      //make sure that direction is still legit, else change it
      if (!this.isDirectionLegit(this.lastMove)) {
        this.direction *= -1;
        this.shipLastSlot = this.shipOrigin;
        // console.log('dir change early');
      }
    }
    // this.lookForSpacesTooSmall();
  }
}

function getSlotsSurroundingShip(_ship) {
  const r = [];
  const x = _ship.spot % 10;
  const y = (_ship.spot - x) / 10;
  if (!_ship.isVertical) {
    if (y > 0) {
      for (let i = 0; i < _ship.size; i++) r.push(_ship.spot + i - 10);
    }
    if (y < 9) {
      for (let i = 0; i < _ship.size; i++) r.push(_ship.spot + i + 10);
    }
    if (x > 0) {
      r.push(_ship.spot - 1);
      if (y > 0) r.push(_ship.spot - 10 - 1);
      if (y < 9) r.push(_ship.spot + 10 - 1);
    }
    if (x + _ship.size - 1 < 9) {
      r.push(_ship.spot + _ship.size - 1 + 1);
      if (y > 0) r.push(_ship.spot + _ship.size - 10);
      if (y < 9) r.push(_ship.spot + _ship.size + 10);
    }
  } else {
    if (x > 0) {
      for (let i = 0; i < _ship.size; i++) r.push(_ship.spot + i * 10 - 1);
    }
    if (x < 9) {
      for (let i = 0; i < _ship.size; i++) r.push(_ship.spot + i * 10 + 1);
    }
    if (y > 0) {
      r.push(_ship.spot - 10);
      if (x > 0) r.push(_ship.spot - 10 - 1);
      if (x < 9) r.push(_ship.spot - 10 + 1);
    }
    if (y + _ship.size - 1 < 9) {
      r.push(_ship.spot + (_ship.size - 1) * 10 + 10);
      if (x > 0) r.push(_ship.spot + (_ship.size - 1) * 10 + 10 - 1);
      if (x < 9) r.push(_ship.spot + (_ship.size - 1) * 10 + 10 + 1);
    }
  }
  return r;
}

function checkGameOver() {
  if (playerPoints == SHIPS.length) {
    isPlaying = false;
    const gameOverDiv = document.getElementById("gameOverMessage");
    gameOverDiv.innerHTML = "You <br> won!";
    gameOverDiv.hidden = false;
    //alert('You won!');
  } else if (botPoints == SHIPS.length) {
    isPlaying = false;
    const gameOverDiv = document.getElementById("gameOverMessage");
    gameOverDiv.innerHTML = "You <br> lost!";
    gameOverDiv.hidden = false;
    //alert('You lost!');
  }
}

function createCells(_parent, _out) {
  const cellSize =
    window.innerWidth *
    0.01 *
    parseFloat(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--cell-size")
        .replace("vw", "")
    );
  for (let y = 0; y < 10; y++)
    for (let x = 0; x < 10; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.style.left = x * cellSize + x * 2 + "px";
      cell.style.top = y * cellSize + y * 2 + "px";
      cell.setAttribute("covered", true);

      _parent.appendChild(cell);
      _out[x + y * 10].div = cell;
    }
}

function uncoverDOMslot(_slot, _hit) {
  // console.log(_slot);
  _slot.div.removeChild(_slot.div.children[0]);
  _slot.div.setAttribute("covered", false);

  const seaDOM = document.createElement("div");
  seaDOM.classList.add(_hit ? "ship" : "sea");
  _slot.div.appendChild(seaDOM);

  const missDom = document.createElement("div");
  missDom.classList.add(_hit ? "hit" : "miss");
  seaDOM.appendChild(missDom);
}

function playerMove(_spot) {
  const ship = botBoard[_spot].ship;

  if (ship != null) {
    ship.hp--;

    if (ship.hp <= 0) {
      //console.log('destroyed');
      playerPoints++;
      checkGameOver();
      const surroundingSlots = getSlotsSurroundingShip(ship);
      for (let i = 0; i < surroundingSlots.length; i++) {
        const boardSlot = botBoard[surroundingSlots[i]];
        if (boardSlot.div.getAttribute("covered") == "true")
          uncoverDOMslot(boardSlot, false);
      }
    }

    uncoverDOMslot(botBoard[_spot], true);
  } else {
    uncoverDOMslot(botBoard[_spot], false);
  }

  // bot2.sendResponse(_spot, botBoard[_spot].ship != null, botBoard[_spot].ship != null ? botBoard[_spot].ship.hp <= 0 : false);

  //BOT//
  const botMove = bot.getMove();
  //console.log(botMove);
  const boardSlot = playerBoard[botMove];

  // console.log(botMove);

  boardSlot.div.removeChild(boardSlot.div.children[1]);
  boardSlot.div.setAttribute("covered", false);

  if (boardSlot.ship != null) {
    boardSlot.ship.hp--;

    if (boardSlot.ship.hp <= 0) {
      //console.log('destroyed');
      botPoints++;
      checkGameOver();
      const surroundingSlots = getSlotsSurroundingShip(boardSlot.ship);
      for (let i = 0; i < surroundingSlots.length; i++) {
        const boardSlot = playerBoard[surroundingSlots[i]];
        if (boardSlot.div.getAttribute("covered") == "true")
          uncoverDOMslot(boardSlot, false);
      }
    }

    uncoverDOMslot(boardSlot, true);
  } else {
    uncoverDOMslot(boardSlot, false);
  }

  if (boardSlot.ship != null) {
    if (boardSlot.ship.hp <= 0) bot.notifyDestroy(boardSlot.ship);
    else bot.notifyHit();
  } else bot.notifyMiss();
}

function setup() {
  playerBoard = new Array(100);
  botBoard = new Array(100);

  bot = new Bot(playerBoard);

  for (let i = 0; i < 100; i++) {
    playerBoard[i] = { div: null, ship: null };
    botBoard[i] = { div: null, ship: null };
  }

  createCells(document.getElementById("playerBoard"), playerBoard);
  createCells(document.getElementById("botBoard"), botBoard);

  createShips(playerBoard);
  createShips(botBoard);

  for (let i = 0; i < playerBoard.length; i++) {
    const cell = playerBoard[i].div;

    const content = document.createElement("div");
    content.classList.add(playerBoard[i].ship == null ? "sea" : "ship");

    cell.appendChild(content);

    const contentOverlay = document.createElement("div");
    contentOverlay.classList.add("covered");
    cell.appendChild(contentOverlay);
  }

  for (let i = 0; i < botBoard.length; i++) {
    const cell = botBoard[i].div;

    const content = document.createElement("div");

    content.classList.add("covered");
    content.addEventListener("click", () => {
      if (isPlaying) playerMove(i);
    });

    cell.appendChild(content);
  }
}

function createShips(_out) {
  const workingGrid = new Array(100);

  let debugPlacedShips = 0;

  for (let i = 0; i < 100; i++) workingGrid[i] = false;

  function getPossibleSpots(_size, _isVertical) {
    const r = [];

    function collidesWithOtherShip(_x, _y) {
      for (let i = 0; i < _size; i++) {
        const id = _x + _y * 10 + (_isVertical ? 10 * i : i);
        if (workingGrid[id]) return true;
      }
      return false;
    }

    const rangeY = _isVertical ? 10 - _size : 10;
    const rangeX = !_isVertical ? 10 - _size : 10;

    for (let y = 0; y < rangeY; y++)
      for (let x = 0; x < rangeX; x++) {
        if (!collidesWithOtherShip(x, y)) r.push(x + y * 10);
      }

    return r;
  }

  function placeShip(_spot, _size, _isVertical) {
    const ship = {
      hp: _size,
      size: _size,
      isVertical: _isVertical,
      spot: _spot,
    };

    for (let i = 0; i < _size; i++) {
      const id = _spot + (_isVertical ? 10 * i : i);
      _out[id].ship = ship;
      workingGrid[id] = true;
    }

    const surroundingSlots = getSlotsSurroundingShip(ship);
    for (let i = 0; i < surroundingSlots.length; i++)
      workingGrid[surroundingSlots[i]] = true;
  }

  let i = 0;
  while (debugPlacedShips < SHIPS.length) {
    //if(i == 1) return;
    let vertical = Math.random() > 0.5 ? 1 : 0;
    let slots = getPossibleSpots(SHIPS[i], vertical);

    if (slots.length <= 0) {
      vertical = !vertical;
      slots = getPossibleSpots(SHIPS[i], vertical);
    }

    if (slots.length > 0) {
      const slot = slots[Math.floor(Math.random() * slots.length)];
      placeShip(slot, SHIPS[i], vertical);
      debugPlacedShips++;
      i++;
    } else {
      for (let j = 0; j < 100; j++) {
        workingGrid[j] = false;
        _out[j].ship = null;
      }
      i = 0;
      debugPlacedShips = 0;
    }
  }
}

window.onload = setup;
