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
        total += item.price;

        if (paypalItems) {
            // PayPal hidden inputs
            paypalItems.innerHTML += `
              <input type="hidden" name="item_name_${index + 1}" value="${item.name}">
              <input type="hidden" name="amount_${index + 1}" value="${item.price}">
              <input type="hidden" name="quantity_${index + 1}" value="1">
            `;
        }
    });

    if (totalEl) {
        totalEl.textContent = `Total: $${total}`;
    }
}
