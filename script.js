let board = [], rows, cols;
let currentPlayer = 'blue';
let mode = 'pvp';
let difficulty = 'medium';
let orientation = { red: '', blue: '' };
let scores = { blue: 0, red: 0 };
let gameOver = false;

$(document).ready(() => {
  $('#mode').on('change', function () {
    if ($(this).val() === 'ai') {
      $('#difficultyContainer').show();
    } else {
      $('#difficultyContainer').hide();
    }
  }).trigger('change');

  $('#startBtn').click(() => {
    mode = $('#mode').val();
    difficulty = $('#difficulty').val();
    rows = parseInt($('#rows').val());
    cols = parseInt($('#cols').val());

    const player1Orientation = $('#player1Orientation').val();
    orientation.blue = player1Orientation;
    orientation.red = player1Orientation === 'horizontal' ? 'vertical' : 'horizontal';

    $('.setup').hide();
    $('.controls').removeClass('hidden');
    initBoard();
    updateStatus();
    if (mode === 'ai' && currentPlayer === 'red') aiMove();
  });

  $('#restartBtn').click(() => {
    scores = { blue: 0, red: 0 };
    updateScore();
    $('.controls').addClass('hidden');
    $('.setup').show();
    $('#gameBoard').empty();
    $('#status').text('');
  });
});

function initBoard() {
  board = Array.from({ length: rows }, () => Array(cols).fill(null));
  gameOver = false;
  $('#gameBoard').empty().css({
    'grid-template-columns': `repeat(${cols}, minmax(60px, 1fr))`,
    'grid-template-rows': `repeat(${rows}, minmax(60px, 1fr))`
  });

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = $('<div>').addClass('cell').data({ r, c });
      $('#gameBoard').append(cell);
    }
  }

  $('#gameBoard')
    .off('click')
    .on('click', '.cell', function () {
      if (gameOver) return;
      const { r, c } = $(this).data();
      playerMove(r, c);
    })
    .on('mouseenter', '.cell', function () {
      if (gameOver || (mode === 'ai' && currentPlayer === 'red')) return;
      const { r, c } = $(this).data();
      const [r2, c2] = getSecondCell(r, c, orientation[currentPlayer]);
      if (!isValidMove(r, c, r2, c2)) return;
      getCell(r, c).addClass('hover-preview');
      getCell(r2, c2).addClass('hover-preview');
    })
    .on('mouseleave', '.cell', function () {
      $('.cell').removeClass('hover-preview');
    });

  currentPlayer = 'blue';
}

function playerMove(r, c) {
  if (gameOver || (mode === 'ai' && currentPlayer === 'red')) return;
  if (makeMove(r, c, currentPlayer)) {
    $('#moveSound')[0].play();
    switchPlayer();
  }
}

function makeMove(r, c, player) {
  const [r2, c2] = getSecondCell(r, c, orientation[player]);
  if (!isValidMove(r, c, r2, c2)) return false;

  board[r][c] = board[r2][c2] = player;
  getCell(r, c).addClass(player).addClass("placed");
  getCell(r2, c2).addClass(player).addClass("placed");
  return true;
}

function switchPlayer() {
  const opponent = currentPlayer === 'blue' ? 'red' : 'blue';
  if (!hasMoves(opponent)) {
    $('#status').html(`<span class="winner-text">🎉 ${capitalize(currentPlayer)} wins the game! 🎉</span>`);
    $('#winSound')[0].play();
    scores[currentPlayer]++;
    updateScore();
    gameOver = true;
    return;
  }
  currentPlayer = opponent;
  updateStatus();
  if (mode === 'ai' && currentPlayer === 'red') {
    setTimeout(aiMove, 200);
  }
}

function aiMove() {
  let depth = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 3 : 5;
  let best = minimax(board, 'red', depth, -Infinity, Infinity);
  if (best && best.move && !gameOver) {
    const [r, c] = best.move;
    makeMove(r, c, 'red');
    $('#moveSound')[0].play();
    switchPlayer();
  }
}

function minimax(state, player, depth, alpha, beta) {
  if (depth === 0 || !hasMovesInState(state, player)) {
    return { score: evaluate(state) };
  }

  let best = { score: -Infinity };
  const moves = getAllMoves(state, player);
  for (const move of moves) {
    let newState = copyBoard(state);
    const [r, c] = move;
    const [r2, c2] = getSecondCell(r, c, orientation[player]);
    newState[r][c] = newState[r2][c2] = player;

    let opponent = player === 'blue' ? 'red' : 'blue';
    let result = minimax(newState, opponent, depth - 1, -beta, -alpha);
    let score = -result.score;

    if (score > best.score) {
      best = { move, score };
    }

    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
  }
  return best;
}

function evaluate(state) {
  return getAllMoves(state, 'red').length - getAllMoves(state, 'blue').length;
}

function getAllMoves(state, player) {
  let moves = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [r2, c2] = getSecondCell(r, c, orientation[player]);
      if (r2 < rows && c2 < cols && state[r][c] === null && state[r2][c2] === null) {
        moves.push([r, c]);
      }
    }
  }
  return moves;
}

function copyBoard(b) {
  return b.map(row => row.slice());
}

function getSecondCell(r, c, dir) {
  return dir === 'horizontal' ? [r, c + 1] : [r + 1, c];
}

function isValidMove(r1, c1, r2, c2) {
  return r2 < rows && c2 < cols && board[r1][c1] === null && board[r2][c2] === null;
}

function getCell(r, c) {
  return $('#gameBoard .cell').eq(r * cols + c);
}

function hasMoves(player) {
  return getAllMoves(board, player).length > 0;
}

function hasMovesInState(state, player) {
  return getAllMoves(state, player).length > 0;
}

function updateStatus() {
  const color = currentPlayer === 'blue' ? '#00aaff' : '#ff4444';
  $('#status').html(`<span style="color: ${color}; font-weight: bold; font-size: 1.4rem;">${capitalize(currentPlayer)}'s Turn</span>`);
}

function updateScore() {
  $('#blueScore').text(scores.blue);
  $('#redScore').text(scores.red);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
