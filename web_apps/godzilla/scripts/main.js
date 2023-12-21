var canvas;
var ctx;
var map_data = [[15,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,1,2,2,2,1,2,2,2,2,1,1,2,1,1,2,1,2,1,2,1,2,1,1,2,1,1,2,1,1,2,1,2,1,2,1,2,1,1,2,1,1,2,1,1,2,2,2,1,2,2,2,1,1,2,1,1,2,2,2,2,1,1,1,1,1,2,2,2,2,1,1,1,1,1,2,2,2,2,2,2,2,1,1,1,1,1,2,2,1,2,1,1,1,1,1,2,1,2,2,1,1,2,2,1,2,1,1,1,1,1,2,1,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,1,1,2,1,1,1,1,1,2,1,1,2,1,1,2,1,1,2,2,2,2,2,2,2,1,1,2,1,1,2,1,1,2,1,1,1,1,1,2,1,1,2,1,1,2,2,2,2,1,0,0,0,1,2,2,2,2,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
[17,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,2,2,2,2,2,2,2,2,2,2,2,1,1,0,1,1,2,2,1,2,1,1,1,1,1,2,1,2,2,1,1,1,2,2,1,1,2,1,1,1,1,1,2,1,1,2,2,1,1,2,1,1,2,2,2,2,2,2,2,2,2,1,1,2,1,1,2,2,2,2,1,1,1,1,1,1,1,2,2,2,2,1,1,1,2,1,2,2,2,2,2,2,2,2,2,1,2,1,1,0,1,2,1,2,1,1,1,2,1,1,1,2,1,2,1,0,0,1,2,1,2,1,0,1,1,1,0,1,2,1,2,1,0,0,1,2,1,2,1,1,1,2,1,1,1,2,1,2,1,0,1,1,2,1,2,2,2,2,2,2,2,2,2,1,2,1,1,1,2,2,1,2,1,1,1,2,1,1,1,2,1,2,2,1,1,1,2,2,2,2,2,1,2,1,2,2,2,2,2,1,1,1,2,2,1,1,1,2,1,2,1,2,1,1,1,2,2,1,1,1,2,2,1,2,2,1,2,1,2,2,1,2,2,1,1,0,1,1,2,2,2,2,2,2,2,2,2,2,2,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
[19,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1,1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1,1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1,1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1,1,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,1,0,0,0,1,2,1,2,2,2,2,2,2,2,1,2,1,0,0,0,0,0,0,1,2,1,2,1,1,1,1,1,2,1,2,1,0,0,0,0,0,0,1,2,2,2,2,2,1,2,2,2,2,2,1,0,0,0,1,1,1,1,2,1,2,1,2,1,2,1,2,1,2,1,1,1,1,1,2,2,2,2,1,2,1,1,1,1,1,2,1,2,2,2,2,1,1,2,1,1,2,2,2,2,2,2,2,2,2,2,2,1,1,2,1,1,2,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,2,1,1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1,1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]];

var img = [];
//var audio = [];
var game;

function timestamp() {
  return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
}

var now,
    dt   = 0,
    last = timestamp(),
    step = 1/30;

function frame() {
  now = timestamp();
  dt = dt + Math.min(1, (now - last) / 1000);
  while(dt > step) {
    dt = dt - step;
    if(game)
      game.update();
  }
  //console.log(1000 / (now - last)) //fps
  last = now;
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

function setup(){
  canvas = document.getElementById('myCanvas');
  canvas.width = /*(80/80) **/ 304;
  canvas.height = (95/85) * 304;
  ctx = canvas.getContext("2d");
  load_assets();
  game = new Game(map_data[0]);
  game.level = 0;
  game.init();
}
function load_assets(){
  img[0] = new Image();  img[0].src = 'img/godzilla_anim.png';
  img[1] = new Image();  img[1].src = 'img/buildings.png';
  img[2] = new Image();  img[2].src = 'img/roads.png';
  img[3] = new Image();  img[3].src = 'img/drop.png';
  img[4] = new Image();  img[4].src = 'img/drop_anim.png';
  img[5] = new Image();  img[5].src = 'img/human.png';
  img[6] = new Image();  img[6].src = 'img/explosion1.png';
  img[7] = new Image();  img[7].src = 'img/building_heal.png';
  img[8] = new Image();  img[8].src = 'img/blood.png';
  img[9] = new Image();  img[9].src = 'img/bomb.png';
  img[10] = new Image();  img[10].src = 'img/bomber.png';
  img[11] = new Image();  img[11].src = 'img/meter_0.png';
  img[12] = new Image();  img[12].src = 'img/meter_1.png';
  img[13] = new Image();  img[13].src = 'img/font.png';
  img[14] = new Image();  img[14].src = 'img/brick_UI_empty.png';
  img[15] = new Image();  img[15].src = 'img/brick_UI_blue.png';
  img[16] = new Image();  img[16].src = 'img/brick_UI_red.png';
  img[17] = new Image();  img[17].src = 'img/scale_0.png';
  img[18] = new Image();  img[18].src = 'img/scale_1.png';
  //
  

  /*audio[0] = new Audio();
  var src1 = document.createElement("source");
  src1.type = "audio/mpeg";
  src1.src = 'sounds/explosion.wav';
  audio[0].appendChild(src1);

  audio[1] = new Audio();
  var src2 = document.createElement("source");
  src2.type = "audio/mpeg";
  src2.src = 'sounds/pickup.wav';
  audio[1].appendChild(src2);

  audio[2] = new Audio();
  var src3 = document.createElement("source");
  src3.type = "audio/mpeg";
  src3.src = 'sounds/repair.wav';
  audio[2].appendChild(src3);

  audio[3] = new Audio();
  var src4 = document.createElement("source");
  src4.type = "audio/mpeg";
  src4.src = 'sounds/smash.wav';
  audio[3].appendChild(src4);*/
}
function dist(x1,y1,x2,y2){
  return Math.sqrt(Math.pow(x1 -x2) + Math.pow(y1 - y2));
}
window.addEventListener("keydown", function (event) {
  if (event.defaultPrevented) {
    return;
  }
  switch (event.key) {
    case "ArrowDown":
      game.godzilla.change_dir(2);
      break;
    case "ArrowUp":
      game.godzilla.change_dir(0);
      break;
    case "ArrowLeft":
      game.godzilla.change_dir(3);
      break;
    case "ArrowRight":
      game.godzilla.change_dir(1);
      break;
    case "Enter":
        game.paused = !game.paused;
        console.log(game.paused);
    break;
    default:
      return; // Quit when game doesn't handle the key event.
  }
  event.preventDefault();
}, true);
function random_from(arr){
  return arr[Math.floor(Math.random() * arr.length)];
}
function random_range(min, max){
  return Math.round(Math.random() * (max-min)) + min;
}

function next_level(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let score = game.score;
  let level = game.level;
  if(level < 2){
    game = new Game(map_data[level+1]);
    game.score = score;
    game.level =  level +1;
    game.init();
  }else{
    game.paused = true;
    alert("You won!");
    ctx.filter = 'sepia(1)';
    game.draw();
  }

 }