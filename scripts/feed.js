document.addEventListener('DOMContentLoaded', function() {
  let isTextDisplayOn = true;
  let collectionType = '';
  
  // Creates tables based on template(for GENERATED COLLECTIONS)
  
  fetch('http://localhost:5500/api/allSharedCollections')
  .then(response => {
      if (!response.ok) {
          throw new Error('Failed to fetch shared collections');
      }
      return response.json();
  })
  .then(data => {
      console.log('Shared collections data:', data);
  
      data.forEach(collection => {
          const collectionObject = {
              id: collection.id,
              name: collection.name,
              sharedBy: collection.sharedBy,
              postingDate: collection.postingDate,
              description: collection.description
          };
          addSharedTableToDiv('switch1', collectionObject);
          addSharedTableToDiv('switch2', collectionObject);
      });
  
      const nameInputText = inputs[0].value.trim().toLowerCase();
      const clientInputText = inputs[1].value.trim().toLowerCase();
      const dateInputText = inputs[2].value.trim().toLowerCase();
      filterTable(nameInputText, clientInputText, dateInputText);
  })
  .catch(error => {
      console.error('Error fetching shared collections:', error.message);
  });
  
  function createSharedTableTemplate(collection) {
  const table = document.createElement('table');
  table.classList.add('clientsTable');
  table.setAttribute('data-collection-id', collection.id);
  table.setAttribute('data-collection-name', collection.name || 'Unnamed Collection');
  
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  ['Collection Name', 'Shared by', 'Posting Date'].forEach(text => {
      const th = document.createElement('th');
      th.innerHTML = `<span>${text}</span>`;
      headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  const tbody = document.createElement('tbody');
  tbody.classList.add('clientsTableBody');
  
  const dataRow = document.createElement('tr');
  const nameCell = document.createElement('td');
  nameCell.classList.add('scrollable-content');
  nameCell.innerHTML = `<span>${collection.name}</span>`;
  dataRow.appendChild(nameCell);
  
  const sharedByCell = document.createElement('td');
  sharedByCell.classList.add('scrollable-content');
  sharedByCell.innerHTML = `<span>${collection.sharedBy}</span>`;
  dataRow.appendChild(sharedByCell);
  
  const dateCell = document.createElement('td');
  dateCell.classList.add('scrollable-content');
  dateCell.innerHTML = `<span>${collection.postingDate.substring(0,10)}</span>`;
  dataRow.appendChild(dateCell);
  
  tbody.appendChild(dataRow);
  
  const descriptionHeaderRow = document.createElement('tr');
  const descriptionHeaderCell = document.createElement('th');
  descriptionHeaderCell.colSpan = 3;
  descriptionHeaderCell.innerHTML = '<span>Collection Description</span>';
  descriptionHeaderRow.appendChild(descriptionHeaderCell);
  tbody.appendChild(descriptionHeaderRow);
  
  const descriptionRow = document.createElement('tr');
  const descriptionCell = document.createElement('td');
  descriptionCell.colSpan = 3;
  descriptionCell.innerHTML = `<span>${collection.description}</span>`;
  descriptionRow.appendChild(descriptionCell);
  tbody.appendChild(descriptionRow);
  
  table.appendChild(tbody);
  
  const tfoot = document.createElement('tfoot');
  const footerRow = document.createElement('tr');
  
  ['like', 'dislike', 'visit'].forEach(type => {
    const th = document.createElement('th');
    th.classList.add(type);
    th.innerHTML = `<span class="emoji">${type === 'like' ? '👍🏻' : type === 'dislike' ? '👎🏻' : '🌱'}</span>`;
    footerRow.appendChild(th);

    if (type === 'visit') {
        th.addEventListener('mouseover', function() {
            th.style.fontSize = '23.5px';
            if (th.classList.contains('visit')) {
                th.textContent = 'Visit';
            }
        });

        th.addEventListener('mouseout', function() {
            th.style.fontSize = '20px';
            if (th.classList.contains('visit')) {
                th.textContent = '🌱';
            }
        });

        th.addEventListener('click', function() {
            console.log('Visit button clicked'); // Debugging line
            try {
                const tableElement = th.closest('table');
                console.log('Table element:', tableElement); // Debugging line
                const collectionId = tableElement.getAttribute('data-collection-id');
                const collectionName = tableElement.getAttribute('data-collection-name');
                console.log('Table Collection ID:', collectionId); // Debugging line
                console.log('Table Collection Name:', collectionName); // Debugging line
                sessionStorage.setItem('data-collection-id', collectionId);
                window.location.href = "./collection.html";
            } catch (error) {
                console.error('Error parsing collectionId or setting localStorage:', error);
            }
        });
    } else {
      th.addEventListener('mouseover', function () {
          fetch(`http://localhost:5500/api/reactionCount?collectionId=${collection.id}&reactionType=${type}`)
              .then(response => response.json())
              .then(data => {
                  th.textContent = `${type === 'like' ? '👍🏻' : '👎🏻'} ${data.count}`;
              })
              .catch(error => {
                  console.error('Error fetching reaction count:', error);
              });
      });

      th.addEventListener('mouseout', function () {
          th.textContent = `${type === 'like' ? '👍🏻' : '👎🏻'}`;
      });

      th.addEventListener('click', function () {
          fetch('/api/react', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ collectionId: collection.id, reactionType: type })
          })
              .then(response => {
                  if (response.ok) {
                      th.textContent = `${type === 'like' ? '👍🏻' : '👎🏻'}`;
                  } else {
                      console.error('Error reacting to collection:', response.statusText);
                  }
              })
              .catch(error => {
                  console.error('Error reacting to collection:', error);
              });
      });
  }
});
  
  tfoot.appendChild(footerRow);
  table.appendChild(tfoot);
  
  return table;
  }
  
  function createSharedFlipCardTemplate(collection) {
  const flipCard = document.createElement('div');
  flipCard.classList.add('flip-card');
  flipCard.setAttribute('data-collection-id', collection.id);
  
  const flipCardInner = document.createElement('div');
  flipCardInner.classList.add('flip-card-inner');
  
  const flipCardFront = document.createElement('div');
  flipCardFront.classList.add('flip-card-front');
  
  const tableFront = document.createElement('table');
  tableFront.classList.add('clientsTable');
  
  const tbodyFront = document.createElement('tbody');
  tbodyFront.classList.add('clientsTableBody', 'firstPart');
  
  const nameRow = document.createElement('tr');
  const nameHeader = document.createElement('th');
  nameHeader.innerHTML = '<span>⭯ ‎ ‎ Collection‎ ‎ ‎ ‎  Name</span>';
  const nameCell = document.createElement('td');
  nameCell.classList.add('scrollable-content');
  nameCell.innerHTML = `<span>${collection.name}</span>`;
  nameRow.appendChild(nameHeader);
  nameRow.appendChild(nameCell);
  tbodyFront.appendChild(nameRow);
  
  const sharedByRow = document.createElement('tr');
  const sharedByHeader = document.createElement('th');
  sharedByHeader.innerHTML = '<span>Shared by</span>';
  const sharedByCell = document.createElement('td');
  sharedByCell.classList.add('scrollable-content');
  sharedByCell.innerHTML = `<span>${collection.sharedBy}</span>`;
  sharedByRow.appendChild(sharedByHeader);
  sharedByRow.appendChild(sharedByCell);
  tbodyFront.appendChild(sharedByRow);
  
  const postingDateRow = document.createElement('tr');
  const postingDateHeader = document.createElement('th');
  postingDateHeader.innerHTML = '<span>Posting Date</span>';
  const postingDateCell = document.createElement('td');
  postingDateCell.classList.add('scrollable-content');
  postingDateCell.innerHTML = `<span>${collection.postingDate.substring(0,10).replaceAll('-','/')}</span>`;
  postingDateRow.appendChild(postingDateHeader);
  postingDateRow.appendChild(postingDateCell);
  tbodyFront.appendChild(postingDateRow);
  
  tableFront.appendChild(tbodyFront);
  flipCardFront.appendChild(tableFront);
  
  const flipCardBack = document.createElement('div');
  flipCardBack.classList.add('flip-card-back');
  
  const tableBack = document.createElement('table');
  tableBack.classList.add('clientsTable');
  
  const theadBack = document.createElement('thead');
  const headerRowBack = document.createElement('tr');
  const thBack = document.createElement('th');
  thBack.colSpan = 3;
  thBack.innerHTML = '<span>Collection Description</span>';
  headerRowBack.appendChild(thBack);
  theadBack.appendChild(headerRowBack);
  tableBack.appendChild(theadBack);
  
  const tbodyBack = document.createElement('tbody');
  tbodyBack.classList.add('clientsTableBody', 'secondPart');
  
  const descriptionRow = document.createElement('tr');
  const descriptionCell = document.createElement('td');
  descriptionCell.colSpan = 3;
  descriptionCell.innerHTML = `<span>${collection.description}</span>`;
  descriptionRow.appendChild(descriptionCell);
  tbodyBack.appendChild(descriptionRow);
  
  tableBack.appendChild(tbodyBack);
  
  const tfootBack = document.createElement('tfoot');
  const footerRowBack = document.createElement('tr');
  
  ['like', 'dislike', 'visit'].forEach(type => {
    const thBack = document.createElement('th');
    thBack.classList.add(type);
    thBack.innerHTML = `<span class="emoji">${type === 'like' ? '👍🏻' : type === 'dislike' ? '👎🏻' : '🌱'}</span>`;
    footerRowBack.appendChild(thBack);

    if (type === 'visit') {
        thBack.addEventListener('mouseover', function() {
            thBack.style.fontSize = '23.5px';
            if (thBack.classList.contains('visit')) {
                thBack.textContent = 'Visit';
            }
        });

        thBack.addEventListener('mouseout', function() {
            thBack.style.fontSize = '20px';
            if (thBack.classList.contains('visit')) {
                thBack.textContent = '🌱';
            }
        });

        thBack.addEventListener('click', function() {
            console.log('Visit button clicked'); // Debugging line
            try {
                const collectionId = flipCard.getAttribute('data-collection-id');
                const collectionName = collection.name;
                console.log('Flip Collection ID:', collectionId); // Debugging line
                console.log('Flip Collection Name:', collectionName); // Debugging line
                sessionStorage.setItem('data-collection-id', collectionId);
                window.location.href = "./collection.html";
            } catch (error) {
                console.error('Error parsing collectionId or setting localStorage:', error);
            }
        });
    } else {
        thBack.addEventListener('mouseover', function() {
            fetch(`http://localhost:5500/api/reactionCount?collectionId=${collection.id}&reactionType=${type}`)
                .then(response => response.json())
                .then(data => {
                    thBack.textContent = `${type === 'like' ? '👍🏻' : '👎🏻'} ${data.count}`;
                })
                .catch(error => {
                    console.error('Error fetching reaction count:', error);
                });
        });

        thBack.addEventListener('mouseout', function() {
            thBack.textContent = `${type === 'like' ? '👍🏻' : '👎🏻'}`;
        });

        thBack.addEventListener('click', function() {
            fetch('/api/react', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionId: collection.id, reactionType: type })
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error(response.statusText);
                    }
                })
                .then(data => {
                    if (data.success) {
                        thBack.textContent = `${type === 'like' ? '👍🏻' : '👎🏻'}`;
                    } else {
                        console.error('Error reacting to collection:', data.error);
                    }
                })
                .catch(error => {
                    console.error('Error reacting to collection:', error);
                });
        });
    }
});
  
  tfootBack.appendChild(footerRowBack);
  tableBack.appendChild(tfootBack);
  flipCardBack.appendChild(tableBack);
  
  flipCardInner.appendChild(flipCardFront);
  flipCardInner.appendChild(flipCardBack);
  flipCard.appendChild(flipCardInner);
  
  flipCardFront.addEventListener('click', function() {
      flipCardInner.style.transform = "rotateX(180deg)";
  });
  
  flipCardBack.addEventListener('click', function(event) {
      const clickedElement = event.target;
      if (!clickedElement.closest('tfoot')) {
          flipCardInner.style.transform = "rotateX(0deg)";
      }
  });
  
  return flipCard;
  }
  
  function addSharedTableToDiv(divId, collection) {
  console.log(`Adding shared collection to ${divId}`, collection);  // Debugging line
  const div = document.getElementById(divId);
  if (!div) {
      console.error(`Element with id ${divId} not found`);  // Debugging line
      return;
  }
  console.log(`Element with id ${divId} found`);
  const table = (divId === 'switch1') ? createSharedTableTemplate(collection) : createSharedFlipCardTemplate(collection);
  div.appendChild(table);
  
  }

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
  
  
  
  function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  function generateDescription(groupType, groupName) {
    switch (groupType) {
      case 'Hashtags':
        return `Collection generated based on similar attributes`;
      case 'Common Name':
        return `Collection generated based on similar common names`;
      case 'Scientific Name':
        return `Collection generated based on similar scientific names`;
      case 'Genus':
        return `Collection generated based on similar genuses`;
      case 'Family':
        return `Collection generated based on similar families`;
      default:
        return 'Collection of plants';
    }
  }
  
  function sortCollections(option) {
    const switch1Div = document.getElementById('switch1');
    const collections = Array.from(switch1Div.querySelectorAll('.clientsTable'));
  
    let columnIndex;
    if (option === 'name') {
      columnIndex = 1; // Assuming "Collection Name" is the first column
    } else if (option === 'owner') {
      columnIndex = 2; // Assuming "Shared by" is the second column
    } else if (option === 'date') {
      columnIndex = 3; // Assuming "Posting Date" is the third column
    }
  
    if (columnIndex) {
      const sortedCollections = collections.sort((a, b) => {
        const aText = a.querySelector(`.clientsTableBody tr td:nth-child(${columnIndex}) span`).textContent.trim().toLowerCase();
        const bText = b.querySelector(`.clientsTableBody tr td:nth-child(${columnIndex}) span`).textContent.trim().toLowerCase();
        return aText.localeCompare(bText);
      });
  
      // Clear the switch1Div before appending sorted collections
      switch1Div.innerHTML = '';
  
      sortedCollections.forEach(collection => {
        switch1Div.appendChild(collection);
      });
    }
  }
  
  // Event listener for sorting collections
  document.getElementById('sort_input').addEventListener('change', function() {
    const option = this.value;
    sortCollections(option);
  });
  
  
  // Filter collections
  function filterCollections(option) {
    const switch1Div = document.getElementById('switch1');
    const collections = switch1Div.querySelectorAll('.clientsTable');
  
    collections.forEach(collection => {
      const sharedBy = collection.querySelector('.scrollable-content:nth-child(2) span').textContent;
  
      if (option === 'Show AutoGenerated Collections') {
        collectionType = 'autogenerated'
        collection.style.display = (sharedBy === 'AutoGenerated') ? 'table' : 'none';
      } else if (option === 'Show Shared Collections') {
        collectionType = option
        collection.style.display = (sharedBy !== 'AutoGenerated') ? 'table' : 'none';
      }
    });
  }
  
  function filterCollectionsFlipCards(option) {
    const switch2Div = document.getElementById('switch2');
    const flipCards = switch2Div.querySelectorAll('.flip-card');
  
    let first = true
  
    flipCards.forEach(flipCard => {
      if (first) {
        first = false
      } else {
        const flipCardInner = flipCard.querySelector('.flip-card-inner:nth-child(1)');
  
        const frontTable = flipCardInner.querySelector('.flip-card-front .clientsTable .clientsTableBody tr:nth-child(2)');
        const backTable = flipCardInner.querySelector('.flip-card-back .clientsTable');
  
        const frontSharedBy = frontTable.querySelector(' .scrollable-content span').textContent.trim();
  
        console.log(frontSharedBy);
  
        if (option === 'Show AutoGenerated Collections') {
          const action = (frontSharedBy === 'AutoGenerated') ? '' : 'none';
          flipCard.style.display = action;
        } else if (option === 'Show Shared Collections') {
          const action = (frontSharedBy !== 'AutoGenerated') ? '' : 'none';
          flipCard.style.display = action;
        }
      }
    });
  }
  
  // Event listener for sorting collections
  document.getElementById('order_input').addEventListener('change', function() {
    const option = this.value;
    filterCollections(option);
    filterCollectionsFlipCards(option);
  });
  
  function filterTable(nameInputText, clientInputText, dateInputText) {
    let numberOfShowedTables = 0;
  
    if (isTextDisplayOn) {
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
  
        if (((secondCellText.toLowerCase() == collectionType) || collectionType == '' || ((secondCellText.toLowerCase() != "autogenerated") && collectionType == 'Show Shared Collections')) && firstCellText.includes(nameInputText) && secondCellText.includes(clientInputText) && thirdCellText.includes(dateInputText)) {
          table.style.display = '';
          numberOfShowedTables++;
        } else {
          table.style.display = 'none';
        }
      });
    } else {
      const flip_cards = document.querySelectorAll('.flip-card:not(#hideFlip)');
  
      flip_cards.forEach(flip_card => {
        const table = flip_card.querySelector(`table:nth-child(1)`);
        const tableRows = table.querySelectorAll('.scrollable-content');
  
        const firstCellText = tableRows[0].textContent.trim().toLowerCase();
        const secondCellText = tableRows[1].textContent.trim().toLowerCase();
        const thirdCellText = tableRows[2].textContent.trim().toLowerCase();
  
        if (((secondCellText.toLowerCase() == collectionType) || collectionType == '' || ((secondCellText.toLowerCase() != "autogenerated") && collectionType == 'Show Shared Collections')) && firstCellText.includes(nameInputText) && secondCellText.includes(clientInputText) && thirdCellText.includes(dateInputText)) {
          flip_card.style.display = 'flex';
          numberOfShowedTables++;
        } else {
          flip_card.style.display = 'none';
        }
      });
    }
  
    if (numberOfShowedTables > 0) {
      document.getElementById('hideFlip').style.display = 'none';
      document.getElementById('hiddenTable').style.display = 'none';
    } else {
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
  
    if (selectedText === 'Text') {
      document.getElementById('switch1').style.display = '';
      document.getElementById('switch2').style.display = 'none';
      isTextDisplayOn = true;
    } else if (selectedText === 'Visual Spoiler') {
      document.getElementById('switch1').style.display = 'none';
      document.getElementById('switch2').style.display = 'flex';
      isTextDisplayOn = false
    }
  
    const nameInputText = inputs[0].value.trim().toLowerCase();
    const clientInputText = inputs[1].value.trim().toLowerCase();
    const dateInputText = inputs[2].value.trim().toLowerCase();
    filterTable(nameInputText, clientInputText, dateInputText);
  });
  
  fetch('http://localhost:5500/api/allPlants')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch plant data');
      }
      return response.json();
    })
    .then(data => {
      console.log('Plants data:', data);
  
      // Group Plants After Their Hashtags
      const hashtagsGroups = {};
      data.forEach(plant => {
        if (plant.hashtags) {
          const hashtags = plant.hashtags.split(' ');
          hashtags.forEach(tag => {
            if (!hashtagsGroups[tag]) {
              hashtagsGroups[tag] = [];
            }
            hashtagsGroups[tag].push(plant);
          });
        }
      });
  
      // Group Plants After Their Common Name
      const commonNameGroups = {};
      data.forEach(plant => {
        const commonName = plant.common_name;
        if (commonName) {
          if (!commonNameGroups[commonName]) {
            commonNameGroups[commonName] = [];
          }
          commonNameGroups[commonName].push(plant);
        }
      });
  
      // Group Plants After Their Scientific Name
      const scientificNameGroups = {};
      data.forEach(plant => {
        const scientificName = plant.scientific_name;
        if (scientificName) {
          if (!scientificNameGroups[scientificName]) {
            scientificNameGroups[scientificName] = [];
          }
          scientificNameGroups[scientificName].push(plant);
        }
      });
  
      // Group Plants After Their Genus
      const genusGroups = {};
      data.forEach(plant => {
        const genus = plant.genus;
        if (genus) {
          if (!genusGroups[genus]) {
            genusGroups[genus] = [];
          }
          genusGroups[genus].push(plant);
        }
      });
  
      // Group Plants After Their Family
      const familyGroups = {};
      data.forEach(plant => {
        const family = plant.family;
        if (family) {
          if (!familyGroups[family]) {
            familyGroups[family] = [];
          }
          familyGroups[family].push(plant);
        }
      });
  
      const filteredHashtagsGroups = Object.fromEntries(
        Object.entries(hashtagsGroups).filter(([key, value]) => value.length >= 2)
      );
      const filteredCommonNameGroups = Object.fromEntries(
        Object.entries(commonNameGroups).filter(([key, value]) => value.length >= 2)
      );
      const filteredScientificNameGroups = Object.fromEntries(
        Object.entries(scientificNameGroups).filter(([key, value]) => value.length >= 2)
      );
      const filteredGenusGroups = Object.fromEntries(
        Object.entries(genusGroups).filter(([key, value]) => value.length >= 2)
      );
      const filteredFamilyGroups = Object.fromEntries(
        Object.entries(familyGroups).filter(([key, value]) => value.length >= 2)
      );
  
      createTablesForGroups('Hashtags', filteredHashtagsGroups);
      createTablesForGroups('Common Name', filteredCommonNameGroups);
      createTablesForGroups('Scientific Name', filteredScientificNameGroups);
      createTablesForGroups('Genus', filteredGenusGroups);
      createTablesForGroups('Family', filteredFamilyGroups);
  
      const nameInputText = inputs[0].value.trim().toLowerCase();
      const clientInputText = inputs[1].value.trim().toLowerCase();
      const dateInputText = inputs[2].value.trim().toLowerCase();
      filterTable(nameInputText, clientInputText, dateInputText);
    })
    .catch(error => {
      console.error('Error fetching plant data:', error.message);
    });
  
  
  function createTablesForGroups(groupType, groups) {
    const today = formatDate(new Date());
    for (const [groupName, plants] of Object.entries(groups)) {
      if (plants.length >= 2) {
        const plantIds = [];
        for (let i = 0; i < plants.length; i++) {
          plantIds.push(plants[i].plant_id);
        }
        const description = generateDescription(groupType, groupName);
        addTableToDiv('switch1', groupName, 'AutoGenerated', today, description, plantIds);
        addTableToDiv('switch2', groupName, 'AutoGenerated', today, description, plantIds);
      }
    }
  }
  
  function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  function generateDescription(groupType, groupName) {
    switch (groupType) {
      case 'Hashtags':
        return `Collection generated based on similar attributes`;
      case 'Common Name':
        return `Collection generated based on similar common names`;
      case 'Scientific Name':
        return `Collection generated based on similar scientific names`;
      case 'Genus':
        return `Collection generated based on similar genuses`;
      case 'Family':
        return `Collection generated based on similar families`;
      default:
        return 'Collection of plants';
    }
  }
  
  // Creates tables based on template(for GENERATED COLLECTIONS)
  function createTableTemplate(collectionName, sharedBy, postingDate, description, list) {
    const table = document.createElement('table');
    table.classList.add('clientsTable');
  
    table.setAttribute('data-plant-ids', JSON.stringify(list));
  
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
  
    ['Collection Name', 'Shared by', 'Posting Date'].forEach(text => {
      const th = document.createElement('th');
      th.innerHTML = `<span>${text}</span>`;
      headerRow.appendChild(th);
    });
  
    thead.appendChild(headerRow);
    table.appendChild(thead);
  
    const tbody = document.createElement('tbody');
    tbody.classList.add('clientsTableBody');
  
    const dataRow = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.classList.add('scrollable-content');
    nameCell.innerHTML = `<span>${collectionName}</span>`;
    dataRow.appendChild(nameCell);
  
    const sharedByCell = document.createElement('td');
    sharedByCell.classList.add('scrollable-content');
    sharedByCell.innerHTML = `<span>${sharedBy}</span>`;
    dataRow.appendChild(sharedByCell);
  
    const dateCell = document.createElement('td');
    dateCell.classList.add('scrollable-content');
    dateCell.innerHTML = `<span>${postingDate}</span>`;
    dataRow.appendChild(dateCell);
  
    tbody.appendChild(dataRow);
  
    const descriptionHeaderRow = document.createElement('tr');
    const descriptionHeaderCell = document.createElement('th');
    descriptionHeaderCell.colSpan = 3;
    descriptionHeaderCell.innerHTML = '<span>Collection Description</span>';
    descriptionHeaderRow.appendChild(descriptionHeaderCell);
    tbody.appendChild(descriptionHeaderRow);
  
    const descriptionRow = document.createElement('tr');
    const descriptionCell = document.createElement('td');
    descriptionCell.colSpan = 3;
    descriptionCell.innerHTML = `<span>${description}</span>`;
    descriptionRow.appendChild(descriptionCell);
    tbody.appendChild(descriptionRow);
  
    table.appendChild(tbody);
  
    const tfoot = document.createElement('tfoot');
    const footerRow = document.createElement('tr');
  
    ['like', 'dislike', 'visit'].forEach(type => {
      if (type == 'visit') {
        const th = document.createElement('th');
        th.classList.add(type);
        th.innerHTML = `<span class="emoji">${type === 'like' ? '👍🏻' : type === 'dislike' ? '👎🏻' : '🌱'}</span>`;
        footerRow.appendChild(th);
  
        if (type === 'visit') {
          th.addEventListener('mouseover', function() {
            th.style.fontSize = '23.5px';
            if (th.classList.contains('visit')) {
              th.textContent = 'Visit';
            }
          });
  
          th.addEventListener('mouseout', function() {
            th.style.fontSize = '20px';
            if (th.classList.contains('visit')) {
              th.textContent = '🌱';
            }
          });
  
          th.addEventListener('click', function() {
            console.log('Visit button clicked');
            localStorage.setItem('plantIds', JSON.stringify(list));
            localStorage.setItem('title', collectionName);
            window.location.href = 'generatedCollection.html';
          });
        }
  
        th.colSpan = 3;
      }
    });
  
    tfoot.appendChild(footerRow);
    table.appendChild(tfoot);
  
    return table;
  }
  
  function addTableToDiv(divId, collectionName, sharedBy, postingDate, description, list) {
    const div = document.getElementById(divId);
    let table;
    if (divId == 'switch1') {
      table = createTableTemplate(collectionName, sharedBy, postingDate, description, list);
    } else {
      table = createFlipCardTemplate(collectionName, sharedBy, postingDate, description, list);
    }
    div.appendChild(table);
  }
  
  // Creates tables based on template(for Shared Collections)
  function createFlipCardTemplate(collectionName, sharedBy, postingDate, description, list) {
    const flipCard = document.createElement('div');
    flipCard.classList.add('flip-card');
  
    flipCard.setAttribute('data-plant-ids', JSON.stringify(list));
  
    const flipCardInner = document.createElement('div');
    flipCardInner.classList.add('flip-card-inner');
  
    const flipCardFront = document.createElement('div');
    flipCardFront.classList.add('flip-card-front');
  
    const tableFront = document.createElement('table');
    tableFront.classList.add('clientsTable');
  
    const tbodyFront = document.createElement('tbody');
    tbodyFront.classList.add('clientsTableBody', 'firstPart');
  
    const nameRow = document.createElement('tr');
    const nameHeader = document.createElement('th');
    nameHeader.innerHTML = '<span>⭯ ‎ ‎ Collection‎ ‎ ‎ ‎  Name</span>';
    const nameCell = document.createElement('td');
    nameCell.classList.add('scrollable-content');
    nameCell.innerHTML = `<span>${collectionName}</span>`;
    nameRow.appendChild(nameHeader);
    nameRow.appendChild(nameCell);
    tbodyFront.appendChild(nameRow);
  
    const sharedByRow = document.createElement('tr');
    const sharedByHeader = document.createElement('th');
    sharedByHeader.innerHTML = '<span>Shared by</span>';
    const sharedByCell = document.createElement('td');
    sharedByCell.classList.add('scrollable-content');
    sharedByCell.innerHTML = `<span>${sharedBy}</span>`;
    sharedByRow.appendChild(sharedByHeader);
    sharedByRow.appendChild(sharedByCell);
    tbodyFront.appendChild(sharedByRow);
  
    const postingDateRow = document.createElement('tr');
    const postingDateHeader = document.createElement('th');
    postingDateHeader.innerHTML = '<span>Posting Date</span>';
    const postingDateCell = document.createElement('td');
    postingDateCell.classList.add('scrollable-content');
    postingDateCell.innerHTML = `<span>${postingDate}</span>`;
    postingDateRow.appendChild(postingDateHeader);
    postingDateRow.appendChild(postingDateCell);
    tbodyFront.appendChild(postingDateRow);
  
    tableFront.appendChild(tbodyFront);
    flipCardFront.appendChild(tableFront);
  
    const flipCardBack = document.createElement('div');
    flipCardBack.classList.add('flip-card-back');
  
    const tableBack = document.createElement('table');
    tableBack.classList.add('clientsTable');
  
    const theadBack = document.createElement('thead');
    const headerRowBack = document.createElement('tr');
    const thBack = document.createElement('th');
    thBack.colSpan = 3;
    thBack.innerHTML = '<span>Collection Description</span>';
    headerRowBack.appendChild(thBack);
    theadBack.appendChild(headerRowBack);
    tableBack.appendChild(theadBack);
  
    const tbodyBack = document.createElement('tbody');
    tbodyBack.classList.add('clientsTableBody', 'secondPart');
  
    const descriptionRow = document.createElement('tr');
    const descriptionCell = document.createElement('td');
    descriptionCell.colSpan = 3;
    descriptionCell.innerHTML = `<span>${description}</span>`;
    descriptionRow.appendChild(descriptionCell);
    tbodyBack.appendChild(descriptionRow);
  
    tableBack.appendChild(tbodyBack);
  
    const tfootBack = document.createElement('tfoot');
    const footerRowBack = document.createElement('tr');
  
    ['like', 'dislike', 'visit'].forEach(type => {
      if (type == 'visit') {
        const thBack = document.createElement('th');
        thBack.classList.add(type);
        thBack.innerHTML = `<span class="emoji">${type === 'like' ? '👍🏻' : type === 'dislike' ? '👎🏻' : '🌱'}</span>`;
        footerRowBack.appendChild(thBack);
  
        thBack.addEventListener('mouseover', function() {
          thBack.style.fontSize = '23.5px';
          if (thBack.classList.contains('visit')) {
            thBack.textContent = 'Visit';
          }
        });
  
        thBack.addEventListener('mouseout', function() {
          thBack.style.fontSize = '20px';
          if (thBack.classList.contains('visit')) {
            thBack.textContent = '🌱';
          }
        });
  
        thBack.addEventListener('click', function() {
          localStorage.setItem('plantIds', JSON.stringify(list));
          localStorage.setItem('title', collectionName);
          window.location.href = 'generatedCollection.html';
        });
      }
    });
  
    tfootBack.appendChild(footerRowBack);
    tableBack.appendChild(tfootBack);
    flipCardBack.appendChild(tableBack);
  
    flipCardInner.appendChild(flipCardFront);
    flipCardInner.appendChild(flipCardBack);
    flipCard.appendChild(flipCardInner);
  
    flipCardFront.addEventListener('click', function() {
      flipCardInner.style.transform = "rotateX(180deg)";
    });
  
    flipCardBack.addEventListener('click', function(event) {
      const clickedElement = event.target;
      if (!clickedElement.closest('tfoot')) {
        flipCardInner.style.transform = "rotateX(0deg)";
      }
    });
  
    return flipCard;
  }
  });