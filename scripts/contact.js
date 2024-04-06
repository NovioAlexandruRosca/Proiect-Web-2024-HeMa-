const form = document.getElementById('contact_form');

form.addEventListener('submit', function(event) {
    event.preventDefault(); 

    const formData = new FormData(this);

    const formDataObject = {};

    formData.forEach(function(value, key){
        formDataObject[key] = value;
    });

    console.log(formDataObject);
});