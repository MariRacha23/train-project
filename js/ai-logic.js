const getChatHistory = () =>
  JSON.parse(sessionStorage.getItem("chatHistory")) || [];

document.addEventListener("DOMContentLoaded", () => {
  const chatMessages = document.getElementById("chat-messages");
  const history = getChatHistory();
  if (chatMessages && history.length > 0) {
    chatMessages.innerHTML = "";
    history.forEach((msg) => {
      const div = document.createElement("div");
      div.className = msg.role === "user" ? "user-msg" : "ai-msg";
      div.innerHTML = `<b>${msg.role === "user" ? "თქვენ" : "AI"}:</b> ${msg.content}`;
      chatMessages.appendChild(div);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

async function typeWriter(text, element) {
  let i = 0;
  element.innerHTML = "<b>AI:</b> ";
  return new Promise((resolve) => {
    function type() {
      if (i < text.length) {
        element.innerHTML += text.charAt(i);
        i++;
        setTimeout(type, 10);
        const chatBox = document.getElementById("chat-messages");
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
      } else {
        resolve();
      }
    }
    type();
  });
}

function getDayNameFromDate(dateString) {
  const days = [
    "კვირა",
    "ორშაბათი",
    "სამშაბათი",
    "ოთხშაბათი",
    "ხუთშაბათი",
    "პარასკევი",
    "შაბათი",
  ];
  const d = new Date(dateString);
  return days[d.getDay()];
}

window.sendMessage = async function (event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const input = document.getElementById("userInput");
  const chatMessages = document.getElementById("chat-messages");
  if (!input || !input.value.trim()) return;

  const userText = input.value.trim();

  const token = sessionStorage.getItem("accessToken");
  if (!token) {
    chatMessages.innerHTML += `<div class="user-msg"><b>თქვენ:</b> ${userText}</div>`;
    input.value = "";
    const authMsg =
      "სამწუხაროდ, თქვენ არ ხართ ავტორიზებული. გთხოვთ, გაიაროთ რეგისტრაცია ან ავტორიზაცია ზედა მენიუდან, რის შემდეგაც შევძლებ თქვენს დახმარებას ბილეთების დაჯავშნაში. 😊";

    const aiMsgDiv = document.createElement("div");
    aiMsgDiv.className = "ai-msg";
    chatMessages.appendChild(aiMsgDiv);

    await typeWriter(authMsg, aiMsgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return;
  }

  chatMessages.innerHTML += `<div class="user-msg"><b>თქვენ:</b> ${userText}</div>`;
  input.value = "";
  chatMessages.scrollTop = chatMessages.scrollHeight;

  let history = JSON.parse(sessionStorage.getItem("chatHistory")) || [];
  history.push({ role: "user", content: userText });

  const systemPrompt = `შენ ხარ საქართველოს რკინიგზის ასისტენტი. 
მიმდინარე წელია: 2026.

მკაცრი ინსტრუქცია რეისის არჩევის შემდეგ:
როგორც კი მომხმარებელი აირჩევს რეისს (მაგ: #812), შენი პასუხი აუცილებლად უნდა შეიცავდეს ტექსტს ზუსტად ამ ფორმატით:

"ძალიან კარგია! რეისი # [ნომერი] არჩეულია. 
რეგისტრაციისთვის გთხოვთ მომწეროთ შემდეგი მონაცემები სრულად:
• სახელი და გვარი
• პირადი ნომერი (11 ციფრი)
• ელ-ფოსტა
• ტელეფონის ნომერი"

წესები:
1. არასოდეს დაწერო მხოლოდ "მომწერეთ მონაცემები". ყოველთვის ჩამოთვალე ეს 4 პუნქტი.
2. ძებნისთვის: [ACTION: SEARCH(საიდან, სად, YYYY-MM-DD)].
3. მონაცემების მიღებისას: [ACTION: FILL_PASSENGER(სახელი, გვარი, პ/ნ, მეილი, ტელეფონი)].`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "anthropic-dangerous-direct-browser-access": "true",
        "x-api-key":
          "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        system: systemPrompt,
        messages: history.slice(-10),
      }),
    });
    const data = await response.json();
    const aiResponse = data.content[0].text;
    const cleanText = aiResponse.replace(/\[ACTION:.*?\]/g, "").trim();

    if (aiResponse.includes("[ACTION: SEARCH")) {
      const match = aiResponse.match(/\[ACTION: SEARCH\((.*?)\)\]/);
      if (match) {
        const [from, to, aiDate] = match[1].split(",").map((s) => s.trim());

        const tempDate = new Date(aiDate);
        const dayName = weekDays[tempDate.getDay()];

        sessionStorage.setItem("from", from);
        sessionStorage.setItem("to", to);
        sessionStorage.setItem("selectedDay", dayName);

        sessionStorage.setItem("selectedDate", aiDate);
        sessionStorage.setItem("fullBookingDate", aiDate);
        const trains = await window.performAiSearch(from, to, aiDate);

        let trainList = `ვიპოვე რეისები ${aiDate} (${dayName}):<br>`;
        if (trains && trains.length > 0) {
          trains.forEach((t) => {
            trainList += `🕒 ${t.departure} | #${t.number} <button class="select-train-btn" onclick="selectAiTrain('${t.id}', '${dayName}', '${t.number}')">არჩევა</button><br>`;
          });
        } else {
          trainList = "სამწუხაროდ, ამ მიმართულებით რეისები ვერ მოიძებნა.";
        }

        appendAiMessage(trainList, chatMessages);
        saveHistory(history, cleanText || "ვეძებ რეისებს...");
        return;
      }
    }
    if (aiResponse.includes("[ACTION: FILL_PASSENGER")) {
      const match = aiResponse.match(/\[ACTION: FILL_PASSENGER\((.*?)\)\]/);
      if (match) {
        const p = match[1].split(",").map((s) => s.trim());
        sessionStorage.setItem(
          "pendingPassengerData",
          JSON.stringify({
            firstName: p[0],
            lastName: p[1],
            pn: p[2],
            email: p[3],
            phone: p[4],
          }),
        );
        appendAiMessage(
          "მონაცემები შენახულია! გადაგიყვანთ რეგისტრაციაზე...",
          chatMessages,
        );
        setTimeout(() => (window.location.href = "registration.html"), 1500);
        return;
      }
    }

    if (cleanText) {
      const aiMsgDiv = document.createElement("div");
      aiMsgDiv.className = "ai-msg";
      chatMessages.appendChild(aiMsgDiv);
      await typeWriter(cleanText, aiMsgDiv);
      saveHistory(history, cleanText);
    }
  } catch (e) {
    chatMessages.innerHTML += `<div class="ai-msg" style="color: red;"><b>შეცდომა:</b> კავშირი ვერ დამყარდა.</div>`;
  }
};

function appendAiMessage(html, container) {
  const div = document.createElement("div");
  div.className = "ai-msg";
  div.innerHTML = `<b>AI:</b> ${html}`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function saveHistory(history, text) {
  history.push({ role: "assistant", content: text });
  sessionStorage.setItem("chatHistory", JSON.stringify(history.slice(-20)));
}

window.aiSearchTrains = async function (from, to, date) {
  try {
    const parts = date.match(/(\d+)/g);
    if (!parts || parts.length < 3) {
      return [];
    }

    let d;
    if (parts[0].length === 4) {
      d = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      d = new Date(parts[2], parts[1] - 1, parts[0]);
    }

    if (isNaN(d.getTime())) {
      return [];
    }

    const dayNames = [
      "კვირა",
      "ორშაბათი",
      "სამშაბათი",
      "ოთხშაბათი",
      "ხუთშაბათი",
      "პარასკევი",
      "შაბათი",
    ];
    const day = dayNames[d.getDay()];

    const apiUrl = `https://railway.stepprojects.ge/api/trains?day=${encodeURIComponent(day)}`;
    const res = await fetch(apiUrl);

    if (!res.ok) throw new Error("სერვერიდან პასუხი არ მოვიდა");

    const data = await res.json();

    const filtered = data.filter((t) => {
      const searchFrom = from.toLowerCase().trim().substring(0, 3);
      const searchTo = to.toLowerCase().trim().substring(0, 3);

      const dbFrom = t.from.toLowerCase();
      const dbTo = t.to.toLowerCase();

      return dbFrom.includes(searchFrom) && dbTo.includes(searchTo);
    });

    return filtered.slice(0, 3);
  } catch (e) {
    return [];
  }
};

window.aiSelectSeatManual = async function (seatLabel, className = "") {
  if (typeof window.openSeatModal === "function") window.openSeatModal(1);
  await new Promise((r) => setTimeout(r, 1000));

  const wagonBtns = document.querySelectorAll(".wagon-hover-btn");
  let targetWagon =
    [...wagonBtns].find((b) =>
      b.innerText.toLowerCase().includes(className.toLowerCase()),
    ) || wagonBtns[0];

  if (targetWagon) {
    targetWagon.click();
    await new Promise((r) => setTimeout(r, 1500));
  }

  const seats = document.querySelectorAll(".seat.available");
  const seat = [...seats].find(
    (s) => s.innerText.trim().toUpperCase() === seatLabel.toUpperCase(),
  );

  if (seat) {
    seat.click();
    setTimeout(() => window.closeSeatModal?.(), 1000);
  }
};

window.aiFillPassenger = function (index, fname, lname, pn, email, phone) {
  const cleanValue = (val) => {
    if (!val) return "";
    return val
      .replace(/^[a-zA-Z_]+="/, "")
      .replace(/"$/, "")
      .replace(/^(სახელი|გვარი|ტელეფონი|პ\/ნ|მეილი):\s*/gi, "")
      .trim();
  };

  const fields = {
    [`fname-${index}`]: cleanValue(fname),
    [`lname-${index}`]: cleanValue(lname),
    [`pn-${index}`]: cleanValue(pn),
    email: cleanValue(email),
    phone: cleanValue(phone),
  };

  for (const [id, val] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el && val) {
      el.value = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
};

window.selectAiTrain = function (id, date, number) {
  sessionStorage.setItem("selectedTrainId", id);
  let history = getChatHistory();

  const msgUser = `ავირჩიე რეისი #${number}`;
  const msgAi = `ძალიან კარგია! რეისი #${number} არჩეულია. 
  რეგისტრაციისთვის გთხოვთ მომწეროთ შემდეგი მონაცემები სრულად:
  • სახელი და გვარი
  • პირადი ნომერი (11 ციფრი)
  • ელ-ფოსტა
  • ტელეფონის ნომერი`;

  const chatMessages = document.getElementById("chat-messages");
  chatMessages.innerHTML += `<div class="user-msg"><b>თქვენ:</b> ${msgUser}</div>`;
  chatMessages.innerHTML += `<div class="ai-msg"><b>AI:</b> ${msgAi.replace(/\n/g, "<br>")}</div>`;

  history.push(
    { role: "user", content: msgUser },
    { role: "assistant", content: msgAi },
  );
  sessionStorage.setItem("chatHistory", JSON.stringify(history));
  chatMessages.scrollTop = chatMessages.scrollHeight;
};

window.toggleChat = () => {
  const chatWindow = document.getElementById("chat-window");
  const chatMessages = document.getElementById("chat-messages");
  if (!chatWindow) return;
  const isVisible = chatWindow.style.display === "flex";
  if (isVisible) {
    chatWindow.style.display = "none";
    sessionStorage.removeItem("chatHistory");
    sessionStorage.removeItem("selectedTrainId");
    sessionStorage.removeItem("selectedTrainNumber");
    sessionStorage.removeItem("pendingPassengerData");
    sessionStorage.removeItem("selectedDay");
    if (chatMessages) {
      chatMessages.innerHTML = `
                <div class="ai-msg">
                    <b>AI:</b> გამარჯობა! რით შემიძლია დაგეხმაროთ?
                </div>`;
    }
  } else {
    chatWindow.style.display = "flex";
  }
};

window.handleKeyPress = (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    window.sendMessage(e);
  }
};
