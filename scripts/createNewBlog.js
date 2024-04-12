document.getElementById('AddNewSection').addEventListener('click', function(){
    
    var divElement = document.getElementById("sectionForSections");

    var htmlCode = `<div class="blog-post">
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

    divElement.innerHTML += htmlCode;

});

function deleteSection(button) {
    var section = button.closest('.blog-post'); // Find the parent section
    section.remove(); // Remove the section
}


function addPictures(button) {

    var blogPostDiv = button.closest('.blog-post');


    var addImagesDiv = blogPostDiv.querySelector('.image');


    var fileInput = blogPostDiv.querySelector('.fileInput');


    for (var i = 0; i < fileInput.files.length; i++) {

        var imgElement = document.createElement("img");


        imgElement.src = URL.createObjectURL(fileInput.files[i]);


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


document.getElementById('Save').addEventListener('click', function(){
    var currentDate = new Date();
    var formattedDate = currentDate.getDate() + '/' + (currentDate.getMonth() + 1) + '/' + currentDate.getFullYear();
    
    console.log('Rosca Alexandru David');
    console.log('Date: ' + formattedDate);

    // Iterate over each blog-post element
    var blogPosts = document.querySelectorAll('.blog-post');
    blogPosts.forEach(function(post, index) {
        // Get the title and description inputs
        var titleInput = post.querySelector('.nameInput').value;
        var descriptionInput = post.querySelector('.descriptionInput').value;

        // Output the data to the console
        console.log('Title: ' + titleInput);
        console.log('Description: ' + descriptionInput);

        // Get the images added
        var images = post.querySelectorAll('.image img');
        images.forEach(function(img, imgIndex) {
            console.log('Image ' + (imgIndex + 1) + ' URL: ' + img.src);
        });

        console.log('---'); // Separate each blog post with a line
    })
});
