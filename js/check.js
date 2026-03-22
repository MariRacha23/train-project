let currentTicketId = "";

async function checkTicket() {
  const input = document.getElementById("ticket-id-input");
    const id = input.value.trim();
    
    if (!id) return alert("გთხოვთ შეიყვანოთ ბილეთის ნომერი");

  try {
    const res = await fetch(
      `https://railway.stepprojects.ge/api/tickets/checkstatus/${id}`,
    );
    if (!res.ok) {
            throw new Error("ბილეთი ამ ნომრით ვერ მოიძებნა");
        }
    const data = await res.json();
    currentTicketId = data.id;

   const container = document.getElementById("ticket-result-container");
        container.style.display = "block";
        renderTicketDetails(data);

  } catch (err) {
        alert(err.message);
        document.getElementById("ticket-result-container").style.display = "none";
    }
}

async function cancelTicket(id) {
  if (!confirm("დარწმუნებული ხართ, რომ გსურთ ბილეთის გაუქმება?")) return;

  try {
    const res = await fetch(`https://railway.stepprojects.ge/api/tickets/cancel/${currentTicketId}`, {
            method: "DELETE"
        });

   if (res.ok) {
    const container = document.getElementById("ticket-result-container");
    container.innerHTML = `
        <div class="success-cancel-message">
            <div class="check-icon">✓</div>
            <h1 class="success-title">ბილეთი წარმატებით გაუქმდა</h1>
            <p class="success-text">თანხა დაგიბრუნდებათ ანგარიშზე 2-3 სამუშაო დღეში.</p>
        </div>
    `;
        } else {
            alert("ბილეთის გაუქმება ვერ მოხერხდა. შესაძლოა მატარებლის გასვლამდე ცოტა დროა დარჩენილი.");
        }
    } catch (err) {
        alert("სერვერის შეცდომა!");
    }
}


function renderTicketDetails(data) {
    const container = document.getElementById("invoice-to-print");
    
    container.innerHTML = `
    <div class="invoice-box">
        <div class="header">
            <h2>Step Railway</h2>
            <img src="./imgs/stepLogo.jpg" alt="Logo" width="70px">
        </div>

        <div class="ticket-meta">
            <p>ბილეთის ნომერი: <span>${data.id}</span></p>
            <p>გაცემის თარიღი: <span>${new Date().toLocaleDateString("ka-GE")}</span></p>
        </div>

        <div class="travel-details">
            <div>გამგზავრება: <br><strong>${data.train.from} - ${data.train.departure}</strong></div>
            <div>ჩასვლა: <br><strong>${data.train.to} - ${data.train.arrive}</strong></div>
            <div>თარიღი: <br><strong>${data.date}</strong></div>
        </div>

        <div class="contact-section">
            <h3>საკონტაქტო ინფორმაცია:</h3>
            <div class="contact-details">
                <div class="contact-box"><strong>იმეილი:</strong> <span>${data.email || '---'}</span></div>
                <div class="contact-box"><strong>ტელეფონი:</strong> <span>${data.phone || '---'}</span></div>
            </div>
        </div>

        <div class="passengers-section">
            <h3 class="passengersList">მგზავრები:</h3>
            
            <div class="passengers-header">
                <div>სახელი</div>
                <div>გვარი</div>
                <div>პირადი ნომერი</div>
                <div>ადგილი</div>
            </div>

            <div id="passenger-rows">
                ${(data.persons && Array.isArray(data.persons)) ? data.persons.map(p => `
                    <div class="passenger-row">
                        <span data-label="სახელი">${p.name || "-"}</span>
                        <span data-label="გვარი">${p.surname || "-"}</span>
                        <span data-label="პირადი ნომერი">${p.idNumber || "-"}</span>
                        <span data-label="ადგილი">${p.seat?.number || p.seatId || "---"}</span>
                    </div>
                `).join('') : '<div class="no-data">მგზავრების მონაცემები არ მოიძებნა</div>'}
            </div>
        </div>
    </div>
`;
}