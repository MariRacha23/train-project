async function loadStations() {
  try {
    const response = await fetch(
      "https://railway.stepprojects.ge/api/stations",
    );
    const stations = await response.json();

    const fromSelect = document.getElementById("fromStation");
    const toSelect = document.getElementById("toStation");

    fromSelect.innerHTML = '<option value="" disabled selected>საიდან</option>';
    toSelect.innerHTML = '<option value="" disabled selected>სად</option>';

    stations.forEach((station) => {
      const optionHTML = `<option value="${station.name}">${station.name}</option>`;

      fromSelect.innerHTML += optionHTML;
      toSelect.innerHTML += optionHTML;
    });
    fromSelect.addEventListener("change", function () {
      const selectedCity = fromSelect.value;

      Array.from(toSelect.options).forEach((option) => {
        if (option.value === selectedCity) {
          option.disabled = true;
          option.style.color = "#ccc";
        } else {
          option.disabled = false;
          option.style.color = "";
        }
      });
      if (toSelect.value === selectedCity) {
        toSelect.value = "";
      }
    });
  } catch (error) {
    alert("მონაცემების წამოღება ვერ მოხერხდა:");
  }
}
loadStations();

const weekDays = [
  "კვირა",
  "ორშაბათი",
  "სამშაბათი",
  "ოთხშაბათი",
  "ხუთშაბათი",
  "პარასკევი",
  "შაბათი",
];
const dataInput = document.getElementById("travelDate");

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, "0");
const day = String(now.getDate()).padStart(2, "0");
const formattedToday = `${year}-${month}-${day}`;

dataInput.value = formattedToday;
dataInput.setAttribute("min", formattedToday);

async function getFlights(day) {
  try {
    const response = await fetch(
      `https://railway.stepprojects.ge/api/trains?day=${day}`,
    );
    const flights = await response.json();
    window.currentAvailableTrains = flights;

    sessionStorage.setItem("lastSearchResults", JSON.stringify(flights));
    return flights;
  } catch (error) {
    alert("ბოდიში, რეისების ჩატვირთვა ვერ მოხერხდა. სცადეთ მოგვიანებით.");
  }
}

const todayName = weekDays[new Date().getDay()];
getFlights(todayName);
const searchBtn = document.querySelector(".search-main-btn");

searchBtn.addEventListener("click", () => {
  const passengers = parseInt(document.getElementById("passengers").value);
  const fromStation = document.getElementById("fromStation").value;
  const toStation = document.getElementById("toStation").value;
  const dateInputVal = dataInput.value;

  if (isNaN(passengers) || passengers < 1) {
    alert("მგზავრების რაოდენობა უნდა იყოს მინიმუმ 1!");
    return;
  }

  if (passengers > 10) {
    alert("ერთი ჯავშნით მაქსიმუმ 10 ბილეთის ყიდვაა შესაძლებელი");
    return;
  }

  if (!fromStation || !toStation || !dateInputVal) {
    alert("გთხოვთ, შეავსოთ ყველა ველი სწორად!");
    return;
  }

  if (fromStation === toStation) {
    alert("გამგზავრების და დანიშნულების ადგილი არ უნდა ემთხვეოდეს ერთმანეთს!");
    return;
  }

  const selectedDate = new Date(dateInputVal);
  const dayName = weekDays[selectedDate.getDay()];

  sessionStorage.setItem("fullBookingDate", dateInputVal);
  sessionStorage.setItem("selectedDay", dayName);
  sessionStorage.setItem("passengerCount", passengers);
  sessionStorage.setItem("from", fromStation);
  sessionStorage.setItem("to", toStation);

  window.location.href = "result.html";
});

window.performAiSearch = async function (from, to, date) {
  const selectedDate = new Date(date);
  const dayName = weekDays[selectedDate.getDay()];

  sessionStorage.setItem("fullBookingDate", date);
  sessionStorage.setItem("selectedDay", dayName);

  try {
    const response = await fetch(
      `https://railway.stepprojects.ge/api/trains?day=${encodeURIComponent(dayName)}`,
    );
    const allTrains = await response.json();

    let filtered = allTrains.filter(
      (t) =>
        t.from.trim().toLowerCase() === from.trim().toLowerCase() &&
        t.to.trim().toLowerCase() === to.trim().toLowerCase(),
    );

    const uniqueTrains = [];
    const seenTimes = new Set();
    for (const t of filtered) {
      if (!seenTimes.has(t.departure)) {
        seenTimes.add(t.departure);
        uniqueTrains.push(t);
      }
    }

    return uniqueTrains.slice(0, 3);
  } catch (e) {
    alert("ძებნის შეცდომა:", e);
    return [];
  }
};
