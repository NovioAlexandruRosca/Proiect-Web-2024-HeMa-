const initSlider = () => {
    const container = document.getElementById('container');
    const imageList = document.querySelector(".slider-wrapper .image-list");
    const slideButtons = document.querySelectorAll(".slider-wrapper .slide-button");
    const sliderScrollbar = document.querySelector("#container .slider-scrollbar");
    const scrollbarThumb = sliderScrollbar.querySelector(".scrollbar-thumb");
    const maxScrollLeft = imageList.scrollWidth - imageList.clientWidth;
    
    let scrollDirection = 1;

    // Auto slide function
    const autoSlide = () => {
        const scrollAmount = imageList.clientWidth/ 500 * scrollDirection;
        imageList.scrollBy({ left: scrollAmount, behavior: "smooth" });

    // Toggle scroll direction when reaching the sides of the image list
    if (imageList.scrollLeft >= maxScrollLeft) {
        scrollDirection = -1; // Change direction to left
    } else if (imageList.scrollLeft <= 0) {
        scrollDirection = 1; // Change direction to right
    }
    };

    // Set interval for auto slide (change 3000 to desired interval in milliseconds)
    let autoSlideInterval = setInterval(autoSlide, 50);

    // Stop auto slide on mouse enter
    container.addEventListener("mouseenter", () => {
        clearInterval(autoSlideInterval);
    });

    // Resume auto slide on mouse leave
    container.addEventListener("mouseleave", () => {
        autoSlideInterval = setInterval(autoSlide, 50);
    });

    // Slide images according to the slide button clicks
    slideButtons.forEach(button => {
        button.addEventListener("click", () => {
            const direction = button.id === "prev-slide" ? -1 : 1;
            const scrollAmount = imageList.clientWidth / 3 * direction;
            imageList.scrollBy({ left: scrollAmount, behavior: "smooth" });
        });
    });

     // Show or hide slide buttons based on scroll position
    const handleSlideButtons = () => {
        slideButtons[0].style.display = imageList.scrollLeft <= 0 ? "none" : "flex";
        slideButtons[1].style.display = imageList.scrollLeft >= maxScrollLeft ? "none" : "flex";
    }

    // Update scrollbar thumb position based on image scroll
    const updateScrollThumbPosition = () => {
        const scrollPosition = imageList.scrollLeft;
        const thumbPosition = (scrollPosition / maxScrollLeft) * (sliderScrollbar.clientWidth - scrollbarThumb.offsetWidth);
        scrollbarThumb.style.left = `${thumbPosition}px`;
    }

    // Call these two functions when image list scrolls
    imageList.addEventListener("scroll", () => {
        updateScrollThumbPosition();
        handleSlideButtons();
    });
}

window.addEventListener("resize", initSlider);
window.addEventListener("load", initSlider);


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