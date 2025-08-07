document.addEventListener('DOMContentLoaded', () => {
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
