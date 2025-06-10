class SlidingPuzzle {
  constructor() {
    this.currentImage = null;
    this.puzzleSize = 3;
    this.puzzleBoard = [];
    this.emptyPosition = { row: 0, col: 0 };
    this.startTime = null;
    this.timerInterval = null;
    this.moves = 0;
    this.isGameActive = false;

    this.initializeElements();
    this.bindEvents();
  }

  initializeElements() {
    // DOM 요소들
    this.imageUpload = document.getElementById("imageUpload");
    this.startGameBtn = document.getElementById("startGame");
    this.settingsPanel = document.getElementById("settingsPanel");
    this.gameScreen = document.getElementById("gameScreen");
    this.puzzleBoardEl = document.getElementById("puzzleBoard");
    this.originalCanvas = document.getElementById("originalImage");
    this.timerDisplay = document.getElementById("timer");
    this.movesDisplay = document.getElementById("moves");
    this.backToMenuBtn = document.getElementById("backToMenu");

    // 모달 요소들
    this.completionModal = document.getElementById("completionModal");
    this.finalTimeSpan = document.getElementById("finalTime");
    this.finalMovesSpan = document.getElementById("finalMoves");
    this.gradeSpan = document.getElementById("grade");
    this.playAgainBtn = document.getElementById("playAgain");
    this.newGameBtn = document.getElementById("newGame");

    // 도움말 요소들
    this.helpBtn = document.getElementById("helpBtn");
    this.helpModal = document.getElementById("helpModal");
    this.closeHelpBtn = document.getElementById("closeHelp");
  }

  bindEvents() {
    // 이미지 업로드
    this.imageUpload.addEventListener("change", (e) => {
      this.handleImageUpload(e);
    });

    // 퍼즐 크기 선택
    document.querySelectorAll(".size-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.selectPuzzleSize(e);
      });
    });

    // 게임 시작
    this.startGameBtn.addEventListener("click", () => {
      this.startGame();
    });

    // 메뉴로 돌아가기
    this.backToMenuBtn.addEventListener("click", () => {
      this.backToMenu();
    });

    // 모달 버튼들
    this.playAgainBtn.addEventListener("click", () => {
      this.playAgain();
    });

    this.newGameBtn.addEventListener("click", () => {
      this.newGame();
    });

    // 도움말 버튼들
    this.helpBtn.addEventListener("click", () => {
      this.showHelp();
    });

    this.closeHelpBtn.addEventListener("click", () => {
      this.hideHelp();
    });

    // 도움말 모달 배경 클릭 시 닫기
    this.helpModal.addEventListener("click", (e) => {
      if (e.target === this.helpModal) {
        this.hideHelp();
      }
    });
  }

  handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        this.currentImage = img;
        this.startGameBtn.disabled = false;
        this.displayOriginalImage();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  displayOriginalImage() {
    const canvas = this.originalCanvas;
    const ctx = canvas.getContext("2d");
    const size = 200;

    canvas.width = size;
    canvas.height = size;

    // 이미지를 정사각형으로 크롭하여 캔버스에 그리기
    const minDimension = Math.min(
      this.currentImage.width,
      this.currentImage.height
    );
    const sx = (this.currentImage.width - minDimension) / 2;
    const sy = (this.currentImage.height - minDimension) / 2;

    ctx.drawImage(
      this.currentImage,
      sx,
      sy,
      minDimension,
      minDimension,
      0,
      0,
      size,
      size
    );
  }

  selectPuzzleSize(e) {
    document.querySelectorAll(".size-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    e.target.classList.add("active");
    this.puzzleSize = parseInt(e.target.dataset.size);
  }

  startGame() {
    this.settingsPanel.style.display = "none";
    this.gameScreen.style.display = "block";

    this.initializePuzzle();
    this.shufflePuzzle();
    this.renderPuzzle();
    this.startTimer();
    this.resetMoves();
    this.isGameActive = true;
  }

  initializePuzzle() {
    // 퍼즐 보드 초기화 (완성된 상태)
    this.puzzleBoard = [];
    for (let row = 0; row < this.puzzleSize; row++) {
      this.puzzleBoard[row] = [];
      for (let col = 0; col < this.puzzleSize; col++) {
        if (row === this.puzzleSize - 1 && col === this.puzzleSize - 1) {
          this.puzzleBoard[row][col] = null; // 빈 공간
          this.emptyPosition = { row, col };
        } else {
          this.puzzleBoard[row][col] = row * this.puzzleSize + col;
        }
      }
    }
  }

  shufflePuzzle() {
    // 올바른 순서로 섞기 (해결 가능한 상태 보장)
    for (let i = 0; i < 1000; i++) {
      const possibleMoves = this.getPossibleMoves();
      const randomMove =
        possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      this.movePiece(randomMove.row, randomMove.col, false); // 카운트하지 않음
    }
  }

  getPossibleMoves() {
    const moves = [];
    const { row, col } = this.emptyPosition;

    // 상하좌우 체크
    const directions = [
      { row: row - 1, col: col }, // 위
      { row: row + 1, col: col }, // 아래
      { row: row, col: col - 1 }, // 왼쪽
      { row: row, col: col + 1 }, // 오른쪽
    ];

    directions.forEach((dir) => {
      if (
        dir.row >= 0 &&
        dir.row < this.puzzleSize &&
        dir.col >= 0 &&
        dir.col < this.puzzleSize
      ) {
        moves.push(dir);
      }
    });

    return moves;
  }

  renderPuzzle() {
    this.puzzleBoardEl.innerHTML = "";
    this.puzzleBoardEl.style.gridTemplateColumns = `repeat(${this.puzzleSize}, 1fr)`;
    this.puzzleBoardEl.className = `puzzle-board size-${this.puzzleSize}`;

    for (let row = 0; row < this.puzzleSize; row++) {
      for (let col = 0; col < this.puzzleSize; col++) {
        const piece = document.createElement("div");
        piece.className = "puzzle-piece";
        piece.dataset.row = row;
        piece.dataset.col = col;

        if (this.puzzleBoard[row][col] === null) {
          piece.classList.add("empty");
        } else {
          this.setPieceImage(piece, this.puzzleBoard[row][col]);
          piece.addEventListener("click", () => {
            if (this.isGameActive) {
              this.handlePieceClick(row, col);
            }
          });
        }

        this.puzzleBoardEl.appendChild(piece);
      }
    }
  }

  setPieceImage(piece, pieceNumber) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const pieceSize = this.puzzleSize === 3 ? 80 : 60;

    canvas.width = pieceSize;
    canvas.height = pieceSize;

    // 원본 이미지에서 해당 조각 추출
    const sourceRow = Math.floor(pieceNumber / this.puzzleSize);
    const sourceCol = pieceNumber % this.puzzleSize;

    const minDimension = Math.min(
      this.currentImage.width,
      this.currentImage.height
    );
    const sx =
      (this.currentImage.width - minDimension) / 2 +
      (sourceCol * minDimension) / this.puzzleSize;
    const sy =
      (this.currentImage.height - minDimension) / 2 +
      (sourceRow * minDimension) / this.puzzleSize;
    const sWidth = minDimension / this.puzzleSize;
    const sHeight = minDimension / this.puzzleSize;

    ctx.drawImage(
      this.currentImage,
      sx,
      sy,
      sWidth,
      sHeight,
      0,
      0,
      pieceSize,
      pieceSize
    );

    piece.style.backgroundImage = `url(${canvas.toDataURL()})`;
  }

  handlePieceClick(row, col) {
    if (this.canMovePiece(row, col)) {
      this.movePiece(row, col, true);
      this.renderPuzzle();

      if (this.isPuzzleComplete()) {
        this.completePuzzle();
      }
    }
  }

  canMovePiece(row, col) {
    const { row: emptyRow, col: emptyCol } = this.emptyPosition;

    return (
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow)
    );
  }

  movePiece(row, col, countMove = true) {
    if (!this.canMovePiece(row, col)) return;

    const { row: emptyRow, col: emptyCol } = this.emptyPosition;

    // 조각과 빈 공간 교환
    this.puzzleBoard[emptyRow][emptyCol] = this.puzzleBoard[row][col];
    this.puzzleBoard[row][col] = null;
    this.emptyPosition = { row, col };

    if (countMove) {
      this.moves++;
      this.movesDisplay.textContent = this.moves;
    }
  }

  isPuzzleComplete() {
    for (let row = 0; row < this.puzzleSize; row++) {
      for (let col = 0; col < this.puzzleSize; col++) {
        const expectedValue = row * this.puzzleSize + col;

        if (row === this.puzzleSize - 1 && col === this.puzzleSize - 1) {
          // 마지막 위치는 null이어야 함
          if (this.puzzleBoard[row][col] !== null) return false;
        } else {
          if (this.puzzleBoard[row][col] !== expectedValue) return false;
        }
      }
    }
    return true;
  }

  completePuzzle() {
    this.isGameActive = false;
    this.stopTimer();

    const completionTime = this.getElapsedTime();
    const grade = this.calculateGrade(completionTime, this.moves);

    this.showCompletionModal(completionTime, this.moves, grade);
  }

  calculateGrade(timeInSeconds, moves) {
    // 퍼즐 크기에 따른 기준 조정 (초등학생 매우 친화적으로 수정)
    const sizeFactor = this.puzzleSize === 3 ? 1 : 2;
    const perfectTime = 120 * sizeFactor; // 완벽한 시간 (3x3: 2분, 4x4: 4분)
    const perfectMoves = this.puzzleSize === 3 ? 80 : 150; // 완벽한 이동 횟수 (매우 여유롭게)

    let score = 100;

    // 시간 점수 (30% 비중으로 더 감소)
    if (timeInSeconds > perfectTime) {
      score -= Math.min(20, ((timeInSeconds - perfectTime) / perfectTime) * 20);
    }

    // 이동 횟수 점수 (30% 비중으로 더 감소)
    if (moves > perfectMoves) {
      score -= Math.min(20, ((moves - perfectMoves) / perfectMoves) * 20);
    }

    // 등급 기준을 매우 관대하게 조정
    if (score >= 80) return "S"; // 80점 이상
    if (score >= 70) return "A"; // 70점 이상
    if (score >= 60) return "B"; // 60점 이상
    if (score >= 50) return "C"; // 50점 이상
    return "D";
  }

  showCompletionModal(timeInSeconds, moves, grade) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    this.finalTimeSpan.textContent = timeString;
    this.finalMovesSpan.textContent = moves;
    this.gradeSpan.textContent = grade;
    this.gradeSpan.className = `grade-${grade}`;

    this.completionModal.style.display = "flex";
  }

  startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsed = this.getElapsedTime();
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      this.timerDisplay.textContent = `${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  getElapsedTime() {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  resetMoves() {
    this.moves = 0;
    this.movesDisplay.textContent = "0";
  }

  backToMenu() {
    this.stopTimer();
    this.isGameActive = false;
    this.gameScreen.style.display = "none";
    this.settingsPanel.style.display = "block";
  }

  playAgain() {
    this.completionModal.style.display = "none";
    this.startGame();
  }

  newGame() {
    this.completionModal.style.display = "none";
    this.backToMenu();

    // 이미지 업로드 초기화
    this.imageUpload.value = "";
    this.currentImage = null;
    this.startGameBtn.disabled = true;
    this.originalCanvas
      .getContext("2d")
      .clearRect(0, 0, this.originalCanvas.width, this.originalCanvas.height);
  }

  showHelp() {
    this.helpModal.style.display = "flex";
  }

  hideHelp() {
    this.helpModal.style.display = "none";
  }
}

// 게임 초기화
document.addEventListener("DOMContentLoaded", () => {
  new SlidingPuzzle();
});
