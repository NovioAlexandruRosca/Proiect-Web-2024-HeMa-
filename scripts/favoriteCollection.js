let clientID;
let collectionsID;

async function fetchFavoritePlants() {
    try {
        const response = await fetch('/api/favoritePlants', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Favorite plants:', data);

        if (data && data.length) {
            createPlantSelect(data, 'family');
            createPlantSelect(data, 'genus');
            createPlantSelect(data, 'species');
            createPlantSelect(data, 'hashtags');
            createPlantSelect(data, 'place_of_collection');
            createPlantSelectColor(data);
            
            data.forEach(plant => {
                console.log('Plant data:', plant);
                createPlantLayout(plant);
            });
        } else {
            console.log('No favorite plants found.');
        }
    } catch (error) {
        console.error('Error fetching favorite plants:', error);
    }
}

async function createPlantLayout(plantData) {
    console.log('Plant layout created successfully:', plantData.plant_id);
    let anchor = document.createElement('a');
    anchor.href = "./PlantProfilePage.html"; 
    console.log("YESSS " + plantData.plant_id);
    anchor.setAttribute('data-plant-id', plantData.plant_id);
    anchor.addEventListener('click', function(event) {
        event.preventDefault(); 
        // sessionStorage.setItem('data-plant-id', anchor.getAttribute('data-plant-id')); 
        window.location.href = './PlantProfilePage.html?id=' + anchor.getAttribute('data-plant-id');
    });

    let figure = document.createElement('figure');

    let img = document.createElement('img');
    img.style.width = '235px';
    img.style.height = '235px';
    img.style.objectFit = 'cover';

    try {
        const response = await fetch(`/api/plantAvatar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ plantId: plantData.plant_id })
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch avatar');
        }
  
        const imageUrl = await response.json();
  
        img.alt = "Cute Plant";

        if (imageUrl.image != `null`) {
            img.src = imageUrl.image;
        }else{
            img.src = "../Images/website_Icon/LittleCactus.jpg";
        }
    } catch (error) {
        console.error('Error fetching avatar:', error);
    }

    let caption = document.createElement('figcaption');
    caption.textContent = plantData.common_name || 'Unnamed Plant';

    figure.appendChild(img);
    figure.appendChild(caption);

    anchor.appendChild(figure);

    for (const [key, value] of Object.entries(plantData)) {
        anchor.setAttribute(`data-${key}`, value);
    }

    document.querySelector('.container').appendChild(anchor);
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

                const date = anchor.getAttribute('data-collection_date') ? anchor.getAttribute('data-collection_date').substring(0, 10) : null;

                const startingDate = document.getElementById('start-date').value;
                const endingDate = document.getElementById('end-date').value;

                if(date){
                    if(startingDate && startingDate > date){
                        hideElement = true;
                    }
                    if(endingDate && endingDate < date){
                        hideElement = true;
                    }
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

            const container = document.querySelector('.container');
            let visibleCount = 0;

            container.childNodes.forEach(child => {
                if (child.nodeType === 1 && getComputedStyle(child).display !== 'none') {
                    visibleCount++;
                }
            });

            console.log('Number of visible child elements:', visibleCount);
            
            let containera = document.getElementById('collectionContainer');
            let messageExists = containera.querySelector('.no-collections-message');
            let message = document.createElement('p');
            message.className = 'no-collections-message';
            message.textContent = 'No collections made yet.';
            containera.appendChild(message);
            
            let figuresExist = visibleCount > 0;

            console.log(figuresExist, messageExists);

            if (messageExists) {
                messageExists.style.display = figuresExist ? 'none' : 'block';
            }

    });

    fetchFavoritePlants();    
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
    let valueCounts = {};
    if (attribute === 'hashtags' && plants.some(plant => plant[attribute])) {
        uniqueValues = [...new Set(plants.flatMap(plant => {
            return plant[attribute] ? plant[attribute].split('#').map(tag => tag?.trim() || '').filter(tag => tag !== '') : [];
          }))];
          const tags = plants.flatMap(plant => plant[attribute] ? plant[attribute].split('#').map(tag => tag?.trim() || '') : []);
          tags.forEach(tag => {
            valueCounts[tag] = (valueCounts[tag] || 0) + 1;
          });
    } else {
        uniqueValues = [...new Set(plants.map(plant => plant[attribute]).filter(value => value !== null && value !== ''))];
        plants.forEach(plant => {
            const value = plant[attribute];
            if (value !== null && value !== '') {
                valueCounts[value] = (valueCounts[value] || 0) + 1;
            }
        });
    }

    console.log('Counts of unique values:');
    console.log(valueCounts);


    uniqueValues.forEach(value => {
        const option = document.createElement('option');
        if(attribute == 'collection_date')
        {
            option.value = value.substring(0,10);
            option.text = value.substring(0,10); 
        }
        else{
            option.value = value;
            option.text = `${value} ${valueCounts[value] > 1 ? "(" + valueCounts[value] + ")" : ''}`;
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


const profileButton = document.getElementById('profile');

profileButton.addEventListener('click', () => {
    window.location.href = './profile.html'; 
});