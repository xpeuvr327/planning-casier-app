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
    return fetch(`weeks/week${week < 10 ? '0' + week : week}.json`)
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
        schedule: schedule
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
 * Create the table data.
 * @param {HTMLTableElement} table - The table element.
 * @param {Object} data - The week data.
 */
function createTableData(table, data) {
    for (let i = 0; i < 11; i++) {
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
                    cell.textContent = `${event.subject} - ${event.notes}`;
                }
            }
            addCellClickListener(cell, dayLetter, i + 1, data);
            row.appendChild(cell);
        });

        table.appendChild(row);
    }
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
        selectSubject()
            .then(subject => {
                if (subject) {
                    return promptForNotes().then(notes => ({ subject, notes }));
                }
                throw new Error('No subject provided');
            })
            .then(({ subject, notes }) => {
                if (notes) {
                    const day = dayMapping[dayLetter];
                    createOrUpdateEvent(dayLetter, period, subject, notes, data);

                    // Ask if the event should be duplicated to the next period
                    UIkit.modal.confirm('Ce cours dure t-il les deux heures?')
                        .then(() => {
                            // Duplicate to the next period
                            const nextPeriod = period + 1;
                            console.log(dayLetter);
                            console.log(period);
                            console.log(nextPeriod);
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
    });
}


/**
 * Prompt the user to select the subject using a Franken UI select dropdown with optgroups.
 * @returns {Promise<string>} - The subject selected by the user.
 */
function selectSubject() {
    return new Promise((resolve, reject) => {
        // Define subjects with optgroups
        const subjects = [
            {
                label:'Veuillez choisir une option',
                options:['Veuillez choisir une option']
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

        // Create a unique modal container
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = `
            <div class="uk-modal-dialog uk-modal-body uk-margin-auto-vertical">
                <h2 class="uk-modal-title">Choisissez la matière</h2>
                <select class="uk-select">
                    ${subjects.map(group => `
                        <optgroup label="${group.label}">
                            ${group.options.map(option => `<option value="${option}">${option}</option>`).join('')}
                        </optgroup>
                    `).join('')}
                </select>
                <p class="uk-text-right">
                    <button class="uk-button uk-button-default uk-modal-close drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]" type="button">Annuler</button>
                    <button class="uk-button uk-button-primary drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]" type="button">Confirmer</button>
                </p>
            </div>
        `;

        // Use UIkit to show the modal
        const modal = UIkit.modal(modalContainer, { bgClose: false, center: true });
        modal.show();

        // Add event listener to the confirm button
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

        // Clean up the modal from the DOM after hiding
        modal.$destroy = true;
    });
}



/**
 * Prompt the user to enter notes for the event.
 * @returns {Promise<string>} - The notes entered by the user.
 */
function promptForNotes() {
    return UIkit.modal.prompt('Entrez des notes pour l\'événement:', '');
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
    fetch(`time${timeScheme}.json`)
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
    fetch('profiles.json')
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
