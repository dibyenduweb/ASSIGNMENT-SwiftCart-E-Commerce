// ===== GLOBAL VARIABLES =====
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let allProducts = [];
let currentCategory = 'all';

// ===== DOM ELEMENTS =====
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const cartIcon = document.getElementById('cartIcon');
const cartCount = document.getElementById('cartCount');
const productModal = document.getElementById('productModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalBody = document.getElementById('modalBody');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

    // Check for elements to determine which content to load
    if (document.getElementById('productsGrid')) {
        loadCategories();
        loadAllProducts();
    }
    if (document.getElementById('trendingProducts')) {
        loadTrendingProducts();
    }

    // Newsletter forms
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }

    const footerNewsletterForm = document.getElementById('footerNewsletterForm');
    if (footerNewsletterForm) {
        footerNewsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }
});

// ===== HAMBURGER MENU =====
if (hamburger) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking on a link
if (navMenu) {
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
}

// ===== FETCH ALL PRODUCTS =====
async function loadAllProducts() {
    const productsGrid = document.getElementById('productsGrid');

    if (!productsGrid) return;

    try {
        showLoadingSpinner(productsGrid);
        const response = await fetch('https://fakestoreapi.com/products');
        allProducts = await response.json();
        displayProducts(allProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        productsGrid.innerHTML = '<p style="text-align: center; color: var(--text-light); grid-column: 1/-1;">Failed to load products. Please try again later.</p>';
    }
}

// ===== FETCH TRENDING PRODUCTS (TOP 3) =====
async function loadTrendingProducts() {
    const trendingContainer = document.getElementById('trendingProducts');

    if (!trendingContainer) return;

    try {
        showLoadingSpinner(trendingContainer);
        const response = await fetch('https://fakestoreapi.com/products?limit=3');
        const products = await response.json();
        displayProducts(products, trendingContainer);
    } catch (error) {
        console.error('Error loading trending products:', error);
        trendingContainer.innerHTML = '<p style="text-align: center; color: var(--text-light); grid-column: 1/-1;">Failed to load products.</p>';
    }
}

// ===== FETCH CATEGORIES =====
async function loadCategories() {
    const categoryFilter = document.getElementById('categoryFilter');

    if (!categoryFilter) return;

    try {
        const response = await fetch('https://fakestoreapi.com/products/categories');
        const categories = await response.json();

        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = category;
            button.setAttribute('data-category', category);
            button.addEventListener('click', () => filterByCategory(category, button));
            categoryFilter.appendChild(button);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// ===== FILTER PRODUCTS BY CATEGORY =====
async function filterByCategory(category, buttonElement) {
    const productsGrid = document.getElementById('productsGrid');

    // Update active state
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    buttonElement.classList.add('active');

    currentCategory = category;

    try {
        showLoadingSpinner(productsGrid);

        let products;
        if (category === 'all') {
            products = allProducts;
        } else {
            const response = await fetch(`https://fakestoreapi.com/products/category/${category}`);
            products = await response.json();
        }

        displayProducts(products);
    } catch (error) {
        console.error('Error filtering products:', error);
        productsGrid.innerHTML = '<p style="text-align: center; color: var(--text-light); grid-column: 1/-1;">Failed to load products.</p>';
    }
}

// ===== DISPLAY PRODUCTS =====
function displayProducts(products, container = null) {
    const productsGrid = container || document.getElementById('productsGrid');

    if (!productsGrid) return;

    productsGrid.innerHTML = '';

    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// ===== CREATE PRODUCT CARD =====
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const truncatedTitle = product.title.length > 60 
        ? product.title.substring(0, 60) + '...' 
        : product.title;

    const stars = generateStars(product.rating.rate);

    card.innerHTML = `
        <div class="product-image-container">
            <img src="${product.image}" alt="${product.title}" class="product-image">
        </div>
        <div class="product-info">
            <span class="product-category">${product.category}</span>
            <h3 class="product-title">${truncatedTitle}</h3>
            <div class="product-rating">
                <span class="stars">${stars}</span>
                <span class="rating-count">${product.rating.rate} (${product.rating.count})</span>
            </div>
            <div class="product-price">$${product.price}</div>
            <div class="product-actions">
                <button class="btn btn-outline btn-small" onclick="showProductDetails(${product.id})">
                    <i class="fas fa-info-circle"></i> Details
                </button>
                <button class="btn btn-primary btn-small" onclick="addToCart(${product.id})">
                    <i class="fas fa-cart-plus"></i> Add
                </button>
            </div>
        </div>
    `;

    return card;
}

// ===== GENERATE STAR RATING =====
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }

    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }

    return stars;
}

// ===== SHOW PRODUCT DETAILS IN MODAL =====
async function showProductDetails(productId) {
    try {
        const response = await fetch(`https://fakestoreapi.com/products/${productId}`);
        const product = await response.json();

        const stars = generateStars(product.rating.rate);

        modalBody.innerHTML = `
            <div class="modal-product">
                <div class="modal-product-image-container">
                    <img src="${product.image}" alt="${product.title}" class="modal-product-image">
                </div>
                <div class="modal-product-details">
                    <span class="product-category">${product.category}</span>
                    <h2>${product.title}</h2>
                    <div class="product-rating">
                        <span class="stars">${stars}</span>
                        <span class="rating-count">${product.rating.rate} (${product.rating.count} reviews)</span>
                    </div>
                    <div class="product-price">$${product.price}</div>
                    <p>${product.description}</p>
                    <button class="btn btn-primary" onclick="addToCart(${product.id}); closeModal();">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <button class="btn btn-outline" onclick="closeModal()">Close</button>
                </div>
            </div>
        `;

        productModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error loading product details:', error);
        alert('Failed to load product details. Please try again.');
    }
}

// ===== CLOSE MODAL =====
function closeModal() {
    productModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

if (modalClose) {
    modalClose.addEventListener('click', closeModal);
}

if (modalOverlay) {
    modalOverlay.addEventListener('click', closeModal);
}

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && productModal.classList.contains('active')) {
        closeModal();
    }
});

// ===== ADD TO CART =====
async function addToCart(productId) {
    try {
        // Check if product already in cart
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            const response = await fetch(`https://fakestoreapi.com/products/${productId}`);
            const product = await response.json();

            cart.push({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }

        updateCart();
        showNotification('Product added to cart!');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Failed to add product. Please try again.', 'error');
    }
}

// ===== REMOVE FROM CART =====
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    showNotification('Product removed from cart!');
}

// ===== UPDATE CART =====
function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// ===== UPDATE CART COUNT =====
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

// ===== SHOW NOTIFICATION =====
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bgColor = type === 'error' ? '#ef4444' : 'var(--success-color)';

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background-color: ${bgColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 3000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
        max-width: 300px;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== SHOW LOADING SPINNER =====
function showLoadingSpinner(container) {
    container.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
        </div>
    `;
}

// ===== NEWSLETTER FORM =====
function handleNewsletterSubmit(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    showNotification(`Thank you for subscribing with ${email}!`);
    e.target.reset();
}

// ===== ADD CSS ANIMATIONS =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);