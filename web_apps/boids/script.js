import {Vector2} from "/common/vector2.js";

window.onload = setup;
let canvas, ctx;

let demo, lastTimeStep;

class Demo{
	constructor(){
	
	}
	render(){

	}
	update(_delta){
		this.render();
	}
	keyDown(_key){

	}
	keyUp(_key){
		
	}
	mouseUp(){

	}
	mouseDown(){

	}
}

class BoidsDemo extends Demo{
	constructor(){
		super();
		this.obstacles = [
			// {a: Vector2.create(600,800), b: Vector2.create(600,600)},
			// {a: Vector2.create(600,600), b: Vector2.create(800,600)},
			// {a: Vector2.create(800,600), b: Vector2.create(800,800)},
			// {a: Vector2.create(600,800), b: Vector2.create(800,800)},
			// {a: Vector2.create(canvas.width,0), b: Vector2.create(canvas.width,canvas.height)}
		];
		this.boids = [];
		this.boidRadius = 66;
		this.boidCount = 160;
		this.boidSize = 20;
		this.boidSpeed = 0.25;
		this.boidAngularSpeed = 0.05;
		this.boidDrag = 0.9;
		//grid
		this.spatialGrid = {
			cellSize: this.boidRadius*2,
			width: Math.ceil(canvas.width/(this.boidRadius*2)), 
			height: Math.ceil(canvas.height/(this.boidRadius*2)), 
			cells: []
		};
		this.spatialGrid.cells = new Array(this.spatialGrid.width*this.spatialGrid.height);
		for(let i = 0; i < this.spatialGrid.cells.length; i++)
		 this.spatialGrid.cells[i] = [];
		//create boids
		for(let i = 0; i < this.boidCount; i++){
			const a = Math.random()*Math.PI*2;
			const boid = {
				pos: Vector2.create(Math.random()*canvas.width, Math.random()*canvas.height),
				vel: Vector2.create(0,0),
				angle: a,
				dir: Vector2.fromAngle(a),
				desiredAngle: a,
				gridId: null
			};
			this.updateBoidGrid(boid);
			this.boids.push(boid);
		}
		this.debugBoid = null;
	}
	updateBoidGrid(_boid){
		const gridX = Math.floor(_boid.pos.x / this.spatialGrid.cellSize);
		const gridY = Math.floor(_boid.pos.y / this.spatialGrid.cellSize);
		const gridId = gridX + gridY*this.spatialGrid.width;

		if(_boid == this.debugBoid){
			//ctx.fillStyle = "#00ff00";
			//ctx.globalAlpha  = 0.5;
			ctx.beginPath();
			ctx.rect(gridX*this.spatialGrid.cellSize, gridY*this.spatialGrid.cellSize, this.spatialGrid.cellSize, this.spatialGrid.cellSize);
			ctx.stroke();
		}

		if(_boid.gridId != gridId){
			//remove from previous cell if any
			if(_boid.gridId != null)
				this.spatialGrid.cells[_boid.gridId].splice( this.spatialGrid.cells[_boid.gridId].indexOf(_boid), 1);
			//change id
			_boid.gridId = gridId;
			//add to new cell
			this.spatialGrid.cells[_boid.gridId].push(_boid);
		}
	}
	mouseDown(){
		if(this.debugBoid == null)
			this.debugBoid = this.boids[0];
		else 
			this.debugBoid = null;
	}
	update(_delta){
		super.update();
		for(let i = 0; i < this.boids.length; i++){
			const boid = this.boids[i];
			//apply movement
			let angleDiff = boid.desiredAngle - boid.angle;
			if(angleDiff > Math.PI) angleDiff = -angleDiff-Math.PI;

			boid.angle += angleDiff > 0 ? this.boidAngularSpeed : -this.boidAngularSpeed;
			if(boid.angle > Math.PI*2) boid.angle = 0;
			else if(boid.angle < -Math.PI*2) boid.angle = Math.PI*2;
			boid.dir = Vector2.fromAngle(boid.angle);

			boid.pos = Vector2.add(boid.pos, boid.vel);
			boid.vel = Vector2.add(boid.vel, Vector2.mult(boid.dir, this.boidSpeed));
			boid.vel = Vector2.mult(boid.vel, this.boidDrag);
			//out of map
			if(boid.pos.x > canvas.width) boid.pos.x = 0;
			else if(boid.pos.x < 0) boid.pos.x = canvas.width;
			if(boid.pos.y > canvas.height) boid.pos.y = 0;
			else if(boid.pos.y < 0) boid.pos.y = canvas.height;
			//update in grid
			this.updateBoidGrid(boid);
		}
		for(let i = 0; i < this.boids.length; i++){
			const boid = this.boids[i];
			//separation
			const nearBoids = this.findNearBoids(boid);
			if(nearBoids.length > 0){
				let calculatedVector = Vector2.create(0,0);
				calculatedVector = Vector2.add(calculatedVector, this.separationVector(boid, nearBoids));
				calculatedVector = Vector2.add(calculatedVector, this.alignmentVector(boid, nearBoids));
				calculatedVector = Vector2.add(calculatedVector, this.cohesionVector(boid, nearBoids));

				//const sosV = this.stayOnScreenVector(boid);
				//if(sosV != null) calculatedVector = Vector2.add(calculatedVector, sosV);

				//const oav = this.obstacleAvoidanceVector(boid);
				boid.desiredAngle = Vector2.toAngle(calculatedVector);
			}
			/*const oav = this.obstacleAvoidanceVector(boid);
			if(oav != null){
				//console.log(oav, Vector2.toAngle(oav));
				boid.desiredAngle = Vector2.toAngle(oav);
			}*/
		}
	}
	separationVector(_boid, _nearBoids){
		let nearBoidsVector = Vector2.create(0,0);
		for(let i = 0; i < _nearBoids.length; i++){
			const other = _nearBoids[i];
			const v = Vector2.sub(other.pos, _boid.pos);
			const vu = Vector2.unit(v);
			nearBoidsVector = Vector2.add(nearBoidsVector, Vector2.mult(vu, 1/Vector2.magSqr(v) ));
			/*if(_boid == this.debugBoid){
				ctx.beginPath();
				ctx.moveTo(_boid.pos.x, _boid.pos.y);
				ctx.lineTo(other.pos.x, other.pos.y);
				ctx.stroke();
			}*/
		}
		nearBoidsVector = Vector2.unit(Vector2.mult(nearBoidsVector, -1))
		if(_boid == this.debugBoid){
			ctx.strokeStyle = "#ff0000";
			ctx.beginPath();
			ctx.moveTo(_boid.pos.x, _boid.pos.y);
			ctx.lineTo(_boid.pos.x + nearBoidsVector.x * this.boidSize*1.5, _boid.pos.y  + nearBoidsVector.y * this.boidSize*1.5);
			ctx.stroke();
		}
		return nearBoidsVector;
	}
	stayOnScreenVector(_boid){
		const toCenter = Vector2.create(canvas.width/2 - _boid.pos.x, canvas.height/2 - _boid.pos.y);
		const toCenterUnit = Vector2.unit(toCenter);
		if(Vector2.mag(toCenter) > 600)
			return Vector2.mult(toCenterUnit, Vector2.magSqr(toCenter));
		return null;
	}
	obstacleAvoidanceVector(_boid){
		/*console.log(this.doSegmentsIntersect(
			{a : Vector2.create(0,0), b: Vector2.create(canvas.width, 0)},
			{a : Vector2.create(100,100), b: Vector2.create(100, 200)},
		));*/
		//if front vector doest collide return null
		//else start creating vectors until one is found
		let colSegment = {
			a: _boid.pos,
			b: Vector2.add(_boid.pos, Vector2.mult(_boid.dir, this.boidRadius)),
		}

		let foundCollision = false;
		for(let i = 0; i < this.obstacles.length; i++){
			const obs = this.obstacles[i];
			if(this.doSegmentsIntersect(obs, colSegment)){
				foundCollision = true;
				break;
			}
		}
		ctx.strokeStyle = "#ffffff"
		if(foundCollision) ctx.strokeStyle = "#ff0000";

		ctx.beginPath();
		ctx.moveTo(colSegment.a.x, colSegment.a.y);
		ctx.lineTo(colSegment.b.x, colSegment.b.y);
		ctx.stroke();

		return foundCollision ? Vector2.fromAngle(_boid.angle + Math.PI) : null;
	}
	alignmentVector(_boid, _nearBoids){
		let nearBoidsCenter= Vector2.copy(_nearBoids[0].pos);
		for(let i = 1; i < _nearBoids.length; i++){
			const other = _nearBoids[i];
			nearBoidsCenter = Vector2.add(nearBoidsCenter, _nearBoids[i].pos);
		}
		const steerVector = Vector2.unit(Vector2.sub(nearBoidsCenter, _boid.pos));

		if(_boid == this.debugBoid){
			ctx.strokeStyle = "#00ff00";
			ctx.beginPath();
			ctx.moveTo(_boid.pos.x, _boid.pos.y);
			ctx.lineTo(_boid.pos.x + steerVector.x * this.boidSize*1.5, _boid.pos.y  + steerVector.y * this.boidSize*1.5);
			ctx.stroke();
		}

		return steerVector;
	}
	cohesionVector(_boid, _nearBoids){
		let nearBoidsVector = Vector2.create(0,0);
		for(let i = 0; i < _nearBoids.length; i++){
			const other = _nearBoids[i];
			nearBoidsVector = Vector2.add(nearBoidsVector, other.dir);
		}

		nearBoidsVector = Vector2.unit(nearBoidsVector)

		if(_boid == this.debugBoid){
			ctx.strokeStyle = "#0000ff";
			ctx.beginPath();
			ctx.moveTo(_boid.pos.x, _boid.pos.y);
			ctx.lineTo(_boid.pos.x + nearBoidsVector.x * this.boidSize*1.5, _boid.pos.y  + nearBoidsVector.y * this.boidSize*1.5);
			ctx.stroke();
		}

		return nearBoidsVector;
	}
	findNearBoids(_boid){
		/*let r = [];
		for(let i = 0; i < this.boids.length; i++){
			if(this.boids[i] == _boid) continue;
			if(Vector2.dist(_boid.pos, this.boids[i].pos) < this.boidRadius) r.push(this.boids[i]);
		}

		return r;*/

		let r = [];

		const gridCells = this.getSurroundingCells(_boid);

		for(let i = 0; i < gridCells.length; i++){
			const boidsInCell = gridCells[i];
			for(let j = 0; j < boidsInCell.length; j++){
				if(boidsInCell[j] == _boid) continue;
				if(Vector2.dist(_boid.pos, boidsInCell[j].pos) < this.boidRadius) 
					r.push(boidsInCell[j]);
			}
		}

		return r;
	}
	getSurroundingCells(_boid){
		const r = [this.spatialGrid.cells[_boid.gridId]];

		const gridX = _boid.gridId % this.spatialGrid.width;
		const gridY = (_boid.gridId-gridX) / this.spatialGrid.width;

		const canLeft = gridX > 0;
		const canRight = gridX < this.spatialGrid.width-1;
		const canUp = gridY > 0;
		const canDown = gridY < this.spatialGrid.height-1;

		const bV = Vector2.create(0,0);
		bV.x = _boid.pos.x > (gridX+0.5) * this.spatialGrid.cellSize ? 1 : -1; 
		bV.y = _boid.pos.y > (gridY+0.5) * this.spatialGrid.cellSize ? 1 : -1; 

		//right up
		if(bV.x == 1 && bV.y == -1){
			if(canUp)
				r.push(this.spatialGrid.cells[_boid.gridId-this.spatialGrid.width]);
			if(canRight){
				r.push(this.spatialGrid.cells[_boid.gridId+1]);
				if(canUp)
					r.push(this.spatialGrid.cells[_boid.gridId+1-this.spatialGrid.width]);
			}
		}
		//left up
		else if(bV.x == -1 && bV.y == -1){
			if(canUp)
				r.push(this.spatialGrid.cells[_boid.gridId-this.spatialGrid.width]);
			if(canLeft){
				r.push(this.spatialGrid.cells[_boid.gridId-1]);
				if(canUp)
					r.push(this.spatialGrid.cells[_boid.gridId-1-this.spatialGrid.width]);
			}
		}
		//right down
		else if(bV.x == 1 && bV.y == 1){
			if(canDown)
				r.push(this.spatialGrid.cells[_boid.gridId+this.spatialGrid.width]);
			if(canRight){
				r.push(this.spatialGrid.cells[_boid.gridId+1]);
				if(canDown)
					r.push(this.spatialGrid.cells[_boid.gridId+1+this.spatialGrid.width]);
			}
		}
		//left down
		else if(bV.x == -1 && bV.y == 1){
			if(canDown)
				r.push(this.spatialGrid.cells[_boid.gridId+this.spatialGrid.width]);
			if(canLeft){
				r.push(this.spatialGrid.cells[_boid.gridId-1]);
				if(canDown)
					r.push(this.spatialGrid.cells[_boid.gridId-1+this.spatialGrid.width]);
			}
		}

		return r;
	}
	render(){
		ctx.clearRect(0,0, canvas.width, canvas.height);
		ctx.globalAlpha  = 1;
		//obstacles
		// for(let i = 0; i < this.obstacles.length; i++){
		// 	const obs = this.obstacles[i];
		// 	ctx.beginPath();
		// 	ctx.moveTo(obs.a.x, obs.a.y);
		// 	ctx.lineTo(obs.b.x, obs.b.y);
		// 	ctx.stroke();
		// }
		//grid
		// ctx.strokeStyle = "#666666";
		// ctx.lineWidth = 2;
		// for(let x = 1; x < this.spatialGrid.width; x++){
		// 	ctx.beginPath();
		// 	ctx.moveTo(x*this.boidRadius*2, 0);
		// 	ctx.lineTo(x*this.boidRadius*2, canvas.height);
		// 	ctx.stroke();
		// }
		// for(let y = 1; y < this.spatialGrid.height; y++){
		// 	ctx.beginPath();
		// 	ctx.moveTo(0, y*this.boidRadius*2);
		// 	ctx.lineTo(canvas.width, y*this.boidRadius*2);
		// 	ctx.stroke();
		// }
		//boids
		ctx.fillStyle = "#00aaff";
		ctx.strokeStyle = "#ffffff";
		ctx.lineWidth = 2;
		for(let i = 0; i < this.boids.length; i++){
			const boid = this.boids[i];
			const f = Vector2.mult(boid.dir, this.boidSize);
			const r = Vector2.mult(Vector2.rotateRight(f), 0.4);
			const l =  Vector2.mult(Vector2.rotateLeft(f), 0.4);
			
			if(boid == this.debugBoid){
				ctx.beginPath();
				ctx.arc(boid.pos.x, boid.pos.y, this.boidRadius, 0, Math.PI*2);
				ctx.stroke();
				ctx.fillStyle = "#ffaa00";
				ctx.beginPath();
				ctx.moveTo(boid.pos.x + f.x, boid.pos.y + f.y);
				ctx.lineTo(boid.pos.x + r.x, boid.pos.y + r.y);
				ctx.lineTo(boid.pos.x + l.x, boid.pos.y + l.y);
				ctx.closePath();
				ctx.fill();
				ctx.fillStyle = "#00aaff";

				// ctx.beginPath();
				// ctx.moveTo(boid.pos.x, boid.pos.y);
				// ctx.lineTo(boid.pos.x + this.boidRadius*f.x/this.boidSize, boid.pos.y + this.boidRadius*f.y/this.boidSize);
				// ctx.stroke();
			}else{
				ctx.beginPath();
				ctx.moveTo(boid.pos.x + f.x, boid.pos.y + f.y);
				ctx.lineTo(boid.pos.x + r.x, boid.pos.y + r.y);
				ctx.lineTo(boid.pos.x + l.x, boid.pos.y + l.y);
				ctx.closePath();
				ctx.fill();
			}

		}
	}
	doSegmentsIntersect(A, B){
			let a = (A.a.y - A.b.y) / (A.a.x - A.b.x);
			let b = A.a.y - A.a.x*a;
			let c = (B.a.y - B.b.y) / (B.a.x - B.b.x);
			let d = B.a.y - B.a.x*c;
			let x = (b-d)/(c-a) ;
			let y = a*x + b ;
			if((A.a.x - A.b.x) == 0){
			  x = A.a.x;
			  y = c*x + d;
			}
			else if((B.a.x - B.b.x) == 0){
			  x = B.a.x;
			  y = a*x + b;
			}
			const intersectionPoint = Vector2.create(x, y);
		  
			let maximumY = Math.min( Math.max(A.a.y, A.b.y), Math.max(B.a.y, B.b.y) );
			let minimumY = Math.max( Math.min(A.a.y, A.b.y), Math.min(B.a.y, B.b.y) );
			
			let maximumX = Math.min( Math.max(A.a.x, A.b.x), Math.max(B.a.x, B.b.x) );
			let minimumX = Math.max( Math.min(A.a.x, A.b.x), Math.min(B.a.y, B.b.x) );
			
			if(intersectionPoint.x <= maximumX && intersectionPoint.x >= minimumX && intersectionPoint.y <= maximumY && intersectionPoint.y >= minimumY)
			  return true;
			return false;
	}	
}

function setup(){
	canvas = document.getElementById('myCanvas');
	canvas.width = canvas.getBoundingClientRect().width;
	canvas.height = canvas.getBoundingClientRect().height;
	ctx = canvas.getContext("2d");

	demo = new BoidsDemo();

	canvas.addEventListener('mousedown', (_e)=>{demo.mouseDown(_e)});

	lastTimeStep = Date.now();
	requestAnimationFrame(frame);
}

function frame() {
	requestAnimationFrame(frame);
	demo.update((Date.now()-lastTimeStep)/1000);
	lastTimeStep = Date.now();
}