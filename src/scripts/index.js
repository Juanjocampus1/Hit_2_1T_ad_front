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
    loadCustomerSales(); // Load sales for the logged-in customer
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
                row.dataset.id = product.id;
                row.innerHTML = `
                    <td>${product.id}</td>
                    <td>${product.title}</td>
                    <td>${product.author}</td>
                    <td>${product.isbn}</td>
                    <td>${product.price}</td>
                    <td>${product.stock}</td>
                    <td>
                        <button onclick="deleteProduct(event, ${product.id})">Delete</button>
                        <button onclick="showUpdateProductForm(${product.id})">Update</button>
                    </td>
                `;

                row.addEventListener('click', () => selectProduct(product));
                productList.appendChild(row);
            });

            // Guardar los datos de la tabla en una cookie
            document.cookie = `productList=${JSON.stringify(products)};path=/`;
        })
        .catch(error => {
            console.error('Error fetching products:', error);
        });
}

function selectProduct(product) {
    document.getElementById("productName").value = product.title;
    document.getElementById("itemPrice").value = product.price;
    document.getElementById("productId").value = product.id; // Hidden input to store product ID
}

// Mostrar formulario de actualización de producto
function showUpdateProductForm(productId) {
    const product = document.querySelector(`tr[data-id='${productId}']`);
    document.getElementById("updateProductId").value = productId;
    document.getElementById("updateTitle").value = product.querySelector("td:nth-child(2)").textContent;
    document.getElementById("updateAuthor").value = product.querySelector("td:nth-child(3)").textContent;
    document.getElementById("updateIsbn").value = product.querySelector("td:nth-child(4)").textContent;
    document.getElementById("updatePrice").value = product.querySelector("td:nth-child(5)").textContent;
    document.getElementById("updateStock").value = product.querySelector("td:nth-child(6)").textContent;
    document.getElementById("updateProductForm").classList.remove("hidden");
}

// Actualizar Producto
async function updateProduct() {
    const productId = document.getElementById("updateProductId").value;
    const product = {
        title: document.getElementById("updateTitle").value,
        author: document.getElementById("updateAuthor").value,
        isbn: document.getElementById("updateIsbn").value,
        price: parseFloat(document.getElementById("updatePrice").value),
        stock: parseInt(document.getElementById("updateStock").value, 10)
    };

    await fetch(`http://localhost:8080/api/book/updateById/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
    });

    loadProducts();
    document.getElementById("updateProductForm").classList.add("hidden");
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

    loadProducts();
}

function deleteProduct(event, productId) {
    event.stopPropagation(); // Evitar que el evento de clic en la fila se dispare
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
    const customer = JSON.parse(sessionStorage.getItem('customer'));
    const productId = parseInt(document.getElementById("productId").value, 10);
    const quantity = parseInt(document.getElementById("quantity").value, 10);
    const itemPrice = parseFloat(document.getElementById("itemPrice").value);
    const totalAmount = parseFloat(document.getElementById("totalAmount").value);

    if (totalAmount < itemPrice * quantity) {
        alert('The total amount is less than the required price. Sale cannot be processed.');
        return;
    }

    // Leer los datos de la tabla desde la cookie
    const products = JSON.parse(getCookie('productList'));
    const product = products.find(p => p.id === productId);

    if (!product) {
        alert('Product not found.');
        return;
    }

    // Actualizar el stock del producto
    product.stock -= quantity;

    const sale = {
        date: document.getElementById("date").value,
        totalAmount: totalAmount,
        customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address
        },
        saleItemslist: [
            {
                book: {
                    id: productId,
                    title: product.title,
                    author: product.author,
                    isbn: product.isbn,
                    price: product.price
                },
                quantity: quantity,
                price: itemPrice
            }
        ]
    };

    const response = await fetch("http://localhost:8080/api/sale/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sale)
    });

    if (response.ok) {
        // Actualizar el stock del producto en el servidor
        await fetch(`http://localhost:8080/api/book/updateById/${productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product)
        });

        // Guardar los datos actualizados de la tabla en una cookie
        document.cookie = `productList=${JSON.stringify(products)};path=/`;

        // Clear the form after processing the sale
        document.getElementById("saleForm").reset();
        loadCustomerSales(); // Refresh sales after processing a sale
        loadProducts(); // Refresh products to update stock

        // Calculate and show change
        const change = totalAmount - (itemPrice * quantity);
        if (change > 0) {
            alert(`Sale processed successfully! Your change is $${change.toFixed(2)}`);
        }
    } else {
        const errorMessage = await response.text();
        alert(errorMessage);
    }
}

// Actualizar Venta
async function updateSale(saleId) {
    const customer = JSON.parse(sessionStorage.getItem('customer'));
    const sale = {
        date: document.getElementById("date").value,
        totalAmount: parseFloat(document.getElementById("totalAmount").value),
        customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address
        },
        saleItemslist: [
            {
                book: {
                    id: parseInt(document.getElementById("productId").value, 10)
                },
                quantity: parseInt(document.getElementById("quantity").value, 10),
                price: parseFloat(document.getElementById("itemPrice").value)
            }
        ]
    };

    await fetch(`http://localhost:8080/api/sale/update/${saleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sale)
    });

    loadCustomerSales(); // Refresh sales after updating a sale
}

// Consultar Ventas
async function loadSales() {
    const response = await fetch("http://localhost:8080/api/sale/findAll");
    const sales = await response.json();
    console.log("Sales:", sales); // Visualizar las ventas en la consola
}

// Consultar Ventas por Cliente
async function loadCustomerSales() {
    const customer = JSON.parse(sessionStorage.getItem('customer'));
    const response = await fetch(`http://localhost:8080/api/sale/salesByCustomer/${customer.id}`);
    const sales = await response.json();

    const salesList = document.getElementById('salesList');
    salesList.innerHTML = ''; // Clear the table before adding sales

    sales.forEach(sale => {
        const row = document.createElement('tr');

        const items = sale.saleItemslist.map(item => `${item.book.title} (x${item.quantity})`).join(', ');

        row.innerHTML = `
            <td>${sale.id}</td>
            <td>${sale.customer.name}</td>
            <td>${sale.customer.email}</td>
            <td>${sale.customer.phone}</td>
            <td>${sale.customer.address}</td>
            <td>${new Date(sale.date).toLocaleDateString()}</td>
            <td>${sale.totalAmount.toFixed(2)}</td>
            <td>${items}</td>
        `;

        salesList.appendChild(row);
    });

    console.log("Sales for customer:", sales); // Visualizar las ventas en la consola
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