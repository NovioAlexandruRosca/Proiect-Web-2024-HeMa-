document.getElementById('linkToHome').addEventListener("click", function(event){
    
    event.preventDefault();

    fetch('/error404Return', {
        method: 'POST',
        credentials: 'same-origin',
    })
    .then(response => {
        if (response.ok) {
            const logicType = response.headers.get('isAdmin');

            if(logicType == 'True')
                window.location.href = './admin.html';
            else
                window.location.href = './index.html';

        } else {
            console.error('Logout failed:', response.statusText);
        }
    })
    .catch(error => {
        console.error('Error during logout:', error);
    });
});