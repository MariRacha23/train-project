document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("trainListContainer");

  const from = sessionStorage.getItem("from");
  const to = sessionStorage.getItem("to");
  const day = sessionStorage.getItem("selectedDay");

  console.log("ვეძებთ შემდეგ პარამეტრებს:", { from, to, day });
  try {
    const response = await fetch(
      `https://railway.stepprojects.ge/api/trains?day=${day}`,
    );
    const allTrains = await response.json();

    const filteredTrains = allTrains.filter(
      (t) => t.from === from && t.to === to && t.date === day,
    );

    if (filteredTrains.length === 0) {
      container.innerHTML = "<h2> რეისები ვერ მოიძებნა</h2>";
      return;
    }

    renderTrains(filteredTrains, container);
  } catch (error) {
    console.error("მონაცემების ჩატვირთვა ვერ მოხერხდა:", error);
  }
});

function renderTrains(trains, container) {
  container.innerHTML = "";

  trains.forEach((train) => {
    container.innerHTML += `
        <div class="train-item">
                <div class="col-name">
                    <span class="number">#${train.number}</span>
                    <p class="name">${train.name}  Expres </p>
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

function bookNow(trainId) {
  sessionStorage.setItem("selectedTrainId", trainId);
  const token = sessionStorage.getItem("accessToken");

  console.log("Token value:", token);
  if (
    !token ||
    token === "undefined" ||
    token === "null" ||
    token.length < 10
  ) {
    console.warn("ავტორიზაცია საჭიროა!");
    const authModal = document.getElementById("authModalOverlay");
    if (authModal) {
      authModal.style.display = "flex";
    }
    return;
  }

  window.location.href = "registration.html";
}
