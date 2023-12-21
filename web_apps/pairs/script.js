const BOT_MEMORY_SIZE = [3, 5, Infinity];
const GRID_DIMENSIONS = [[6,4], [6,6], [10,6]];
const REVEAL_TIME = 1000;
const settings = {
	gameMode : -1,
	gridSize: 1
};
let game;

function sleep(ms) {return new Promise(resolve => setTimeout(resolve, ms));}

function changeGameMode(_m){settings.gameMode = _m};
function changeGridSize(_s){settings.gridSize = _s};

function selectButtonPressed(_button){
	let buttons = _button.parentElement.children;
	for(let i = 0; i < buttons.length; i++){
		if(buttons[i].getAttribute('selected') == 'true'){
			buttons[i].setAttribute('selected', false);
			break;
		}
	}
	_button.setAttribute('selected', true);
}

function startButtonPressed(){
	startGame(settings.gameMode, settings.gridSize);
}

function startGame(_gameMode, _size){
	document.getElementById('menuDiv').style.display = 'none';
	let grid = document.getElementById("grid");
	grid.style.display = "block";

	let cards = Array();
	for(let y = 0; y < GRID_DIMENSIONS[_size][1]; y++){
		let row = document.createElement("div");
		for(let x = 0; x < GRID_DIMENSIONS[_size][0]; x++){
			let card = document.createElement("div");
			card.classList.add("card");
			card.classList.add("hidden");
			card.setAttribute("index", x + y*GRID_DIMENSIONS[_size][0]);
			card.addEventListener("click", function(){clickedCard(this.getAttribute("index"));} );
			cards.push(card);
			row.appendChild(card);
		}
		grid.appendChild(row);
	}
	
	let size = Math.floor(Math.min( window.innerWidth / GRID_DIMENSIONS[_size][0], window.innerHeight / GRID_DIMENSIONS[_size][1]) * 0.85);
	grid.style.setProperty("--card_size", size + "px");
	grid.style.setProperty("--card_margin", Math.floor(size/16) + "px");

	if(_gameMode == -1)
		game = new SoloGame(cards);
	else
		game = new BotGame(cards, grid, BOT_MEMORY_SIZE[_gameMode]);
}

function clickedCard(id){
	game.clickedCard(parseInt(id));
}

class SoloGame{
	constructor(cards){
		this.cards = cards;
		this.pairs = Array();
		this.remainingPairs = cards.length/2;
		this.moves = 0;
	
		for(let i = 0; i < cards.length/2; i++){
			this.pairs.push(i);
			this.pairs.push(i);
		}
	
		let copy = [...this.pairs];
	
		for(let i = 0; i < cards.length; i++){
			let r = Math.floor(Math.random() * copy.length);
			this.pairs[i] = copy[r];
			cards[i].innerHTML = "&#" + (128000 + this.pairs[i]) + ";";
			copy.splice(r, 1);
		}
		
		this.revealedCard1 = null;
		this.revealedCard2 = null;
	}
    reveal(id){
		
		if(this.revealedCard1 == null){
			this.revealedCard1 = id;
		}else if(this.revealedCard2 == null){//first revealed second not
			if(id == this.revealedCard1)
				return;
			this.revealedCard2 = id;
			this.moves++;
			//set timer to evaluate move
			setTimeout(()=>{
				this.cards[this.revealedCard1].classList.remove("revealed");
				this.cards[this.revealedCard2].classList.remove("revealed");
			
				if(this.pairs[this.revealedCard1] ==  this.pairs[this.revealedCard2]){
					this.correct_move();
				}else{
					this.wrong_move();
				}
			
				this.revealedCard1 = null;
				this.revealedCard2 = null;
			}, REVEAL_TIME);
		}else return;//both already revealed

		

		this.cards[id].classList.remove("hidden");
		this.cards[id].classList.add("revealed");

	}
	gameEnd(){
		document.getElementById("grid").style.display = "none";
		document.getElementById("soloEnd").style.display = "inline-block";
		document.getElementById("soloEnd0").innerHTML = this.moves;
	}
	correct_move(){
		this.cards[this.revealedCard1].classList.add("gone");
		this.cards[this.revealedCard2].classList.add("gone");
		this.remainingPairs--;

		if(this.remainingPairs <= 0){
			this.gameEnd();
			return;
		}
	}
	wrong_move(){
		this.cards[this.revealedCard1].classList.add("hidden");
		this.cards[this.revealedCard2].classList.add("hidden");
	}
	clickedCard(id){
		this.reveal(id);
	}
}

class Bot{
	constructor(grid_size, memory_size){
		this.unknown = [...Array(grid_size).keys()];//[a,b,c,d] indexes of unknown cards
		this.known = [];//[[a, b], [a,b]] indexes and values of known cards
		this.complete_pair = [];//[[a, b]
		this.memory_size = memory_size;
	}

	get_to_know_card(id, val){
		if(!this.unknown.includes(id))
			return;
		this.unknown.splice(this.unknown.indexOf(id), 1);
		this.known.push([id, val]);
		if(this.known.length > this.memory_size){
			let r = Math.floor(Math.random() * (this.known.length -1));
			this.unknown.push(this.known[r][0]);
			this.known.splice(r, 1);
			//this.unknown.push(this.known.splice()[0]);
		}
	}

	forget_card(id){
		if(this.unknown.includes(id))
			this.unknown.splice(this.unknown.indexOf(id), 1);

		if(this.complete_pair.includes(id))
			this.complete_pair = [];

		for(let i = 0; i <	this.known.length; i++){
			if(this.known[i][0] == id){
				this.known.splice(i, 1);
				return;
			}
		}
	}

	request_move(){
		if(this.complete_pair.length == 0)
			this.search_for_complete_pair();

		if(this.complete_pair.length > 0)
			return this.complete_pair.shift();
		else
			return this.unknown[Math.floor(Math.random() * (this.unknown.length-1))];
		
	}


	search_for_complete_pair(){
		for(let i = 0; i < this.known.length; i++){
			for(let j = i+1; j < this.known.length; j++){

				if(this.known[i][1] == this.known[j][1]){
					this.complete_pair = [this.known[i][0], this.known[j][0]];

					for(let i = 0; i <	this.known.length; i++){
						if(this.known[i][0] == this.complete_pair[0]){
							this.known.splice(i, 1);
							break;
						}
					}

					for(let i = 0; i <	this.known.length; i++){
						if(this.known[i][0] == this.complete_pair[1]){
							this.known.splice(i, 1);
							break;
						}
					}

					return;
				}

			}
		}
	}

}

class BotGame extends SoloGame{
	constructor(cards, grid, memory_size){
		super(cards);
		this.grid = grid;
		this.is_player_playing = true;
		this.bot = new Bot(cards.length, memory_size);
		this.bot_speed = 600;
		this.bot_points = 0;
		this.player_points = 0;
	}

	clickedCard(id){
		if(this.is_player_playing)
			this.reveal(id);
	}

	correct_move(){
		this.player_points++;
		this.remainingPairs--;

		if(this.remainingPairs == 0){
			this.gameEnd();
			return;
		}

		this.cards[this.revealedCard1].classList.add("gone");
		this.cards[this.revealedCard2].classList.add("gone");

		this.bot.forget_card(this.revealedCard1);
		this.bot.forget_card(this.revealedCard2);

		if(this.remainingPairs <= 0){
			this.gameEnd();
			return;
		}
	}
	wrong_move(){
		this.cards[this.revealedCard1].classList.add("hidden");
		this.cards[this.revealedCard2].classList.add("hidden");
					
		this.bot.get_to_know_card(this.revealedCard1, this.pairs[this.revealedCard1]);
		this.bot.get_to_know_card(this.revealedCard2, this.pairs[this.revealedCard2]);

		this.is_player_playing = false;
		this.grid.style.setProperty("--card_color", "silver");
		this.botMove();
	}

	async botMove(){
		await sleep(this.bot_speed);

		let bot_move_1 = this.bot.request_move();
		this.bot.get_to_know_card(bot_move_1, this.pairs[bot_move_1]);
		this.cards[bot_move_1].classList.remove("hidden");
		this.cards[bot_move_1].classList.add("revealed");

		await sleep(this.bot_speed);

		let bot_move_2 = this.bot.request_move();
		this.bot.get_to_know_card(bot_move_2, this.pairs[bot_move_2]);
		this.cards[bot_move_2].classList.remove("hidden");
		this.cards[bot_move_2].classList.add("revealed");

		await sleep(this.bot_speed);
		
		if(this.pairs[bot_move_1] == this.pairs[bot_move_2]){
			this.bot_points++;
			this.remainingPairs--;

			if(this.remainingPairs == 0){
				this.gameEnd();
				return;
			}


			this.bot.forget_card(bot_move_1);
			this.bot.forget_card(bot_move_2);

			this.cards[bot_move_1].classList.remove("revealed");
			this.cards[bot_move_1].classList.add("gone");
			this.cards[bot_move_2].classList.remove("revealed");
			this.cards[bot_move_2].classList.add("gone");

			this.botMove();
			return;
		}else{
			this.is_player_playing = true;
			this.grid.style.setProperty("--card_color", "gold");
			this.cards[bot_move_1].classList.remove("revealed");
			this.cards[bot_move_1].classList.add("hidden");
			this.cards[bot_move_2].classList.remove("revealed");
			this.cards[bot_move_2].classList.add("hidden");
		}
	}

	gameEnd(){
		this.grid.style.display = 'none';

		if(this.player_points > this.bot_points)
			document.getElementById("botEnd0").style.display = 'inline-block';
		else if(this.player_points < this.bot_points)
			document.getElementById("botEnd1").style.display = 'inline-block';
		else
			document.getElementById("botEnd2").style.display = 'inline-block';
		
	}

}