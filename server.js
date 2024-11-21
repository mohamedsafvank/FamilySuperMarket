const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/FarmFreshSuperMarket')
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

// Define a schema for form data
const FormDataSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true },
    productName: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    totalAmount: { type: Number, required: true }
}, { timestamps: true });

const FormData = mongoose.model('FormData', FormDataSchema, 'products');

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

// Discount calculation function
function calculateDiscount(category, rate, quantity) {
    let discountPercentage = 0;
    if (category === 'Fruits') {
        discountPercentage = 10; // 10% discount for Fruits
    } else if (category === 'Vegitables') {
        discountPercentage = 5; // 5% discount for Vegetables
    } else if (category === 'Grocery') {
        discountPercentage = 15; // 15% discount for Grocery
    }

    const price = rate * quantity;
    const discount = (price * discountPercentage) / 100;
    return { discount, price };
}

// Route to render the index page
app.get('/', (req, res) => {
    res.render('index');
});

// Route to handle form submission
app.post('/submit-form', async (req, res) => {
    try {
        const { productId, productName, category, quantity, rate, location } = req.body;

        const existingProduct = await FormData.findOne({ productId });
        if (existingProduct) {
            return res.status(400).json({ status: 'error', message: 'Product ID already exists!' });
        }

        const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
        const qty = parseInt(quantity);
        const rateValue = parseFloat(rate);

        const { discount, price } = calculateDiscount(normalizedCategory, rateValue, qty);
        const totalAmount = price - discount;

        const formData = {
            productId,
            productName,
            category: normalizedCategory,
            quantity: qty,
            rate: rateValue,
            location,
            price,
            totalAmount
        };

        const savedData = await FormData.create(formData);
        console.log('Data saved:', savedData);

        res.status(200).json({ status: 'success', message: 'Form data stored successfully!' });
    } catch (error) {
        console.error('Error saving form data:', error);
        res.status(500).json({ status: 'error', message: 'Failed to store form data!' });
    }
});

// Route to fetch stock items
app.get('/get-stock', async (req, res) => {
    try {
        const stockItems = await FormData.find();
        res.status(200).json({ status: 'success', data: stockItems });
    } catch (error) {
        console.error('Error fetching stock items:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch stock items!' });
    }
});

// Route to fetch product details by productId
app.get('/get-product-details/:productId', async (req, res) => {
    const { productId } = req.params;

    try {
        const product = await FormData.findOne({ productId });
        if (product) {
            res.status(200).json({ status: 'success', product });
        } else {
            res.status(404).json({ status: 'error', message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch product details' });
    }
});

// Route to delete a product
app.delete('/delete-product/:productId', async (req, res) => {
    const { productId } = req.params;

    try {
        const deletedProduct = await FormData.findOneAndDelete({ productId });

        if (deletedProduct) {
            res.status(200).json({ status: 'success', message: 'Product deleted successfully!' });
        } else {
            res.status(404).json({ status: 'error', message: 'Product not found!' });
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete product!' });
    }
});

// Route to update product details
app.put('/update-product/:productId', async (req, res) => {
    console.log("Request Params:", req.params.productId);
    console.log("Request Body:", req.body);

    const { productId } = req.params;
    const { productName, category, quantity, rate, location } = req.body;

    try {
        const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
        const qty = parseInt(quantity);
        const rateValue = parseFloat(rate);

        const { discount, price } = calculateDiscount(normalizedCategory, rateValue, qty);
        const totalAmount = price - discount;

        const updatedProduct = await FormData.findOneAndUpdate(
            { productId },
            { productName, category, quantity, rate, location },
            { new: true }
        );
        
        if (!updatedProduct) {
            console.error('Product not found in database.');
        }

        res.status(200).json({ status: 'success', message: 'Product updated successfully!', data: updatedProduct });
    } catch (error) {
        if (error.name === 'ValidationError') {
            console.error('Validation Error:', error.message);
            res.status(400).json({ status: 'error', message: 'Validation Error', details: error.message });
        } else {
            console.error('Error updating product:', error);
            res.status(500).json({ status: 'error', message: 'Failed to update product!' });
        }
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
