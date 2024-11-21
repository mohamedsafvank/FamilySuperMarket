// Add hover effect to input fields dynamically using JavaScript
const inputs = document.querySelectorAll('.form-container input');
inputs.forEach(input => {
    input.addEventListener('mouseover', () => {
        input.style.backgroundColor = '#f0f0f0';
        input.style.borderColor = '#bbb';
    });

    input.addEventListener('mouseout', () => {
        input.style.backgroundColor = '';
        input.style.borderColor = '';
    });
});

// Add hover effect to the button dynamically using JavaScript
const button = document.querySelector('.form-container button');
button.addEventListener('mouseover', () => {
    button.style.backgroundColor = '#4CAF50';
    button.style.color = '#fff';
    button.style.borderColor = '#4CAF50';
});

button.addEventListener('mouseout', () => {
    button.style.backgroundColor = 'transparent';
    button.style.color = 'white';
    button.style.borderColor = 'white';
});

// Handle form submission
document.getElementById('stockForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const formObject = {};
    formData.forEach((value, key) => {
        formObject[key] = value;
    });

    try {
        const response = await fetch('/submit-form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formObject),
        });

        const data = await response.json();

        showToast(data.message, data.status === 'success' ? 'success' : 'error');

        if (data.status === 'success') {
            this.reset(); // Reset the form if submission is successful
            fetchStockItems(); // Refresh the table after form submission
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('An unexpected error occurred!', 'error');
    }
});

// Function to display a toast notification
function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000); // Hide toast after 3 seconds
}

// Fetch stock items and populate the table
// Fetch stock items and populate the table
async function fetchStockItems() {
    try {
        const response = await fetch('/get-stock');
        const data = await response.json();

        console.log('Fetched products:', data);

        if (data.status === 'success') {
            const tableBody = document.querySelector('#stockTable tbody');
            tableBody.innerHTML = ''; // Clear existing rows

            data.data.forEach(item => {
                const discountPercentage = getDiscountByCategory(item.category);
                const discountAmount = (item.rate * item.quantity * discountPercentage) / 100;
                const totalAmount = (item.rate * item.quantity) - discountAmount;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.productId}</td>
                    <td>${item.productName.toLowerCase()}</td>
                    <td>${item.category}</td>
                    <td>${item.quantity}</td>
                    <td>${item.rate.toFixed(2)}</td>
                    <td>${discountPercentage}%</td>
                    <td>${item.price}</td>
                    <td>${totalAmount.toFixed(2)}</td>
                    <td>
                        <div class="icons">
                            <i class="fa-solid fa-trash" data-id="${item.productId}"></i>
                            <i class="fa-solid fa-pen-to-square"></i>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            // Add event listener to delete icons
            document.querySelectorAll('.fa-trash').forEach(icon => {
                icon.addEventListener('click', async (e) => {
                    const productId = e.target.getAttribute('data-id');
                    await deleteProduct(productId);
                });
            });
        } else {
            console.error('Failed to fetch products:', data.message);
        }
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

async function deleteProduct(productId) {
    // Show the custom modal
    const modal = document.getElementById('confirmationModal');
    const confirmButton = document.getElementById('confirmDeleteBtn');
    const cancelButton = document.getElementById('cancelDeleteBtn');
    
    // Display the modal
    modal.style.display = 'flex';

    // Add event listener to close modal when clicking outside the modal content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) { // Check if the click was on the backdrop (modal itself)
            modal.style.display = 'none'; // Close the modal
        }
    });

    // Handle confirmation (Yes)
    confirmButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`/delete-product/${productId}`, { method: 'DELETE' });
            const data = await response.json();

            showToast(data.message, data.status === 'success' ? 'success' : 'error');

            if (data.status === 'success') {
                fetchStockItems(); // Refresh the table after deletion
            }

            // Close the modal after action
            modal.style.display = 'none';
        } catch (error) {
            console.error('Error deleting product:', error);
            showToast('An unexpected error occurred!', 'error');
            modal.style.display = 'none';
        }
    });

    // Handle cancellation (No)
    cancelButton.addEventListener('click', () => {
        modal.style.display = 'none'; // Close the modal without doing anything
    });
}



// Function to determine discount based on category
function getDiscountByCategory(category) {
    const discounts = {
        Fruits: 10,
        Vegetables: 5,
        Grocery: 15
    };

    return discounts[category] || 0; // Default discount is 0 if category is not found
}

// Fetch products when the page loads
window.onload = fetchStockItems;
