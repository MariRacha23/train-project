document.addEventListener("DOMContentLoaded", async () => {
  const passengersListContainer = document.getElementById("passengersList");

  if (!passengersListContainer) {
    console.log("რეგისტრაციის ელემენტები არ მოიძებნა, ვჩერდებით.");
    return;
  }

  const trainId = localStorage.getItem("selectedTrainId");
  const day = localStorage.getItem("selectedDay");
  const passengerCount = parseInt(localStorage.getItem("passengerCount")) || 1;

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
                </div>
            `;

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
                            <input type="text" id="pn-${i}" class="reg-input" 
                            pattern="\\d{11}" 
                            title="პირადი ნომერი უნდა შედგებოდეს 11 ციფრისგან" 
                            placeholder="010XXXXXXXX" 
                            maxlength="11"
                            required>                            
                           <button class="select-seat-btn" onclick="openSeatModal(${i})">ადგილის არჩევა</button>
                        </div>
                    </div>
                `;
      }
    }
  } catch (error) {
    console.error("შეცდომა მონაცემების წამოღებისას:", error);
  }

  const savedToken = localStorage.getItem("accessToken");
  const authModal = document.getElementById("authModalOverlay");
  if (!savedToken || savedToken === "") {
    if (authModal) {
      authModal.style.display = "flex";
    }
  } else {
    accessToken = savedToken;
    getUserData();
  }
});

window.loadTrainWagons = async function () {
  const trainId = localStorage.getItem("selectedTrainId");
  const wagonContainer = document.querySelector(".trainsImgs");
  if (!wagonContainer) return;

  try {
    const response = await fetch(`https://railway.stepprojects.ge/api/vagons`);
    const allVagons = await response.json();

    const relevantVagons = allVagons.filter(
      (v) => String(v.trainId) === String(trainId),
    );

    wagonContainer.innerHTML = "";

    if (relevantVagons.length > 0) {
      relevantVagons.forEach((wagon, index) => {
        const wagonWrapper = document.createElement("div");
        wagonWrapper.className = "wagon-wrapper";

        let wagonImg = "midWagon.png";
        if (index === 0) wagonImg = "firstWagon.png";
        else if (index === relevantVagons.length - 1)
          wagonImg = "lastWagon.png";

        wagonWrapper.innerHTML = `
            <img src="./imgs/${wagonImg}" alt="wagon" class="trainImg">
            <button class="wagon-hover-btn" onclick="window.generateSeats('${wagon.id}')">
                ${wagon.name}
            </button>
        `;
        wagonContainer.appendChild(wagonWrapper);
      });
    } else {
      wagonContainer.innerHTML =
        "<p>ამ მატარებლისთვის ვაგონები ვერ მოიძებნა.</p>";
    }
  } catch (error) {
    console.error("ვაგონების ჩატვირთვის შეცდომა:", error);
  }
};

let currentPassengerIndex = null;

window.openSeatModal = function (index) {
  currentPassengerIndex = index;
  const modal = document.getElementById("seatModalOverlay");
  if (modal) {
    modal.style.display = "flex";
    loadTrainWagons();
  }
};

window.closeSeatModal = function () {
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
      if (modalTitle) modalTitle.innerText = "ვაგონი ცარიელია";
      return;
    }

    if (modalTitle) {
      modalTitle.innerText = `ვაგონის ნომერი: ${wagonData.name}`;
    }

    seatsGrid.innerHTML = "";

    const sortedSeats = wagonData.seats.sort((a, b) =>
      a.number.localeCompare(b.number, undefined, { numeric: true }),
    );

    sortedSeats.forEach((seat) => {
      const seatDiv = document.createElement("div");
      seatDiv.className = `seat ${seat.isOccupied ? "occupied" : "available"}`;
      seatDiv.innerText = seat.number;

      if (!seat.isOccupied) {
        seatDiv.onclick = () => {
          document
            .querySelectorAll(".seat")
            .forEach((s) => s.classList.remove("selected"));
          seatDiv.classList.add("selected");

          window.selectSeat(seat.number, seat.price, seat.seatId);
        };
      }
      seatsGrid.appendChild(seatDiv);
    });
  } catch (error) {
    console.error("სკამების ჩატვირთვის შეცდომა:", error);
    seatsGrid.innerHTML = "შეცდომა მონაცემების მიღებისას.";
  }
};

window.selectSeat = function (seatNumber, price, seatId) {
  const seatBadge = document.getElementById(
    `seat-num-${currentPassengerIndex}`,
  );

  if (seatBadge) {
    seatBadge.innerText = `ადგილი: ${seatNumber}`;
    seatBadge.setAttribute("data-selected-seat", seatNumber);
    seatBadge.setAttribute("data-selected-price", price);
    seatBadge.setAttribute("data-selected-seat-id", seatId);
    seatBadge.style.background = "#2ecc71";
    seatBadge.style.color = "white";
  }
  updateInvoiceSummary();
};

function updateInvoiceSummary() {
  const summaryContainer = document.getElementById("selectedSeatsSummary");
  const totalPriceElement = document.getElementById("totalPrice");

  let total = 0;
  summaryContainer.innerHTML = "";

  const allBadges = document.querySelectorAll(".seat-badge");
  allBadges.forEach((badge, index) => {
    const seat = badge.getAttribute("data-selected-seat");
    const seatPrice =
      parseFloat(badge.getAttribute("data-selected-price")) || 0;
    if (seat && seat !== "0") {
      total += seatPrice;

      const row = document.createElement("div");
      row.className = "invRow";
      row.innerHTML = `
    <span>მგზავრი ${index + 1} (ადგილი: ${seat})</span>
<span>${seatPrice.toFixed(2)}₾</span>   `;
      summaryContainer.appendChild(row);
    }
  });
  if (totalPriceElement) {
    totalPriceElement.innerText = `${total.toFixed(2)}₾`;
  }
}

document.getElementById("finishBooking").addEventListener("click", () => {
  const errorDisplay = document.getElementById("errorMessage");
  const passengerCount = parseInt(localStorage.getItem("passengerCount")) || 1;
  let allValid = true;
  let message = "";

  errorDisplay.innerHTML = "";

  for (let i = 1; i <= passengerCount; i++) {
    const fname = document.getElementById(`fname-${i}`).value.trim();
    const lname = document.getElementById(`lname-${i}`).value.trim();
    const pn = document.getElementById(`pn-${i}`).value.trim();
    const seatBadge = document.getElementById(`seat-num-${i}`);
    const hasSeat = seatBadge.getAttribute("data-selected-seat");

    if (!fname || !lname || pn.length !== 11 || !hasSeat) {
      allValid = false;
      message = "გთხოვთ შეავსოთ მგზავრების ყველა ველი და აირჩიოთ ადგილები .";
      break;
    }
  }
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const agree = document.getElementById("egreeTetms").checked;

  if (allValid && (!email || !phone || !agree)) {
    allValid = false;
    message = "გთხოვთ მიუთითოთ საკონტაქტო ინფორმაცია და დაეთანხმოთ წესებს.";
  }
  if (!allValid) {
    errorDisplay.innerText = `✕ ${message}`;
    errorDisplay.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  errorDisplay.style.color = "#2ecc71";
  errorDisplay.innerText =
    "✓ მონაცემები ვალიდურია, მიმდინარეობს რეგისტრაცია...";

  handleFinalBooking();
});

function toggleAuth(type) {
  const login = document.getElementById("loginSection");
  const register = document.getElementById("registerSection");

  if (type === "register") {
    login.style.display = "none";
    register.style.display = "block";
  } else {
    login.style.display = "block";
    register.style.display = "none";
  }
}

let accessToken = "";

async function signUp() {
  const userdata = {
    firstName: document.getElementById("regFirstName").value,
    lastName: document.getElementById("regLastName").value,
    age: Number(document.getElementById("regAge").value),
    email: document.getElementById("regEmail").value,
    password: document.getElementById("regPass").value,
    address: document.getElementById("regAddress").value,
    phone: document.getElementById("regPhone").value,
    zipcode: document.getElementById("regZip").value,
    avatar: document.getElementById("regAvatar").value,
    gender: document.getElementById("regGender").value,
  };

  const error = validateSignUp(userdata);
  if (error) {
    alert(error);
    return;
  }

  try {
    const res = await fetch("https://api.everrest.educata.dev/auth/sign_up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userdata),
    });

    if (res.ok) {
      alert(
        "რეგისტრაცია წარმატებულია! გთხოვთ, შეამოწმოთ მეილი და დააჭიროთ აქტივაციის ლინკს.",
      );

      document.getElementById("registerSection").style.display = "none";
      document.getElementById("loginSection").style.display = "block";
      localStorage.setItem("tempEmail", userdata.email);
    } else {
      const errorResponse = await res.json();
      console.log("სერვერის პასუხი:", errorResponse);
      alert(
        "შეცდომა: " + (errorResponse.message || "რეგისტრაცია ვერ მოხერხდა"),
      );
    }
  } catch (error) {
    console.error(error);
  }
}

async function handleLogin() {
  let email = document.getElementById("loginEmail").value;
  let password = document.getElementById("loginPass").value;

  try {
    const res = await fetch("https://api.everrest.educata.dev/auth/sign_in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      accessToken = data.access_token;
      localStorage.setItem("accessToken", accessToken);

      await getUserData();

      alert("ავტორიზაცია წარმატებულია!");
    } else {
      alert("შეცდომა: " + (data.message || "არასწორი მონაცემები"));
    }
  } catch (error) {
    console.error("Login error:", error);
  }
}

async function getUserData() {
  const token = localStorage.getItem("accessToken");
  if (!token) return;

  try {
    const res = await fetch("https://api.everrest.educata.dev/auth", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (res.ok) {
      const user = await res.json();

      const userInfoDiv = document.getElementById("user-info");
      if (userInfoDiv) {
        userInfoDiv.innerHTML = `
                <div class="user-info-container">
            <p class="hello-text">👋 გამარჯობა, ${user.firstName}!</p>
            <a href="javascript:void(0)" onclick="logout()" class="logout-link">
                გამოსვლა
            </a>
        </div>
                `;
      }

      const emailInput = document.getElementById("email");
      const phoneInput = document.getElementById("phone");

      if (emailInput) emailInput.value = user.email || "";
      if (phoneInput) phoneInput.value = user.phone || "";

      const firstNameInput = document.getElementById("fname-1");
      const lastNameInput = document.getElementById("lname-1");

      if (firstNameInput) firstNameInput.value = user.firstName || "";
      if (lastNameInput) lastNameInput.value = user.lastName || "";

      const authModal = document.getElementById("authModalOverlay");
      if (authModal) {
        authModal.style.display = "none";
      }
    } else {
      console.error("ავტორიზაცია ვერ მოხერხდა");
      localStorage.removeItem("accessToken");
      accessToken = null;

      if (typeof showAuthModal === "function") {
        showAuthModal();
      }
    }
  } catch (error) {
    console.error("User data fetch error:", error);
  }
}

function validateSignUp(data) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (data.firstName.length < 2) return "სახელი ძალიან მოკლეა";
  if (data.lastName.length < 2) return "გვარი ძალიან მოკლეა";
  if (!data.age || data.age < 13) return "ასაკი უნდა იყოს 13-ზე მეტი";
  if (!emailRegex.test(data.email)) return "იმეილი არასწორია";
  if (data.password.length < 8) return "პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო";
  if (!/[A-Z]/.test(data.password)) return "პაროლი უნდა შეიცავდეს ერთ დიდ ასოს";
  if (!/[0-9]/.test(data.password)) return "პაროლი უნდა შეიცავდეს ერთ ციფრს";
  if (!data.address) return "მისამართი სავალდებულოა";
  if (!data.phone) return "ტელეფონი სავალდებულოა";
  if (!data.zipcode) return "Zip-code სავალდებულოა";

  return null;
}

function logout() {
  localStorage.removeItem("accessToken");
  const inputs = ["email", "phone", "fname-1", "lname-1"];
  inputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  location.reload();
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleLogin();
  });
}

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    signUp();
  });
}

function getDateFromDayName(dayName) {
  const days = {
    ორშაბათი: 1,
    სამშაბათი: 2,
    ოთხშაბათი: 3,
    ხუთშაბათი: 4,
    პარასკევი: 5,
    შაბათი: 6,
    კვირა: 0,
  };

  const targetDay = days[dayName];
  const today = new Date();
  const resultDate = new Date(today);

  resultDate.setDate(
    today.getDate() + ((targetDay + (7 - today.getDay())) % 7),
  );
  return resultDate.toISOString().split("T")[0];
}

async function handleFinalBooking() {
  const token = localStorage.getItem("accessToken");
  const passengerCount = parseInt(localStorage.getItem("passengerCount")) || 1;
  const people = [];

  for (let i = 1; i <= passengerCount; i++) {
    const seatBadge = document.getElementById(`seat-num-${i}`);

    const sId = seatBadge
      ? seatBadge.getAttribute("data-selected-seat-id")
      : null;

    if (!sId || sId === "undefined" || sId === "null") {
      alert(`გთხოვთ, აირჩიოთ ადგილი მგზავრისთვის #${i}`);
      return;
    }

    people.push({
      seatId: sId,
      name: document.getElementById(`fname-${i}`).value,
      surname: document.getElementById(`lname-${i}`).value,
      idNumber: document.getElementById(`pn-${i}`).value,
      status: "0",
      payoutCompleted: true,
    });
  }

  const dayText = localStorage.getItem("selectedDay");
  const formattedDate = getDateFromDayName(dayText);

  const rawPhone = document.getElementById("phone").value.trim();
  const cleanPhoneForApi = rawPhone.replace("+995", "");

  const bookingData = {
    trainId: Number(localStorage.getItem("selectedTrainId")),
    date: formattedDate,
    email: document.getElementById("email").value,
    phoneNumber: cleanPhoneForApi,
    people: people,
  };

  console.log("ვაგზავნით მონაცემებს:", bookingData);

  try {
    const res = await fetch(
      "https://railway.stepprojects.ge/api/tickets/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(bookingData),
      },
    );

    if (res.ok) {
      const resultText = await res.text();
      const ticketIdMatch = resultText.match(/[0-9a-f-]{36}/);
      const cleanId = ticketIdMatch ? ticketIdMatch[0] : resultText.trim();

      localStorage.setItem("lastTicketId", cleanId);
      window.location.href = "paymentPage.html";
    } else {
      const errData = await res.json().catch(() => ({}));
      console.error("სერვერის შეცდომა:", errData);
      alert(
        "რეგისტრაცია ვერ მოხერხდა: " +
          (errData.message || "შეამოწმეთ მონაცემები"),
      );
    }
  } catch (error) {
    console.error("Fetch error:", error);
    alert("ვერ მოხერხდა სერვერთან დაკავშირება.");
  }
}
