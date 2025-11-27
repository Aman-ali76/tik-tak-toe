import random
import math

class AIOpponent:
    def __init__(self, difficulty='medium'):
        self.difficulty = difficulty
        self.player = 'O'  # AI is always O
        self.opponent = 'X'  # Human is always X
    
    def get_move(self, game):
        """Get AI move based on difficulty level"""
        empty_cells = game.get_empty_cells()
        
        if not empty_cells:
            return None
        
        if self.difficulty == 'easy':
            return self._easy_move(empty_cells)
        elif self.difficulty == 'medium':
            return self._medium_move(game, empty_cells)
        else:  # hard
            return self._hard_move(game, empty_cells)
    
    def _easy_move(self, empty_cells):
        """Easy: Random move"""
        return random.choice(empty_cells)
    
    def _medium_move(self, game, empty_cells):
        """Medium: Block opponent wins, try to win, otherwise random"""
        # Try to win
        for row, col in empty_cells:
            test_game = game.copy()
            test_game.board[row][col] = self.player
            if test_game.check_winner():
                return (row, col)
        
        # Block opponent from winning
        for row, col in empty_cells:
            test_game = game.copy()
            test_game.board[row][col] = self.opponent
            if test_game.check_winner():
                return (row, col)
        
        # Random move
        return random.choice(empty_cells)
    
    def _hard_move(self, game, empty_cells):
        """Hard: Minimax algorithm"""
        if len(empty_cells) == game.grid_size * game.grid_size:
            # First move: choose corner or center
            center = game.grid_size // 2
            if game.grid_size % 2 == 1:
                return (center, center)
            else:
                return (0, 0)
        
        best_score = -math.inf
        best_move = empty_cells[0]
        
        for row, col in empty_cells:
            test_game = game.copy()
            test_game.board[row][col] = self.player
            test_game.current_player = self.opponent
            
            score = self._minimax(test_game, 0, False, -math.inf, math.inf)
            
            if score > best_score:
                best_score = score
                best_move = (row, col)
        
        return best_move
    
    def _minimax(self, game, depth, is_maximizing, alpha, beta):
        """Minimax algorithm with alpha-beta pruning"""
        # Check terminal states
        if game.check_winner():
            if game.current_player == self.opponent:  # AI won (previous move)
                return 10 - depth
            else:  # Opponent won (previous move)
                return depth - 10
        
        if game.is_board_full():
            return 0
        
        # Limit depth for larger grids
        if depth > 6:
            return 0
        
        empty_cells = game.get_empty_cells()
        
        if is_maximizing:
            max_score = -math.inf
            for row, col in empty_cells:
                test_game = game.copy()
                test_game.board[row][col] = self.player
                test_game.current_player = self.opponent
                
                score = self._minimax(test_game, depth + 1, False, alpha, beta)
                max_score = max(max_score, score)
                alpha = max(alpha, score)
                
                if beta <= alpha:
                    break
            
            return max_score
        else:
            min_score = math.inf
            for row, col in empty_cells:
                test_game = game.copy()
                test_game.board[row][col] = self.opponent
                test_game.current_player = self.player
                
                score = self._minimax(test_game, depth + 1, True, alpha, beta)
                min_score = min(min_score, score)
                beta = min(beta, score)
                
                if beta <= alpha:
                    break
            
            return min_score
