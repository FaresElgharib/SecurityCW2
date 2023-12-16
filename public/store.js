document.addEventListener('DOMContentLoaded', function() {
    fetchProducts();
    setupAdminControls();
});

function fetchProducts() {
    fetch("/products", {
        credentials: 'omit'
    })
    .then(response => response.json())
    .then(products => {
        const productList = document.getElementById('product-list');
        productList.innerHTML = products.map(product => 
            `<div>Product ID: ${product.id}, Name: ${product.name}, Price: $${product.price}</div>`
        ).join('');
    })
    .catch(error => {
        console.error('Error fetching products:', error);
    });
}

function setupAdminControls() {
    const userRole = sessionStorage.getItem('userRole');
    
    if (userRole === 'admin') {
        document.getElementById('admin-controls').style.display = 'block';

        const priceUpdateForm = document.getElementById('price-update-form');
        if (priceUpdateForm) {
            priceUpdateForm.addEventListener('submit', function(event) {
                event.preventDefault();
                const productId = document.getElementById('product-id').value;
                const newPrice = document.getElementById('new-price').value;

                updateProductPrice(productId, newPrice);
            });
        }
    }
}

function updateProductPrice(productId, newPrice) {
    const token = sessionStorage.getItem('authToken');

    fetch('/update-price', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: productId, price: newPrice }),
    })
    .then(response => response.text())
    .then(data => {
        alert(data);
        fetchProducts(); // Refresh product list
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}