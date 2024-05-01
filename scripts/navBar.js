document.getElementById('logout').addEventListener("click", function(event){
    
    event.preventDefault();

    fetch('/logout', {
        method: 'POST',
        credentials: 'same-origin',
    })
    .then(response => {
        if (response.ok) {
            document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = './landingPage.html';
        } else {
            console.error('Logout failed:', response.statusText);
        }
    })
    .catch(error => {
        console.error('Error during logout:', error);
    });
});