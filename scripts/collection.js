document.addEventListener('DOMContentLoaded', function() {
    checkCollections();
    document.getElementById('addPlantButton').addEventListener('click', addFigure);
});

function addFigure() {
    let anchor = document.createElement('a');
    anchor.href = "../html/PlantProfilePage.html"; 
    anchor.setAttribute('target', '_blank'); 

    let figure = document.createElement('figure');

    let img = document.createElement('img');
    img.src = "../Images/website_Icon/LittleCactus.jpg";
    img.alt = "Cute Plant";

    let caption = document.createElement('figcaption');
    caption.textContent = 'Cute Plant';

    figure.appendChild(img);
    figure.appendChild(caption);

    anchor.appendChild(figure);

    document.querySelector('.container').appendChild(anchor);
    checkCollections();
}

function checkCollections() {
    let container = document.getElementById('collectionContainer');
    let messageExists = container.querySelector('.no-collections-message');
    let figuresExist = container.getElementsByTagName('figure').length > 0;

    if (!figuresExist && !messageExists) {
        let message = document.createElement('p');
        message.className = 'no-collections-message';
        message.textContent = 'No collections made yet.';
        container.appendChild(message);
    } else if (figuresExist && messageExists) {
        container.removeChild(messageExists);
    }

    if (messageExists) {
        messageExists.style.display = figuresExist ? 'none' : 'block';
    }
}