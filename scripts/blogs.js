document.getElementById('1').addEventListener('click', function(){
    window.location.href = './howToPress.html';
});

document.getElementById('2').addEventListener('click', function(){
    window.location.href = './seasonalGardening.html';
});

document.getElementById('3').addEventListener('click', function(){
    window.location.href = './urbanGardening.html';
});

document.getElementById('AddNew').addEventListener('click', function(){
    window.location.href = './createNewBlog.html';
});


document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/blogs')
      .then(response => {
        if (response.ok) {
            return response.json();
        } else {
          throw new Error('Failed to fetch data from server');
        }
      })
      .then(data => {
        const container = document.querySelector('.container');
        const addNewButton = document.getElementById('AddNew');

        // Iterate over each blog object in the fetched data
        data.forEach(blog => {
            // Create HTML elements for the blog post
            const blogPostDiv = document.createElement('div');
            blogPostDiv.classList.add('blog-post');
            blogPostDiv.id = blog.id; // Set the ID for the blog post

            const titleElement = document.createElement('h2');
            titleElement.textContent = blog.title;

            const descriptionElement = document.createElement('p');
            descriptionElement.textContent = blog.description;

            // Append title and description to the blog post div
            blogPostDiv.appendChild(titleElement);
            blogPostDiv.appendChild(descriptionElement);

            // Insert the blog post div before the "Add new Blog" button
            container.insertBefore(blogPostDiv, addNewButton);

            blogPostDiv.addEventListener('click', async () => {
              const blogId = blogPostDiv.id;
              
              sessionStorage.setItem('blogPostData', blogId);
              window.location.href = './blogPage.html';
          });
        });
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  });
  