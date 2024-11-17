document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay una sesión de usuario
    const customer = sessionStorage.getItem('customer');
    if (!customer) {
        alert('No user data found. Please log in.');
        window.location.href = 'login.html';
        return;
    }

    // Mostrar el nombre de usuario
    displayUsername();

    loadProducts();
});

// Mostrar/Ocultar formularios
function showAddProductForm() {
    document.getElementById("addProductForm").classList.toggle("hidden");
}

function showSellForm() {
    document.getElementById("sellForm").classList.toggle("hidden");
}

function loadProducts() {
    fetch('http://localhost:8080/api/book/findAll')
        .then(response => response.json())
        .then(products => {
            const productList = document.getElementById('productList');
            productList.innerHTML = ''; // Limpiar la tabla antes de agregar los productos

            products.forEach(product => {
                const row = document.createElement('tr');

                row.innerHTML = `
                    <td>${product.id}</td>
                    <td>${product.title}</td>
                    <td>${product.author}</td>
                    <td>${product.isbn}</td>
                    <td>${product.price}</td>
                    <td>${product.stock}</td>
                    <td>
                        <button onclick="deleteProduct(${product.id})">Delete</button>
                    </td>
                `;

                productList.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error fetching products:', error);
        });
}

// Añadir Producto
async function addProduct() {
    const product = {
        title: document.getElementById("title").value,
        author: document.getElementById("author").value,
        isbn: document.getElementById("isbn").value,
        price: parseFloat(document.getElementById("price").value),
        stock: parseInt(document.getElementById("stock").value, 10)
    };

    await fetch("http://localhost:8080/api/book/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
    });
}

function deleteProduct(productId) {
    fetch(`http://localhost:8080/api/book/delete/${productId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            alert('Product deleted successfully!');
            loadProducts(); // Actualizar la tabla después de eliminar el producto
        } else {
            alert('Error deleting product.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error deleting product.');
    });
}

// Registrar Venta
async function processSale() {
    const sale = {
        date: document.getElementById("date").value,
        totalAmount: parseFloat(document.getElementById("totalAmount").value),
        customer: {
            id: parseInt(document.getElementById("customerId").value, 10),
            name: document.getElementById("customerName").value,
            email: document.getElementById("customerEmail").value,
            phone: document.getElementById("customerPhone").value,
            address: document.getElementById("customerAddress").value
        },
        saleItemslist: [
            {
                id: parseInt(document.getElementById("productId").value, 10),
                productName: document.getElementById("productName").value,
                quantity: parseInt(document.getElementById("quantity").value, 10),
                price: parseFloat(document.getElementById("itemPrice").value)
            }
        ]
    };

    await fetch("http://localhost:8080/api/sale/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sale)
    });
}

// Consultar Ventas
async function loadSales() {
    const response = await fetch("http://localhost:8080/api/sale/findAll");
    const sales = await response.json();
    console.log("Sales:", sales); // Visualizar las ventas en la consola
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function displayUsername() {
    const customer = JSON.parse(sessionStorage.getItem('customer'));
    document.getElementById('username').textContent = customer.name;
}