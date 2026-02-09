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
    price: 200000,
    image: '../../src/Tra-phu-hoi-1.jpg',
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

// Cập nhật giao diện giỏ hàng - VIẾT LẠI HOÀN TOÀN
function updateCartUI() {
    console.log('Updating cart UI with:', cart); // Debug
    
    // Cập nhật số lượng trên icon
    const cartCount = document.getElementById('cartCount');
    if (!cartCount) {
        console.error('cartCount element not found');
        return;
    }
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';

    // Cập nhật danh sách sản phẩm trong sidebar
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) {
        console.error('cartItems element not found');
        return;
    }
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty" style="text-align: center; padding: 60px 20px; color: var(--gray);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 80px; height: 80px; margin: 0 auto 20px; opacity: 0.3;">
                    <circle cx="9" cy="21" r="1" stroke-width="2"/><circle cx="20" cy="21" r="1" stroke-width="2"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" stroke-width="2"/>
                </svg>
                <p style="font-size: 1.1rem; margin: 0;">Giỏ hàng trống</p>
            </div>
        `;
    } else {
        // Clear existing content
        cartItems.innerHTML = '';
        
        // Render từng item bằng DOM manipulation (an toàn hơn)
        cart.forEach(item => {
            console.log('Rendering item:', item); // Debug
            
            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'cart-item';
            cartItemDiv.style.cssText = 'display: flex; gap: 15px; padding: 20px 0; border-bottom: 1px solid #E8E8E8; align-items: center;';
            
            // Image container
            const imageDiv = document.createElement('div');
            imageDiv.className = 'cart-item-image';
            imageDiv.style.cssText = 'width: 80px; height: 80px; flex-shrink: 0; border-radius: 12px; overflow: hidden; background: #F5F1E8;';
            
            const img = document.createElement('img');
            const imagePath = item.image || '../../src/Tra-phu-hoi-1.jpg';
            console.log('Image path:', imagePath); // Debug
            img.src = imagePath;
            img.alt = item.name;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; display: block;';
            
            // Error handler cho ảnh
            img.onerror = function() {
                console.error('Image failed to load:', this.src);
                this.src = '../../src/Tra-phu-hoi-1.jpg';
                this.onerror = function() {
                    console.error('Fallback image also failed');
                    // Hiển thị placeholder text nếu ảnh không load được
                    this.style.display = 'none';
                    const placeholder = document.createElement('div');
                    placeholder.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #3A7D44; color: white; font-weight: bold;';
                    placeholder.textContent = item.name.charAt(0);
                    imageDiv.appendChild(placeholder);
                };
            };
            
            img.onload = function() {
                console.log('Image loaded successfully:', this.src); // Debug
            };
            
            imageDiv.appendChild(img);
            
            // Details container
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'cart-item-details';
            detailsDiv.style.cssText = 'flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 0;';
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'cart-item-name';
            nameDiv.textContent = item.name;
            nameDiv.style.cssText = 'font-weight: 600; color: #2D5016; font-size: 1rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
            
            const priceDiv = document.createElement('div');
            priceDiv.className = 'cart-item-price';
            priceDiv.textContent = formatPrice(item.price);
            priceDiv.style.cssText = 'color: #3A7D44; font-weight: 600; font-size: 0.95rem;';
            
            // Quantity controls
            const qtyDiv = document.createElement('div');
            qtyDiv.className = 'cart-item-quantity';
            qtyDiv.style.cssText = 'display: flex; align-items: center; gap: 10px;';
            
            const minusBtn = document.createElement('button');
            minusBtn.className = 'qty-btn';
            minusBtn.textContent = '-';
            minusBtn.style.cssText = 'width: 30px; height: 30px; border-radius: 50%; background: #F5F1E8; border: none; cursor: pointer; font-weight: 600; color: #3A7D44; transition: all 0.3s;';
            minusBtn.onmouseover = function() { this.style.background = '#E5E1D8'; };
            minusBtn.onmouseout = function() { this.style.background = '#F5F1E8'; };
            minusBtn.onclick = () => updateCartQuantity(item.id, -1);
            
            const qtySpan = document.createElement('span');
            qtySpan.className = 'cart-item-qty';
            qtySpan.textContent = item.quantity;
            qtySpan.style.cssText = 'min-width: 30px; text-align: center; font-weight: 600; color: #2D5016;';
            
            const plusBtn = document.createElement('button');
            plusBtn.className = 'qty-btn';
            plusBtn.textContent = '+';
            plusBtn.style.cssText = 'width: 30px; height: 30px; border-radius: 50%; background: #F5F1E8; border: none; cursor: pointer; font-weight: 600; color: #3A7D44; transition: all 0.3s;';
            plusBtn.onmouseover = function() { this.style.background = '#E5E1D8'; };
            plusBtn.onmouseout = function() { this.style.background = '#F5F1E8'; };
            plusBtn.onclick = () => updateCartQuantity(item.id, 1);
            
            qtyDiv.appendChild(minusBtn);
            qtyDiv.appendChild(qtySpan);
            qtyDiv.appendChild(plusBtn);
            
            detailsDiv.appendChild(nameDiv);
            detailsDiv.appendChild(priceDiv);
            detailsDiv.appendChild(qtyDiv);
            
            // Remove button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'cart-item-remove';
            removeBtn.innerHTML = '&times;';
            removeBtn.style.cssText = 'width: 30px; height: 30px; border-radius: 50%; background: transparent; border: none; cursor: pointer; font-size: 1.8rem; color: #999; flex-shrink: 0; line-height: 1; transition: all 0.3s;';
            removeBtn.onmouseover = function() { this.style.color = '#FF4444'; this.style.background = '#FFEBEE'; };
            removeBtn.onmouseout = function() { this.style.color = '#999'; this.style.background = 'transparent'; };
            removeBtn.onclick = () => removeFromCart(item.id);
            
            // Append all elements
            cartItemDiv.appendChild(imageDiv);
            cartItemDiv.appendChild(detailsDiv);
            cartItemDiv.appendChild(removeBtn);
            
            cartItems.appendChild(cartItemDiv);
        });
    }

    // Cập nhật tổng tiền
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartTotal = document.getElementById('cartTotal');
    if (cartTotal) {
        cartTotal.textContent = formatPrice(total);
    }
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

    if (decreaseBtn && increaseBtn && quantityInput) {
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
    }

    // Add to cart button
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            addToCart(currentQuantity);
        });
    }

    // Buy now button
    const buyNowBtn = document.getElementById('buyNowBtn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            addToCart(currentQuantity);
            window.location.href = '../../checkout/checkout.html';
        });
    }

    // Cart sidebar
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartClose = document.getElementById('cartClose');
    const cartOverlay = document.getElementById('cartOverlay');

    if (cartBtn && cartSidebar && cartClose && cartOverlay) {
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
    }

    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                window.location.href = '../../checkout/checkout.html';
            } else {
                showNotification('Giỏ hàng trống!');
            }
        });
    }

    // Header scroll effect
    window.addEventListener('scroll', () => {
        const header = document.getElementById('header');
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });

    // Mobile menu
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
        });
    }

    // User dropdown
    const userBtn = document.getElementById('userBtn');
    const userDropdown = document.getElementById('userDropdown');

    if (userBtn && userDropdown) {
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (!isLoggedIn) {
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
            if (userDropdown) {
                userDropdown.classList.remove('active');
            }
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

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            button.classList.add('active');
            const targetPane = document.getElementById(targetTab);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
}

// ====== IMAGE GALLERY ======

function initImageGallery() {
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.thumbnail');

    if (mainImage && thumbnails.length > 0) {
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', () => {
                thumbnails.forEach(thumb => thumb.classList.remove('active'));
                thumbnail.classList.add('active');
                mainImage.src = thumbnail.src;
            });
        });
    }
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
    const savedUser = localStorage.getItem('teaUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isLoggedIn = true;
        updateUserUI();
    }

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
    
    if (typeof supabaseClient !== 'undefined') {
        supabaseClient.auth.signOut();
    }
}

function updateUserUI() {
    const userBtn = document.getElementById('userBtn');
    if (!userBtn) return;
    
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