document.addEventListener("DOMContentLoaded", () => {
  const paymentForm = document.getElementById("paymentForm");
  const cardNumberInput = document.getElementById("card-number");
  const expiryInput = document.getElementById("expiry-date");
  const cvvInput = document.getElementById("cvv");
  const cardHolderInput = document.getElementById("cardholder-name");
  const displayAmount = document.getElementById("display-amount");

  const savedAmount = sessionStorage.getItem("amountToPay");

  if (savedAmount && displayAmount) {
    displayAmount.innerText = savedAmount.replace("₾", "").trim();
  }
  cardNumberInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/g, "");
    let formattedValue = "";

    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += " ";
      }
      formattedValue += value[i];
    }
    e.target.value = formattedValue.substring(0, 19);
  });

  cardHolderInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[0-9]/g, "");
  });

  expiryInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 2) {
      e.target.value = value.substring(0, 2) + "/" + value.substring(2, 4);
    } else {
      e.target.value = value;
    }
  });
  paymentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const inputs = paymentForm.querySelectorAll("input[required]");
    let isValid = true;

    inputs.forEach((input) => {
      if (!input.value.trim()) {
        input.style.borderColor = "red";
        isValid = false;
      } else {
        input.style.borderColor = "#ddd";
      }
    });

    const rawCardNumber = cardNumberInput.value.replace(/\s/g, "");
    if (rawCardNumber.length !== 16) {
      alert("ბარათის ნომერი უნდა შედგებოდეს 16 ციფრისგან!");
      return;
    }

    if (cvvInput.value.length !== 3) {
      alert("CVC კოდი უნდა იყოს 3 ციფრიანი!");
      return;
    }

    if (isValid) {
      const rawCard = cardNumberInput.value.replace(/\s/g, "");
      const maskedCard =
        rawCard.substring(0, 4) + "***********" + rawCard.substring(12);

      sessionStorage.setItem("cardHolder", cardHolderInput.value);
      sessionStorage.setItem("cardMask", maskedCard);
      alert("გადახდა წარმატებით დასრულდა!");
      window.location.href = "ticket.html";
    } else {
      alert("გთხოვთ შეავსოთ ყველა აუცილებელი ველი!");
    }
  });
});
