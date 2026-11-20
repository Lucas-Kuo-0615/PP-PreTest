const SUPABASE_URL = "https://kbajobguudrrhylbgykh.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_xt9PAI-OnLchRtJuycPUGw_3pmcZtf2";

const startForm = document.getElementById("startForm");
const researchID = document.getElementById("ResearchID");
const errorMessage = document.getElementById("errorMessage");
const startButton = document.getElementById("startButton");

startForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const studentID = researchID.value.trim().toUpperCase();
    errorMessage.textContent = "";

    if (!/^[A-Z][0-9]{3}$/.test(studentID)) {
        errorMessage.textContent = "Invalid Research ID format.";

        return;
    }

    startButton.disabled = true;
    startButton.textContent = "Verifying...";

    try {
        // Validate Research ID
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/validate-research-id`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_PUBLISHABLE_KEY
                },

                body: JSON.stringify({
                    research_id: studentID
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.valid) {
            errorMessage.textContent = data.message || "Invalid Research ID. Please try again.";
            return;
        }

        sessionStorage.setItem("pretest_session_token", data.session_token);
        sessionStorage.setItem("pretest_session_expires", data.expires_at)
        sessionStorage.setItem("pretest_research_id", studentID);
        window.location.href = "test.html"; // Navigate to Test Window
    } catch (error) {
        console.error("Verification error:", error);
        errorMessage.textContent = "Unable to connect to the server. Please try again.";
    } finally {
        startButton.disabled = false;
        startButton.textContent = "Start Pre-test →";
    }
});