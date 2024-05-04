document.addEventListener('DOMContentLoaded', function() {
    checkCollections();
    document.getElementById('addPlantButton').addEventListener('click', addFigure);
});

function addFigure() {
    let anchor = document.createElement('a');
    anchor.href = "./PlantProfilePage.html"; 

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


document.getElementById('delete').addEventListener('click', () =>{

    const collection__id = sessionStorage.getItem('data-collection-id');

    fetch('/api/deleteCollection', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({collectionId: collection__id})
    })
    .then(response => {
        if (response.ok) {
            console.log('Collection deleted successfully');
        } else {
            console.error('Failed to delete collection:', response.status);
        }
    })
    .catch(error => {
        console.error('Error deleting collection:', error);
    });
    
    window.location.href = "./profile.html";
});

    const modal = document.getElementById('modal');
    const editButton = document.getElementById('edit');


    editButton.addEventListener('click', () => {
    
        const titleInput = document.querySelector('input[name="title"]');
        const descriptionInput = document.querySelector('input[name="description"]');
        const isSharedCheckbox = document.querySelector('input[name="isShared"]');

        titleInput.value = document.getElementById('titleText').textContent || '';
        descriptionInput.value = document.getElementById('descriptionText').textContent || '';

        const isSharedValue = document.getElementById('title').getAttribute('isShared');
        if (isSharedValue === '1') {
            isSharedCheckbox.checked = true;
        } else {
            isSharedCheckbox.checked = false;
        }

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

////////////////////////////////////////////////////////////////////////////////////


const form = document.querySelector('form');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const formDataJson = {};
  formData.forEach((value, key) => {
    formDataJson[key] = value;
  });

  formDataJson.collectionId = sessionStorage.getItem('data-collection-id');

  if (!form.elements.isShared.checked) {
    formDataJson.isShared = 0;
    }

        console.log(formDataJson);

        document.getElementById('titleText').textContent = formDataJson.title;
        document.title = formDataJson.title + ' | HeMa';
        document.getElementById('descriptionText').textContent = formDataJson.description;

        document.getElementById('title').setAttribute('isShared', formDataJson.isShared);

        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; 
        const day = currentDate.getDate();

        const formattedDay = day < 10 ? '0' + day : day;
        const fromattedMonth = month < 10 ? '0' + month : month;

        document.getElementById('right').innerHTML  = document.getElementById('right').textContent.substring(0, 24) + '<br>Last Update: ' + formattedDay + '/' + fromattedMonth + '/' + year;

        fetch('/api/updateCollection', {
            method: 'PUT',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify(formDataJson)
        })
        .then(response => {
            if (response.ok) {
                console.log('Collection Updated');
            } else {
                console.error('Failed to add comment:', response.status);
            }
          }).catch(error => {
            console.error('Error submitting form:', error);
        });
        

  modal.style.display = 'none';
});

let clientID;

async function fetchCollectionData(collectionID) {


    fetch('/api/id', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      }).then((response) => {
          if(response.status === 200){
            userID = response.headers.get('userId');
          
            fetch('/api/collectionData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ collectionId: collectionID })
            })
            .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                console.error('Failed to add comment:', response.status);
            }
            }).then(data => {
                    
                const information = data[0];

                console.log(information);

                clientID = information.client_id;

                if(information.client_id != userID){
                    document.getElementById('edit').style.display = 'none';
                    document.getElementById('delete').style.display = 'none';
                    document.getElementById('addPlantButton').style.display = 'none';
                  }
                  else{
                    document.getElementById('profile').style.display = 'none';
                  }

                document.getElementById('titleText').textContent = information.name;
                document.title = information.name + ' | HeMa';
                document.getElementById('descriptionText').textContent = information.description;

                document.getElementById('title').setAttribute('isShared', information.is_shared);

                const creationYear = information.creation_time.substring(0, 4);
                const creationMonth = information.creation_time.substring(5, 7); 
                const creationDay = information.creation_time.substring(8, 10);

                const modificationYear = information.modification_time.substring(0, 4);
                const modificationMonth = information.modification_time.substring(5, 7); 
                const modificationDay = information.modification_time.substring(8, 10);


                document.getElementById('right').innerHTML = 'Uploaded at: ' + creationDay + '/' + creationMonth + '/' + creationYear + '<br> Last Update:' + modificationDay + '/' + modificationMonth + '/' + modificationYear;
                document.getElementById('left').innerHTML = 'Author: ' + information.clientName;

            })
            .catch(error => {
                console.error('Error submitting form:', error);
            });
        }
    });
}


document.addEventListener('DOMContentLoaded', () => {
    const collectionID = sessionStorage.getItem('data-collection-id'); 
  
    fetchCollectionData(collectionID);
  });
  

const divToMove = document.getElementById('addPlantButton');
const windowHeight = window.innerHeight;
const divTopOffset = divToMove.offsetTop;

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    let newTop = divTopOffset - scrollY;

    if (newTop <= 90) {
        newTop = 60 + scrollY;
    } 
    console.log(newTop);

    divToMove.style.top = newTop + 'px';
});

const profileButton = document.getElementById('profile');

profileButton.addEventListener('click', () => {

    sessionStorage.setItem('clientID', clientID);
    window.location.href = './profile.html'; 
});