document.addEventListener('DOMContentLoaded', function() {
    checkCollections();
    document.getElementById('addPlantButton').addEventListener('click', addFigure);
});

function addFigure() {

    const requestData = {
        clientId: clientID,
        badgeNumber: 2
      };
  
      fetch('/api/modifyBadge', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to modify badge value');
        }
      })
      .then(data => {
        console.log('Badge value modified successfully:', data);
      })
      .catch(error => {
        console.error('Error modifying badge value:', error);
      });

    fetch('/api/createPlantLayout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            clientId: clientID,
            collectionId: collectionsID 
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json(); 
        } else {
            throw new Error('Failed to create plant layout: ' + response.status);
        }
    })
    .then(data => {
        console.log('Plant layout created successfully:', data.id); 
        let anchor = document.createElement('a');
        anchor.href = "./PlantProfilePage.html"; 
        anchor.setAttribute('data-plant-id', data.id);
        anchor.addEventListener('click', function(event) {
            event.preventDefault(); 
            sessionStorage.setItem('data-plant-id', anchor.getAttribute('data-plant-id')); 
            window.location.href = './PlantProfilePage.html';
        });

        let figure = document.createElement('figure');
    
        let img = document.createElement('img');
        img.src = "../Images/website_Icon/LittleCactus.jpg";
        img.alt = "Cute Plant";
    
        let caption = document.createElement('figcaption');
        caption.textContent = 'Unnamed Plant';
    
        figure.appendChild(img);
        figure.appendChild(caption);
    
        anchor.appendChild(figure);
    
        document.querySelector('.container').appendChild(anchor);
        checkCollections();

        fetch('/api/modifyCollection', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ collectionId: collectionsID})
        })
        .then(response => {
            if (response.ok) {
                const currentDate = new Date();
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth() + 1; 
                const day = currentDate.getDate();

                const formattedDay = day < 10 ? '0' + day : day;
                const fromattedMonth = month < 10 ? '0' + month : month;

                document.getElementById('right').innerHTML  = document.getElementById('right').textContent.substring(0, 24) + '<br>Last Update: ' + formattedDay + '/' + fromattedMonth + '/' + year;
            } else{
                console.error('Failed to modify collection:', response.status);
            }
        });
    })
    .catch(error => {
        console.error('Error creating plant layout:', error);
    });
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

    if(key == 'isShared' && value == '1'){
        const requestData = {
            clientId: clientID,
            badgeNumber: 5
          };
      
          fetch('/api/modifyBadge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
          })
          .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to modify badge value');
            }
          })
          .then(data => {
            console.log('Badge value modified successfully:', data);
          })
          .catch(error => {
            console.error('Error modifying badge value:', error);
          });
    }

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
let collectionsID;

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
                collectionsID = information.collection_id;

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

async function fetchCollectionPlants(collectionID){
    fetch('/api/plantsOfCollection', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ collectionId: collectionID })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch collection data');
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
        if(data){
            createPlantSelect(data, 'family');
            createPlantSelect(data, 'genus');
            createPlantSelect(data, 'species');
            // createPlantSelect(data, 'collection_date');
            createPlantSelect(data, 'hashtags');
            createPlantSelect(data, 'place_of_collection');
            createPlantSelectColor(data);
            data.forEach(plant => {
                console.log('Plant data:', plant);
                createPlantLayout(plant);
            });   
        }     
    })
    .catch(error => {
        console.error('Error fetching collection data:', error);
    });
}

function createPlantLayout(plantData) {
    console.log('Plant layout created successfully:', plantData.plant_id);
    let anchor = document.createElement('a');
    anchor.href = "./PlantProfilePage.html"; 
    anchor.setAttribute('data-plant-id', plantData.plant_id);
    anchor.addEventListener('click', function(event) {
        event.preventDefault(); 
        sessionStorage.setItem('data-plant-id', anchor.getAttribute('data-plant-id')); 
        window.location.href = './PlantProfilePage.html';
    });

    let figure = document.createElement('figure');

    let img = document.createElement('img');
    img.src = "../Images/website_Icon/LittleCactus.jpg";
    img.alt = "Cute Plant";

    let caption = document.createElement('figcaption');
    caption.textContent = plantData.common_name || 'Unnamed Plant';

    figure.appendChild(img);
    figure.appendChild(caption);

    anchor.appendChild(figure);

    for (const [key, value] of Object.entries(plantData)) {
        anchor.setAttribute(`data-${key}`, value);
    }

    document.querySelector('.container').appendChild(anchor);
    checkCollections();
}



document.addEventListener('DOMContentLoaded', async() => {
    const collectionID = sessionStorage.getItem('data-collection-id'); 
  
    const searchDiv = document.getElementById('innersearch');

    searchDiv.addEventListener('change', function() {
        
        const anchors = document.querySelectorAll('.container a');
        console.log(searchDiv.children);


        anchors.forEach(anchor => {
            let hideElement = false;

                [...searchDiv.children].forEach(target => {
                    if (target.tagName === 'SELECT') {
                        const selectId = target.id.slice(0, -7); 
                        const anchorDataValue = anchor.getAttribute(`data-${selectId}`);
                        const selectedValue = target.value;

                        if(selectId == 'hashtags'){
                            if (selectedValue && selectedValue !== '' && !anchorDataValue.includes(selectedValue)) {
                                hideElement = true;
                            }
                        }else{
                            if (selectedValue && selectedValue !== '' && anchorDataValue !== selectedValue) {
                                hideElement = true;
                            }
                        }
                    }

            });

                const date = anchor.getAttribute(`data-collection_date`).substring(0,10);

                const startingDate = document.getElementById('start-date').value;
                const endingDate = document.getElementById('end-date').value;

                if(startingDate && startingDate > date){
                    hideElement = true;
                }
                if(endingDate && endingDate < date){
                    hideElement = true;
                }

                if(startingDate|| endingDate){
                    if(date == 'null' || date == ''){
                        console.log("yes1");
                        hideElement = true;
                    }
                }

                if(hideElement){
                    anchor.style.display = 'none';
                }else{
                    anchor.style.display = 'flex';
                }

            });

    });

    fetchCollectionData(collectionID);
    fetchCollectionPlants(collectionID);    
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

    divToMove.style.top = newTop + 'px';
});

const profileButton = document.getElementById('profile');

profileButton.addEventListener('click', () => {

    sessionStorage.setItem('clientID', clientID);
    window.location.href = './profile.html'; 
});


function createPlantSelectColor(plants) {
    const searchDiv = document.getElementById('innersearch');
    const selectElement = document.createElement('select');

    selectElement.id = 'color-select';
    selectElement.name = 'color-select';

    const defaultOption = document.createElement('option');
    defaultOption.value = ''; 
    defaultOption.text = 'Color'; 
    selectElement.appendChild(defaultOption);

    const uniqueColors = [...new Set(plants.map(plant => plant.color).filter(color => color))];

    uniqueColors.forEach(color  => {
        const option = document.createElement('option');
        option.value = color;
        option.text = color;
        option.style.backgroundColor = color; 
        selectElement.appendChild(option);
        
    });

    console.log(selectElement);

    searchDiv.appendChild(selectElement);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function createPlantSelect(plants, attribute) {
    const searchDiv = document.getElementById('innersearch');
    const selectElement = document.createElement('select');
    selectElement.id = `${attribute}-select`;
    selectElement.name = `${attribute}-select`;

    const defaultOption = document.createElement('option');
    defaultOption.value = ''; 
    if(attribute == 'place_of_collection')
    {
        defaultOption.text = `Collection Location`; 
    }else if(attribute == 'collection_date'){
        defaultOption.text = `Date Of Collection`; 
    }
    else{
        defaultOption.text = `${capitalizeFirstLetter(attribute)}`;
    } 
    selectElement.appendChild(defaultOption);

    let uniqueValues = [];
    if (attribute === 'hashtags' && plants.some(plant => plant[attribute])) {
        uniqueValues = [...new Set(plants.flatMap(plant => plant[attribute].split('#').map(tag => tag.trim()).filter(tag => tag !== '')))];
    } else {
        uniqueValues = [...new Set(plants.map(plant => plant[attribute]).filter(value => value !== null && value !== ''))];
    }

    uniqueValues.forEach(value => {
        const option = document.createElement('option');
        if(attribute == 'collection_date')
        {
            option.value = value.substring(0,10);
            option.text = value.substring(0,10); 
        }
        else{
            option.value = value;
            option.text = value;
        } 
        
        selectElement.appendChild(option);
    });

    searchDiv.appendChild(selectElement);
}


let displayValueCollection;

function toggleRotation(element) {
  element.classList.toggle('rotated');

  if (element.classList.contains('rotated')) {
    document.getElementById('innersearch').style.display = 'flex';
    document.getElementById('searchMiniTitle').style.display = 'flex';
    document.getElementById('searchTitle').style.display = 'none';
    document.getElementById('rotatingArrow').style.top = '-13%';
  } else {
    document.getElementById('innersearch').style.display = 'none';
    document.getElementById('searchMiniTitle').style.display = 'none';
    document.getElementById('searchTitle').style.display = 'flex';
    document.getElementById('rotatingArrow').style.top = '+10%';
  }

}