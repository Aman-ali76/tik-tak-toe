class TicTacToeGame:
    def __init__(self, grid_size=3):
        self.grid_size = grid_size
        self.board = [['' for _ in range(grid_size)] for _ in range(grid_size)]
        self.current_player = 'X'
        self.game_over = False
        self.winner = None
        self.winning_line = None
        
    def make_move(self, row, col):
        """Make a move on the board"""
        if (self.game_over or 
            row < 0 or row >= self.grid_size or 
            col < 0 or col >= self.grid_size or 
            self.board[row][col] != ''):
            return False
        
        self.board[row][col] = self.current_player
        
        if self.check_winner():
            self.game_over = True
            self.winner = self.current_player
        elif self.is_board_full():
            self.game_over = True
            self.winner = 'tie'
        else:
            self.current_player = 'O' if self.current_player == 'X' else 'X'
        
        return True
    
    def check_winner(self):
        """Check if there's a winner and set winning_line coordinates"""
        # Check rows
        for i in range(self.grid_size):
            if (self.board[i][0] != '' and 
                all(self.board[i][j] == self.board[i][0] for j in range(self.grid_size))):
                self.winning_line = [(i, j) for j in range(self.grid_size)]
                return True
        
        # Check columns
        for j in range(self.grid_size):
            if (self.board[0][j] != '' and 
                all(self.board[i][j] == self.board[0][j] for i in range(self.grid_size))):
                self.winning_line = [(i, j) for i in range(self.grid_size)]
                return True
        
        # Check main diagonal
        if (self.board[0][0] != '' and 
            all(self.board[i][i] == self.board[0][0] for i in range(self.grid_size))):
            self.winning_line = [(i, i) for i in range(self.grid_size)]
            return True
        
        # Check anti-diagonal
        if (self.board[0][self.grid_size-1] != '' and 
            all(self.board[i][self.grid_size-1-i] == self.board[0][self.grid_size-1] 
                for i in range(self.grid_size))):
            self.winning_line = [(i, self.grid_size-1-i) for i in range(self.grid_size)]
            return True
        
        return False
    
    def is_board_full(self):
        """Check if the board is full"""
        return all(self.board[i][j] != '' 
                  for i in range(self.grid_size) 
                  for j in range(self.grid_size))
    
    def get_empty_cells(self):
        """Get list of empty cells"""
        empty_cells = []
        for i in range(self.grid_size):
            for j in range(self.grid_size):
                if self.board[i][j] == '':
                    empty_cells.append((i, j))
        return empty_cells
    
    def copy(self):
        """Create a copy of the game state"""
        new_game = TicTacToeGame(self.grid_size)
        new_game.board = [row[:] for row in self.board]
        new_game.current_player = self.current_player
        new_game.game_over = self.game_over
        new_game.winner = self.winner
        new_game.winning_line = self.winning_line[:] if self.winning_line else None
        return new_game
