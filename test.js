const SUPABASE_URL = "https://kbajobguudrrhylbgykh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_xt9PAI-OnLchRtJuycPUGw_3pmcZtf2";

const calculatorElement = document.getElementById("calculator");

const researchID = document.getElementById("research-id");

const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");

const submitButton = document.getElementById("submitButton");

// Submit Modal Elements
const submitModal = document.getElementById("submitModal");
const cancelSubmit = document.getElementById("cancelSubmit");
const confirmSubmit = document.getElementById("confirmSubmit");

const calculator = Desmos.GraphingCalculator(calculatorElement,
    { expressions: false, settingsMenu: false });

let saveTimeout;
let timerInterval; // timer
let isSubmitting = false;

function updateProgress() {
    const totalQuestions = 8;
    const questionCards = document.querySelectorAll(".question-card");

    const answeredQuestions = Array.from(questionCards).filter((card) => {
        const selectedOption = card.querySelector('input[type="radio"]:checked');

        const textareas = card.querySelectorAll("textarea");

        const hasTextAnswer = Array.from(textareas).some((textarea) => {
            return textarea.value.trim() !== "";
        });

        return selectedOption || hasTextAnswer;
    }).length;

    const percentage = (answeredQuestions / totalQuestions) * 100;

    progressText.textContent = `${answeredQuestions} / ${totalQuestions} answered`;
    progressFill.style.width = `${percentage}%`;
}

function restoreAnswers(answers) {
    Object.entries(answers || {}).forEach(([questionID, answer]) => {
        // Restore Multiple Choice answers
        const selectedOption = document.querySelector(
            `.question-card input[type="radio"][name="${questionID}"][value="${answer}"]`
        );

        if (selectedOption) {
            selectedOption.checked = true;
        }

        // Restore Short Answer responses
        const textArea = document.querySelector(
            `.question-card textarea[name="${questionID}"]`
        );

        if (textArea) {
            textArea.value = answer;
        }
    });
}

async function getPretest() {
    const sessionToken = sessionStorage.getItem("pretest_session_token");

    // Check whether session token exists
    if (!sessionToken) {
        window.location.href = "index.html";
        return;
    }

    try {
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/get-pretest`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_PUBLISHABLE_KEY
                },
                body: JSON.stringify({
                    session_token: sessionToken
                })
            }
        );

        const data = await response.json();

        // Check whether the request was successful
        if (!response.ok || !data.success) {

            if (data.already_submitted) {
                alert("This Pre-Test has already been submitted.");
                window.location.href = "index.html";
                return;
            }

            throw new Error(data.message || "Unable to load Pre-Test.");
        }

        // Restore previous answers
        restoreAnswers(data.attempt.answers);

        // Update Progress Bar
        updateProgress();

        // Start the Timer
        startTimer(data.attempt.started_at);

        researchID.textContent = data.research_id;
    } catch (error) {
        console.error("Get Pre-Test error:", error);
        alert("Unable to load your Pre-Test. Please try again.");
    }
}

function collectAnswers() {
    const answers = {};
    document.querySelectorAll(".question-card").forEach((card) => {

        // Collect MCQ answers
        const selectedOption = card.querySelector(
            'input[type="radio"]:checked'
        );

        if (selectedOption) {
            answers[selectedOption.name] = selectedOption.value;
        }

        // Collect Short Answer responses
        const textareas = card.querySelectorAll("textarea");

        textareas.forEach((textarea) => {
            if (textarea.value.trim() !== "") {
                answers[textarea.name] = textarea.value;
            }
        });
    });
    return answers;
}

async function saveProgress() {
    const sessionToken = sessionStorage.getItem("pretest_session_token");

    if (!sessionToken) {
        console.error("Session token not found.");
        return;
    }

    const answers = collectAnswers();

    try {
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/save-pretest-progress`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_PUBLISHABLE_KEY
                },
                body: JSON.stringify({
                    session_token: sessionToken,
                    answers: answers
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to save progress.");
        }

    } catch (error) {
        console.error("Save Progress Error:", error);
    }
}

function startTimer(startedAt) {
    const totalTime = 7 * 60 * 1000; // 7 minutes
    const startTime = new Date(startedAt).getTime();

    const timerDisplay = document.getElementById("timerDisplay");

    // Clear previous timer if one exists
    clearInterval(timerInterval);

    function updateTimer() {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, totalTime - elapsedTime);

        const minutes = Math.floor(remainingTime / 60000);
        const seconds = Math.floor((remainingTime % 60000) / 1000);

        timerDisplay.textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        const timerContainer = document.querySelector(".timer");

        if (remainingTime <= 60000) {
            timerContainer.classList.add("warning");
        } else {
            timerContainer.classList.remove("warning");
        }

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            submitPretest(true);
        }
    }

    updateTimer();

    timerInterval = setInterval(updateTimer, 1000);
}

async function submitPretest(autoSubmit = false) {

    if (isSubmitting) return;

    isSubmitting = true;

    submitModal.style.display = "none";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
    }

    clearTimeout(saveTimeout);
    clearInterval(timerInterval);

    const sessionToken = sessionStorage.getItem("pretest_session_token");
    const answers = collectAnswers();

    try {
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/submit-pretest`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_PUBLISHABLE_KEY
                },
                body: JSON.stringify({
                    session_token: sessionToken,
                    answers: answers
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to submit Pre-Test.");
        }

        alert("Your Pre-Test has been submitted successfully!");

        // Clear the session after successful submission
        sessionStorage.removeItem("pretest_session_token");
        sessionStorage.removeItem("pretest_session_expires");

        window.location.href = "final.html"; // Navigate to Final Window
    } catch (error) {
        console.error("Submit Pre-Test Error:", error);

        alert("Submission failed. Please check your connection and try again.");

        isSubmitting = false;

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Submit Pre-Test";
        }
    }
}

function scheduleSave() {
    clearTimeout(saveTimeout);

    saveTimeout = setTimeout(() => {
        saveProgress();
    }, 1000);
}

calculator.setExpression({
    id: "function",
    latex: "y=\\frac{\\sin(x)}{x}"
});


document.querySelectorAll(".question-card input, .question-card textarea").forEach((input) => {
    input.addEventListener("change", () => {
        updateProgress();
        scheduleSave();
    });

    input.addEventListener("input", () => {
        updateProgress();
        scheduleSave();
    });
});

// Open Submit Modal
submitButton.addEventListener("click", () => {
    submitModal.style.display = "flex";
});

// Close Submit Modal
cancelSubmit.addEventListener("click", () => {
    submitModal.style.display = "none";
});

confirmSubmit.addEventListener("click", () => {
    submitPretest();
});

// Load Pre-Test when the page opens
getPretest();