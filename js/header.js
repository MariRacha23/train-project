async function loadHeader() {
  const path = window.location.pathname;
  const isIndex =
    path.includes("index.html") || path.endsWith("/") || path === "";
  const headerTag = document.querySelector("header");

  if (headerTag) {
    headerTag.innerHTML = `
            <nav class="geoReil ${isIndex ? "" : "other-page-nav"}">
                <div class="logo">
                    <a href="./index.html" ><img class="imgIcon" src="./imgs/favicon.png" alt="favicon"></a>
                    <a class="geotext" href="./index.html">საქართველოს რკინიგზა</a>
                </div>
   <div class="header-actions">
    <div id="userWelcome" class="welcome-text"></div>
    <button id="authBtn" class="auth-button">ავტორიზაცია</button>
    <button id="logoutBtn" class="logout-button" style="display:none;">გამოსვლა</button>
</div>
            </nav>

            <div class="modal-backdrop" id="authModalOverlay" style="display: none;">
                <div class="authCard" id="loginSection">
                    <div class="authHeader">
                        <h3>ავტორიზაცია</h3>
                        <p class="autHedText">გთხოვთ გაიაროთ ავტორიზაცია ბილეთის დასაჯავშნად</p>
                        <button class="close-modal" onclick="closeAuthModal()">✕</button>
                    </div>
                    <form class="authBody" id="loginForm" onsubmit="event.preventDefault(); handleLogin();">
                        <div class="inputGroup">
                            <label>ელ-ფოსტა</label>
                            <input type="email" id="loginEmail" placeholder="example@mail.com" required>
                        </div>
                        <div class="inputGroup">
                            <label>პაროლი</label>
                            <input type="password" id="loginPass" placeholder="******" required>
                        </div>
                        <div class="submitSoan" >
                        <button type="submit" class="submitBtn">შესვლა</button>
                        <div class="authFooter" >
                            <span >არ გაქვს ანგარიში? <a href="javascript:void(0)" onclick="toggleAuth('register')">რეგისტრაცია</a></span>
                        </div>
                        </div>
                    </form>
                </div>

                <div class="authCard" id="registerSection" style="display: none;">
                    <div class="authHeader">
                        <h3>რეგისტრაცია</h3>
                        <p>შექმენი ანგარიში მარტივი დაჯავშნისთვის</p>
                        <button class="close-modal" onclick="closeAuthModal()">✕</button>
                    </div>
                    <form class="authBody" id="registerForm" onsubmit="event.preventDefault(); signUp();">
                        <div class="rowInputs">
                            <div class="inputGroup"><label>სახელი</label><input type="text" id="regFirstName" required></div>
                            <div class="inputGroup"><label>გვარი</label><input type="text" id="regLastName" required></div>
                        </div>
                        <div class="rowInputs">
                            <div class="inputGroup"><label>ასაკი</label><input type="number" id="regAge" required></div>
                            <div class="inputGroup">
                                <label>სქესი</label>
                                <select id="regGender"><option value="MALE">MALE</option><option value="FEMALE">FEMALE</option></select>
                            </div>
                        </div>
                        <div class="inputGroup"><label>ტელეფონი</label><input type="text" id="regPhone" required></div>
                        <div class="inputGroup"><label>მისამართი</label><input type="text" id="regAddress" required></div>
                        <div class="rowInputs">
                            <div class="inputGroup"><label>Email</label><input type="email" id="regEmail" required></div>
                            <div class="inputGroup"><label>Zip-Code</label><input type="text" id="regZip" required></div>
                        </div>
                        <div class="inputGroup"><label>პაროლი</label><input type="password" id="regPass" required></div>
                        <input type="hidden" id="regAvatar" value="https://i.pravatar.cc/150">
                        <div class="reg">
                        <button type="submit" class="submitBtn">რეგისტრაცია</button>
                        <div class="authFooter">
                            <span>უკვე გაქვს ანგარიში? <a href="javascript:void(0)" onclick="toggleAuth('login')">შესვლა</a></span>
                        </div>
                        </div>
                    </form>
                </div>
            </div>

<div class="modal-backdrop" id="profileModalOverlay" style="display: none;">
    <div class="authCard profile-card">
        <div class="authHeader">
            <h3>ჩემი პროფილი</h3>
            <button class="close-modal" onclick="closeProfileModal()">✕</button>
        </div>
        <div class="authBody  profile-body" >
            <div id="profileDetails" class="profile-info">
                </div>
            
            <hr class="separator">
            
          <h4 class="change-pass-title">პაროლის შეცვლა</h4>
<form id="changePassForm" onsubmit="event.preventDefault(); changePassword();">
    <div class="inputGroup">
        <label>ძველი პაროლი</label>
        <input type="password" id="oldPass" required placeholder="******" class="profile-input">
    </div>
    <div class="inputGroup" >
        <label>ახალი პაროლი</label>
        <input type="password" id="newPass" required placeholder="******" class="profile-input">
    </div>
    <button type="submit" class="submitBtn profile-submit-btn">განახლება</button>
</form>
            
            <button class="logout-link" onclick="handleLogout()">სისტემიდან გამოსვლა</button>
        </div>
    </div>
</div>
        `;
  }

  document.getElementById("authBtn")?.addEventListener("click", () => {
    document.getElementById("authModalOverlay").style.display = "flex";
  });

  await getUserData();

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("userEmail");
    window.location.reload();
  });

  window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
}

function closeAuthModal() {
  document.getElementById("authModalOverlay").style.display = "none";
}

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

async function handleLogin() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPass").value;

  try {
    const res = await fetch("https://api.everrest.educata.dev/auth/sign_in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok && data.access_token) {
      sessionStorage.setItem("accessToken", data.access_token);

      let chatHistory = JSON.parse(sessionStorage.getItem("chatHistory")) || [];
      chatHistory.push({
        role: "assistant",
        content:
          "ავტორიზაცია წარმატებულია! ახლა შემიძლია დაგეხმაროთ რეისის შერჩევაში.",
      });
      sessionStorage.setItem("chatHistory", JSON.stringify(chatHistory));

      await getUserData();
      closeAuthModal();
      const pendingTrain = sessionStorage.getItem("selectedTrainId");

      if (pendingTrain) {
        window.location.href = "registration.html";
      } else {
        alert("ავტორიზაცია წარმატებულია!");
        window.location.reload();
      }
    } else {
      alert("შეცდომა: " + (data.message || "არასწორი მონაცემები"));
    }
  } catch (e) {
    alert("ბოდიში, მონაცემების წამოღება ვერ მოხერხდა. სცადეთ მოგვიანებით.");
  }
}

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

  try {
    const res = await fetch("https://api.everrest.educata.dev/auth/sign_up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userdata),
    });

    if (res.ok) {
      alert("რეგისტრაცია წარმატებულია! ახლა გაიარეთ ავტორიზაცია.");
      toggleAuth("login");
    } else {
      const err = await res.json();
      alert("შეცდომა: " + err.message);
    }
  } catch (e) {
    alert("ბოდიში, მონაცემების წამოღება ვერ მოხერხდა. სცადეთ მოგვიანებით.");
  }
}

async function getUserData() {
  const token = sessionStorage.getItem("accessToken");

  if (!token || token === "null" || token === "undefined") return;

  try {
    const res = await fetch("https://api.everrest.educata.dev/auth", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const user = await res.json();

      sessionStorage.setItem("userEmail", user.email);
      sessionStorage.setItem("userData", JSON.stringify(user));

      const authBtn = document.getElementById("authBtn");
      const logoutBtn = document.getElementById("logoutBtn");
      const welcome = document.getElementById("userWelcome");

      if (authBtn) authBtn.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "inline";
      if (welcome) {
        welcome.innerHTML = `<a href="javascript:void(0)" onclick="openProfileModal()">გამარჯობა, ${user.firstName}</a>`;
        welcome.style.display = "inline";
      }

      fillRegistrationInputs(user);
    } else if (res.status === 401 || res.status === 400) {
      sessionStorage.removeItem("accessToken");
    }
  } catch (e) {
    alert("ბოდიში, მონაცემების წამოღება ვერ მოხერხდა. სცადეთ მოგვიანებით.");
  }
}

function fillRegistrationInputs(user) {
  const elements = {
    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    fname: document.getElementById("fname-1"),
    lname: document.getElementById("lname-1"),
  };

  if (elements.email) elements.email.value = user.email || "";
  if (elements.phone) elements.phone.value = user.phone || "";

  setTimeout(() => {
    if (elements.fname) elements.fname.value = user.firstName || "";
    if (elements.lname) elements.lname.value = user.lastName || "";
  }, 200);
}

document.addEventListener("DOMContentLoaded", loadHeader);

window.openProfileModal = function () {
  const userData = JSON.parse(sessionStorage.getItem("userData"));
  const detailsContainer = document.getElementById("profileDetails");
  const lastTicketId = sessionStorage.getItem("lastTicketId");

  if (userData && detailsContainer) {
    let ticketHtml = "";
    if (lastTicketId) {
      const cleanId = lastTicketId.replace(/['"]+/g, "");
      ticketHtml = `
        <div class="last-ticket-box" >
          <p class="last-ticket-title" >🎫 ჩემი ჯავშანი </p>
          <a href="ticket.html" class="last-ticket-link">🔎 ბილეთის ნახვა </a>
        </div>
      `;
    }
    detailsContainer.innerHTML = `
            <p><strong>სახელი:</strong> ${userData.firstName} ${userData.lastName}</p>
            <p><strong>ელ-ფოსტა:</strong> ${userData.email}</p>
            <p><strong>ტელეფონი:</strong> ${userData.phone || "-"}</p>
            <p><strong>მისამართი:</strong> ${userData.address || "-"}</p>
            <p><strong>ასაკი:</strong> ${userData.age || "-"}</p>
            <p><strong>სქესი:</strong> ${userData.gender === "MALE" ? "მამრობითი" : userData.gender === "FEMALE" ? "მდედრობითი" : "-"}</p>
            ${ticketHtml}
        `;
  }
  document.getElementById("profileModalOverlay").style.display = "flex";
};

window.closeProfileModal = function () {
  document.getElementById("profileModalOverlay").style.display = "none";
};

async function changePassword() {
  const oldPassInput = document.getElementById("oldPass");
  const newPassInput = document.getElementById("newPass");
  const token = sessionStorage.getItem("accessToken");

  const oldPassword = oldPassInput ? oldPassInput.value : null;
  const newPassword = newPassInput ? newPassInput.value : null;

  if (!oldPassword || !newPassword) {
    alert("გთხოვთ შეავსოთ ორივე ველი");
    return;
  }
  try {
    const res = await fetch(
      "https://api.everrest.educata.dev/auth/change_password",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: oldPassword,
          newPassword: newPassword,
        }),
      },
    );

    const data = await res.json();

    if (res.ok) {
      alert("პაროლი წარმატებით შეიცვალა!");
      if (data.access_token) {
        sessionStorage.setItem("accessToken", data.access_token);
      }
      document.getElementById("changePassForm").reset();
      closeProfileModal();
    } else {
      alert("შეცდომა: " + (data.message || "ვერ მოხერხდა პაროლის შეცვლა"));
    }
  } catch (e) {
    alert("ბოდიში, მონაცემების წამოღება ვერ მოხერხდა. სცადეთ მოგვიანებით.");
  }
}

window.handleLogout = function () {
  sessionStorage.clear();
  window.location.href = "index.html";
};
