document.querySelectorAll('.like, .dislike, .visit').forEach(th => {

    th.addEventListener('click', function() {
        if (th.classList.contains('like') || th.classList.contains('dislike')) {
          th.textContent = '+1';
        } else if (th.classList.contains('visit')) {
          //change webpage
        }
      });
    th.addEventListener('mouseover', function() {
      if (th.classList.contains('like') || th.classList.contains('dislike')) {
        th.textContent = '0';
      } else if (th.classList.contains('visit')) {
        th.textContent = 'Visit';
      }
    });
    th.addEventListener('mouseout', function() {
      th.style.fontSize = '20px'; 
      if (th.classList.contains('like')) {
        th.textContent = '👍🏻'; 
      }else if(th.classList.contains('dislike')){
        th.textContent = '👎🏻';
      } else if (th.classList.contains('visit')) {
        th.textContent = '🌱';
      }
    });
  });


const inputs = [
    document.getElementById('nameInput'),
    document.getElementById('clientInput'),
    document.getElementById('dateInput')
];
inputs.forEach((input, index) => {
    input.addEventListener('input', function(event) {
        const nameInputText = inputs[0].value.trim().toLowerCase();
        const clientInputText = inputs[1].value.trim().toLowerCase();
        const dateInputText = inputs[2].value.trim().toLowerCase();
        filterTable(nameInputText, clientInputText, dateInputText);
    });
});

function filterTable(nameInputText, clientInputText, dateInputText) {
    const tables = document.querySelectorAll('.clientsTable');

    let numberOfShowedTables = 0;

    tables.forEach(table => {
        const tableRows = table.querySelectorAll('.clientsTableBody');
        const firstRow = tableRows[0];

        const firstCell = firstRow.querySelector(`td:nth-child(1)`);
        const secondCell = firstRow.querySelector(`td:nth-child(2)`);
        const thirdCell = firstRow.querySelector(`td:nth-child(3)`);

        const firstCellText = firstCell.textContent.trim().toLowerCase();
        const secondCellText = secondCell.textContent.trim().toLowerCase();
        const thirdCellText = thirdCell.textContent.trim().toLowerCase();

        if (firstCellText.includes(nameInputText) && secondCellText.includes(clientInputText) && thirdCellText.includes(dateInputText)) {
            table.style.display = '';
            numberOfShowedTables++;
        } else {
            table.style.display = 'none';
        }
    });

    console.log(numberOfShowedTables);

    if(numberOfShowedTables > 0){
        document.getElementById('hiddenTable').style.display = 'none';
    }else{
        document.getElementById('hiddenTable').style.display = '';
    }
}

const nameInputText = inputs[0].value.trim().toLowerCase();
const clientInputText = inputs[1].value.trim().toLowerCase();
const dateInputText = inputs[2].value.trim().toLowerCase();
filterTable(nameInputText, clientInputText, dateInputText);


