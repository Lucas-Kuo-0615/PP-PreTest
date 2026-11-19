// Display Research ID on Final Page
const researchID = sessionStorage.getItem("pretest_research_id");

const finalResearchID = document.getElementById("finalResearchID");

if (researchID) {
    finalResearchID.textContent = researchID;
} else {
    finalResearchID.textContent = "Unavailable";
}