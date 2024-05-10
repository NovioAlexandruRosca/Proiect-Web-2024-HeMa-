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


    const requestData = {
      clientId: userProfileID,
      badgeNumber: 1
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

    document.getElementById('badge1').style.filter = 'grayscale(0%) brightness(100%)';
    document.getElementById('badge1').setAttribute('on', '1');

    newFigure.addEventListener('click', function() {
      sessionStorage.setItem('data-collection-id', newFigure.getAttribute('data-collection-id'));
      window.location.href = "./collection.html";
    });

    const collectionsDiv = document.querySelector(".collectionsPlace");
    collectionsDiv.appendChild(newFigure);
  

    checkCollections();
    updateWrapperTransform();

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

  const requestData = {
    clientId: userProfileID,
    badgeNumber: 3
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
    document.getElementById('badge3').style.filter = 'grayscale(0%) brightness(100%)';
    document.getElementById('badge3').setAttribute('on', '1');
  })
  .catch(error => {
    console.error('Error modifying badge value:', error);
  });

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

let userID;     // ID UL PERSOANEI CONECTATE RIGHT NOW
let userProfileID;  // ID UL AL CAREI PERSOANE E PROFILUL

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
    
          userProfileID = data[0].client_id;

          if(data[0].client_id == userID){
            document.getElementById('followButton').style.display = 'none';
          }else{
            document.getElementById('editButton').style.display = 'none';
            document.getElementById('addPlantButton').style.display = 'none';
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
                sessionStorage.setItem('data-collection-id', newFigure.getAttribute('data-collection-id'));
                window.location.href = "./collection.html";
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

async function fetchClientRelationship(clientId){
    
    fetch('/api/checkRelationship', {
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
            throw new Error('Failed to check relationship');
        }
    })
    .then(data => {
        console.log(data);
        if (data.exists) {
            followButton.textContent = "Unfollow";
        } else {
            followButton.textContent = "Follow";
        }
    })
    .catch(error => {
        console.error('Error checking relationship:', error);
    });

}

async function fetchClientFollowing(clientId){

  fetch('/api/getFollowing', {
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
            throw new Error('Failed to check relationship');
        }
    })
    .then(data => {

        if(data.length == 0){
          fetch('/api/userName', {
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
                throw new Error('Name couldnt be procured');
            }
          })
          .then(data => {
          document.getElementById('no-followers-message').textContent = `${data[0].name} doesnt follow anyone yet.`;
          });
        }else{
          document.getElementById('no-followers-message').style.display = 'none';
        }
      
        data.forEach(follower => {
          const img = document.createElement('img');
          img.classList.add('friend');
          img.src = '../images/background/friend.png';
          img.alt = 'Friend';
          img.width = 100;
          img.height = 100;
          img.setAttribute('data-followed-id', follower.followed_id);

          const floatingMessage = document.querySelector('.floating-message');

          img.addEventListener('mousemove', (event) => {

            fetch('/api/userName', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ clientId: follower.followed_id })
            })
            .then(response => {
              if (response.ok) {
                  return response.json();
              } else {
                  throw new Error('Name couldnt be procured');
              }
            })
            .then(data => {
              floatingMessage.textContent = `Visit ${data[0].name}'s Profile`;
            });

          const mouseX = event.clientX;
          const mouseY = event.clientY;

          const scrollX = document.documentElement.scrollLeft;
          const scrollY = document.documentElement.scrollTop;

          floatingMessage.style.left = mouseX + scrollX + 30 + 'px'; 
          floatingMessage.style.top = mouseY + scrollY + 'px';

          floatingMessage.style.display = 'block';
          });

          img.addEventListener('mouseleave', () => {
          floatingMessage.style.display = 'none';
          });


          document.getElementById('friends').appendChild(img);

          img.addEventListener('click', () => {
            const followedId = img.getAttribute('data-followed-id');
            sessionStorage.setItem('clientID', followedId);
            window.location.href = './profile.html';
        });
      });
    })
    .catch(error => {
        console.error('Error checking relationship:', error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const clientId = sessionStorage.getItem('clientID'); 

  fetchClientData(clientId);
  fetchClientCollections(clientId);
  fetchClientRelationship(clientId);
  fetchClientFollowing(clientId);
  fetchBadges(clientId);
});


const followButton = document.getElementById('followButton');

followButton.addEventListener('click', () => {
    const clientIdToFollow = getClientIdToFollow();
    
    fetch('/api/follow', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientId: clientIdToFollow })
    })
    .then(response => {
      if (response.ok) {
          return response.json();
      } else {
          console.error('Failed to send follow request:', response.status);
      }
    })
    .then(data => {
        if (data.deleted) {
          followButton.textContent = "Follow";
      } else {
          followButton.textContent = "Unfollow";
      }
    })
    .catch(error => {
        console.error('Error sending follow request:', error);
    });
});

function getClientIdToFollow() {
    return sessionStorage.getItem('clientID');
}

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

function countFigures() {
  const figures = document.querySelectorAll('figure');
  
  return figures.length;
}

function updateWrapperTransform() {
  const figuresCount = countFigures();

  const number = Math.ceil(figuresCount / 3) - 1;
  const verticalTranslation1 = 36 + 20 * number;
  const verticalTranslation2 = 20 + 15 * number;

  const wrapper = document.querySelector('.f-wrapper--2');
  wrapper.style.transform = `translate(0px, ${verticalTranslation1}px)`;

  const wrapper1 = document.querySelector('.f-wrapper--1');
  wrapper1.style.transform = `translate(0px, ${verticalTranslation2}px)`;
}

setTimeout(() => {
  updateWrapperTransform();
}, 1000);




function handleImageUpload() {
  if (userProfileID == userID) {
  document.getElementById('fileInput').click(); 
  }
}

function displayImage(input) {
  if (input.files && input.files[0]) {
      const file = input.files[0];
      const fileType = file.type;

      if (fileType.startsWith('image/')) {
          const reader = new FileReader();

          reader.onload = function (e) {
              document.getElementById('avatar').src = e.target.result;
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

document.getElementById('circleAvatar').addEventListener('mouseenter', function() {
  if (userProfileID != userID) {
      document.getElementById('avatar').style.scale = 'none';
  }
});

const floatingMessage = document.querySelector('.floating-message');

document.getElementById('circleAvatar').addEventListener('mousemove', (event) => {
  if(userProfileID == userID){
      floatingMessage.textContent = "Change avatar";

      const mouseX = event.clientX;
      const mouseY = event.clientY;

      const scrollX = document.documentElement.scrollLeft;
      const scrollY = document.documentElement.scrollTop;

      floatingMessage.style.left = mouseX + scrollX + 30 + 'px'; 
      floatingMessage.style.top = mouseY + scrollY + 'px';

      floatingMessage.style.display = 'block';

      document.getElementById('circleAvatar').addEventListener('mouseleave', () => {
      floatingMessage.style.display = 'none';
      });
  }
});


const badgeMessages = [
  "Create Your First Collection",
  "Create Your First Plant",
  "Edit Your Profile",
  "Add Your First Friend",
  "Share Your First Collection"
];

document.querySelectorAll('.badge').forEach((badge, index) => {

  badge.addEventListener('mousemove', (event) => {

      let message = badgeMessages[index];

      if(badge.getAttribute('on') == '0'){
        message = '???';
      }

      if(userID != userProfileID){
        message = '???';
      }

      floatingMessage.textContent = message;

      const mouseX = event.clientX;
      const mouseY = event.clientY;

      const scrollX = document.documentElement.scrollLeft;
      const scrollY = document.documentElement.scrollTop;

      floatingMessage.style.left = mouseX + scrollX + 30 + 'px'; 
      floatingMessage.style.top = mouseY + scrollY + 'px';

      floatingMessage.style.display = 'block';

      badge.addEventListener('mouseleave', () => {
      floatingMessage.style.display = 'none';
      });

  });
});

async function fetchBadges(clientId){

  fetch('/api/badges', {
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
        throw new Error('Error getting the badge data');
    }
  })
  .then(data => {
    console.log(data);
    updateBadges(data);
  }).catch(error => {
    console.error('Error checking relationship:', error);
  });
}

function updateBadges(badgeData) {
  document.querySelectorAll('.badge').forEach((badge, index) => {
    if (badgeData[`badge${index + 1}`] === '1') {
      badge.style.filter = 'grayscale(0%) brightness(100%)';
      badge.setAttribute('on', '1');
    }
  });
}