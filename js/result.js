document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("trainListContainer");

  const from = sessionStorage.getItem("from");
  const to = sessionStorage.getItem("to");
  const day = sessionStorage.getItem("selectedDay");

  try {
    const response = await fetch(
      `https://railway.stepprojects.ge/api/trains?day=${day}`,
    );
    if (!response.ok) {
      throw new Error("სერვერის შეცდომა");
    }
    const allTrains = await response.json();

    const filteredTrains = allTrains.filter(
      (t) => t.from === from && t.to === to && t.date === day,
    );
    window.currentAvailableTrains = filteredTrains;

    sessionStorage.setItem("lastSearchResults", JSON.stringify(filteredTrains));

    if (filteredTrains.length === 0) {
      container.innerHTML = "<h2> რეისები ვერ მოიძებნა</h2>";
      return;
    }

    renderTrains(filteredTrains, container);
  } catch (error) {
    alert("ბოდიში, მონაცემების წამოღება ვერ მოხერხდა. სცადეთ მოგვიანებით.");
  }
});

function renderTrains(trains, container) {
  container.innerHTML = "";

  trains.forEach((train) => {
    container.innerHTML += `
        <div class="train-item">
                <div class="col-name">
                    <span class="number">#${train.number}</span>
                    <p class="name">${train.name}  Express </p>
                </div>
                <div class="col-departure dashedLine">
                    <p class="time">${train.departure}</p> 
                    <p class="station">${train.from}</p>
                </div>
                <div class="col-arrival dashedLine">
                    <p class="time">${train.arrive}</p> 
                    <p class="station">${train.to}</p>
                </div>
                <div class="col-action dashedLine">
                    <button class="book-btn" onclick="bookNow('${train.id}')">დაჯავშნა</button>
                </div>
            </div>
        `;
  });
}

window.executeBooking = function (trainId) {
  bookNow(trainId);
};

function bookNow(trainId) {
  sessionStorage.setItem("selectedTrainId", trainId);
  const token = sessionStorage.getItem("accessToken");

  if (
    !token ||
    token === "undefined" ||
    token === "null" ||
    token.length < 10
  ) {
    const authModal = document.getElementById("authModalOverlay");
    if (authModal) {
      authModal.style.display = "flex";
    }
    return;
  }

  window.location.href = "registration.html";
}
