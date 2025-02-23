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

    const schedule = {};
    newWeekDays.forEach(day => {
        schedule[day] = [];
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
            if (data.schedule[day]) {
                const event = data.schedule[day].find(e => e.period === i + 1);
                if (event) {
                    cell.textContent = `${event.subject} - ${event.notes}`;
                }
            }
            addCellClickListener(cell, day, i + 1, data);
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
        promptForSubject()
            .then(subject => {
                if (subject) {
                    return promptForNotes().then(notes => ({ subject, notes }));
                }
                throw new Error('No subject provided');
            })
            .then(({ subject, notes }) => {
                if (notes) {
                    const day = dayMapping[dayLetter];
                    createOrUpdateEvent(day, period, subject, notes, data);
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
 * Prompt the user to enter the subject.
 * @returns {Promise<string>} - The subject entered by the user.
 */
function promptForSubject() {
    return UIkit.modal.prompt('Entrez la matière:', '');
}

/**
 * Prompt the user to enter notes for the event.
 * @returns {Promise<string>} - The notes entered by the user.
 */
function promptForNotes() {
    return UIkit.modal.prompt('Entrez des notes pour l\'événement:', '');
}

/**
 * Create or update an event in the schedule.
 * @param {string} day - The day of the week.
 * @param {number} period - The period of the day.
 * @param {string} subject - The subject of the event.
 * @param {string} notes - The notes for the event.
 * @param {Object} data - The week data.
 */
function createOrUpdateEvent(day, period, subject, notes, data) {
    const event = { period, subject, notes };

    if (!data.schedule[day]) {
        data.schedule[day] = [];
    }

    const eventIndex = data.schedule[day].findIndex(e => e.period === event.period);

    if (eventIndex !== -1) {
        data.schedule[day][eventIndex] = event;
    } else {
        data.schedule[day].push(event);
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
