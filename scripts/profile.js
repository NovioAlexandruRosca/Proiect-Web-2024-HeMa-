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

    fetch('/api/createCollection', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      }
    }).then(response => {
      if (response.ok) {
          return response.json();
      } else {
          throw new Error('Failed to create collection');
      }
    }).then(data => {
        const collectionId = data.collectionId;
        newFigure.setAttribute('data-collection-id', collectionId);
        
    }).catch(error => {
        console.error('Error creating collection:', error);
    });

    newFigure.addEventListener('click', function() {
      window.location.href = "./collection.html";
      sessionStorage.setItem('data-collection-id', newFigure.getAttribute('data-collection-id'));
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

        if(url != null && url != ''){
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
    let street;
    let number;
    if(addressParts[1])
      street = addressParts[1].substring(7); 
    if(addressParts[2])
      number = addressParts[2].substring(3); 

    const nameInput = document.querySelector('input[name="name"]');
    const occupationInput = document.querySelector('input[name="occupation"]');
    const cityInput = document.querySelector('input[name="city"]');
    const streetInput = document.querySelector('input[name="street"]');
    const numberInput = document.querySelector('input[name="number"]');
    const facebookInput = document.querySelector('input[name="facebook"]');
    const githubInput = document.querySelector('input[name="github"]');
    const instagramInput = document.querySelector('input[name="Instagram"]');
    const twitterInput = document.querySelector('input[name="twitter"]');
  
    nameInput.value = document.getElementById('userName').textContent || '';
    occupationInput.value = document.getElementById('userOccupation').textContent || '';
    cityInput.value = city || '';
    streetInput.value = street || '';
    numberInput.value = number || '';
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

    facebookButton.setAttribute('link', formDataJson.facebook || '');
    gitButton.setAttribute('link', formDataJson.github || '');
    instaButton.setAttribute('link', formDataJson.Instagram || '');
    twitterButton.setAttribute('link', formDataJson.twitter || '');

    document.getElementById('userName').textContent  = formDataJson.name || '';
    document.getElementById('userOccupation').textContent  = formDataJson.occupation || '';
    document.getElementById('userAddress').textContent  = formDataJson.city + ', Strada ' + formDataJson.street + ', nr.' + formDataJson.number;

    let addressString = formDataJson.city;

    if (formDataJson.street) {
        addressString += ', Strada ' + formDataJson.street;
    }

    if (formDataJson.number) {
        addressString += ', nr.' + formDataJson.number;
    }

    document.getElementById('userAddress').textContent  = addressString;

    console.log('Form submitted successfully');
  })
  .catch(error => {
    console.error('Error submitting form:', error);
  });

  modal.style.display = 'none';
});

////////////////////////////////////////////////////////////////////////////////////

let userID;

async function fetchClientData(clientId) {

  fetch('/api/id', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  }).then((response) => {
      if(response.status === 200){
          userID = response.headers.get('userId');
      
          fetch('/api/clientData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clientId: clientId })
        })
        .then(response => {
          if (response.ok) {
              return response.json();
          } else {
              console.error('Failed to add comment:', response.status);
          }
      }).then(data => {
          
          console.log(data[0].client_id, userID);
    
          if(data[0].client_id == userID){
            document.getElementById('followButton').style.display = 'none';
          }else{
            document.getElementById('editButton').style.display = 'none';
          }
    
          facebookButton.setAttribute('link', data[0].facebook_link || '');
          gitButton.setAttribute('link', data[0].github_link || '');
          instaButton.setAttribute('link', data[0].instagram_link || '');
          twitterButton.setAttribute('link', data[0].twitter_link || '');
    
          document.getElementById('userName').textContent  = data[0].name || '';
          document.getElementById('userOccupation').textContent  = data[0].occupation || '';
    
          const clientData = data[0];
          let addressString = clientData.city;
    
          if (clientData.street) {
              addressString += ', Strada ' + clientData.street;
          }
    
          if (clientData.house_number) {
              addressString += ', nr.' + clientData.house_number;
          }
    
          document.getElementById('userAddress').textContent  = addressString;
        })
        .catch(error => {
          console.error('Error submitting form:', error);
        });
        }
  });
  
}

async function fetchClientCollections(clientId) {

  fetch('/api/id', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  }).then((response) => {
      if(response.status === 200){
          userID = response.headers.get('userId');
      
          fetch('/api/clientCollections', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clientId: clientId })
        })
        .then(response => {
          if (response.ok) {
              return response.json();
          } else {
              console.error('Failed to add comment:', response.status);
          }
      }).then(data => {
          
          data.forEach(item => {
            const newFigure = document.createElement("figure");
            
            const newImage = document.createElement("img");
            newImage.src = "../images/background/card2.jpg";
            newImage.alt = "New Image";
            newImage.width = 250; 
            newImage.height = 300; 
            
            const newCaption = document.createElement("figcaption");
            newCaption.textContent = item.name || ''; 
            
            newFigure.appendChild(newImage);
            newFigure.appendChild(newCaption);
            
            newFigure.setAttribute('data-collection-id', item.collection_id);

            newFigure.addEventListener('click', function() {
                window.location.href = "./collection.html";
                sessionStorage.setItem('data-collection-id', newFigure.getAttribute('data-collection-id'));
            });

            const collectionsDiv = document.querySelector(".collectionsPlace");
            collectionsDiv.appendChild(newFigure);
            
        });
            checkCollections();
        })
        .catch(error => {
          console.error('Error submitting form:', error);
        });
        }
  });
  
}


document.addEventListener('DOMContentLoaded', () => {
  const clientId = sessionStorage.getItem('clientID'); 

  fetchClientData(clientId);
  fetchClientCollections(clientId);
});
