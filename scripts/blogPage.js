let postId;
let userID;
document.addEventListener('DOMContentLoaded', async function() {

  fetch('/api/id', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  }).then((response) => {
      if(response.status === 200){
          userID = response.headers.get('userId');
      }
  });
  
  
  const storedData = sessionStorage.getItem('blogPostData');
    if (storedData != null) {
      const blogPostData = JSON.parse(storedData);
      sessionStorage.setItem('temporaryRefreshBlogPostData', blogPostData);
      sessionStorage.removeItem('blogPostData');

      try {
        const response = await fetch('/api/blogData', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ postId: blogPostData })
        });
        if (response.status === 404) {
          console.error('Resource not found');
          window.location.href = "./error404.html";
        }else if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const responseData = await response.json();
        
        postId = responseData.post.id;
        document.title = responseData.post.title;
        console.log(responseData.post.user_id);
        console.log(userID);
        console.log(responseData);

        const container = document.querySelector('.container');
        const addNewButton = document.getElementById('AddNew');

        const [year, month, day] = responseData.post.post_date.substring(0, 10).split('-');

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

        const imagesContainer = document.createElement('div');
        imagesContainer.classList.add('images-container');
        imagesContainer.style.display = 'flex';
        imagesContainer.style.flexWrap = 'wrap';
        imagesContainer.style.justifyContent = 'center'; 
    imagesContainer.style.margin = '0 auto'; 

        section.images.forEach(base64Image => {
            const imageElement = document.createElement('img');
            imageElement.src = `${base64Image}`;
            imageElement.style.width = "200px";
            imageElement.style.marginTop = "10px";
            imageElement.style.marginBottom = "10px";
            imageElement.style.borderRadius = "32px";
            imageElement.style.marginLeft = "5px";
            imageElement.style.marginRight = "5px";
            imageElement.style.border = "1px solid #E2F4C5";
            imageElement.style.boxShadow = "0px 0px 20px rgba(0, 0, 0, 1)";
            imagesContainer.appendChild(imageElement);
        });

        sectionDiv.appendChild(imagesContainer);

        container.insertBefore(sectionDiv, addNewButton);
        });

        const buttonsDiv = document.createElement('div');
        buttonsDiv.id = 'interactivity';
        container.appendChild(buttonsDiv);

        const backButtonDiv = document.createElement('div');
        backButtonDiv.id = 'AddNew';
        backButtonDiv.innerHTML = '<a href="./blog.html"><p>Back</p></a>';
        buttonsDiv.appendChild(backButtonDiv);

        if(userID == responseData.post.user_id){
          const deleteButtonDiv = document.createElement('div');
          deleteButtonDiv.id = 'Delete';
          deleteButtonDiv.innerHTML = '<p>Delete</p>';
          buttonsDiv.appendChild(deleteButtonDiv);

        document.getElementById('Delete').addEventListener('click', function() {

          fetch('/api/deletePost', {
              method: 'DELETE',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  postId: postId 
              })
          })
          .then(response => {
            window.location.href = "./blog.html";
          })
          .catch(error => {
              window.location.href = "./error404.html";
              console.error('Error:', error);
          });
        });
      }

      } catch (error) {
        console.error('Error fetching data:', error);
      }
      
    } else {
      window.location.href = './error404.html';
    }

    fetchComments();
  });


const commentInput = document.querySelector('.comment-input');
const addCommentBtn = document.querySelector('.add-comment-btn');

commentInput.addEventListener('input', () => {
    commentInput.placeholder = "Write your comment here...";
});

addCommentBtn.addEventListener('click', () => {
  const commentText = commentInput.value.trim();

  if (commentText) {
      fetch('/api/blogComment', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({text: commentText, postId: postId})
      })
      .then(response => {
          if (response.ok) {
              commentInput.value = '';
              return response.json();
          } else {
              console.error('Failed to add comment:', response.status);
          }
      }).then(data => {
        
        const newComment = document.createElement('div');
        newComment.classList.add('comment');
        newComment.id = data.id;

        if(data.user_id == userID){
          const deleteButton = document.createElement('p');
          deleteButton.classList.add('deleteComment');
          deleteButton.textContent = '🗑️';
          newComment.appendChild(deleteButton);
        }

        const reportButton = document.createElement('p');
        reportButton.classList.add('reportComment');
        reportButton.textContent = '🚨';
        newComment.appendChild(reportButton);

        reportButton.onclick = function() {
            modal.style.display = "block";
            localStorage.setItem('reportedId', data.user_id);
            document.getElementById('reportName').textContent += data.user_name;
            document.getElementById('reportComment').textContent += data.comment_text;
        };

        const postedDate = new Date(data.posted_date);
        const currentTime = new Date();
        const timeDifference = currentTime - postedDate;

        const seconds = Math.floor(timeDifference / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        let timeString = '';
        if (years > 0) {
            timeString = years === 1 ? 'a year ago' : `${years} years ago`;
        } else if (months > 0) {
            timeString = months === 1 ? 'a month ago' : `${months} months ago`;
        } else if (weeks > 0) {
            timeString = weeks === 1 ? 'a week ago' : `${weeks} weeks ago`;
        } else if (days > 0) {
            timeString = days === 1 ? 'a day ago' : `${days} days ago`;
        } else if (hours > 0) {
            timeString = hours === 1 ? 'an hour ago' : `${hours} hours ago`;
        } else if (minutes > 0) {
            timeString = minutes === 1 ? 'a minute ago' : `${minutes} minutes ago`;
        } else {
            timeString = seconds <= 10 ? 'just now' : `${seconds} seconds ago`;
        }

        const timeDiv = document.createElement('div');
        timeDiv.classList.add('time');
        timeDiv.textContent = `Posted ${timeString}`;

        const userSpan = document.createElement('span');
        userSpan.classList.add('user');
        userSpan.textContent = `${data.user_name}:`;

        const nameDate = document.createElement('div');
        nameDate.classList.add('nameDate');
        nameDate.appendChild(userSpan);
        nameDate.appendChild(timeDiv);
        newComment.appendChild(nameDate);

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('content');
        contentDiv.textContent = data.comment_text;
        newComment.appendChild(contentDiv);

        const commentsContainer = document.querySelector('#comments');

        const secondComment = commentsContainer.children[1];

        commentsContainer.insertBefore(newComment, secondComment);

    })
      .catch(error => {
          console.error('Error adding comment:', error);
      });
  } else {
      commentInput.placeholder = "Please write a comment before submitting";
  }
});


function fetchComments() {
  fetch('/api/blogComments', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ postId: postId })
  })
  .then(response => {
      if (response.ok) {
          return response.json();
      } else {
          console.error('Failed to fetch comments:', response.status);
      }
  })
  .then(comments => {
      console.log('Received comments:', comments);
      renderComments(comments);
  })
  .catch(error => {
      console.error('Error fetching comments:', error);
  });
}

function renderComments(comments) {
    const commentsContainer = document.querySelector('#comments');
    const firstCommentDiv = commentsContainer.children[0];

    while (commentsContainer.children.length > 1) {
        commentsContainer.removeChild(commentsContainer.children[1]);
    }

    for (let i = 0; i < comments.length; i++) {
        const commentData = comments[i];
        const commentElement = createCommentElement(commentData);
        commentsContainer.insertBefore(commentElement, firstCommentDiv.nextSibling);
    }
}

function createCommentElement(commentData) {

console.log(commentData.user_id);

  const commentElement = document.createElement('div');
  commentElement.classList.add('comment');
  commentElement.id = commentData.id;

  if(commentData.user_id == userID){
    const deleteButton = document.createElement('p');
    deleteButton.classList.add('deleteComment');
    deleteButton.textContent = '🗑️';
    commentElement.appendChild(deleteButton);
  }

  const reportButton = document.createElement('p');
  reportButton.classList.add('reportComment');
  reportButton.textContent = '🚨';
  commentElement.appendChild(reportButton);

    reportButton.onclick = function() {
    modal.style.display = "block";
    localStorage.setItem('reportedId', commentData.user_id);
    document.getElementById('reportName').textContent += commentData.user_name;
    document.getElementById('reportComment').textContent += commentData.comment_text;
    };

  const postedDate = new Date(commentData.posted_date);
  const currentTime = new Date();
  const timeDifference = currentTime - postedDate;

  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let timeString = '';
  if (years > 0) {
      timeString = years === 1 ? 'a year ago' : `${years} years ago`;
  } else if (months > 0) {
      timeString = months === 1 ? 'a month ago' : `${months} months ago`;
  } else if (weeks > 0) {
      timeString = weeks === 1 ? 'a week ago' : `${weeks} weeks ago`;
  } else if (days > 0) {
      timeString = days === 1 ? 'a day ago' : `${days} days ago`;
  } else if (hours > 0) {
      timeString = hours === 1 ? 'an hour ago' : `${hours} hours ago`;
  } else if (minutes > 0) {
      timeString = minutes === 1 ? 'a minute ago' : `${minutes} minutes ago`;
  } else {
      timeString = seconds <= 10 ? 'just now' : `${seconds} seconds ago`;
  }

  const userSpan = document.createElement('span');
  userSpan.classList.add('user');
  userSpan.textContent = `${commentData.user_name}:`;
  userSpan.setAttribute('userID', commentData.user_id);

  userSpan.addEventListener('click', () => {
    const userID = userSpan.getAttribute('userID');
    sessionStorage.setItem('clientID', userID);
    window.location.href = './profile.html';
    });

    const floatingMessage = document.querySelector('.floating-message');

    userSpan.addEventListener('mousemove', (event) => {

    floatingMessage.textContent = 'Visit the profile of this user';

    const mouseX = event.clientX;
    const mouseY = event.clientY;

    const scrollX = document.documentElement.scrollLeft;
    const scrollY = document.documentElement.scrollTop;

    floatingMessage.style.left = mouseX + scrollX + 30 + 'px'; 
    floatingMessage.style.top = mouseY + scrollY + 'px';

    floatingMessage.style.display = 'block';
    });

    userSpan.addEventListener('mouseleave', () => {
    floatingMessage.style.display = 'none';
    });


  const timeDiv = document.createElement('div');
  timeDiv.classList.add('time');
  timeDiv.textContent = `Posted ${timeString}`;

  const nameDate = document.createElement('div');
  nameDate.classList.add('nameDate');
  nameDate.appendChild(userSpan);
  nameDate.appendChild(timeDiv);
  commentElement.appendChild(nameDate);

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('content');
  contentDiv.textContent = commentData.comment_text;
  commentElement.appendChild(contentDiv);

  return commentElement;
}


document.addEventListener('click', async (event) => {
  if (event.target.classList.contains('deleteComment')) {
      const commentId = event.target.parentNode.id;
      console.log(commentId);
      try {
          const response = await fetch('/api/deleteComment', {
              method: 'DELETE',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ commentId: commentId })
          });

          if (!response.ok) {
              throw new Error('Failed to delete comment');
          }
          fetchComments();
      } catch (error) {
          console.error('Error deleting comment:', error);
      }
  }
});


window.addEventListener('beforeunload', function (event) {
    sessionStorage.setItem('blogPostData', sessionStorage.getItem('temporaryRefreshBlogPostData'));
});




const modal = document.getElementById("reportModal");
const span = document.getElementsByClassName("close")[0];

span.onclick = function() {
    modal.style.display = "none";
    document.getElementById('reportName').textContent = "Name: ";
    document.getElementById('reportComment').textContent = "Comment: ";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
        document.getElementById('reportName').textContent = "Name: ";
        document.getElementById('reportComment').textContent = "Comment: ";
    }
}

document.getElementById("reportForm").onsubmit = function(event) {
    event.preventDefault();
    const selectedMotif = document.querySelector('input[name="motif"]:checked');
    if (selectedMotif) {

        const reportedId = localStorage.getItem('reportedId');
        const reportedName = document.getElementById('reportName').textContent.replace(/^Name: /, '');
        const reportedComment = document.getElementById('reportComment').textContent.replace(/^Comment: /, '');
        const motif = selectedMotif.value;

        fetch('/api/reportComment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                clientId: reportedId, 
                reportedUserName: reportedName,
                reportedUserComment: reportedComment,
                motif: motif})
        })
        .then(response => response.json())
        .then(data => {
            modal.style.display = "none";
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    } else {
        alert("Please select a reason.");
    }
};