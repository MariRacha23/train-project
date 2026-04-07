if (!sessionStorage.getItem("accessToken")) {
  window.location.href = "index.html";
}
let locallySelectedSeats = {};
let currentUserData = null;

document.addEventListener("DOMContentLoaded", async () => {
  const passengersListContainer = document.getElementById("passengersList");
  if (!passengersListContainer) return;

  const trainId = sessionStorage.getItem("selectedTrainId");
  const day = sessionStorage.getItem("selectedDay");
  const passengerCount =
    parseInt(sessionStorage.getItem("passengerCount")) || 1;
  const trainCardContainer = document.getElementById("selectedTrainInfo");

  if (!trainId) {
    alert("მატარებელი არ არის არჩეული!");
    window.location.href = "index.html";
    return;
  }

  try {
    const response = await fetch(
      `https://railway.stepprojects.ge/api/trains?day=${day}`,
    );
    const trains = await response.json();
    const selectedTrain = trains.find((t) => t.id == trainId);

    if (selectedTrain) {
      trainCardContainer.innerHTML = `
                <div class="train-details-top">
                    <span class="train-number">#${selectedTrain.number}</span>
                    <p class="train-route-name">${selectedTrain.name}</p>
                </div>
                <div class="train-times-row">
                    <div class="time-block">
                        <span class="time-val">${selectedTrain.departure}</span>
                        <span class="station-name">${selectedTrain.from}</span>
                    </div>
                    <div class="time-block">
                        <span class="time-val">${selectedTrain.arrive}</span>
                        <span class="station-name">${selectedTrain.to}</span>
                    </div>
                </div>`;

      passengersListContainer.innerHTML = "";
      for (let i = 1; i <= passengerCount; i++) {
        passengersListContainer.innerHTML += `
                    <div class="passenger-block">
                        <h4 class="passenger">მგზავრი ${i}</h4>
                        <div class="passenger-inputs">
                            <div class="seat-badge-wrapper">
                                <span class="seat-badge" id="seat-num-${i}">ადგილი: 0</span>
                            </div>
                            <input type="text" id="fname-${i}" placeholder="სახელი" class="reg-input1">
                            <input type="text" id="lname-${i}" placeholder="გვარი" class="reg-input1">
                            <input type="text" id="pn-${i}" class="reg-input" maxlength="11" placeholder="პირადი ნომერი">                          
                           <button class="select-seat-btn" onclick="openSeatModal(${i})">ადგილის არჩევა</button>
                        </div>
                    </div>`;
      }

      if (currentUserData) {
        fillRegistrationInputs(currentUserData);
      }
    }
  } catch (error) {
    alert("ბოდიში, მონაცემების წამოღება ვერ მოხერხდა. სცადეთ მოგვიანებით.");
  }

  const token = sessionStorage.getItem("accessToken");
  if (!token) {
    const authModal = document.getElementById("authModalOverlay");
    if (authModal) authModal.style.display = "flex";
  }

  const pendingData = sessionStorage.getItem("pendingPassengerData");
  if (pendingData) {
    const data = JSON.parse(pendingData);
    if (document.getElementById("fname-1"))
      document.getElementById("fname-1").value = data.firstName;
    if (document.getElementById("lname-1"))
      document.getElementById("lname-1").value = data.lastName;
    if (document.getElementById("pn-1"))
      document.getElementById("pn-1").value = data.pn;
    if (document.getElementById("email"))
      document.getElementById("email").value = data.email;
    if (document.getElementById("phone"))
      document.getElementById("phone").value = data.phone;

    sessionStorage.removeItem("pendingPassengerData");
  }
});

window.fillRegistrationInputs = function (user) {
  currentUserData = user;

  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const firstNameInput = document.getElementById("fname-1");
  const lastNameInput = document.getElementById("lname-1");

  if (emailInput) emailInput.value = user.email || "";
  if (phoneInput) phoneInput.value = user.phone || "";

  if (firstNameInput) firstNameInput.value = user.firstName || "";
  if (lastNameInput) lastNameInput.value = user.lastName || "";
};

window.loadTrainWagons = async function () {
  const trainId = sessionStorage.getItem("selectedTrainId");
  const wagonContainer = document.querySelector(".trainsImgs");
  if (!wagonContainer) return;

  try {
    const response = await fetch(`https://railway.stepprojects.ge/api/vagons`);
    const allVagons = await response.json();

    let relevantVagons = allVagons.filter(
      (v) => String(v.trainId) === String(trainId),
    );

    relevantVagons.sort((a, b) => {
      const priceA = a.price || (a.seats && a.seats[0] ? a.seats[0].price : 0);
      const priceB = b.price || (b.seats && b.seats[0] ? b.seats[0].price : 0);
      return Number(priceA) - Number(priceB);
    });

    wagonContainer.innerHTML = "";

    relevantVagons.forEach((wagon, index) => {
      let wagonImg = "midWagon.png";
      if (index === 0) wagonImg = "firstWagon.png";
      else if (index === relevantVagons.length - 1) wagonImg = "lastWagon.png";

      const displayPrice =
        wagon.price ||
        (wagon.seats && wagon.seats[0] ? wagon.seats[0].price : "0");

      const wagonWrapper = document.createElement("div");
      wagonWrapper.className = "wagon-wrapper";
      wagonWrapper.innerHTML = `
        <img src="./imgs/${wagonImg}" alt="wagon" class="trainImg">
        <button type="button" class="wagon-hover-btn" onclick="window.generateSeats('${wagon.id}')">
          ${wagon.name} <br>
          <span >${displayPrice}₾</span>
        </button>
      `;
      wagonContainer.appendChild(wagonWrapper);
    });

    window.availableVagons = relevantVagons;
  } catch (e) {
    alert("ბოდიში, მონაცემების წამოღება ვერ მოხერხდა. სცადეთ მოგვიანებით.");
  }
};

let currentPassengerIndex = null;
window.openSeatModal = (index) => {
  currentPassengerIndex = index;
  document.getElementById("seatModalOverlay").style.display = "flex";
  loadTrainWagons();
};

window.closeSeatModal = () => {
  document.getElementById("seatModalOverlay").style.display = "none";
};

window.generateSeats = async function (wagonId) {
  const seatsGrid = document.getElementById("seatsGrid");
  const modalTitle = document.querySelector(".wagon-prompt");

  if (!seatsGrid) return;
  seatsGrid.innerHTML = "იტვირთება...";

  try {
    const response = await fetch(
      `https://railway.stepprojects.ge/api/getvagon/${wagonId}`,
    );
    const data = await response.json();
    const wagonData = Array.isArray(data) ? data[0] : data;

    if (!wagonData || !wagonData.seats) {
      seatsGrid.innerHTML = "ამ ვაგონში სკამები ვერ მოიძებნა.";
      return;
    }

    if (modalTitle) modalTitle.innerText = `ვაგონის ნომერი: ${wagonData.name}`;
    seatsGrid.innerHTML = "";

    const sortedSeats = wagonData.seats.sort((a, b) =>
      a.number.localeCompare(b.number, undefined, { numeric: true }),
    );

    sortedSeats.forEach((seat) => {
      const seatDiv = document.createElement("div");

      const isTakenLocally = Object.entries(locallySelectedSeats).some(
        ([pIdx, seatData]) =>
          seatData.number === seat.number &&
          String(seatData.wagonId) === String(wagonId) &&
          parseInt(pIdx) !== currentPassengerIndex,
      );

      if (seat.isOccupied || isTakenLocally) {
        seatDiv.className = "seat occupied";
        seatDiv.innerText = seat.number;
      } else {
        seatDiv.className = "seat available";

        if (
          locallySelectedSeats[currentPassengerIndex]?.number === seat.number &&
          String(locallySelectedSeats[currentPassengerIndex]?.wagonId) ===
            String(wagonId)
        ) {
          seatDiv.classList.add("selected");
        }

        seatDiv.innerText = seat.number;
        seatDiv.onclick = () => {
          document
            .querySelectorAll(".seat")
            .forEach((s) => s.classList.remove("selected"));
          seatDiv.classList.add("selected");

          locallySelectedSeats[currentPassengerIndex] = {
            number: seat.number,
            wagonId: wagonId,
          };

          window.selectSeat(
            seat.number,
            seat.price,
            seat.id || seat.seatId,
            wagonId,
          );
        };
      }
      seatsGrid.appendChild(seatDiv);
    });
  } catch (error) {
    seatsGrid.innerHTML = "მონაცემების ჩატვირთვა ვერ მოხერხდა.";
  }
};

window.selectSeat = function (seatNumber, price, seatId, wagonId) {
  locallySelectedSeats[currentPassengerIndex] = {
    number: seatNumber,
    wagonId: wagonId,
  };
  const seatBadge = document.getElementById(
    `seat-num-${currentPassengerIndex}`,
  );
  if (seatBadge) {
    seatBadge.innerText = `ადგილი: ${seatNumber}`;
    seatBadge.setAttribute("data-selected-seat", seatNumber);
    seatBadge.setAttribute("data-selected-price", price);
    seatBadge.setAttribute("data-selected-seat-id", seatId);
    seatBadge.setAttribute("data-vagon-id", wagonId);
    seatBadge.style.background = "#2ecc71";
    seatBadge.style.color = "white";
  }
  updateInvoiceSummary();
};

function updateInvoiceSummary() {
  const summary = document.getElementById("selectedSeatsSummary");
  let total = 0;
  summary.innerHTML = "";
  document.querySelectorAll(".seat-badge").forEach((badge, i) => {
    const seat = badge.dataset.selectedSeat;
    const price = parseFloat(badge.dataset.selectedPrice) || 0;
    if (seat) {
      total += price;
      summary.innerHTML += `
                <div class="invRow">
                    <span>მგზავრი ${i + 1} (ადგილი: ${seat})</span>
                    <span>${price.toFixed(2)}₾</span>
                </div>`;
    }
  });
  document.getElementById("totalPrice").innerText = `${total.toFixed(2)}₾`;
}

document.getElementById("finishBooking").addEventListener("click", () => {
  const errorDisplay = document.getElementById("errorMessage");
  const passengerCount =
    parseInt(sessionStorage.getItem("passengerCount")) || 1;
  let allValid = true;
  let message = "";

  for (let i = 1; i <= passengerCount; i++) {
    const fname = document.getElementById(`fname-${i}`)?.value.trim();
    const lname = document.getElementById(`lname-${i}`)?.value.trim();
    const pn = document.getElementById(`pn-${i}`)?.value.trim();
    const seatBadge = document.getElementById(`seat-num-${i}`);
    const hasSeat = seatBadge
      ? seatBadge.getAttribute("data-selected-seat")
      : null;

    if (!fname || !lname || pn.length !== 11 || !hasSeat || hasSeat === "0") {
      allValid = false;
      message = "გთხოვთ შეავსოთ მგზავრების ყველა ველი და აირჩიოთ ადგილები.";
      break;
    }
  }

  const email = document.getElementById("email")?.value.trim();
  const phone = document.getElementById("phone")?.value.trim();
  const agree = document.getElementById("agreeTerms")?.checked;

  if (allValid && (!email || !phone || !agree)) {
    allValid = false;
    message = "გთხოვთ მიუთითოთ საკონტაქტო ინფორმაცია და დაეთანხმოთ წესებს.";
  }

  if (!allValid) {
    errorDisplay.style.display = "block";
    errorDisplay.style.color = "red";
    errorDisplay.innerText = `✕ ${message}`;
    return;
  }

  handleFinalBooking();
});

async function handleFinalBooking() {
  const token = sessionStorage.getItem("accessToken");
  const passengerCount =
    parseInt(sessionStorage.getItem("passengerCount")) || 1;
  const people = [];

  for (let i = 1; i <= passengerCount; i++) {
    const seatBadge = document.getElementById(`seat-num-${i}`);
    const sId = seatBadge
      ? seatBadge.getAttribute("data-selected-seat-id")
      : null;
    const vId = seatBadge ? seatBadge.getAttribute("data-vagon-id") : null;

    if (!sId) {
      alert(`გთხოვთ, აირჩიოთ ადგილი მგზავრისთვის #${i}`);
      return;
    }

    people.push({
      seatId: sId,
      vagonId: Number(vId),
      name: document.getElementById(`fname-${i}`).value,
      surname: document.getElementById(`lname-${i}`).value,
      idNumber: document.getElementById(`pn-${i}`).value,
      status: "0",
      payoutCompleted: true,
    });
  }

  const formattedDate = sessionStorage.getItem("fullBookingDate");

  if (!formattedDate) {
    alert("შეცდომა: თარიღი ვერ მოიძებნა. გთხოვთ, თავიდან აირჩიოთ რეისი.");
    window.location.href = "index.html";
    return;
  }

  const rawPhone = document.getElementById("phone").value.trim();

  const bookingData = {
    trainId: Number(sessionStorage.getItem("selectedTrainId")),
    date: formattedDate,
    email: document.getElementById("email").value,
    phoneNumber: rawPhone.replace("+995", ""),
    people: people,
  };

  try {
    const res = await fetch(
      "https://railway.stepprojects.ge/api/tickets/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      },
    );

    if (res.ok) {
      const resultText = await res.text();
      const ticketIdMatch = resultText.match(/[0-9a-f-]{36}/);
      const cleanId = ticketIdMatch ? ticketIdMatch[0] : resultText.trim();

      const totalPrice =
        document.getElementById("totalPrice")?.innerText || "0";
      sessionStorage.setItem("amountToPay", totalPrice);

      sessionStorage.setItem("lastTicketId", cleanId);
      window.location.href = "paymentPage.html";
    } else {
      const errData = await res.json().catch(() => ({}));
      alert("შეცდომა: " + (errData.message || "მონაცემები არასწორია"));
    }
  } catch (error) {
    alert("სერვერთან კავშირი ვერ დამყარდა");
  }
}

window.addEventListener("click", (event) => {
  const modal = document.getElementById("seatModalOverlay");
  if (event.target === modal) {
    closeSeatModal();
  }
});

window.aiFillPassenger = function (index, fname, lname, pn, email, phone) {
  let currentHistory = JSON.parse(sessionStorage.getItem("chatHistory")) || [];

  const inputs = {
    [`fname-${index}`]: fname,
    [`lname-${index}`]: lname,
    [`pn-${index}`]: pn,
    email: email,
    phone: phone,
  };

  for (const [id, value] of Object.entries(inputs)) {
    const el = document.getElementById(id);
    if (el && value && value !== "undefined") {
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  const confirmationMsg = `მონაცემები ავტომატურად შევსებულია მგზავრისთვის: ${fname} ${lname}. გთხოვთ, შეავსოთ მხოლოდ გამოტოვებული ველები (მაგ. პირადი ნომერი).`;

  currentHistory.push({
    role: "assistant",
    content: confirmationMsg,
  });

  sessionStorage.setItem(
    "chatHistory",
    JSON.stringify(currentHistory.slice(-10)),
  );

  const chatMessages = document.getElementById("chat-messages");
  if (chatMessages) {
    const div = document.createElement("div");
    div.className = "ai-msg";
    div.innerHTML = `<b>AI:</b> ${confirmationMsg}`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
};
