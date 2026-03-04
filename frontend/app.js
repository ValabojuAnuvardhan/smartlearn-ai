const API = 'https://jxqpkh3ehrfyvg2n65j3yuvkpe0ucliw.lambda-url.us-east-1.on.aws';
let currentLevel = 'Beginner';
let score = 0;
let totalQuestions = 0;
let answeredQuestions = 0;
let currentQuiz = [];

function updateLevelBadge() {
    document.getElementById('levelLabel').textContent = 'Level: ' + currentLevel;
}

async function generate() {
    const topic = document.getElementById('topic').value.trim();
    const language = document.getElementById('language').value;
    
    if (!topic) {
        document.getElementById('topic').focus();
        return;
    }
    
    score = 0;
    answeredQuestions = 0;
    currentQuiz = [];
    document.getElementById('scoreNum').textContent = '0';
    document.getElementById('scoreDisplay').style.display = 'none';
    document.getElementById('explanationSection').style.display = 'block';
    document.getElementById('explanation').innerHTML = '<span class="loading">Generating lesson</span>';
    document.getElementById('summarySection').style.display = 'none';
    document.getElementById('resourcesSection').style.display = 'none';
    document.getElementById('quizSection').style.display = 'none';
    document.getElementById('progressSection').style.display = 'none';
    document.getElementById('quiz').innerHTML = '';
    
    try {
        const response = await fetch(API + '/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({topic: topic, language: language, level: currentLevel})
        });
        
        const data = await response.json();
        
        if (data.error) {
            document.getElementById('explanation').textContent = data.error;
            return;
        }
        
        document.getElementById('explanation').innerHTML = data.explanation;
        document.getElementById('summarySection').style.display = 'block';
        document.getElementById('summary').textContent = data.summary;
        
        currentQuiz = data.quiz;
        totalQuestions = currentQuiz.length;
        document.getElementById('quizSection').style.display = 'block';
        document.getElementById('quizButton').style.display = 'inline-flex';
        document.getElementById('scoreTotal').textContent = ' / ' + totalQuestions;
        
        document.getElementById('resourcesSection').style.display = 'block';
        document.getElementById('resources').innerHTML = 
            '<a class="resource-link" href="https://www.google.com/search?q=' + encodeURIComponent(topic) + '+diagram" target="_blank">' +
            '<span>🔎</span>View Images & Diagrams<span style="margin-left:auto;opacity:0.5">↗</span></a>' +
            '<a class="resource-link" href="https://www.youtube.com/results?search_query=' + encodeURIComponent(topic) + '+explained" target="_blank">' +
            '<span>📺</span>Watch YouTube<span style="margin-left:auto;opacity:0.5">↗</span></a>' +
            '<a class="resource-link" href="https://en.wikipedia.org/wiki/' + encodeURIComponent(topic) + '" target="_blank">' +
            '<span>📚</span>Read Wikipedia<span style="margin-left:auto;opacity:0.5">↗</span></a>';
    } catch (e) {
        document.getElementById('explanation').textContent = 'Could not connect to server. Make sure backend is running at http://127.0.0.1:8000';
    }
}

function startQuiz() {
    document.getElementById('quizButton').style.display = 'none';
    document.getElementById('scoreDisplay').style.display = 'flex';
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = '';
    quizDiv.style.display = 'block';
    
    currentQuiz.forEach((q, index) => {
        const div = document.createElement('div');
        div.className = 'quiz-item';
        
        const optionsHtml = q.options.map(option => {
            return '<button class="option-btn" onclick="checkAnswer(this, \'' + 
                   option.replace(/'/g, "\\'") + '\', \'' + 
                   q.answer.replace(/'/g, "\\'") + '\', ' + index + ')">' + 
                   option + '</button>';
        }).join('');
        
        div.innerHTML = 
            '<div class="quiz-question">' +
            '<span class="quiz-question-num">' + (index + 1) + '</span>' +
            q.question +
            '</div>' +
            '<div class="options-grid">' + optionsHtml + '</div>';
        
        quizDiv.appendChild(div);
    });
}

function checkAnswer(button, selected, correct, questionIndex) {
    const optionsGrid = button.parentElement;
    const allButtons = optionsGrid.querySelectorAll('.option-btn');
    
    allButtons.forEach(btn => btn.disabled = true);
    answeredQuestions++;
    
    if (selected.trim() === correct.trim()) {
        button.classList.add('correct');
        score++;
    } else {
        button.classList.add('wrong');
        allButtons.forEach(btn => {
            if (btn.innerText.trim() === correct.trim()) {
                btn.classList.add('correct');
            }
        });
    }
    
    document.getElementById('scoreNum').textContent = score;
    
    if (answeredQuestions === totalQuestions) {
        adjustDifficulty();
    }
}

async function adjustDifficulty() {
    await saveProgress();
    
    const percentage = score / totalQuestions;
    if (percentage === 1 && currentLevel === 'Beginner') {
        currentLevel = 'Intermediate';
    } else if (percentage === 1 && currentLevel === 'Intermediate') {
        currentLevel = 'Advanced';
    }
    
    updateLevelBadge();
    
    setTimeout(() => {
        const msg = percentage === 1 
            ? '🎉 Perfect score! Advanced to ' + currentLevel 
            : 'Quiz complete. Score: ' + score + '/' + totalQuestions;
        alert(msg);
    }, 200);
}

async function saveProgress() {
    const topic = document.getElementById('topic').value;
    const language = document.getElementById('language').value;
    
    try {
        await fetch(API + '/save-progress', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                user_id: 'demo_user',
                topic: topic,
                language: language,
                level: currentLevel,
                score: score
            })
        });
    } catch (e) {
        console.error('Save error:', e);
    }
}

async function viewProgress() {
    document.getElementById('progressSection').style.display = 'block';
    document.getElementById('progress').innerHTML = '<p style="color:#6b7280;font-size:13px;" class="loading">Loading progress</p>';
    
    try {
        const response = await fetch(API + '/progress/demo_user');
        const data = await response.json();
        const progressDiv = document.getElementById('progress');
        
        if (data.total_attempts === 0) {
            progressDiv.innerHTML = '<p style="color:#6b7280;">No history yet. Start learning!</p>';
            return;
        }
        
        progressDiv.innerHTML = 
            '<div style="font-size:14px;margin-bottom:16px;">' +
            '<strong>Total Attempts:</strong> ' + data.total_attempts + '<br>' +
            '<strong>Average Score:</strong> ' + data.average_score + '<br>' +
            '<strong>Latest Level:</strong> ' + data.latest_level +
            '</div>';
    } catch (e) {
        document.getElementById('progress').innerHTML = '<p style="color:#6b7280;">Could not load progress</p>';
    }
    
}
async function sendMessage(userInput) {
    try {
        const response = await fetch("https://jxqpkh3ehrfyvg2n65j3yuvkpe0ucliw.lambda-url.us-east-1.on.aws/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: userInput
            })
        });

        const data = await response.json();
        return data.response;

    } catch (error) {
        console.error("Error:", error);
        return "Server connection failed.";
    }
}