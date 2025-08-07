document.addEventListener('DOMContentLoaded', () => {
    // --- All scripts that interact with the page go here ---

    // Fake Loading Screen
    const loader = document.querySelector('.loader-wrapper');
    if (loader) {
        // We use window.onload here to ensure all assets are loaded
        window.onload = () => {
            setTimeout(() => { // Add a small delay for effect
                loader.classList.add('hidden');
            }, 500);
        };
    }

    // Cursor Follower
    const cursorFollower = document.querySelector('.cursor-follower');
    if (cursorFollower) {
        document.addEventListener('mousemove', e => {
            cursorFollower.style.transform = `translate3d(${e.clientX - 15}px, ${e.clientY - 15}px, 0)`;
        });

        document.addEventListener('mousedown', () => cursorFollower.style.transform += ' scale(0.8)');
        document.addEventListener('mouseup', () => cursorFollower.style.transform = cursorFollower.style.transform.replace(' scale(0.8)', ''));
    }

    // Wiggle on Click
    document.addEventListener('click', e => {
        const target = e.target.closest('button, a, .product');
        if (target) {
            target.classList.add('wiggle');
            setTimeout(() => {
                target.classList.remove('wiggle');
            }, 300); // Match animation duration in CSS
        }
    });

    // Fade-in animation on scroll
    const fadeInObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(element => {
        fadeInObserver.observe(element);
    });

    // Original Cart and Page Load Logic
    updateCartCount();
    if (document.getElementById('cart-items')) {
        renderCart();
    }

    // Customer Details Form Validation
    const customerForm = document.getElementById('customer-details-form');
    const paypalBtn = document.getElementById('paypal-checkout-btn');

    if (customerForm && paypalBtn) {
        const requiredFields = Array.from(customerForm.querySelectorAll('input[required], textarea[required]'));

        const validateForm = () => {
            const allFieldsValid = requiredFields.every(field => field.value.trim() !== '');
            paypalBtn.disabled = !allFieldsValid;
        };

        requiredFields.forEach(field => {
            field.addEventListener('input', validateForm);
        });

        // EmailJS Integration
        const paypalForm = document.getElementById('paypal-form');
        paypalForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Stop the form from submitting immediately

            paypalBtn.textContent = 'Sending confirmation...';
            paypalBtn.disabled = true;

            const serviceID = 'service_bi10zaa';
            const publicKey = 'w-4ksu0owjlvtoxv6';
            const toAdminTemplateID = 'template_i62fmmo';
            const toCustomerTemplateID = 'template_btkl0ii';

            const templateParams = {
                'customer-name': document.getElementById('customer-name').value,
                'customer-address': document.getElementById('customer-address').value,
                'customer-email': document.getElementById('customer-email').value,
                'perfume-spray': document.getElementById('perfume-spray').checked ? 'Yes' : 'No',
                'extra-details': document.getElementById('extra-details').value || 'None',
            };

            // Initialize EmailJS
            emailjs.init(publicKey);

            // Send both emails
            const sendAdminEmail = emailjs.send(serviceID, toAdminTemplateID, templateParams);
            const sendCustomerEmail = emailjs.send(serviceID, toCustomerTemplateID, templateParams);

            Promise.all([sendAdminEmail, sendCustomerEmail])
                .then(() => {
                    paypalBtn.textContent = 'Redirecting to PayPal...';
                    // Now submit the form to PayPal
                    paypalForm.submit();
                }, (error) => {
                    alert('Oops! Something went wrong with sending the confirmation email. Please try again.\n\nError: ' + JSON.stringify(error));
                    paypalBtn.textContent = 'Checkout with PayPal';
                    validateForm(); // Re-enable button if form is valid
                });
        });

        // Initial check in case of browser autofill
        validateForm();
    }
});

function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(name, price) {
    const cart = getCart();
    cart.push({ name, price });
    saveCart(cart);
    alert(`${name} has been added to your cart!`);
}

function updateCartCount() {
    const cart = getCart();
    const cartLink = document.querySelector('nav a[href$="./cart.html"]');
    if (cartLink) {
        cartLink.textContent = `Cart (${cart.length})`;
    }
}

function renderCart() {
    const cart = getCart();
    const list = document.getElementById("cart-items");
    const totalEl = document.getElementById("total");
    const paypalItems = document.getElementById("paypal-items");

    if (!list) return; // Don't run on pages without a cart section

    list.innerHTML = '';
    if (paypalItems) {
        paypalItems.innerHTML = '';
    }

    let total = 0;

    cart.forEach((item, index) => {
        const li = document.createElement("li");
        li.textContent = `${item.name} – $${item.price}`;
        list.appendChild(li);

        // Add item to PayPal form
        if (paypalItems) {
            const itemNumber = index + 1;
            paypalItems.innerHTML += `
                <input type="hidden" name="item_name_${itemNumber}" value="${item.name}">
                <input type="hidden" name="amount_${itemNumber}" value="${item.price}">
            `;
        }

        total += item.price;
    });

    if (totalEl) {
        totalEl.textContent = `Total: $${total.toFixed(2)}`;
    }
}
