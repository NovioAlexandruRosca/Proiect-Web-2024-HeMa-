document.addEventListener('DOMContentLoaded', () => {
    const generateTokenButton = document.getElementById('generateTokenButton');
    const modal = document.getElementById('tokenModal');
    const modalContent = document.querySelector('.modal-content');
    const closeButton = document.querySelector('.close');
    const generateTokenModalButton = document.getElementById('generateToken');
    const generatedTokenDisplay = document.getElementById('generatedToken');
    const apiListItems = document.getElementById('apiListItems');

   
    fetch('/api/id', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        }).then((response) => {
            if(response.status === 200){
            const userId = response.headers.get('userId');
                
            generateTokenButton.addEventListener('click', async () => {

                console.log('User ID:', userId);
        
                modal.style.display = 'block';
            });
        
            closeButton.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        
            window.addEventListener('click', (event) => {
                if (event.target == modal) {
                    modal.style.display = 'none';
                }
            });
        
            generateTokenModalButton.addEventListener('click', async () => {
        
                try {
                    const response = await fetch(`/dev/v1/generateToken`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ clientId: userId })
                    });
                
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                
                    const data = await response.json();
                    generatedTokenDisplay.textContent = data.token;
                } catch (error) {
                    console.error('Error generating token:', error);
                    generatedTokenDisplay.textContent = 'Error generating token. Please try again later.';
                }
            });

            fetchTokenButton.addEventListener('click', async () => {
                try {
                    const response = await fetch(`/dev/v1/getToken`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ clientId: userId })
                        
                    });
            
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
            
                    const data = await response.json();
                    fetchedTokenDisplay.textContent = data.token ? `${data.token}` : 'No token available.';
                } catch (error) {
                    console.error('Error fetching token:', error);
                    fetchedTokenDisplay.textContent = 'Error fetching token. Please try again later.';
                }
            });
            

            }else{
            console.log("Error fetching User Id");
            }
        });
    
});


document.addEventListener('DOMContentLoaded', () => {
    const apiBoxes = document.querySelectorAll('.api-box');

    apiBoxes.forEach(box => {
        const title = box.querySelector('.api-box-title');

        title.addEventListener('click', () => {
            box.classList.toggle('active');
        });
    });
});


document.addEventListener('DOMContentLoaded', () => {

    let boxOpen = false;

    document.getElementById('fetchTokenButton').addEventListener('click', () => {

        if(boxOpen){
            boxOpen = false;
            document.getElementById('fetchedTokenDisplay').style.display = 'none';
        }else{
            boxOpen = true;
            document.getElementById('fetchedTokenDisplay').style.padding = '10px';
            document.getElementById('fetchedTokenDisplay').style.display = 'block';
        }
    });

    

});


document.addEventListener('DOMContentLoaded', () => {
    const apiMethodBoxes = document.querySelectorAll('.api-method-box');

    apiMethodBoxes.forEach(methodBox => {
        const title = methodBox.querySelector('.api-method-title');
        const content = methodBox.querySelector('.api-method-content');

        title.addEventListener('click', () => {
            content.classList.toggle('active');
        });
    });
});