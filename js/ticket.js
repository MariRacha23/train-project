document.addEventListener("DOMContentLoaded", async () => {
  let rawTicketId = sessionStorage.getItem("lastTicketId");

  if (!rawTicketId) {
    console.error("ბილეთის ID ვერ მოიძებნა LocalStorage-ში");
    return;
  }

  const ticketId = rawTicketId.replace(/['"]+/g, "").split(":").pop().trim();

  const holderElem = document.getElementById("ticket-holder-name");
  const maskElem = document.getElementById("ticket-card-mask");
  const issueDateElem = document.getElementById("issue-date");

  if (holderElem)
    holderElem.innerText =
      sessionStorage.getItem("cardHolder") || "მფლობელი უცნობია";
  if (maskElem)
    maskElem.innerText =
      sessionStorage.getItem("cardMask") || "**** **** **** ****";
  if (issueDateElem)
    issueDateElem.innerText = new Date().toLocaleDateString("ka-GE");

  try {
    const response = await fetch(
      `https://railway.stepprojects.ge/api/tickets/checkstatus/${ticketId}`,
    );

    if (!response.ok) {
      throw new Error(`სერვერმა მონაცემები ვერ იპოვა: ${response.status}`);
    }

    const data = await response.json();
    console.log("სერვერის სრული პასუხი:", data);
    const setIfExists = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.innerText = value || "-";
    };

    setIfExists("ticket-id", data.id);
    setIfExists("dep-info", `${data.train.from} ${data.train.departure}`);
    setIfExists("arr-info", `${data.train.to} ${data.train.arrive}`);
    setIfExists("travel-date", data.date);
    setIfExists("ticket-email", data.email);

    const phoneElem = document.getElementById("ticket-phone");
    if (phoneElem) {
      const rawPhone = data.phone || data.phoneNumber || "";
      const cleanPhone = rawPhone.replace("+995", "");

      phoneElem.innerText = cleanPhone || "-";
    } else {
      setIfExists("ticket-phone", data.phoneNumber);
    }
    const rows = document.getElementById("passenger-rows");
    const finalAmountElem = document.getElementById("final-amount");

    if (rows) {
      rows.innerHTML = "";
      let total = 0;

      const passengers = data.persons || data.people || [];

      if (passengers.length > 0) {
        passengers.forEach((p) => {
          const price = Number(p.seat?.price) || 0;
          total += price;

          rows.innerHTML += `
                        <div class="passenger-row">
            <span data-label="სახელი">${p.name || "-"}</span>
            <span data-label="გვარი">${p.surname || "-"}</span>
            <span data-label="პირადი ნომერი">${p.idNumber || "-"}</span>
            <span data-label="ადგილი">${p.seat?.number || "-"}</span>
            <span data-label="ვაგონი">${p.seat?.vagonName || p.seat?.vagonId || "-"}</span>
        </div>
                    `;
        });

        if (finalAmountElem) {
          finalAmountElem.innerText = total + " ₾";
        }
      } else {
        rows.innerHTML =
          "<tr><td colspan='5'>მგზავრების მონაცემები არ არის</td></tr>";
      }
    }
  } catch (err) {
    console.error("ბილეთის ჩატვირთვის შეცდომა:", err);
  }
});

function downloadTicket() {
  window.print();
}
