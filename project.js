document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    const nameInput = document.querySelector("#event-name");
    const dateInput = document.querySelector("#event-date");
    const typeInput = document.querySelector("#picker");
    const descriptionInput = document.querySelector("#eventDescription");

    // Do not allow dates before today.
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    dateInput.min = today.toISOString().split("T")[0];

    // Load old events. If there are none, start with an empty array.
    let events = JSON.parse(localStorage.getItem("zenithDeadlineEvents")) || [];

    const message = document.createElement("p");
    message.className = "form-message";
    form.querySelector(".form-card").append(message);

    function saveEvents() {
        localStorage.setItem("zenithDeadlineEvents", JSON.stringify(events));
    }

    function getDeadline(date) {
        return new Date(date + "T23:59:59");
    }

    // Decide which main section the selected event belongs to.
    function getSectionId(type) {
        const eventType = type.toLowerCase();

        if (eventType.includes("hackathon")) return "hackathons";
        if (eventType.includes("event")) return "events";
        if (eventType.includes("assignment")) return "assignments";
        return "examinations";
    }

    // Find or create the card area inside that section.
    function getCardArea(type) {
        const section = document.querySelector("#" + getSectionId(type));
        let cardArea = section.querySelector(".deadline-cards");

        if (!cardArea) {
            cardArea = document.createElement("div");
            cardArea.className = "deadline-cards";
            section.append(cardArea);
        }

        return cardArea;
    }

    function makeCard(event) {
        const card = document.createElement("article");
        card.className = "deadline-card";
        card.dataset.date = event.date;

        const readableDate = getDeadline(event.date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        card.innerHTML = `
            <div class="card-top-row">
                <div class="event-title">
                    <h3>${event.name}</h3>
                    <span class="event-type">${event.type}</span>
                </div>
                <button type="button" class="delete-event">Delete</button>
            </div>
            <p class="event-date-display">Due ${readableDate} · 11:59 PM</p>
            <p class="countdown-label">Time left</p>
            <div class="countdown">
                <div class="countdown-part"><strong class="days">00</strong><span>Days</span></div>
                <div class="countdown-part"><strong class="hours">00</strong><span>Hours</span></div>
                <div class="countdown-part"><strong class="minutes">00</strong><span>Minutes</span></div>
                <div class="countdown-part"><strong class="seconds">00</strong><span>Seconds</span></div>
            </div>
            <p class="deadline-passed" hidden>Deadline Passed</p>
            <p class="event-description">${event.description}</p>
        `;

        card.querySelector(".delete-event").addEventListener("click", function () {
            if (confirm("Delete " + event.name + "?")) {
                events = events.filter(function (item) {
                    return item.id !== event.id;
                });

                saveEvents();
                showEvents();
            }
        });

        return card;
    }

    function showEvents() {
        // Clear the old cards before drawing them again.
        document.querySelectorAll(".deadline-cards").forEach(function (cardArea) {
            cardArea.innerHTML = "";
        });

        // Show the nearest deadlines first.
        events.sort(function (first, second) {
            return getDeadline(first.date) - getDeadline(second.date);
        });

        events.forEach(function (event) {
            getCardArea(event.type).append(makeCard(event));
        });

        updateCountdowns();
    }

    function updateCountdowns() {
        const cards = document.querySelectorAll(".deadline-card");

        cards.forEach(function (card) {
            let timeLeft = getDeadline(card.dataset.date) - new Date();
            const countdown = card.querySelector(".countdown");
            const countdownLabel = card.querySelector(".countdown-label");
            const passedMessage = card.querySelector(".deadline-passed");

            if (timeLeft <= 0) {
                card.classList.add("is-expired");
                countdown.hidden = true;
                countdownLabel.hidden = true;
                passedMessage.hidden = false;
                return;
            }

            countdownLabel.hidden = false;

            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            timeLeft = timeLeft % (1000 * 60 * 60 * 24);

            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            timeLeft = timeLeft % (1000 * 60 * 60);

            const minutes = Math.floor(timeLeft / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            card.querySelector(".days").textContent = String(days).padStart(2, "0");
            card.querySelector(".hours").textContent = String(hours).padStart(2, "0");
            card.querySelector(".minutes").textContent = String(minutes).padStart(2, "0");
            card.querySelector(".seconds").textContent = String(seconds).padStart(2, "0");
        });
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = nameInput.value.trim();
        const date = dateInput.value;
        const selectedType = typeInput.value;
        const description = descriptionInput.value.trim();

        if (!name || !date || !selectedType || !description) {
            message.textContent = "Please fill in every field.";
            message.className = "form-message form-message-error";
            return;
        }

        // Save the text the user sees, such as "SST Hackathons".
        const typeName = typeInput.options[typeInput.selectedIndex].text;

        events.push({
            id: Date.now(),
            name: name,
            date: date,
            type: typeName,
            description: description
        });

        saveEvents();
        showEvents();
        form.reset();

        message.textContent = name + " was added successfully.";
        message.className = "form-message form-message-success";
    });

    showEvents();
    setInterval(updateCountdowns, 1000);
});
