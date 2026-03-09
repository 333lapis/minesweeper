const FLAG_ICON_TEXT = "🚩";
const MINE_ICON_TEXT = "💣";
const INCORRECT_FLAG_ICON_TEXT = "❌";

const SPRITE_SIZE = 17;
const MINEFIELD_SPRITE_SCALE = 10;

const DifficultyPreset = {
	BEGINNER: [9, 9, 10],
	INTERMEDIATE: [16, 16, 40],
	EXPERT: [30, 16, 99]
};

function randNum(max) {
	return Math.floor(Math.random() * max);
}

function gameOverScreen(isWin) {
	console.log(isWin ? "you win!" : "you lose :(");
}

class Minefield {
	constructor(width, height, mineCount) {
		this.minefieldElement = document.getElementById("minefield");
		this.timerInterval = null;
		this.setup(width, height, mineCount);
	}

	setupFromPreset(preset) {
		this.setup(preset[0], preset[1], preset[2]);
	}

	setup(width, height, mineCount) {
		this.width = width;
		this.height = height;
		this.mineCount = mineCount;
		this.gameStarted = false;
		this.startTile = {};
		this.interactable = true;
		this.clearedTiles = [];
		this.remainingFlags = mineCount;
		this.timer = 0;
		this.minefieldElement.replaceChildren();
		
		faceElement.classList.forEach((i) => {
			faceElement.classList.remove(i);
		});
		flagCounterElement.textContent = this.remainingFlags;
		clearInterval(this.timerInterval);

		for (let x = 0; x < this.width; x++) {
			const tileColElement = document.createElement("div");
			tileColElement.classList.add("tile-col");
			tileColElement.draggable = false;

			for (let y = 0; y < this.height; y++) {
				const tileElement = document.createElement("div");
				
				tileElement.classList.add("tile");
				tileElement.draggable = false;
				tileElement.dataset.x = x;
				tileElement.dataset.y = y;
				tileElement.dataset.flagged = false;
				tileElement.dataset.dug = false;
				tileElement.dataset.isMine = false;
				tileElement.dataset.autoDigChecked = false;

				tileElement.addEventListener("mousedown", (event) => { this.tileInteract(event); });
				tileElement.addEventListener("contextmenu", (event) => {
					event.preventDefault();
				});

				tileColElement.appendChild(tileElement);
			}

			this.minefieldElement.appendChild(tileColElement);
		}
		console.log(`created minefield: ${width}x${height} (${mineCount} mines)`);
	}

	tileInteract(event) {
		if (
			!hoveredElement.classList.contains("tile") ||
			!this.interactable
		) return;
		let action;
		const x = JSON.parse(hoveredElement.dataset.x);
		const y = JSON.parse(hoveredElement.dataset.y);

		if (
			event?.button === 0 ||
			event?.code === "KeyZ"
		) {
			action = "dig";
			faceElement.classList.add("face-suspense");
			this.dig(x, y);
		} else if (
			event?.button === 2 ||
			event?.code === "KeyX"
		) {
			action = "flag";
			this.toggleFlag(x, y);
		}
		
		console.log(
			`[tile ${x},${y}]`,
			`[action ${action}]`,
			`flagged ${hoveredElement.dataset.flagged},`,
			`dug ${hoveredElement.dataset.dug},`,
			`isMine ${hoveredElement.dataset.isMine},`,
			`autoDigChecked ${hoveredElement.dataset.autoDigChecked}`
		);
	}

	queryTileElement(x, y) {
		for (const tileColElement of this.minefieldElement.childNodes) {
			for (const tileElement of tileColElement.childNodes) {
				if (
					(tileElement.dataset.x == x) &&
					(tileElement.dataset.y == y)
				) return tileElement;
			}
		}
		return null;
	}

	getAdjacentTiles(x, y) {
		const tileElement = this.queryTileElement(x, y);
		if (!tileElement) return null;

		const output = [];
		const adjacentTiles = [
			{ x: x - 1, y: y - 1 },	// top-left
			{ x: x, y: y - 1 },		// top
			{ x: x + 1, y: y - 1 },	// top-right
			{ x: x + 1, y: y },		// right
			{ x: x + 1, y: y + 1 },	// bottom-right
			{ x: x, y: y + 1 },		// bottom
			{ x: x - 1, y: y + 1 },	// bottom-left
			{ x: x - 1, y: y },		// left
		];
		for (const i of adjacentTiles) {
			const adjacentTile = this.queryTileElement(i.x, i.y);
			if (!adjacentTile) continue;

			output.push(adjacentTile);
		}

		return output;
	}

	toJSON() {
		const output = {
			width: this.width,
			height: this.height,
			mineCount: this.mineCount,
			tiles: []
		};

		for (const tileColElement of this.minefieldElement.childNodes) {
			for (const tileElement of tileColElement.childNodes) {
				output.tiles.push({
					x: JSON.parse(tileElement.dataset.x),
					y: JSON.parse(tileElement.dataset.y),
					flagged: JSON.parse(tileElement.dataset.flagged),
					dug: JSON.parse(tileElement.dataset.dug),
					isMine: JSON.parse(tileElement.dataset.isMine),
					autoDigChecked: JSON.parse(tileElement.dataset.autoDigChecked)
				});
			}
		}

		return output;
	}

	toggleFlag(x, y) {
		const tileElement = this.queryTileElement(x, y);
		if (!tileElement || JSON.parse(tileElement.dataset.dug)) return;
		const flagged = JSON.parse(tileElement.dataset.flagged);

		if (flagged) {
			tileElement.classList.remove("flagged");
			this.remainingFlags++;
		} else {
			tileElement.classList.add("flagged");
			this.remainingFlags--;
		}
		flagCounterElement.textContent = this.remainingFlags;

		//tileElement.textContent = flagged ? "" : FLAG_ICON_TEXT;
		tileElement.dataset.flagged = !flagged;
	}

	dig(x, y) {
		const tileElement = this.queryTileElement(x, y);
		if (!tileElement || JSON.parse(tileElement.dataset.dug)) return;

		if (!this.gameStarted) {
			this.startTile = { x: x, y: y };
			this.genMines();
		}

		if (JSON.parse(tileElement.dataset.flagged)) {
			this.toggleFlag(x, y);
			return;
		}

		if (JSON.parse(tileElement.dataset.isMine)) {
			tileElement.style.backgroundColor = "red";
			this.revealMines();
			gameOverScreen(false);
			this.interactable = false;
			clearInterval(this.timerInterval);
			faceElement.classList.add("face-dead");
			return;
		}

		
		const adjacentTiles = this.getAdjacentTiles(x, y);

		if (JSON.parse(tileElement.dataset.adjacentMines) === 0) {
			for (const i of adjacentTiles) {
				if (!JSON.parse(i.dataset.autoDigChecked)) {
					i.dataset.autoDigChecked = true;
					this.dig(JSON.parse(i.dataset.x), JSON.parse(i.dataset.y));
				}
			}
		}

		if (
			!JSON.parse(tileElement.dataset.isMine) &&
			JSON.parse(tileElement.dataset.adjacentMines) > 0
		) {
			tileElement.textContent = tileElement.dataset.adjacentMines;
		}

		if (!this.clearedTiles.includes(`${x},${y}`)) {
			this.clearedTiles.push(`${x},${y}`);
		}
		tileElement.dataset.dug = true;
		tileElement.classList.add("dug");

		console.log(`clearedTiles: ${this.clearedTiles.length}/${(this.width * this.height) - this.mineCount}`);
		if (this.clearedTiles.length === (this.width * this.height) - this.mineCount) {
			gameOverScreen(true);
			this.interactable = false;
			faceElement.classList.add("face-win");
			clearInterval(this.timerInterval);

			document.querySelectorAll(".tile").forEach((i) => {
				if (!i.classList.contains("dug")) i.style.backgroundColor = "#00ff00";
			});
		}
	}

	genMines() {
		const mines = new Set();

		while (mines.size < this.mineCount) {
			const x = randNum(this.width);
			const y = randNum(this.height);
			const tileElement = this.queryTileElement(x, y);

			if (
				mines.has(`${x},${y}`) ||
				!tileElement ||
				(
					!(x < this.startTile.x - 1) &&
					!(x > this.startTile.x + 1) &&
					!(y < this.startTile.y - 1) &&
					!(y > this.startTile.y + 1)
				)
			) continue;

			tileElement.dataset.isMine = true;
			mines.add(`${x},${y}`);
		}

		for (const tileColElement of this.minefieldElement.childNodes) {
			for (const tileElement of tileColElement.childNodes) {
				let adjacentMineCount = 0;
				const adjacentTiles = this.getAdjacentTiles(JSON.parse(tileElement.dataset.x), JSON.parse(tileElement.dataset.y));
				
				adjacentTiles.forEach((i) => {
					if (JSON.parse(i.dataset.isMine)) adjacentMineCount++;
				});
				tileElement.dataset.adjacentMines = adjacentMineCount;
			}
		}

		this.gameStarted = true;
		this.timerInterval = setInterval(() => {
			this.timer++;
			timerElement.textContent = this.timer;
		}, 1000);
	}

	revealMines() {
		for (const tileColElement of this.minefieldElement.childNodes) {
			for (const tileElement of tileColElement.childNodes) {
				if (JSON.parse(tileElement.dataset.isMine) && !JSON.parse(tileElement.dataset.flagged)) {
					tileElement.classList.add("mine");
					//tileElement.textContent = MINE_ICON_TEXT;
				}
			}
		}
	}
}

let hoveredElement = null;
const timerElement = document.getElementById("timer");
const faceElement = document.getElementById("face");
const flagCounterElement = document.getElementById("flag-counter");
const minefield = new Minefield(9, 9, 10);
const mainMenuCtxElement = document.getElementById("main-menu-ctx");

document.addEventListener("mousemove", (event) => {
	hoveredElement = document.elementFromPoint(event.clientX, event.clientY);
});
document.addEventListener("keydown", (event) => {
	minefield.tileInteract(event);
});

document.addEventListener("mouseup", () => {
	faceElement.classList.remove("face-suspense");
});
document.addEventListener("keyup", () => {
	faceElement.classList.remove("face-suspense");
});

document.getElementById("save").addEventListener("click", () => {
	const saveData = btoa(JSON.stringify(minefield.toJSON()));
	navigator.clipboard.writeText(saveData);
	console.log(saveData);
});
document.getElementById("save").addEventListener("mouseenter", () => {
	mainMenuCtxElement.textContent = "save game (copies save data to clipboard)";
});


document.getElementById("new-game-beginner").addEventListener("click", () => {
	minefield.setupFromPreset(DifficultyPreset.BEGINNER);
});
document.getElementById("new-game-beginner").addEventListener("mouseenter", () => {
	mainMenuCtxElement.textContent = "9x9 (10 mines)";
});
document.getElementById("new-game-intermediate").addEventListener("click", () => {
	minefield.setupFromPreset(DifficultyPreset.INTERMEDIATE);
});
document.getElementById("new-game-intermediate").addEventListener("mouseenter", () => {
	mainMenuCtxElement.textContent = "16x16 (40 mines)";
});
document.getElementById("new-game-expert").addEventListener("click", () => {
	minefield.setupFromPreset(DifficultyPreset.EXPERT);
});
document.getElementById("new-game-expert").addEventListener("mouseenter", () => {
	mainMenuCtxElement.textContent = "30x16 (99 mines)";
});

document.querySelectorAll(".main-menu-btn").forEach((element) => {
	element.addEventListener("mouseleave", () => {
		mainMenuCtxElement.textContent = "";
	});
});