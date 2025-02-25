document.addEventListener('DOMContentLoaded', () => {
    const itemInput = document.getElementById('itemInput');
    const addButton = document.getElementById('addButton');
    const itemList = document.getElementById('itemList');

    addButton.addEventListener('click', () => {
        const itemText = itemInput.value.trim();
        if (itemText) {
            const listItem = document.createElement('li');
            listItem.className = 'flex justify-between items-center p-2 border-b';
            listItem.innerHTML = `
                <span>${itemText}</span>
                <button class="text-red-500">Remove</button>
            `;
            itemList.appendChild(listItem);
            itemInput.value = '';

            // Add functionality to remove items
            const removeButton = listItem.querySelector('button');
            removeButton.addEventListener('click', () => {
                itemList.removeChild(listItem);
            });
        }
    });
});
