document.addEventListener('DOMContentLoaded', function() {
    // Define all questions in sequence with theme now at the beginning
    const questions = [
        {
            id: 'theme',
            title: 'Choisissez votre thème :',
            options: [
                { value: 'blue', label: 'Bleu' },
                { value: 'red', label: 'Rouge' },
                { value: 'gray', label: 'Gris' },
                { value: 'dark', label: 'Nuit' }
            ],
            storageKey: 'theme',
            feedbackMessages: {
                'default': "Thème sélectionné."
            }
        },
        {
            id: 'college-year',
            title: 'Veuillez sélectionner votre année de collège :',
            options: [
                { value: '1', label: '1<sup>ère</sup>&nbsp;année' },
                { value: '2', label: '2<sup>ème</sup>&nbsp;année' },
                { value: '3', label: '3<sup>ème</sup>&nbsp;année' },
                { value: '4', label: '4<sup>ème</sup>&nbsp;année' },
                { value: '0', label: 'Je ne suis pas un élève' }
            ],
            storageKey: 'collegeYear',
            feedbackMessages: {
                '0': "Vous n'êtes pas un élève, mais toutes les fonctionnalités restent disponibles.",
                'default': "Année sélectionnée : "
            }
        },
        {
            id: 'option-specifique',
            title: 'Quelle est votre option spécifique (OS) ?',
            options: [
                { value: 'Allemand', label: 'Arts visuels' },
                { value: 'bio', label: 'Biologie et chimie' },
                { value: 'eco', label: 'Économie et droit' },
                { value: 'phy', label: 'Physique et applications des mathématiques' },
                { value: 'italien', label: 'Italien' },
                { value: 'latin', label: 'Latin' },
                { value: 'grec', label: 'Grec' },
                { value: 'espagnol', label: 'Espagnol' },
                { value: 'musique', label: 'Musique' },
                { value: 'info', label: 'Informatique' }
            ],
            storageKey: 'optionSpecifique',
            feedbackMessages: {
                'default': "Option spécifique sélectionnée."
            },
            condition: (answers) => answers.collegeYear && answers.collegeYear !== '0' && answers.collegeYear !== 'skip'
        },
        {
            id: 'option-complementaire',
            title: 'Quelle est votre option complémentaire (OC) ?',
            options: [
                { value: 'arts', label: 'Arts visuels' },
                { value: 'bio', label: 'Biologie' },
                { value: 'chimie', label: 'Chimie' },
                { value: 'eco', label: 'Économie et droit' },
                { value: 'geo', label: 'Géographie' },
                { value: 'hist', label: 'Histoire' },
                { value: 'info', label: 'Informatique' },
                { value: 'musique', label: 'Musique' },
                { value: 'philo', label: 'Philosophie' },
                { value: 'phy', label: 'Physique' },
                { value: 'sport', label: 'Sport' },
                { value: 'math', label: 'Mathématiques' }
            ],
            storageKey: 'optionComplementaire',
            feedbackMessages: {
                'default': "Option complémentaire sélectionnée."
            },
            condition: (answers) => answers.collegeYear && (answers.collegeYear === '3' || answers.collegeYear === '4')
        },
        {
            id: 'has-locker',
            title: 'Avez-vous un casier au collège ?',
            options: [
                { value: 'yes', label: 'Oui' },
                { value: 'no', label: 'Non' }
            ],
            storageKey: 'hasLocker',
            feedbackMessages: {
                'no': "Vous pourrez toujours accéder au planning.",
                'default': "Information enregistrée."
            },
            condition: (answers) => answers.collegeYear && answers.collegeYear !== '0' && answers.collegeYear !== 'skip'
        }
    ];

    // Theme configurations
    const themeConfigs = {
        blue: {
            primary: '#007bff',
            secondary: '#87CEEB',
            accent: '#0056b3',
            background: 'linear-gradient(135deg, #e0f7ff 0%, #c5e8ff 100%)',
            text: '#333333',
            shadow: 'rgba(0, 123, 255, 0.2)'
        },
        red: {
            primary: '#dc3545',
            secondary: '#ff8a80',
            accent: '#b71c1c',
            background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            text: '#333333',
            shadow: 'rgba(220, 53, 69, 0.2)'
        },
        black: {
            primary: '#343a40',
            secondary: '#6c757d',
            accent: '#212529',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            text: '#212529',
            shadow: 'rgba(52, 58, 64, 0.2)'
        },
        custom: {
            primary: '#6200ea',
            secondary: '#b388ff',
            accent: '#3700b3',
            background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
            text: '#333333',
            shadow: 'rgba(98, 0, 234, 0.2)'
        }
    };

    // Track current question and user answers
    let currentQuestionIndex = 0;
    const userAnswers = {};

    // Function to apply theme
    function applyTheme(themeName) {
        if (!themeName || !themeConfigs[themeName]) {
            themeName = 'blue'; // Default theme
        }
        
        const theme = themeConfigs[themeName];
        const root = document.documentElement;
        
        // Set CSS variables
        root.style.setProperty('--primary-color', theme.primary);
        root.style.setProperty('--secondary-color', theme.secondary);
        root.style.setProperty('--accent-color', theme.accent);
        root.style.setProperty('--background', theme.background);
        root.style.setProperty('--text-color', theme.text);
        root.style.setProperty('--shadow-color', theme.shadow);
        
        // Apply background to body
        document.body.style.background = theme.background;
        
        // Store selected theme if not already stored
        if (!localStorage.getItem('theme')) {
            localStorage.setItem('theme', themeName);
        }
    }

    // Load any previously saved answers from localStorage
    function loadSavedAnswers() {
        questions.forEach(question => {
            const saved = localStorage.getItem(question.storageKey);
            if (saved) {
                userAnswers[question.storageKey] = saved;
            }
        });
        
        // Apply saved theme if exists
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            applyTheme(savedTheme);
        } else {
            applyTheme('blue'); // Default
        }
    }

    // Determine the starting question based on saved data
    function determineStartingQuestion() {
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            
            // Skip questions with conditions that aren't met
            if (question.condition && !question.condition(userAnswers)) {
                continue;
            }
            
            // If we don't have an answer for this valid question, start here
            if (!userAnswers[question.storageKey]) {
                return i;
            }
        }
        
        // If all questions are answered, start at the beginning
        return 0;
    }

    // Function to render the current question
    function renderCurrentQuestion() {
        // Get the current question
        while (currentQuestionIndex < questions.length) {
            const question = questions[currentQuestionIndex];
            
            // Skip this question if its condition isn't met
            if (question.condition && !question.condition(userAnswers)) {
                currentQuestionIndex++;
                continue;
            }
            
            // Found a valid question, render it
            break;
        }
        
        // Check if we've reached the end
        if (currentQuestionIndex >= questions.length) {
            // All questions complete, redirect to index.html
            window.location.href = 'index.html';
            return;
        }
        
        const question = questions[currentQuestionIndex];
        
        // Get the question container
        const container = document.querySelector('.custom-radio-group');
        
        // Set transition for smooth fade out
        container.style.transition = 'opacity 0.3s ease-out';
        container.style.opacity = '0';
        
        // Wait for fade out, then update content
        setTimeout(() => {
            // Clear previous content
            container.innerHTML = '';
            
            // Add question title
            const title = document.createElement('h2');
            title.innerHTML = question.title;
            container.appendChild(title);
            
            // Add options
            question.options.forEach(option => {
                const label = document.createElement('label');
                label.className = 'custom-radio-container';
                label.innerHTML = `
                    <input type="radio" name="custom-radio" value="${option.value}" />
                    <span class="custom-radio-checkmark"></span>
                    ${option.label}
                `;
                
                // For theme question, add color preview
                if (question.id === 'theme') {
                    const colorPreview = document.createElement('span');
                    colorPreview.className = 'color-preview';
                    colorPreview.style.backgroundColor = themeConfigs[option.value].primary;
                    label.appendChild(colorPreview);
                }
                
                container.appendChild(label);
            });
            
            // Add buttons
            const submitBtn = document.createElement('button');
            submitBtn.id = 'submit-btn';
            submitBtn.className = 'action-button bg-gray-500 text-white py-2 px-4 rounded cursor-not-allowed';
            submitBtn.textContent = 'Suivant';
            submitBtn.disabled = true;
            container.appendChild(submitBtn);
            
            const skipBtn = document.createElement('button');
            skipBtn.id = 'skip-btn';
            skipBtn.className = 'nav-button secondary-button text-gray-500 underline px-4 rounded hover:text-gray-700 cursor-pointer';
            skipBtn.textContent = 'Passer';
            container.appendChild(skipBtn);
            
            // Setup radio button event listeners
            setupRadioButtons();
            
            // Fade in
            container.style.opacity = '1';
        }, 300); // Match this delay with the CSS transition time
    }

    // Function to setup radio button event listeners
    function setupRadioButtons() {
        const submitButton = document.getElementById('submit-btn');
        const radioButtons = document.querySelectorAll('input[name="custom-radio"]');
        const skipButton = document.getElementById('skip-btn');
        const currentQuestion = questions[currentQuestionIndex];

        // Function to update button state
        function updateSubmitButton() {
            const isSelected = Array.from(radioButtons).some(radio => radio.checked);
            if (isSelected) {
                submitButton.classList.remove('bg-gray-500', 'cursor-not-allowed');
                submitButton.classList.add('bg-blue-500', 'hover:bg-blue-600', 'cursor-pointer');
                submitButton.disabled = false;
                
                // For theme question, apply theme immediately on selection
                if (currentQuestion.id === 'theme') {
                    const selectedValue = document.querySelector('input[name="custom-radio"]:checked').value;
                    applyTheme(selectedValue);
                }
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
            // Store skipped value
            localStorage.setItem(currentQuestion.storageKey, 'skip');
            userAnswers[currentQuestion.storageKey] = 'skip';
            
            // If skipping theme, set default theme
            if (currentQuestion.id === 'theme') {
                localStorage.setItem('theme', 'blue');
                applyTheme('blue');
            }
            
            // Show feedback message if skipping
            showFeedbackAndProceed("Question ignorée.");
        });

        // Add event listener to submit button
        submitButton.addEventListener('click', function() {
            const selectedValue = document.querySelector('input[name="custom-radio"]:checked');
            if (selectedValue) {
                // Store the selected value
                localStorage.setItem(currentQuestion.storageKey, selectedValue.value);
                userAnswers[currentQuestion.storageKey] = selectedValue.value;
                
                // Determine feedback message
                let feedbackMessage;
                if (currentQuestion.feedbackMessages[selectedValue.value]) {
                    feedbackMessage = currentQuestion.feedbackMessages[selectedValue.value];
                } else if (currentQuestion.feedbackMessages.default) {
                    if (currentQuestion.feedbackMessages.default.includes(':')) {
                        // For feedback messages that should append the selected option label
                        const selectedOption = currentQuestion.options.find(opt => opt.value === selectedValue.value);
                        feedbackMessage = currentQuestion.feedbackMessages.default + selectedOption.label.replace(/<[^>]*>/g, '');
                    } else {
                        feedbackMessage = currentQuestion.feedbackMessages.default;
                    }
                } else {
                    feedbackMessage = "Sélection enregistrée.";
                }
                
                // Show feedback and move to next question
                showFeedbackAndProceed(feedbackMessage);
            }
        });

        // Initial check to set the button state
        updateSubmitButton();
    }

    // Function to show feedback and proceed to next question
    function showFeedbackAndProceed(message) {
        const container = document.querySelector('.custom-radio-group');
        
        // Fade out current question
        container.style.opacity = '0';
        
        setTimeout(() => {
            // Show feedback message
            container.innerHTML = `<p class="text-gray-600 text-center p-4">${message}</p>`;
            container.style.opacity = '1';
            
            // Wait briefly to show the message, then move to next question
            setTimeout(() => {
                container.style.opacity = '0';
                setTimeout(() => {
                    currentQuestionIndex++;
                    renderCurrentQuestion();
                }, 300);
            }, 1200); // How long to show the feedback message
        }, 300);
    }

    // Initialize
    loadSavedAnswers();
    currentQuestionIndex = determineStartingQuestion();
    renderCurrentQuestion();
});