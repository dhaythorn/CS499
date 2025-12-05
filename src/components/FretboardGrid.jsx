// Highest string at the top visually
const DEFAULT_TUNING = [64, 59, 55, 50, 45, 40]; // E4, B3, G3, D3, A2, E2

export const NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteFromMidi(midi) {
	const pc = ((midi % 12) + 12) % 12; // safe modulo
	return NOTE_NAMES_SHARP[pc];
}

function getColor(pc) {
	const hue = pc * 30;
	return `hsl(${hue},80%,60%)`;
}

export default function FretboardGrid({
	strings = 6,
	frets = 13, // hack for now to see the full octave on each string (open strings and 12th fret are the same notes different octaves)
	tuning = DEFAULT_TUNING,
	activePCs = null, // This is how i'm handling whether or not to render one of the cirlces on the fretboard
}) {
	const width = 900;
	const height = 200;

	const rows = Array.from({ length: strings }); // just for mapping strings
	const cols = Array.from({ length: frets });

	// Build a flat list of note objects for every (string, fret)
	const dots = [];
	for (let stringIdx = 0; stringIdx < strings; stringIdx++) {
		for (let fretIdx = 0; fretIdx < frets; fretIdx++) {
			const openMidi = tuning[stringIdx];
			const midi = openMidi + fretIdx;
			const pc = ((midi % 12) + 12) % 12;
			const label = NOTE_NAMES_SHARP[pc];
			dots.push({ stringIdx, fretIdx, midi, label, pc });
		}
	}

	// helper: y-position of a given string index
	// strings are evenly spaced from top (0) to bottom (height)
	function stringY(stringIdx) {
		if (strings === 1) return height / 2;
		return (height * stringIdx) / (strings - 1);
	}

	return (
		<div
			style={{
				width: `${width}px`,
				height: `${height}px`,
				display: "grid",
				gridTemplateRows: `1fr`, // rows don't matter now for strings
				gridTemplateColumns: `repeat(${frets}, 1fr)`,
				borderLeft: "2px solid #333",
				borderRight: "2px solid #333",
				background: "#222",
				position: "relative",
			}}>
			{/* VERTICAL FRETS are being created with grid cell borders */}
			{rows.map((_, stringIdx) =>
				cols.map((_, fretIdx) => (
					<div
						key={`cell-${stringIdx}-${fretIdx}`}
						style={{
							borderRight: "1px solid #666", // frets
						}}
					/>
				))
			)}

			{/* HORIZONTAL STRINGS are absolutely positioned lines */}
			{rows.map((_, stringIdx) => {
				const y = stringY(stringIdx);
				return (
					<div
						key={`string-${stringIdx}`}
						style={{
							position: "absolute",
							left: 0,
							width: "100%",
							height: 1,
							background: "#666",
							top: y,
							pointerEvents: "none",
						}}
					/>
				);
			})}

			{/* DOTS WITH NOTE LABELS */}
			{dots.map(({ stringIdx, fretIdx, label, pc }, idx) => {
				if (activePCs && !activePCs.has(pc)) {
					return null;
				}
				const cellWidth = width / frets;
				const xPos = (fretIdx + 0.5) * cellWidth; // middle of fret
				const yPos = stringY(stringIdx); // exactly on string line

				return (
					<div
						key={`dot-${idx}`}
						style={{
							position: "absolute",
							left: xPos,
							top: yPos,
							transform: "translate(-50%, -50%)",
							width: 36,
							height: 22,
							borderRadius: "50%",
							background: getColor(pc),
							color: "black",
							fontFamily: "-moz-initial",
							fontSize: "16px",
							fontWeight: "bolder",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							pointerEvents: "none",
						}}>
						{label}
					</div>
				);
			})}
		</div>
	);
}
