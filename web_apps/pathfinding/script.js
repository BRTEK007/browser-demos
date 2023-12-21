'use strict';
window.onload = setup;

let canvas, ctx;
let painter;

const INPUT = {
  painting: false,
  brush: 0,
  oldMouseCords: { x: null, y: null }
}

const BRUSH = {
  WALL: 0,
  EMPTY: 1,
  START: 2,
  END: 3
}

const COLORS = {
  GRID_LINE: "#7d7d7d",
  WALL: "#ababab",
  EMPTY: "black",
  START_NODE: "green",
  END_NODE: "red",
  MARKED: "#00698f",
  PATH: "yellow"
}

const WALL = true, EMPTY = false;

const SETTINGS = {
  size: 30,
  algorythm: 'A*',
  diagonal: true,
  speed: 26,
  heuristics: 'NONE',
  paused: false,
  weighting: 'HOMOGENIC'
}

const GRID = {
  cells: [],//false = empty, true = wall
  cell_size: 30,
  width: 20,
  height: 25,
  offset_x: 10,
  offset_y: 10,
  startCell: { x: 0, y: 0 },
  endCell: { x: 10, y: 2 },
  id: (x, y) => x + y * GRID.width
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = COLORS.GRID_LINE;
  for (let x = 1; x < GRID.width; x++) {
    ctx.beginPath();
    ctx.moveTo(GRID.offset_x + (1 + GRID.cell_size) * x, 0);
    ctx.lineTo(GRID.offset_x + (1 + GRID.cell_size) * x, canvas.height);
    ctx.stroke();
  }
  for (let y = 1; y < GRID.height; y++) {
    ctx.beginPath();
    ctx.moveTo(0, GRID.offset_y + (1 + GRID.cell_size) * y);
    ctx.lineTo(canvas.width, GRID.offset_y + (1 + GRID.cell_size) * y);
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.START_NODE;
  drawCell(GRID.startCell.x, GRID.startCell.y);
  ctx.fillStyle = COLORS.END_NODE;
  drawCell(GRID.endCell.x, GRID.endCell.y);
}

function drawCell(cx, cy) {
  let x = GRID.offset_x + cx * (GRID.cell_size + 1);
  let y = GRID.offset_y + cy * (GRID.cell_size + 1);
  let w = GRID.cell_size;
  let h = GRID.cell_size;
  if (cx == 0) {
    w += GRID.offset_x;
    x -= GRID.offset_x;
  } else if (cx == GRID.width - 1) {
    w += GRID.offset_x + 2;
  }
  if (cy == 0) {
    h += GRID.offset_y;
    y -= GRID.offset_y;
  } else if (cy == GRID.height - 1) {
    h += GRID.offset_y + 2;
  }
  //ctx.fillStyle = "white";
  ctx.fillRect(x + 1, y + 1, w - 1, h - 1);
}

function drawLine(cx, cy){
  let x = GRID.offset_x + cx * (GRID.cell_size + 1);
  let y = GRID.offset_y + cy * (GRID.cell_size + 1);
  let w = GRID.cell_size;
  let h = GRID.cell_size;
  if (cx == 0) {
    w += GRID.offset_x;
    x -= GRID.offset_x;
  } else if (cx == GRID.width - 1) {
    w += GRID.offset_x + 2;
  }
  if (cy == 0) {
    h += GRID.offset_y;
    y -= GRID.offset_y;
  } else if (cy == GRID.height - 1) {
    h += GRID.offset_y + 2;
  }
  //ctx.fillStyle = "white";
  ctx.fillRect(x + 1 + w/4, y + 1, w/2 - 1, h - 1);
  ctx.fillRect(x + 1, y + 1 + h/4, w - 1, h/2 - 1);
}

function drawWalls() {
  ctx.fillStyle = COLORS.WALL;
  for (let x = 0; x < GRID.width; x++) {
    for (let y = 0; y < GRID.height; y++) {
      let id = x + y * GRID.width;
      if (GRID.cells[id] == WALL)
        drawCell(x, y);
    }
  }
}

function lineCords(x0, y0, x1, y1) {
  let arr = new Array();

  if (Math.abs(x0 - x1) > Math.abs(y0 - y1)) {
    let step = (y1 - y0) / (x1 - x0);
    for (let x = x0; x <= x1; x++) {
      let y = y0 + Math.round((x - x0) * step);
      arr.push({x:x, y:y});
    }
  } else {
    let step = (x1 - x0) / (y1 - y0);
    for (let y = y0; y <= y1; y++) {
      let x = x0 + Math.round((y - y0) * step);

      arr.push({x:x, y:y});
    }
  }

  return arr;
}

function updateGridDimensions() {
  GRID.cell_size = SETTINGS.size;
  GRID.width = Math.floor((canvas.width - 1) / (GRID.cell_size + 1));
  GRID.height = Math.floor((canvas.height - 1) / (GRID.cell_size + 1));
  GRID.offset_x = Math.floor((canvas.width - (GRID.cell_size + 1) * GRID.width) / 2);
  GRID.offset_y = Math.floor((canvas.height - (GRID.cell_size + 1) * GRID.height) / 2);
  GRID.cells = new Array(GRID.width * GRID.height).fill(EMPTY);
  GRID.startCell = { x: Math.round(GRID.width * 0.3333), y: Math.round(GRID.height / 2) };
  GRID.endCell = { x: Math.round(GRID.width * 0.6666), y: Math.round(GRID.height / 2) };
}

function changeSettings(param, val) {
  switch (param) {
    case 'SIZE':
      SETTINGS.size = parseInt(val);
      updateGridDimensions();
      button_RESET();
      break;
    case 'ALGORYTHM':
      SETTINGS.algorythm = val;
      if (val == 'DFS') document.getElementById('heuristicsDiv').style.display = 'none';
      else document.getElementById('heuristicsDiv').style.display = 'block';
      break;
    case 'HEURISTICS':
      SETTINGS.heuristics = val;
      break;
    case 'SPEED':
      SETTINGS.speed = parseInt(val);
      break;
    case 'WEIGHTING':
      SETTINGS.weighting = val;
      console.log(SETTINGS.weighting);
      break;
  }
}

function mouseCordsToCellCords(mx, my) {
  let cx = Math.floor((mx - GRID.offset_x) / (GRID.cell_size + 1));
  cx = Math.min(cx, GRID.width - 1);
  cx = Math.max(cx, 0);
  let cy = Math.floor((my - GRID.offset_y) / (GRID.cell_size + 1));
  cy = Math.min(cy, GRID.height - 1);
  cy = Math.max(cy, 0);
  return { x: cx, y: cy }
}

function setup() {
  canvas = document.getElementById('canvas1');

  canvas.addEventListener('mousedown', e => {
    if (painter != null) return;
    INPUT.painting = true;

    let cords = mouseCordsToCellCords(e.offsetX, e.offsetY);
    INPUT.oldMouseCords = { x: cords.x, y: cords.y };

    if (cords.x == GRID.startCell.x && cords.y == GRID.startCell.y) {
      INPUT.brush = BRUSH.START;
    } else if (cords.x == GRID.endCell.x && cords.y == GRID.endCell.y) {
      INPUT.brush = BRUSH.END;
    } else {
      if (e.button == 0) {
        ctx.fillStyle = COLORS.WALL;
        INPUT.brush = BRUSH.WALL;
      }
      else if (e.button == 2) {
        ctx.fillStyle = COLORS.EMPTY;
        INPUT.brush = BRUSH.EMPTY;
      }
      let id = cords.x + cords.y * GRID.width;
      GRID.cells[id] = INPUT.brush == BRUSH.WALL ? WALL : EMPTY;
      drawCell(cords.x, cords.y);
    }
  });

  canvas.addEventListener('mousemove', e => {
    if (!INPUT.painting) return;
    let cords = mouseCordsToCellCords(e.offsetX, e.offsetY);

    if (INPUT.brush == BRUSH.START) {
      if (cords.x == GRID.endCell.x && cords.y == GRID.endCell.y) return;
      let id = cords.x + cords.y * GRID.width;
      if (GRID.cells[id] == WALL) return;
      let oldId = GRID.startCell.x + GRID.startCell.y * GRID.width;
      ctx.fillStyle = GRID.cells[oldId] == WALL ? COLORS.WALL : COLORS.EMPTY;
      drawCell(GRID.startCell.x, GRID.startCell.y);
      ctx.fillStyle = COLORS.START_NODE;
      drawCell(cords.x, cords.y);
      GRID.startCell.x = cords.x;
      GRID.startCell.y = cords.y;
      return;
    } else if (INPUT.brush == BRUSH.END) {
      if (cords.x == GRID.startCell.x && cords.y == GRID.startCell.y) return;
      let id = cords.x + cords.y * GRID.width;
      if (GRID.cells[id] == WALL) return;
      let oldId = GRID.endCell.x + GRID.endCell.y * GRID.width;
      ctx.fillStyle = GRID.cells[oldId] == WALL ? COLORS.WALL : COLORS.EMPTY;
      drawCell(GRID.endCell.x, GRID.endCell.y);
      ctx.fillStyle = COLORS.END_NODE;
      drawCell(cords.x, cords.y);
      GRID.endCell.x = cords.x;
      GRID.endCell.y = cords.y;
      return;
    }

    if (cords.x == GRID.startCell.x && cords.y == GRID.startCell.y) return;
    else if (cords.x == GRID.endCell.x && cords.y == GRID.endCell.y) return;

    let id = cords.x + cords.y * GRID.width;
    GRID.cells[id] = INPUT.brush == BRUSH.WALL ? WALL : EMPTY;

    drawCell(cords.x, cords.y);

    INPUT.oldMouseCords = { x: cords.x, y: cords.y };
  });

  canvas.addEventListener('mouseup', e => {
    INPUT.painting = false;
  });
  canvas.addEventListener('mouseleave', e => {
    INPUT.painting = false;
  });


  canvas.height = canvas.getBoundingClientRect().height;
  canvas.width = canvas.getBoundingClientRect().width;
  ctx = canvas.getContext('2d');
  updateGridDimensions();
  GRID.startCell = { x: Math.round(GRID.width * 0.3333), y: Math.round(GRID.height / 2) };
  GRID.endCell = { x: Math.round(GRID.width * 0.6666), y: Math.round(GRID.height / 2) };
  drawGrid();
  INPUT.painting = false;


  window.requestAnimationFrame(frame);
}

function frame() {
  if (painter != null && !painter.finished && !SETTINGS.paused) {
    painter.update();
  }
  window.requestAnimationFrame(frame);
}

function AStarSolve() {
  function neighbours(c) {
    let arr = [];

    if (c >= GRID.width && !visitedArr[c - GRID.width] && GRID.cells[c - GRID.width] != WALL) {
      arr.push(c - GRID.width);
    }
    if (c < GRID.width * (GRID.height - 1) && !visitedArr[c + GRID.width] && GRID.cells[c + GRID.width] != WALL) {
      arr.push(c + GRID.width);
    }
    if (c % GRID.width != GRID.width - 1 && !visitedArr[c + 1] && GRID.cells[c + 1] != WALL) {
      arr.push(c + 1);
    }
    if (c % GRID.width != 0 && !visitedArr[c - 1] && GRID.cells[c - 1] != WALL) {
      arr.push(c - 1);
    }

    if (arr.length > 0) return arr;
    else return null;
  }

  function heuristics(c1, c2) {
    if (SETTINGS.heuristics == 'NONE') return 1;

    let c1x = c1 % GRID.width;
    let c1y = (c1 - c1x) / GRID.width;
    let c2x = c2 % GRID.width;
    let c2y = (c2 - c2x) / GRID.width;

    switch (SETTINGS.heuristics) {
      case 'EUKLIDES': return Math.sqrt((c1x - c2x) * (c1x - c2x) + (c1y - c2y) * (c1y - c2y));
      case 'MANHATTAN': return Math.abs(c1x - c2x) + Math.abs(c1y - c2y);
      case 'CHEBYSHEW': return Math.max(Math.abs(c1x - c2x), Math.abs(c1y - c2y));
      case 'OCTILE': return Math.max(Math.abs(c1x - c2x), Math.abs(c1y - c2y) + 1.414 * Math.min(Math.abs(c1x - c2x), Math.abs(c1y - c2y)));
    }
  }

  function cellWeight(c) {
    if (SETTINGS.weighting == 'HOMOGENIC') return 1;
    if (SETTINGS.weighting == 'RANDOM') return Math.random();

    if (c >= GRID.width && GRID.cells[c - GRID.width] == WALL)
      return 10;

    if (c < GRID.width * (GRID.height - 1) && GRID.cells[c + GRID.width] == WALL)
      return 10;

    if (c % GRID.width != GRID.width - 1 && GRID.cells[c + 1] == WALL)
      return 10;

    if (c % GRID.width != 0 && GRID.cells[c - 1] == WALL)
      return 10;


    return 1;
  }

  function pickCell() {
    if(SETTINGS.heuristics == 'NONE') return queue.shift();
    let cost = Infinity;
    let index = 0;

    let endCell = GRID.id(GRID.endCell.x, GRID.endCell.y);

    for (let i = 0; i < queue.length; i++) {
      if (costArr[queue[i]] + heuristics(queue[i], endCell) < cost) {
        cost = costArr[queue[i]] + heuristics(queue[i], endCell);
        index = i;
      }
    }

    let cell = queue[index];
    queue.splice(index, 1);
    return cell;
  }

  function addPathToSolution() {
    solution.path.push(endCell);
    let cell = previousArr[GRID.id(GRID.endCell.x, GRID.endCell.y)];
    while (previousArr[cell] != undefined) {
      solution.path.push(cell);
      cell = previousArr[cell];
    }
    solution.path.push(startCell);
  }

  let costArr = new Array(GRID.width * GRID.height).fill(Infinity);
  let previousArr = new Array(GRID.width * GRID.height).fill(undefined);
  let visitedArr = new Array(GRID.width * GRID.height).fill(false);

  let startCell = GRID.id(GRID.startCell.x, GRID.startCell.y);
  let endCell = GRID.id(GRID.endCell.x, GRID.endCell.y);

  costArr[startCell] = 0;
  let queue = [startCell];

  let solution = {steps: new Array(), path: new Array()};

  while (queue.length > 0) {
    let cell = pickCell();

    if (visitedArr[cell] == true || GRID.cells[cell] == WALL) continue;


    if (cell != startCell && cell != endCell)
      solution.steps.push(cell);

    visitedArr[cell] = true;

    let cell_n = neighbours(cell);
    if (cell_n != null) {
      for (let i = 0; i < cell_n.length; i++) {

        let cell_weight = cellWeight(cell_n[i]);

        if (costArr[cell] + cell_weight < costArr[cell_n[i]]) {
          costArr[cell_n[i]] = costArr[cell] + cell_weight;
          previousArr[cell_n[i]] = cell;
          if (cell_n[i] == GRID.id(GRID.endCell.x, GRID.endCell.y)) {
            addPathToSolution();
            return solution;
          }
        }
        queue.push(cell_n[i]);
      }
    }
  }

  return solution;

}

class SolutionPainter{
  constructor(s){
    this.index = 0;
    this.finished = false;
    this.solution = s;
    ctx.fillStyle = COLORS.MARKED;
    this.update = () => this.drawSteps();
  }

  drawSteps(){
    for (let f = 0; f < SETTINGS.speed; f++) {
      let cx = this.solution.steps[this.index] % GRID.width;
      let cy = (this.solution.steps[this.index] - cx) / GRID.width;
      drawCell(cx, cy);
      this.index++;
      if (this.index >= this.solution.steps.length) {
          this.update = () => this.drawPath();
          this.index = 1;
          ctx.fillStyle = COLORS.PATH;
          return;
      }
    }
  }

  drawPath(){
    for (let f = 0; f < SETTINGS.speed; f++) {
      let cx = this.solution.path[this.index] % GRID.width;
      let cy = (this.solution.path[this.index] - cx) / GRID.width;
      // drawLine(cx, cy);
      drawCell(cx, cy);
      this.index++;
      if (this.index >= this.solution.path.length-1) {
          this.finished = true;
          document.getElementById('runButton').innerHTML = "CLEAR";
          return;
      }
    }
  }

}

function button_RUN() {
  let button = document.getElementById('runButton');

  switch (button.innerHTML) {
    case 'RUN':
      let t0 = performance.now();
      let solution = AStarSolve();
      let t1 = performance.now();
      //update info
      document.getElementById('info_1').innerHTML = t1-t0;
      document.getElementById('info_2').innerHTML = solution.steps.length;
      document.getElementById('info_3').innerHTML = solution.path.length-2;
      //
      painter = new SolutionPainter(solution);
      button.innerHTML = 'PAUSE';
      document.getElementById('coverDiv').style.display = "block";
      break;
    case 'PAUSE':
      SETTINGS.paused = true;
      button.innerHTML = 'RESUME';
      break;
    case 'RESUME':
      SETTINGS.paused = false;
      button.innerHTML = 'PAUSE';
      break;
    case 'CLEAR':
      drawGrid();
      drawWalls();
      painter = null;
      button.innerHTML = 'RUN';
      document.getElementById('coverDiv').style.display = "none"; 
      break;
  }
}

function button_FILLWALL(){
  GRID.cells = new Array(GRID.width * GRID.height).fill(WALL);
  GRID.cells[GRID.id(GRID.startCell.x, GRID.startCell.y)] = EMPTY;
  GRID.cells[GRID.id(GRID.endCell.x, GRID.endCell.y)] = EMPTY;
  drawWalls();
}

function button_RESET() {
  GRID.cells = new Array(GRID.width * GRID.height).fill(EMPTY);
  GRID.startCell = { x: Math.round(GRID.width * 0.3333), y: Math.round(GRID.height / 2) }
  GRID.endCell = { x: Math.round(GRID.width * 0.6666), y: Math.round(GRID.height / 2) }
  drawGrid();
  painter = null;
  document.getElementById('runButton').innerHTML = "RUN";
  document.getElementById('coverDiv').style.display = "none"; 
}
