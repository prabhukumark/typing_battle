class TypingTest {
    constructor() {
        this.originalText = '';
        this.startTime = null;
        this.endTime = null;
        this.isTestActive = false;
        this.timerInterval = null;
        this.currentParagraph = '';
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.typingInput = document.getElementById('typing-input');
        this.paragraphText = document.getElementById('paragraph-text');
        this.timerDisplay = document.getElementById('timer');
        this.wpmDisplay = document.getElementById('wpm-display');
        this.accuracyDisplay = document.getElementById('accuracy-display');
        this.resultsDiv = document.getElementById('results');
        this.finalWpm = document.getElementById('final-wpm');
        this.finalAccuracy = document.getElementById('final-accuracy');
        this.finalTime = document.getElementById('final-time');
        this.finalErrors = document.getElementById('final-errors');
        this.newTestBtn = document.getElementById('new-test-btn');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startTest());
        this.resetBtn.addEventListener('click', () => this.resetTest());
        this.typingInput.addEventListener('input', () => this.handleTyping());
        this.typingInput.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.newTestBtn.addEventListener('click', () => this.startNewTest());
    }

    async startTest() {
        try {
            const response = await fetch('/get_paragraph');
            const data = await response.json();
            
            this.currentParagraph = data.paragraph;
            this.paragraphText.textContent = this.currentParagraph;
            
            this.startBtn.disabled = true;
            this.resetBtn.disabled = false;
            this.typingInput.disabled = false;
            this.typingInput.value = '';
            this.typingInput.focus();
            
            this.isTestActive = true;
            this.startTime = Date.now();
            this.startTimer();
            
            this.hideResults();
        } catch (error) {
            console.error('Error starting test:', error);
            alert('Error starting test. Please try again.');
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.isTestActive) {
                const elapsed = Date.now() - this.startTime;
                this.updateTimer(elapsed);
                this.updateRealTimeStats(elapsed);
            }
        }, 100);
    }

    updateTimer(elapsed) {
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        this.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateRealTimeStats(elapsed) {
        const typedText = this.typingInput.value;
        const timeInMinutes = elapsed / 60000; // Convert to minutes
        
        // Calculate real-time WPM
        const wordsTyped = typedText.length / 5; // Assuming average word length of 5 characters
        const wpm = timeInMinutes > 0 ? wordsTyped / timeInMinutes : 0;
        this.wpmDisplay.textContent = Math.round(wpm);
        
        // Calculate real-time accuracy
        const accuracy = this.calculateAccuracy(typedText);
        this.accuracyDisplay.textContent = `${Math.round(accuracy)}%`;
    }

    calculateAccuracy(typedText) {
        if (!this.currentParagraph || typedText.length === 0) return 0;
        
        const totalChars = this.currentParagraph.length;
        const correctChars = Array.from(typedText).reduce((count, char, index) => {
            return count + (index < totalChars && char === this.currentParagraph[index] ? 1 : 0);
        }, 0);
        
        return (correctChars / totalChars) * 100;
    }

    handleTyping() {
        if (!this.isTestActive) return;
        
        const typedText = this.typingInput.value;
        
        // Check if test is complete
        if (typedText.length >= this.currentParagraph.length) {
            this.completeTest();
        }
    }

    handleKeydown(e) {
        if (!this.isTestActive) return;
        
        // Prevent backspace and delete when test is complete
        if (this.typingInput.value.length >= this.currentParagraph.length) {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
            }
        }
    }

    async completeTest() {
        this.isTestActive = false;
        this.endTime = Date.now();
        clearInterval(this.timerInterval);
        
        const timeTaken = (this.endTime - this.startTime) / 1000; // in seconds
        const typedText = this.typingInput.value;
        
        try {
            const response = await fetch('/calculate_results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    original_text: this.currentParagraph,
                    typed_text: typedText,
                    time_taken: timeTaken
                })
            });
            
            const results = await response.json();
            this.displayResults(results);
        } catch (error) {
            console.error('Error calculating results:', error);
            alert('Error calculating results. Please try again.');
        }
    }

    displayResults(results) {
        this.finalWpm.textContent = results.wpm;
        this.finalAccuracy.textContent = `${results.accuracy}%`;
        this.finalTime.textContent = `${results.time_taken}s`;
        this.finalErrors.textContent = results.errors;
        
        this.resultsDiv.classList.remove('hidden');
        this.typingInput.disabled = true;
        this.startBtn.disabled = true;
        this.resetBtn.disabled = true;
        
        // Scroll to results
        this.resultsDiv.scrollIntoView({ behavior: 'smooth' });
    }

    resetTest() {
        this.isTestActive = false;
        clearInterval(this.timerInterval);
        
        this.startBtn.disabled = false;
        this.resetBtn.disabled = true;
        this.typingInput.disabled = true;
        this.typingInput.value = '';
        
        this.timerDisplay.textContent = '00:00';
        this.wpmDisplay.textContent = '0';
        this.accuracyDisplay.textContent = '0%';
        
        this.paragraphText.textContent = 'Click "Start Test" to begin your typing test...';
        this.hideResults();
    }

    startNewTest() {
        this.hideResults();
        this.resetTest();
        this.startTest();
    }

    hideResults() {
        this.resultsDiv.classList.add('hidden');
    }
}

class BattleMode {
    constructor() {
        this.playerId = this.generatePlayerId();
        this.currentTeam = null;
        this.isAdmin = false;
        this.battleActive = false;
        this.battleStartTime = null;
        this.battleTimer = null;
        this.currentBattleParagraph = '';
        this.adminNotified = false;
        this.countdownInterval = null;
        this.countdownStarted = false;
        
        this.initializeElements();
        this.bindEvents();
        this.startStatusPolling();
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    initializeElements() {
        // Mode selection
        this.singlePlayerBtn = document.getElementById('single-player-btn');
        this.battleModeBtn = document.getElementById('battle-mode-btn');
        this.singlePlayerMode = document.getElementById('single-player-mode');
        this.battleMode = document.getElementById('battle-mode');
        
        // Team setup
        this.teamSetup = document.getElementById('team-setup');
        this.createTeamBtn = document.getElementById('create-team-btn');
        this.joinTeamBtn = document.getElementById('join-team-btn');
        this.teamCodeInput = document.getElementById('team-code-input');
        
        // Team lobby
        this.teamLobby = document.getElementById('team-lobby');
        this.displayTeamCode = document.getElementById('display-team-code');
        this.playerCount = document.getElementById('player-count');
        this.startBattleBtn = document.getElementById('start-battle-btn');
        this.leaveTeamBtn = document.getElementById('leave-team-btn');
        this.copyCodeBtn = document.getElementById('copy-code-btn');
        this.waitingMessage = document.getElementById('waiting-message');
        
        // Battle interface
        this.battleInterface = document.getElementById('battle-interface');
        this.battleTeamCode = document.getElementById('battle-team-code');
        this.battleStatus = document.getElementById('battle-status');
        this.countdown = document.getElementById('countdown');
        this.countdownNumber = document.getElementById('countdown-number');
        this.battleParagraph = document.getElementById('battle-paragraph');
        this.battleTypingInput = document.getElementById('battle-typing-input');
        
        // Battle results
        this.battleResults = document.getElementById('battle-results');
        this.player1Wpm = document.getElementById('player1-wpm');
        this.player1Accuracy = document.getElementById('player1-accuracy');
        this.player2Wpm = document.getElementById('player2-wpm');
        this.player2Accuracy = document.getElementById('player2-accuracy');
        this.winnerName = document.getElementById('winner-name');
        this.winnerScore = document.getElementById('winner-score');
        this.newBattleBtn = document.getElementById('new-battle-btn');
        this.backToLobbyBtn = document.getElementById('back-to-lobby-btn');
    }

    bindEvents() {
        // Mode selection
        this.singlePlayerBtn.addEventListener('click', () => this.switchMode('single'));
        this.battleModeBtn.addEventListener('click', () => this.switchMode('battle'));
        
        // Team setup
        this.createTeamBtn.addEventListener('click', () => this.createTeam());
        this.joinTeamBtn.addEventListener('click', () => this.joinTeam());
        this.teamCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinTeam();
        });
        
        // Team lobby
        this.startBattleBtn.addEventListener('click', () => {
            console.log('Start Battle button clicked!');
            console.log('Button disabled state:', this.startBattleBtn.disabled);
            console.log('isAdmin:', this.isAdmin);
            console.log('currentTeam:', this.currentTeam);
            this.startBattle();
        });
        this.leaveTeamBtn.addEventListener('click', () => this.leaveTeam());
        this.copyCodeBtn.addEventListener('click', () => this.copyTeamCode());
        
        // Battle interface
        this.battleTypingInput.addEventListener('input', () => this.handleBattleTyping());
        this.battleTypingInput.addEventListener('keydown', (e) => this.handleBattleKeydown(e));
        
        // Battle results
        this.newBattleBtn.addEventListener('click', () => this.startNewBattle());
        this.backToLobbyBtn.addEventListener('click', () => this.backToLobby());
    }

    switchMode(mode) {
        if (mode === 'single') {
            this.singlePlayerBtn.classList.add('active');
            this.battleModeBtn.classList.remove('active');
            this.singlePlayerMode.classList.remove('hidden');
            this.battleMode.classList.add('hidden');
        } else {
            this.battleModeBtn.classList.add('active');
            this.singlePlayerBtn.classList.remove('active');
            this.battleMode.classList.remove('hidden');
            this.singlePlayerMode.classList.add('hidden');
        }
    }

    async createTeam() {
        try {
            const response = await fetch('/create_team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_id: this.playerId
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'created') {
                this.currentTeam = data.team_code;
                this.isAdmin = true;
                console.log('Team created, isAdmin set to:', this.isAdmin);
                this.showTeamLobby();
                this.displayTeamCode.textContent = data.team_code;
                this.playerCount.textContent = '1/2';
                this.startBattleBtn.disabled = true;
                console.log('Start Battle button disabled:', this.startBattleBtn.disabled);
                
                // Show success message
                alert(`Team created! Share this code with your friend: ${data.team_code}`);
            }
        } catch (error) {
            console.error('Error creating team:', error);
            alert('Error creating team. Please try again.');
        }
    }

    async joinTeam() {
        const teamCode = this.teamCodeInput.value.trim().toUpperCase();
        
        if (!teamCode) {
            alert('Please enter a team code');
            return;
        }
        
        try {
            const response = await fetch('/join_team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    team_code: teamCode,
                    player_id: this.playerId
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'joined') {
                this.currentTeam = teamCode;
                this.isAdmin = data.is_admin;
                this.showTeamLobby();
                this.displayTeamCode.textContent = teamCode;
                this.playerCount.textContent = `${data.player_count}/2`;
                this.startBattleBtn.disabled = !this.isAdmin || data.player_count < 2;
                console.log('Button state updated - isAdmin:', this.isAdmin, 'playerCount:', data.player_count, 'disabled:', this.startBattleBtn.disabled);
                
                if (data.player_count === 2) {
                    this.waitingMessage.textContent = 'Both players joined! Admin can start the battle.';
                    // Force immediate status update for both players
                    setTimeout(() => this.pollTeamStatus(), 500);
                } else {
                    this.waitingMessage.textContent = 'Waiting for another player to join...';
                }
                
                alert(`Successfully joined team ${teamCode}!`);
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error joining team:', error);
            alert('Error joining team. Please try again.');
        }
    }

    showTeamLobby() {
        this.teamSetup.classList.add('hidden');
        this.teamLobby.classList.remove('hidden');
        this.battleInterface.classList.add('hidden');
        this.battleResults.classList.add('hidden');
    }

    async startBattle() {
        console.log('startBattle called, isAdmin:', this.isAdmin, 'currentTeam:', this.currentTeam);
        if (!this.isAdmin) {
            console.log('Not admin, cannot start battle');
            return;
        }
        
        try {
            console.log('Sending start_competition request...');
            const response = await fetch('/start_competition', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    team_code: this.currentTeam,
                    player_id: this.playerId
                })
            });
            
            const data = await response.json();
            console.log('Response from start_competition:', data);
            
            if (data.status === 'countdown_started') {
                this.currentBattleParagraph = data.paragraph;
                console.log('Starting countdown with paragraph:', this.currentBattleParagraph);
                this.showBattleInterface();
                this.startCountdown();
            } else {
                console.log('Failed to start competition:', data.message);
                alert(data.message);
            }
        } catch (error) {
            console.error('Error starting battle:', error);
            alert('Error starting battle. Please try again.');
        }
    }

    showBattleInterface() {
        this.teamLobby.classList.add('hidden');
        this.battleInterface.classList.remove('hidden');
        this.battleTeamCode.textContent = this.currentTeam;
        this.battleStatus.textContent = 'Countdown...';
        this.battleParagraph.textContent = this.currentBattleParagraph;
    }

    startCountdown() {
        // Prevent multiple countdowns
        if (this.countdownInterval) {
            console.log('Countdown already in progress, ignoring duplicate call');
            return;
        }
        
        let countdown = 5;
        this.countdown.classList.remove('hidden');
        this.countdownNumber.textContent = countdown;
        
        console.log('Starting countdown for admin player:', this.playerId);
        
        this.countdownInterval = setInterval(() => {
            countdown--;
            this.countdownNumber.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
                this.countdown.classList.add('hidden');
                
                // Notify backend that countdown is finished
                if (this.isAdmin) {
                    this.notifyCountdownFinished();
                }
                
                // Small delay to ensure smooth transition
                setTimeout(() => {
                    this.beginBattle();
                }, 100);
            }
        }, 1000);
    }
    
    async notifyCountdownFinished() {
        try {
            await fetch('/start_battle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    team_code: this.currentTeam,
                    player_id: this.playerId
                })
            });
        } catch (error) {
            console.error('Error notifying countdown finished:', error);
        }
    }

    beginBattle() {
        this.battleStatus.textContent = 'Battle Active!';
        this.battleTypingInput.disabled = false;
        this.battleTypingInput.focus();
        this.battleActive = true;
        this.battleStartTime = Date.now();
        
        // Add anti-copying measures
        this.addAntiCopyingMeasures();
        
        // Show notification for non-admin players
        if (!this.isAdmin) {
            this.showNotification('⚔️ Battle started! Start typing now!', 'success');
        }
        
        console.log('Battle started for player:', this.playerId, 'isAdmin:', this.isAdmin);
    }
    
    addAntiCopyingMeasures() {
        // Add battle-active class for visual effects
        this.battleParagraph.classList.add('battle-active');
        
        // Disable text selection on battle paragraph
        this.battleParagraph.style.userSelect = 'none';
        this.battleParagraph.style.webkitUserSelect = 'none';
        this.battleParagraph.style.mozUserSelect = 'none';
        this.battleParagraph.style.msUserSelect = 'none';
        
        // Disable right-click context menu
        this.battleParagraph.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Disable keyboard shortcuts for copy
        document.addEventListener('keydown', (e) => {
            if (this.battleActive) {
                // Prevent Ctrl+C, Ctrl+A, Ctrl+X
                if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'a' || e.key === 'x')) {
                    e.preventDefault();
                    this.showNotification('⚠️ Copying is not allowed during battle!', 'error');
                }
            }
        });
        
        // Disable drag and drop
        this.battleParagraph.addEventListener('dragstart', (e) => e.preventDefault());
        
        // Add visual indicator that text cannot be copied
        this.battleParagraph.style.cursor = 'not-allowed';
        this.battleParagraph.title = 'Text cannot be copied during battle';
    }
    
    removeAntiCopyingMeasures() {
        // Re-enable text selection
        this.battleParagraph.style.userSelect = 'auto';
        this.battleParagraph.style.webkitUserSelect = 'auto';
        this.battleParagraph.style.mozUserSelect = 'auto';
        this.battleParagraph.style.msUserSelect = 'auto';
        
        // Re-enable cursor
        this.battleParagraph.style.cursor = 'default';
        this.battleParagraph.title = '';
        
        // Remove the no-copying label
        this.battleParagraph.classList.remove('battle-active');
    }
    
    showCountdownInterface() {
        // Show countdown for non-admin players (read-only)
        this.countdown.classList.remove('hidden');
        this.countdownNumber.textContent = '5';
        this.countdownNumber.style.color = '#dc3545';
        this.countdownNumber.style.fontWeight = 'bold';
        
        // Remove existing note if any
        const existingNote = this.countdown.querySelector('.countdown-note');
        if (existingNote) {
            existingNote.remove();
        }
        
        // Add a note that admin controls the countdown
        const countdownNote = document.createElement('div');
        countdownNote.className = 'countdown-note';
        countdownNote.textContent = '⏰ Admin is starting the battle...';
        countdownNote.style.textAlign = 'center';
        countdownNote.style.color = '#6c757d';
        countdownNote.style.marginTop = '1rem';
        countdownNote.style.fontSize = '0.9rem';
        
        this.countdown.appendChild(countdownNote);
    }

    handleBattleTyping() {
        if (!this.battleActive) return;
        
        const typedText = this.battleTypingInput.value;
        
        // Check if battle is complete
        if (typedText.length >= this.currentBattleParagraph.length) {
            this.completeBattle();
        }
    }

    handleBattleKeydown(e) {
        if (!this.battleActive) return;
        
        // Prevent backspace and delete when battle is complete
        if (this.battleTypingInput.value.length >= this.currentBattleParagraph.length) {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
            }
        }
    }

    async completeBattle() {
        this.battleActive = false;
        
        // Remove anti-copying measures
        this.removeAntiCopyingMeasures();
        
        const timeTaken = (Date.now() - this.battleStartTime) / 1000;
        const typedText = this.battleTypingInput.value;
        
        // Calculate results
        const totalChars = this.currentBattleParagraph.length;
        const correctChars = Array.from(typedText).reduce((count, char, index) => {
            return count + (index < totalChars && char === this.currentBattleParagraph[index] ? 1 : 0);
        }, 0);
        
        const accuracy = (correctChars / totalChars) * 100;
        const wordsTyped = typedText.length / 5;
        const timeInMinutes = timeTaken / 60;
        const wpm = timeInMinutes > 0 ? wordsTyped / timeInMinutes : 0;
        
        // Submit results
        try {
            const response = await fetch('/submit_competition_result', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    team_code: this.currentTeam,
                    player_id: this.playerId,
                    wpm: wpm,
                    accuracy: accuracy,
                    time_taken: timeTaken
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'competition_finished') {
                this.showBattleResults(data);
            } else {
                this.battleStatus.textContent = `Waiting for other player... (${data.waiting_for} remaining)`;
            }
        } catch (error) {
            console.error('Error submitting battle results:', error);
            alert('Error submitting results. Please try again.');
        }
    }

    showBattleResults(data) {
        this.battleResults.classList.remove('hidden');
        this.battleTypingInput.disabled = true;
        
        // Display results
        const players = Object.keys(data.results);
        const player1 = players[0];
        const player2 = players[1];
        
        this.player1Wpm.textContent = Math.round(data.results[player1].wpm);
        this.player1Accuracy.textContent = `${Math.round(data.results[player1].accuracy)}%`;
        this.player2Wpm.textContent = Math.round(data.results[player2].wpm);
        this.player2Accuracy.textContent = `${Math.round(data.results[player2].accuracy)}%`;
        
        // Show winner
        this.winnerName.textContent = data.winner === this.playerId ? 'You!' : 'Opponent';
        this.winnerScore.textContent = data.winner_score;
        
        this.battleStatus.textContent = 'Battle Finished!';
    }

    async startNewBattle() {
        if (this.isAdmin) {
            try {
                const response = await fetch('/reset_team', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        team_code: this.currentTeam,
                        player_id: this.playerId
                    })
                });
                
                const data = await response.json();
                
                if (data.status === 'team_reset') {
                    this.battleResults.classList.add('hidden');
                    this.battleInterface.classList.add('hidden');
                    this.showTeamLobby();
                    this.playerCount.textContent = '2/2';
                    this.startBattleBtn.disabled = false;
                    this.waitingMessage.textContent = 'Team reset! Ready for new battle.';
                    
                    // Reset battle state
                    this.resetBattleState();
                }
            } catch (error) {
                console.error('Error resetting team:', error);
                alert('Error resetting team. Please try again.');
            }
        } else {
            this.backToLobby();
        }
    }
    
    resetBattleState() {
        this.battleActive = false;
        this.battleStartTime = null;
        this.currentBattleParagraph = '';
        this.battleTypingInput.value = '';
        this.battleTypingInput.disabled = true;
        
        // Remove anti-copying measures
        this.removeAntiCopyingMeasures();
        
        // Reset countdown
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        this.countdown.classList.add('hidden');
        
        // Reset countdown state
        this.countdownStarted = false;
        
        // Remove countdown note if exists
        const countdownNote = this.countdown.querySelector('.countdown-note');
        if (countdownNote) {
            countdownNote.remove();
        }
    }

    backToLobby() {
        this.battleResults.classList.add('hidden');
        this.battleInterface.classList.add('hidden');
        this.showTeamLobby();
    }

    leaveTeam() {
        this.currentTeam = null;
        this.isAdmin = false;
        this.battleActive = false;
        
        this.teamLobby.classList.add('hidden');
        this.battleInterface.classList.add('hidden');
        this.battleResults.classList.add('hidden');
        this.teamSetup.classList.remove('hidden');
        
        this.teamCodeInput.value = '';
        this.battleTypingInput.value = '';
    }

    copyTeamCode() {
        navigator.clipboard.writeText(this.currentTeam).then(() => {
            this.copyCodeBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.copyCodeBtn.textContent = 'Copy';
            }, 2000);
        });
    }

    startStatusPolling() {
        // Poll team status every 1 second for better synchronization
        setInterval(() => {
            if (this.currentTeam && !this.battleActive) {
                this.pollTeamStatus();
            }
        }, 1000);
        
        // Also poll more frequently when waiting for battle to start
        setInterval(() => {
            if (this.currentTeam && !this.battleActive && this.isAdmin === false) {
                // Non-admin players poll more frequently to catch battle start
                this.pollTeamStatus();
            }
        }, 500);
    }

    async pollTeamStatus() {
        try {
            const response = await fetch('/get_team_status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    team_code: this.currentTeam,
                    player_id: this.playerId
                })
            });
            
            const data = await response.json();
            
            if (data.status !== 'error') {
                this.playerCount.textContent = `${data.players.length}/2`;
                const shouldBeDisabled = !this.isAdmin || data.players.length < 2;
                this.startBattleBtn.disabled = shouldBeDisabled;
                
                // Add visual feedback for button state
                if (this.isAdmin && data.players.length === 2) {
                    this.startBattleBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                    this.startBattleBtn.style.transform = 'scale(1.05)';
                    
                    // Show notification for admin
                    if (!this.adminNotified) {
                        this.adminNotified = true;
                        this.showNotification('🎉 Both players joined! You can now start the battle!', 'success');
                    }
                } else {
                    this.startBattleBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    this.startBattleBtn.style.transform = 'scale(1)';
                    this.adminNotified = false;
                }
                
                console.log('Status poll - players:', data.players.length, 'isAdmin:', this.isAdmin, 'button disabled:', shouldBeDisabled, 'status:', data.status);
                
                // Check if battle has started (for non-admin players)
                if (data.status === 'countdown' || data.status === 'active') {
                    console.log('Battle status detected:', data.status, 'for player:', this.playerId, 'countdownStarted:', this.countdownStarted);
                    if (data.status === 'countdown') {
                        // Only show countdown interface, don't start countdown for non-admin
                        if (!this.countdownStarted) {
                            console.log('Showing countdown interface for non-admin player');
                            this.currentBattleParagraph = data.paragraph;
                            this.showBattleInterface();
                            this.showCountdownInterface();
                            this.countdownStarted = true;
                        } else {
                            console.log('Countdown interface already shown for non-admin player');
                        }
                    } else if (data.status === 'active') {
                        console.log('Starting battle for non-admin player');
                        this.currentBattleParagraph = data.paragraph;
                        this.showBattleInterface();
                        
                        // Hide countdown and show battle started
                        this.countdown.classList.add('hidden');
                        this.countdownStarted = false;
                        
                        // Small delay to ensure smooth transition
                        setTimeout(() => {
                            this.beginBattle();
                        }, 100);
                    }
                }
                
                if (data.players.length === 2) {
                    this.waitingMessage.textContent = 'Both players joined! Admin can start the battle.';
                    console.log('Both players joined, button should be enabled for admin');
                    
                    // Notify admin if this is the admin player
                    if (this.isAdmin) {
                        this.startBattleBtn.disabled = false;
                        // Show a more prominent notification
                        this.waitingMessage.style.color = '#28a745';
                        this.waitingMessage.style.fontWeight = 'bold';
                        this.waitingMessage.innerHTML = '🎉 Both players joined! <strong>Click "Start Battle" to begin!</strong>';
                    }
                } else {
                    this.waitingMessage.textContent = 'Waiting for another player to join...';
                    this.waitingMessage.style.color = '#6c757d';
                    this.waitingMessage.style.fontWeight = 'normal';
                }
            }
        } catch (error) {
            console.error('Error polling team status:', error);
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Set background color based on type
        if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        } else if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
        } else {
            notification.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Initialize both modes when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TypingTest();
    new BattleMode();
});

// Add some visual feedback for typing
document.addEventListener('DOMContentLoaded', () => {
    const typingInput = document.getElementById('typing-input');
    const paragraphText = document.getElementById('paragraph-text');
    
    typingInput.addEventListener('input', () => {
        const typedText = typingInput.value;
        const originalText = paragraphText.textContent;
        
        if (typedText.length > 0 && originalText !== 'Click "Start Test" to begin your typing test...') {
            // Highlight current character position
            let highlightedText = '';
            for (let i = 0; i < originalText.length; i++) {
                if (i < typedText.length) {
                    if (typedText[i] === originalText[i]) {
                        highlightedText += `<span class="correct-char">${originalText[i]}</span>`;
                    } else {
                        highlightedText += `<span class="error-char">${originalText[i]}</span>`;
                    }
                } else if (i === typedText.length) {
                    highlightedText += `<span class="current-char">${originalText[i]}</span>`;
                } else {
                    highlightedText += originalText[i];
                }
            }
            
            paragraphText.innerHTML = highlightedText;
        }
    });
});
