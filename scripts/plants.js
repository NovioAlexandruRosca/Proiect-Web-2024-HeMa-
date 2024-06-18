let plantID;
let collectionID;
let plantsclientID;
let connectedclientID;

const collectionButton = document.getElementById('button1');
const editButton = document.getElementById('button2');
const deleteButton = document.getElementById('button3');

const hashtags = document.getElementById('hashtags');
const collectionName = document.getElementById('collection-name');
const dateOfCollection = document.getElementById('date-collection');
const collectorName = document.getElementById('collector');
const commonName = document.getElementById('common-name');
const scientificName = document.getElementById('scientific-name');
const family = document.getElementById('family');
const genus = document.getElementById('genus');
const species = document.getElementById('species');
const place = document.getElementById('place');
const color = document.getElementById('color-plant');

const floatingMessage = document.querySelector('.floating-message');
const labels = document.querySelectorAll('.label');

const modal = document.getElementById('modal');

const form = document.querySelector('form');



document.addEventListener('DOMContentLoaded', () => {

    plantID = document.location.href.split('?id=')[1];
    console.log(plantID);

    // plantID = sessionStorage.getItem('data-plant-id'); 
    
    updatePlantVisit(plantID);
    fetchPlantData(plantID);
    fetchAvatar(plantID);
});

async function updatePlantVisit(plantId) {
    try {
      const response = await fetch(`/api/updatePlantVisits`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plantId }) 
      });
  
      if (response.ok) {
        const data = await response.text();
        console.log(data); 
      } else {
        console.error('Error updating plant visit:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

function handleDataForElement(element, data) {
    if (data != '' && data != null) {
        if (element.id === 'color-plant') {
            element.style.backgroundColor = data;
            element.textContent = data;
        } else {
            element.textContent = data;
        }
        element.style.display = 'block';
        const closestLabel = element.closest('.form-group').querySelector('label');
        if (closestLabel) {
            closestLabel.style.display = 'block';
        }
    } else {
        element.style.display = 'none';
        const closestLabel = element.closest('.form-group').querySelector('label');
        if (closestLabel) {
            closestLabel.style.display = 'none';
        }
    }
}

async function fetchPlantData(plantID){
    fetch('/api/id', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      }).then((response) => {
          if(response.status === 200){
            connectedclientID = response.headers.get('userId');
          
            fetch('/api/plantData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ plantId: plantID })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch collection data');
                }
                return response.json();
            })
            .then(data => {
                console.log(data);   
                plantsclientID = data.owner_id; 
                collectionID = data.collection_id;

                if(plantsclientID != connectedclientID){
                    editButton.style.display = 'none';
                    deleteButton.style.display ='none';
                }

                
                handleDataForElement(commonName, data.common_name);
                handleDataForElement(scientificName, data.scientific_name);
                handleDataForElement(family, data.family);
                handleDataForElement(genus, data.genus);
                handleDataForElement(species, data.species);
                handleDataForElement(place, data.place_of_collection);
                handleDataForElement(color, data.color);


                hashtags.textContent = data.hashtags;
                collectionName.textContent = data.title;
                if(data.collection_date)
                    dateOfCollection.textContent = data.collection_date.substring(0, 10);
                else
                    dateOfCollection.textContent = '';
                collectorName.textContent = data.user;
                // commonName.textContent = data.common_name;
                // scientificName.textContent = data.scientific_name;
                // family.textContent = data.family;
                // genus.textContent = data.genus;
                // species.textContent = data.species;
                // place.textContent = data.place_of_collection;
                // color.textContent = data.color;

            })
    .catch(error => {
        console.error('Error fetching collection data:', error);
    });
    }
});
}

async function fetchAvatar(plantID) {
    try {
        const response = await fetch(`/api/plantAvatar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ plantId: plantID })
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch avatar');
        }
  
        const imageUrl = await response.json();
  
        if (imageUrl.image != `null`) {
            const avatarElement = document.getElementById('plantAvatar');
            avatarElement.src = imageUrl.image;
        }else{
            const avatarElement = document.getElementById('plantAvatar');
            avatarElement.src = `../Images/website_Icon/LittleCactus.jpg`;
        }
    } catch (error) {
        console.error('Error fetching avatar:', error);
    }
  }

/////////////////////

collectionButton.addEventListener('click', function() {
    sessionStorage.setItem('data-collection-id', collectionID);
    window.location.href = "./collection.html";
});

/////////////////////

editButton.addEventListener('click', () => {

    const hashtagsInput = document.getElementById('hashtags1');
    const dateCollectionInput = document.getElementById('date-collection1');
    const commonNameInput = document.getElementById('common-name1');
    const scientificNameInput = document.getElementById('scientific-name1');
    const familyInput = document.getElementById('family1');
    const genusInput = document.getElementById('genus1');
    const speciesInput = document.getElementById('species1');
    const placeInput = document.getElementById('place1');
    const colorInput = document.getElementById('color-plant1');
    
    hashtagsInput.value = hashtags.textContent || '';
    dateCollectionInput.value = dateOfCollection.textContent || '';
    commonNameInput.value = commonName.textContent || '';
    scientificNameInput.value = scientificName.textContent || '';
    familyInput.value = family.textContent || '';
    genusInput.value = genus.textContent || '';
    speciesInput.value = species.textContent || '';
    placeInput.value = place.textContent || '';
    colorInput.value = color.textContent || '';
    
  
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

/////////////////////

deleteButton.addEventListener('click', function() {
    fetch('/api/deletePlant', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plantId: plantID })
    })
    .then(response => {
        if (response.ok) {

            fetch('/api/modifyCollection', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ collectionId: collectionID})
            })
            .then(response => {
                if (!response.ok) {
                    console.error('Failed to modify collection:', response.status);
                }
            });
            sessionStorage.setItem('data-collection-id', collectionID);
            window.location.href = "./collection.html";
        } else {
            console.error('Failed to delete plant:', response.status);
        }
    })
    .catch(error => {
        console.error('Error deleting plant:', error);
    });
});

/////////////////////

labels.forEach(label => {

    function setFloatingMessageContent(description) {
        floatingMessage.textContent = description;
    }

    label.addEventListener('mousemove', (event) => {

        switch (label.textContent) {
            case 'Hashtags':
                setFloatingMessageContent('These are the hashtags associated with the plant');
                break;
            case 'Collection Name':
                setFloatingMessageContent('The name of the collection where the plant belongs');
                break;
            case 'Date Of Collection':
                setFloatingMessageContent('The date when the plant was collected');
                break;
            case 'Collector Name':
                setFloatingMessageContent('The name of the person who collected the plant');
                break;
            case 'Common Name':
                setFloatingMessageContent('The common name of the plant');
                break;
            case 'Scientific Name':
                setFloatingMessageContent('The scientific name of the plant');
                break;
            case 'Family':
                setFloatingMessageContent('The family from which the plant is');
                break;
            case 'Genus':
                setFloatingMessageContent('The genus name of the plant');
                break;
            case 'Species':
                setFloatingMessageContent('The species name of the plant');
                break;
            case 'Place':
                setFloatingMessageContent('The place where the plant was collected');
                break;
            case 'Color':
                setFloatingMessageContent('The color of the plant');
                break;
            default:
                setFloatingMessageContent('Unknown label');
        }

        const mouseX = event.clientX;
        const mouseY = event.clientY;

        const scrollX = document.documentElement.scrollLeft;
        const scrollY = document.documentElement.scrollTop;

        floatingMessage.style.left = mouseX + scrollX + 30 + 'px'; 
        floatingMessage.style.top = mouseY + scrollY + 'px';

        floatingMessage.style.display = 'block';

        label.addEventListener('mouseleave', () => {
        floatingMessage.style.display = 'none';
        });

    });
});

/////////////////////


form.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(form);


formData.forEach((value, key) => {
        if(key == "commonName" && value){
          const trefleToken = "YeJ9rZCmWhqwEJ9f1d06MWdO048SvVcewd7nJlWt4TU";
        
          const url = 'https://api.allorigins.win/get?url=' + encodeURIComponent(`https://trefle.io/api/v1/plants/search?token=${trefleToken}&q=${value}`);
        
          fetch(url)
            .then(response => {
              if (!response.ok) {
                throw new Error('Failed to fetch plant data');
              }
              return response.json();
            })
            .then(data => {
        
              const responseData = JSON.parse(data.contents);
              if(responseData.data.length == 0){
                  console.log("No plant");
              }else
              {
                console.log(responseData.data[0].scientific_name);
                console.log(responseData.data[0].family);
                console.log(responseData.data[0].genus);
                console.log(responseData.data[0].slug);
                console.log(responseData.data[0].image_url);

                  const formDataJson = {};
                  formData.forEach((value, key) => {
                    formDataJson[key] = value;
                  });

                if(formDataJson.scientificName == ""){
                    formDataJson["scientificName"] = responseData.data[0].scientific_name;
                }
                if(formDataJson.family == ""){
                    formDataJson["family"] = responseData.data[0].family;
                }
                if(formDataJson.genus == ""){
                    formDataJson["genus"] = responseData.data[0].genus;
                }
                if(formDataJson.species == ""){
                    formDataJson["species"] = responseData.data[0].slug;
                }

                if(document.getElementById('plantAvatar').src == "http://localhost:5500/Images/website_Icon/LittleCactus.jpg"){

                    document.getElementById('plantAvatar').src = responseData.data[0].image_url;

                    try {
                        const response = fetch('/api/uploadPlantAvatar', {
                        method: 'POST',
                        body: JSON.stringify({ plantId: plantID, avatar: responseData.data[0].image_url })
                        });
        
                        if (!response.ok) {
                        throw new Error('Failed to upload avatar');
                        }
        
                        console.log('Avatar uploaded successfully');
                    } catch (error) {
                        console.error('Error uploading avatar:', error);
                    }
                }

                fetch('/api/updatePlant', {
                    method: 'PUT',
                    headers: {
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        formData: formDataJson,
                        plantID: plantID
                    })
                })
                .then(response => {
                    if (!response.ok) {
                    throw new Error('Failed to submit form');
                    }else{
                        fetch('/api/modifyCollection', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ collectionId: collectionID})
                        })
                        .then(response => {
                            if (!response.ok) {
                                console.error('Failed to modify collection:', response.status);
                            }
                        });

                        console.log(formDataJson);

                        handleDataForElement(commonName, formDataJson.commonName);
                        handleDataForElement(scientificName, formDataJson.scientificName);
                        handleDataForElement(family, formDataJson.family);
                        handleDataForElement(genus, formDataJson.genus);
                        handleDataForElement(species, formDataJson.species);
                        handleDataForElement(place, formDataJson.place);
                        handleDataForElement(color, formDataJson.color);

                        hashtags.textContent = formDataJson.hashtags;
                        dateOfCollection.textContent = formDataJson.dateOfCollection;
                        commonName.textContent = formDataJson.commonName;
                        scientificName.textContent = formDataJson.scientificName;
                        family.textContent = formDataJson.family;
                        genus.textContent = formDataJson.genus;
                        species.textContent = formDataJson.species;
                        place.textContent = formDataJson.place;
                        color.textContent = formDataJson.color;
                    }
                    console.log('Form submitted successfully');
                })
                .catch(error => {
                    console.error('Error submitting form:', error);
                });
                

              }
            })
            .catch(error => {
              console.error('Error fetching plant data:', error);
            });
        }
    });

  modal.style.display = 'none';
});


function handleImageUpload() {
    if(plantsclientID == connectedclientID)
        document.getElementById('fileInput').click(); 
  }
  
  function displayImage(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const fileType = file.type;

        if (fileType.startsWith('image/')) {
            const reader = new FileReader();

            reader.onload = function (e) {
                const image = e.target.result;
                document.getElementById('plantAvatar').src = e.target.result;

                try {
                    const response = fetch('/api/uploadPlantAvatar', {
                      method: 'POST',
                      body: JSON.stringify({ plantId: plantID, avatar: image })
                    });
      
                    if (!response.ok) {
                      throw new Error('Failed to upload avatar');
                    }
      
                    console.log('Avatar uploaded successfully');
                  } catch (error) {
                    console.error('Error uploading avatar:', error);
                  }
            };

            reader.readAsDataURL(file);
        } else {
            document.getElementById('overlay').style.display = 'block';
            
            setTimeout(function() {
                let opacity = 1;
                const interval = setInterval(function() {
                    opacity -= 0.05;
                    document.getElementById('overlay').style.opacity = opacity;
                    if (opacity <= 0) {
                        clearInterval(interval);
                        document.getElementById('overlay').style.display = 'none';
                    }
                }, 50); 
            }, 1000);

            document.getElementById('overlay').style.opacity = 1;
            input.value = '';
        }
    }
  }

  document.getElementById('plant-image').addEventListener('mouseenter', function() {
    if (plantsclientID != connectedclientID) {
        document.getElementById('plantAvatar').style.scale = 'none';
    }
});
  
  document.getElementById('plant-image').addEventListener('mousemove', (event) => {
    if(plantsclientID == connectedclientID){
        floatingMessage.textContent = "Change avatar";

        const mouseX = event.clientX;
        const mouseY = event.clientY;

        const scrollX = document.documentElement.scrollLeft;
        const scrollY = document.documentElement.scrollTop;

        floatingMessage.style.left = mouseX + scrollX + 30 + 'px'; 
        floatingMessage.style.top = mouseY + scrollY + 'px';

        floatingMessage.style.display = 'block';

        document.getElementById('plant-image').addEventListener('mouseleave', () => {
        floatingMessage.style.display = 'none';
        });
    }
});
