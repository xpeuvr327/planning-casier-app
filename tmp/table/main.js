window.onload = function() {
    initializeApp();
};

/**
 * Initialize the application by setting up the initial state and event listeners.
 */
function initializeApp() {
    const urlParams = new URLSearchParams(window.location.search);
    const weekParam = urlParams.get('week');
    currentWeek = determineCurrentWeek(weekParam);

    loadProfiles();

    if (!urlParams.get('profile')) {
        loadWeek(currentWeek);
    }

    document.getElementById('prevWeek').addEventListener('click', navigateToPreviousWeek);
    document.getElementById('nextWeek').addEventListener('click', navigateToNextWeek);
    document.getElementById('uploadJson').addEventListener('change', handleFileUpload);
    document.getElementById('downloadUpdatedJson').addEventListener('click', downloadUpdatedJson);
}

/**
 * Determine the current week based on the URL parameter or the current date.
 * @param {string} weekParam - The week parameter from the URL.
 * @returns {number} - The current week number.
 */
function determineCurrentWeek(weekParam) {
    if (weekParam) {
        return parseInt(weekParam, 10);
    } else {
        return weeksBetweenDates('2024-08-24');
    }
}

function navigateToPreviousWeek() {
    if (currentWeek > 1) {
        currentWeek--;
        loadWeek(currentWeek);
    }
}

function navigateToNextWeek() {
    currentWeek++;
    loadWeek(currentWeek);
    console.log(currentWeek);
}

/**
 * Handle the file upload event.
 * @param {Event} event - The file upload event.
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        readFile(file);
    }
}

/**
 * Read the uploaded file and process its content.
 * @param {File} file - The uploaded file.
 */
function readFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            saveWeekData(currentWeek, data);
            displayPlanner(data);
        } catch (error) {
            console.error('Error parsing JSON file:', error);
        }
    };
    reader.readAsText(file);
}

/**
 * Save the week data to session storage.
 * @param {number} week - The week number.
 * @param {Object} data - The week data.
 */
function saveWeekData(week, data) {
    sessionStorage.setItem(`week${week}`, JSON.stringify(data));
}

/**
 * Calculate the number of weeks between a given date and the current date.
 * @param {string} date - The base date in 'YYYY-MM-DD' format.
 * @returns {number} - The number of weeks between the given date and the current date.
 */
function weeksBetweenDates(date) {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const firstDate = new Date(date);
    const secondDate = new Date();

    const diffDays = Math.ceil(Math.abs((firstDate - secondDate) / oneDay));
    const diffWeeks = Math.ceil(diffDays / 7);

    return diffWeeks;
}

/**
 * Load the week data from a JSON file and display it in the planner.
 * @param {number} week - The week number to load.
 */
function loadWeek(week) {
    fetchWeekData(week)
        .then(data => {
            saveWeekData(week, data);
            console.log(`Week ${week} data loaded from JSON:`, data);
            displayPlanner(data);
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
            handleWeekDataError(week);
        });
}

/**
 * Fetch the week data from a JSON file.
 * @param {number} week - The week number to fetch.
 * @returns {Promise} - The promise that resolves to the week data.
 */
function fetchWeekData(week) {
    return fetch(`data/week${week < 10 ? '0' + week : week}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        });
}

/**
 * Handle errors that occur when fetching week data.
 * @param {number} week - The week number.
 */
function handleWeekDataError(week) {
    if (confirm('Voulez-vous créer une nouvelle semaine? (Reset après reload)')) {
        const newWeekData = generateNewWeekData(week);
        saveWeekData(week, newWeekData);
        displayPlanner(newWeekData);
    }
}

const dayMapping = {
    a: 'Lundi',
    b: 'Mardi',
    c: 'Mercredi',
    d: 'Jeudi',
    e: 'Vendredi'
};

// Reverse mapping for convenience
const reverseDayMapping = Object.fromEntries(
    Object.entries(dayMapping).map(([key, value]) => [value, key])
);

/**
 * Generate new week data.
 * @param {number} week - The week number.
 * @returns {Object} - The new week data.
 */
function generateNewWeekData(week) {
    const startDate = new Date('2024-08-26');
    startDate.setDate(startDate.getDate() + (week - 1) * 7);

    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    const newWeekDays = [];

    for (let i = 0; i < days.length; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        newWeekDays.push(`${days[i]} ${currentDate.getDate()}`);
    }

    // Initialize schedule using day letters
    const schedule = {};
    Object.keys(dayMapping).forEach(dayLetter => {
        schedule[dayLetter] = [];
    });

    return {
        days: newWeekDays,
        schedule: schedule,
        totalHours: 11, // Add default total hours
        timeScheme: "default" // Add default time scheme
    };
}


/**
 * Display the planner with the given data.
 * @param {Object} data - The week data.
 */
function displayPlanner(data) {
    const table = document.getElementById('planner');
    table.innerHTML = '';

    createTableHeaders(table, data.days);
    createTableData(table, data);

    if (data.timeScheme) {
        fetchTimeScheme(data.timeScheme);
    }
}

/**
 * Create the table headers.
 * @param {HTMLTableElement} table - The table element.
 * @param {Array} days - The days of the week.
 */
function createTableHeaders(table, days) {
    const headerRow = document.createElement('tr');
    const header = document.createElement('th');
    header.textContent = 'Heure/Jour';
    headerRow.appendChild(header);

    days.forEach(day => {
        const header = document.createElement('th');
        header.textContent = day;
        headerRow.appendChild(header);
    });

    table.appendChild(headerRow);
}

/**
 * Create the table data with support for homework display
 * @param {HTMLTableElement} table - The table element
 * @param {Object} data - The week data
 */
function createTableData(table, data) {
    let totalHours = data.totalHours;
        
    if (totalHours === undefined || totalHours === null || isNaN(totalHours)) {
        totalHours = 11; 
        console.log("ff");
        console.log(totalHours);
    } else {
        
        totalHours = Math.floor(Number(totalHours));
    }
    for (let i = 0; i < totalHours; i++) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.textContent = `Heure ${i + 1}`;
        row.appendChild(cell);

        data.days.forEach(day => {
            const dayLetter = reverseDayMapping[day.split(' ')[0]]; // ref as in "c1"
            const cell = document.createElement('td');
            cell.id = `${dayLetter}${i + 1}`;
            if (data.schedule[dayLetter]) {
                const event = data.schedule[dayLetter].find(e => e.period === i + 1);
                if (event) {
                    // Create the cell content
                    let cellContent = `${event.subject} - ${event.notes}`;
                    
                    // Check if the event has homework
                    if (event.homework && event.homework.length > 0) {
                        cellContent += `<div class="uk-margin-small-top">`;
                        event.homework.forEach(hw => {
                            cellContent += `<span class="uk-badge uk-background-secondary homework-badge" 
                                               data-day="${dayLetter}" 
                                               data-period="${i+1}" 
                                               data-id="${hw.id}">${hw.title}</span> `;
                        });
                        cellContent += `</div>`;
                    }
                    
                    cell.innerHTML = cellContent;
                }
            }
            addCellClickListener(cell, dayLetter, i + 1, data);
            row.appendChild(cell);
        });

        table.appendChild(row);
    }
    
    // Add click listeners for homework badges
    addHomeworkBadgeListeners();
}


/**
 * Add click listeners to all homework badges
 */
function addHomeworkBadgeListeners() {
    const badges = document.querySelectorAll('.homework-badge');
    badges.forEach(badge => {
        badge.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the cell click event from firing
            
            const dayLetter = badge.getAttribute('data-day');
            const period = parseInt(badge.getAttribute('data-period'), 10);
            const homeworkId = badge.getAttribute('data-id');
            
            // Get the data from session storage
            const data = JSON.parse(sessionStorage.getItem(`week${currentWeek}`));
            
            // Find the event
            const event = data.schedule[dayLetter]?.find(e => e.period === period);
            if (event && event.homework) {
                // Find the homework
                const homework = event.homework.find(hw => hw.id === homeworkId);
                if (homework) {
                    showHomeworkDetails(homework, dayLetter, period, data, event);
                }
            }
        });
    });
}

/**
 * Add a click event listener to a table cell.
 * @param {HTMLTableCellElement} cell - The table cell.
 * @param {string} dayLetter - The letter representing the day of the week.
 * @param {number} period - The period of the day.
 * @param {Object} data - The week data.
 */
function addCellClickListener(cell, dayLetter, period, data) {
    cell.addEventListener('click', () => {
        const event = data.schedule[dayLetter]?.find(e => e.period === period);
        if (event) {
            // Cell is already populated, show options menu
            showCellOptionsMenu(cell, dayLetter, period, data, event);
        } else {
            // Cell is not populated, create a new event
            createNewEvent(dayLetter, period, data);
        }
    });
}


/**
 * Handle creating a new event
 * @param {string} dayLetter - The letter representing the day of the week
 * @param {number} period - The period of the day
 * @param {Object} data - The week data
 */
/**
 * Handle creating a new event
 * @param {string} dayLetter - The letter representing the day of the week
 * @param {number} period - The period of the day
 * @param {Object} data - The week data
 */
function createNewEvent(dayLetter, period, data) {
    selectSubject()
        .then(subject => {
            if (subject && subject !== 'Veuillez choisir une option') {
                return promptForNotes().then(notes => ({ subject, notes }));
            }
            throw new Error('No subject provided or invalid selection');
        })
        .then(({ subject, notes }) => {
            if (notes) {
                createOrUpdateEvent(dayLetter, period, subject, notes, data);

                // Check if the period is an odd number and not 5 or 11
                const isOddPeriod = period % 2 !== 0 && period !== 5 && period !== 11;

                if (isOddPeriod) {
                    // Automatically duplicate to the next period
                    const nextPeriod = period + 1;
                    if (nextPeriod <= data.totalHours) {
                        copyCell(`${dayLetter}${period}`, `${dayLetter}${nextPeriod}`, data);
                    }
                } else {
                    // Ask if the event should be duplicated to the next period
                    UIkit.modal.confirm('Ce cours dure t-il les deux heures?')
                        .then(() => {
                            // Duplicate to the next period
                            const nextPeriod = period + 1;
                            if (nextPeriod <= data.totalHours) {
                                copyCell(`${dayLetter}${period}`, `${dayLetter}${nextPeriod}`, data);
                            }
                        })
                        .catch(() => {
                            // Do nothing if the user cancels
                        });
                }
            } else {
                throw new Error('No notes provided');
            }
        })
        .catch(error => {
            console.error(error.message);
        });
}

/**
 * Add homework to an existing event
 * @param {string} dayLetter - The letter representing the day of the week
 * @param {number} period - The period of the day
 * @param {Object} data - The week data
 * @param {Object} event - The existing event
 */
function addHomework(dayLetter, period, data, event) {
    // Create a modal for adding homework
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = `
        <div class="uk-modal-dialog uk-modal-body uk-margin-auto-vertical">
            <h2 class="uk-modal-title">Ajouter un devoir pour ${event.subject}</h2>
            <form class="uk-form-stacked">
                <div class="uk-margin">
                    <label class="uk-form-label" for="homework-title">Titre</label>
                    <div class="uk-form-controls">
                        <input id="homework-title" class="uk-input" type="text" placeholder="Titre du devoir">
                    </div>
                </div>
                <div class="uk-margin">
                    <label class="uk-form-label" for="homework-content">Contenu</label>
                    <div class="uk-form-controls">
                        <textarea id="homework-content" class="uk-textarea" rows="5" placeholder="Détails du devoir"></textarea>
                    </div>
                </div>
                <div class="uk-margin uk-text-right">
                    <button type="button" class="uk-button uk-button-default uk-modal-close">Annuler</button>
                    <button type="button" id="btn-save-homework" class="uk-button uk-button-primary">Enregistrer</button>
                </div>
            </form>
        </div>
    `;
    
    const modal = UIkit.modal(modalContainer, { bgClose: false, center: true });
    modal.show();
    
    // Add event listener for saving the homework
    modalContainer.querySelector('#btn-save-homework').addEventListener('click', () => {
        const title = modalContainer.querySelector('#homework-title').value.trim();
        const content = modalContainer.querySelector('#homework-content').value.trim();
        
        if (title && content) {
            // Generate a unique ID for this homework
            const homeworkId = `hw_${Date.now()}`;
            
            // Create the homework object
            const homework = {
                id: homeworkId,
                title: title,
                content: content
            };
            
            // Find the event in the data
            const eventIndex = data.schedule[dayLetter].findIndex(e => e.period === period);
            if (eventIndex !== -1) {
                // Initialize homework array if it doesn't exist
                if (!data.schedule[dayLetter][eventIndex].homework) {
                    data.schedule[dayLetter][eventIndex].homework = [];
                }
                
                // Add the new homework
                data.schedule[dayLetter][eventIndex].homework.push(homework);
                
                // Save and refresh
                saveWeekData(currentWeek, data);
                displayPlanner(data);
                
                modal.hide();
            }
        } else {
            UIkit.notification({
                message: 'Veuillez remplir tous les champs',
                status: 'danger',
                pos: 'top-center',
                timeout: 3000
            });
        }
    });
}

/**
 * Update cell display to show homework
 * @param {string} dayLetter - The letter representing the day of the week
 * @param {number} period - The period of the day
 * @param {Object} data - The week data
 */
function updateCellWithHomework(dayLetter, period, data) {
    const cell = document.getElementById(`${dayLetter}${period}`);
    if (cell) {
        const event = data.schedule[dayLetter].find(e => e.period === period);
        if (event && event.homework) {
            cell.innerHTML = `${event.subject} - ${event.notes}<br><span class="uk-badge uk-background-secondary">Devoir</span>`;
        }
    }
}

/**
 * Shows a custom menu with options for a filled cell
 * @param {HTMLTableCellElement} cell - The table cell element
 * @param {string} dayLetter - The letter representing the day of the week
 * @param {number} period - The period of the day
 * @param {Object} data - The week data
 * @param {Object} event - The existing event
 */
function showCellOptionsMenu(cell, dayLetter, period, data, event) {
    // Create a modal for the menu
    const modalContainer = document.createElement('div');
    
    // Add homework list if there are any
    let homeworkListHtml = '';
    if (event.homework && event.homework.length > 0) {
        homeworkListHtml = `
            <div class="uk-margin-medium-top">
                <h3>Devoirs</h3>
                <ul class="uk-list uk-list-divider">
                    ${event.homework.map(hw => 
                        `<li><a href="#" class="homework-item" data-homework-id="${hw.id}">${hw.title}</a></li>`
                    ).join('')}
                </ul>
            </div>
        `;
    }
    
    modalContainer.innerHTML = `
        <div class="uk-modal-dialog uk-modal-body uk-margin-auto-vertical">
            <h2 class="uk-modal-title">${event.subject} - ${event.notes}</h2>
            ${homeworkListHtml}
            <div class="uk-grid-small uk-child-width-1-1 uk-grid uk-margin-medium-top">
                <div>
                    <button id="btn-modify" class="uk-button uk-button-primary uk-width-1-1 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Modifier</button>
                </div>
                <div>
                    <button id="btn-add-homework" class="uk-button uk-button-secondary uk-width-1-1 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Ajouter un devoir</button>
                </div>
                <div>
                    <button id="btn-delete" class="uk-button uk-button-danger uk-width-1-1 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Supprimer</button>
                </div>
                <div>
                    <button class="uk-button uk-button-default uk-modal-close uk-width-1-1 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Annuler</button>
                </div>
            </div>
        </div>
    `;

    const modal = UIkit.modal(modalContainer, { bgClose: true, center: true });
    modal.show();

    // Add event listeners for each button
    modalContainer.querySelector('#btn-modify').addEventListener('click', () => {
        modal.hide();
        modifyEvent(cell, dayLetter, period, data, event);
    });

    modalContainer.querySelector('#btn-add-homework').addEventListener('click', () => {
        modal.hide();
        addHomework(dayLetter, period, data, event);
    });

    modalContainer.querySelector('#btn-delete').addEventListener('click', () => {
        modal.hide();
        UIkit.modal.confirm('Êtes-vous sûr de vouloir supprimer cet événement?')
            .then(() => {
                deleteEvent(dayLetter, period, data);
            })
            .catch(() => {
                // User canceled the deletion
            });
    });
    
    // Add event listeners for homework items
    const homeworkItems = modalContainer.querySelectorAll('.homework-item');
    homeworkItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const homeworkId = item.getAttribute('data-homework-id');
            const homework = event.homework.find(hw => hw.id === homeworkId);
            if (homework) {
                showHomeworkDetails(homework, dayLetter, period, data, event);
            }
        });
    });
}
/**
 * Show homework details in a modal
 * @param {Object} homework - The homework object
 * @param {string} dayLetter - The letter representing the day of the week
 * @param {number} period - The period of the day
 * @param {Object} data - The week data
 * @param {Object} event - The event object
 */
function showHomeworkDetails(homework, dayLetter, period, data, event) {
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = `
        <div class="uk-modal-dialog uk-modal-body uk-margin-auto-vertical">
            <button class="uk-modal-close-default" type="button" uk-close></button>
            <h2 class="uk-modal-title">${homework.title}</h2>
            <div class="uk-margin">
                <div class="uk-alert">${homework.content}</div>
            </div>
            <div class="uk-margin-top uk-text-right">
                <button id="btn-edit-homework" class="uk-button uk-button-primary drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Modifier</button>
                <button id="btn-delete-homework" class="uk-button uk-button-danger drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Supprimer</button>
                <button class="uk-button uk-button-default uk-modal-close drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Fermer</button>
            </div>
        </div>
    `;
    
    const modal = UIkit.modal(modalContainer, { bgClose: true, center: true });
    modal.show();
    
    // Add event listeners for editing and deleting homework
    modalContainer.querySelector('#btn-edit-homework').addEventListener('click', () => {
        modal.hide();
        editHomework(homework, dayLetter, period, data, event);
    });
    
    modalContainer.querySelector('#btn-delete-homework').addEventListener('click', () => {
        modal.hide();
        UIkit.modal.confirm('Êtes-vous sûr de vouloir supprimer ce devoir?')
            .then(() => {
                deleteHomework(homework.id, dayLetter, period, data);
            })
            .catch(() => {
                // User canceled the deletion
            });
    });
}

/**
 * Delete a homework item
 * @param {string} homeworkId - The ID of the homework to delete
 * @param {string} dayLetter - The letter representing the day of the week
 * @param {number} period - The period of the day
 * @param {Object} data - The week data
 */
function deleteHomework(homeworkId, dayLetter, period, data) {
    // Find the event in the data
    const eventIndex = data.schedule[dayLetter].findIndex(e => e.period === period);
    if (eventIndex !== -1 && data.schedule[dayLetter][eventIndex].homework) {
        // Filter out the homework with the given ID
        data.schedule[dayLetter][eventIndex].homework = data.schedule[dayLetter][eventIndex].homework.filter(hw => hw.id !== homeworkId);
        
        // Save and refresh
        saveWeekData(currentWeek, data);
        displayPlanner(data);
    }
}

/**
 * Edit an existing homework
 * @param {Object} homework - The homework object
 * @param {string} dayLetter - The letter representing the day of the week
 * @param {number} period - The period of the day
 * @param {Object} data - The week data
 * @param {Object} event - The event object
 */
function editHomework(homework, dayLetter, period, data, event) {
    // Create a modal for editing homework
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = `
        <div class="uk-modal-dialog uk-modal-body uk-margin-auto-vertical">
            <h2 class="uk-modal-title">Modifier le devoir</h2>
            <form class="uk-form-stacked">
                <div class="uk-margin">
                    <label class="uk-form-label" for="homework-title">Titre</label>
                    <div class="uk-form-controls">
                        <input id="homework-title" class="uk-input" type="text" value="${homework.title}">
                    </div>
                </div>
                <div class="uk-margin">
                    <label class="uk-form-label" for="homework-content">Contenu</label>
                    <div class="uk-form-controls">
                        <textarea id="homework-content" class="uk-textarea" rows="5">${homework.content}</textarea>
                    </div>
                </div>
                <div class="uk-margin uk-text-right">
                    <button type="button" class="uk-button uk-button-default uk-modal-close">Annuler</button>
                    <button type="button" id="btn-update-homework" class="uk-button uk-button-primary">Mettre à jour</button>
                </div>
            </form>
        </div>
    `;
    
    const modal = UIkit.modal(modalContainer, { bgClose: false, center: true });
    modal.show();
    
    // Add event listener for updating the homework
    modalContainer.querySelector('#btn-update-homework').addEventListener('click', () => {
        const title = modalContainer.querySelector('#homework-title').value.trim();
        const content = modalContainer.querySelector('#homework-content').value.trim();
        
        if (title && content) {
            // Find the event in the data
            const eventIndex = data.schedule[dayLetter].findIndex(e => e.period === period);
            if (eventIndex !== -1 && data.schedule[dayLetter][eventIndex].homework) {
                // Find the homework in the array
                const homeworkIndex = data.schedule[dayLetter][eventIndex].homework.findIndex(hw => hw.id === homework.id);
                if (homeworkIndex !== -1) {
                    // Update the homework
                    data.schedule[dayLetter][eventIndex].homework[homeworkIndex].title = title;
                    data.schedule[dayLetter][eventIndex].homework[homeworkIndex].content = content;
                    
                    // Save and refresh
                    saveWeekData(currentWeek, data);
                    displayPlanner(data);
                    
                    modal.hide();
                }
            }
        } else {
            UIkit.notification({
                message: 'Veuillez remplir tous les champs',
                status: 'danger',
                pos: 'top-center',
                timeout: 3000
            });
        }
    });
}

/**
 * Delete an existing event from the schedule.
 * @param {string} dayLetter - The letter representing the day of the week.
 * @param {number} period - The period of the day.
 * @param {Object} data - The week data.
 */
function deleteEvent(dayLetter, period, data) {
    if (data.schedule[dayLetter]) {
        const eventIndex = data.schedule[dayLetter].findIndex(e => e.period === period);
        if (eventIndex !== -1) {
            data.schedule[dayLetter].splice(eventIndex, 1);
            saveWeekData(currentWeek, data);
            displayPlanner(data);
        }
    }
}


/**
 * Prompt the user to select the subject with a default value.
 * @param {string} defaultSubject - The default subject to display.
 * @returns {Promise<string>} - The subject selected by the user.
 */
function selectSubject(defaultSubject = '') {
    return new Promise((resolve, reject) => {
        const subjects = [
            {
                label:'Veuillez choisir une option',
                options:['Veuillez choisir une option']
            },
            {
                label:'Sélection',
                options: ['Français', 'Math']
            },
            {
                label: 'Sciences',
                options: ['Math', 'Info', 'Physique', 'Bio', 'Chimie']
            },
            {
                label: 'Langues',
                options: ['Français', 'Allemand', 'Italien', 'Anglais', 'Espagnol', 'Latin', 'Grec']
            },
            {
                label: 'Général',
                options: ['Histoire', 'Géo', 'Droit', 'Éco', 'Sport']
            },
            {
                label: 'Arts',
                options: ['Arts visuels', "Musique"]
            }
        ];

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = `
            <div class="uk-modal-dialog uk-modal-body uk-margin-auto-vertical">
                <h2 class="uk-modal-title">Choisissez la matière</h2>
                <select class="uk-select">
                    ${subjects.map(group => `
                        <optgroup label="${group.label}">
                            ${group.options.map(option => `<option value="${option}" ${option === defaultSubject ? 'selected' : ''}>${option}</option>`).join('')}
                        </optgroup>
                    `).join('')}
                </select>
                <p class="uk-text-right">
                    <button class="uk-button uk-button-default uk-modal-close drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]" type="button">Annuler</button>
                    <button class="uk-button uk-button-primary drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]" type="button">Confirmer</button>
                </p>
            </div>
        `;

        const modal = UIkit.modal(modalContainer, { bgClose: false, center: true });
        modal.show();

        modalContainer.querySelector('.uk-button-primary').addEventListener('click', () => {
            const selectElement = modalContainer.querySelector('.uk-select');
            const subject = selectElement.value;
            if (subject) {
                resolve(subject);
            } else {
                reject(new Error('No subject selected'));
            }
            modal.hide();
        });

        modal.$destroy = true;
    });
}

/**
 * Modify an existing event in the schedule.
 * @param {HTMLTableCellElement} cell - The table cell.
 * @param {string} dayLetter - The letter representing the day of the week.
 * @param {number} period - The period of the day.
 * @param {Object} data - The week data.
 * @param {Object} event - The existing event.
 */
function modifyEvent(cell, dayLetter, period, data, event) {
    selectSubject(event.subject)
        .then(subject => {
            if (subject) {
                return promptForNotes(event.notes).then(notes => ({ subject, notes }));
            }
            throw new Error('No subject provided');
        })
        .then(({ subject, notes }) => {
            if (notes) {
                createOrUpdateEvent(dayLetter, period, subject, notes, data);

                // Ask if the event should be duplicated to the next period
                UIkit.modal.confirm('Ce cours dure t-il les deux heures?')
                    .then(() => {
                        // Duplicate to the next period
                        const nextPeriod = period + 1;
                        if (nextPeriod <= 11) { // Assuming there are 11 periods
                            copyCell(`${dayLetter}${period}`, `${dayLetter}${nextPeriod}`, data);
                        }
                    })
                    .catch(() => {
                        // Do nothing if the user cancels
                    });
            } else {
                throw new Error('No notes provided');
            }
        })
        .catch(error => {
            console.error(error.message);
        });
}

/**
 * Prompt the user to enter notes for the event with a default value.
 * @param {string} defaultNotes - The default notes to display.
 * @returns {Promise<string>} - The notes entered by the user.
 */
function promptForNotes(defaultNotes = '') {
    return UIkit.modal.prompt('Entre la salle: ', defaultNotes);
}

/**
 * Copy the event data from one cell to another.
 * @param {string} copyFrom - The ID of the cell to copy from.
 * @param {string} copyTo - The ID of the cell to copy to.
 * @param {Object} data - The week data.
 */
function copyCell(copyFrom, copyTo, data) {
    console.log("copyCell function triggered");
    
    // Extract day letters and periods from the cell IDs
    const fromDayLetter = copyFrom[0];
    const fromPeriod = parseInt(copyFrom.slice(1), 10);
    const toDayLetter = copyTo[0];
    const toPeriod = parseInt(copyTo.slice(1), 10);
    
    console.log(`Copying from ${fromDayLetter}${fromPeriod} to ${toDayLetter}${toPeriod}`);
    console.log("Current schedule:", data.schedule);
    
    // Find the event in the source cell
    const fromDay = data.schedule[fromDayLetter];
    if (!fromDay) {
        console.error(`No schedule found for day ${fromDayLetter}`);
        return;
    }
    
    const eventToCopy = fromDay.find(e => e.period === fromPeriod);
    if (!eventToCopy) {
        console.error(`No event found for period ${fromPeriod} on day ${fromDayLetter}`);
        return;
    }
    
    console.log("Event to copy:", eventToCopy);
    
    // Create or update the event in the target cell
    if (!data.schedule[toDayLetter]) {
        data.schedule[toDayLetter] = [];
    }
    
    // Remove any existing event in the target period
    const existingEventIndex = data.schedule[toDayLetter].findIndex(e => e.period === toPeriod);
    if (existingEventIndex !== -1) {
        data.schedule[toDayLetter].splice(existingEventIndex, 1);
    }
    
    // Add the copied event
    const newEvent = {
        period: toPeriod,
        subject: eventToCopy.subject,
        notes: eventToCopy.notes
    };
    
    data.schedule[toDayLetter].push(newEvent);
    
    // Save the updated data and refresh the display
    saveWeekData(currentWeek, data);
    displayPlanner(data);
    
    console.log(`Event copied successfully to ${toDayLetter}${toPeriod}`);
}

/**
 * Create or update an event in the schedule.
 * @param {string} day - The day of the week.
 * @param {number} period - The period of the day.
 * @param {string} subject - The subject of the event.
 * @param {string} notes - The notes for the event.
 * @param {Object} data - The week data.
 */
function createOrUpdateEvent(dayLetter, period, subject, notes, data) {
    const event = { period, subject, notes };

    if (!data.schedule[dayLetter]) {
        data.schedule[dayLetter] = [];
    }

    const eventIndex = data.schedule[dayLetter].findIndex(e => e.period === event.period);

    if (eventIndex !== -1) {
        data.schedule[dayLetter][eventIndex] = event;
    } else {
        data.schedule[dayLetter].push(event);
    }

    saveWeekData(currentWeek, data);
    console.log(`Event created/updated for week ${currentWeek}:`, data);
    displayPlanner(data);
}

/**
 * Fetch the time scheme data and display it in the planner.
 * @param {string} timeScheme - The time scheme identifier.
 */
function fetchTimeScheme(timeScheme) {
    fetch(`data/time${timeScheme}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(timeData => {
            displayTimeData(timeData);
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

/**
 * Display the time data in the planner.
 * @param {Object} timeData - The time data.
 */
function displayTimeData(timeData) {
    for (let i = 0; i < timeData.times.length; i++) {
        const heureCell = document.querySelector(`tr:nth-child(${i + 2}) td:first-child`);
        if (heureCell && !heureCell.dataset.timeAdded) {
            heureCell.innerHTML += `<br>${timeData.times[i].start} - ${timeData.times[i].end}`;
            heureCell.setAttribute('data-time-added', 'true');
        }
    }
}

/**
 * Load profiles from a JSON file and populate the profile selector.
 */
function loadProfiles() {
    fetch('data/profiles.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(profiles => {
            populateProfileSelector(profiles);
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

/**
 * Populate the profile selector with profiles from the JSON file.
 * @param {Array} profiles - The profiles data.
 */
function populateProfileSelector(profiles) {
    const selectElement = document.getElementById('nameSelect');
    selectElement.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Choisissez un profil';
    selectElement.appendChild(defaultOption);

    profiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile.value;
        option.textContent = profile.name;
        selectElement.appendChild(option);
    });

    const urlParams = new URLSearchParams(window.location.search);
    const profileParam = urlParams.get('week');
    if (profileParam) {
        selectElement.value = profileParam;
    }

    selectElement.addEventListener('change', handleProfileSelection);
}

/**
 * Handle the profile selection event.
 */
function handleProfileSelection() {
    const selectElement = document.getElementById('nameSelect');
    const selectedProfile = selectElement.value;
    if (selectedProfile) {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('week', selectedProfile);
        window.history.pushState({}, '', newUrl);
        currentWeek = parseInt(selectedProfile, 10);
        loadWeek(currentWeek);
    }
}

/**
 * Download the updated JSON data for the current week.
 */
function downloadUpdatedJson() {
    const data = JSON.parse(sessionStorage.getItem(`week${currentWeek}`));
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `week${currentWeek}.json`;
    link.click();
}
