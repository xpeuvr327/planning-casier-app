// Function to generate the timetable based on user inputs
function generateTimetable() {
    // Get the start time from the input field
    const startTime = document.getElementById('startTime').value;
    // Get the total number of periods from the input field and convert it to an integer
    const totalPeriods = parseInt(document.getElementById('totalPeriods').value);
    // Get the duration of each period from the input field and convert it to an integer
    const timePerPeriod = parseInt(document.getElementById('timePerPeriod').value);
    // Get the pause duration between periods from the input field and convert it to an integer
    const pauseBetweenHours = parseInt(document.getElementById('pauseBetweenHours').value);
    // Get the duration of the bigger pause from the input field and convert it to an integer
    const biggerPauseDuration = parseInt(document.getElementById('biggerPauseDuration').value);
    // Check if the SOL (reading activity) checkbox is checked
    const sol = document.getElementById('sol').checked;

    // Initialize the current time with the start time
    let currentTime = startTime;
    // Array to store the generated time slots
    const times = [];

    // Loop through the total number of periods
    for (let i = 0; i < totalPeriods; i++) {
        // Calculate the end time for the current period
        const endTime = addMinutes(currentTime, timePerPeriod);
        // Add the current period to the times array
        times.push({ start: currentTime, end: endTime });

        // Check if the current period is the one before the bigger pause
        if (i === 2 || i === 7) {
            // Update the current time to include the bigger pause
            currentTime = addMinutes(endTime, biggerPauseDuration);
            // If SOL is checked and it's the first bigger pause, add the SOL period to the times array
            if (sol && i === 2) {
                times.push({ start: endTime, end: currentTime, sol: true });
            }
        } else {
            // Update the current time to include the regular pause
            currentTime = addMinutes(endTime, pauseBetweenHours);
        }
    }

    // Display the generated timetable
    displayTimetable(times);
}

// Function to add minutes to a given time
function addMinutes(time, minutes) {
    // Split the time into hours and minutes
    const [hours, mins] = time.split(':').map(Number);
    // Calculate the total minutes
    const totalMinutes = hours * 60 + mins + minutes;
    // Calculate the new hours and minutes
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    // Return the new time in HH:MM format
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

// Function to display the generated timetable
function displayTimetable(times) {
    // Get the output div element
    const outputDiv = document.getElementById('timetableOutput');
    // Set the inner HTML of the output div to display the generated timetable
    outputDiv.innerHTML = '<h2 class="text-xl font-bold mb-2">Emploi du Temps Généré</h2>';

    // Loop through the times array and create a div for each period
    times.forEach((time, index) => {
        const periodDiv = document.createElement('div');
        periodDiv.className = 'border p-2 mb-2 rounded-lg';
        // Check if the current period is a SOL period
        if (time.sol) {
            periodDiv.innerHTML = `<strong>${time.start} - ${time.end}</strong> <span class="text-red-500">(SOL)</span>`;
        } else {
            periodDiv.innerHTML = `<strong>H${index + 1}: ${time.start} - ${time.end}</strong>`;
        }
        // Append the period div to the output div
        outputDiv.appendChild(periodDiv);
    });
}
