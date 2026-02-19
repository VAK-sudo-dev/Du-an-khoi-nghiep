/* ============================================
   TEAVERSE - MAIN JAVASCRIPT
   Website functionality & interactions
   ============================================ */
   
// ====== CHATBOT CONFIGURATION ======
const OPENROUTER_API_KEY = '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'; // Thay bằng key của bạn
const MODEL = 'arcee-ai/trinity-mini:free';

const SYSTEM_PROMPT = `Bạn là chuyên gia tư vấn trà của Trà Phú Hội- thương hiệu trà cao cấp Phú Hội, Việt Nam.

PHONG CÁCH GIAO TIẾP:
- Xưng hô: Em (bạn) - Anh/Chị (khách hàng)
- Giọng điệu: Thân thiện, nhiệt tình, chuyên nghiệp nhưng gần gũi
- Luôn dùng emoji phù hợp: 🍃 ☕ 😊 💚 ✨
- Trả lời ngắn gọn, súc tích, dễ hiểu
- Tạo cảm giác như đang chat với người thật, không máy móc

SẢN PHẨM CỦA TRÀ PHÚ HỘI:
1. **Trà Xanh Phú Hội** - 200.000đ (Hộp 200g) (Hộp 100g hoặc 450.000đ (Túi 500g))
   - Tươi mát, thanh nhiệt
   - Giàu chất chống oxy hóa
   - Phù hợp uống hàng ngày

2. **Trà Xanh Phú Hội Vị Gừng** - 200.000đ (Hộp 200g)
    - Hương vị ấm áp, kích thích tiêu hóa
    - Tăng cường hệ miễn dịch
    - Giúp cơ thể sảng khoái

QUY TRÌNH PHA TRÀ:
1. Bốc 1 nhúm trà (3-5g) vào ấm (hạn chế sử dụng từ thìa cà phê vì lá trà chỉ có thể bốc chứ không đo được bằng muỗng)
2. Rót nước sôi (90-95°C) vào ấm (Có thể sử dụng nước Mạch Bà để tăng hương vị)
3. Đợi trà trong khoảng 3-5 phút
4. Rót trà ra tách và thưởng thức

CÔNG DỤNG TRÀ PHÚ HỘI:
(Tự generate câu trả lời nhưng hãy nói chung chung)

THÔNG TIN LIÊN HỆ:
📞 Hotline: 0798 130 810
📧 Email: anhkhoi130810@gmail.com
📍 Địa chỉ: Xã Phú Hội, Huyện Nhơn Trạch, Đồng Nai
🚚 Giao hàng toàn quốc

CÁCH ĐẶT HÀNG:
1. Chọn sản phẩm trên website (traphuhoi.netlify.app)
2. Thêm vào giỏ hàng  
3. Thanh toán online (qua mã QR) hoặc COD
Hoặc gọi hotline để được tư vấn trực tiếp!

NGUYÊN TẮC TRẢ LỜI:
- Nếu khách hỏi về sản phẩm → giới thiệu chi tiết, gợi ý phù hợp
- Nếu hỏi giá → báo giá rõ ràng, có thể đề xuất combo
- Nếu hỏi công dụng → giải thích cụ thể, dễ hiểu
- Nếu hỏi cách đặt → hướng dẫn từng bước, đơn giản
- Nếu chào hỏi → chào lại thân thiện, hỏi khách cần gì
- Nếu không liên quan đến trà → lịch sự đưa về chủ đề trà

LƯU Ý:
- Không nói dài dòng, mỗi câu trả lời 2-6 dòng là đủ
- Luôn kết thúc bằng câu hỏi mở để tiếp tục hội thoại
- Tự nhiên như chat với bạn bè, không cứng nhắc
- Nếu khách hỏi khó → trung thực nói "em xin phép hỏi lại" hoặc gợi ý gọi hotline`;

// ====== GLOBAL STATE ======
let cart = [];
let currentFilter = 'all';
let displayedProducts = 1; // Số sản phẩm hiển thị ban đầu
let isLoggedIn = false; // Thêm state đăng nhập
let currentUser = null; // Thông tin user
// Chat request lock to avoid concurrent calls
let isRequestingAI = false;

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', async () => {
    initCart();
    await initAuth();
    // Only render products if we're on a page with product grid
    if (document.getElementById('productsGrid')) {
        renderProducts();
    }
    initEventListeners();
    if (document.getElementById('productsGrid')) {
        initScrollAnimations();
    }
    initSmoothScroll();
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
function addToCart(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    saveCart();
    updateCartUI();
    showNotification(`Đã thêm "${product.name}" vào giỏ hàng`);
}

// Xóa sản phẩm khỏi giỏ
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

// Cập nhật số lượng sản phẩm
function updateQuantity(productId, change) {
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
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span class="cart-item-qty">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
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

// ====== PRODUCT RENDERING ======

// Render sản phẩm
function renderProducts(filter = 'all') {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return; // Exit early if productsGrid doesn't exist
    
    let filteredProducts = productsData;

    // Lọc theo category
    if (filter !== 'all') {
        filteredProducts = productsData.filter(p => p.category === filter);
    }

    // Xác định số lượng sản phẩm hiển thị dựa trên kích thước màn hình
    let defaultItemsToShow = 3; // Desktop: 3 sản phẩm
    
    if (window.innerWidth < 768) {
        defaultItemsToShow = 1; // Mobile: 1 sản phẩm
    }

    // Nếu chưa set displayedProducts, dùng giá trị mặc định
    if (displayedProducts === 1 && window.innerWidth >= 768) {
        displayedProducts = defaultItemsToShow;
    }

    // Hiển thị số lượng sản phẩm theo displayedProducts
    const productsToShow = filteredProducts.slice(0, displayedProducts);

    productsGrid.innerHTML = productsToShow.map(product => `
        <div class="product-card fade-in" data-category="${product.category}">
            <div class="product-image" onclick="goToProductDetail(${product.id})" style="cursor: pointer;">
                <img src="${product.image}" alt="${product.name}">
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-content">
                <div class="product-category">${getCategoryName(product.category)}</div>
                <h3 class="product-name" onclick="goToProductDetail(${product.id})" style="cursor: pointer;">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <div class="product-price">${formatPrice(product.price)}</div>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                        Thêm vào giỏ
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Hiện/ẩn nút "Xem thêm"
    const loadMoreBtn = document.getElementById('loadMore');
    if (loadMoreBtn) {
        if (productsToShow.length >= filteredProducts.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'inline-block';
        }
    }

    // Trigger scroll animation
    setTimeout(() => {
        observeElements();
    }, 100);
}

// Lấy tên danh mục
function getCategoryName(category) {
    const categories = {
        green: 'Trà xanh',
        black: 'Trà đen',
        oolong: 'Ô long',
        herbal: 'Thảo mộc'
    };
    return categories[category] || category;
}

// ====== SEARCH FUNCTIONALITY ======

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (!searchInput || !searchResults) return; // Exit early if elements don't exist

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length === 0) {
            searchResults.innerHTML = '';
            return;
        }

        const results = productsData.filter(product => 
            product.name.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query) ||
            getCategoryName(product.category).toLowerCase().includes(query)
        );

        if (results.length === 0) {
            searchResults.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">Không tìm thấy sản phẩm</p>';
        } else {
            searchResults.innerHTML = results.map(product => `
                <div class="search-result-item" onclick="openProductFromSearch(${product.id})">
                    <img src="${product.image}" alt="${product.name}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #2D5016;">${product.name}</div>
                        <div style="font-size: 0.9rem; color: #666;">${formatPrice(product.price)}</div>
                    </div>
                </div>
            `).join('');
        }
    });
}

function closeSearchAndScroll(productId) {
    document.getElementById('searchModal').classList.remove('active');
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
    
    // Scroll to products section
    const productsSection = document.getElementById('products');
    productsSection.scrollIntoView({ behavior: 'smooth' });
}

// Open product from search results: close modal then navigate to product detail
function openProductFromSearch(productId) {
    const searchModal = document.getElementById('searchModal');
    if (searchModal) searchModal.classList.remove('active');
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    const searchResults = document.getElementById('searchResults');
    if (searchResults) searchResults.innerHTML = '';

    // small delay to allow modal close animations, then navigate
    setTimeout(() => {
        goToProductDetail(productId);
    }, 120);
}

// ====== EVENT LISTENERS ======

function initEventListeners() {

    console.log('Initializing event listeners...');
    console.log('User button found:', document.getElementById('userBtn'));
    console.log('Is logged in:', isLoggedIn);

    // Active nav link khi scroll
    function updateActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let currentSectionId = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            
            if (window.scrollY >= sectionTop && 
                window.scrollY < sectionTop + sectionHeight) {
                currentSectionId = section.id;
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    }

    // Header scroll effect + active nav update
    window.addEventListener('scroll', () => {
        const header = document.getElementById('header');
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
        updateActiveNav();
    });

    // Gọi updateActiveNav lần đầu khi load
    setTimeout(updateActiveNav, 100);

    // Hamburger menu - with null check
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');
    
    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
        });

        // Close menu khi click vào nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
            });
        });
    }

    // Cart sidebar toggle - with null checks
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartClose = document.getElementById('cartClose');

    function closeCart() {
        if (cartSidebar) cartSidebar.classList.remove('active');
        if (cartOverlay) cartOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    if (cartBtn && cartSidebar && cartOverlay) {
        cartBtn.addEventListener('click', () => {
            cartSidebar.classList.add('active');
            cartOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        if (cartClose) cartClose.addEventListener('click', closeCart);
        cartOverlay.addEventListener('click', closeCart);
    }

    // Search modal - with null checks
    const searchBtn = document.querySelector('.search-btn');
    const searchModal = document.getElementById('searchModal');
    const searchClose = document.getElementById('searchClose');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn && searchModal && searchClose) {
        searchBtn.addEventListener('click', () => {
            searchModal.classList.add('active');
            if (searchInput) searchInput.focus();
        });

        searchClose.addEventListener('click', () => {
            searchModal.classList.remove('active');
        });

        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) {
                searchModal.classList.remove('active');
            }
        });
    }

    initSearch();

    // Product filters - only if product page
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                currentFilter = btn.dataset.filter;
                displayedProducts = 8; // Reset số lượng hiển thị
                renderProducts(currentFilter);
            });
        });
    }

    // Category cards
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            
            // Scroll to products section
            document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
            
            // Set filter
            setTimeout(() => {
                const filterBtn = document.querySelector(`[data-filter="${category}"]`);
                filterBtn.click();
            }, 500);
        });
    });

    // Load more products
    const loadMoreBtn = document.getElementById('loadMore');
    loadMoreBtn.addEventListener('click', () => {
        displayedProducts += 8;
        renderProducts(currentFilter);
    });

    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Giỏ hàng của bạn đang trống!');
            return;
        }
        
        // Check đăng nhập
        if (!isLoggedIn) {
            alert('Vui lòng đăng nhập để thanh toán!');
            // Redirect đến trang đăng nhập
            window.location.href = 'login.html';
            return;
        }
        
        // Nếu đã đăng nhập, tiếp tục thanh toán
        window.location.href = 'checkout/checkout.html';
    });

    // Contact form
    const contactForm = document.getElementById('contactForm');
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showNotification('Cảm ơn bạn! Chúng tôi sẽ liên hệ lại sớm nhất.');
        contactForm.reset();
    });

    // Newsletter form
    const newsletterForm = document.getElementById('newsletterForm');
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showNotification('Đăng ký nhận tin thành công!');
        newsletterForm.reset();
    });

    // Auth button
    const userBtn = document.getElementById('userBtn');
    const userDropdown = document.getElementById('userDropdown');

    if (userBtn && userDropdown) {
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Nếu chưa đăng nhập, chuyển tới trang login
            if (!isLoggedIn) {
                window.location.href = 'login.html';
                return;
            }
            
            // Toggle dropdown
            userBtn.classList.toggle('active');
            userDropdown.classList.toggle('active');
        });
    }

    // Đóng dropdown khi click bên ngoài
    document.addEventListener('click', (e) => {
        if (userBtn && userDropdown) {
            if (!userBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userBtn.classList.remove('active');
                userDropdown.classList.remove('active');
            }
        }
    });

    // Profile button
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'dropdown/profile/profile.html';
            userDropdown.classList.remove('active');
        });
    }

    // Orders button
    const ordersBtn = document.getElementById('ordersBtn');
    if (ordersBtn) {
        ordersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'dropdown/history/history.html';
            userDropdown.classList.remove('active');
        });
    }

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

// ====== SMOOTH SCROLL ======
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ====== SCROLL ANIMATIONS ======
function initScrollAnimations() {
    observeElements();
}

function observeElements() {
    const elements = document.querySelectorAll('.fade-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => observer.observe(el));
}

// ====== NOTIFICATIONS ======
function showNotification(message) {
    // Tạo notification element
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

    // Auto remove sau 3 giây
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
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

    .search-result-item {
        display: flex;
        gap: 16px;
        padding: 16px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .search-result-item:hover {
        background: #F5F1E8;
    }

    .search-results {
        margin-top: 10px;
    }
`;
document.head.appendChild(style);

// ====== UTILITY FUNCTIONS ======

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format date
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('vi-VN', options);
}

// Check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// ====== AUTH MANAGEMENT ======
async function initAuth() {
    const { data } = await supabaseClient.auth.getUser();

    if (!data?.user) {
        isLoggedIn = false;
        currentUser = null;
        updateUserUI();
        return;
    }

    const user = data.user;

    currentUser = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || 'Người dùng'
    };

    isLoggedIn = true;

    // Đồng bộ lại localStorage
    localStorage.setItem('teaUser', JSON.stringify(currentUser));

    updateUserUI();
}


function loginUser(userData) {
    currentUser = userData;
    isLoggedIn = true;
    localStorage.setItem('teaUser', JSON.stringify(userData));
    updateUserUI();
    showNotification('Đăng nhập thành công!');
}

function logoutUser() {
    currentUser = null;
    isLoggedIn = false;
    localStorage.removeItem('teaUser');
    updateUserUI();
    showNotification('Đã đăng xuất');
}

function updateUserUI() {
    const userBtn = document.getElementById('userBtn');
    if (!userBtn) return; // Exit if userBtn doesn't exist

    const userArrow = userBtn.querySelector('.user-arrow');
    const userName = document.getElementById('userName');
    
    if (isLoggedIn && currentUser) {
        // Hiển thị trạng thái đã đăng nhập
        userBtn.classList.add('logged-in');
        if (userArrow) userArrow.style.display = 'inline';
        
        // Cập nhật tên user
        if (userName) {
            userName.textContent = `Xin chào, ${currentUser.name || 'Người dùng'}`;
        }
    } else {
        // Trạng thái chưa đăng nhập
        userBtn.classList.remove('logged-in');
        if (userArrow) userArrow.style.display = 'none';
    }
}


// ====== CONSOLE LOG ======
console.log('%c🍃 TeaVerse Website', 'color: #2D5016; font-size: 20px; font-weight: bold;');
console.log('%cWebsite bán trà cao cấp - Thiết kế hiện đại, tối giản', 'color: #3A7D44; font-size: 14px;');
console.log('%cPhát triển bởi VAK', 'color: #6FBF73; font-size: 12px;');
// ====== PRODUCT DETAIL NAVIGATION ======
function goToProductDetail(productId) {
    // Map product IDs to their detail page URLs
    const productUrls = {
        1: 'products/tra-phu-hoi/index.html',
        2: 'products/tra-phu-hoi-vi-gung/index.html', // Tạm dùng cùng trang (sửa sau)
        3: 'products/goi-tra-phu-hoi/index.html',  // Tạm dùng cùng trang (sửa sau)
        4: 'products/tra-phu-hoi-100g/index.html'
    };
    
    const url = productUrls[productId];
    if (url) {
        window.location.href = url;
    } else {
        console.error(`Product URL not found for product ID: ${productId}`);
        // Fallback: đi đến trang đầu tiên
        window.location.href = 'products/tra-phu-hoi/index.html';
    }
}



let chatHistory = [];

// Lấy các phần tử DOM
const chatToggleBtn = document.getElementById('chatToggleBtn');
const chatBox = document.getElementById('chatBox');
const chatClose = document.getElementById('chatClose');
const chatInput = document.querySelector('.chat-input input');
const chatSendBtn = document.querySelector('.chat-input button');

// Khởi tạo chat với tin nhắn chào mừng
function initChatMessages() {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages && chatMessages.children.length === 0) {
        displayMessage('Chào Anh/Chị! Em là chuyên gia trà Phú Hội 🍃', false);
        displayMessage('Anh/Chị cần tư vấn gì về trà Phú Hội không ạ? 😊', false);
    }
}

// Lưu lịch sử hội thoại
let conversationHistory = [];

async function sendToModel(userMessage) {
    try {
        // Thêm tin nhắn user vào lịch sử
        // Prevent concurrent requests
        if (isRequestingAI) {
            return '⏳ Vui lòng chờ phản hồi trước khi gửi tin nhắn tiếp theo.';
        }

        conversationHistory.push({ role: 'user', content: userMessage });

        // Ensure we don't send overly long history: keep last 9 messages + system
        const historyToSend = conversationHistory.slice(-5);

        const payloadBase = {
            model: MODEL,
            messages: [ { role: 'system', content: SYSTEM_PROMPT }, ...historyToSend ],
            temperature: 0.4,
            max_tokens: 900,
            top_p: 0.95
        };

        const maxRetries = 3;
        let attempt = 0;
        let lastError = null;
        isRequestingAI = true;

        while (attempt < maxRetries) {
            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': window.location.href,
                        'X-Title': 'TeaVerse Chatbot'
                    },
                    body: JSON.stringify(payloadBase)
                });

                if (response.ok) {
                    const data = await response.json();
                    const aiResponse = data?.choices?.[0]?.message?.content || '';

                    // Lưu phản hồi vào lịch sử
                    conversationHistory.push({ role: 'assistant', content: aiResponse });

                    // Trim history
                    if (conversationHistory.length > 10) {
                        conversationHistory = conversationHistory.slice(-10);
                    }

                    isRequestingAI = false;
                    return aiResponse;
                }

                // Handle rate limiting by retrying with backoff
                if (response.status === 429) {
                    isRequestingAI = false;
                    return '⏳ Hệ thống đang quá tải. Anh/Chị vui lòng thử lại sau 10–20 giây nhé!';
                }


                // For other non-ok responses, try to extract message
                const errBody = await response.json().catch(() => ({}));
                throw new Error(errBody.error?.message || `API Error ${response.status}`);

            } catch (err) {
                lastError = err;
                // If we've exhausted retries, break
                attempt += 1;
                if (attempt >= maxRetries) break;
                const backoffMs = 500 * Math.pow(2, attempt);
                await new Promise(r => setTimeout(r, backoffMs));
            }
        }

        isRequestingAI = false;
        console.error('Gemma Error after retries:', lastError);
        return '😔 Em đang gặp chút vấn đề kỹ thuật hoặc đã vượt hạn mức yêu cầu. Vui lòng thử lại sau vài giây.';

    } catch (error) {
        console.error('Gemma Error (unexpected):', error);
        isRequestingAI = false;
        return '😔 Em đang gặp chút vấn đề kỹ thuật. Anh/chị có thể thử lại hoặc gọi cho em qua số 0798 130 810 nhé!';
    }
}

// Hiển thị tin nhắn trong chat
function displayMessage(message, isUser = false) {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) {
        console.error('displayMessage: .chat-messages container not found');
        return;
    }
    console.log('displayMessage', { isUser, message });
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'sent' : 'received'}`;
    
    // Xử lý format: **text** → <strong>text</strong>
    let formattedMessage = message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Text đậm
        .replace(/\n/g, '<br>'); // Xuống dòng
    
    messageDiv.innerHTML = `<p>${formattedMessage}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hiển thị typing indicator với animation động
function showTypingIndicator() {
    const chatMessages = document.querySelector('.chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message received typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
        <p class="typing-text">Đang suy nghĩ...</p>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Xóa typing indicator
function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

// (handler implementation moved later to ensure single definition)

// ===== EVENT LISTENERS CHO CHAT =====

// Mở/đóng chat box
if (chatToggleBtn) {
    chatToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chatBox.classList.toggle('active');
        chatToggleBtn.classList.toggle('active');
        
        // Khởi tạo tin nhắn chào nếu chưa có
        initChatMessages();
    });
}

// Đóng chat khi click nút close
if (chatClose) {
    chatClose.addEventListener('click', () => {
        chatBox.classList.remove('active');
        chatToggleBtn.classList.remove('active');
    });
}

// Đóng chat khi click bên ngoài
document.addEventListener('click', (e) => {
    if (chatBox && chatBox.classList.contains('active')) {
        if (!chatToggleBtn.contains(e.target) && !chatBox.contains(e.target)) {
            chatBox.classList.remove('active');
            chatToggleBtn.classList.remove('active');
        }
    }
});

// Event listeners cho gửi tin nhắn
if (chatSendBtn && chatInput) {
    chatSendBtn.addEventListener('click', handleSendMessage);
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage();
        }
    });
}

// Giới hạn độ dài tin nhắn
async function handleSendMessage() {
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Giới hạn 500 ký tự
    if (message.length > 500) {
        showNotification('Tin nhắn quá dài. Vui lòng rút ngắn lại ạ!');
        return;
    }
    
    console.log('handleSendMessage - user:', message);
    displayMessage(message, true);
    chatInput.value = '';
    chatInput.disabled = true; // Disable khi đang xử lý
    
    showTypingIndicator();
    
    const aiResponse = await sendToModel(message);
    console.log('handleSendMessage - aiResponse:', aiResponse);
    hideTypingIndicator();
    // Ensure we always show something
    const reply = (typeof aiResponse === 'string' && aiResponse.trim().length > 0)
        ? aiResponse
        : 'Xin lỗi, em chưa nhận được phản hồi. Vui lòng thử lại.';
    displayMessage(reply, false);
    
    chatInput.disabled = false;
    chatInput.focus();
}

// ====== BLOG PAGE SUPPORT ======
function isBlogPage() {
    return window.location.pathname.includes('/blog/');
}

// Modify smooth scroll for blog pages
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Nếu là link tới section trên trang chủ
            if (href.startsWith('#') && href.length > 1) {
                // Nếu đang ở trang blog, redirect về trang chủ
                if (isBlogPage()) {
                    window.location.href = '../../index.html' + href;
                    return;
                }
                
                // Nếu ở trang chủ, scroll bình thường
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}