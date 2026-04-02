export const VERSION = 0;

export const SaveType = {
	BOARD: 0,
	SETTINGS: 1,
	SCOREDATA: 2,
	REPLAY: 3,
};

export function saveBoard(minefield) {
	const minefieldJSON = minefield.toJSON();

	minefieldJSON.version = VERSION;
	minefieldJSON.type = SaveType.BOARD;

	return btoa(JSON.stringify(minefieldJSON));
}

export function loadData(saveData) {
	const loadedData = JSON.parse(atob(saveData));
	const version = loadedData?.version ?? null;
	const saveType = loadedData?.type ?? null;

	if (version === null || saveType === null) {
		throw new Error("invalid save data!! (missing version or saveType)");
	}

	switch (saveType) {
		case SaveType.BOARD:
			break;
		case SaveType.SETTINGS:
			break;
		case SaveType.SCOREDATA:
			break;
		case SaveType.REPLAY:
			break;
		default:
			throw new Error("invalid saveType");
	}
	if (version !== VERSION) throw new Error("invalid version");
}