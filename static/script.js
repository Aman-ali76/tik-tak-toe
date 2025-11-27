class TicTacToeUI {
    constructor() {
        this.gameId = null;
        this.gameState = null;
        this.isLoading = false;
        this.scores = { player_x: 0, player_o: 0, computer: 0 };
        this.currentGameMode = 'two_player';
        
        console.log('TicTacToeUI initialized'); // Debug log
        
        this.initializeElements();
        this.bindEvents();
        this.loadScores();
        this.updateScoreDisplay();
    }
    
    initializeElements() {
        // Settings elements
        this.settingsPanel = document.getElementById('settings-panel');
        this.gamePanel = document.getElementById('game-panel');
        this.gridSizeSelect = document.getElementById('grid-size');
        this.gameModeSelect = document.getElementById('game-mode');
        this.difficultyGroup = document.getElementById('difficulty-group');
        this.difficultySelect = document.getElementById('difficulty');
        this.startGameBtn = document.getElementById('start-game');
        this.aiWarning = document.getElementById('ai-warning');
        
        // Game elements
        this.gameBoard = document.getElementById('game-board');
        this.currentPlayerSpan = document.getElementById('player-symbol');
        this.gameStatus = document.getElementById('game-status');
        this.newGameBtn = document.getElementById('new-game-btn');
        
        // Score elements
        this.scoreX = document.getElementById('score-x');
        this.scoreO = document.getElementById('score-o');
        this.scoreComputer = document.getElementById('score-computer');
        this.computerScoreItem = document.getElementById('computer-score');
        this.resetScoresBtn = document.getElementById('reset-scores');
        
        console.log('Elements initialized:', {
            startGameBtn: !!this.startGameBtn,
            gameBoard: !!this.gameBoard,
            settingsPanel: !!this.settingsPanel
        }); // Debug log
    }
    
    bindEvents() {
        console.log('Binding events...'); // Debug log
        
        if (this.gameModeSelect) {
            this.gameModeSelect.addEventListener('change', () => {
                console.log('Game mode changed to:', this.gameModeSelect.value);
                this.toggleDifficultySettings();
                this.validateGameSettings();
            });
        }
        
        if (this.gridSizeSelect) {
            this.gridSizeSelect.addEventListener('change', () => {
                console.log('Grid size changed to:', this.gridSizeSelect.value);
                this.validateGameSettings();
            });
        }
        
        if (this.startGameBtn) {
            this.startGameBtn.addEventListener('click', (e) => {
                console.log('Start game button clicked'); // Debug log
                e.preventDefault();
                this.startNewGame();
            });
        } else {
            console.error('Start game button not found!');
        }
        
        if (this.newGameBtn) {
            this.newGameBtn.addEventListener('click', () => {
                console.log('New game button clicked');
                this.showSettings();
            });
        }
        
        if (this.resetScoresBtn) {
            this.resetScoresBtn.addEventListener('click', () => {
                console.log('Reset scores button clicked');
                this.resetScores();
            });
        }
        
        console.log('Events bound successfully');
    }
    
    toggleDifficultySettings() {
        const isSinglePlayer = this.gameModeSelect.value === 'single_player';
        if (this.difficultyGroup) {
            this.difficultyGroup.style.display = isSinglePlayer ? 'block' : 'none';
        }
        if (this.computerScoreItem) {
            this.computerScoreItem.style.display = isSinglePlayer ? 'block' : 'none';
        }
    }
    
    validateGameSettings() {
        const gridSize = parseInt(this.gridSizeSelect.value);
        const gameMode = this.gameModeSelect.value;
        const isAiModeWithLargeGrid = gameMode === 'single_player' && gridSize > 3;
        
        // Show/hide warning
        if (this.aiWarning) {
            this.aiWarning.style.display = isAiModeWithLargeGrid ? 'block' : 'none';
        }
        
        // Disable start button and game mode for large grids
        if (gridSize > 3) {
            if (gameMode === 'single_player') {
                this.gameModeSelect.value = 'two_player';
                this.toggleDifficultySettings();
            }
            // Disable single player option
            const singlePlayerOption = this.gameModeSelect.querySelector('option[value="single_player"]');
            if (singlePlayerOption) {
                singlePlayerOption.disabled = true;
            }
        } else {
            // Enable single player option
            const singlePlayerOption = this.gameModeSelect.querySelector('option[value="single_player"]');
            if (singlePlayerOption) {
                singlePlayerOption.disabled = false;
            }
        }
        
        if (this.startGameBtn) {
            this.startGameBtn.disabled = isAiModeWithLargeGrid;
        }
    }
    
    async startNewGame() {
        console.log('Starting new game...'); // Debug log
        
        if (this.isLoading) {
            console.log('Already loading, ignoring click');
            return;
        }
        
        this.setLoading(true);
        
        const settings = {
            grid_size: parseInt(this.gridSizeSelect.value),
            game_mode: this.gameModeSelect.value,
            difficulty: this.difficultySelect.value
        };
        
        console.log('Game settings:', settings); // Debug log
        
        // Store game mode locally
        this.currentGameMode = settings.game_mode;
        
        try {
            console.log('Sending request to /api/new_game');
            
            const response = await fetch('/api/new_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings)
            });
            
            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to start new game');
            }
            
            this.gameId = data.game_id;
            this.gameState = data;
            // Ensure game_mode is available in gameState
            this.gameState.game_mode = this.currentGameMode;
            
            console.log('Game started successfully:', this.gameState);
            
            this.showGameBoard();
            this.renderBoard();
            this.updateGameStatus();
            
        } catch (error) {
            console.error('Error starting new game:', error);
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }
    
    async makeMove(row, col) {
        console.log('Making move:', { row, col });
        
        if (this.isLoading || this.gameState.game_over) {
            console.log('Move blocked - loading or game over');
            return;
        }
        
        this.setLoading(true);
        
        try {
            const response = await fetch('/api/make_move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ row, col })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Invalid move');
            }
            
            const data = await response.json();
            console.log('Move response:', data);
            
            this.gameState = { ...this.gameState, ...data };
            // Preserve game_mode
            this.gameState.game_mode = this.currentGameMode;
            
            this.renderBoard();
            this.updateGameStatus();
            
            // Update scores if game is over
            if (this.gameState.game_over) {
                console.log('Game over, updating scores');
                await this.updateScores();
            }
            
            // Highlight AI move if present
            if (data.ai_move) {
                setTimeout(() => {
                    this.highlightLastMove(data.ai_move[0], data.ai_move[1]);
                }, 300);
            }
            
        } catch (error) {
            console.error('Error making move:', error);
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }
    
    renderBoard() {
        if (!this.gameState || !this.gameBoard) {
            console.error('Cannot render board - missing gameState or gameBoard');
            return;
        }
        
        const gridSize = this.gameState.board.length;
        this.gameBoard.className = `game-board grid-${gridSize}`;
        this.gameBoard.innerHTML = '';
        
        console.log('Rendering board:', gridSize + 'x' + gridSize);
        
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const cell = document.createElement('button');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const cellValue = this.gameState.board[row][col];
                if (cellValue) {
                    cell.textContent = cellValue;
                    cell.classList.add('occupied', cellValue.toLowerCase());
                } else {
                    cell.addEventListener('click', () => {
                        console.log('Cell clicked:', { row, col });
                        this.makeMove(row, col);
                    });
                }
                
                // Highlight winning cells
                if (this.gameState.game_over && this.isWinningCell(row, col)) {
                    cell.classList.add('winning');
                }
                
                this.gameBoard.appendChild(cell);
            }
        }
    }
    
    isWinningCell(row, col) {
        if (!this.gameState.winning_line) return false;
        
        const winLine = this.gameState.winning_line;
        const gridSize = this.gameState.board.length;
        
        // Handle both object format and array format
        let winningCoords = [];
        
        if (Array.isArray(winLine)) {
            winningCoords = winLine;
        } else if (winLine.type && typeof winLine.index !== 'undefined') {
            if (winLine.type === 'row') {
                for (let j = 0; j < gridSize; j++) {
                    winningCoords.push([winLine.index, j]);
                }
            } else if (winLine.type === 'col') {
                for (let i = 0; i < gridSize; i++) {
                    winningCoords.push([i, winLine.index]);
                }
            } else if (winLine.type === 'diagonal') {
                if (winLine.index === 0) {
                    for (let i = 0; i < gridSize; i++) {
                        winningCoords.push([i, i]);
                    }
                } else {
                    for (let i = 0; i < gridSize; i++) {
                        winningCoords.push([i, gridSize - 1 - i]);
                    }
                }
            }
        }
        
        return winningCoords.some(([winRow, winCol]) => 
            winRow === row && winCol === col
        );
    }
    
    highlightLastMove(row, col) {
        const cell = this.gameBoard.querySelector(
            `[data-row="${row}"][data-col="${col}"]`
        );
        if (cell) {
            cell.style.background = '#ffeaa7';
            setTimeout(() => {
                cell.style.background = '';
            }, 1000);
        }
    }
    
    updateGameStatus() {
        if (!this.gameState) return;
        
        if (this.currentPlayerSpan) {
            this.currentPlayerSpan.textContent = this.gameState.current_player;
        }
        
        if (this.gameStatus) {
            if (this.gameState.game_over) {
                if (this.gameState.winner === 'tie') {
                    this.gameStatus.textContent = "🤝 It's a tie!";
                    this.gameStatus.className = 'game-status tie';
                } else {
                    const winnerName = this.getPlayerName(this.gameState.winner);
                    this.gameStatus.textContent = `🎉 ${winnerName} wins!`;
                    this.gameStatus.className = 'game-status winner';
                }
            } else {
                const currentPlayerName = this.getPlayerName(this.gameState.current_player);
                this.gameStatus.textContent = `${currentPlayerName}'s turn`;
                this.gameStatus.className = 'game-status';
            }
        }
    }
    
    getPlayerName(player) {
        if (this.currentGameMode === 'single_player') {
            return player === 'X' ? 'Player' : 'Computer';
        } else {
            return `Player ${player}`;
        }
    }
    
    showGameBoard() {
        console.log('Showing game board');
        if (this.settingsPanel) {
            this.settingsPanel.style.display = 'none';
        }
        if (this.gamePanel) {
            this.gamePanel.style.display = 'block';
        }
        this.toggleDifficultySettings();
    }
    
    showSettings() {
        console.log('Showing settings');
        if (this.settingsPanel) {
            this.settingsPanel.style.display = 'block';
        }
        if (this.gamePanel) {
            this.gamePanel.style.display = 'none';
        }
        this.gameId = null;
        this.gameState = null;
    }
    
    setLoading(loading) {
        console.log('Setting loading state:', loading);
        this.isLoading = loading;
        
        if (this.startGameBtn) {
            if (loading) {
                this.startGameBtn.disabled = true;
                this.startGameBtn.textContent = 'Starting...';
            } else {
                this.validateGameSettings(); // This will properly set the button state
                this.startGameBtn.textContent = 'Start New Game';
            }
        }
        
        if (this.gameBoard) {
            this.gameBoard.style.pointerEvents = loading ? 'none' : '';
        }
    }
    
    showError(message) {
        console.error('Showing error:', message);
        alert(message); // Simple error display for debugging
    }
    
    // Score management methods
    loadScores() {
        try {
            const savedScores = localStorage.getItem('ticTacToeScores');
            if (savedScores) {
                this.scores = { ...this.scores, ...JSON.parse(savedScores) };
            }
        } catch (error) {
            console.error('Error loading scores:', error);
        }
    }
    
    saveScores() {
        try {
            localStorage.setItem('ticTacToeScores', JSON.stringify(this.scores));
        } catch (error) {
            console.error('Error saving scores:', error);
        }
    }
    
    updateScoreDisplay() {
        if (this.scoreX) this.scoreX.textContent = this.scores.player_x;
        if (this.scoreO) this.scoreO.textContent = this.scores.player_o;
        if (this.scoreComputer) this.scoreComputer.textContent = this.scores.computer;
    }
    
    async updateScores() {
        if (!this.gameState.game_over) return;
        
        try {
            this.updateLocalScores();
            
            const response = await fetch('/api/update_score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    winner: this.gameState.winner,
                    game_mode: this.currentGameMode
                })
            });
            
            if (response.ok) {
                this.updateScoreDisplay();
            }
            
        } catch (error) {
            console.error('Error updating scores:', error);
        }
    }
    
    updateLocalScores() {
        const winner = this.gameState.winner;
        const gameMode = this.currentGameMode;
        
        if (!winner || winner === 'tie') return;
        
        if (gameMode === 'single_player') {
            if (winner === 'X') {
                this.scores.player_x++;
            } else if (winner === 'O') {
                this.scores.computer++;
            }
        } else {
            if (winner === 'X') {
                this.scores.player_x++;
            } else if (winner === 'O') {
                this.scores.player_o++;
            }
        }
        
        this.saveScores();
    }
    
    async resetScores() {
        if (!confirm('Are you sure you want to reset all scores?')) return;
        
        try {
            this.scores = { player_x: 0, player_o: 0, computer: 0 };
            this.saveScores();
            this.updateScoreDisplay();
            
            await fetch('/api/reset_scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
        } catch (error) {
            console.error('Error resetting scores:', error);
        }
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    try {
        new TicTacToeUI();
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});