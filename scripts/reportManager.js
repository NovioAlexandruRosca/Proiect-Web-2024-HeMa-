document.addEventListener('DOMContentLoaded', () => {
    const apiBoxes = document.querySelectorAll('.api-box');

    apiBoxes.forEach(box => {
        const title = box.querySelector('.api-box-title');

        title.addEventListener('click', () => {
            box.classList.toggle('active');
        });
    });
});