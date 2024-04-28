document.addEventListener('DOMContentLoaded', function() {
    checkCollections();
    document.getElementById('addPlantButton').addEventListener('click', addFigure);
});

function addFigure() {

    const newFigure = document.createElement("figure");
    
    const newImage = document.createElement("img");
    newImage.src = "../images/background/card2.jpg";
    newImage.alt = "New Image";
    newImage.width = 250; 
    newImage.height = 300; 
    
    const newCaption = document.createElement("figcaption");
    newCaption.textContent = "New Collection"; 
    
    newFigure.appendChild(newImage);
    newFigure.appendChild(newCaption);
    
    newFigure.addEventListener('click', function() {
        window.location.href = "./collection.html";
    });

    const collectionsDiv = document.querySelector(".collectionsPlace");
    collectionsDiv.appendChild(newFigure);

    checkCollections();
}

function checkCollections() {
    let container = document.getElementById('figurePlace');
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

/////////////////////////////////////////////////////////////////////////////////////

const facebookButton = document.getElementById('faceb');
const gitButton = document.getElementById('git');
const instaButton = document.getElementById('insta');
const twitterButton = document.getElementById('tw');

[facebookButton, gitButton, instaButton, twitterButton].forEach(button => {
    button.addEventListener('click', () => {
        const url = button.getAttribute('link');

        if(url){
            const newTab = window.open(url, '_blank');
            if (newTab) {
                newTab.focus();
            }
        }
    });
});


///////////////////////////////////////////////////////////////////////////////////////////////

const modal = document.getElementById('modal');
const editButton = document.getElementById('editButton');


editButton.addEventListener('click', () => {

    const userAddressElement = document.getElementById('userAddress');
    const addressText = userAddressElement.textContent.trim();
    const addressParts = addressText.split(', ');

    const city = addressParts[0]; 
    const street = addressParts[1].substring(7); 
    const number = addressParts[2].substring(3); 

    const nameInput = document.querySelector('input[name="name"]');
    const occupationInput = document.querySelector('input[name="occupation"]');
    const cityInput = document.querySelector('input[name="city"]');
    const streetInput = document.querySelector('input[name="street"]');
    const numberInput = document.querySelector('input[name="number"]');
    const facebookInput = document.querySelector('input[name="facebook"]');
    const githubInput = document.querySelector('input[name="github"]');
    const instagramInput = document.querySelector('input[name="Instagram"]');
    const twitterInput = document.querySelector('input[name="twitter"]');
  
    nameInput.value = document.getElementById('userName').textContent;
    occupationInput.value = document.getElementById('userOccupation').textContent;
    cityInput.value = city;
    streetInput.value = street;
    numberInput.value = number;
    facebookInput.value = facebookButton.getAttribute('link');
    githubInput.value = gitButton.getAttribute('link');
    instagramInput.value = instaButton.getAttribute('link');
    twitterInput.value = twitterButton.getAttribute('link');
  
    modal.style.display = 'flex';

});

document.querySelector('.close').addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
  if (event.target == modal) {
    modal.style.display = 'none';
  }
});


const form = document.querySelector('form');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const formDataJson = {};
  formData.forEach((value, key) => {
    formDataJson[key] = value;
  });

  fetch('/api/updateUser', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formDataJson)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to submit form');
    }
    console.log(formDataJson);

    facebookButton.setAttribute('link', formDataJson.facebook);
    gitButton.setAttribute('link', formDataJson.github);
    instaButton.setAttribute('link', formDataJson.Instagram);
    twitterButton.setAttribute('link', formDataJson.twitter);

    document.getElementById('userName').textContent  = formDataJson.name;
    document.getElementById('userOccupation').textContent  = formDataJson.occupation;
    document.getElementById('userAddress').textContent  = formDataJson.city + ', Strada ' + formDataJson.street + ', nr.' + formDataJson.number;

    console.log('Form submitted successfully');
  })
  .catch(error => {
    console.error('Error submitting form:', error);
  });

  modal.style.display = 'none';
});
