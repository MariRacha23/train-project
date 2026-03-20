async function loadHeader() {
  
    const path = window.location.pathname;
    const isIndex = path.includes("index.html") || path.endsWith("/") || path === "";

    const headerTag = document.querySelector("header");

    if (headerTag) {
       
        if (isIndex) {
            headerTag.classList.add("headerImg");
        } else {
            headerTag.classList.remove("headerImg");
            headerTag.style.backgroundImage = "none"; 
        }

        headerTag.innerHTML = `
            <nav class="geoReil ${isIndex ? "" : "other-page-nav"}">
                <div class="logo">
                <a href="./index.html" class="hidenimg" ><img class="imgIcon" src="./imgs/favicon.png" alt="favicon"></a>
                    <a class="geotext" href="./index.html">საქართველოს რკინიგზა</a>
                </div>
                <button class="check-back">ბილეთების შემოწმება/დაბრუნება</button>
            </nav>
        `;
    }

    if (isIndex) {
        window.addEventListener("scroll", function () {
            const nav = document.querySelector(".geoReil");
            if (nav && window.scrollY > 50) {
                nav.classList.add("scrolled");
            } else if (nav) {
                nav.classList.remove("scrolled");
            }
        });
    }
}
document.addEventListener('DOMContentLoaded', loadHeader);