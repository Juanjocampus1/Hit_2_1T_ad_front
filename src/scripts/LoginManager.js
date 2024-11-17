document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;

    // Verificar si el correo electrónico y el número de teléfono coinciden
    fetch('http://localhost:8080/api/customer/findAll')
        .then(response => response.json())
        .then(customers => {
            const customer = customers.find(customer => customer.email === email && customer.phone === phone);
            if (customer) {
                // Guardar los datos del usuario en sessionStorage
                sessionStorage.setItem('customer', JSON.stringify(customer));
                alert('Login successful!');
                window.location.href = 'index.html';
            } else {
                alert('Invalid email or phone number.');
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error fetching customer data.');
        });
});