// window.addEventListener('load', fetchSpeciesList);

// let created = false;

// let imageUrls = [
//     '../images/background/picture1.png',
//     '../images/background/picture10.png',
//     '../images/background/picture9.png',
//     '../images/background/picture2.png',
//     '../images/background/picture5.png',
//     '../images/background/picture8.png',
//     '../images/background/picture7.png',
//     '../images/background/picture3.png',
//     '../images/background/picture6.png',
//     '../images/background/picture4.png'
// ];

// function fetchSpeciesList() {
//     const apiKey = 'sk-j3xo6648c252eb7cb5558';

//     fetch(`https://perenual.com/api/species-list?key=${apiKey}&page=1`)
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Failed to fetch species list');
//             }
//             return response.json();
//         })
//         .then(data => {
//             const plants = data.data; 
//             for(let i = 0 ; i < 28 ; i++){
//                 imageUrls.push(plants[i].default_image.medium_url);
//             }
//             imageUrls = shuffleArray(imageUrls);
//             const firstTenImages = imageUrls.slice(0, 10);
//             if(!created){
//                 created = true;
//                 createImageElements(firstTenImages);
//             }
//         })
//         .catch(error => {
//             console.error('Error fetching species list:', error.message);
//         });
// }

// function createImageElements(imageUrls) {
//     const imageList = document.querySelector('.image-list');
//     imageUrls.forEach(imageUrl => {
//         const img = document.createElement('img');
//         img.classList.add('image-item');
//         img.src = imageUrl;
//         img.alt = 'Plant Image';
//         const li = document.createElement('li');
//         li.appendChild(img);
//         imageList.appendChild(li);
//     });
// }

// function shuffleArray(array) {
//     for (let i = array.length - 1; i > 0; i--) {
//         const j = Math.floor(Math.random() * (i + 1));
//         [array[i], array[j]] = [array[j], array[i]];
//     }
//     return array;
// }