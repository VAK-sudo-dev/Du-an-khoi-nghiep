// ============================================
// ORDER HISTORY PAGE - JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // ====== SUPABASE CONFIG ======
    const SUPABASE_URL = 'https://xcrkjlbwcuudunkgzwcd.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcmtqbGJ3Y3V1ZHVua2d6d2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzEzNzcsImV4cCI6MjA4NjA0NzM3N30.GzKI8QesLlfjwDZA_InKeVrfAr7jqnkdNFd4QX-yGaI';

    const supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

    // ====== GLOBAL STATE ======
    let currentUser = null;
    let isLoggedIn = false;

    // Get current user email
    let currentUserEmail = null;

    // ====== AUTH INITIALIZATION ======
    async function initAuth() {
        // Đọc từ localStorage thay vì Supabase
        const userDataString = localStorage.getItem('teaUser');
        
        if (!userDataString) {
            isLoggedIn = false;
            currentUser = null;
            updateUserUI();
            showLoginPrompt();
            return null;
        }
        
        try {
            currentUser = JSON.parse(userDataString);
            isLoggedIn = true;
            currentUserEmail = currentUser.email;
            updateUserUI();
            return currentUser;
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('teaUser');
            isLoggedIn = false;
            currentUser = null;
            showLoginPrompt();
            return null;
        }
    }

    function updateUserUI() {
        const userBtn = document.getElementById('userBtn');
        const userNameElement = document.querySelector('.user-name');
        
        // Hiển thị tên user nếu đã đăng nhập
        if (userNameElement && currentUser) {
            userNameElement.textContent = currentUser.name || currentUser.email || 'User';
        }
        
        if (userBtn) {
            userBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Nếu chưa đăng nhập, chuyển tới trang login
                if (!isLoggedIn) {
                    window.location.href = '../../login.html';
                    return;
                }
                
                // Toggle dropdown
                const userDropdown = document.getElementById('userDropdown');
                if (userDropdown) {
                    userDropdown.classList.toggle('active');
                }
            });
        }
    }
    
    function logoutUser() {
        currentUser = null;
        isLoggedIn = false;
        currentUserEmail = null;
        localStorage.removeItem('teaUser');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('teaCart');
        
        // Redirect về trang chủ
        window.location.href = '../../index.html';
    }
    
    // ====== INITIALIZATION ======
    async function init() {
        console.log('=== DEBUG START ===');
        const authenticated = await initAuth();
        console.log('User authenticated:', authenticated);
        console.log('Current user email:', currentUserEmail);
        console.log('=== DEBUG END ===');
        
        // Only load orders if authenticated
        if (authenticated) {
            await loadOrders();
        }
        
        // Setup event listeners regardless
        setupFilterButtons();
        setupSearchBox();
        setupHeaderActions();
    }

    function showLoginPrompt() {
        const container = document.getElementById('ordersContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (container) container.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <h3>Vui lòng đăng nhập</h3>
                <p>Bạn cần đăng nhập để xem lịch sử đơn hàng</p>
                <a href="../../login.html" class="btn btn-primary" style="display: inline-block; margin-top: 20px;">Đăng nhập ngay</a>
            `;
        }
    
    }

    // ====== SUPABASE FUNCTIONS ======
    async function fetchOrders() {
        // Kiểm tra user đã đăng nhập chưa
        if (!currentUserEmail) {
            console.error('❌ No user email found');
            return [];
        }

        console.log('🔍 Fetching orders for:', currentUserEmail);

        const { data, error } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('email', currentUserEmail)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching orders:', error);
            return [];
        }

        console.log('✅ Orders fetched:', data);
        return data || [];
    }

    
    async function filterOrdersByStatus(status) {
        if (!currentUserEmail) {
            console.error('❌ No user email found');
            return [];
        }

        console.log('🔍 Filtering orders by status:', status);

        let query = supabaseClient
            .from('orders')
            .select('*')
            .eq('email', currentUserEmail);

        if (status !== 'all') {
            query = query.eq('order_status', status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error filtering orders:', error);
            return [];
        }

        console.log('✅ Filtered orders:', data);
        return data || [];
    }

    
    async function searchOrders(searchTerm) {
        if (!currentUserEmail) {
            console.error('❌ No user email found');
            return [];
        }

        console.log('🔍 Searching orders:', searchTerm);

        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select('*')
                .eq('email', currentUserEmail)
                .or(`order_code.ilike.%${searchTerm}%,product_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            console.log('✅ Search results:', data);
            return data || [];
        } catch (error) {
            console.error('❌ Error searching orders:', error);
            return [];
        }
    }
    
    // ====== RENDER FUNCTIONS ======
    
    function renderOrders(orders) {
        const container = document.getElementById('ordersContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (!container) return;
        
        // Show/hide empty state
        if (orders.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        container.style.display = 'block';
        emptyState.style.display = 'none';
        
        // Render desktop table
        const tableHTML = `
            <div class="orders-table">
                <div class="table-header">
                    <span>Mã đơn</span>
                    <span>Ngày đặt</span>
                    <span>Sản phẩm</span>
                    <span>Trạng thái</span>
                    <span>Thanh toán</span>
                    <span>Tổng tiền</span>
                    <span>Thao tác</span>
                </div>
                <div class="table-body">
                    ${orders.map(order => `
                        <div class="order-row">
                            <div class="order-id">#${order.order_code}</div>
                            <div class="order-date">${formatDate(order.created_at)}</div>
                            <div class="product-name">${truncateText(order.product_name, 50)}</div>
                            <div>
                                <span class="status-badge status-${order.order_status}">
                                    ${getStatusText(order.order_status)}
                                </span>
                            </div>
                            <div class="payment-info">
                                <div style="margin-bottom: 4px;">
                                    <strong style="font-size: 0.85rem;">${order.payment_method}</strong>
                                </div>
                                <span class="status-badge ${getPaymentStatusClass(order.payment_status)}" style="font-size: 0.75rem;">
                                    ${getPaymentStatusText(order.payment_status)}
                                </span>
                            </div>
                            <div class="order-total">${formatCurrency(order.total_amount)}</div>
                            <div>
                                ${order.tracking_link ? 
                                    `<a href="${order.tracking_link}" target="_blank" class="track-btn">Theo dõi</a>` :
                                    '<span style="color: #999; font-size: 0.85rem;">-</span>'
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Render mobile cards
        const cardsHTML = `
            <div class="mobile-orders">
                ${orders.map(order => `
                    <div class="order-card">
                        <div class="order-card-header">
                            <span class="order-id">#${order.order_code}</span>
                            <span class="status-badge status-${order.order_status}">
                                ${getStatusText(order.order_status)}
                            </span>
                        </div>
                        <div class="order-card-body">
                            <div class="order-info-row">
                                <span class="info-label">Sản phẩm:</span>
                                <span class="info-value">${truncateText(order.product_name, 30)}</span>
                            </div>
                            <div class="order-info-row">
                                <span class="info-label">Ngày đặt:</span>
                                <span class="info-value">${formatDate(order.created_at)}</span>
                            </div>
                            <div class="order-info-row">
                                <span class="info-label">Thanh toán:</span>
                                <span class="info-value">${order.payment_method}</span>
                            </div>
                            <div class="order-info-row">
                                <span class="info-label">TT thanh toán:</span>
                                <span class="status-badge ${getPaymentStatusClass(order.payment_status)}" style="font-size: 0.75rem; padding: 4px 10px;">
                                    ${getPaymentStatusText(order.payment_status)}
                                </span>
                            </div>
                            <div class="order-info-row">
                                <span class="info-label">Tổng tiền:</span>
                                <span class="info-value order-total">${formatCurrency(order.total_amount)}</span>
                            </div>
                            ${order.tracking_link ? 
                                `<a href="${order.tracking_link}" target="_blank" class="track-btn" style="margin-top: 10px;">Theo dõi đơn hàng</a>` :
                                ''
                            }
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = tableHTML + cardsHTML;
    }
    
    // ====== HELPER FUNCTIONS ======
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
    
    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }
    
    function getStatusText(status) {
        const statusMap = {
            'pending': 'Chờ xử lý',
            'shipping': 'Đang giao',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy'
        };
        return statusMap[status] || status;
    }
    
    function getPaymentStatusText(status) {
        const statusMap = {
            'pending': 'Chờ thanh toán',
            'paid': 'Đã thanh toán',
            'failed': 'Thất bại',
            'refunded': 'Đã hoàn tiền'
        };
        return statusMap[status] || status;
    }
    
    function getPaymentStatusClass(status) {
        const classMap = {
            'pending': 'status-pending',
            'paid': 'status-completed',
            'failed': 'status-cancelled',
            'refunded': 'status-shipping'
        };
        return classMap[status] || 'status-pending';
    }
    
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    // ====== EVENT HANDLERS ======
    
    async function loadOrders() {
        const user = await initAuth();
        if (!user) return;

        const orders = await fetchOrders();
        renderOrders(orders);
    }

    
    function setupFilterButtons() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', async function() {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Filter orders
                const status = this.dataset.status;
                const orders = await filterOrdersByStatus(status);
                renderOrders(orders);
            });
        });
    }
    
    function setupSearchBox() {
        const searchInput = document.querySelector('.search-box input');
        
        if (searchInput) {
            // Debounce search
            let searchTimeout;
            
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                
                searchTimeout = setTimeout(async () => {
                    const searchTerm = this.value.trim();
                    
                    if (searchTerm === '') {
                        await loadOrders();
                    } else {
                        const orders = await searchOrders(currentUserEmail, searchTerm);
                        renderOrders(orders);
                    }
                }, 500); // Wait 500ms after user stops typing
            });
        }
    }

    // ====== HEADER ACTIONS ======
    function setupHeaderActions() {
        // Cart functionality
        const cartBtn = document.getElementById('cartBtn');
        const cartOverlay = document.getElementById('cartOverlay');
        const cartSidebar = document.getElementById('cartSidebar');
        const cartClose = document.getElementById('cartClose');
        
        if (cartBtn) {
            cartBtn.addEventListener('click', function() {
                if (cartSidebar) cartSidebar.classList.add('active');
                if (cartOverlay) cartOverlay.classList.add('active');
                loadCartItems();
            });
        }
        
        if (cartClose) {
            cartClose.addEventListener('click', closeCart);
        }
        
        if (cartOverlay) {
            cartOverlay.addEventListener('click', closeCart);
        }
        
        function closeCart() {
            if (cartSidebar) cartSidebar.classList.remove('active');
            if (cartOverlay) cartOverlay.classList.remove('active');
        }
        
        // Load cart items from localStorage
        function loadCartItems() {
            const cartItemsContainer = document.getElementById('cartItems');
            const cartTotal = document.getElementById('cartTotal');
            const cartCount = document.getElementById('cartCount');
            
            if (!cartItemsContainer) return;
            
            const savedCart = localStorage.getItem('teaCart');
            const cart = savedCart ? JSON.parse(savedCart) : [];
            
            // Update cart count
            if (cartCount) {
                const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
                cartCount.textContent = totalItems;
                cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
            }
            
            if (cart.length === 0) {
                cartItemsContainer.innerHTML = `
                    <div class="cart-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                        </svg>
                        <p>Giỏ hàng trống</p>
                    </div>
                `;
                if (cartTotal) cartTotal.textContent = '0đ';
                return;
            }
            
            // Render cart items
            let total = 0;
            cartItemsContainer.innerHTML = cart.map(item => {
                total += item.price * item.quantity;
                return `
                    <div class="cart-item">
                        <div class="cart-item-image">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="cart-item-details">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-price">${formatCurrency(item.price)}</div>
                        </div>
                    </div>
                `;
            }).join('');
            
            if (cartTotal) {
                cartTotal.textContent = formatCurrency(total);
            }
        }
        
        // User dropdown
        const userBtn = document.getElementById('userBtn');
        const userDropdown = document.getElementById('userDropdown');
        const logoutBtn = document.querySelector('.logout-item');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                logoutUser();
            });
        }
        const profileBtn = document.getElementById('profileBtn');
        const ordersBtn = document.getElementById('ordersBtn');
        
        if (userBtn) {
            userBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Nếu chưa đăng nhập, redirect đến login
                if (!isLoggedIn) {
                    window.location.href = '../../login.html';
                    return;
                }
                
                // Toggle dropdown
                if (userDropdown) {
                    userDropdown.classList.toggle('active');
                }
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (userDropdown && userBtn) {
                if (!userBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('active');
                }
            }
        });
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                logoutUser();
            });
        }
        
        if (profileBtn) {
            profileBtn.addEventListener('click', function(e) {
                e.preventDefault();
                alert('Chức năng hồ sơ đang được phát triển');
                if (userDropdown) userDropdown.classList.remove('active');
            });
        }
        
        if (ordersBtn) {
            ordersBtn.addEventListener('click', function(e) {
                e.preventDefault();
                // Already on orders page
                if (userDropdown) userDropdown.classList.remove('active');
            });
        }
        
        // Search modal
        const searchBtn = document.querySelector('.search-btn');
        const searchModal = document.getElementById('searchModal');
        const searchClose = document.getElementById('searchClose');
        const searchInput = document.getElementById('searchInput');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', function() {
                if (searchModal) searchModal.classList.add('active');
                setTimeout(() => searchInput?.focus(), 300);
            });
        }
        
        if (searchClose) {
            searchClose.addEventListener('click', function() {
                if (searchModal) searchModal.classList.remove('active');
            });
        }
        
        if (searchModal) {
            searchModal.addEventListener('click', function(e) {
                if (e.target === searchModal) {
                    searchModal.classList.remove('active');
                }
            });
        }
        
        // Hamburger menu
        const hamburger = document.getElementById('hamburger');
        const nav = document.getElementById('nav');
        
        if (hamburger) {
            hamburger.addEventListener('click', function() {
                hamburger.classList.toggle('active');
                if (nav) nav.classList.toggle('active');
            });
        }
        
        // Checkout button in cart
        const checkoutBtnInCart = document.querySelector('.cart-sidebar .btn-checkout');
        if (checkoutBtnInCart) {
            checkoutBtnInCart.addEventListener('click', function() {
                const savedCart = localStorage.getItem('teaCart');
                const cart = savedCart ? JSON.parse(savedCart) : [];
                
                if (cart.length === 0) {
                    alert('Giỏ hàng trống!');
                    return;
                }
                
                if (!isLoggedIn) {
                    alert('Vui lòng đăng nhập để thanh toán!');
                    window.location.href = '../../login.html';
                    return;
                }
                
                window.location.href = '../checkout/checkout.html';
            });
        }
    }
    
    // Initialize everything
    init();
});