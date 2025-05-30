document.addEventListener("DOMContentLoaded", function () {
    updatePage();
});

async function updatePage() {
    const list = document.getElementById("amrap-list");

    try {
        const response = await fetch("workoutList.txt");
        if (!response.ok) throw new Error("Network response was not ok");

        const text = await response.text();
        const listHTML = parseWorkoutTextToHTML(text);

        list.innerHTML = listHTML;
    } catch (error) {
        list.innerHTML = `<p>Error loading workouts: ${error.message}</p>`;
    }
}

function parseWorkoutTextToHTML(text) {
    // Split into sections by headers
    const sections = text.split(/=== (.*?) Workouts ===/g);

    let html = "";

    for (let i = 1; i < sections.length; i += 2) {
        const category = sections[i].trim();
        const workouts = sections[i + 1].trim().split(/\n\s*\n/);

        html += `<h2>${category} Workouts</h2><ul>`;

        for (const workout of workouts) {
            const cleanedWorkout = workout.replace(/\n/g, "<br>");
            html += `<li class="listItem">${cleanedWorkout}</li>`;
        }

        html += `</ul>`;
    }

    return html;
}