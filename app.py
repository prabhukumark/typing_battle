from flask import Flask, render_template, request, jsonify, session
import random
import time
import uuid
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # For session management

# Sample paragraphs for typing tests
PARAGRAPHS = [
    "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once. Pangrams are often used to display font samples and test keyboards.",
    "Programming is the art of telling another human being what one wants the computer to do. It requires logical thinking, problem-solving skills, and attention to detail.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. Every great achievement begins with the decision to try and the determination to succeed.",
    "The Internet is not just one thing, it is a collection of things – of numerous communications networks that all speak the same digital language. It connects people across the globe.",
    "Education is the most powerful weapon which you can use to change the world. Knowledge empowers individuals and communities to create positive change in society.",
    "Technology is best when it brings people together. It should enhance human connection rather than replace it, making our lives more efficient and meaningful.",
    "Creativity is intelligence having fun. The ability to think outside the box and come up with innovative solutions is what drives progress in every field.",
    "Leadership is not about being in charge. It is about taking care of those in your charge. True leaders inspire and empower others to achieve their full potential.",
    "The future belongs to those who believe in the beauty of their dreams. Vision and determination are the keys to turning aspirations into reality.",
    "Learning is a treasure that will follow its owner everywhere. Continuous education and skill development are essential for personal and professional growth."
]

# Store active teams and competitions
active_teams = {}
active_competitions = {}

@app.route('/')
def index():
    """Main page with typing test"""
    return render_template('index.html')

@app.route('/get_paragraph')
def get_paragraph():
    """Return a random paragraph for typing test"""
    paragraph = random.choice(PARAGRAPHS)
    return jsonify({'paragraph': paragraph})

@app.route('/calculate_results', methods=['POST'])
def calculate_results():
    """Calculate typing speed and accuracy"""
    data = request.get_json()
    
    original_text = data.get('original_text', '')
    typed_text = data.get('typed_text', '')
    time_taken = data.get('time_taken', 0)  # in seconds
    
    # Calculate accuracy
    total_chars = len(original_text)
    correct_chars = sum(1 for i, char in enumerate(typed_text) 
                       if i < len(original_text) and char == original_text[i])
    
    # Handle case where typed text is longer than original
    if len(typed_text) > total_chars:
        correct_chars = sum(1 for i, char in enumerate(original_text) 
                           if i < len(typed_text) and char == typed_text[i])
    
    accuracy = (correct_chars / total_chars * 100) if total_chars > 0 else 0
    
    # Calculate WPM (assuming average word length of 5 characters)
    words_typed = len(typed_text) / 5
    time_in_minutes = time_taken / 60
    wpm = (words_typed / time_in_minutes) if time_in_minutes > 0 else 0
    
    # Calculate errors
    errors = max(0, total_chars - correct_chars)
    
    return jsonify({
        'wpm': round(wpm, 2),
        'accuracy': round(accuracy, 2),
        'errors': errors,
        'time_taken': round(time_taken, 2),
        'total_chars': total_chars,
        'correct_chars': correct_chars
    })

# New multiplayer competition routes
@app.route('/create_team', methods=['POST'])
def create_team():
    """Create a new team and return team code"""
    team_code = str(uuid.uuid4())[:8].upper()  # Generate 8-character team code
    
    # Create new team
    active_teams[team_code] = {
        'admin_id': request.json.get('player_id'),
        'players': [request.json.get('player_id')],
        'status': 'waiting',  # waiting, countdown, active, finished
        'created_at': datetime.now(),
        'paragraph': random.choice(PARAGRAPHS),
        'countdown': 5,
        'results': {}
    }
    
    return jsonify({
        'team_code': team_code,
        'status': 'created',
        'message': f'Team created! Share code: {team_code}'
    })

@app.route('/join_team', methods=['POST'])
def join_team():
    """Join an existing team using team code"""
    team_code = request.json.get('team_code', '').upper()
    player_id = request.json.get('player_id')
    
    if team_code not in active_teams:
        return jsonify({'status': 'error', 'message': 'Invalid team code'})
    
    team = active_teams[team_code]
    
    if len(team['players']) >= 2:
        return jsonify({'status': 'error', 'message': 'Team is full'})
    
    if player_id in team['players']:
        return jsonify({'status': 'error', 'message': 'Already in team'})
    
    # Add player to team
    team['players'].append(player_id)
    
    return jsonify({
        'status': 'joined',
        'team_code': team_code,
        'message': f'Joined team {team_code}!',
        'is_admin': team['admin_id'] == player_id,
        'player_count': len(team['players'])
    })

@app.route('/start_competition', methods=['POST'])
def start_competition():
    """Start the competition countdown"""
    team_code = request.json.get('team_code')
    player_id = request.json.get('player_id')
    
    if team_code not in active_teams:
        return jsonify({'status': 'error', 'message': 'Team not found'})
    
    team = active_teams[team_code]
    
    # Check if player is admin
    if team['admin_id'] != player_id:
        return jsonify({'status': 'error', 'message': 'Only admin can start competition'})
    
    # Check if team has 2 players
    if len(team['players']) < 2:
        return jsonify({'status': 'error', 'message': 'Need 2 players to start'})
    
    # Start countdown
    team['status'] = 'countdown'
    team['countdown'] = 5
    
    return jsonify({
        'status': 'countdown_started',
        'countdown': 5,
        'paragraph': team['paragraph']
    })

@app.route('/get_team_status', methods=['POST'])
def get_team_status():
    """Get current team status"""
    team_code = request.json.get('team_code')
    
    if team_code not in active_teams:
        return jsonify({'status': 'error', 'message': 'Team not found'})
    
    team = active_teams[team_code]
    
    return jsonify({
        'status': team['status'],
        'countdown': team.get('countdown', 0),
        'players': team['players'],
        'paragraph': team['paragraph'],
        'results': team.get('results', {})
    })

@app.route('/start_battle', methods=['POST'])
def start_battle():
    """Transition from countdown to active battle"""
    team_code = request.json.get('team_code')
    player_id = request.json.get('player_id')
    
    if team_code not in active_teams:
        return jsonify({'status': 'error', 'message': 'Team not found'})
    
    team = active_teams[team_code]
    
    # Check if player is admin
    if team['admin_id'] != player_id:
        return jsonify({'status': 'error', 'message': 'Only admin can start battle'})
    
    # Check if team is in countdown status
    if team['status'] != 'countdown':
        return jsonify({'status': 'error', 'message': 'Team not in countdown status'})
    
    # Start battle
    team['status'] = 'active'
    
    return jsonify({
        'status': 'battle_started',
        'message': 'Battle is now active'
    })

@app.route('/submit_competition_result', methods=['POST'])
def submit_competition_result():
    """Submit competition result for a player"""
    data = request.get_json()
    team_code = data.get('team_code')
    player_id = data.get('player_id')
    wpm = data.get('wpm', 0)
    accuracy = data.get('accuracy', 0)
    time_taken = data.get('time_taken', 0)
    
    if team_code not in active_teams:
        return jsonify({'status': 'error', 'message': 'Team not found'})
    
    team = active_teams[team_code]
    
    # Store player result
    team['results'][player_id] = {
        'wpm': wpm,
        'accuracy': accuracy,
        'time_taken': time_taken,
        'score': wpm * accuracy / 100  # Combined score
    }
    
    # Check if both players have submitted results
    if len(team['results']) == 2:
        team['status'] = 'finished'
        
        # Determine winner
        players = list(team['results'].keys())
        player1_score = team['results'][players[0]]['score']
        player2_score = team['results'][players[1]]['score']
        
        winner = players[0] if player1_score > player2_score else players[1]
        winner_score = max(player1_score, player2_score)
        loser_score = min(player1_score, player2_score)
        
        return jsonify({
            'status': 'competition_finished',
            'winner': winner,
            'winner_score': round(winner_score, 2),
            'loser_score': round(loser_score, 2),
            'results': team['results']
        })
    
    return jsonify({'status': 'result_submitted', 'waiting_for': 2 - len(team['results'])})

@app.route('/reset_team', methods=['POST'])
def reset_team():
    """Reset team for new competition"""
    team_code = request.json.get('team_code')
    player_id = request.json.get('player_id')
    
    if team_code not in active_teams:
        return jsonify({'status': 'error', 'message': 'Team not found'})
    
    team = active_teams[team_code]
    
    # Check if player is admin
    if team['admin_id'] != player_id:
        return jsonify({'status': 'error', 'message': 'Only admin can reset team'})
    
    # Reset team
    team['status'] = 'waiting'
    team['countdown'] = 5
    team['results'] = {}
    team['paragraph'] = random.choice(PARAGRAPHS)
    
    return jsonify({'status': 'team_reset', 'message': 'Team reset for new competition'})

if __name__ == '__main__':
    app.run(debug=True)
