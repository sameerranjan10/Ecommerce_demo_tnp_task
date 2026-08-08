
/* ================= COUPONS ================= */

/*
    Frontend demo coupon database.

    WELCOME10  -> 10% off
    SAVE200    -> ₹200 off
    FREESHIP   -> Free shipping
    SHOP20     -> 20% off
*/
const coupons = {
    WELCOME10: {
        type: "percent",
        value: 10,
        label: "10% OFF"
    },
    SAVE200: {
        type: "fixed",
        value: 200,
        label: "₹200 OFF"
    },
    FREESHIP: {
        type: "shipping",
        value: 0,
        label: "FREE SHIPPING"
    },
    SHOP20: {
        type: "percent",
        value: 20,
        label: "20% OFF"
    }
};

function getCouponDiscount(subtotal) {
    if (!appliedCoupon || !coupons[appliedCoupon.code]) {
        return 0;
    }

    const coupon = coupons[appliedCoupon.code];

    if (coupon.type === "percent") {
        return Math.min(subtotal, Math.round(subtotal * coupon.value / 100));
    }

    if (coupon.type === "fixed") {
        return Math.min(subtotal, coupon.value);
    }

    return 0;
}

function getShippingCost() {
    if (!cart.length) return 0;

    if (appliedCoupon && coupons[appliedCoupon.code]?.type === "shipping") {
        return 0;
    }

    const subtotal = getCartSubtotal();

    return subtotal >= 999 ? 0 : 99;
}

function getCartSubtotal() {
    return cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);
        return sum + product.price * item.quantity;
    }, 0);
}

function getCartTotals() {
    const subtotal = getCartSubtotal();
    const discount = getCouponDiscount(subtotal);
    const shipping = getShippingCost();
    const total = Math.max(0, subtotal - discount + shipping);

    return {
        subtotal,
        discount,
        shipping,
        total
    };
}

function saveCoupon() {
    if (appliedCoupon) {
        localStorage.setItem(
            "shopnest-coupon",
            JSON.stringify(appliedCoupon)
        );
    } else {
        localStorage.removeItem("shopnest-coupon");
    }
}

function setCouponMessage(message, type = "") {
    const messageEl = document.getElementById("couponMessage");

    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.className = "coupon-message";

    if (type) {
        messageEl.classList.add(type);
    }
}

function renderCouponUI() {
    const appliedCouponBox = document.getElementById("appliedCoupon");
    const appliedCouponCode = document.getElementById("appliedCouponCode");
    const couponInput = document.getElementById("couponInput");

    if (!appliedCouponBox) return;

    if (appliedCoupon) {
        appliedCouponBox.classList.add("active");
        appliedCouponCode.textContent = appliedCoupon.code;

        if (couponInput) {
            couponInput.value = appliedCoupon.code;
        }

        setCouponMessage(
            coupons[appliedCoupon.code].label + " applied!",
            "success"
        );
    } else {
        appliedCouponBox.classList.remove("active");
        appliedCouponCode.textContent = "-";

        if (couponInput) {
            couponInput.value = "";
        }
    }

    const { discount } = getCartTotals();
    const discountRow = document.getElementById("cartDiscountRow");
    const discountEl = document.getElementById("cartDiscount");

    if (discount > 0) {
        discountRow.classList.add("active");
        discountEl.textContent = "-" + formatPrice(discount);
    } else {
        discountRow.classList.remove("active");
        discountEl.textContent = "-₹0";
    }
}

function applyCoupon() {
    const input = document.getElementById("couponInput");

    if (!input) return;

    const code = input.value.trim().toUpperCase();

    if (!code) {
        setCouponMessage("Please enter a coupon code.", "error");
        return;
    }

    if (!coupons[code]) {
        setCouponMessage("Invalid coupon code.", "error");
        return;
    }

    if (!cart.length) {
        setCouponMessage("Add products to your cart first.", "error");
        return;
    }

    appliedCoupon = {
        code
    };

    saveCoupon();
    updateCart();

    setCouponMessage(
        `${coupons[code].label} applied successfully!`,
        "success"
    );
}

function removeCoupon() {
    appliedCoupon = null;
    saveCoupon();
    updateCart();
    setCouponMessage("Coupon removed.", "success");
}

/* ================= PRODUCTS ================= */
const products = [
    {id:1,name:"Classic Oversized T-Shirt",category:"Fashion",price:799,rating:4.8,emoji:"👕"},
    {id:2,name:"Premium Hoodie",category:"Fashion",price:1499,rating:4.7,emoji:"🧥"},
    {id:3,name:"Wireless Headphones",category:"Electronics",price:2499,rating:4.9,emoji:"🎧"},
    {id:4,name:"Smart Watch Pro",category:"Electronics",price:3999,rating:4.6,emoji:"⌚"},
    {id:5,name:"Urban Sneakers",category:"Shoes",price:2299,rating:4.8,emoji:"👟"},
    {id:6,name:"Running Shoes",category:"Shoes",price:2799,rating:4.7,emoji:"🥾"},
    {id:7,name:"Leather Backpack",category:"Accessories",price:1899,rating:4.5,emoji:"🎒"},
    {id:8,name:"Classic Sunglasses",category:"Accessories",price:999,rating:4.6,emoji:"🕶️"},
    {id:9,name:"Minimalist Watch",category:"Accessories",price:1599,rating:4.8,emoji:"⌚"},
    {id:10,name:"Denim Jacket",category:"Fashion",price:1999,rating:4.7,emoji:"🧥"},
    {id:11,name:"Bluetooth Speaker",category:"Electronics",price:1799,rating:4.5,emoji:"🔊"},
    {id:12,name:"Baseball Cap",category:"Accessories",price:599,rating:4.4,emoji:"🧢"}
];

/* ================= STATE ================= */
let cart = JSON.parse(localStorage.getItem("shopnest-cart")) || [];
let currentFilter = "All";
let wishlist = JSON.parse(localStorage.getItem("shopnest-wishlist")) || [];
let appliedCoupon = JSON.parse(localStorage.getItem("shopnest-coupon")) || null;
let currentUser = JSON.parse(localStorage.getItem("shopnest-user")) || null;

/* ================= DOM ================= */
const productsGrid = document.getElementById("productsGrid");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const cartSidebar = document.getElementById("cartSidebar");
const overlay = document.getElementById("overlay");
const searchInput = document.getElementById("searchInput");

/* ================= PRICE ================= */
function formatPrice(price) {
    return new Intl.NumberFormat("en-IN", {
        style:"currency",
        currency:"INR",
        maximumFractionDigits:0
    }).format(price);
}


/* ================= COUPONS ================= */

/*
    Frontend demo coupon database.

    WELCOME10  -> 10% off
    SAVE200    -> ₹200 off
    FREESHIP   -> Free shipping
    SHOP20     -> 20% off
*/
const coupons = {
    WELCOME10: {
        type: "percent",
        value: 10,
        label: "10% OFF"
    },
    SAVE200: {
        type: "fixed",
        value: 200,
        label: "₹200 OFF"
    },
    FREESHIP: {
        type: "shipping",
        value: 0,
        label: "FREE SHIPPING"
    },
    SHOP20: {
        type: "percent",
        value: 20,
        label: "20% OFF"
    }
};

function getCouponDiscount(subtotal) {
    if (!appliedCoupon || !coupons[appliedCoupon.code]) {
        return 0;
    }

    const coupon = coupons[appliedCoupon.code];

    if (coupon.type === "percent") {
        return Math.min(subtotal, Math.round(subtotal * coupon.value / 100));
    }

    if (coupon.type === "fixed") {
        return Math.min(subtotal, coupon.value);
    }

    return 0;
}

function getShippingCost() {
    if (!cart.length) return 0;

    if (appliedCoupon && coupons[appliedCoupon.code]?.type === "shipping") {
        return 0;
    }

    const subtotal = getCartSubtotal();

    return subtotal >= 999 ? 0 : 99;
}

function getCartSubtotal() {
    return cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);
        return sum + product.price * item.quantity;
    }, 0);
}

function getCartTotals() {
    const subtotal = getCartSubtotal();
    const discount = getCouponDiscount(subtotal);
    const shipping = getShippingCost();
    const total = Math.max(0, subtotal - discount + shipping);

    return {
        subtotal,
        discount,
        shipping,
        total
    };
}

function saveCoupon() {
    if (appliedCoupon) {
        localStorage.setItem(
            "shopnest-coupon",
            JSON.stringify(appliedCoupon)
        );
    } else {
        localStorage.removeItem("shopnest-coupon");
    }
}

function setCouponMessage(message, type = "") {
    const messageEl = document.getElementById("couponMessage");

    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.className = "coupon-message";

    if (type) {
        messageEl.classList.add(type);
    }
}

function renderCouponUI() {
    const appliedCouponBox = document.getElementById("appliedCoupon");
    const appliedCouponCode = document.getElementById("appliedCouponCode");
    const couponInput = document.getElementById("couponInput");

    if (!appliedCouponBox) return;

    if (appliedCoupon) {
        appliedCouponBox.classList.add("active");
        appliedCouponCode.textContent = appliedCoupon.code;

        if (couponInput) {
            couponInput.value = appliedCoupon.code;
        }

        setCouponMessage(
            coupons[appliedCoupon.code].label + " applied!",
            "success"
        );
    } else {
        appliedCouponBox.classList.remove("active");
        appliedCouponCode.textContent = "-";

        if (couponInput) {
            couponInput.value = "";
        }
    }

    const { discount } = getCartTotals();
    const discountRow = document.getElementById("cartDiscountRow");
    const discountEl = document.getElementById("cartDiscount");

    if (discount > 0) {
        discountRow.classList.add("active");
        discountEl.textContent = "-" + formatPrice(discount);
    } else {
        discountRow.classList.remove("active");
        discountEl.textContent = "-₹0";
    }
}

function applyCoupon() {
    const input = document.getElementById("couponInput");

    if (!input) return;

    const code = input.value.trim().toUpperCase();

    if (!code) {
        setCouponMessage("Please enter a coupon code.", "error");
        return;
    }

    if (!coupons[code]) {
        setCouponMessage("Invalid coupon code.", "error");
        return;
    }

    if (!cart.length) {
        setCouponMessage("Add products to your cart first.", "error");
        return;
    }

    appliedCoupon = {
        code
    };

    saveCoupon();
    updateCart();

    setCouponMessage(
        `${coupons[code].label} applied successfully!`,
        "success"
    );
}

function removeCoupon() {
    appliedCoupon = null;
    saveCoupon();
    updateCart();
    setCouponMessage("Coupon removed.", "success");
}

/* ================= PRODUCTS ================= */
function displayProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    const filteredProducts = products.filter(product => {
        const matchesCategory = currentFilter === "All" || product.category === currentFilter;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesSearch;
    });

    if (!filteredProducts.length) {
        productsGrid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px">
                <h3>No products found</h3>
                <p>Try another search.</p>
            </div>`;
        return;
    }

    productsGrid.innerHTML = filteredProducts.map(product => {
        const isWishlisted = wishlist.includes(product.id);

        return `
        <div class="product-card">
            <div class="product-image" onclick="openProduct(${product.id})" style="cursor:pointer">
                <button class="wishlist ${isWishlisted ? "active" : ""}"
                    onclick="toggleWishlist(event, ${product.id})">
                    ${isWishlisted ? "♥" : "♡"}
                </button>
                ${product.emoji}
            </div>

            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <div class="rating">★★★★★ <span style="color:#777">(${product.rating})</span></div>

                <div class="product-bottom">
                    <div class="price">${formatPrice(product.price)}</div>
                    <button class="add-btn" onclick="addToCart(${product.id})">+</button>
                </div>
            </div>
        </div>`;
    }).join("");
}

/* ================= CART ================= */
function addToCart(productId) {
    const existing = cart.find(item => item.id === productId);

    if (existing) existing.quantity++;
    else cart.push({id:productId,quantity:1});

    saveCart();
    updateCart();
    openCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCart();
}

function changeQuantity(productId, amount) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += amount;

    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    saveCart();
    updateCart();
}

function saveCart() {
    localStorage.setItem("shopnest-cart", JSON.stringify(cart));
}

function updateCart() {
    const totalItems = cart.reduce((sum,item) => sum + item.quantity, 0);
    const totals = getCartTotals();

    cartCount.textContent = totalItems;

    const subtotalEl = document.getElementById("cartSubtotal");
    const shippingEl = document.getElementById("cartShipping");

    if (subtotalEl) subtotalEl.textContent = formatPrice(totals.subtotal);
    if (shippingEl) {
        shippingEl.textContent =
            totals.shipping === 0 ? "FREE" : formatPrice(totals.shipping);
    }

    cartTotal.textContent = formatPrice(totals.total);

    if (!cart.length) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <div style="font-size:60px">🛒</div>
                <h3>Your cart is empty</h3>
                <p>Add some products to get started.</p>
            </div>`;
        appliedCoupon = null;
        saveCoupon();
        renderCouponUI();
        return;
    }

    cartItems.innerHTML = cart.map(item => {
        const product = products.find(p => p.id === item.id);

        return `
        <div class="cart-item">
            <div class="cart-item-image">${product.emoji}</div>

            <div class="cart-item-info">
                <h4>${product.name}</h4>
                <p>${formatPrice(product.price)}</p>

                <div class="quantity">
                    <button onclick="changeQuantity(${product.id},-1)">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQuantity(${product.id},1)">+</button>
                </div>
            </div>

            <button class="remove-item" onclick="removeFromCart(${product.id})">✕</button>
        </div>`;
    }).join("");

    renderCouponUI();
}
function openCart() {
    cartSidebar.classList.add("active");
    overlay.classList.add("active");
}

function closeCart() {
    cartSidebar.classList.remove("active");
    overlay.classList.remove("active");
}

document.getElementById("cartBtn").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

/* ================= FILTER ================= */
document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        currentFilter = button.dataset.filter;
        displayProducts();
    });
});

/* ================= SEARCH ================= */
searchInput.addEventListener("input", displayProducts);

/* ================= CATEGORY ================= */
document.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
        currentFilter = card.dataset.category;

        document.querySelectorAll(".filter-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.filter === currentFilter);
        });

        document.getElementById("products").scrollIntoView({behavior:"smooth"});
        displayProducts();
    });
});

/* ================= WISHLIST ================= */
function toggleWishlist(event, productId) {
    event.stopPropagation();

    if (wishlist.includes(productId)) {
        wishlist = wishlist.filter(id => id !== productId);
    } else {
        wishlist.push(productId);
    }

    localStorage.setItem("shopnest-wishlist", JSON.stringify(wishlist));
    displayProducts();
}

/* ================= PRODUCT MODAL ================= */
function openProduct(productId) {
    const product = products.find(p => p.id === productId);
    const modal = document.getElementById("productModal");
    const modalProduct = document.getElementById("modalProduct");

    modalProduct.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:center">
            <div style="background:#f5f5f8;height:320px;border-radius:15px;display:grid;place-items:center;font-size:120px">
                ${product.emoji}
            </div>
            <div>
                <p class="section-label">${product.category}</p>
                <h2 style="margin:10px 0">${product.name}</h2>
                <div class="rating">★★★★★ ${product.rating}</div>
                <h2 style="margin:20px 0">${formatPrice(product.price)}</h2>
                <p style="color:#777">
                    Premium quality product designed for comfort, style and everyday use.
                </p>
                <button class="primary-btn" style="margin-top:25px" onclick="addToCart(${product.id})">
                    Add to Cart
                </button>
            </div>
        </div>`;

    modal.classList.add("active");
}

document.getElementById("modalClose").addEventListener("click", () => {
    document.getElementById("productModal").classList.remove("active");
});

document.getElementById("productModal").addEventListener("click", event => {
    if (event.target.id === "productModal") {
        event.target.classList.remove("active");
    }
});

/* ================= DARK MODE ================= */
const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const dark = document.body.classList.contains("dark");
    themeBtn.textContent = dark ? "☀️" : "🌙";
    localStorage.setItem("shopnest-dark", dark);
});

if (localStorage.getItem("shopnest-dark") === "true") {
    document.body.classList.add("dark");
    themeBtn.textContent = "☀️";
}

/* ================= MOBILE MENU ================= */
document.getElementById("menuBtn").addEventListener("click", () => {
    document.getElementById("mobileMenu").classList.toggle("active");
});

document.querySelectorAll(".mobile-menu a").forEach(link => {
    link.addEventListener("click", () => {
        document.getElementById("mobileMenu").classList.remove("active");
    });
});

/* ================= NEWSLETTER ================= */
document.getElementById("newsletterForm").addEventListener("submit", event => {
    event.preventDefault();
    alert("Thanks for subscribing! 🎉");
    event.target.reset();
});

/* ================= RECEIPT / CHECKOUT ================= */
const receiptModal = document.getElementById("receiptModal");
const receiptItems = document.getElementById("receiptItems");
const receiptSubtotal = document.getElementById("receiptSubtotal");
const receiptTotal = document.getElementById("receiptTotal");
const receiptOrderId = document.getElementById("receiptOrderId");
const receiptDate = document.getElementById("receiptDate");
const receiptDiscountRow = document.getElementById("receiptDiscountRow");
const receiptDiscount = document.getElementById("receiptDiscount");
const receiptCouponCode = document.getElementById("receiptCouponCode");

function generateReceipt() {
    if (!cart.length) {
        alert("Your cart is empty!");
        return;
    }

    const orderId = "SN-" + Date.now().toString().slice(-8);
    const now = new Date();

    const formattedDate = now.toLocaleDateString("en-IN", {
        day:"2-digit",
        month:"short",
        year:"numeric"
    });

    const totals = getCartTotals();

    receiptOrderId.textContent = orderId;
    receiptDate.textContent = formattedDate;

    let subtotal = 0;

    receiptItems.innerHTML = cart.map(item => {
        const product = products.find(p => p.id === item.id);
        const itemTotal = product.price * item.quantity;

        subtotal += itemTotal;

        return `
        <div class="receipt-item">
            <div class="receipt-product">
                <div class="receipt-product-icon">${product.emoji}</div>
                <div>
                    <div class="receipt-product-name">${product.name}</div>
                    <div class="receipt-product-category">${product.category}</div>
                </div>
            </div>
            <div class="receipt-quantity">×${item.quantity}</div>
            <div class="receipt-price">${formatPrice(itemTotal)}</div>
        </div>`;
    }).join("");

    receiptSubtotal.textContent = formatPrice(totals.subtotal);

    if (totals.discount > 0 && appliedCoupon) {
        receiptDiscountRow.classList.add("active");
        receiptDiscount.textContent = "-" + formatPrice(totals.discount);
        receiptCouponCode.textContent = `(${appliedCoupon.code})`;
    } else {
        receiptDiscountRow.classList.remove("active");
        receiptDiscount.textContent = "-₹0";
        receiptCouponCode.textContent = "";
    }

    document.getElementById("receiptShipping").textContent =
        totals.shipping === 0 ? "FREE" : formatPrice(totals.shipping);

    receiptTotal.textContent = formatPrice(totals.total);

    receiptModal.classList.add("active");

    cart = [];
    appliedCoupon = null;

    saveCart();
    saveCoupon();
    updateCart();
    closeCart();
}


document.getElementById("checkoutBtn").addEventListener("click", generateReceipt);

document.getElementById("receiptClose").addEventListener("click", () => {
    receiptModal.classList.remove("active");
});

document.getElementById("continueShopping").addEventListener("click", () => {
    receiptModal.classList.remove("active");
    document.getElementById("products").scrollIntoView({behavior:"smooth"});
});

document.getElementById("printReceipt").addEventListener("click", () => {
    window.print();
});

receiptModal.addEventListener("click", event => {
    if (event.target === receiptModal) {
        receiptModal.classList.remove("active");
    }
});

/* ================= COUPON EVENTS ================= */

document
    .getElementById("applyCouponBtn")
    .addEventListener("click", applyCoupon);

document
    .getElementById("removeCouponBtn")
    .addEventListener("click", removeCoupon);

document
    .getElementById("couponInput")
    .addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            applyCoupon();
        }
    });


/* ================= AUTHENTICATION ================= */

const authModal = document.getElementById("authModal");
const accountBtn = document.getElementById("accountBtn");
const accountLabel = document.getElementById("accountLabel");

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginPanel = document.getElementById("loginPanel");
const signupPanel = document.getElementById("signupPanel");
const accountPanel = document.getElementById("accountPanel");

const loginMessage = document.getElementById("loginMessage");
const signupMessage = document.getElementById("signupMessage");

function getUsers() {
    return JSON.parse(localStorage.getItem("shopnest-users")) || [];
}

function saveUsers(users) {
    localStorage.setItem("shopnest-users", JSON.stringify(users));
}

function showAuthMessage(element, message, type) {
    element.textContent = message;
    element.className = "auth-message " + type;
}

function showLoginPanel() {
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    loginPanel.classList.remove("hidden");
    signupPanel.classList.add("hidden");
    accountPanel.classList.add("hidden");
}

function showSignupPanel() {
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
    signupPanel.classList.remove("hidden");
    loginPanel.classList.add("hidden");
    accountPanel.classList.add("hidden");
}

function showAccountPanel() {
    loginPanel.classList.add("hidden");
    signupPanel.classList.add("hidden");
    loginTab.classList.remove("active");
    signupTab.classList.remove("active");
    accountPanel.classList.remove("hidden");

    const name = currentUser?.name || "ShopNest User";
    const email = currentUser?.email || "";

    document.getElementById("accountName").textContent = name;
    document.getElementById("accountEmail").textContent = email;
    document.getElementById("accountAvatar").textContent =
        name.trim().charAt(0).toUpperCase() || "P";

    accountLabel.textContent = "Account";
}

function openAuth() {
    authModal.classList.add("active");

    if (currentUser) {
        showAccountPanel();
    } else {
        showLoginPanel();
    }
}

function closeAuth() {
    authModal.classList.remove("active");
}

accountBtn.addEventListener("click", openAuth);

document.getElementById("authClose").addEventListener("click", closeAuth);

authModal.addEventListener("click", event => {
    if (event.target === authModal) closeAuth();
});

loginTab.addEventListener("click", showLoginPanel);
signupTab.addEventListener("click", showSignupPanel);

document.getElementById("switchToSignup").addEventListener("click", showSignupPanel);
document.getElementById("switchToLogin").addEventListener("click", showLoginPanel);

document.getElementById("signupForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim().toLowerCase();
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("signupConfirm").value;

    if (password !== confirm) {
        showAuthMessage(signupMessage, "Passwords do not match.", "error");
        return;
    }

    const users = getUsers();

    if (users.some(user => user.email === email)) {
        showAuthMessage(signupMessage, "An account with this email already exists.", "error");
        return;
    }

    users.push({
        name,
        email,
        password
    });

    saveUsers(users);

    currentUser = { name, email };
    localStorage.setItem("shopnest-user", JSON.stringify(currentUser));

    updateAccountUI();

    showAuthMessage(signupMessage, "Account created successfully!", "success");

    setTimeout(() => {
        showAccountPanel();
    }, 500);
});

document.getElementById("loginForm").addEventListener("submit", event => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    const users = getUsers();

    const user = users.find(
        item => item.email === email && item.password === password
    );

    if (!user) {
        showAuthMessage(loginMessage, "Incorrect email or password.", "error");
        return;
    }

    currentUser = {
        name: user.name,
        email: user.email
    };

    localStorage.setItem("shopnest-user", JSON.stringify(currentUser));

    if (document.getElementById("rememberMe").checked) {
        localStorage.setItem("shopnest-remember", "true");
    } else {
        localStorage.removeItem("shopnest-remember");
    }

    updateAccountUI();

    showAuthMessage(loginMessage, "Login successful!", "success");

    setTimeout(() => {
        showAccountPanel();
    }, 500);
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    currentUser = null;
    localStorage.removeItem("shopnest-user");
    localStorage.removeItem("shopnest-remember");

    updateAccountUI();
    showLoginPanel();

    document.getElementById("loginForm").reset();
    showAuthMessage(loginMessage, "You have been logged out.", "success");
});

document.getElementById("forgotPassword").addEventListener("click", () => {
    alert("Frontend demo: password reset would normally send a secure email from the backend.");
});

document.getElementById("accountOrders").addEventListener("click", () => {
    alert("Orders page is frontend-only in this demo. Connect it to your backend/order database.");
});

document.getElementById("accountWishlist").addEventListener("click", () => {
    closeAuth();
    document.getElementById("products").scrollIntoView({ behavior: "smooth" });
});

function updateAccountUI() {
    if (currentUser) {
        accountLabel.textContent = "Account";
    } else {
        accountLabel.textContent = "Login";
    }
}

updateAccountUI();

/* ================= INITIALIZE ================= */
displayProducts();
updateCart();
