const API = "https://zx13nhbcy8.execute-api.us-east-1.amazonaws.com/default";

let currentLevel = "Beginner";
let score = 0;
let totalQuestions = 0;
let answeredQuestions = 0;
let currentQuiz = [];

function updateLevelBadge() {
    document.getElementById("levelLabel").textContent = "Level: " + currentLevel;
}

async function generate() {
    const topic = document.getElementById("topic").value.trim();
    const language = document.getElementById("language").value;

    if (!topic) {
        document.getElementById("topic").focus();
        return;
    }

    score = 0;
    answeredQuestions = 0;
    currentQuiz = [];

    document.getElementById("scoreNum").textContent = "0";
    document.getElementById("scoreDisplay").style.display = "none";

    document.getElementById("explanationSection").style.display = "block";
    document.getElementById("explanation").innerHTML =
        '<span class="loading">Generating lesson...</span>';

    document.getElementById("summarySection").style.display = "none";
    document.getElementById("resourcesSection").style.display = "none";
    document.getElementById("quizSection").style.display = "none";

    try {
        const response = await fetch(`${API}/api/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                topic: topic,
                language: language,
                level: currentLevel
            }),
        });

        const data = await response.json();

        if (data.error || !data.explanation) {
            document.getElementById("explanation").innerText =
                "AI response error: " + (data.error || "Unknown error");
            return;
        }

        // Set Explanation
        document.getElementById("explanation").innerHTML = data.explanation;

        // Set Summary
        document.getElementById("summarySection").style.display = "block";
        document.getElementById("summary").innerHTML = data.summary;

        // Setup Quiz
        if (data.quiz && data.quiz.length > 0) {
            currentQuiz = data.quiz;
            totalQuestions = currentQuiz.length;
            document.getElementById("quizSection").style.display = "block";
            document.getElementById("quizButton").style.display = "inline-block";
            document.getElementById("quiz").style.display = "none"; // Hide until start
        }

        // Set Resources
        document.getElementById("resourcesSection").style.display = "block";
        document.getElementById("resources").innerHTML =
            `<a class="resource-link" href="https://www.google.com/search?q=${encodeURIComponent(topic)}+diagram" target="_blank"><span>🔎</span>View Images & Diagrams</a>` +
            `<a class="resource-link" href="https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}+explained" target="_blank"><span>📺</span>Watch YouTube</a>` +
            `<a class="resource-link" href="https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}" target="_blank"><span>📚</span>Read Wikipedia</a>`;

    } catch (error) {
        console.error(error);
        document.getElementById("explanation").innerText =
            "Could not connect to AI server.";
    }
}

function startQuiz() {
    const quizDiv = document.getElementById("quiz");
    quizDiv.innerHTML = "";
    quizDiv.style.display = "block";

    document.getElementById("quizButton").style.display = "none";
    document.getElementById("scoreDisplay").style.display = "flex";
    document.getElementById("scoreTotal").textContent = ` / ${totalQuestions}`;

    currentQuiz.forEach((q, index) => {
        const div = document.createElement("div");
        div.className = "quiz-item";

        const optionsHtml = q.options
            .map(
                (option) =>
                    `<button class="option-btn" onclick="checkAnswer(this, '${option.replace(/'/g, "\\'")}', '${q.answer.replace(/'/g, "\\'")}')">${option}</button>`
            )
            .join("");

        div.innerHTML =
            '<div class="quiz-question">' +
            (index + 1) +
            ". " +
            q.question +
            "</div>" +
            '<div class="options-grid">' +
            optionsHtml +
            "</div>";

        quizDiv.appendChild(div);
    });
}

function checkAnswer(button, selected, correct) {
    const buttons = button.parentElement.querySelectorAll(".option-btn");
    buttons.forEach((btn) => (btn.disabled = true));

    if (selected === correct) {
        button.classList.add("correct");
        score++;
    } else {
        button.classList.add("wrong");
        buttons.forEach((btn) => {
            if (btn.innerText === correct) {
                btn.classList.add("correct");
            }
        });
    }

    answeredQuestions++;
    document.getElementById("scoreNum").textContent = score;

    if (answeredQuestions === totalQuestions) {
        adjustDifficulty();
        saveProgress();
    }
}

function adjustDifficulty() {
    const percentage = score / totalQuestions;

    if (percentage === 1 && currentLevel === "Beginner") {
        currentLevel = "Intermediate";
    } else if (percentage === 1 && currentLevel === "Intermediate") {
        currentLevel = "Advanced";
    }

    updateLevelBadge();

    setTimeout(() => {
        alert(
            percentage === 1
                ? "🎉 Perfect score! Advanced to " + currentLevel
                : "Quiz complete. Score: " + score + "/" + totalQuestions
        );
    }, 200);
}

async function saveProgress() {
    try {
        const topic = document.getElementById("topic").value.trim();
        const language = document.getElementById("language").value;

        await fetch(`${API}/api/save-progress`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: "demo_user",
                topic: topic,
                language: language,
                level: currentLevel,
                score: score
            }),
        });
    } catch (error) {
        console.error("Failed to save progress", error);
    }
}

async function viewProgress() {
    const progressSection = document.getElementById("progressSection");
    progressSection.style.display = "block";
    document.getElementById("progress").innerHTML = "Loading progress...";

    try {
        const response = await fetch(`${API}/api/progress/demo_user`);
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        document.getElementById("progress").innerHTML = `
            <p><strong>Total Attempts:</strong> ${data.total_attempts}</p>
            <p><strong>Average Score:</strong> ${data.average_score}</p>
            <p><strong>Current Level:</strong> ${data.latest_level || currentLevel}</p>
        `;
    } catch (error) {
        console.error("Failed to load progress", error);
        document.getElementById("progress").innerHTML = "<p>Could not load progress data.</p>";
    }
}