/* ============================================
   PRODUCT DETAIL PAGE - JAVASCRIPT
   Chi tiết sản phẩm Trà Phú Hội
   ============================================ */

// ====== GLOBAL STATE ======
let cart = [];
let currentQuantity = 1;
let isLoggedIn = false;
let currentUser = null;

// Thông tin sản phẩm hiện tại
const currentProduct = {
    id: 1,
    name: 'Trà Phú Hội',
    category: 'green',
    price: 3600000,
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect fill='%233A7D44' width='400' height='400'/><circle cx='200' cy='200' r='120' fill='%236FBF73' opacity='0.3'/><text x='50%' y='50%' font-size='20' fill='white' text-anchor='middle' dy='.3em'>Sencha</text></svg>",
    description: 'Trà Phú Hội - Mô tả ngắn',
    badge: 'Bán chạy',
    stock: 50
};

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', async () => {
    initCart();
    await initAuth();
    initEventListeners();
    initTabs();
    initImageGallery();
});

// ====== CART MANAGEMENT ======

// Khởi tạo giỏ hàng từ LocalStorage
function initCart() {
    const savedCart = localStorage.getItem('teaCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
}

// Lưu giỏ hàng vào LocalStorage
function saveCart() {
    localStorage.setItem('teaCart', JSON.stringify(cart));
}

// Thêm sản phẩm vào giỏ
function addToCart(quantity = 1) {
    const existingItem = cart.find(item => item.id === currentProduct.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            image: currentProduct.image,
            quantity: quantity
        });
    }

    saveCart();
    updateCartUI();
    showNotification(`Đã thêm ${quantity} sản phẩm "${currentProduct.name}" vào giỏ hàng`);
}

// Xóa sản phẩm khỏi giỏ
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

// Cập nhật số lượng sản phẩm
function updateCartQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        updateCartUI();
    }
}

// Cập nhật giao diện giỏ hàng
function updateCartUI() {
    // Cập nhật số lượng trên icon
    const cartCount = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';

    // Cập nhật danh sách sản phẩm trong sidebar
    const cartItems = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                </svg>
                <p>Giỏ hàng trống</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                    <div class="cart-item-quantity">
                        <button class="qty-btn" onclick="updateCartQuantity(${item.id}, -1)">-</button>
                        <span class="cart-item-qty">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateCartQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">&times;</button>
            </div>
        `).join('');
    }

    // Cập nhật tổng tiền
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cartTotal').textContent = formatPrice(total);
}

// Format giá tiền
function formatPrice(price) {
    return price.toLocaleString('vi-VN') + 'đ';
}

// ====== EVENT LISTENERS ======

function initEventListeners() {
    // Quantity controls
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    const quantityInput = document.getElementById('quantity');

    decreaseBtn.addEventListener('click', () => {
        if (currentQuantity > 1) {
            currentQuantity--;
            quantityInput.value = currentQuantity;
        }
    });

    increaseBtn.addEventListener('click', () => {
        if (currentQuantity < currentProduct.stock) {
            currentQuantity++;
            quantityInput.value = currentQuantity;
        }
    });

    quantityInput.addEventListener('change', (e) => {
        let value = parseInt(e.target.value);
        if (isNaN(value) || value < 1) {
            value = 1;
        } else if (value > currentProduct.stock) {
            value = currentProduct.stock;
        }
        currentQuantity = value;
        quantityInput.value = value;
    });

    // Add to cart button
    const addToCartBtn = document.getElementById('addToCartBtn');
    addToCartBtn.addEventListener('click', () => {
        addToCart(currentQuantity);
    });

    // Buy now button
    const buyNowBtn = document.getElementById('buyNowBtn');
    buyNowBtn.addEventListener('click', () => {
        addToCart(currentQuantity);
        window.location.href = '../../checkout.html';
    });

    // Cart sidebar
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartClose = document.getElementById('cartClose');
    const cartOverlay = document.getElementById('cartOverlay');

    cartBtn.addEventListener('click', () => {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    cartClose.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    cartOverlay.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                window.location.href = '../../checkout.html';
            } else {
                showNotification('Giỏ hàng trống!');
            }
        });
    }

    // Header scroll effect
    window.addEventListener('scroll', () => {
        const header = document.getElementById('header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile menu
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        nav.classList.toggle('active');
    });

    // User dropdown
    const userBtn = document.getElementById('userBtn');
    const userDropdown = document.getElementById('userDropdown');

    if (userBtn && userDropdown) {
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (!isLoggedIn) {
                // Redirect to login page
                window.location.href = '../../login.html';
                return;
            }
            
            userBtn.classList.toggle('active');
            userDropdown.classList.toggle('active');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (userBtn && userDropdown) {
            if (!userBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userBtn.classList.remove('active');
                userDropdown.classList.remove('active');
            }
        }
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
            userDropdown.classList.remove('active');
        });
    }
}

// ====== TABS ======

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// ====== IMAGE GALLERY ======

function initImageGallery() {
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.thumbnail');

    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', () => {
            // Remove active class from all thumbnails
            thumbnails.forEach(thumb => thumb.classList.remove('active'));
            
            // Add active class to clicked thumbnail
            thumbnail.classList.add('active');
            
            // Update main image
            mainImage.src = thumbnail.src;
        });
    });
}

// ====== NOTIFICATIONS ======

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #2D5016;
        color: white;
        padding: 16px 24px;
        border-radius: 50px;
        box-shadow: 0 4px 16px rgba(45, 80, 22, 0.3);
        z-index: 10000;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ====== AUTH MANAGEMENT ======

async function initAuth() {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('teaUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isLoggedIn = true;
        updateUserUI();
    }

    // If using Supabase, check session
    if (typeof supabaseClient !== 'undefined') {
        try {
            const { data } = await supabaseClient.auth.getUser();
            
            if (data?.user) {
                const user = data.user;
                currentUser = {
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.name || 'Người dùng'
                };
                isLoggedIn = true;
                localStorage.setItem('teaUser', JSON.stringify(currentUser));
                updateUserUI();
            }
        } catch (error) {
            console.log('Auth check error:', error);
        }
    }
}

function logoutUser() {
    currentUser = null;
    isLoggedIn = false;
    localStorage.removeItem('teaUser');
    updateUserUI();
    showNotification('Đã đăng xuất');
    
    // If using Supabase
    if (typeof supabaseClient !== 'undefined') {
        supabaseClient.auth.signOut();
    }
}

function updateUserUI() {
    const userBtn = document.getElementById('userBtn');
    const userArrow = userBtn.querySelector('.user-arrow');
    const userName = document.getElementById('userName');
    
    if (isLoggedIn && currentUser) {
        userBtn.classList.add('logged-in');
        if (userArrow) userArrow.style.display = 'inline';
        if (userName) {
            userName.textContent = `Xin chào, ${currentUser.name || 'Người dùng'}`;
        }
    } else {
        userBtn.classList.remove('logged-in');
        if (userArrow) userArrow.style.display = 'none';
    }
}

// ====== CONSOLE LOG ======
console.log('%c🍃 Product Detail Page', 'color: #2D5016; font-size: 20px; font-weight: bold;');
console.log('%cTrà Phú Hội - Chi tiết sản phẩm', 'color: #3A7D44; font-size: 14px;');