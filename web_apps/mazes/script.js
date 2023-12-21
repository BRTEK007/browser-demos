let canvas, ctx;
let solver;

const settings = {
    size: 10,
    spacing: 1,
    algorythm: 'RDFS',
    speed: 51,
}

const maze = {
    cell_size: 20,
    wall_size: 5,
    grid_width: 20,
    grid_height: 25,
    offset_x: 10,
    offset_y: 10
}

function changeSettings(param, val) {
    switch (param) {
        case 'SIZE':
            settings.size = parseInt(val);
            updateMazeDimensions();
            clearGeneration();
            break;
        case 'SPACING':
            settings.spacing = parseInt(val);
            updateMazeDimensions();
            clearGeneration();
            break;
        case 'ALGORYTHM':
            settings.algorythm = val;
            clearGeneration();
            break;
        case 'SPEED':
            settings.speed = parseInt(val);
            break;
    }
}

function updateMazeDimensions() {
    maze.cell_size = settings.size;
    maze.wall_size = settings.spacing;
    maze.grid_width = Math.floor((canvas.width - maze.wall_size) / (maze.cell_size + maze.wall_size));
    maze.grid_height = Math.floor((canvas.height - maze.wall_size) / (maze.cell_size + maze.wall_size));
    maze.offset_x = Math.floor((canvas.width - (maze.cell_size + maze.wall_size) * maze.grid_width) / 2);
    maze.offset_y = Math.floor((canvas.height - (maze.cell_size + maze.wall_size) * maze.grid_height) / 2);
}

function startGeneration() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    switch (settings.algorythm) {
        case 'RDFS':
            solver = new RDFS_solver();
            break;
        case 'KRUSKAL':
            solver = new Kruskal_solver();
            break;
        case 'PRIM':
            solver = new Prim_solver();
            break;
        case 'ELLER':
                solver = new Eller_solver();
                break;
    }
    if (solver != null) solver.init();
}

function clearGeneration() {
    solver = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function cellColor(x, y) {
    let r = Math.round(127 + 128 * x / maze.grid_width).toString(16);
    let g = Math.round(127 + 128 * y / maze.grid_height).toString(16);
    let color = '#' + '7f' + r + g;
    return color;
}

function drawPassage(canvas, c2) {
    let x1 = canvas % maze.grid_width;
    let y1 = (canvas - x1) / maze.grid_width;
    let x2 = c2 % maze.grid_width;
    let y2 = (c2 - x2) / maze.grid_width;

    ctx.fillStyle = cellColor((x1 + x2) / 2, (y1 + y2) / 2);
    let x, y, w, h;

    if (y2 > y1) {
        x = maze.offset_x + x1 * (maze.wall_size + maze.cell_size);
        y = maze.offset_y + y1 * (maze.wall_size + maze.cell_size);
        w = maze.cell_size;
        h = maze.cell_size * 2 + maze.wall_size;
    } else if (y2 < y1) {
        x = maze.offset_x + x2 * (maze.wall_size + maze.cell_size);
        y = maze.offset_y + y2 * (maze.wall_size + maze.cell_size);
        w = maze.cell_size;
        h = maze.cell_size * 2 + maze.wall_size;
    } else if (x2 > x1) {
        x = maze.offset_x + x1 * (maze.wall_size + maze.cell_size);
        y = maze.offset_y + y1 * (maze.wall_size + maze.cell_size);
        h = maze.cell_size;
        w = maze.cell_size * 2 + maze.wall_size;
    } else if (x2 < x1) {
        x = maze.offset_x + x2 * (maze.wall_size + maze.cell_size);
        y = maze.offset_y + y2 * (maze.wall_size + maze.cell_size);
        h = maze.cell_size;
        w = maze.cell_size * 2 + maze.wall_size;
    }
    ctx.fillRect(x, y, w, h);
}

function pageLoaded() {
    canvas = document.getElementById('canvas1');
    canvas.height = canvas.getBoundingClientRect().height;
    canvas.width = canvas.getBoundingClientRect().width;
    ctx = canvas.getContext('2d');

    updateMazeDimensions();

    requestAnimationFrame(frame);
}

function frame() {
    if (solver && !solver.finished)
        solver.update();
    requestAnimationFrame(frame);
}

const RDFS_solver = function () {
    this.visitedArray;
    this.stack = [];
    this.path = [];
    this.visitedCellsCounter = 0;
    this.finished = false;


    this.unvisited_neighbour = function (pos) {
        let arr = [];
        if (pos > maze.grid_width && this.visitedArray[pos - maze.grid_width] == false) {
            arr.push(pos - maze.grid_width);
        }
        if (pos < maze.grid_width * (maze.grid_width - 1) - 1 && this.visitedArray[pos + maze.grid_width] == false) {
            arr.push(pos + maze.grid_width);
        }
        if (pos % maze.grid_width < (maze.grid_width - 1) && this.visitedArray[pos + 1] == false) {
            arr.push(pos + 1);
        }
        if (pos % maze.grid_width > 0 && this.visitedArray[pos - 1] == false) {
            arr.push(pos - 1);
        }

        if (arr.length > 0) return arr[Math.floor(arr.length * Math.random())];
        else return null;
    }

    this.framedSolve = function () {

        for (let i = 0; i < settings.speed; i++) {

            if (this.stack.length == 0 || this.visitedCellsCounter >= this.visitedArray.length) {
                this.finished = true;
                return;
            }

            let n = null;
            while (this.stack.length > 0 && this.visitedCellsCounter < this.visitedArray.length && n == null) {
                let current = this.stack.pop();
                n = this.unvisited_neighbour(current);

                if (n != null) {
                    this.stack.push(current);
                    drawPassage(current, n);
                    this.visitedArray[n] = true;
                    this.stack.push(n);
                    this.visitedCellsCounter++;
                }
            }

        }

    }

    this.init = function () {
        let start_cell = Math.floor(Math.random() * maze.grid_height * maze.grid_width);
        this.stack.push(start_cell);
        this.path.push(start_cell);
        this.visitedCellsCounter = 1;
        this.visitedArray = new Array(maze.grid_width * maze.grid_height).fill(false);
        this.visitedArray[start_cell] = true;
    }

    this.update = function () {
        this.framedSolve();
    }
}

const Kruskal_solver = function () {
    this.sets;
    this.walls;
    this.finished;

    this.init = function () {
        this.finished = false;

        this.sets = new Array(maze.grid_height * maze.grid_width);
        for (let i = 0; i < this.sets.length; i++) this.sets[i] = i;

        this.walls = new Array(maze.grid_height * (maze.grid_width - 1) + maze.grid_width * (maze.grid_height - 1));

        let i = 0,
            n = 0;
        while (n < this.walls.length) {

            if (i % maze.grid_width != maze.grid_width - 1) {
                this.walls[n] = [i, i + 1];
                n++;
            }

            if (i < maze.grid_width * (maze.grid_height - 1)) {
                this.walls[n] = [i, i + maze.grid_width];
                n++;
            }

            i++;

        }

        this.free_set_number = this.sets.length;

        ctx.lineWidth = 4;
        ctx.strokeStyle = "#00A6FF";
    }

    this.update = function () {
        this.framedSolve();
    }

    this.joinSets = function (s1, s2) {
        for (let i = 0; i < this.sets.length; i++) {
            if (this.sets[i] == s1) this.sets[i] = this.free_set_number;
            else if (this.sets[i] == s2) this.sets[i] = this.free_set_number;
        }
        this.free_set_number++;
    }

    this.framedSolve = function () {

        for (let i = 0; i < settings.speed; i++) {

            if (this.walls.length == 0) {
                this.finished = true;
                return;
            }

            let wall = [0, 0];
            while (this.walls.length > 0 && this.sets[wall[0]] == this.sets[wall[1]]) {
                let r = Math.floor(Math.random() * this.walls.length);
                wall = this.walls.splice(r, 1)[0];

                if (this.sets[wall[0]] != this.sets[wall[1]]) {
                    drawPassage(wall[0], wall[1]);
                    this.joinSets(this.sets[wall[0]], this.sets[wall[1]]);
                    break;
                }
            }
        }
    }

}

const Prim_solver = function () {
    this.visited;
    this.walls;
    this.finished;

    this.init = function () {
        this.finished = false;
        this.visited = new Array(maze.grid_height * maze.grid_width).fill(false);
        this.walls = new Array();
        let start_cell = Math.floor(Math.random() * this.visited.length);
        this.addWalls(start_cell);
        this.visited[start_cell] = true;
    }

    this.addWalls = function (cell) {
        if (cell > maze.grid_width) {
            this.walls.push([cell, cell - maze.grid_width]);
        }
        if (cell < maze.grid_width * (maze.grid_width - 1) - 1) {
            this.walls.push([cell, cell + maze.grid_width]);
        }
        if (cell % maze.grid_width < (maze.grid_width - 1)) {
            this.walls.push([cell, cell + 1]);
        }
        if (cell % maze.grid_width > 0) {
            this.walls.push([cell, cell - 1]);
        }
    }

    this.update = function () {
        this.framedSolve();
    }


    this.framedSolve = function () {

        for (let i = 0; i < settings.speed; i++) {

            if (this.walls.length == 0) {
                this.finished = true;
                return;
            }


            let r = Math.floor(Math.random() * this.walls.length);
            let wall = this.walls.splice(r, 1)[0];

            while (this.visited[wall[0]] + this.visited[wall[1]] != 1) {
                let r = Math.floor(Math.random() * this.walls.length);
                wall = this.walls.splice(r, 1)[0];
                if (this.walls.length == 0) {
                    this.finished = true;
                    return;
                }
            }

            if (this.visited[wall[0]] == true && this.visited[wall[1]] == false) {
                drawPassage(wall[0], wall[1]);
                this.visited[wall[1]] = true;
                this.addWalls(wall[1]);
            } else if (this.visited[wall[1]] == true && this.visited[wall[0]] == false) {
                drawPassage(wall[1], wall[0]);
                this.visited[wall[0]] = true;
                this.addWalls(wall[0]);
            }



        }


    }

}

const Eller_solver = function () {
    this.sets;
    this.walls;
    this.finished;
    this.pos;


    this.init = function () {
        this.finished = true;

        this.sets = new Array(maze.grid_height * maze.grid_width);
        for (let i = 0; i < this.sets.length; i++) this.sets[i] = i;
        this.free_set_number = this.sets.length;

        this.pos = {x : 0, y : 0};

        for(let y = 0; y < maze.grid_height-1; y++){

        let last_set = 0;
        for(let x = 0; x < maze.grid_width; x++){
            if(x == maze.grid_width-1 && y < maze.grid_height-1){
                drawPassage(last_set + y * maze.grid_width, last_set + (y+1) * maze.grid_width);
                this.joinSets(last_set + y * maze.grid_width, last_set + (y+1) * maze.grid_width);
                last_set = x+1;
                continue;
            }
            let r = Math.random();
            if(r > 0.5){
                this.joinSets(x + y * maze.grid_width, x + 1 + y * maze.grid_width);
                drawPassage(x + y * maze.grid_width, x + 1 + y * maze.grid_width);
            }else if(y < maze.grid_height-1){
                r = Math.floor(Math.random() * (y-last_set));
                drawPassage(last_set+r + y  * maze.grid_width, last_set+r + (y+1) * maze.grid_width);
                this.joinSets(last_set+r + y * maze.grid_width, last_set+r + (y+1) * maze.grid_width);
                last_set = x+1;
            }
        }

        }

        for(let x = 0; x < maze.grid_width-1; x++){
            if(this.sets[x + (maze.grid_height-1) * maze.grid_width] != this.sets[x + 1+ (maze.grid_height-1) * maze.grid_width]){
                this.joinSets(x + (maze.grid_height-1) * maze.grid_width, x + 1 + (maze.grid_height-1) * maze.grid_width);
                drawPassage(x + (maze.grid_height-1) * maze.grid_width, x + 1 + (maze.grid_height-1) * maze.grid_width);
            }
        }
    }

    this.update = function () {
        this.framedSolve();
    }

    this.joinSets = function (s1, s2) {
        for (let i = 0; i < this.sets.length; i++) {
            if (this.sets[i] == s1) this.sets[i] = this.free_set_number;
            else if (this.sets[i] == s2) this.sets[i] = this.free_set_number;
        }
        this.free_set_number++;
    }

    this.framedSolve = function () {

        for (let i = 0; i < settings.speed; i++) {

            if (this.pos.x == maze.grid_width -1) {
                this.finished = true;
                return;
            }

            let r = Math.random();
            if(r > 0.5){
                this.joinSets(this.pos.x + this.pos.y * maze.grid_width, this.pos.x + 1 + this.pos.y * maze.grid_width);
                drawPassage(this.pos.x + this.pos.y * maze.grid_width, this.pos.x + 1 + this.pos.y * maze.grid_width);
            }

            this.pos.x++;
        }

    }

}
