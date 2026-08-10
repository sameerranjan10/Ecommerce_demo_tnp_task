
/* ================= GLOBAL STATE ================= */
let currentFilter = "All";
let currentUser = JSON.parse(localStorage.getItem("cartly-user")) || JSON.parse(localStorage.getItem("shopnest-user")) || null;
let cart = JSON.parse(localStorage.getItem("cartly-cart")) || JSON.parse(localStorage.getItem("shopnest-cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("cartly-wishlist")) || JSON.parse(localStorage.getItem("shopnest-wishlist")) || [];
let appliedCoupon = JSON.parse(localStorage.getItem("cartly-coupon")) || JSON.parse(localStorage.getItem("shopnest-coupon")) || null;

/* ================= UTILITY FUNCTIONS ================= */
function formatPrice(amount) {
    const num = Number(amount) || 0;
    return "₹" + num.toLocaleString("en-IN");
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
        return sum + (product ? product.price : 0) * item.quantity;
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
            "cartly-coupon",
            JSON.stringify(appliedCoupon)
        );
    } else {
        localStorage.removeItem("cartly-coupon");
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

/* ================= PRODUCTS & DOM ================= */
const productsGrid = document.getElementById("productsGrid");
const searchInput = document.getElementById("searchInput");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartSidebar = document.getElementById("cartSidebar");
const overlay = document.getElementById("overlay");
const modal = document.getElementById("productModal");
const modalProduct = document.getElementById("modalProduct");

let products = [];

function formatCategoryName(str) {
    if (!str) return "General";
    return str
        .split("-")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

const fallbackProducts = [
    {id:1,name:"Classic Oversized T-Shirt",category:"Fashion",price:799,originalPrice:999,discountPercent:"20% OFF",rating:4.8,emoji:"👕",description:"Premium quality cotton oversized t-shirt."},
    {id:2,name:"Premium Hoodie",category:"Fashion",price:1499,originalPrice:1899,discountPercent:"21% OFF",rating:4.7,emoji:"🧥",description:"Warm and stylish fleece hoodie."},
    {id:3,name:"Wireless Headphones",category:"Electronics",price:2499,originalPrice:3299,discountPercent:"24% OFF",rating:4.9,emoji:"🎧",description:"Immersive sound with high bass and ANC."},
    {id:4,name:"Smart Watch Pro",category:"Electronics",price:3999,originalPrice:4999,discountPercent:"20% OFF",rating:4.6,emoji:"⌚",description:"Fitness tracking, heart monitor & AMOLED screen."},
    {id:5,name:"Urban Sneakers",category:"Shoes",price:2299,originalPrice:2999,discountPercent:"23% OFF",rating:4.8,emoji:"👟",description:"Comfortable everyday streetwear sneakers."},
    {id:6,name:"Running Shoes",category:"Shoes",price:2799,originalPrice:3499,discountPercent:"20% OFF",rating:4.7,emoji:"🥾",description:"Lightweight breathable athletic shoes."},
    {id:7,name:"Leather Backpack",category:"Accessories",price:1899,originalPrice:2399,discountPercent:"21% OFF",rating:4.5,emoji:"🎒",description:"Spacious genuine leather laptop bag."},
    {id:8,name:"Classic Sunglasses",category:"Accessories",price:999,originalPrice:1299,discountPercent:"23% OFF",rating:4.6,emoji:"🕶️",description:"UV400 protection polarized lenses."}
];

function renderHeroComposition() {
    const heroComp = document.getElementById("heroComposition");
    if (!heroComp || !products.length) return;

    const showcase = products.slice(0, 4);
    heroComp.innerHTML = showcase.map(p => `
        <div class="hero-comp-card" onclick="openProduct(${p.id})" style="cursor:pointer">
            ${p.image ? `<img src="${p.image}" alt="${p.name}">` : `<span style="font-size:50px">${p.emoji}</span>`}
            <span>${p.name}</span>
            <small style="color:var(--primary);font-weight:800;margin-top:2px">${formatPrice(p.price)}</small>
        </div>
    `).join("");
}

async function loadProducts() {
    try {
        if (productsGrid) {
            productsGrid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted)">
                    <div style="font-size:32px;margin-bottom:10px">⌛</div>
                    <h3>Fetching products from Dummy API...</h3>
                </div>`;
        }

        const response = await fetch("https://dummyjson.com/products?limit=30");
        if (!response.ok) throw new Error("API response error");

        const data = await response.json();

        if (data && data.products && data.products.length > 0) {
            products = data.products.map(item => {
                const price = Math.round(item.price * 85);
                const originalPrice = Math.round(price * 1.25);
                return {
                    id: item.id,
                    name: item.title,
                    category: formatCategoryName(item.category),
                    price: price,
                    originalPrice: originalPrice,
                    discountPercent: "20% OFF",
                    rating: item.rating ? Number(item.rating.toFixed(1)) : 4.5,
                    image: item.thumbnail || item.images?.[0],
                    description: item.description,
                    emoji: "🛍️"
                };
            });
        } else {
            products = fallbackProducts;
        }

        renderCategoryFilters();
        renderCategoryCards();
        renderHeroComposition();
        displayProducts();
    } catch (err) {
        console.warn("API fetch failed, loading fallback products:", err);
        products = fallbackProducts;
        renderCategoryFilters();
        renderCategoryCards();
        renderHeroComposition();
        displayProducts();
    }
}

function displayProducts() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const sortSelect = document.getElementById("sortSelect");
    const sortValue = sortSelect ? sortSelect.value : "featured";

    let filteredProducts = products.filter(product => {
        const catLower = product.category.toLowerCase();
        const filterLower = currentFilter.toLowerCase();
        const matchesCategory = currentFilter === "All" || catLower === filterLower || catLower.includes(filterLower) || filterLower.includes(catLower);
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesSearch;
    });

    if (sortValue === "price-low") {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortValue === "price-high") {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortValue === "rating") {
        filteredProducts.sort((a, b) => b.rating - a.rating);
    }

    if (!productsGrid) return;

    if (!filteredProducts.length) {
        productsGrid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px">
                <h3>No products found</h3>
                <p>Try another search or filter.</p>
                <button class="primary-btn" style="margin-top:15px" onclick="currentFilter='All';if(searchInput)searchInput.value='';displayProducts()">Show All Products</button>
            </div>`;
        return;
    }

    productsGrid.innerHTML = filteredProducts.map(product => {
        const isWishlisted = wishlist.includes(product.id);
        const reviewCount = Math.floor(product.id * 17 % 180) + 24;

        return `
        <div class="product-card">
            <div class="product-image">
                ${product.discountPercent ? `<span class="image-discount-tag">${product.discountPercent}</span>` : ''}
                <button class="wishlist ${isWishlisted ? "active" : ""}"
                    onclick="toggleWishlist(event, ${product.id})" aria-label="Toggle wishlist">
                    <svg class="icon-svg" viewBox="0 0 24 24" style="width:16px;height:16px;${isWishlisted ? 'fill:currentColor' : ''}"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </button>
                <div onclick="openProduct(${product.id})" style="width:100%;height:100%;display:grid;place-items:center;cursor:pointer">
                    ${product.image ? `<img src="${product.image}" alt="${product.name}" class="product-thumb">` : `<span style="font-size:70px">${product.emoji}</span>`}
                </div>
                <div class="quick-view-bar" onclick="openProduct(${product.id})">
                    <span>Quick View</span>
                </div>
            </div>

            <div class="product-info">
                <span class="category-badge">${product.category}</span>
                <h3 class="product-name" onclick="openProduct(${product.id})" style="cursor:pointer">${product.name}</h3>
                <div class="rating">
                    <span>★</span> <strong>${product.rating}</strong> <small style="color:var(--muted)">(${reviewCount})</small>
                </div>

                <div class="product-bottom">
                    <div class="price-box">
                        <span class="price">${formatPrice(product.price)}</span>
                        ${product.originalPrice ? `<span class="original-price">${formatPrice(product.originalPrice)}</span>` : ''}
                    </div>
                    <button class="add-btn" onclick="addToCart(${product.id})" aria-label="Add to cart">+</button>
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
    localStorage.setItem("cartly-cart", JSON.stringify(cart));
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
            <div class="cart-item-image">${product && product.image ? `<img src="${product.image}" alt="${product.name}" style="max-height:90%;max-width:90%;object-fit:contain">` : (product ? product.emoji : "🛍️")}</div>

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
function renderCategoryFilters() {
    const filtersContainer = document.getElementById("filtersContainer");
    if (!filtersContainer) return;

    const uniqueCategories = ["All", ...new Set(products.map(p => p.category))];

    filtersContainer.innerHTML = uniqueCategories.map(cat => `
        <button class="filter-btn ${cat.toLowerCase() === currentFilter.toLowerCase() ? 'active' : ''}" data-filter="${cat}">
            ${cat}
        </button>
    `).join("");

    filtersContainer.querySelectorAll(".filter-btn").forEach(button => {
        button.addEventListener("click", () => {
            filtersContainer.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            currentFilter = button.dataset.filter;
            displayProducts();
        });
    });
}

/* ================= SEARCH & DROPDOWN ================= */
const searchDropdown = document.getElementById("searchDropdown");

function renderSearchDropdown() {
    if (!searchInput || !searchDropdown) return;
    const query = searchInput.value.trim().toLowerCase();

    if (!query) {
        searchDropdown.classList.remove("active");
        return;
    }

    const matches = products.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)).slice(0, 5);

    if (matches.length > 0) {
        searchDropdown.innerHTML = matches.map(p => `
            <div class="search-drop-item" onclick="openProduct(${p.id});if(searchDropdown)searchDropdown.classList.remove('active')">
                ${p.image ? `<img src="${p.image}" alt="${p.name}" class="search-drop-thumb">` : '🛍️'}
                <div>
                    <div style="font-weight:700">${p.name}</div>
                    <div style="font-size:11px;color:var(--muted)">${p.category} • ${formatPrice(p.price)}</div>
                </div>
            </div>
        `).join("");
        searchDropdown.classList.add("active");
    } else {
        searchDropdown.innerHTML = `<div style="padding:10px;font-size:12px;color:var(--muted);text-align:center">No matching products</div>`;
        searchDropdown.classList.add("active");
    }
}

if (searchInput) {
    searchInput.addEventListener("input", () => {
        renderSearchDropdown();
        displayProducts();
    });
    searchInput.addEventListener("focus", renderSearchDropdown);
}

document.addEventListener("click", (e) => {
    if (searchDropdown && !e.target.closest(".search-wrap")) {
        searchDropdown.classList.remove("active");
    }
});

/* ================= SORTING ================= */
const sortSelect = document.getElementById("sortSelect");
if (sortSelect) {
    sortSelect.addEventListener("change", displayProducts);
}

/* ================= NEWSLETTER ================= */
const newsletterForm = document.getElementById("newsletterForm");
if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const emailInput = document.getElementById("newsletterEmail");
        if (emailInput && emailInput.value) {
            alert(`Thank you for subscribing! Exclusive offers will be sent to ${emailInput.value}.`);
            emailInput.value = "";
        }
    });
}

/* ================= CATEGORY CARDS ================= */
const categoryEmojis = {
    beauty: "✨",
    groceries: "🛒",
    furniture: "🪑",
    fragrances: "🧴",
    fashion: "👕",
    electronics: "💻",
    shoes: "👟",
    accessories: "👜"
};

function renderCategoryCards() {
    const categoriesContainer = document.getElementById("categoriesContainer");
    if (!categoriesContainer) return;

    const categoryCounts = {};
    products.forEach(p => {
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });

    const uniqueCategories = Object.keys(categoryCounts);

    if (uniqueCategories.length > 0) {
        categoriesContainer.innerHTML = uniqueCategories.map(cat => {
            const emoji = categoryEmojis[cat.toLowerCase()] || "🛍️";
            const count = categoryCounts[cat];

            return `
            <div class="category-card" data-category="${cat}">
                <div class="category-icon">${emoji}</div>
                <h3>${cat}</h3>
                <p>${count} Product${count > 1 ? 's' : ''}</p>
            </div>`;
        }).join("");
    }
}

// Universal event delegation for Category Cards
document.addEventListener("click", (e) => {
    const card = e.target.closest(".category-card");
    if (card) {
        const category = card.dataset.category || card.querySelector("h3")?.textContent?.trim();
        if (category) {
            currentFilter = category;

            if (searchInput) searchInput.value = "";

            const filtersContainer = document.getElementById("filtersContainer");
            if (filtersContainer) {
                filtersContainer.querySelectorAll(".filter-btn").forEach(btn => {
                    const btnFilter = btn.dataset.filter || btn.textContent.trim();
                    btn.classList.toggle("active", btnFilter.toLowerCase() === currentFilter.toLowerCase());
                });
            }

            const productsSection = document.getElementById("products");
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: "smooth" });
            }

            displayProducts();
        }
    }
});

/* ================= FEATURE SCOPES ================= */
const featureDetails = {
    shipping: "🚚 Free Shipping: Enjoy zero delivery charges on all orders above ₹999 across India!",
    secure: "🔒 Secure Payment: All transactions are protected with SSL 256-bit encryption.",
    returns: "↩️ Easy Returns: 30 days hassle-free return and instant refund guarantee.",
    support: "💬 24/7 Support: Reach our dedicated customer service team anytime via chat or email."
};

document.querySelectorAll(".feature").forEach(feature => {
    feature.addEventListener("click", () => {
        const featureKey = feature.dataset.feature;
        if (featureKey && featureDetails[featureKey]) {
            alert(featureDetails[featureKey]);
        }
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

    localStorage.setItem("cartly-wishlist", JSON.stringify(wishlist));
    displayProducts();
}

/* ================= PRODUCT MODAL ================= */
function openProduct(productId) {
    const product = products.find(p => p.id === productId);
    const modal = document.getElementById("productModal");
    const modalProduct = document.getElementById("modalProduct");

    modalProduct.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:center">
            <div style="background:var(--chip-bg);border:1px solid var(--border);height:320px;border-radius:15px;display:grid;place-items:center;padding:20px">
                ${product.image ? `<img src="${product.image}" alt="${product.name}" style="max-height:100%;max-width:100%;object-fit:contain">` : `<span style="font-size:120px">${product.emoji}</span>`}
            </div>
            <div>
                <p class="section-label">${product.category}</p>
                <h2 style="margin:10px 0">${product.name}</h2>
                <div class="rating">★★★★★ ${product.rating}</div>
                <h2 style="margin:20px 0">${formatPrice(product.price)}</h2>
                <p style="color:var(--muted)">
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

/* ================= DARK / LIGHT THEME TOGGLE ================= */
function getSavedTheme() {
    const cartlyDark = localStorage.getItem("cartly-dark");
    if (cartlyDark !== null) {
        return cartlyDark === "true";
    }
    const shopnestDark = localStorage.getItem("shopnest-dark");
    return shopnestDark === "true";
}

function updateThemeUI(isDark) {
    if (isDark) {
        document.body.classList.add("dark");
    } else {
        document.body.classList.remove("dark");
    }

    const themeBtn = document.getElementById("themeBtn");
    const mobileThemeIcon = document.getElementById("mobileThemeIcon");
    const mobileThemeLabel = document.getElementById("mobileThemeLabel");

    if (themeBtn) {
        themeBtn.textContent = isDark ? "☀️" : "🌙";
        themeBtn.setAttribute("aria-label", isDark ? "Switch to Light Mode" : "Switch to Dark Mode");
    }

    if (mobileThemeIcon) {
        mobileThemeIcon.textContent = isDark ? "☀️" : "🌙";
    }

    if (mobileThemeLabel) {
        mobileThemeLabel.textContent = isDark ? "Switch to Light Mode" : "Switch to Dark Mode";
    }
}

function toggleTheme() {
    const currentlyDark = document.body.classList.contains("dark");
    const nextDark = !currentlyDark;
    updateThemeUI(nextDark);
    localStorage.setItem("cartly-dark", String(nextDark));
}

document.addEventListener("click", (e) => {
    if (e.target.closest("#themeBtn") || e.target.closest("#mobileThemeBtn")) {
        toggleTheme();
    }
});

updateThemeUI(getSavedTheme());

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

    // Save order data to user order history
    const orderData = {
        orderId,
        date: formattedDate,
        items: cart.map(i => ({ ...i })),
        totals: { ...totals }
    };

    const userOrders = JSON.parse(localStorage.getItem("cartly-orders")) || [];
    userOrders.unshift(orderData);
    localStorage.setItem("cartly-orders", JSON.stringify(userOrders));

    receiptOrderId.textContent = orderId;
    receiptDate.textContent = formattedDate;

    let subtotal = 0;

    receiptItems.innerHTML = cart.map(item => {
        const product = products.find(p => p.id === item.id);
        const itemTotal = (product ? product.price : 0) * item.quantity;

        subtotal += itemTotal;

        return `
        <div class="receipt-item">
            <div class="receipt-product">
                <div class="receipt-product-icon">${product && product.image ? `<img src="${product.image}" alt="${product.name}" style="max-height:100%;max-width:100%;object-fit:contain">` : (product ? product.emoji : "🛍️")}</div>
                <div>
                    <div class="receipt-product-name">${product ? product.name : "Product"}</div>
                    <div class="receipt-product-category">${product ? product.category : ""}</div>
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
    return JSON.parse(localStorage.getItem("cartly-users")) || JSON.parse(localStorage.getItem("shopnest-users")) || [];
}

function saveUsers(users) {
    localStorage.setItem("cartly-users", JSON.stringify(users));
}

function showAuthMessage(element, message, type) {
    element.textContent = message;
    element.className = "auth-message " + type;
}



function getUserOrders() {
    return JSON.parse(localStorage.getItem("cartly-orders")) || [];
}

function updateDashboardUI() {
    if (!currentUser) return;

    const authCard = document.querySelector(".auth-card");
    if (authCard) authCard.classList.add("dashboard-mode");

    const name = currentUser?.name || "Cartly User";
    const email = currentUser?.email || "";

    document.getElementById("accountName").textContent = name;
    document.getElementById("accountEmail").textContent = email;
    document.getElementById("accountAvatar").textContent =
        name.trim().charAt(0).toUpperCase() || "C";

    // Settings Profile Input values
    const nameInput = document.getElementById("profileName");
    const phoneInput = document.getElementById("profilePhone");
    const addressInput = document.getElementById("profileAddress");

    if (nameInput) nameInput.value = name;
    if (phoneInput) phoneInput.value = currentUser?.phone || "";
    if (addressInput) addressInput.value = currentUser?.address || "";

    // Stats calculations
    const userOrders = getUserOrders();
    const totalOrders = userOrders.length;
    const wishlistCount = wishlist.length;
    const totalSpent = userOrders.reduce((sum, o) => sum + (o.totals?.total || 0), 0);

    const ordersEl = document.getElementById("dashTotalOrders");
    const wishEl = document.getElementById("dashWishlistCount");
    const spentEl = document.getElementById("dashTotalSpent");

    if (ordersEl) ordersEl.textContent = totalOrders;
    if (wishEl) wishEl.textContent = wishlistCount;
    if (spentEl) spentEl.textContent = formatPrice(totalSpent);

    // Recent Order preview
    const latestContainer = document.getElementById("dashLatestOrderContent");
    if (latestContainer) {
        if (userOrders.length > 0) {
            const latest = userOrders[0];
            latestContainer.innerHTML = `
                <div class="dash-order-item">
                    <div>
                        <strong>Order #${latest.orderId}</strong>
                        <div style="font-size:12px;color:var(--muted)">${latest.date} • ${latest.items.length} item(s)</div>
                    </div>
                    <div style="text-align:right">
                        <span class="order-badge">Processing</span>
                        <div style="font-weight:800;margin-top:4px">${formatPrice(latest.totals?.total || 0)}</div>
                    </div>
                </div>`;
        } else {
            latestContainer.innerHTML = `<p class="empty-dash">No orders placed yet.</p>`;
        }
    }

    // Render Orders List Tab
    const ordersList = document.getElementById("dashOrdersList");
    if (ordersList) {
        if (userOrders.length > 0) {
            ordersList.innerHTML = userOrders.map(order => `
                <div class="dash-order-item">
                    <div>
                        <strong>Order #${order.orderId}</strong>
                        <div style="font-size:12px;color:var(--muted)">Date: ${order.date}</div>
                        <div style="font-size:12px;color:var(--muted)">${order.items.length} product(s)</div>
                    </div>
                    <div style="text-align:right">
                        <span class="order-badge">Processing</span>
                        <div style="font-weight:800;margin-top:4px">${formatPrice(order.totals?.total || 0)}</div>
                    </div>
                </div>
            `).join("");
        } else {
            ordersList.innerHTML = `<p class="empty-dash">No past orders found.</p>`;
        }
    }

    // Render Wishlist Tab
    const wishGrid = document.getElementById("dashWishlistGrid");
    if (wishGrid) {
        const wishProducts = products.filter(p => wishlist.includes(p.id));
        if (wishProducts.length > 0) {
            wishGrid.innerHTML = wishProducts.map(p => `
                <div class="dash-wish-item">
                    <div style="display:flex;align-items:center;gap:10px">
                        ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:36px;height:36px;object-fit:contain">` : `<span>${p.emoji}</span>`}
                        <div>
                            <div style="font-size:12px;font-weight:700">${p.name}</div>
                            <div style="font-size:11px;color:var(--muted)">${formatPrice(p.price)}</div>
                        </div>
                    </div>
                    <button class="add-btn" style="width:32px;height:32px;font-size:16px;font-weight:800" onclick="addToCart(${p.id})">+</button>
                </div>
            `).join("");
        } else {
            wishGrid.innerHTML = `<p class="empty-dash">Your wishlist is empty.</p>`;
        }
    }
}

function showAccountPanel() {
    loginPanel.classList.add("hidden");
    signupPanel.classList.add("hidden");
    loginTab.classList.remove("active");
    signupTab.classList.remove("active");
    accountPanel.classList.remove("hidden");

    updateDashboardUI();
    accountLabel.textContent = "Dashboard";
}

function showLoginPanel() {
    const authCard = document.querySelector(".auth-card");
    if (authCard) authCard.classList.remove("dashboard-mode");

    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    loginPanel.classList.remove("hidden");
    signupPanel.classList.add("hidden");
    accountPanel.classList.add("hidden");
}

function showSignupPanel() {
    const authCard = document.querySelector(".auth-card");
    if (authCard) authCard.classList.remove("dashboard-mode");

    signupTab.classList.add("active");
    loginTab.classList.remove("active");
    signupPanel.classList.remove("hidden");
    loginPanel.classList.add("hidden");
    accountPanel.classList.add("hidden");
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

const switchToSignup = document.getElementById("switchToSignup");
if (switchToSignup) switchToSignup.addEventListener("click", showSignupPanel);

const switchToLogin = document.getElementById("switchToLogin");
if (switchToLogin) switchToLogin.addEventListener("click", showLoginPanel);
/* ================= PASSWORD VISIBILITY TOGGLE ================= */
document.querySelectorAll(".toggle-password").forEach(btn => {
    btn.addEventListener("click", () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        if (!input) return;

        if (input.type === "password") {
            input.type = "text";
            btn.textContent = "🙈";
        } else {
            input.type = "password";
            btn.textContent = "👁️";
        }
    });
});

/* ================= DASHBOARD TAB SWITCHING ================= */
document.querySelectorAll(".dash-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".dash-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        const target = tab.dataset.dash;
        document.querySelectorAll(".dash-content").forEach(content => {
            content.classList.add("hidden");
        });

        if (target === "overview") document.getElementById("dashOverview")?.classList.remove("hidden");
        if (target === "orders") document.getElementById("dashOrders")?.classList.remove("hidden");
        if (target === "wishlist") document.getElementById("dashWishlist")?.classList.remove("hidden");
        if (target === "settings") document.getElementById("dashSettings")?.classList.remove("hidden");
    });
});

/* ================= PROFILE SETTINGS SUBMIT ================= */
const profileForm = document.getElementById("profileForm");
if (profileForm) {
    profileForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!currentUser) return;

        currentUser.name = document.getElementById("profileName").value.trim();
        currentUser.phone = document.getElementById("profilePhone").value.trim();
        currentUser.address = document.getElementById("profileAddress").value.trim();

        localStorage.setItem("cartly-user", JSON.stringify(currentUser));

        const users = getUsers();
        const uIndex = users.findIndex(u => u.email === currentUser.email);
        if (uIndex !== -1) {
            users[uIndex] = { ...users[uIndex], ...currentUser };
            saveUsers(users);
        }

        updateDashboardUI();
        showAuthMessage(document.getElementById("profileMessage"), "Profile updated successfully!", "success");
    });
}

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

    const newUser = { name, email, password };
    users.push(newUser);

    saveUsers(users);

    currentUser = { name, email };
    localStorage.setItem("cartly-user", JSON.stringify(currentUser));

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
        email: user.email,
        phone: user.phone || "",
        address: user.address || ""
    };

    localStorage.setItem("cartly-user", JSON.stringify(currentUser));

    if (document.getElementById("rememberMe").checked) {
        localStorage.setItem("cartly-remember", "true");
    } else {
        localStorage.removeItem("cartly-remember");
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
    localStorage.removeItem("cartly-user");
    localStorage.removeItem("shopnest-user");
    localStorage.removeItem("cartly-remember");
    localStorage.removeItem("shopnest-remember");

    updateAccountUI();
    showLoginPanel();

    document.getElementById("loginForm").reset();
    showAuthMessage(loginMessage, "You have been logged out.", "success");
});

document.getElementById("forgotPassword").addEventListener("click", () => {
    alert("Frontend demo: Enter any registered email/password or create a new account to test login.");
});

function updateAccountUI() {
    if (currentUser) {
        accountLabel.textContent = "Dashboard";
    } else {
        accountLabel.textContent = "Login";
    }
}

updateAccountUI();

/* ================= EXPOSE TO WINDOW FOR INLINE ONCLICK HANDLERS ================= */
window.formatPrice = formatPrice;
window.openProduct = openProduct;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQuantity = changeQuantity;
window.toggleWishlist = toggleWishlist;
window.displayProducts = displayProducts;
window.openCart = openCart;
window.closeCart = closeCart;
window.openAuth = openAuth;
window.closeAuth = closeAuth;
window.showLoginPanel = showLoginPanel;
window.showSignupPanel = showSignupPanel;
window.showAccountPanel = showAccountPanel;
window.loadProducts = loadProducts;

/* ================= INITIALIZE ================= */
loadProducts();
updateCart();
