const WEB3FORMS_ACCESS_KEY = "bb82a359-5a45-49fc-964f-429bdb6c4182";
const CART_STORAGE_KEY = "babystore_cart";

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
    document.body.style.overflow = "";
}

function getFilteredProducts(lang) {
    const category = document.getElementById("category-filter").value;
    const searchTerm = document.getElementById("search").value.trim().toLowerCase();

    return products.filter(product => {
        const productName = getProductName(product, lang).toLowerCase();
        const matchesCategory = category === "all" || product.category === category;
        const matchesSearch = productName.includes(searchTerm);

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
            <input type="number" value="1" min="1" id="qty-${product.id}">
            <button onclick="addToCart(${product.id}, '${productName}', ${product.price})">${translations[lang].addToCart}</button>
        `;
        catalog.appendChild(productElement);
    });
}

function addToCart(id, name, price) {
    const quantity = parseInt(document.getElementById(`qty-${id}`).value, 10);
    const item = { id, name, price, quantity };

    cart.push(item);
    saveCartToStorage();
    updateCart();
    document.getElementById("cart-container").style.display = "none";
    updateCartButton();
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
    const lang = document.getElementById("language").value;
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
    cartButton.setAttribute("data-count", totalItems);
}

function checkout() {
    const lang = document.getElementById("language").value;
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
    const categoryFilter = document.getElementById("category-filter");
    categoryFilter.innerHTML = `
        <option value="all">${translations[lang].allCategories}</option>
        <option value="toys">${translations[lang].toys}</option>
        <option value="clothes">${translations[lang].clothes}</option>
        <option value="accessories">${translations[lang].accessories}</option>
    `;
}

function updateTranslations(lang) {
    document.getElementById("search").placeholder = translations[lang].search;
    document.getElementById("cart-button").textContent = translations[lang].cart;
    document.getElementById("about-nav").textContent = translations[lang].about;
    document.getElementById("contacts-nav").textContent = translations[lang].contacts;
    document.getElementById("delivery-nav").textContent = translations[lang].delivery;
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

document.getElementById("language").addEventListener("change", (e) => {
    updateTranslations(e.target.value);
});

document.getElementById("category-filter").addEventListener("change", () => {
    renderProducts(document.getElementById("language").value);
});

document.getElementById("search").addEventListener("input", () => {
    renderProducts(document.getElementById("language").value);
});

document.getElementById("cart-button").addEventListener("click", () => {
    const cartContainer = document.getElementById("cart-container");
    cartContainer.style.display = cartContainer.style.display === "block" ? "none" : "block";
});

document.getElementById("image-modal").addEventListener("click", (e) => {
    if (e.target.id === "image-modal") {
        closeImageModal();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeImageModal();
    }
});

updateTranslations("en");
updateCart();
updateCartButton();
