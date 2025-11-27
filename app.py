from flask import Flask, render_template, request, jsonify, session
import uuid
from game import TicTacToeGame
from ai import AIOpponent

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'

# Store active games
games = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/new_game', methods=['POST'])
def new_game():
    data = request.json
    grid_size = data.get('grid_size', 3)
    game_mode = data.get('game_mode', 'two_player')
    difficulty = data.get('difficulty', 'medium')
    
    # Validate AI mode for large grids
    if game_mode == 'single_player' and grid_size > 3:
        return jsonify({
            'error': 'Computer opponent is only available for 3x3 grids due to performance limitations'
        }), 400
    
    # Generate unique game ID
    game_id = str(uuid.uuid4())
    
    # Create new game instance
    game = TicTacToeGame(grid_size)
    games[game_id] = {
        'game': game,
        'mode': game_mode,
        'difficulty': difficulty,
        'ai': AIOpponent(difficulty) if game_mode == 'single_player' else None
    }
    
    session['game_id'] = game_id
    
    return jsonify({
        'game_id': game_id,
        'board': game.board,
        'current_player': game.current_player,
        'game_over': game.game_over,
        'winner': game.winner,
        'grid_size': grid_size,
        'game_mode': game_mode  # Add this missing field
    })

@app.route('/api/make_move', methods=['POST'])
def make_move():
    data = request.json
    game_id = session.get('game_id')
    
    if not game_id or game_id not in games:
        return jsonify({'error': 'Game not found'}), 404
    
    game_data = games[game_id]
    game = game_data['game']
    
    row = data.get('row')
    col = data.get('col')
    
    # Make player move
    if not game.make_move(row, col):
        return jsonify({'error': 'Invalid move'}), 400
    
    response_data = {
        'board': game.board,
        'current_player': game.current_player,
        'game_over': game.game_over,
        'winner': game.winner,
        'winning_line': game.winning_line
    }
    
    # If single player mode and game not over, make AI move
    if (game_data['mode'] == 'single_player' and 
        not game.game_over and 
        game_data['ai']):
        
        ai_move = game_data['ai'].get_move(game)
        if ai_move:
            game.make_move(ai_move[0], ai_move[1])
            response_data.update({
                'board': game.board,
                'current_player': game.current_player,
                'game_over': game.game_over,
                'winner': game.winner,
                'winning_line': game.winning_line,
                'ai_move': ai_move
            })
    
    return jsonify(response_data)

@app.route('/api/game_state')
def game_state():
    game_id = session.get('game_id')
    
    if not game_id or game_id not in games:
        return jsonify({'error': 'Game not found'}), 404
    
    game = games[game_id]['game']
    
    return jsonify({
        'board': game.board,
        'current_player': game.current_player,
        'game_over': game.game_over,
        'winner': game.winner,
        'winning_line': game.winning_line
    })

@app.route('/api/update_score', methods=['POST'])
def update_score():
    """Update player scores in session"""
    data = request.json
    winner = data.get('winner')
    game_mode = data.get('game_mode')
    
    if not winner or winner == 'tie':
        return jsonify({'success': True})
    
    # Initialize scores if not present
    if 'scores' not in session:
        session['scores'] = {
            'player_x': 0,
            'player_o': 0,
            'computer': 0
        }
    
    # Update scores based on game mode and winner
    if game_mode == 'single_player':
        if winner == 'X':
            session['scores']['player_x'] += 1
        elif winner == 'O':
            session['scores']['computer'] += 1
    else:  # two_player mode
        if winner == 'X':
            session['scores']['player_x'] += 1
        elif winner == 'O':
            session['scores']['player_o'] += 1
    
    session.modified = True
    
    return jsonify({
        'success': True,
        'scores': session['scores']
    })

@app.route('/api/get_scores')
def get_scores():
    """Get current scores from session"""
    scores = session.get('scores', {
        'player_x': 0,
        'player_o': 0,
        'computer': 0
    })
    
    return jsonify({'scores': scores})

@app.route('/api/reset_scores', methods=['POST'])
def reset_scores():
    """Reset all scores"""
    session['scores'] = {
        'player_x': 0,
        'player_o': 0,
        'computer': 0
    }
    session.modified = True
    
    return jsonify({
        'success': True,
        'scores': session['scores']
    })

if __name__ == '__main__':
    app.run(debug=True)