document.getElementById('registrationForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;

    const customerData = {
        name: name,
        email: email,
        phone: phone,
        address: address
    };

    // Verificar si el correo electrónico o el número de teléfono ya existen
    fetch('http://localhost:8080/api/customer/findAll')
        .then(response => response.json())
        .then(customers => {
            const customerExists = customers.some(customer => customer.email === email || customer.phone === phone);

            if (customerExists) {
                alert('El correo electrónico o el número de teléfono ya están registrados.');
            } else {
                // Registrar el nuevo cliente
                fetch('http://localhost:8080/api/customer/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(customerData)
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Success:', data);
                    alert('Customer registered successfully!');
                    window.location.href = 'login.html';
                })
                .catch((error) => {
                    console.error('Error:', error);
                    alert('Error registering customer.');
                });
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error fetching customer data.');
        });
});