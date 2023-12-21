class Game{

constructor(data){
  this.map;
  this.godzilla = new Godzilla(1,1);
  this.toDrawTemp = [];
  this.frame = 0;
  this.broken_buildings = 0;
  this.score = 0;
  this.time = 120;
  this.paused = true;
  this.stage = 0;
  this.map_data = [...data];
  this.map_size = this.map_data[0];
  this.x_offset = 16*(19 - this.map_size)/2;
  this.map_data.shift();
  this.roads_ids = [];
  this.buildings_ids = [];
  this.time_counter;
  this.destruction_level;
}

draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.map.forEach(block => {
      if(block instanceof Block)
        ctx.drawImage(img[block.sprite_id], block.id * 16,0,16,16,block.x*16 + this.x_offset, block.y*16 + this.x_offset,16,16);
    });

    //layer sorting
    var toDraw_sorted = [[],[],[],[],[]];
    this.toDrawTemp.forEach(temp =>{
      if(temp.layer == null || temp.layer == 0)
        toDraw_sorted[0].push(temp);
      else if(temp.layer > 0)
        toDraw_sorted[temp.layer].push(temp);
        //-1 = ignore layer
    });
    //layer 1 - 3
    for(let i = 0; i < 4; i++){
      toDraw_sorted[i].forEach(temp =>{
        ctx.drawImage(img[temp.img_id], temp.anim_frame*temp.r_w, temp.row*temp.r_h,temp.r_w,temp.r_h,temp.sx + this.x_offset, temp.sy + this.x_offset,temp.width,temp.height);
      });
    };
    //godzilla
    ctx.drawImage(img[0], this.godzilla.anim_frame*16, this.godzilla.move_dir*16, 16,16,this.godzilla.x*16 + this.x_offset, this.godzilla.y * 16 + this.x_offset,16,16);
    //layer 4
    toDraw_sorted[4].forEach(temp =>{
      ctx.drawImage(img[temp.img_id], temp.anim_frame*temp.r_w, temp.row*temp.r_h,temp.r_w,temp.r_h,temp.sx + this.x_offset, temp.sy + this.x_offset,temp.width,temp.height);
    });

    let inv = [14,14,14];

    for(let i = 0; i < 3; i++){
      switch(this.godzilla.bricks[i]){
        case 0: inv[i] = 15; break;
        case 1: inv[i] = 16; break;
        default: inv[i] = 14;
      }
    }

    ctx.drawImage(img[inv[0]], 64, 310);
    ctx.drawImage(img[inv[1]], 84, 310);
    ctx.drawImage(img[inv[2]], 104, 310);

    ctx.drawImage(img[17], 184, 310);
    let fill = this.destruction_level/100;
    ctx.drawImage(img[18], 0,0, fill * 56, 16, 184, 310, fill*56, 16);

      
    let time_0 = Math.floor(this.time/100);
    ctx.drawImage(img[13], time_0 * 16, 0, 16, 16, 124, 310, 16, 16);
    let time_1 = Math.floor((this.time-time_0*100)/10);
    ctx.drawImage(img[13], time_1 * 16, 0, 16, 16, 144, 310, 16, 16);
    let time_2 = this.time%10;
    ctx.drawImage(img[13], time_2 * 16, 0, 16, 16, 164, 310, 16, 16);
}
init(){ 
  this.map = new Array(this.map_size*this.map_size);
  for(let i = 0; i < this.map_size * this.map_size; i++){
    if(this.map_data[i] == 1){
      this.map[i] = new Building(i,Math.round(Math.random()),0);
      this.buildings_ids.push(i);
    }
    else if(this.map_data[i] == 2){
      this.map[i] = this.createRoad(i);
      this.roads_ids.push(i);
    }
  }

  let p = random_from(this.roads_ids);
  this.godzilla = new Godzilla(cords(p)[0],cords(p)[1]);

  this.time_counter = setInterval(function(){
    if(game.paused)
      return;
    game.time--; 
    if(game.time == 0){
     game.update_score();
     game.repair(); 
     return;
    }
    if(game.time % 30 == 0)
      game.next_stage();
    if(game.time % 10 == 0)
      game.update_score();
  }, 1000);

  this.next_stage();

  game.begin_anim(-game.map_size);
}
begin_anim(id){
  if(id == game.map.length){
    game.paused = false;
    return;
  }
  for(let i = 0; i < game.map_size; i++){
  if(game.map[id] instanceof Block)
    ctx.drawImage(img[game.map[id].sprite_id], game.map[id].id * 16,0,16,16,game.map[id].x*16 + game.x_offset, game.map[id].y*16 + game.x_offset,16,16);
  id++;
  }
  setTimeout(game.begin_anim, 100, id);
}
next_stage(){
  this.stage++;

  switch(this.level){
    case 0:
      if(this.stage % 2 == 0){
        new Bomber(-5,1,[1,6,12]);
        new Bomber(-3,6,[1,6,12]);
        new Bomber(-5,11,[1,6,12]);
      }else{
        new Bomber(25,1,[1,6,12]);
        new Bomber(23,6,[1,6,12]);
        new Bomber(25,11,[1,6,12]);
      }
    break;
    case 1:
      if(this.stage % 2 == 0){
        new Bomber(-5,1,[1,7,13]);
        new Bomber(-3,7,[1,4,9,13]);
        new Bomber(-5,13,[1,7,13]);
      }else{
        new Bomber(25,1,[1,7,13]);
        new Bomber(23,7,[1,4,9,13]);
        new Bomber(25,13,[1,7,13]);
      }
    break;
    case 2:
      if(this.stage % 2 == 0){
        new Bomber(-7,15,[1,8,15]);
        new Bomber(-5,11,[1,6,11,15]);
        new Bomber(-3,6,[1,6,11,15]);
        new Bomber(-1,1,[1,8,15]);
      }else{
        new Bomber(25,1,[1,8,15]);
        new Bomber(23,6,[1,6,11,15]);
        new Bomber(21,11,[1,6,11,15]);
        new Bomber(19,15,[1,8,15]);
      }
    break;
  }

  let p = game.roads_ids[Math.floor(Math.random() * game.roads_ids.length)];
  new Human(cords(p)[0], cords(p)[1]);
}
update_score(){
  let modifier = (1 + (this.level*4 + this.stage)/10);
  this.score += Math.round((100 - this.destruction_level) * modifier);
}
createRoad(id){
  var code = [0, 0, 0, 0];

  if(id > this.map_size && this.map_data[id-this.map_size] == 2)
    code[0] = 1;
  if(id % this.map_size < this.map_size-1 && this.map_data[id+1] == 2)
    code[1] = 1;
  if(id < this.map_size*this.map_size-this.map_size && this.map_data[id+this.map_size] == 2)
    code[2] = 1;
  if(id % this.map_size > 0 && this.map_data[id-1] == 2)
    code[3] = 1;

  var w = 0;

  switch(JSON.stringify(code)){
    case JSON.stringify([0,1,0,1]):
        w = 0;
        break;
    case JSON.stringify([1,0,1,0]):
        w = 1;
        break;
    case JSON.stringify([1,0,0,1]):
        w = 2;
        break;
    case JSON.stringify([1,1,0,0]):
        w = 3;
        break;
    case JSON.stringify([0,1,1,0]):
        w = 4;
        break;
    case JSON.stringify([0,0,1,1]):
        w = 5;
        break;
   case JSON.stringify([1,0,1,1]):
        w = 6;
        break;
    case JSON.stringify([1,1,0,1]):
        w = 7;
        break;
    case JSON.stringify([1,1,1,0]):
        w = 8;
        break;
    case JSON.stringify([0,1,1,1]):
        w = 9;
        break;
    case JSON.stringify([1,1,1,1]):
        w = 10;
        break;
    case JSON.stringify([1,0,0,0]):
      w = 11;
      break;
    case JSON.stringify([0,1,0,0]):
      w = 12;
      break;
    case JSON.stringify([0,0,1,0]):
      w = 13;
      break;
    case JSON.stringify([0,0,0,1]):
      w = 14;
      break;
  }
  return new Road(id, w);
}
disaster(to_break, arr){
  if(to_break <= 0 || arr.length == 0)
    return;
  /*let r = arr[Math.floor(Math.random() * arr.length)];
  this.map[r].break();
  arr.splice(arr.indexOf(r),1);*/
  let p = arr[Math.floor(Math.random() * arr.length)];
  let bomb = new Bomb(cords(p)[0],cords(p)[1]);
  to_break--;
  setTimeout(disaster, 25, to_break, arr);
}
drop_brick(c){
  let p = this.roads_ids[Math.floor(Math.random() * this.roads_ids.length)];
  if(c != null)
    var brick = new Brick(cords(p)[0],cords(p)[1],c);
  else
    var brick = new Brick(cords(p)[0],cords(p)[1],Math.round(Math.random()));
}
drop_human(){
  let p = this.roads_ids[Math.floor(Math.random() * this.roads_ids.length)];
  var human = new Human(cords(p)[0], cords(p)[1]);
}
respawn_human(){
  let p = game.roads_ids[Math.floor(Math.random() * game.roads_ids.length)];
  var human = new Human(cords(p)[0], cords(p)[1]);
}
update(){
    if(this.paused)
      return;
    this.godzilla.update();
    this.frame++;
    if(this.frame == 48)
      this.frame = 0;
    for(let i = 0; i < this.toDrawTemp.length; i++){
      this.toDrawTemp[i].update();
    }
    this.destruction_level = Math.round((this.broken_buildings / this.buildings_ids.length)*420);
    this.draw();

    if(this.destruction_level >= 100)
      this.lost();
}
repair(){
  clearInterval(game.time_counter);
  this.toDrawTemp = null;
  this.paused = true;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  this.map.forEach(block =>{
    if(block instanceof Building)
      ctx.drawImage(img[1], block.color * 16,0,16,16,block.x*16 + this.x_offset, block.y*16 + this.x_offset,16,16);
    else if(block instanceof Road)
    ctx.drawImage(img[2], block.id * 16,0,16,16,block.x*16 + this.x_offset, block.y*16 + this.x_offset,16,16);
  });

  setTimeout(this.hide_anim, 1000, 0)

}
hide_anim(id){
  if(id == game.map_size){
    next_level();
    return;
  }
  //ctx.clearRect(0, id*16, canvas.width, 16);
  ctx.clearRect(0, (game.map_size-id)*16 + 16, canvas.width, 16);
  setTimeout(game.hide_anim, 100, id+1);
}

lost(){
  this.paused = true;
  ctx.filter = 'sepia(1)';
  this.draw();
  alert("You lost!");
}

}
class Block{
  constructor(p, id, s) {
    this.pos = p;
    this.x = p%game.map_size;
    this.y = (p-p%game.map_size)/game.map_size;
    this.id = id;
    this.sprite_id = s;//
  }
}

class Building extends Block{
    constructor(p, c, s) {
        super(p, c + s*2, 1);
        this.color = c;//0 blue, 1 red
        this.state = s;//0 fine, 1 broken
    }
    break(){
      this.state = 1;
      this.id = this.color + this.state*2;
      //let anim = new SimpleAnimation(cords(this.pos)[0], cords(this.pos)[1], 6, 32, 6, 5, 0);
      game.broken_buildings++;
      game.drop_brick(this.color);
    }
    heal(){
      //audio[2].play();
      this.state = 0;
      this.id = this.color + this.state*2;
      let anim = new SimpleAnimation(cords(this.pos)[0], cords(this.pos)[1], 7, 16, 3, 4, this.color);
      game.broken_buildings--;
    }
}

class Road extends Block{
  constructor(p, id) {
    super(p, id, 2);
  }
}

class Temporary{
  constructor(sx,sy, id, r){
    this.sx = sx;
    this.sy = sy;
    this.img_id = id;
    this.row = r;
    this.anim_frame = 0;
    this.width = 16;
    this.height = 16;
    this.r_w = 16;
    this.r_h = 16;
    game.toDrawTemp.push(this);
  }
  update(){this.frame++;}
  destroy(){
    game.toDrawTemp.splice(game.toDrawTemp.indexOf(this), 1);
  }
}

class Brick extends Temporary{
  constructor(x,y,c){
    super(x*16,y*16,3, c);
    this.x = x;
    this.y = y;
    this.color = c;//0 blue, 1 red
    this.animation = new BrickStartAnimation(this);
    this.layer = 1;
  }
  update(){
    if(dist(this.x, this.y, game.godzilla.x, game.godzilla.y) < 0.8){

        if(game.godzilla.bricks.length < 3){
          game.godzilla.pickup_brick(this.color)
          this.destroy();
        }
    }
    //this.animator;
    if(this.animation != null)
      this.animation.update();
  }
}

class BrickStartAnimation{
  constructor(obj){
    this.obj = obj;
    this.frame = 0;
    this.start();
  }
  update(){
    this.frame++;
    if(this.frame == 8){
        this.obj.anim_frame++;
        this.frame = 0;
        if(this.obj.anim_frame == 6){
          this.finish();
        }
    }
  }
  start(){
    this.obj.anim_frame = 2;
    this.obj.img_id = 4;
    this.obj.r_w = 32;
    this.obj.r_h = 32;
    this.obj.width = 32;
    this.obj.height = 32;
    this.obj.sx -= 8;
    this.obj.sy -= 8;
  }
  finish(){
    this.obj.anim_frame = 0;
    this.obj.sx += 8;
    this.obj.sy += 8;
    this.obj.r_w = 16;
    this.obj.r_h = 16;
    this.obj.width = 16;
    this.obj.height = 16;
    this.obj.img_id = 3;
    this.obj.animation = new BrickIdleAnimation(this.obj);
  }
}

class BrickIdleAnimation{
constructor(obj){
  this.obj = obj;
  this.frame = 0;
}
update(){
   this.frame++;
   if(this.frame == 8){
      this.obj.anim_frame == 0 ? this.obj.anim_frame = 1 : this.obj.anim_frame = 0;
      this.frame = 0;
   }
}
}

class SimpleAnimation extends Temporary{
constructor(x,y,id,size,frame_count,rate, row){
  super(x*16 , y*16 , id, row);
  this.frame_count = frame_count;
  this.rate = rate;
  if(size == 32){
    this.sx-=8;
    this.sy-=8;
    this.r_w = 32;
    this.r_h = 32;
    this.width = 32;
    this.height = 32;
  }
  this.frame = 0;
  this.layer = 3;
}
update(){
  this.frame++;
  if(this.frame % this.rate == 0 && this.frame > 0){
      this.anim_frame++;
      if(this.anim_frame >= this.frame_count){
        this.destroy();
      }
  }
}
}

class Human extends Temporary{
  constructor(x,y){
    super(x*16,y*16,5, 0);
    this.x = x;
    this.y = y;
    this.path = [];
    this.total_steps = 0; 
    this.bomb_step = 10;
    this.choose_target();
    this.frame = 0;
    this.layer = 2;
  }
  choose_target(){
      this.path_step = -1;
      this.walking = true;
      let p = game.roads_ids[Math.floor(Math.random() * game.roads_ids.length)];
      let x = p%game.map_size;
      let y = (p - x)/game.map_size;
      this.path = [];
      this.path = Astar(game.map,id(this.x, this.y), id(x,y));
  }
  update(){
     if(this.layer == -1){
       this.death_counter--;
       if(this.death_counter <= 0)
        this.layer = 2;
       return;
     }
     if(dist(this.x, this.y, game.godzilla.x, game.godzilla.y) < 0.5) this.die();
       
     if(!this.walking)return;

      
      if(this.path.length < 2){
        this.choose_target();
        return;
      }

      this.frame++;

      if(this.frame % 2 == 0){

      if(this.frame == 8){
        this.anim_frame == 0 ? this.anim_frame = 1 : this.anim_frame = 0;
        this.frame = 0;
      }

      if(this.x%1 == 0 && this.y %1 == 0){
          this.path_step++;
          this.total_steps++;
          this.dir_x = cords(this.path[this.path_step])[0] - this.x;
          this.dir_y = cords(this.path[this.path_step])[1] - this.y;
          if(this.dir_x == 1)
            this.row = 1;
          else if(this.dir_x == -1)
            this.row = 3;
          else if(this.dir_y == 1)
            this.row = 2;
          else if(this.dir_y == -1)
            this.row = 0;
      }

      if(this.total_steps == this.bomb_step){
        this.total_steps = 0;
        let anim = new Bomb(this.x,this.y)
      }

      if(this.path_step == this.path.length-1){
          this.reached();
          return;
      }
      this.x += this.dir_x/8;
      this.y += this.dir_y/8;
      this.sx = this.x * 16;
      this.sy = this.y * 16;
      }
  }
  reached(){
      this.walking = false;
      this.choose_target();
  }
  die(){
    //audio[3].play();
    let blood = new SimpleAnimation(this.x, this.y, 8, 16, 3, 48, this.row);
    blood.layer = 0;
    this.total_steps = 0;
    this.layer = -1;
    this.death_counter = 90;
  }  
}

class Bomber extends Temporary{
constructor(x,y,points){
  super(x * 16 - 16,y*16 - 16,10, 0);
  this.r_h = 80;
  this.r_w = 80;
  this.height = 80;
  this.width = 80; 
  this.layer = 4;
  this.drop_points = points;
  this.step = x < 0 ? 6 : -6;
  this.row = x < 0 ? 0 : 1;
}
update(){
  this.sx += this.step;
  let x = Math.floor(this.sx/16) + 2;
  this.drop_points.forEach(point => {
    if(x == point){
      this.drop_points.splice(this.drop_points.indexOf(point), 1);
      this.drop_bomb(point);
    }
  });
 if(this.step > 0 && this.x > 24)
  this.destroy();
 else if(this.step < 0 && this.x < -5)  
  this.destroy();
}
drop_bomb(x){
  let dx = x + random_range(-1, 1);
  let dy =  random_range(0, game.map_size-1);
  new Bomb(dx,dy);
}
}

class Bomb extends SimpleAnimation{
constructor(x,y){
  super(x,y,9,16,8,6,0);
  this.x = x;
  this.y = y;
}
update(){
  super.update();
  if(game.map[id(this.x,this.y)] instanceof Building){
    game.map[id(this.x,this.y)].break();
    this.destroy();
  }
}
destroy(){
      //audio[0].play();
      let anim = new SimpleAnimation(this.x, this.y, 6, 32, 6, 5, 0);
      var targets = [];
      var pos = id(this.x, this.y);

      if(pos > game.map_size && game.map[pos-game.map_size] instanceof Building && game.map[pos-game.map_size].state == 0)
        targets.push(pos-game.map_size);
      if(pos % game.map_size < game.map_size-1 && game.map[pos+1] instanceof Building && game.map[pos+1].state == 0)
        targets.push(pos+1);
      if(pos < game.map_size*game.map_size-game.map_size && game.map[pos+game.map_size] instanceof Building && game.map[pos+game.map_size].state == 0)
        targets.push(pos+game.map_size);
      if(pos % game.map_size > 0 && game.map[pos-1] instanceof Building && game.map[pos-1].state == 0)
        targets.push(pos-1);

      if(targets.length == 0){
        super.destroy();
        return;
      }

      let r = targets[Math.floor(Math.random() * targets.length)];
      game.map[r].break();
      super.destroy();
}

}

class Godzilla {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.move_dir = 0;
    this.next_dir;
    this.step = 0.125;
    this.move_vectors = [[0,-1],[1,0],[0,1],[-1,0]];//TRBL
    this.wall_check;
    this.steer_check;
    this.frame = 0;
    this.moving = false;
    this.anim_frame = 0;
    this.bricks = [];
    this.go_side = false;
  }
  update(){
      if(this.moving){
        this.x += this.move_vectors[this.move_dir][0] * this.step;
        this.y += this.move_vectors[this.move_dir][1] * this.step;

        if(this.frame == 8)
          this.anim_frame == 1 ? this.anim_frame = 2 : this.anim_frame = 1;
          
        this.frame++;
        if(this.frame > 8)
        this.frame = 0;
      }
      if(this.next_dir != null)
        this.check_steer();

      if(this.x % 1 == 0 && this.y %1 == 0){
        this.check_wall();
        this.check_buildings();
      }
  }
  check_wall(){
      this.wall_check = [Math.round(this.x) + this.move_vectors[this.move_dir][0], Math.round(this.y) + this.move_vectors[this.move_dir][1]];
      let wall = game.map[this.wall_check[0] + this.wall_check[1]*game.map_size];

      if(wall instanceof Building){
          this.moving = false;
          this.anim_frame = 0;
          this.next_dir = null;
      }
  }
  check_steer(){
      if(this.go_side){
        if(this.x%1 != 0 || this.y%1 != 0)
          return;
      }

      this.steer_check = [Math.round(this.x) + this.move_vectors[this.next_dir][0], Math.round(this.y) + this.move_vectors[this.next_dir][1]];
      let steer_wall = game.map[this.steer_check[0] + this.steer_check[1]*game.map_size];

      if(steer_wall instanceof Building == false){
          this.move_dir = this.next_dir;
          this.moving = true;
      }
  }
  change_dir(d){
      this.next_dir = d;
      if((this.next_dir + this.move_dir) % 2 == 1)
        this.go_side = true;
      else
        this.go_side = false;
  }
  check_buildings(){
    var n = [-game.map_size,1,game.map_size,-1,-game.map_size-1,-game.map_size+1,game.map_size-1,game.map_size+1];
    var p = this.x + this.y*game.map_size;

    n.forEach(b =>{
      if(game.map[p+b] instanceof Building && game.map[p+b].state ==1 && this.bricks.includes(game.map[p+b].color)){
        game.map[p+b].heal();
        this.bricks.splice(this.bricks.indexOf(game.map[p+b].color),1);
      }
    });
  }
  pickup_brick(c){
    //audio[1].play();
    this.bricks.push(c);
    this.check_buildings();
  }
}
