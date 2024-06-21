const initSlider = () => {
    const container = document.getElementById('container');
    const imageList = document.querySelector(".slider-wrapper .image-list");
    const slideButtons = document.querySelectorAll(".slider-wrapper .slide-button");
    const sliderScrollbar = document.querySelector("#container .slider-scrollbar");
    const scrollbarThumb = sliderScrollbar.querySelector(".scrollbar-thumb");
    const maxScrollLeft = imageList.scrollWidth - imageList.clientWidth;
    
    let scrollDirection = 1;

    const autoSlide = () => {
        const scrollAmount = imageList.clientWidth/ 500 * scrollDirection;
        imageList.scrollBy({ left: scrollAmount, behavior: "smooth" });

    if (imageList.scrollLeft >= maxScrollLeft) {
        scrollDirection = -1;
    } else if (imageList.scrollLeft <= 0) {
        scrollDirection = 1; 
    }
    };

    let autoSlideInterval = setInterval(autoSlide, 50);

    container.addEventListener("mouseenter", () => {
        clearInterval(autoSlideInterval);
    });

    container.addEventListener("mouseleave", () => {
        autoSlideInterval = setInterval(autoSlide, 50);
    });

    slideButtons.forEach(button => {
        button.addEventListener("click", () => {
            const direction = button.id === "prev-slide" ? -1 : 1;
            const scrollAmount = imageList.clientWidth / 3 * direction;
            imageList.scrollBy({ left: scrollAmount, behavior: "smooth" });
        });
    });

    const handleSlideButtons = () => {
        slideButtons[0].style.display = imageList.scrollLeft <= 0 ? "none" : "flex";
        slideButtons[1].style.display = imageList.scrollLeft >= maxScrollLeft ? "none" : "flex";
    }

    const updateScrollThumbPosition = () => {
        const scrollPosition = imageList.scrollLeft;
        const thumbPosition = (scrollPosition / maxScrollLeft) * (sliderScrollbar.clientWidth - scrollbarThumb.offsetWidth);
        scrollbarThumb.style.left = `${thumbPosition}px`;
    }

    imageList.addEventListener("scroll", () => {
        updateScrollThumbPosition();
        handleSlideButtons();
    });
}

window.addEventListener("resize", initSlider);
window.addEventListener("load", () => {
    setTimeout(initSlider, 2000);
});


let loginClients = document.getElementById("loginClients");
let loginAdmin = document.getElementById("loginAdmin");
let registerClients = document.getElementById("registerClients");

loginClients.addEventListener('click', function (event) {
    localStorage.setItem('clientIsAdmin', 'false');
    window.location.href = '/login.html';
});

loginAdmin.addEventListener('click', function (event) {
    localStorage.setItem('clientIsAdmin', 'true');
    window.location.href = '/login.html';
});

registerClients.addEventListener('click', function (event) {
    window.location.href = '/register.html';
});