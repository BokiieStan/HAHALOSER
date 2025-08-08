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

    // --- Global Audio (click sound + background music) ---
    let audioCtx;
    let bgStarted = false;

    const ensureAudio = () => {
        if (!audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            audioCtx = new AC();
        }
        return audioCtx;
    };

    const playClick = () => {
        const ctx = ensureAudio();
        if (!ctx) return;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 600; // pleasant soft click
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(ctx.destination);
        const now = ctx.currentTime;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        o.start(now);
        o.stop(now + 0.1);
    };

    const startBg = () => {
        const ctx = ensureAudio();
        if (!ctx || bgStarted) return;
        bgStarted = true;
        // Gentle, low-volume two-note pad
        const g = ctx.createGain();
        g.gain.value = 0.03; // very soft
        g.connect(ctx.destination);

        const o1 = ctx.createOscillator();
        o1.type = 'sine';
        o1.frequency.value = 220; // A3
        o1.connect(g);
        const o2 = ctx.createOscillator();
        o2.type = 'sine';
        o2.frequency.value = 277.18; // C#4 - simple dyad
        o2.connect(g);
        o1.start();
        o2.start();
    };

    // Start background music on first user interaction to satisfy autoplay policies
    const startOnFirstInteraction = () => {
        startBg();
        document.removeEventListener('click', startOnFirstInteraction);
        document.removeEventListener('keydown', startOnFirstInteraction);
    };
    document.addEventListener('click', startOnFirstInteraction);
    document.addEventListener('keydown', startOnFirstInteraction);

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
        // play global click sound
        playClick();
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

    // Product page adjustments: hide header/footer (via CSS class) and inject Back button
    const productMain = document.querySelector('main.product-detail');
    if (productMain) {
        document.body.classList.add('product-page');
        const container = document.querySelector('.container') || document.body;
        const backBtn = document.createElement('button');
        backBtn.className = 'back-btn';
        backBtn.innerHTML = '<span class="icon">←</span> Back';
        backBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            if (window.history.length > 1) {
                history.back();
            } else {
                // Fallback to home if no history
                window.location.href = '../index.html';
            }
        });
        container.insertBefore(backBtn, productMain);
    }

    // Original Cart and Page Load Logic
    updateCartCount();
    if (document.getElementById('cart-items')) {
        renderCart();
        // Initialize gift card UI when on cart page
        initGiftCardUI();
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

            const subtotal = getCart().reduce((sum, item) => sum + item.price, 0);
            const shipping = 5.00;
            const tax = subtotal * 0.08375;
            const preDiscountTotal = subtotal + shipping + tax;

            // Include gift card info in order email
            let giftCode = '';
            let giftDiscount = 0;
            let giftRemaining = 0;
            try {
                const appliedGiftRaw = localStorage.getItem('applied_giftcard');
                if (appliedGiftRaw) {
                    const applied = JSON.parse(appliedGiftRaw);
                    const available = typeof applied.remaining === 'number' ? applied.remaining : (applied.balance || 0);
                    giftDiscount = Math.max(0, Math.min(available, preDiscountTotal));
                    giftRemaining = Math.max(0, available - giftDiscount);
                    giftCode = applied.code || '';
                }
            } catch(_) { /* ignore */ }

            const grandTotal = Math.max(0, preDiscountTotal - giftDiscount);

            const templateParams = {
                'customer-name': document.getElementById('customer-name').value,
                'customer-address': document.getElementById('customer-address').value,
                'customer-email': document.getElementById('customer-email').value,
                'perfume-spray': document.getElementById('perfume-spray').checked ? 'Yes' : 'No',
                'extra-details': document.getElementById('extra-details').value || 'None',
                'subtotal': subtotal.toFixed(2),
                'shipping': shipping.toFixed(2),
                'tax': tax.toFixed(2),
                'grand-total': grandTotal.toFixed(2),
                // Gift card extras (optional in template)
                'giftcard-code': giftCode,
                'giftcard-discount': giftDiscount.toFixed(2),
                'giftcard-remaining': giftRemaining.toFixed(2),
                'prediscount-total': preDiscountTotal.toFixed(2)
            };

            // Initialize EmailJS
            emailjs.init(publicKey);

            // Send both emails
            const sendAdminEmail = emailjs.send(serviceID, toAdminTemplateID, templateParams);
            const sendCustomerEmail = emailjs.send(serviceID, toCustomerTemplateID, templateParams);

            Promise.all([sendAdminEmail, sendCustomerEmail])
                .then(() => {
                    // After emailing, update local remaining balance so it reflects this order's usage
                    try {
                        const appliedGiftRaw2 = localStorage.getItem('applied_giftcard');
                        if (appliedGiftRaw2) {
                            const applied2 = JSON.parse(appliedGiftRaw2);
                            const balance = Number(applied2.balance || 0);
                            const newRemaining = giftRemaining;
                            localStorage.setItem('applied_giftcard', JSON.stringify({ code: applied2.code, remaining: newRemaining, balance }));
                        }
                    } catch(_) { /* ignore */ }
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
    const subtotalEl = document.getElementById("subtotal");
    const shippingEl = document.getElementById("shipping");
    const taxEl = document.getElementById("tax");
    const grandTotalEl = document.getElementById("grand-total");
    const giftLine = document.getElementById("giftcard-line");
    const giftAmtEl = document.getElementById("giftcard-discount");
    const paypalDiscountInput = document.getElementById("paypal-discount");
    const paypalItems = document.getElementById("paypal-items");

    if (!list) return; // Don't run on pages without a cart section

    list.innerHTML = '';
    if (paypalItems) {
        paypalItems.innerHTML = '';
    }

    let subtotal = 0;
    const shippingCost = 5.00;
    const taxRate = 0.08375;

    cart.forEach((item, index) => {
        const li = document.createElement("li");
        li.textContent = `${item.name} – $${item.price.toFixed(2)}`;
        list.appendChild(li);

        if (paypalItems) {
            const itemNumber = index + 1;
            paypalItems.innerHTML += `
                <input type="hidden" name="item_name_${itemNumber}" value="${item.name}">
                <input type="hidden" name="amount_${itemNumber}" value="${item.price.toFixed(2)}">
            `;
        }
        subtotal += item.price;
    });

    const taxAmount = subtotal * taxRate;
    const preDiscountTotal = subtotal + shippingCost + taxAmount;

    // Apply gift card if present
    let discount = 0;
    const appliedGiftRaw = localStorage.getItem('applied_giftcard');
    if (appliedGiftRaw) {
        try {
            const applied = JSON.parse(appliedGiftRaw);
            const available = typeof applied.remaining === 'number' ? applied.remaining : (applied.balance || 0);
            discount = Math.max(0, Math.min(available, preDiscountTotal));
        } catch (_) { /* ignore parse errors */ }
    }
    const grandTotal = Math.max(0, preDiscountTotal - discount);

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = `$${shippingCost.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${taxAmount.toFixed(2)}`;
    if (grandTotalEl) grandTotalEl.textContent = `$${grandTotal.toFixed(2)}`;

    if (giftLine && giftAmtEl) {
        if (discount > 0) {
            giftLine.style.display = '';
            giftAmtEl.textContent = `-$${discount.toFixed(2)}`;
        } else {
            giftLine.style.display = 'none';
            giftAmtEl.textContent = '-$0.00';
        }
    }

    if (paypalItems) {
        paypalItems.innerHTML += `
            <input type="hidden" name="handling_cart" value="${shippingCost.toFixed(2)}">
            <input type="hidden" name="tax_cart" value="${taxAmount.toFixed(2)}">
        `;
    }

    if (paypalDiscountInput) {
        paypalDiscountInput.value = discount.toFixed(2);
    }
}

// ---- Gift Card Helpers & UI ----
async function loadGiftCards() {
    // Load the gift cards JSON from the site root
    const res = await fetch('./giftcards.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Unable to load gift cards');
    const data = await res.json();
    return Array.isArray(data) ? data : (data.cards || []);
}

function initGiftCardUI() {
    const codeInput = document.getElementById('giftcard-code');
    const applyBtn = document.getElementById('apply-giftcard-btn');
    const messageEl = document.getElementById('giftcard-message');
    if (!codeInput || !applyBtn) return;

    // Show previously applied gift card (if any)
    const appliedRaw = localStorage.getItem('applied_giftcard');
    if (appliedRaw) {
        try {
            const applied = JSON.parse(appliedRaw);
            if (applied && applied.code) {
                codeInput.value = applied.code;
                if (typeof applied.remaining === 'number') {
                    messageEl.textContent = `Applied ${applied.code} • Remaining balance: $${applied.remaining.toFixed(2)}`;
                }
            }
        } catch(_) { /* ignore */ }
    }

    applyBtn.addEventListener('click', async () => {
        const code = (codeInput.value || '').trim();
        messageEl.textContent = '';
        if (!code) {
            messageEl.textContent = 'Please enter a gift card code.';
            return;
        }
        try {
            const cards = await loadGiftCards();
            const card = cards.find(c => (c.code || '').toLowerCase() === code.toLowerCase() && c.active !== false);
            if (!card) {
                messageEl.textContent = 'Gift card not found or inactive.';
                localStorage.removeItem('applied_giftcard');
                renderCart();
                return;
            }

            // Determine available balance, considering any prior local usage
            const appliedRaw2 = localStorage.getItem('applied_giftcard');
            let priorRemaining;
            if (appliedRaw2) {
                try { priorRemaining = JSON.parse(appliedRaw2).remaining; } catch(_) {}
            }
            const available = typeof priorRemaining === 'number' ? priorRemaining : Number(card.balance || 0);

            // Compute current pre-discount total to cap the discount
            const cart = getCart();
            const shippingCost = 5.00;
            const taxRate = 0.08375;
            const subtotal = cart.reduce((s, it) => s + it.price, 0);
            const taxAmount = subtotal * taxRate;
            const preDiscountTotal = subtotal + shippingCost + taxAmount;
            const discount = Math.max(0, Math.min(available, preDiscountTotal));
            const remaining = Math.max(0, available - discount);

            // Persist applied card and remaining locally (client-side only)
            localStorage.setItem('applied_giftcard', JSON.stringify({ code: card.code, remaining, balance: Number(card.balance || 0) }));

            // Update UI
            messageEl.textContent = `Applied ${card.code} • Using $${discount.toFixed(2)} now. Remaining balance: $${remaining.toFixed(2)}`;
            renderCart();

            // Notify store owner via EmailJS (non-blocking)
            try {
                notifyGiftCardUse({
                    code: card.code,
                    discountApplied: discount,
                    remaining,
                    subtotal,
                    shipping: shippingCost,
                    tax: taxAmount,
                    preDiscountTotal,
                });
            } catch (e) {
                console.warn('Gift card notification failed:', e);
            }
        } catch (err) {
            messageEl.textContent = 'There was a problem checking the gift card. Please try again.';
            console.error(err);
        }
    });
}

// Send an EmailJS notification to the shop owner when a gift card is applied
function notifyGiftCardUse(payload) {
    // These should match your existing EmailJS service/key. Update template ID in your EmailJS account.
    const serviceID = 'service_bi10zaa';
    const publicKey = 'w-4ksu0owjlvtoxv6';
    const templateID = 'template_giftcard_notify'; // TODO: create this template in EmailJS

    // Collect optional customer info if present on page
    const customerEmailEl = document.getElementById('customer-email');
    const customerNameEl = document.getElementById('customer-name');
    const codeInput = document.getElementById('giftcard-code');

    const cart = getCart();
    const cartItemsStr = cart.map(i => `${i.name} ($${i.price.toFixed(2)})`).join(', ');

    const templateParams = {
        giftcard_code: payload.code,
        discount_applied: payload.discountApplied.toFixed(2),
        remaining_balance: payload.remaining.toFixed(2),
        subtotal: (payload.subtotal || 0).toFixed(2),
        shipping: (payload.shipping || 0).toFixed(2),
        tax: (payload.tax || 0).toFixed(2),
        prediscount_total: (payload.preDiscountTotal || 0).toFixed(2),
        cart_items: cartItemsStr || 'None',
        customer_email: customerEmailEl ? (customerEmailEl.value || '') : '',
        customer_name: customerNameEl ? (customerNameEl.value || '') : '',
        entered_code: codeInput ? (codeInput.value || '') : '',
        used_at: new Date().toLocaleString(),
    };

    if (typeof emailjs !== 'undefined') {
        try { emailjs.init(publicKey); } catch (_) {}
        emailjs.send(serviceID, templateID, templateParams).catch(err => {
            console.warn('EmailJS send failed (gift card notify):', err);
        });
    }
}
