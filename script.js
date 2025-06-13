class BattleshipGame {
    constructor() {
        this.boardSize = 10;
        this.ships = {
            carrier: { size: 5, placed: false },
            battleship: { size: 4, placed: false },
            cruiser: { size: 3, placed: false },
            submarine: { size: 3, placed: false },
            destroyer: { size: 2, placed: false }
        };
        
        this.playerBoard = this.createBoard();
        this.aiBoard = this.createBoard();
        this.playerShips = [];
        this.aiShips = [];
        
        this.currentShip = 'carrier';
        this.isHorizontal = true;
        this.gameStarted = false;
        this.gameOver = false;
        this.playerTurn = true;
        
        this.aiLastHit = null;
        this.aiTargets = [];
        
        this.initializeUI();
        this.setupEventListeners();
    }

    createBoard() {
        return Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
    }

    initializeUI() {
        this.createBoardUI('playerBoard');
        this.createBoardUI('aiBoard');
        this.updateShipList();
    }

    createBoardUI(boardId) {
        const board = document.getElementById(boardId);
        board.innerHTML = '';
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.dataset.board = boardId;
                board.appendChild(cell);
            }
        }
    }

    setupEventListeners() {
        document.getElementById('rotateBtn').addEventListener('click', () => {
            this.isHorizontal = !this.isHorizontal;
            this.updateStatus(`Ship orientation: ${this.isHorizontal ? 'Horizontal' : 'Vertical'}`);
        });

        document.getElementById('randomBtn').addEventListener('click', () => {
            this.placeShipsRandomly();
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.newGame();
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                this.handleCellClick(e.target);
            }
        });
    }

    handleCellClick(cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const board = cell.dataset.board;

        if (!this.gameStarted) {
            if (board === 'playerBoard') {
                this.placeShip(row, col);
            }
        } else if (!this.gameOver && this.playerTurn && board === 'aiBoard') {
            this.playerShoot(row, col);
        }
    }

    placeShip(row, col) {
        const ship = this.ships[this.currentShip];
        if (ship.placed) return;

        if (this.canPlaceShip(this.playerBoard, row, col, ship.size, this.isHorizontal)) {
            this.addShipToBoard(this.playerBoard, row, col, ship.size, this.isHorizontal, this.currentShip);
            ship.placed = true;
            
            this.playerShips.push({
                name: this.currentShip,
                positions: this.getShipPositions(row, col, ship.size, this.isHorizontal),
                hits: 0
            });

            this.updateShipList();
            this.renderPlayerBoard();
            
            const nextShip = this.getNextUnplacedShip();
            if (nextShip) {
                this.currentShip = nextShip;
                this.updateStatus(`Place your ${nextShip} (${this.ships[nextShip].size} cells)`);
            } else {
                this.updateStatus('All ships placed! Click Start Game to begin.');
                document.getElementById('startBtn').disabled = false;
            }
        }
    }

    canPlaceShip(board, row, col, size, horizontal) {
        for (let i = 0; i < size; i++) {
            const r = horizontal ? row : row + i;
            const c = horizontal ? col + i : col;
            
            if (r >= this.boardSize || c >= this.boardSize || board[r][c] !== 0) {
                return false;
            }
        }
        return true;
    }

    addShipToBoard(board, row, col, size, horizontal, shipName) {
        for (let i = 0; i < size; i++) {
            const r = horizontal ? row : row + i;
            const c = horizontal ? col + i : col;
            board[r][c] = shipName;
        }
    }

    getShipPositions(row, col, size, horizontal) {
        const positions = [];
        for (let i = 0; i < size; i++) {
            const r = horizontal ? row : row + i;
            const c = horizontal ? col + i : col;
            positions.push([r, c]);
        }
        return positions;
    }

    getNextUnplacedShip() {
        const shipNames = Object.keys(this.ships);
        return shipNames.find(name => !this.ships[name].placed);
    }

    placeShipsRandomly() {
        // Reset all ships
        Object.keys(this.ships).forEach(ship => {
            this.ships[ship].placed = false;
        });
        this.playerBoard = this.createBoard();
        this.playerShips = [];

        // Place ships randomly
        Object.keys(this.ships).forEach(shipName => {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const row = Math.floor(Math.random() * this.boardSize);
                const col = Math.floor(Math.random() * this.boardSize);
                const horizontal = Math.random() < 0.5;
                
                if (this.canPlaceShip(this.playerBoard, row, col, this.ships[shipName].size, horizontal)) {
                    this.addShipToBoard(this.playerBoard, row, col, this.ships[shipName].size, horizontal, shipName);
                    this.ships[shipName].placed = true;
                    
                    this.playerShips.push({
                        name: shipName,
                        positions: this.getShipPositions(row, col, this.ships[shipName].size, horizontal),
                        hits: 0
                    });
                    
                    placed = true;
                }
                attempts++;
            }
        });

        this.updateShipList();
        this.renderPlayerBoard();
        this.updateStatus('Ships placed randomly! Click Start Game to begin.');
        document.getElementById('startBtn').disabled = false;
    }

    placeAIShips() {
        this.aiBoard = this.createBoard();
        this.aiShips = [];

        Object.keys(this.ships).forEach(shipName => {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const row = Math.floor(Math.random() * this.boardSize);
                const col = Math.floor(Math.random() * this.boardSize);
                const horizontal = Math.random() < 0.5;
                
                if (this.canPlaceShip(this.aiBoard, row, col, this.ships[shipName].size, horizontal)) {
                    this.addShipToBoard(this.aiBoard, row, col, this.ships[shipName].size, horizontal, shipName);
                    
                    this.aiShips.push({
                        name: shipName,
                        positions: this.getShipPositions(row, col, this.ships[shipName].size, horizontal),
                        hits: 0
                    });
                    
                    placed = true;
                }
                attempts++;
            }
        });
    }

    startGame() {
        this.placeAIShips();
        this.gameStarted = true;
        this.updateStatus("Game started! Click on the enemy board to attack.");
        document.getElementById('shipPlacement').style.display = 'none';
    }

    playerShoot(row, col) {
        if (this.aiBoard[row][col] === 'hit' || this.aiBoard[row][col] === 'miss') {
            return; // Already shot here
        }

        const originalValue = this.aiBoard[row][col];
        
        if (originalValue !== 0) {
            // Hit!
            this.aiBoard[row][col] = 'hit';
            const ship = this.aiShips.find(s => s.name === originalValue);
            ship.hits++;
            
            if (ship.hits === this.ships[ship.name].size) {
                this.markShipAsSunk(this.aiBoard, ship, 'aiBoard');
                this.updateStatus(`You sunk the enemy ${ship.name}!`);
            } else {
                this.updateStatus("Hit!");
            }
            
            if (this.checkWin('player')) {
                this.endGame('player');
                return;
            }
        } else {
            // Miss
            this.aiBoard[row][col] = 'miss';
            this.updateStatus("Miss! AI's turn...");
            this.playerTurn = false;
            setTimeout(() => this.aiTurn(), 1000);
        }

        this.renderAIBoard();
    }

    aiTurn() {
        if (this.gameOver) return;

        let row, col;
        
        // Smart AI: Target around previous hits
        if (this.aiTargets.length > 0) {
            [row, col] = this.aiTargets.shift();
        } else if (this.aiLastHit) {
            // Look for adjacent cells to last hit
            const adjacent = this.getAdjacentCells(this.aiLastHit[0], this.aiLastHit[1]);
            const validTargets = adjacent.filter(([r, c]) => 
                this.playerBoard[r][c] !== 'hit' && this.playerBoard[r][c] !== 'miss'
            );
            
            if (validTargets.length > 0) {
                [row, col] = validTargets[Math.floor(Math.random() * validTargets.length)];
            } else {
                this.aiLastHit = null;
                [row, col] = this.getRandomTarget();
            }
        } else {
            [row, col] = this.getRandomTarget();
        }

        const originalValue = this.playerBoard[row][col];
        
        if (originalValue !== 0 && originalValue !== 'hit' && originalValue !== 'miss') {
            // Hit!
            this.playerBoard[row][col] = 'hit';
            this.aiLastHit = [row, col];
            
            const ship = this.playerShips.find(s => s.name === originalValue);
            ship.hits++;
            
            if (ship.hits === this.ships[ship.name].size) {
                this.markShipAsSunk(this.playerBoard, ship, 'playerBoard');
                this.aiLastHit = null;
                this.aiTargets = [];
                this.updateStatus(`AI sunk your ${ship.name}!`);
            } else {
                this.updateStatus("AI hit your ship!");
                // Add adjacent cells as targets
                const adjacent = this.getAdjacentCells(row, col);
                adjacent.forEach(pos => {
                    if (!this.aiTargets.some(target => target[0] === pos[0] && target[1] === pos[1])) {
                        this.aiTargets.push(pos);
                    }
                });
            }
            
            if (this.checkWin('ai')) {
                this.endGame('ai');
                return;
            }
        } else {
            // Miss
            this.playerBoard[row][col] = 'miss';
            this.updateStatus("AI missed! Your turn.");
        }

        this.renderPlayerBoard();
        this.playerTurn = true;
    }

    getAdjacentCells(row, col) {
        const adjacent = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        directions.forEach(([dr, dc]) => {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < this.boardSize && 
                newCol >= 0 && newCol < this.boardSize) {
                adjacent.push([newRow, newCol]);
            }
        });
        
        return adjacent;
    }

    getRandomTarget() {
        let row, col;
        do {
            row = Math.floor(Math.random() * this.boardSize);
            col = Math.floor(Math.random() * this.boardSize);
        } while (this.playerBoard[row][col] === 'hit' || this.playerBoard[row][col] === 'miss');
        
        return [row, col];
    }

    markShipAsSunk(board, ship, boardId) {
        ship.positions.forEach(([r, c]) => {
            board[r][c] = 'sunk';
            const cell = document.querySelector(`#${boardId} .cell[data-row="${r}"][data-col="${c}"]`);
            cell.className = 'cell sunk';
            cell.textContent = '💀';
        });
    }

    checkWin(player) {
        const ships = player === 'player' ? this.aiShips : this.playerShips;
        return ships.every(ship => ship.hits === this.ships[ship.name].size);
    }

    endGame(winner) {
        this.gameOver = true;
        const status = document.getElementById('status');
        
        if (winner === 'player') {
            status.innerHTML = '🎉 Victory! You defeated the AI! 🎉';
            status.className = 'status victory';
        } else {
            status.innerHTML = '💀 Defeat! The AI destroyed your fleet! 💀';
            status.className = 'status defeat';
        }
        
        document.getElementById('newGameBtn').style.display = 'inline-block';
    }

    renderPlayerBoard() {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.querySelector(`#playerBoard .cell[data-row="${i}"][data-col="${j}"]`);
                const value = this.playerBoard[i][j];
                
                cell.className = 'cell';
                cell.textContent = '';
                
                if (value === 'hit') {
                    cell.className += ' hit';
                    cell.textContent = '💥';
                } else if (value === 'miss') {
                    cell.className += ' miss';
                    cell.textContent = '💧';
                } else if (value === 'sunk') {
                    cell.className += ' sunk';
                    cell.textContent = '💀';
                } else if (value !== 0) {
                    cell.className += ' ship';
                    cell.textContent = '🚢';
                }
            }
        }
    }

    renderAIBoard() {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.querySelector(`#aiBoard .cell[data-row="${i}"][data-col="${j}"]`);
                const value = this.aiBoard[i][j];
                
                cell.className = 'cell';
                cell.textContent = '';
                
                if (value === 'hit') {
                    cell.className += ' hit';
                    cell.textContent = '💥';
                } else if (value === 'miss') {
                    cell.className += ' miss';
                    cell.textContent = '💧';
                } else if (value === 'sunk') {
                    cell.className += ' sunk';
                    cell.textContent = '💀';
                }
                // Don't show AI ships until hit
            }
        }
    }

    updateShipList() {
        Object.keys(this.ships).forEach(shipName => {
            const shipElement = document.querySelector(`[data-ship="${shipName}"]`);
            shipElement.className = 'ship-item';
            
            if (this.ships[shipName].placed) {
                shipElement.className += ' placed';
            } else if (shipName === this.currentShip) {
                shipElement.className += ' placing';
            }
        });
    }

    updateStatus(message) {
        document.getElementById('status').textContent = message;
    }

    newGame() {
        // Reset everything
        Object.keys(this.ships).forEach(ship => {
            this.ships[ship].placed = false;
        });
        
        this.playerBoard = this.createBoard();
        this.aiBoard = this.createBoard();
        this.playerShips = [];
        this.aiShips = [];
        
        this.currentShip = 'carrier';
        this.isHorizontal = true;
        this.gameStarted = false;
        this.gameOver = false;
        this.playerTurn = true;
        
        this.aiLastHit = null;
        this.aiTargets = [];
        
        this.initializeUI();
        this.updateStatus('Place your ships on the board. Click to rotate, then click on the board to place.');
        
        document.getElementById('shipPlacement').style.display = 'block';
        document.getElementById('startBtn').disabled = true;
        document.getElementById('newGameBtn').style.display = 'none';
        document.getElementById('status').className = 'status';
    }
}

// Start the game
const game = new BattleshipGame();