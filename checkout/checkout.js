// ============================================
// CHECKOUT PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const changeAddressBtn = document.getElementById('changeAddressBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const orderNote = document.getElementById('orderNote');
    const paymentOptions = document.querySelectorAll('input[name="payment"]');
    const productsList = document.getElementById('productsList');

    // Load cart from localStorage (from main.js)
    let cart = [];
    let currentUser = null;
    let isLoggedIn = false;

    // Initialize
    init();

    async function init() {
        await initAuth();
        loadCartFromStorage();
        updatePaymentSubtitle();
        renderCartProducts();
        setupEventListeners();
    }

    // ====== AUTH ======
    async function initAuth() {
        // Check localStorage first
        const savedUser = localStorage.getItem('teaUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            isLoggedIn = true;
            updateAddressWithUserInfo();
        }

        // Check Supabase session
        if (typeof supabaseClient !== 'undefined') {
            try {
                const { data } = await supabaseClient.auth.getUser();
                if (data?.user) {
                    const user = data.user;
                    currentUser = {
                        id: user.id,
                        email: user.email,
                        name: user.user_metadata?.name || user.email.split('@')[0]
                    };
                    isLoggedIn = true;
                    localStorage.setItem('teaUser', JSON.stringify(currentUser));
                    updateAddressWithUserInfo();
                }
            } catch (error) {
                console.log('Auth check error:', error);
            }
        }

        // Redirect if not logged in
        if (!isLoggedIn) {
            showToast('Vui lòng đăng nhập để tiếp tục', 'error');
            setTimeout(() => {
                window.location.href = '../login.html';
            }, 2000);
        }
    }

    function updateAddressWithUserInfo() {
        if (currentUser) {
            const addressInfo = document.getElementById('addressInfo');
            addressInfo.innerHTML = `
                <div class="address-row">
                    <strong>${currentUser.name || 'Người dùng'}</strong>
                    <span class="phone">(+84) 123 456 789</span>
                </div>
                <p class="address-detail">123 Đường ABC, Phường XYZ, Quận 1, TP. Hồ Chí Minh</p>
            `;
        }
    }

    // ====== CART MANAGEMENT ======
    function loadCartFromStorage() {
        const savedCart = localStorage.getItem('teaCart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    }

    function renderCartProducts() {
        if (!productsList) return;

        if (cart.length === 0) {
            productsList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-shopping-cart" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>Giỏ hàng trống</p>
                </div>
            `;
            return;
        }

        productsList.innerHTML = cart.map(item => `
            <div class="product-item">
                <div class="product-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="product-details">
                    <h4 class="product-name">${item.name}</h4>
                    <p class="product-variant">Phân loại: ${item.category || 'Trà'}</p>
                    <div class="product-bottom">
                        <span class="product-quantity">x${item.quantity}</span>
                        <span class="product-price">${formatPrice(item.price)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        updateOrderSummary();
    }

    function updateOrderSummary() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = 30000;
        const discount = 30000;
        const total = subtotal + shipping - discount;

        // Update all summary sections
        document.querySelectorAll('.summary-row').forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes('tổng tiền hàng') || text.includes('tạm tính')) {
                row.querySelector('span:last-child').textContent = formatPrice(subtotal);
            } else if (text.includes('phí vận chuyển')) {
                row.querySelector('span:last-child').textContent = formatPrice(shipping);
            } else if (text.includes('giảm giá')) {
                row.querySelector('span:last-child').textContent = '-' + formatPrice(discount);
            }
        });

        document.querySelectorAll('.total-amount, .total-price').forEach(el => {
            el.textContent = formatPrice(total);
        });
    }

    function formatPrice(price) {
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    }

    // ====== EVENT LISTENERS ======
    function setupEventListeners() {
        if (changeAddressBtn) {
            changeAddressBtn.addEventListener('click', handleChangeAddress);
        }

        paymentOptions.forEach(option => {
            option.addEventListener('change', handlePaymentChange);
        });

        if (orderNote) {
            orderNote.addEventListener('input', function() {
                localStorage.setItem('orderNote', this.value);
            });
            // Load saved note
            const savedNote = localStorage.getItem('orderNote');
            if (savedNote) orderNote.value = savedNote;
        }

        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', handleCheckout);
        }
    }

    function handleChangeAddress() {
        showToast('Chức năng thay đổi địa chỉ đang được phát triển', 'info');
    }

    function handlePaymentChange(e) {
        console.log('Payment method:', e.target.value);
    }

    function updatePaymentSubtitle() {
        const subtitleEl = document.querySelector('.payment-subtitle');
        if (subtitleEl && cart.length > 0) {
            subtitleEl.textContent = `Đơn hàng đang chứa ${cart.length} sản phẩm`;
        }
    }

    // ====== CHECKOUT ======
    async function handleCheckout() {
        if (cart.length === 0) {
            showToast('Giỏ hàng trống!', 'error');
            return;
        }

        const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
        if (!paymentMethod) {
            showToast('Vui lòng chọn phương thức thanh toán', 'error');
            return;
        }

        // Show loading
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

        try {
            // Simulate processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Calculate order total
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const total = subtotal; // Đã trừ phí ship

            // Clear cart
            localStorage.removeItem('teaCart');
            localStorage.removeItem('orderNote');

            // Show success modal
            showSuccessModal(total);

        } catch (error) {
            console.error('Checkout error:', error);
            showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = '<i class="fas fa-lock"></i> Thanh toán ngay';
        }
    }

    // ====== SUCCESS MODAL ======
    function showSuccessModal(orderTotal) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'success-modal-overlay';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'success-modal';
        modal.innerHTML = `
            <div class="success-modal-content">
                <div class="success-icon-wrapper">
                    <div class="success-checkmark">
                        <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                            <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                            <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                        </svg>
                    </div>
                </div>
                
                <h2 class="success-title">Đặt hàng thành công!</h2>
                <p class="success-message">
                    Cảm ơn bạn đã đặt hàng tại shop của chúng tôi.<br>
                    Đơn hàng của bạn đang được xử lý.
                </p>
                
                <div class="order-info">
                    <div class="order-info-item">
                        <span class="label">Mã đơn hàng:</span>
                        <span class="value">#${Date.now().toString().slice(-8)}</span>
                    </div>
                    <div class="order-info-item">
                        <span class="label">Tổng tiền:</span>
                        <span class="value highlight">${formatPrice(orderTotal)}</span>
                    </div>
                    <div class="order-info-item">
                        <span class="label">Phương thức:</span>
                        <span class="value">${getPaymentMethodName()}</span>
                    </div>
                </div>
                
                <div class="success-actions">
                    <button class="btn-view-order" id="viewOrderBtn">
                        <i class="fas fa-receipt"></i>
                        Xem đơn hàng
                    </button>
                    <button class="btn-continue-shopping" id="continueShoppingBtn">
                        <i class="fas fa-shopping-bag"></i>
                        Tiếp tục mua hàng
                    </button>
                </div>
            </div>
        `;
        
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Trigger animations
        setTimeout(() => {
            modalOverlay.classList.add('show');
            modal.classList.add('show');
        }, 10);
        
        // Event listeners
        document.getElementById('viewOrderBtn').addEventListener('click', () => {
            window.location.href = 'dropdown/history/history.html';
        });
        
        document.getElementById('continueShoppingBtn').addEventListener('click', () => {
            window.location.href = '../index.html';
        });
        
        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeSuccessModal(modalOverlay);
            }
        });
    }

    function getPaymentMethodName() {
        const selected = document.querySelector('input[name="payment"]:checked');
        if (!selected) return 'Không xác định';
        
        const methodNames = {
            'vietqr': 'VietQR',
            'credit-card': 'Thẻ tín dụng',
            'cod': 'Thanh toán khi nhận hàng'
        };
        
        return methodNames[selected.value] || 'Không xác định';
    }

    function closeSuccessModal(modalOverlay) {
        modalOverlay.classList.remove('show');
        setTimeout(() => {
            modalOverlay.remove();
            document.body.style.overflow = 'auto';
        }, 300);
    }

    // ====== TOAST NOTIFICATION ======
    function showToast(message, type = 'success') {
        // Remove existing toasts
        document.querySelectorAll('.toast-notification').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                     type === 'error' ? 'exclamation-circle' : 'info-circle';
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(toast);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('toast-hide');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);

        // Trigger animation
        setTimeout(() => toast.classList.add('toast-show'), 10);
    }

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
        /* TOAST STYLES (cho error messages) */
        .toast-notification {
            position: fixed;
            top: 100px;
            right: -400px;
            min-width: 320px;
            max-width: 400px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px 20px;
            z-index: 10000;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .toast-notification.toast-show {
            right: 24px;
        }

        .toast-notification.toast-hide {
            right: -400px;
            opacity: 0;
        }

        .toast-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 20px;
        }

        .toast-error .toast-icon {
            background: #FFEBEE;
            color: #C62828;
        }

        .toast-info .toast-icon {
            background: #E3F2FD;
            color: #1976D2;
        }

        .toast-content {
            flex: 1;
        }

        .toast-message {
            font-size: 15px;
            font-weight: 500;
            color: #1A1A1A;
            line-height: 1.5;
        }

        .toast-close {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: transparent;
            border: none;
            color: #999;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            flex-shrink: 0;
        }

        .toast-close:hover {
            background: #F5F5F5;
            color: #666;
        }

        /* SUCCESS MODAL STYLES */
        .success-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            opacity: 0;
            transition: opacity 0.3s ease;
            padding: 20px;
        }

        .success-modal-overlay.show {
            opacity: 1;
        }

        .success-modal {
            background: white;
            border-radius: 20px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            transform: scale(0.7);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .success-modal.show {
            transform: scale(1);
            opacity: 1;
        }

        .success-modal-content {
            padding: 40px 32px;
            text-align: center;
        }

        /* Success Icon Animation */
        .success-icon-wrapper {
            margin-bottom: 24px;
        }

        .success-checkmark {
            width: 80px;
            height: 80px;
            margin: 0 auto;
        }

        .checkmark {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: block;
            stroke-width: 3;
            stroke: #2D5016;
            stroke-miterlimit: 10;
            box-shadow: inset 0px 0px 0px #2D5016;
            animation: fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both;
        }

        .checkmark-circle {
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            stroke-width: 3;
            stroke-miterlimit: 10;
            stroke: #2D5016;
            fill: none;
            animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }

        .checkmark-check {
            transform-origin: 50% 50%;
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            stroke: #2D5016;
            stroke-width: 3;
            animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }

        @keyframes stroke {
            100% {
                stroke-dashoffset: 0;
            }
        }

        @keyframes scale {
            0%, 100% {
                transform: none;
            }
            50% {
                transform: scale3d(1.1, 1.1, 1);
            }
        }

        @keyframes fill {
            100% {
                box-shadow: inset 0px 0px 0px 30px #E8F5E9;
            }
        }

        /* Modal Content */
        .success-title {
            font-size: 28px;
            font-weight: 700;
            color: #2D5016;
            margin-bottom: 12px;
            font-family: 'Playfair Display', serif;
        }

        .success-message {
            font-size: 16px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 32px;
        }

        .order-info {
            background: #F5F1E8;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 32px;
        }

        .order-info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .order-info-item:last-child {
            border-bottom: none;
        }

        .order-info-item .label {
            font-size: 14px;
            color: #666;
        }

        .order-info-item .value {
            font-size: 15px;
            font-weight: 600;
            color: #1A1A1A;
        }

        .order-info-item .value.highlight {
            font-size: 18px;
            color: #2D5016;
        }

        .success-actions {
            display: flex;
            gap: 12px;
            flex-direction: column;
        }

        .btn-view-order,
        .btn-continue-shopping {
            padding: 14px 28px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            border: none;
            width: 100%;
        }

        .btn-view-order {
            background: linear-gradient(135deg, #2D5016 0%, #3A7D44 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(45, 80, 22, 0.3);
        }

        .btn-view-order:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(45, 80, 22, 0.4);
        }

        .btn-continue-shopping {
            background: white;
            color: #2D5016;
            border: 2px solid #2D5016;
        }

        .btn-continue-shopping:hover {
            background: #F5F1E8;
        }

        /* Responsive */
        @media (max-width: 480px) {
            .success-modal-content {
                padding: 32px 24px;
            }

            .success-title {
                font-size: 24px;
            }

            .success-message {
                font-size: 14px;
            }

            .success-checkmark {
                width: 60px;
                height: 60px;
            }

            .checkmark {
                width: 60px;
                height: 60px;
            }

            .toast-notification {
                min-width: calc(100vw - 32px);
                max-width: calc(100vw - 32px);
                right: -100%;
            }
            
            .toast-notification.toast-show {
                right: 16px;
            }
        }
    `;
    document.head.appendChild(styles);
});