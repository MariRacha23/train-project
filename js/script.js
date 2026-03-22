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
  } catch (error) {
    console.error("მონაცემების წამოღება ვერ მოხერხდა:", error);
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

    console.log(flights);
  } catch (error) {
    console.error("რეისების წამოღება ვერ მოხერხდა:", error);
  }
}

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

  sessionStorage.setItem("selectedDay", dayName);
  sessionStorage.setItem("passengerCount", passengers);
  sessionStorage.setItem("from", fromStation);
  sessionStorage.setItem("to", toStation);

  window.location.href = "result.html";
});
