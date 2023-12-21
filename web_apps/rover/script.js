const canvas = document.getElementById('myCanvas');
canvas.width = canvas.getBoundingClientRect().width;
canvas.height = canvas.getBoundingClientRect().height;
const ctx = canvas.getContext("2d");

const BLOCK_SIZE = 40;
const BORDER_SIZE = 8;
const WIDTH = 17;
const HEIGHT = 17;
const OFFSET = 40;
const GROUND = 0, UNEXPLORED = 1, NONE = 2, WALL = 3;
const MOVING = 0, ROTATING = 1, SCANNING = 2, PAUSED = 3;
const RIGHT_OFFSET = 16 * BLOCK_SIZE + 16;
const ROVER_SIZE = 15, ROVER_SPEED = 0.069, ROVER_ROTATION_SPEED = 0.069, ROVER_SCANNING_TIME = 10;
const DEPTH = 0, BREADTH = 1, CLOSEST = 2, RANDOM = 3;

const index = (x, y) => { return x + y * WIDTH };
const coords = (id) => { return { x: id % WIDTH, y: (id - id % WIDTH) / WIDTH } };
const circleClamp = (val, min, max) => { if (val > max) return val - max; if (val < min) return max - val; return val; };

class Rover {
	constructor(cell) {
		this.currentCell = cell;
		this.desiredCell = undefined;

		this.dir = 0;
		this.desiredDir = undefined;

		this.pos = coords(cell);
		this.angle = Math.PI;

		this.unexplored = [this.currentCell + 1, this.currentCell - 1, this.currentCell + WIDTH, this.currentCell - WIDTH];
		this.target = null;
		this.path = [];

		this.grid = new Array(WIDTH * HEIGHT).fill(NONE);

		this.grid[this.currentCell] = GROUND;
		this.grid[this.currentCell - 1] = UNEXPLORED;
		this.grid[this.currentCell + 1] = UNEXPLORED;
		this.grid[this.currentCell - WIDTH] = UNEXPLORED;
		this.grid[this.currentCell + WIDTH] = UNEXPLORED;

		this.state = PAUSED;
		this.scanningCounter = 0;
		this.priority = DEPTH;
	}

	select_target() {
		if (this.priority == BREADTH)
			return this.unexplored.shift();
		if (this.priority == DEPTH)
			return this.unexplored.pop();
		if (this.priority == RANDOM) {
			const index = Math.floor(Math.random() * this.unexplored.length);
			const t = this.unexplored[index];
			this.unexplored.splice(index, 1);
			return t;
		}
		if (this.priority == CLOSEST) {
			const my_pos = coords(this.currentCell);
			let index = 0;
			let closest = Infinity;
			for (let i = 0; i < this.unexplored.length; i++) {
				const c = coords(this.unexplored[i]);
				const dist = Math.abs(my_pos.x - c.x) + Math.abs(my_pos.y - c.y);
				if (dist == 1) {
					index = i;
					break;
				}
				if (dist < closest) {
					index = i;
					closest = dist;
				}
			}
			const t = this.unexplored[index];
			this.unexplored.splice(index, 1);
			return t;
		}
	}

	draw(offset) {
		//ctx.fillStyle = 'pink';
		//draw_cell(coords(this.target).x, coords(this.target).y, offset);

		ctx.fillStyle = '#FBF129';

		const x = this.pos.x * BLOCK_SIZE + this.pos.x + BLOCK_SIZE / 2 + OFFSET + offset;
		const y = this.pos.y * BLOCK_SIZE + this.pos.y + BLOCK_SIZE / 2 + OFFSET;

		ctx.translate(x, y);
		ctx.rotate(this.angle);
		ctx.translate(-x, -y);

		ctx.beginPath();
		ctx.moveTo(x, y + ROVER_SIZE);
		ctx.lineTo(x - ROVER_SIZE, y - ROVER_SIZE);
		ctx.lineTo(x + ROVER_SIZE, y - ROVER_SIZE);
		ctx.fill();

		ctx.translate(x, y);
		ctx.rotate(-this.angle);
		ctx.translate(-x, -y);
	}

	find_path() {
		let path = [];
		const cells = new Array(WIDTH * HEIGHT);
		for (let i = 0; i < WIDTH * HEIGHT; i++)
			cells[i] = { cost: Infinity, previous: undefined, visited: false };

		const startCell = this.currentCell;
		const endCell = this.target;

		if (startCell == endCell) {
			return [];
		}

		cells[startCell].cost = 0;
		const queue = [startCell];

		while (queue.length > 0) {
			const cell = queue.pop();
			const cell_x = cell % WIDTH;
			const cell_y = (cell - cell_x) / WIDTH;

			if (cells[cell].visited == true || this.grid[cell] != GROUND) continue;

			cells[cell].visited = true;

			const cell_n = [];//neighbours

			if (cell_x > 0)
				cell_n.push(cell - 1);
			if (cell_x < WIDTH - 1)
				cell_n.push(cell + 1);
			if (cell_y > 0)
				cell_n.push(cell - WIDTH);
			if (cell_y < HEIGHT - 1)
				cell_n.push(cell + WIDTH);

			for (let i = 0; i < cell_n.length; i++) {
				if (cells[cell].cost + 1 < cells[cell_n[i]].cost) {
					if (this.grid[cell_n[i]] == GROUND) {
						cells[cell_n[i]].cost = cells[cell].cost + 1;
						cells[cell_n[i]].previous = cell;
					}
					if (cell_n[i] == endCell) {
						let c = cell;
						while (cells[c].previous != undefined) {
							path.push(c);
							c = cells[c].previous;
						}
						return path;
					}
				}
				if (this.grid[cell_n[i]] == GROUND)
					queue.push(cell_n[i]);
			}

		}
		console.log('not found', coords(startCell), coords(endCell));
		return [];
	}

	run() {
		if (this.unexplored.length == 0) {
			this.state = PAUSED;
			return;
		}

		this.target = this.select_target();

		this.path = this.find_path();
		if (this.path.length > 0) {
			this.desiredCell = this.path.pop();
			this.desiredDir = this.get_dir(this.currentCell, this.desiredCell);
			if (this.dir != this.desiredDir)
				this.state = ROTATING;
			else
				this.state = MOVING;
		} else {
			this.desiredCell = this.currentCell;
			this.desiredDir = this.get_dir(this.currentCell, this.target);
			if (this.dir != this.desiredDir)
				this.state = ROTATING;
			else this.state = SCANNING;
		}
	}

	get_dir(cell, desiredCell) {
		if (desiredCell == cell + 1)
			return 1;
		else if (desiredCell == cell - 1)
			return 3;
		else if (desiredCell == cell - WIDTH)
			return 0;
		else return 2;
	}

	reveal_target() {
		console.log('reveal');
		this.grid[this.target] = grid[this.target];
		const tc = coords(this.target);

		if (this.grid[this.target] == GROUND) {
			if (tc.x > 0 && this.grid[this.target - 1] == NONE) {
				this.unexplored.push(this.target - 1);
				this.grid[this.target - 1] = UNEXPLORED;
			}
			if (tc.x < WIDTH - 1 && this.grid[this.target + 1] == NONE) {
				this.unexplored.push(this.target + 1);
				this.grid[this.target + 1] = UNEXPLORED;
			}
			if (tc.y > 0 && this.grid[this.target - WIDTH] == NONE) {
				this.unexplored.push(this.target - WIDTH);
				this.grid[this.target - WIDTH] = UNEXPLORED;
			}
			if (tc.y < HEIGHT - 1 && this.grid[this.target + WIDTH] == NONE) {
				this.unexplored.push(this.target + WIDTH);
				this.grid[this.target + WIDTH] = UNEXPLORED;
			}
		}
	}

	update() {
		switch (this.state) {
			case PAUSED: return;
			case MOVING:
				let arrived = false;
				const desiredPos = coords(this.desiredCell);

				if (desiredPos.x > this.pos.x)
					this.pos.x += ROVER_SPEED;
				else if (desiredPos.x < this.pos.x)
					this.pos.x -= ROVER_SPEED;
				if (desiredPos.y > this.pos.y)
					this.pos.y += ROVER_SPEED;
				else if (desiredPos.y < this.pos.y)
					this.pos.y -= ROVER_SPEED;

				if (Math.abs(this.pos.x - desiredPos.x) + Math.abs(this.pos.y - desiredPos.y) < ROVER_SPEED * 2)
					arrived = true;

				if (arrived) {
					this.pos = desiredPos;
					this.currentCell = this.desiredCell;
					if (this.path.length > 0) {
						this.desiredCell = this.path.pop();
						this.desiredDir = this.get_dir(this.currentCell, this.desiredCell);
						if (this.dir != this.desiredDir)
							this.state = ROTATING;
					} else {
						this.desiredDir = this.get_dir(this.currentCell, this.target);
						this.state = SCANNING;
						if (this.dir != this.desiredDir)
							this.state = ROTATING;
					}
				}
				break;

			case SCANNING:
				//console.log(this.scanningCounter);
				this.scanningCounter++;
				if (this.scanningCounter >= ROVER_SCANNING_TIME) {
					this.scanningCounter = 0;
					this.reveal_target();
					this.run();
				}
				break;

			case ROTATING:
				//console.log(4);
				let rotationDir = 1;
				const left = this.dir == 0 ? 3 : this.dir - 1;
				if (this.desiredDir == left)
					rotationDir = -1;

				let desiredAngle = Math.PI + Math.PI / 2 * this.desiredDir;

				/*if (desiredAngle >= Math.PI * 2) desiredAngle -= Math.PI * 2;
				if (desiredAngle < )*/
				desiredAngle = circleClamp(desiredAngle, 0, Math.PI * 2);
				this.angle += ROVER_ROTATION_SPEED * rotationDir;

				//if (this.angle >= Math.PI * 2) this.angle -= Math.PI * 2;
				this.angle = circleClamp(this.angle, 0, Math.PI * 2);

				if (Math.abs(this.angle - desiredAngle) < ROVER_ROTATION_SPEED * 2) {
					this.dir = this.desiredDir;
					this.angle = desiredAngle;
					if (this.currentCell == this.desiredCell)
						this.state = SCANNING;
					else this.state = MOVING;
					//this.state = MOVING;
				}
				break;
		}
	}
}

const grid = new Array(WIDTH * HEIGHT).fill(NONE);
const rover = new Rover(index(Math.floor(WIDTH / 2), Math.floor(HEIGHT / 2)));

window.onload = setup;
window.requestAnimationFrame(frame);

//red = #FA0F3A;
//blue #41C4FA
//yellow #FBF129


function draw_cell(x, y, offset) {
	fill_rect(x * BLOCK_SIZE + x + OFFSET + offset, y * BLOCK_SIZE + y + OFFSET, BLOCK_SIZE, BLOCK_SIZE);
}

function draw_unexplored(x, y, offset) {
	const left = x * BLOCK_SIZE + x + OFFSET + offset;
	const top = y * BLOCK_SIZE + y + OFFSET;
	stroke_rect(left, top, BLOCK_SIZE, BLOCK_SIZE);
	ctx.beginPath();
	ctx.moveTo(left, top);
	ctx.lineTo(left + BLOCK_SIZE, top + BLOCK_SIZE);
	ctx.moveTo(left + BLOCK_SIZE, top);
	ctx.lineTo(left, top + BLOCK_SIZE);
	ctx.rect(left, top, BLOCK_SIZE, BLOCK_SIZE);
	ctx.stroke();
}

function fill_rect(x, y, w, h) {
	ctx.beginPath();
	ctx.rect(x, y, w, h);
	ctx.fill();
}

function stroke_rect(x, y, w, h) {
	ctx.beginPath();
	ctx.rect(x, y, w, h);
	ctx.stroke();
}

function draw_grid(grid, offset) {
	for (let i = 0; i < grid.length; i++) {
		if (grid[i] == NONE) continue;

		const x = i % WIDTH;
		const y = (i - x) / WIDTH;

		if (grid[i] == GROUND) {
			ctx.fillStyle = '#41C4FA';
			ctx.strokeStyle = '#41C4FA';
			draw_cell(x, y, offset);
		} else if (grid[i] == WALL) {
			ctx.fillStyle = '#FA0F3A';
			if (x > 0 && grid[i - 1] == GROUND) {
				fill_rect(x * BLOCK_SIZE + x + OFFSET + offset, y * BLOCK_SIZE + y + OFFSET, BORDER_SIZE, BLOCK_SIZE);
				//fill_rect((x + 1) * BLOCK_SIZE + (x + 1) + OFFSET + offset, y * BLOCK_SIZE + y + OFFSET, BORDER_SIZE, BLOCK_SIZE);
			}
			if (x < WIDTH - 1 && grid[i + 1] == GROUND) {
				fill_rect(x * BLOCK_SIZE + x + OFFSET + BLOCK_SIZE - BORDER_SIZE + offset, y * BLOCK_SIZE + y + OFFSET, BORDER_SIZE, BLOCK_SIZE);
			}
			if (y > 0 && grid[i - WIDTH] == GROUND) {
				fill_rect(x * BLOCK_SIZE + x + OFFSET + offset, y * BLOCK_SIZE + y + OFFSET, BLOCK_SIZE, BORDER_SIZE);
			}
			if (y < HEIGHT - 1 && grid[i + WIDTH] == GROUND) {
				fill_rect(x * BLOCK_SIZE + x + OFFSET + offset, y * BLOCK_SIZE + y + OFFSET + BLOCK_SIZE - BORDER_SIZE, BLOCK_SIZE, BORDER_SIZE);
			}
		} else if (grid[i] == UNEXPLORED) {
			ctx.fillStyle = '#41C4FA';
			ctx.strokeStyle = '#41C4FA';
			draw_unexplored(x, y, offset);
		}
	}
}

function setup() {
	const neighbours = new Array();
	neighbours.push({ x: Math.floor((WIDTH - 2) / 2), y: Math.floor((HEIGHT - 2) / 2) });

	for (let i = 0; i < 100; i++) {
		const index = Math.floor(Math.random() * neighbours.length);
		const pos = Object.assign({}, neighbours[index]);
		neighbours.splice(index, 1);

		grid[pos.x + pos.y * WIDTH] = GROUND;

		if (pos.x > 1)
			if (grid[(pos.x - 1) + pos.y * WIDTH] == NONE)
				neighbours.push({ x: pos.x - 1, y: pos.y });
		if (pos.x < WIDTH - 2)
			if (grid[(pos.x + 1) + pos.y * WIDTH] == NONE)
				neighbours.push({ x: pos.x + 1, y: pos.y });
		if (pos.y > 1)
			if (grid[pos.x + (pos.y - 1) * WIDTH] == NONE)
				neighbours.push({ x: pos.x, y: pos.y - 1 });
		if (pos.y < HEIGHT - 2)
			if (grid[pos.x + (pos.y + 1) * WIDTH] == NONE)
				neighbours.push({ x: pos.x, y: pos.y + 1 });
	}

	for (let i = 0; i < grid.length; i++) {
		if (grid[i] == NONE) {
			let isWall = false;
			const p = coords(i);

			if (p.x > 0 && grid[i - 1] == GROUND)
				isWall = true;
			if (p.x < WIDTH - 1 && grid[i + 1] == GROUND)
				isWall = true;
			if (p.y > 0 && grid[i - WIDTH] == GROUND)
				isWall = true;
			if (p.y < HEIGHT - 1 && grid[i + WIDTH] == GROUND)
				isWall = true;

			if (isWall)
				grid[i] = WALL;
		}
	}

	setTimeout(() => {
		rover.run();
	}, 1680);
}

function frame() {
	window.requestAnimationFrame(frame);

	rover.update();

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	draw_grid(grid, 0);
	draw_grid(rover.grid, RIGHT_OFFSET);
	rover.draw(0);
	rover.draw(RIGHT_OFFSET);
}

function select_priority(div, prior) {
	let divs = document.getElementById('holder').children;
	for (let i = 0; i < divs.length; i++) {
		divs[i].setAttribute("chosen", "false");
	}
	div.setAttribute("chosen", "true");

	rover.priority = parseInt(prior);
}