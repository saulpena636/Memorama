(() => {
	const boardEl = document.getElementById('board');
	const bgMusicEl = document.getElementById('bg-music');
	const movesEl = document.getElementById('moves');
	const timerEl = document.getElementById('timer');
	const restartBtn = document.getElementById('restart');
	const sizeSel = document.getElementById('size');
	const messageEl = document.getElementById('message');
	let musicStarted = false;

	// NUEVO: Elementos del modal de victoria
	const winOverlayEl = document.getElementById('win-overlay');
	const winMessageTextEl = document.getElementById('win-message-text');
	const winRestartBtn = document.getElementById('win-restart-btn');

	let size = parseInt(sizeSel.value, 10);
	let totalCards = size * size;
	let symbols = [];
	let first = null;
	let second = null;
	let lock = false;
	let moves = 0;
	let matches = 0;
	let timer = null;
	let seconds = 0;

	const IMAGE_FOLDER = 'images/';
	const IMAGE_FILES = [
		'bash.png', 'c.png', 'c%23.png', 'c++.png', 'dart.png', 'go.png',
		'java.png', 'javascript.png', 'kotlin.png', 'matlab.png', 'perl.png', 'php.png',
		'python.png', 'r.png', 'ruby.png', 'rust.png', 'swift.png', 'typescript.png'
	];

	function init() {
		size = parseInt(sizeSel.value, 10);
		totalCards = size * size;
		if (totalCards % 2 !== 0) totalCards = size * size + 1;
		resetState();
		createSymbols();
		renderBoard();
	}

	function resetState() {
		first = null; second = null; lock = false;
		moves = 0; matches = 0; seconds = 0;
		updateMoves();
		updateTimer();
		clearInterval(timer);
		timer = null;
		messageEl.classList.add('hidden');
		winOverlayEl.classList.add('hidden');
	}

	function createSymbols() {
		const neededPairs = totalCards / 2;
		const pool = IMAGE_FILES.map(f => IMAGE_FOLDER + f);
		if (neededPairs > pool.length) {
			while (pool.length < neededPairs) pool.push(...IMAGE_FILES.map(f => IMAGE_FOLDER + f));
		}
		shuffleArray(pool);
		symbols = pool.slice(0, neededPairs).flatMap(s => [s, s]);
		shuffleArray(symbols);
		preloadImages(symbols);
	}

	function preloadImages(list) {
		list.forEach(src => {
			const img = new Image();
			img.src = src;
		});
	}

	function renderBoard() {
		boardEl.innerHTML = '';
		boardEl.setAttribute('data-size', size);
		for (let i = 0; i < totalCards; i++) {
			const card = document.createElement('div');
			card.className = 'card';
			card.dataset.index = i;
			card.tabIndex = 0;
			card.innerHTML = `
				<div class="card-inner">
					<div class="card-face card-front"></div>
					<div class="card-face card-back"></div>
				</div>
			`;
			// Set faces
			const front = card.querySelector('.card-front');
			const back = card.querySelector('.card-back');

			front.textContent = '?';

			const imgSrc = symbols[i] || '';
			back.innerHTML = imgSrc ? `<img src="${imgSrc}" alt="carta ${i + 1}" style="max-width:80%;max-height:80%;object-fit:contain;">` : '';
			card.addEventListener('click', onCardClick);
			boardEl.appendChild(card);
		}
	}

	function onCardClick(e) {
		if (!musicStarted) {
			bgMusicEl.play().catch(e => console.error("Error al reproducir música:", e)); // Intenta reproducir y captura errores
			musicStarted = true;
		}
		const card = e.currentTarget;
		if (lock) return;
		if (card.classList.contains('flipped')) return;

		// Empieza el temporizador en el primer moviemiento
		if (moves === 0 && !timer) {
			startTimer();
		}

		card.classList.add('flipped');

		if (!first) {
			first = card;
			return;
		}
		second = card;
		lock = true;
		moves++;
		updateMoves();

		const i1 = parseInt(first.dataset.index, 10);
		const i2 = parseInt(second.dataset.index, 10);
		const s1 = symbols[i1];
		const s2 = symbols[i2];

		if (s1 === s2) {
			// Match
			matches++;
			first.classList.add('matched');
			second.classList.add('matched');
			resetTurn();
			if (matches === totalCards / 2) {
				// Llamar a win() 500ms después para que se vea la última carta
				setTimeout(win, 500);
			}
		} else {
			// No coincide, da vuelta a la carta
			setTimeout(() => {
				first.classList.remove('flipped');
				second.classList.remove('flipped');
				resetTurn();
			}, 800);
		}
	}

	function resetTurn() {
		first = null; second = null; lock = false;
	}

	function updateMoves() {
		movesEl.textContent = `Movimientos: ${moves}`;
	}

	function startTimer() {
		timer = setInterval(() => {
			seconds++;
			updateTimer();
		}, 1000);
	}

	function updateTimer() {
		const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
		const ss = String(seconds % 60).padStart(2, '0');
		timerEl.textContent = `Tiempo: ${mm}:${ss}`;
	}

	function win() {
		clearInterval(timer);

		// Lógica para mostrar el modal de victoria
		winMessageTextEl.textContent = `Completaste en ${moves} movimientos y ${formatTime(seconds)}.`;
		winOverlayEl.classList.remove('hidden');

		// Oculta el mensaje viejo
		messageEl.classList.add('hidden');
	}

	function formatTime(s) {
		const mm = Math.floor(s / 60);
		const ss = s % 60;
		return `${mm}m ${ss}s`;
	}

	function shuffleArray(arr) {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
	}

	// Controles
	restartBtn.addEventListener('click', init);
	sizeSel.addEventListener('change', init);

	// Listener para el botón de reinicio en el modal
	winRestartBtn.addEventListener('click', init);

	// Configura la música de fondo
	if (bgMusicEl) {
		bgMusicEl.volume = 0.7; // volumen normal (0.0 a 1.0)
	}

	// Inicia por primera vez
	init();

	// keyboard accessibility (flip with Enter/Space when focused)
	boardEl.addEventListener('keydown', (e) => {
		const el = e.target;
		if (!el.classList || !el.classList.contains('card')) return;
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			el.click();
		}
	});
})();