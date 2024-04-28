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

document.getElementById('1').setAttribute('data-comment-title', 'how to press plants');
document.getElementById('1').setAttribute('data-comment-name', 'rosca alexandru-david');
document.getElementById('1').setAttribute('data-posted-date', '12/4/2024');
document.getElementById('2').setAttribute('data-comment-title', 'seasonal gardening');
document.getElementById('2').setAttribute('data-comment-name', 'rosca alexandru-david');
document.getElementById('2').setAttribute('data-posted-date', '12/4/2024');
document.getElementById('3').setAttribute('data-comment-title', 'urban gardening');
document.getElementById('3').setAttribute('data-comment-name', 'rosca alexandru-david');
document.getElementById('3').setAttribute('data-posted-date', '12/4/2024');

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

        data.forEach(blog => {
            const blogPostDiv = document.createElement('div');

            blogPostDiv.setAttribute('data-posted-date', blog.post_date);
            blogPostDiv.setAttribute('data-comment-name', blog.user_name);
            blogPostDiv.setAttribute('data-comment-title', blog.title);

            blogPostDiv.classList.add('blog-post');
            blogPostDiv.id = blog.id; 

            const titleElement = document.createElement('h2');
            titleElement.textContent = blog.title;

            const descriptionElement = document.createElement('p');
            descriptionElement.textContent = blog.description;

            blogPostDiv.appendChild(titleElement);
            blogPostDiv.appendChild(descriptionElement);

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
  

  const inputs = [
    document.getElementById('nameInput'),
    document.getElementById('clientInput'),
    document.getElementById('dateInput')
];
inputs.forEach((input, index) => {
    input.addEventListener('input', function(event) {
        const nameInputText = document.getElementById('nameInput').value.trim().toLowerCase();
        const clientInputText = document.getElementById('clientInput').value.trim().toLowerCase();
        const dateInputText = document.getElementById('dateInput').value.trim().toLowerCase();
        filterTable(nameInputText, clientInputText, dateInputText);
    });
});

function filterTable(nameInputText, clientInputText, dateInputText) {

    let numberOfShowedTables = 0;

    const tables = document.querySelectorAll('.blog-post');

    tables.forEach(table => {

      let firstCellText = table.getAttribute('data-comment-title').trim().toLowerCase();
      let secondCellText = table.getAttribute('data-comment-name').trim().toLowerCase();
      let thirdCellText;

      if(table.getAttribute('data-posted-date').length > 9){
        const [year, month, day] = table.getAttribute('data-posted-date').substring(0, 10).split('-');
        thirdCellText = day + "/" + month + "/" + year; 
      }else{
        thirdCellText = table.getAttribute('data-posted-date').trim().toLowerCase();
      }

        if (firstCellText.includes(nameInputText) && secondCellText.includes(clientInputText) && thirdCellText.includes(dateInputText)) {
            table.style.display = '';
            numberOfShowedTables++;
        } else {
            table.style.display = 'none';
        }
    });
}