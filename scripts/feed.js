let isTextDisplayOn = true;

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

    let numberOfShowedTables = 0;

    if(isTextDisplayOn){

        const tables = document.querySelectorAll('#switch1 .clientsTable');

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
    }else{

        const flip_cards = document.querySelectorAll('.flip-card:not(#hideFlip)');

        flip_cards.forEach(flip_card => {

            const table = flip_card.querySelector(`table:nth-child(1)`);
            const tableRows = table.querySelectorAll('.scrollable-content');

            const firstCellText = tableRows[0].textContent.trim().toLowerCase();
            const secondCellText = tableRows[1].textContent.trim().toLowerCase();
            const thirdCellText = tableRows[2].textContent.trim().toLowerCase();

            if (firstCellText.includes(nameInputText) && secondCellText.includes(clientInputText) && thirdCellText.includes(dateInputText)) {
                flip_card.style.display = 'flex';
                numberOfShowedTables++;
            } else {
                flip_card.style.display = 'none';
            }
        });

    }

    if(numberOfShowedTables > 0){
        document.getElementById('hideFlip').style.display = 'none';
        document.getElementById('hiddenTable').style.display = 'none';
    }else{
        document.getElementById('hideFlip').style.display = 'flex';
        document.getElementById('hiddenTable').style.display = '';
    }
}





const modifyButtons = document.querySelectorAll('.flip-card-front');
const elementsToModify = document.querySelectorAll('.flip-card-inner');

modifyButtons.forEach((button, index) => {
    button.addEventListener('click', function() {
        elementsToModify[index].style.transform = "rotateX(180deg)";
    });

});

const modi = document.querySelectorAll('.flip-card-back');

modi.forEach((button, index) => {
    button.addEventListener('click', function(event) {
        const clickedElement = event.target;
        if (!clickedElement.closest('tfoot')) {
            elementsToModify[index].style.transform = "rotateX(0deg)";
        }
    });

});

const selectElement = document.getElementById('display_input');

selectElement.addEventListener('change', function(event) {
    const selectedIndex = selectElement.selectedIndex;
    const selectedText = selectElement.options[selectedIndex].text;

    if(selectedText === 'Text'){
        document.getElementById('switch1').style.display = '';
        document.getElementById('switch2').style.display = 'none';
        isTextDisplayOn = true;
    }else if(selectedText === 'Visual Spoiler'){
        document.getElementById('switch1').style.display = 'none';
        document.getElementById('switch2').style.display = 'flex';
        isTextDisplayOn = false
    }

    const nameInputText = inputs[0].value.trim().toLowerCase();
    const clientInputText = inputs[1].value.trim().toLowerCase();
    const dateInputText = inputs[2].value.trim().toLowerCase();
    filterTable(nameInputText, clientInputText, dateInputText);
});










const nameInputText = inputs[0].value.trim().toLowerCase();
const clientInputText = inputs[1].value.trim().toLowerCase();
const dateInputText = inputs[2].value.trim().toLowerCase();
filterTable(nameInputText, clientInputText, dateInputText);