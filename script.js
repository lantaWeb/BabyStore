const WEB3FORMS_ACCESS_KEY = "bb82a359-5a45-49fc-964f-429bdb6c4182";
const CART_STORAGE_KEY = "babystore_cart";

const state = {
    lang: "en",
    category: "all",
    search: "",
    mobileMenuOpen: false
};

let cart = loadCartFromStorage();

function loadCartFromStorage() {
    try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        return storedCart ? JSON.parse(storedCart) : [];
    } catch (error) {
        console.error("Ошибка чтения корзины из localStorage:", error);
        return [];
    }
}

function saveCartToStorage() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        console.error("Ошибка сохранения корзины в localStorage:", error);
    }
}

function getProductName(product, lang) {
    return `${translations[lang].toy} ${product.id}`;
}

function syncAllControls() {
    const language = document.getElementById("language");
    const languageMobile = document.getElementById("language-mobile");
    const category = document.getElementById("category-filter");
    const categoryMobile = document.getElementById("category-filter-mobile");
    const search = document.getElementById("search");
    const searchMobile = document.getElementById("search-mobile");

    if (language) language.value = state.lang;
    if (languageMobile) languageMobile.value = state.lang;
    if (category) category.value = state.category;
    if (categoryMobile) categoryMobile.value = state.category;
    if (search) search.value = state.search;
    if (searchMobile) searchMobile.value = state.search;
}

function openImageModal(src, alt) {
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("image-modal-img");

    modalImg.src = src;
    modalImg.alt = alt;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeImageModal() {
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("image-modal-img");

    modal.classList.remove("open");
    modalImg.src = "";
    modalImg.alt = "";

    if (!state.mobileMenuOpen) {
        document.body.style.overflow = "";
    }
}

function getFilteredProducts(lang) {
    return products.filter(product => {
        const productName = getProductName(product, lang).toLowerCase();
        const matchesCategory = state.category === "all" || product.category === state.category;
        const matchesSearch = productName.includes(state.search.trim().toLowerCase());

        return matchesCategory && matchesSearch;
    });
}

function renderEmptyState(lang) {
    const catalog = document.getElementById("catalog");
    catalog.innerHTML = `
        <div class="empty-state">
            <h3>${translations[lang].noProductsTitle}</h3>
            <p>${translations[lang].noProductsText}</p>
        </div>
    `;
}

function renderProducts(lang) {
    const catalog = document.getElementById("catalog");
    catalog.innerHTML = "";

    if (!Array.isArray(products) || products.length === 0) {
        catalog.innerHTML = `
            <div class="empty-state">
                <h3>Products not found</h3>
                <p>Check products.js file.</p>
            </div>
        `;
        return;
    }

    const filteredProducts = getFilteredProducts(lang);

    if (filteredProducts.length === 0) {
        renderEmptyState(lang);
        return;
    }

    filteredProducts.forEach(product => {
        const productName = getProductName(product, lang);

        const productElement = document.createElement("div");
        productElement.className = "card";
        productElement.innerHTML = `
            <img src="${product.image}" alt="${productName}" onclick="openImageModal('${product.fullImage}', '${productName}')">
            <h2>${productName}</h2>
            <p>${translations[lang].price} €${product.price.toFixed(2)}</p>
            <div class="product-actions">
                <input type="number" value="1" min="1" id="qty-${product.id}" class="product-qty">
                <button type="button" onclick="addToCart(${product.id}, '${productName}', ${product.price})">${translations[lang].addToCart}</button>
            </div>
        `;
        catalog.appendChild(productElement);
    });
}

function addToCart(id, name, price) {
    const quantityInput = document.getElementById(`qty-${id}`);
    const quantityToAdd = quantityInput ? parseInt(quantityInput.value, 10) || 1 : 1;

    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += quantityToAdd;
    } else {
        cart.push({
            id,
            name,
            price,
            quantity: quantityToAdd
        });
    }

    saveCartToStorage();
    updateCart();
    updateCartButton();
    document.getElementById("cart-container").style.display = "none";
}


function removeFromCart(index) {
    cart.splice(index, 1);
    saveCartToStorage();
    updateCart();
    updateCartButton();
}

function clearCart() {
    cart = [];
    saveCartToStorage();
    updateCart();
    updateCartButton();
}

function updateCart() {
    const lang = state.lang;
    const cartItems = document.getElementById("cart-items");
    cartItems.innerHTML = "";

    if (cart.length === 0) {
        const li = document.createElement("li");
        li.textContent = translations[lang].cartEmpty;
        cartItems.appendChild(li);
        return;
    }

    cart.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "cart-item";
        li.innerHTML = `
            <span>${item.name} x${item.quantity} - €${(item.price * item.quantity).toFixed(2)}</span>
            <button type="button" onclick="removeFromCart(${index})">${translations[lang].remove}</button>
        `;
        cartItems.appendChild(li);
    });
}

function updateCartButton() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartButton = document.getElementById("cart-button");
    const cartButtonMobile = document.getElementById("cart-button-mobile");

    if (cartButton) cartButton.setAttribute("data-count", totalItems);
    if (cartButtonMobile) cartButtonMobile.setAttribute("data-count", totalItems);
}

function checkout() {
    const lang = state.lang;

    if (!cart.length) {
        alert(translations[lang].cartEmpty || "Cart is empty");
        return;
    }

    const firstName = document.getElementById("first-name").value.trim();
    const lastName = document.getElementById("last-name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!firstName || !lastName || !phone || !email) {
        alert(translations[lang].fillAllFields);
        return;
    }

    sendCartToServer(cart, firstName, lastName, phone, email, lang);
}


async function sendCartToServer(cart, firstName, lastName, phone, email, lang) {
    try {
        const emailText = `
Новый заказ от ${firstName} ${lastName}
Телефон: ${phone}
Email: ${email}

Детали заказа:
${cart.map(item => `- ${item.name} (x${item.quantity}) - €${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Общая сумма: €${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
        `;

        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                access_key: WEB3FORMS_ACCESS_KEY,
                subject: `Новый заказ от ${firstName} ${lastName}`,
                name: `${firstName} ${lastName}`,
                email: email,
                phone: phone,
                message: emailText,
                botcheck: document.getElementById("botcheck").checked
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(translations[lang].orderSuccess);
            clearCart();
            document.getElementById("cart-container").style.display = "none";
            document.getElementById("checkout-form").reset();
        } else {
            alert(`${translations[lang].orderError} ${result.message || ""}`);
        }
    } catch (error) {
        console.error("Ошибка:", error);
        alert(translations[lang].orderError);
    }
}

function continueShopping() {
    document.getElementById("cart-container").style.display = "none";
}

function updateCategoryFilter(lang) {
    const options = `
        <option value="all">${translations[lang].allCategories}</option>
        <option value="toys">${translations[lang].toys}</option>
        <option value="clothes">${translations[lang].clothes}</option>
        <option value="accessories">${translations[lang].accessories}</option>
    `;

    document.getElementById("category-filter").innerHTML = options;
    document.getElementById("category-filter-mobile").innerHTML = options;

    syncAllControls();
}

function updateTranslations(lang) {
    document.getElementById("search").placeholder = translations[lang].search;
    document.getElementById("search-mobile").placeholder = translations[lang].search;

    document.getElementById("cart-button").textContent = translations[lang].cart;
    document.getElementById("cart-button-mobile").textContent = translations[lang].cart;

    document.getElementById("catalog-nav").textContent = translations[lang].catalog || "Catalog";
    document.getElementById("catalog-nav-mobile").textContent = translations[lang].catalog || "Catalog";

    document.getElementById("about-nav").textContent = translations[lang].about;
    document.getElementById("contacts-nav").textContent = translations[lang].contacts;
    document.getElementById("delivery-nav").textContent = translations[lang].delivery;

    document.getElementById("about-nav-mobile").textContent = translations[lang].about;
    document.getElementById("contacts-nav-mobile").textContent = translations[lang].contacts;
    document.getElementById("delivery-nav-mobile").textContent = translations[lang].delivery;

    document.getElementById("about-title").textContent = translations[lang].about;
    document.getElementById("about-text").textContent = translations[lang].aboutText;
    document.getElementById("contacts-title").textContent = translations[lang].contacts;
    document.getElementById("contacts-text").textContent = translations[lang].contactsText;
    document.getElementById("delivery-title").textContent = translations[lang].delivery;
    document.getElementById("delivery-text").textContent = translations[lang].deliveryText;
    document.getElementById("cart-title").textContent = translations[lang].cartTitle;
    document.getElementById("checkout-btn").textContent = translations[lang].checkout;
    document.getElementById("continue-btn").textContent = translations[lang].continueShopping;
    document.getElementById("first-name").placeholder = translations[lang].firstName;
    document.getElementById("last-name").placeholder = translations[lang].lastName;
    document.getElementById("phone").placeholder = translations[lang].phone;
    document.getElementById("email").placeholder = translations[lang].email;

    updateCategoryFilter(lang);
    renderProducts(lang);
    updateCart();
    updateCartButton();
}

function toggleCart() {
    const cartContainer = document.getElementById("cart-container");
    cartContainer.style.display = cartContainer.style.display === "block" ? "none" : "block";
}

function openMobileMenu() {
    const toggle = document.getElementById("nav-toggle");
    const menu = document.getElementById("mobile-menu");

    state.mobileMenuOpen = true;
    menu.classList.add("open");
    toggle.classList.add("active");
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
}

function closeMobileMenu() {
    const toggle = document.getElementById("nav-toggle");
    const menu = document.getElementById("mobile-menu");

    state.mobileMenuOpen = false;
    menu.classList.remove("open");
    toggle.classList.remove("active");
    toggle.setAttribute("aria-expanded", "false");

    if (!document.getElementById("image-modal").classList.contains("open")) {
        document.body.classList.remove("menu-open");
    }
}

function toggleMobileMenu() {
    if (state.mobileMenuOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

document.getElementById("language").addEventListener("change", (e) => {
    state.lang = e.target.value;
    syncAllControls();
    updateTranslations(state.lang);
});

document.getElementById("language-mobile").addEventListener("change", (e) => {
    state.lang = e.target.value;
    syncAllControls();
    updateTranslations(state.lang);
});

document.getElementById("category-filter").addEventListener("change", (e) => {
    state.category = e.target.value;
    syncAllControls();
    renderProducts(state.lang);
});

document.getElementById("category-filter-mobile").addEventListener("change", (e) => {
    state.category = e.target.value;
    syncAllControls();
    renderProducts(state.lang);
});

document.getElementById("search").addEventListener("input", (e) => {
    state.search = e.target.value;
    syncAllControls();
    renderProducts(state.lang);
});

document.getElementById("search-mobile").addEventListener("input", (e) => {
    state.search = e.target.value;
    syncAllControls();
    renderProducts(state.lang);
});

document.getElementById("cart-button").addEventListener("click", toggleCart);
document.getElementById("cart-button-mobile").addEventListener("click", toggleCart);
document.getElementById("nav-toggle").addEventListener("click", toggleMobileMenu);

document.querySelectorAll("[data-close-menu='true']").forEach(link => {
    link.addEventListener("click", () => {
        closeMobileMenu();
    });
});

document.getElementById("image-modal").addEventListener("click", (e) => {
    if (e.target.id === "image-modal") {
        closeImageModal();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeImageModal();
        closeMobileMenu();
    }
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 980) {
        closeMobileMenu();
    }
});

syncAllControls();
updateTranslations(state.lang);
updateCart();
updateCartButton();
