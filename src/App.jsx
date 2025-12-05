import { useMemo, useState, useEffect } from "react";
import FretboardGrid, { NOTE_NAMES_SHARP } from "./components/FretboardGrid";
import "./App.css";

const API_BASE = "http://localhost:4000";

const SCALE_PATTERNS = {
	major: [0, 2, 4, 5, 7, 9, 11],
	minor: [0, 2, 3, 5, 7, 8, 10],
	pentMajor: [0, 2, 4, 7, 9],
	pentMinor: [0, 3, 5, 7, 10],
	none: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

function pcsForScale(root, scaleName) {
	const rootPC = NOTE_NAMES_SHARP.indexOf(root);
	if (rootPC === -1) return new Set();

	const pattern = SCALE_PATTERNS[scaleName] ?? SCALE_PATTERNS.none;
	const pcs = pattern.map((interval) => (rootPC + interval) % 12);
	return new Set(pcs);
}

function App() {
	const [root, setRoot] = useState("C");
	const [scaleName, setScaleName] = useState("major");
	const [layout, setLayout] = useState({
		strings: 6,
		frets: 12,
		tuning: [40, 45, 50, 55, 59, 64],
	});
	const [sessionId, setSessionId] = useState(null);

	const activePCs = useMemo(() => pcsForScale(root, scaleName), [root, scaleName]);

	// 1) On mount: load existing session or create a new one
	useEffect(() => {
		async function loadOrCreate() {
			const existingId = localStorage.getItem("fretboardSessionId");

			if (existingId) {
				try {
					const res = await fetch(`${API_BASE}/api/session/${existingId}`);
					if (res.ok) {
						const data = await res.json();
						setSessionId(data.id);

						// Apply saved state
						if (data.state.root) setRoot(data.state.root);
						if (data.state.scaleName) setScaleName(data.state.scaleName);
						if (data.state.layout) setLayout(data.state.layout);
						return;
					} else {
						// Bad/expired id; forget it
						localStorage.removeItem("fretboardSessionId");
					}
				} catch (err) {
					console.error("Failed to load session", err);
				}
			}

			// No valid session → create new
			try {
				const res = await fetch(`${API_BASE}/api/session`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						state: { root, scaleName, layout },
					}),
				});

				const data = await res.json();
				setSessionId(data.id);
				localStorage.setItem("fretboardSessionId", data.id);
			} catch (err) {
				console.error("Failed to create session", err);
			}
		}

		loadOrCreate();
	}, []); // << run once on mount

	// 2) Whenever fretboard state changes, save to DB
	useEffect(() => {
		if (!sessionId) return; // don’t save until we actually have one

		const state = { root, scaleName, layout };

		fetch(`${API_BASE}/api/session/${sessionId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ state }),
		}).catch((err) => {
			console.error("Failed to save session", err);
		});
	}, [root, scaleName, layout, sessionId]);

	return (
		<div
			style={{
				padding: 20,
				background: "#111",
				minHeight: "100vh",
				color: "white",
				fontFamily: "system-ui, sans-serif",
			}}>
			<h1 style={{ marginBottom: 12 }}>Guitar Scale Viewer</h1>

			<div
				style={{
					marginBottom: 16,
					display: "flex",
					gap: 16,
					flexWrap: "wrap",
				}}>
				<label>
					Root:&nbsp;
					<select value={root} onChange={(e) => setRoot(e.target.value)}>
						{NOTE_NAMES_SHARP.map((note) => (
							<option key={note} value={note}>
								{note}
							</option>
						))}
					</select>
				</label>

				<label>
					Scale:&nbsp;
					<select value={scaleName} onChange={(e) => setScaleName(e.target.value)}>
						<option value='major'>Major</option>
						<option value='minor'>Minor</option>
						<option value='pentMajor'>Major Pentatonic</option>
						<option value='pentMinor'>Minor Pentatonic</option>
						<option value='none'>none</option>
					</select>
				</label>
			</div>

			<FretboardGrid activePCs={activePCs} />
		</div>
	);
}

export default App;
