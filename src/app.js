const FLAG_ICON_TEXT = "🚩";
const MINE_ICON_TEXT = "💣";
const INCORRECT_FLAG_ICON_TEXT = "❌";

function randNum(max) {
	return Math.floor(Math.random() * max);
}

class Minefield {
	constructor(width, height, mineCount) {
		this.minefieldElement = document.getElementById("minefield");
		this.setup(width, height, mineCount);
	}

	setup(width, height, mineCount) {
		this.width = width;
		this.height = height;
		this.mineCount = mineCount;
		this.gameStarted = false;
		this.startTile = {};
		this.minefieldElement.replaceChildren();

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

				tileElement.addEventListener("mousedown", (event) => {
					if (event.button === 0) {
						this.dig(x, y);
					} else if (event.button === 2) {
						this.toggleFlag(x, y);
					}
					console.log(`tile ${event.target.dataset.x},${event.target.dataset.y}: flagged ${event.target.dataset.flagged}, dug ${event.target.dataset.dug}, isMine ${event.target.dataset.isMine}, autoDigChecked ${event.target.dataset.autoDigChecked}`);
				});
				tileElement.addEventListener("contextmenu", (event) => {
					event.preventDefault();
				});

				tileColElement.appendChild(tileElement);
			}

			this.minefieldElement.appendChild(tileColElement);
		}
		console.log(`created minefield: ${width}x${height} (${mineCount} mines)`);
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

		tileElement.textContent = flagged ? "" : FLAG_ICON_TEXT;
		tileElement.dataset.flagged = !flagged;
	}

	dig(x, y) {
		const tileElement = this.queryTileElement(x, y);
		if (!tileElement || JSON.parse(tileElement.dataset.dug)) return;

		if (!this.gameStarted) {
			this.startTile = { x: x, y: y };
			this.genMines();
		}

		if (JSON.parse(tileElement.dataset.isMine)) {
			this.revealMines();
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

		tileElement.dataset.dug = true;
		tileElement.classList.add("dug");
	}

	genMines() {
		const mines = [];

		while (mines.length < this.mineCount) {
			const x = randNum(this.width);
			const y = randNum(this.height);
			const tileElement = this.queryTileElement(x, y);

			if (
				mines.includes(`${x},${y}`) ||
				!tileElement ||
				(
					!(x < this.startTile.x - 1) &&
					!(x > this.startTile.x + 1) &&
					!(y < this.startTile.y - 1) &&
					!(y > this.startTile.y + 1)
				)
			) continue;

			tileElement.dataset.isMine = true;
			mines.push(`${x},${y}`);
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
	}

	revealMines() {
		for (const tileColElement of this.minefieldElement.childNodes) {
			for (const tileElement of tileColElement.childNodes) {
				if (JSON.parse(tileElement.dataset.isMine) && !JSON.parse(tileElement.dataset.flagged)) {
					tileElement.textContent = MINE_ICON_TEXT;
				}
			}
		}
	}
}

const minefield = new Minefield(9, 9, 10);
const mainMenuCtxElement = document.getElementById("main-menu-ctx");

document.getElementById("save").addEventListener("click", () => {
	const saveData = btoa(JSON.stringify(minefield.toJSON()));
	navigator.clipboard.writeText(saveData);
	console.log(saveData);
});
document.getElementById("save").addEventListener("mouseenter", () => {
	mainMenuCtxElement.textContent = "save game (copies save data to clipboard)";
});

document.getElementById("reset").addEventListener("click", () => {
	minefield.setup(9, 9, 10);
});
document.getElementById("reset").addEventListener("mouseenter", () => {
	mainMenuCtxElement.textContent = "reset game";
});

document.querySelectorAll(".main-menu-btn").forEach((element) => {
	element.addEventListener("mouseleave", () => {
		mainMenuCtxElement.textContent = "";
	});
});