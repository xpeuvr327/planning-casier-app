document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit-btn');
    const radioButtons = document.querySelectorAll('input[name="custom-radio"]');
    const skipButton = document.getElementById('skip-btn');

    // Function to check if any radio button is selected
    function updateSubmitButton() {
        const isSelected = Array.from(radioButtons).some(radio => radio.checked);
        if (isSelected) {
            submitButton.classList.remove('bg-gray-500', 'cursor-not-allowed');
            submitButton.classList.add('bg-blue-500', 'hover:bg-blue-600', 'cursor-pointer');
            submitButton.disabled = false;
        } else {
            submitButton.classList.remove('bg-blue-500', 'hover:bg-blue-600', 'cursor-pointer');
            submitButton.classList.add('bg-gray-500', 'cursor-not-allowed');
            submitButton.disabled = true;
        }

    }

    // Add event listeners to radio buttons
    radioButtons.forEach(radio => {
        radio.addEventListener('change', updateSubmitButton);
    });

    // Add event listener to skip button
    skipButton.addEventListener('click', function() {
        submitButton.classList.remove('bg-gray-500', 'cursor-not-allowed');
        submitButton.classList.add('bg-blue-500', 'hover:bg-blue-600', 'cursor-pointer');
        submitButton.disabled = false;
        localStorage.setItem('collegeYear', 'skip');
    });

    // Initial check to set the button state
    updateSubmitButton();

    // Function to update localStorage with the selected radio button value
    function updateLocalStorage() {
        const selectedValue = document.querySelector('input[name="custom-radio"]:checked');
        if (selectedValue) {
            localStorage.setItem('collegeYear', selectedValue.value);
        } else {
            localStorage.removeItem('collegeYear');
        }
    }

    // Add event listeners to radio buttons
    radioButtons.forEach(radio => {
        radio.addEventListener('change', updateLocalStorage);
    });
});
