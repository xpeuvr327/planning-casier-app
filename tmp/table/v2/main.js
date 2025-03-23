window.onload = function() {
    initializeApp();
};

let currentWeek = 1;

/**
 * Initialize the application by setting up the initial state and event listeners.
 */
function initializeApp() {
    const urlParams = new URLSearchParams(window.location.search);
    const weekParam = urlParams.get("week");
    currentWeek = determineCurrentWeek(weekParam);
    populateWeekSelector(); 
    if (!urlParams.get("profile")) {
        loadWeek(currentWeek);
    }
    document.getElementById("prevWeek").addEventListener("click", navigateToPreviousWeek);
    document.getElementById("nextWeek").addEventListener("click", navigateToNextWeek);
    document.getElementById("uploadJson").addEventListener("change", handleFileUpload);
    document.getElementById("viewAllTasks").addEventListener("click", showAllTasks);
    document.getElementById("downloadUpdatedJson").addEventListener("click", downloadUpdatedJson);
    document.querySelector(".custom-file-upload").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            document.getElementById("uploadJson").click();
        }
    });
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

function navigateToPreviousWeek() {
    if (currentWeek > 1) {
        currentWeek--;
        loadWeek(currentWeek);
    }
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
function navigateToNextWeek() {
    currentWeek++;
    loadWeek(currentWeek);
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
 * Save the week data to local storage.
 * @param {number} week - The week number.
 * @param {Object} data - The week data.
 */
function saveWeekData(week, data) {
    localStorage.setItem(`week${week}`, JSON.stringify(data));
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

    console.log(diffWeeks);
    return diffWeeks;
}

/**
 * Load the week data from local storage and display it in the planner.
 * @param {number} week - The week number to load.
 */
function loadWeek(week) {
    const data = getWeekData(week);
    if (data) {
        displayPlanner(data);
    } else {
        const newWeekData = generateNewWeekData(week);
        saveWeekData(week, newWeekData);
        displayPlanner(newWeekData);
    }
}

/**
 * Get the week data from local storage.
 * @param {number} week - The week number.
 * @returns {Object|null} - The week data or null if not found.
 */
function getWeekData(week) {
    const data = localStorage.getItem(`week${week}`);
    return data ? JSON.parse(data) : null;
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
let monthName = '';

function generateNewWeekData(week) {
    const startDate = new Date("2024-08-26");
    startDate.setDate(startDate.getDate() + (week - 1) * 7);
    const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
    const newWeekDays = [];
    for (let i = 0; i < days.length; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        monthName = currentDate.toLocaleString('default', { month: 'long' });
        newWeekDays.push(`${days[i]} ${currentDate.getDate()}`);
    }
    const schedule = {};
    Object.keys(dayMapping).forEach((dayLetter) => {
        schedule[dayLetter] = [];
    });
    return { days: newWeekDays, schedule: schedule, totalHours: 11, timeScheme: "default" };
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
    const headerRow = document.createElement("tr");
    const header = document.createElement("th");
    const monthNameSpan=document.getElementById("monthSpace");
    monthNameSpan.textContent=monthName;
    header.textContent = "Heure/Jour";
    headerRow.appendChild(header);
    days.forEach((day) => {
        const header = document.createElement("th");
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
 * Show all homework tasks from all weeks
 */
function showAllTasks() {
    // Gather all tasks from local storage
    const allTasks = getAllHomeworkTasks();

    // Create modal with tasks
    displayTasksModal(allTasks);
}

/**
 * Gather all homework tasks from all weeks in local storage
 * @returns {Array} Array of homework tasks with week, day, and period information
 */
function getAllHomeworkTasks() {
    const allTasks = [];

    // Loop through all items in local storage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        // Check if the key is a week data item
        if (key && key.startsWith('week')) {
            try {
                const weekNum = parseInt(key.replace('week', ''), 10);
                const weekData = JSON.parse(localStorage.getItem(key));

                // Process the schedule for this week
                if (weekData && weekData.schedule) {
                    // Loop through each day in the schedule
                    for (const dayLetter in weekData.schedule) {
                        if (weekData.schedule.hasOwnProperty(dayLetter)) {
                            const dayName = dayMapping[dayLetter];

                            // Loop through events for this day
                            weekData.schedule[dayLetter].forEach(event => {
                                // Check if the event has homework
                                if (event.homework && event.homework.length > 0) {
                                    // Get the actual day (e.g., "Lundi 26")
                                    let fullDayName = "";
                                    if (weekData.days && weekData.days.length > 0) {
                                        // Find the day that starts with the day name
                                        const dayIndex = Object.values(dayMapping).indexOf(dayName);
                                        if (dayIndex !== -1 && dayIndex < weekData.days.length) {
                                            fullDayName = weekData.days[dayIndex];
                                        }
                                    }

                                    // Add each homework task
                                    event.homework.forEach(hw => {
                                        allTasks.push({
                                            id: hw.id,
                                            title: hw.title,
                                            content: hw.content,
                                            subject: event.subject,
                                            week: weekNum,
                                            day: fullDayName || dayName,
                                            dayLetter: dayLetter,
                                            period: event.period
                                        });
                                    });
                                }
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(`Error processing ${key}:`, error);
            }
        }
    }

    // Sort tasks by week, then by day
    allTasks.sort((a, b) => {
        if (a.week !== b.week) {
            return a.week - b.week;
        }

        // Same week, sort by day (using the order in dayMapping)
        const dayOrderA = Object.keys(dayMapping).indexOf(a.dayLetter);
        const dayOrderB = Object.keys(dayMapping).indexOf(b.dayLetter);

        return dayOrderA - dayOrderB;
    });

    return allTasks;
}

/**
 * Display the tasks in a modal
 * @param {Array} tasks - Array of homework tasks
 */
function displayTasksModal(tasks) {
    // Group tasks by week
    const tasksByWeek = {};
    tasks.forEach(task => {
        if (!tasksByWeek[task.week]) {
            tasksByWeek[task.week] = [];
        }
        tasksByWeek[task.week].push(task);
    });

    // Create modal content
    const modalContainer = document.createElement('div');

    let modalContent = `
        <div class="uk-modal-dialog uk-modal-body uk-margin-auto-vertical" style="max-width: 800px;">
            <button class="uk-modal-close-default" type="button" uk-close></button>
            <h2 class="uk-modal-title">Tous les devoirs</h2>
    `;

    // Check if there are any tasks
    if (Object.keys(tasksByWeek).length === 0) {
        modalContent += `
            <div class="uk-alert uk-alert-primary">
                <p>Aucun devoir trouvé. Ajoutez des devoirs dans le planning pour les voir ici.</p>
            </div>
        `;
    } else {
        // Add tasks grouped by week
        modalContent += `<div uk-filter="target: .tasks-grid">
            <ul class="uk-subnav uk-subnav-pill">
                <li class="uk-active" uk-filter-control><a href="#">Tous</a></li>
        `;

        // Create filter buttons for each week
        Object.keys(tasksByWeek).sort((a, b) => parseInt(a) - parseInt(b)).forEach(week => {
            modalContent += `<li uk-filter-control="filter: [data-week='${week}']"><a href="#">Semaine ${week}</a></li>`;
        });

        modalContent += `</ul>
            <div class="tasks-grid uk-child-width-1-1" uk-grid>`;

        // Add all tasks with appropriate filter attributes
        tasks.forEach(task => {
            modalContent += `
                <div data-week="${task.week}">
                    <div class="uk-card uk-card-default uk-card-hover uk-margin-small">
                        <div class="uk-card-header uk-padding-small">
                            <div class="uk-grid-small uk-flex-middle" uk-grid>
                                <div class="uk-width-expand">
                                    <h3 class="uk-card-title uk-margin-remove-bottom">${task.title}</h3>
                                    <p class="uk-text-meta uk-margin-remove-top">
                                        ${task.subject} - Semaine ${task.week} - ${task.day}
                                    </p>
                                </div>
                                <div class="uk-width-auto">
                                    <button class="uk-button uk-button-small uk-button-primary view-task"
                                        data-week="${task.week}"
                                        data-day="${task.dayLetter}"
                                        data-period="${task.period}"
                                        data-id="${task.id}">
                                        Voir détails
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="uk-card-body uk-padding-small">
                            <div class="uk-text-small">${task.content.substring(0, 100)}${task.content.length > 100 ? '...' : ''}</div>
                        </div>
                    </div>
                </div>
            `;
        });

        modalContent += `</div></div>`;
    }

    modalContent += `</div>`;
    modalContainer.innerHTML = modalContent;

    // Create the modal
    const modal = UIkit.modal(modalContainer, { bgClose: true, center: true });
    modal.show();

    // Add event listeners for the view buttons
    const viewButtons = modalContainer.querySelectorAll('.view-task');
    viewButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const weekNum = button.getAttribute('data-week');
            const dayLetter = button.getAttribute('data-day');
            const period = parseInt(button.getAttribute('data-period'), 10);
            const homeworkId = button.getAttribute('data-id');

            // Load week data for this task
            const weekData = JSON.parse(localStorage.getItem(`week${weekNum}`));
            if (weekData && weekData.schedule && weekData.schedule[dayLetter]) {
                const event = weekData.schedule[dayLetter].find(e => e.period === period);
                if (event && event.homework) {
                    const homework = event.homework.find(hw => hw.id === homeworkId);
                    if (homework) {
                        // Hide the current modal
                        modal.hide();

                        // Show detailed view for this homework
                        showTaskDetailModal(homework, event, weekNum, dayLetter, period, weekData);
                    }
                }
            }
        });
    });
}

/**
 * Show a detailed view of a homework task
 * @param {Object} homework - The homework object
 * @param {Object} event - The event the homework belongs to
 * @param {number} weekNum - The week number
 * @param {string} dayLetter - The day letter
 * @param {number} period - The period
 * @param {Object} weekData - The week data
 */
function showTaskDetailModal(homework, event, weekNum, dayLetter, period, weekData) {
    const dayName = dayMapping[dayLetter];

    // Find full day name
    let fullDayName = "";
    if (weekData.days && weekData.days.length > 0) {
        // Find the day that starts with the day name
        const dayIndex = Object.values(dayMapping).indexOf(dayName);
        if (dayIndex !== -1 && dayIndex < weekData.days.length) {
            fullDayName = weekData.days[dayIndex];
        }
    }

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = `
        <div class="uk-modal-dialog uk-modal-body uk-margin-auto-vertical">
            <button class="uk-modal-close-default" type="button" uk-close></button>
            <h2 class="uk-modal-title">${homework.title}</h2>
            <div class="uk-grid-small" uk-grid>
                <div class="uk-width-1-2">
                    <p><strong>Matière:</strong> ${event.subject}</p>
                </div>
                <div class="uk-width-1-2">
                    <p><strong>Semaine:</strong> ${weekNum}</p>
                </div>
                <div class="uk-width-1-2">
                    <p><strong>Jour:</strong> ${fullDayName || dayName}</p>
                </div>
                <div class="uk-width-1-2">
                    <p><strong>Période:</strong> ${period}</p>
                </div>
            </div>
            <div class="uk-margin">
                <div class="uk-card uk-card-default uk-card-body">
                    ${homework.content}
                </div>
            </div>
            <div class="uk-margin-top uk-text-right">
                <button id="btn-edit-task" class="uk-button uk-button-primary">Modifier</button>
                <button id="btn-delete-task" class="uk-button uk-button-danger">Supprimer</button>
                <button id="btn-back-to-tasks" class="uk-button uk-button-default">Retour à la liste</button>
                <button class="uk-button uk-button-default uk-modal-close">Fermer</button>
            </div>
        </div>
    `;

    const modal = UIkit.modal(modalContainer, { bgClose: true, center: true });
    modal.show();

    // Add event listeners for the buttons
    modalContainer.querySelector('#btn-edit-task').addEventListener('click', () => {
        modal.hide();
        editHomework(homework, dayLetter, period, weekData, event, () => {
            // After editing, return to the tasks view
            showAllTasks();
        });
    });

    modalContainer.querySelector('#btn-delete-task').addEventListener('click', () => {
        modal.hide();
        UIkit.modal.confirm('Êtes-vous sûr de vouloir supprimer ce devoir?')
            .then(() => {
                deleteHomework(homework.id, dayLetter, period, weekData);
                // After deleting, return to the tasks view
                showAllTasks();
            })
            .catch(() => {
                // User canceled the deletion, return to the tasks view
                showAllTasks();
            });
    });

    modalContainer.querySelector('#btn-back-to-tasks').addEventListener('click', () => {
        modal.hide();
        showAllTasks();
    });
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

            // Get the data from local storage
            const data = JSON.parse(localStorage.getItem(`week${currentWeek}`));

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

        if (title) {
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
                message: 'Veuillez ajouter un titre',
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
                    <button id="btn-modify" class="uk-button uk-button-primary uk-width-1-1">Modifier</button>
                </div>
                <div>
                    <button id="btn-add-homework" class="uk-button uk-button-secondary uk-width-1-1">Ajouter un devoir</button>
                </div>
                <div>
                    <button id="btn-delete" class="uk-button uk-button-danger uk-width-1-1">Supprimer</button>
                </div>
                <div>
                    <button class="uk-button uk-button-default uk-modal-close uk-width-1-1">Annuler</button>
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
                <button id="btn-edit-homework" class="uk-button uk-button-primary">Modifier</button>
                <button id="btn-delete-homework" class="uk-button uk-button-danger">Supprimer</button>
                <button class="uk-button uk-button-default uk-modal-close">Fermer</button>
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
 * Modified version of editHomework to support a callback after editing
 * @param {Object} homework - The homework object
 * @param {string} dayLetter - The letter representing the day of the week
 * @param {number} period - The period of the day
 * @param {Object} data - The week data
 * @param {Object} event - The event object
 * @param {Function} callback - Optional callback function to execute after editing
 */
function editHomework(homework, dayLetter, period, data, event, callback) {
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
                    const weekNumber = parseInt(currentWeek, 10);
                    saveWeekData(weekNumber, data);
                    displayPlanner(data);

                    modal.hide();

                    // Execute callback if provided
                    if (typeof callback === 'function') {
                        callback();
                    }
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
        // Define subjects based on college year
        let subjects = [];
        const collegeYear = localStorage.getItem("collegeYear");

        // Define default subjects for all years
        const defaultSubjects = [
            {label:'Veuillez choisir une option', options:['Veuillez choisir une option']},
            {label:'Sélection', options:['Français','Math']},
            {label:'Sciences', options:['Math','Info','Physique','Bio','Chimie']},
            {label:'Langues', options:['Français','Allemand','Italien','Anglais','Espagnol','Latin','Grec']},
            {label:'Général', options:['Histoire','Droit','Éco','Sport']},
            {label:'Arts', options:['Arts visuels','Histoire de l\'art',"Musique"]}
        ];

        // Use default subjects for years 1-4
        if (collegeYear == 1 || collegeYear == 2 || collegeYear == 3 || collegeYear == 4) {
            subjects = defaultSubjects;
        } else {
            // For undefined/null/0/skip or any other value, use default subjects
            subjects = defaultSubjects;
        }

        // Add "Autre" option to all categories
        subjects.push({label:'Autre', options:['Autre']});

        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = `
            <div class="uk-modal-dialog uk-modal-body uk-margin-auto-vertical">
                <h2 class="uk-modal-title">Choisissez la matière</h2>
                <select id="subject-select" class="uk-select">
                    ${subjects.map(group => `
                        <optgroup label="${group.label}">
                            ${group.options.map(option => `<option value="${option}" ${option === defaultSubject ? 'selected' : ''}>${option}</option>`).join('')}
                        </optgroup>
                    `).join('')}
                </select>
                <div id="other-subject-container" class="uk-margin" style="display: none;">
                    <label class="p-0" for="other-subject">Autre matière:</label>
                    <div class="uk-form-controls">
                        <input id="other-subject" class="uk-input" type="text" placeholder="Entrez le nom de la matière">
                    </div>
                </div>
                <p class="uk-text-right">
                    <button class="uk-button uk-button-default uk-modal-close" type="button">Annuler</button>
                    <button class="uk-button uk-button-primary" type="button">Confirmer</button>
                </p>
            </div>
        `;

        const modal = UIkit.modal(modalContainer, { bgClose: false, center: true });
        modal.show();

        // Handle the "Autre" option selection
        const selectElement = modalContainer.querySelector('#subject-select');
        const otherSubjectContainer = modalContainer.querySelector('#other-subject-container');
        const otherSubjectInput = modalContainer.querySelector('#other-subject');

        selectElement.addEventListener('change', () => {
            if (selectElement.value === 'Autre') {
                otherSubjectContainer.style.display = 'block';
            } else {
                otherSubjectContainer.style.display = 'none';
            }
        });

        // Check initial selection
        if (selectElement.value === 'Autre') {
            otherSubjectContainer.style.display = 'block';
        }

        // Handle confirmation
        modalContainer.querySelector('.uk-button-primary').addEventListener('click', () => {
            const selectedValue = selectElement.value;

            if (selectedValue === 'Autre') {
                const customSubject = otherSubjectInput.value.trim();
                if (customSubject) {
                    resolve(customSubject);
                } else {
                    UIkit.notification({
                        message: 'Veuillez entrer le nom de la matière',
                        status: 'danger',
                        timeout: 3000
                    });
                    return;
                }
            } else if (selectedValue === 'Veuillez choisir une option') {
                UIkit.notification({
                    message: 'Veuillez sélectionner une matière',
                    status: 'danger',
                    timeout: 3000
                });
                return;
            } else {
                resolve(selectedValue);
            }

            modal.hide();
        });

        // Handle cancel
        modalContainer.querySelector('.uk-modal-close').addEventListener('click', () => {
            reject(new Error('Subject selection cancelled'));
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
 * Load the list of weeks and populate them
 */
function populateWeekSelector() {
    const selectElement = document.getElementById("weekSelect");
    selectElement.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Choisissez une semaine";
    selectElement.appendChild(defaultOption);

    // Extract week numbers from localStorage keys
    const weekNumbers = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("week")) {
            const weekNumber = parseInt(key.replace("week", ""), 10);
            if (!isNaN(weekNumber)) {
                weekNumbers.push(weekNumber);
            }
        }
    }

    // Sort the week numbers in ascending order
    weekNumbers.sort((a, b) => a - b);

    // Append sorted week numbers to the select element
    weekNumbers.forEach(weekNumber => {
        const option = document.createElement("option");
        option.value = weekNumber;
        option.textContent = `Semaine ${weekNumber}`;
        selectElement.appendChild(option);
    });

    const urlParams = new URLSearchParams(window.location.search);
    const weekParam = urlParams.get("week");
    if (weekParam) {
        selectElement.value = weekParam;
    }

    selectElement.addEventListener("change", handleWeekSelection);
}



function handleWeekSelection() {
    const selectElement = document.getElementById("weekSelect");
    const selectedWeek = selectElement.value;
    if (selectedWeek) {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set("week", selectedWeek);
        window.history.pushState({}, "", newUrl);
        currentWeek = parseInt(selectedWeek, 10);
        if (!isNaN(currentWeek)) {
            populateWeekSelector();
            loadWeek(selectedWeek);
        }
    }
}


/**
 * Download the updated JSON data for the current week.
 */
function downloadUpdatedJson() {
    const data = JSON.parse(localStorage.getItem(`week${currentWeek}`));
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `week${currentWeek}.json`;
    link.click();
}
