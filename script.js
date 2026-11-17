const startForm = document.getElementById("startForm");
const researchID = document.getElementById("ResearchID");
const errorMessage = document.getElementById("errorMessage");

// Testing Data
const validIDs = ["S001", "S002", "S003"];

startForm.addEventListener("submit", function (event) {
    console.log("你好")
    event.preventDefault();
    const studentID = researchID.value.trim();
    if (validIDs.includes(studentID)) {
        errorMessage.textContent = "";
        window.location.href = "test.html";
    } else {
        errorMessage.textContent = "Invalid Research ID. Please try again.";
    }
});