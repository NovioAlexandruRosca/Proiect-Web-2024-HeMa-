document.addEventListener('DOMContentLoaded', async function() {
    const storedData = sessionStorage.getItem('blogPostData');
    if (storedData != null) {
      const blogPostData = JSON.parse(storedData);
      sessionStorage.removeItem('blogPostData');

      try {
        const response = await fetch('/api/blogData', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ postId: blogPostData })
        });
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const responseData = await response.json();
        
        console.log(responseData);

        const container = document.querySelector('.container');
        const addNewButton = document.getElementById('AddNew');

        const [year, month, day] = responseData.post.post_date.substring(0, 10).split('-');

        // Create title, date, and signature elements
        const titleDiv = document.createElement('div');
        titleDiv.id = 'titleHowToPress';
        titleDiv.innerHTML = `<h1>${responseData.post.title}</h1>
                            <p id="date">uploaded on ${day}-${month}-${year}</p>
                            <p id="signature">by ${responseData.post.client_name}</p>`;
        container.appendChild(titleDiv);

        responseData.sections.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('blog-post');

        const titleElement = document.createElement('h2');
        titleElement.textContent = section.title;

        const descriptionElement = document.createElement('p');
        descriptionElement.textContent = section.description;

        sectionDiv.appendChild(titleElement);
        sectionDiv.appendChild(descriptionElement);

        // // Add images to the section
        // section.images.forEach(imageUrl => {
        //     const imageElement = document.createElement('img');
        //     imageElement.src = imageUrl;
        //     sectionDiv.appendChild(imageElement);
        // });

        container.insertBefore(sectionDiv, addNewButton);
        });

        // Add the "Back" button at the end of the container
        const backButtonDiv = document.createElement('div');
        backButtonDiv.id = 'AddNew';
        backButtonDiv.innerHTML = '<a href="./blog.html"><p>Back</p></a>';
        container.appendChild(backButtonDiv);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
      
    } else {
      window.location.href = './error404.html';
    }
  });
  