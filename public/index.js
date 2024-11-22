// Handle form submission for stock form
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
            this.reset(); 
            fetchStockItems(); 
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
    }, 3000); 
}

// Fetch stock items and populate the table
async function fetchStockItems() {
    try {
        const response = await fetch('/get-stock');
        const data = await response.json();

        console.log('Fetched products:', data);

        if (data.status === 'success') {
            const tableBody = document.querySelector('#stockTable tbody');
            tableBody.innerHTML = ''; 

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
                            <i class="fa-solid fa-pen-to-square text-primary me-2" data-id="${item.productId}"></i>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });

           
            attachDeleteUpdateListeners();

        } else {
            console.error('Failed to fetch products:', data.message);
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        showToast('Failed to load stock items.', 'error');
    }
}

// Function to attach event listeners for delete and update actions
function attachDeleteUpdateListeners() {
    document.querySelectorAll('.fa-trash').forEach(icon => {
        icon.addEventListener('click', async (e) => {
            const productId = e.target.getAttribute('data-id');
            await deleteProduct(productId);
        });
    });

    document.querySelectorAll('.fa-pen-to-square').forEach(icon => {
        icon.addEventListener('click', async (e) => {
            const productId = e.target.getAttribute('data-id');
            await openUpdateModal(productId);
        });
    });
}

// Function to open the modal and populate the product details
async function openUpdateModal(productId) {
    const modal = document.getElementById('updateModal');
    modal.style.display = 'block';

    try {
        const response = await fetch(`/get-product-details/${productId}`);
        const data = await response.json();

        if (data.status === 'success' && data.product) {
            const product = data.product;
            document.getElementById('modalproductId').value = product.productId;
            document.getElementById('modalproductName').value = product.productName;
            document.getElementById('modalcategory').value = product.category;
            document.getElementById('modalquantity').value = product.quantity;
            document.getElementById('modalrate').value = product.rate;
            document.getElementById('modallocation').value = product.location;
        } else {
            alert('Product not found');
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
        alert('Failed to load product details');
    }
}

// Function to close the modal
function closeUpdateModal() {
    const modal = document.getElementById('updateModal');
    modal.style.display = 'none';
}

// Event listener for the cancel button
document.getElementById('cancelUpdateBtn').addEventListener('click', closeUpdateModal);


// Event listener for form submission (update product)
document.getElementById('updateProductForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const productId = document.getElementById('modalproductId').value;
    const productName = document.getElementById('modalproductName').value;
    const category = document.getElementById('modalcategory').value;
    const quantity = document.getElementById('modalquantity').value;
    const rate = document.getElementById('modalrate').value;
    const location = document.getElementById('modallocation').value;

    try {
        const response = await fetch(`/update-product/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productName, category, quantity, rate, location }),
        });

        const data = await response.json();

        if (data.status === 'success') {
            showToast('Product Updated Succesfully','success')
            closeUpdateModal();  
            fetchStockItems();   
        } else {
            alert('Failed to update product');
        }
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Failed to update product');
    }
    fetchStockItems(); 

});

// Function to handle delete product
async function deleteProduct(productId) {
    const modal = document.getElementById('confirmationModal');
    const confirmButton = document.getElementById('confirmDeleteBtn');
    const cancelButton = document.getElementById('cancelDeleteBtn');
    
    modal.style.display = 'flex';

    
    confirmButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`/delete-product/${productId}`, { method: 'DELETE' });
            const data = await response.json();

            showToast(data.message, data.status === 'success' ? 'success' : 'error');

            if (data.status === 'success') {
                fetchStockItems(); 
            }

            modal.style.display = 'none';
        } catch (error) {
            console.error('Error deleting product:', error);
            showToast('An unexpected error occurred!', 'error');
            modal.style.display = 'none';
        }
    });

    
    cancelButton.addEventListener('click', () => {
        modal.style.display = 'none'; 
    });
}

// Function to determine discount based on category
function getDiscountByCategory(category) {
    const discounts = {
        Fruits: 10,
        Vegetables: 5,
        Grocery: 15
    };

    return discounts[category] || 0; 
}

// Fetch products when the page loads
window.onload = fetchStockItems;
