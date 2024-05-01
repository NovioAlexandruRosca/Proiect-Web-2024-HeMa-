document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    }).then((response) => {
        if(response.status === 200){
            const logicType = response.headers.get('Name');
            document.querySelector('#homeTitle p').textContent = `Hello ${logicType}, what would you like to do today?`;
        }
    });
  });
  