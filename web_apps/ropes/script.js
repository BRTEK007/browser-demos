import { Vector2 } from "./vector2.js";

window.onload = setup;
let canvas, ctx, infoDiv;

const MOUSE = {
  down: false,
  x: 0,
  y: 0,
  button: -1,
};

let demo, lastTimeStep;

class Demo {
  constructor() {
    this.setInfo();
  }
  setInfo() {
    infoDiv.innerHTML = "";
  }
  update(_delta) {}
  keyDown(_key) {}
  keyUp(_key) {}
  mouseUp() {}
  mouseDown() {}
}

class FabrikDemo extends Demo {
  constructor() {
    super();
    this.points = [];
    this.length = 40;
    this.pointCount = 24;
    this.origin = Vector2.create(canvas.width / 3, canvas.height / 2);
    this.target = Vector2.create((2 * canvas.width) / 3, canvas.height / 2);

    for (let i = 0; i < this.pointCount; i++) {
      this.points.push(Vector2.create());
    }
    this.fabrik();
  }

  setInfo() {
    infoDiv.innerHTML = "LMB to move target <br> RMB to move origin";
  }

  update(_delta) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //path
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.pointCount; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();

    //target
    ctx.fillStyle = "#00ff00";
    ctx.beginPath();
    ctx.arc(this.origin.x, this.origin.y, 20, 0, 2 * Math.PI);
    ctx.fill();

    //origin
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(this.target.x, this.target.y, 20, 0, 2 * Math.PI);
    ctx.fill();

    //between points
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    for (let i = 0; i < this.pointCount; i++) {
      ctx.beginPath();
      ctx.arc(this.points[i].x, this.points[i].y, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
    if (MOUSE.down) {
      if (MOUSE.button == 0) this.target = Vector2.create(MOUSE.x, MOUSE.y);
      else this.origin = Vector2.create(MOUSE.x, MOUSE.y);
      this.fabrik();
    }
  }

  fabrik() {
    this.points[this.pointCount - 1] = Vector2.copy(this.target);

    for (let i = this.pointCount - 1; i > 0; i--)
      this.points[i - 1] = Vector2.add(
        this.points[i],
        Vector2.mult(
          Vector2.unit(Vector2.sub(this.points[i - 1], this.points[i])),
          this.length
        )
      );

    this.points[0] = Vector2.copy(this.origin);

    for (let i = 0; i < this.pointCount - 1; i++)
      this.points[i + 1] = Vector2.add(
        this.points[i],
        Vector2.mult(
          Vector2.unit(Vector2.sub(this.points[i + 1], this.points[i])),
          this.length
        )
      );
  }
}

class SnakeDemo extends Demo {
  constructor() {
    super();
    this.points = [];
    this.circleRadius = 6;
    this.length = 12;
    this.pointCount = 100;
    this.limitAngle = (4 * Math.PI) / 5;

    this.points.push(Vector2.create(canvas.width / 2, canvas.height / 2));

    let a = 0;
    let ad = Math.PI / 10;
    this.points.push(Vector2.create(canvas.width / 2, canvas.height / 2));
    for (let i = 1; i < this.pointCount; i++) {
      this.points.push(
        Vector2.add(
          this.points[this.points.length - 1],
          Vector2.mult(Vector2.fromAngle(a), this.length)
        )
      );
      a += ad;
      ad *= 0.975;
    }
  }

  setInfo() {
    infoDiv.innerHTML = "LMB to move head";
  }

  update(_delta) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //between points
    ctx.strokeStyle = "#ffffff";
    for (let i = 0; i < this.pointCount; i++) {
      ctx.beginPath();
      ctx.arc(
        this.points[i].x,
        this.points[i].y,
        this.circleRadius,
        0,
        2 * Math.PI
      );
      ctx.stroke();
    }
    if (MOUSE.down) {
      this.fabrik();
    }
  }

  fabrik() {
    this.points[this.pointCount - 1] = Vector2.copy(MOUSE);

    for (let i = this.pointCount - 1; i > 0; i--) {
      const toNext = Vector2.sub(this.points[i - 1], this.points[i]);
      let aNext = Vector2.toAngle(toNext);

      if (i < this.pointCount - 1) {
        const toPrev = Vector2.sub(this.points[i + 1], this.points[i]);
        const aPrev = Vector2.toAngle(toPrev);
        const aBetween = aNext - aPrev;

        if (aBetween < 0) {
          if (aBetween > -this.limitAngle) aNext = aPrev - this.limitAngle;
        } else {
          if (aBetween < this.limitAngle) aNext = aPrev + this.limitAngle;
        }
      }

      this.points[i - 1] = Vector2.add(
        this.points[i],
        Vector2.mult(Vector2.fromAngle(aNext), this.length)
      );
    }
  }
}

class RopeLikeDemo extends Demo {
  constructor() {
    super();
    this.points = [];
    this.sticks = [];
    this.buildSample();
  }

  buildSample() {}

  createStick(_a, _b) {
    const s = {
      a: _a,
      b: _b,
      length: Vector2.dist(_a.pos, _b.pos),
      destroyed: false,
    };
    _a.sticks.push(s);
    _b.sticks.push(s);
    this.sticks.push(s);
  }

  createPoint(_x, _y) {
    const p = {
      pos: Vector2.create(_x, _y),
      prevPos: Vector2.create(_x, _y),
      sticks: [],
      locked: false,
      destroyed: false,
    };
    this.points.push(p);
  }

  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;

    ctx.strokeStyle = "#ffffff";

    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      if (point.destroyed || point.pos.y > canvas.height * 2) {
        this.points.splice(i, 1);
        i--;
        continue;
      }
      ctx.fillStyle = point.locked ? "#ff00ff" : "#ffffff";
      ctx.beginPath();
      ctx.arc(point.pos.x, point.pos.y, 10, 0, 2 * Math.PI);
      ctx.fill();
    }
    for (let i = 0; i < this.sticks.length; i++) {
      const stick = this.sticks[i];
      if (stick.destroyed) {
        this.sticks.splice(i, 1);
        i--;
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(stick.a.pos.x, stick.a.pos.y);
      ctx.lineTo(stick.b.pos.x, stick.b.pos.y);
      ctx.stroke();
    }
  }

  updateSticks() {
    for (let j = 0; j < this.sticks.length; j++) {
      const stick = this.sticks[j];
      const center = Vector2.mult(Vector2.add(stick.a.pos, stick.b.pos), 0.5);

      const dir = Vector2.unit(Vector2.sub(stick.a.pos, stick.b.pos));

      // if(Vector2.magSqr(Vector2.sub(stick.a.pos, stick.b.pos)) <= stick.length*stick.length)
      // 	continue;

      if (!stick.a.locked)
        stick.a.pos = Vector2.add(center, Vector2.mult(dir, stick.length / 2));
      if (!stick.b.locked)
        stick.b.pos = Vector2.sub(center, Vector2.mult(dir, stick.length / 2));
    }
  }

  updatePoints(_delta) {
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      if (!point.locked) {
        const posBefore = Vector2.copy(point.pos);
        point.pos = Vector2.add(
          point.pos,
          Vector2.sub(point.pos, point.prevPos)
        );
        point.pos = Vector2.add(
          point.pos,
          Vector2.create(0, 1000 * _delta * _delta)
        );
        point.prevPos = posBefore;
      }
    }
  }

  updateSticksAndPoints(_delta) {
    this.updatePoints(_delta);

    for (let i = 0; i < 10; i++) this.updateSticks();
  }

  update(_delta) {
    if (_delta > 0.032) return;
    this.render();
    this.updateSticksAndPoints(_delta);
  }
  getClosestPoint(_p) {
    let closest = { id: 0, dist: Infinity };
    for (let i = 0; i < this.points.length; i++) {
      const d = Vector2.dist(_p, this.points[i].pos);
      if (d < closest.dist) {
        closest.id = i;
        closest.dist = d;
      }
    }
    if (closest.dist > 40) return null;
    return this.points[closest.id];
  }
  destroyPoint(_p) {
    for (let i = 0; i < _p.sticks.length; i++) _p.sticks[i].destroyed = true;
    _p.destroyed = true;
  }
}

class RopeDemo extends RopeLikeDemo {
  constructor() {
    super();
    this.selectedPoint = null;
    this.inEditMode = false;
  }

  buildSample() {
    for (let i = 0; i < 10; i++)
      this.createPoint(canvas.width / 2 - 40 * i, canvas.height / 5);

    this.createPoint(canvas.width / 2 - 40 * 11, canvas.height / 5 - 40);
    this.createPoint(canvas.width / 2 - 40 * 11, canvas.height / 5 + 40);
    this.points[0].locked = true;

    for (let i = 0; i < 9; i++) {
      this.createStick(this.points[i], this.points[i + 1]);
    }
    this.createStick(
      this.points[this.points.length - 1],
      this.points[this.points.length - 2]
    );
    this.createStick(
      this.points[this.points.length - 1],
      this.points[this.points.length - 3]
    );
    this.createStick(
      this.points[this.points.length - 2],
      this.points[this.points.length - 3]
    );
  }

  setInfo() {
    infoDiv.innerHTML =
      "normal mode:<br> LMB on point to move it<br> RMB on point to lock it<br>press spacebar to toggle edit mode <br> edit mode:<br> LMB on point to create stick <br> LMB off points to create a point <br> RMB on point to remove it";
  }

  update(_delta) {
    if (_delta > 0.032) return;
    this.render();
    if (this.inEditMode) return;
    this.updateSticksAndPoints(_delta);
  }
  render() {
    super.render();
    if (this.selectedPoint != null) {
      if (this.inEditMode) {
        ctx.strokeStyle = "#00ff00";
        ctx.beginPath();
        ctx.moveTo(this.selectedPoint.pos.x, this.selectedPoint.pos.y);
        ctx.lineTo(MOUSE.x, MOUSE.y);
        ctx.stroke();
      } else this.selectedPoint.pos = Vector2.copy(MOUSE);
    }
  }

  mouseDown() {
    if (this.inEditMode) {
      const point = this.getClosestPoint(MOUSE);
      if (point == null) {
        if (MOUSE.button == 0) this.createPoint(MOUSE.x, MOUSE.y); //add point
      } else {
        if (MOUSE.button == 0) this.selectedPoint = point;
        if (MOUSE.button == 2) this.destroyPoint(point);
      }
    } else {
      if (this.selectedPoint != null && MOUSE.button == 2) {
        this.selectedPoint.locked = true;
        return;
      }
      const point = this.getClosestPoint(MOUSE);

      if (point == null) return;
      if (MOUSE.button == 0) this.selectedPoint = point;
      else point.locked = !point.locked;
    }
  }
  mouseUp() {
    const point = this.getClosestPoint(MOUSE);
    if (point != null && this.selectedPoint != null) {
      //check if no such stick is created yet
      this.createStick(point, this.selectedPoint);
    }
    this.selectedPoint = null;
  }
  keyDown(_key) {
    if (_key == " ") this.inEditMode = !this.inEditMode;
  }
}

class ClothDemo extends RopeLikeDemo {
  constructor() {
    super();
    this.cutting = false;
  }

  buildSample() {
    const width = 16;
    const height = 10;
    const length = Math.round(
      Math.min(
        (0.9 * canvas.width) / width,
        (0.9 * canvas.height) / (height + 1)
      )
    );

    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        this.createPoint(
          canvas.width / 2 - (length * width) / 2 + x * length,
          length + y * length
        );
      }

    for (let x = 0; x < width; x += 3) this.points[x].locked = true;

    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        if (x != width - 1)
          this.createStick(
            this.points[x + y * width],
            this.points[x + y * width + 1]
          );
        if (y != height - 1)
          this.createStick(
            this.points[x + y * width],
            this.points[x + y * width + width]
          );
      }
  }

  setInfo() {
    infoDiv.innerHTML = "LMB to cut <br> RMB to reset";
  }

  update(_delta) {
    if (_delta > 0.032) return;
    this.render();
    this.updateSticksAndPoints(_delta);

    if (this.cutting) {
      for (let j = 0; j < this.sticks.length; j++) {
        const stick = this.sticks[j];
        const center = Vector2.mult(Vector2.add(stick.a.pos, stick.b.pos), 0.5);
        if (Vector2.dist(center, MOUSE) < 20) {
          this.sticks.splice(j, 1);
          j--;
        }
      }
    }
  }

  mouseDown() {
    if (MOUSE.button == 2) {
      this.points = [];
      this.sticks = [];
      this.buildSample();
    } else this.cutting = true;
  }
  mouseUp() {
    this.cutting = false;
  }
}

class StringDemo extends RopeLikeDemo {
  constructor() {
    super();
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      Object.assign(p, {
        ball: Ballz.createBall(p.pos.x, p.pos.y, 10, {
          acc: Vector2.create(0, 1000),
        }),
      });
      // console.log(p);
    }
    // console.log(this.points[0]);
    this.collider = Ballz.createBall(canvas.width / 2, canvas.height / 2, 120, {
      static: true,
    });
  }

  buildSample() {
    const width = 9;
    const height = 10;
    const length = Math.round(
      Math.min(
        (0.9 * canvas.width) / width,
        (0.9 * canvas.height) / (height + 1)
      )
    );

    for (let x = 0; x < width; x++) {
      this.createPoint(
        canvas.width / 2 - (length * width) / 2 + x * length,
        length + length
      );
    }

    for (let x = 0; x < width; x++) {
      if (x != width - 1) this.createStick(this.points[x], this.points[x + 1]);
    }
  }

  updatePoints(_delta) {
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const b = p.ball;
      Ballz.updateBall(b, _delta);
    }

    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const b = p.ball;
      p.pos = Vector2.copy(b.pos);
    }
    // console.log(this.points[0].ball.pos);
    // console.log(_delta);
  }

  updateSticksAndPoints(_delta) {
    // super.updateSticksAndPoints(_delta);
    // for()
    this.updatePoints(_delta);

    for (let i = 0; i < 10; i++) {
      for (let i = 0; i < this.points.length; i++) {
        const p = this.points[i];
        const b = p.ball;
        Ballz.resolveCollision(b, this.collider);
        // this.updateSticks();
      }
      this.updateSticks();
    }
  }

  render() {
    super.render();
    ctx.strokeStyle = "#ff00ff";
    ctx.beginPath();
    ctx.arc(
      this.collider.pos.x,
      this.collider.pos.y,
      this.collider.radius,
      0,
      2 * Math.PI
    );
    ctx.stroke();

    // ctx.beginPath();
    // ctx.moveTo(400, 400);
    // ctx.lineTo(600, 400);
    // ctx.stroke();
  }

  setInfo() {
    infoDiv.innerHTML = "don't do anything";
  }

  update(_delta) {
    if (_delta > 0.032) return;
    this.render();
    this.updateSticksAndPoints(_delta);
  }

  mouseDown() {
    if (MOUSE.button == 2) {
      this.points = [];
      this.sticks = [];
      this.buildSample();
    } else this.cutting = true;
  }
  mouseUp() {
    this.cutting = false;
  }
}

function setup() {
  canvas = document.getElementById("myCanvas");
  canvas.width = canvas.getBoundingClientRect().width;
  canvas.height = canvas.getBoundingClientRect().height;
  ctx = canvas.getContext("2d");

  infoDiv = document.getElementById("infoDiv");

  canvas.addEventListener("mousedown", (e) => {
    MOUSE.down = true;
    MOUSE.x = e.offsetX;
    MOUSE.y = e.offsetY;
    MOUSE.button = e.button;
    demo.mouseDown();
  });
  canvas.addEventListener("mousemove", (e) => {
    MOUSE.x = e.offsetX;
    MOUSE.y = e.offsetY;
  });
  canvas.addEventListener("mouseup", (e) => {
    MOUSE.down = false;
    demo.mouseUp();
  });
  canvas.addEventListener("mouseleave", (e) => {
    MOUSE.down = false;
  });
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "1":
        demo = new FabrikDemo();
        break;
      case "2":
        demo = new SnakeDemo();
        break;
      case "3":
        demo = new RopeDemo();
        break;
      case "4":
        demo = new ClothDemo();
        break;
      // case '5': demo = new StringDemo(); break;
      default:
        demo.keyDown(e.key);
        break;
    }
  });
  document.addEventListener("keyup", (e) => {
    demo.keyUp(e.key);
  });

  demo = new FabrikDemo();

  lastTimeStep = Date.now();
  requestAnimationFrame(frame);
}

function frame() {
  requestAnimationFrame(frame);
  demo.update((Date.now() - lastTimeStep) / 1000);
  lastTimeStep = Date.now();
}
