document.getElementById('AddNewSection').addEventListener('click', function(){
    
    let divElement = document.getElementById("sectionForSections");

    let htmlCode = `<div class="blog-post">
    <h2>Section Title:</h2>
    <input type="text" class="nameInput" name="nameInput"><br>
    
    <h2>Section Description:</h2><br>
    <textarea class="descriptionInput" name="descriptionInput" rows="4" cols="50"></textarea><br> 

    <div class="image"></div> 

    <div class="organizeButtons">
    <input type="file" class="fileInput" onchange="addPictures(this)">
    <button onclick="deleteSection(this)">Delete</button> 
    </div>
</div>`;

    divElement.insertAdjacentHTML('beforeend', htmlCode);

});

function deleteSection(button) {
    let section = button.closest('.blog-post'); // Find the parent section
    section.remove(); // Remove the section
}


async function addPictures(button) {

    let blogPostDiv = button.closest('.blog-post');
    let addImagesDiv = blogPostDiv.querySelector('.image');
    let fileInput = blogPostDiv.querySelector('.fileInput');

    let existingImagesCount = addImagesDiv.querySelectorAll('img').length;
    if (existingImagesCount >= 3) {
        console.log('Maximum number of images (3) reached.');
        return;
    }

    for (let i = 0; i < fileInput.files.length; i++) {

        let imgElement = document.createElement("img");

        imgElement.src = URL.createObjectURL(fileInput.files[i]);

        const imageUrl = await uploadImageToImgur(fileInput.files[i]);
        console.log('Uploaded image URL:', imageUrl);

        imgElement.style.width = "200px";
        imgElement.style.marginTop = "10px";
        imgElement.style.marginBottom = "10px";
        imgElement.style.borderRadius = "32px";
        imgElement.style.marginLeft = "5px";
        imgElement.style.marginRight = "5px";
        imgElement.style.border = "1px solid #E2F4C5";
        imgElement.style.boxShadow = "0px 0px 20px rgba(0, 0, 0, 1)";

        addImagesDiv.appendChild(imgElement);
    }
}


document.getElementById('Save').addEventListener('click', async function(){

    // Create an array to store the blog post data
    let postData = [];

    // Iterate over each blog-post element
    let blogPosts = document.querySelectorAll('.blog-post');
    blogPosts.forEach(function(post, index) {
        // Get the title and description inputs
        let titleInput = post.querySelector('.nameInput').value;
        let descriptionInput = post.querySelector('.descriptionInput').value;

        let imageUrls = [];

        // Get the images added
        let images = post.querySelectorAll('.image img');
        images.forEach(function(img, imgIndex) {
            imageUrls.push(img.src);
        });

        postData.push({
            title: titleInput,
            description: descriptionInput,
            images: imageUrls
        });
    });

    try {
        // Send the postData array to the server
        const response = await fetch('/saveBlogPosts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });

        if (response.ok) {
            // Get the URLs of the first images from the server response
            const firstImageUrls = await response.json();

            // Open a new window/tab for each first image URL received from the server
            firstImageUrls.forEach(imageUrl => {
                window.open(imageUrl);
            });
        } else {
            console.error('Failed to save blog posts:', response.statusText);
        }
    } catch (error) {
        console.error('Error saving blog posts:', error);
    }
    window.location.href = './blog.html';
});


const clientId = 'febfff4e0c2ffca';
const accessToken = 'f233c67d1dc02e8d1855c3ac867e9e0fc4c7d0fc';


async function uploadImageToImgur(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                Authorization: `Client-ID ${clientId}`,
            },
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            return data.data.link;
        } else {
            console.error('Failed to upload image to Imgur:', response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Error uploading image to Imgur:', error);
        return null;
    }
}

async function fetchImgurCredits() {
    try {
        const response = await fetch('https://api.imgur.com/3/credits', {
            headers: {
                Authorization: `Client-ID ${clientId}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            return data.data;
        } else {
            console.error('Failed to fetch Imgur credits:', response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Error fetching Imgur credits:', error);
        return null;
    }
}

fetchImgurCredits()
    .then(credits => {
        if (credits) {
            console.log('Remaining Imgur credits:', credits);
        } else {
            console.log('Failed to fetch Imgur credits.');
        }
    });
