/* ========================================
   AUTH SYSTEM - JAVASCRIPT (Phiên bản cải tiến)
   Quản lý đăng nhập, đăng ký với LocalStorage/JSON
======================================== */

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    // Chế độ lưu trữ: 'localStorage' hoặc 'json'
    storageMode: 'localStorage', // Đổi thành 'json' khi có backend
    apiEndpoint: '/api/auth', // Endpoint cho chế độ JSON
    dataPath: './data/users.json' // Đường dẫn file JSON
};

// ========================================
// UTILITIES & HELPERS
// ========================================

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password strength
const isValidPassword = (password) => {
    return password.length >= 8;
};

// Show error message
const showError = (input, message) => {
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');
    
    input.classList.add('error');
    errorElement.textContent = message;
    errorElement.classList.add('show');
};

// Clear error message
const clearError = (input) => {
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');
    
    input.classList.remove('error');
    errorElement.textContent = '';
    errorElement.classList.remove('show');
};

// Show loading state on button
const setButtonLoading = (button, isLoading) => {
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
};

// ========================================
// TOAST NOTIFICATION SYSTEM
// ========================================

const Toast = {
    container: null,
    
    // Khởi tạo container cho toast
    init: () => {
        if (!Toast.container) {
            Toast.container = document.createElement('div');
            Toast.container.id = 'toast-container';
            Toast.container.className = 'toast-container';
            document.body.appendChild(Toast.container);
        }
    },
    
    // Hiển thị toast thông báo
    show: (message, type = 'success', duration = 3000) => {
        Toast.init();
        
        // Tạo toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Icon theo loại
        const icons = {
            success: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                        <path d="M16.6667 5L7.5 14.1667L3.33333 10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>`,
            error: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <circle cx="10" cy="10" r="8" stroke-width="2"/>
                      <path d="M10 6V10M10 14H10.01" stroke-width="2" stroke-linecap="round"/>
                    </svg>`,
            warning: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                        <path d="M10 3L17.3205 16H2.67949L10 3Z" stroke-width="2" stroke-linejoin="round"/>
                        <path d="M10 8V11M10 14H10.01" stroke-width="2" stroke-linecap="round"/>
                      </svg>`,
            info: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                     <circle cx="10" cy="10" r="8" stroke-width="2"/>
                     <path d="M10 10V14M10 6H10.01" stroke-width="2" stroke-linecap="round"/>
                   </svg>`
        };
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                    <path d="M4 4L12 12M12 4L4 12" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        `;
        
        // Thêm vào container
        Toast.container.appendChild(toast);
        
        // Animation hiển thị
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Tự động ẩn sau duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    },
    
    // Shortcuts
    success: (message, duration) => Toast.show(message, 'success', duration),
    error: (message, duration) => Toast.show(message, 'error', duration),
    warning: (message, duration) => Toast.show(message, 'warning', duration),
    info: (message, duration) => Toast.show(message, 'info', duration)
};

// ========================================
// STORAGE ABSTRACTION LAYER
// ========================================

const Storage = {
    // ===== LocalStorage Methods =====
    
    _getFromLocalStorage: () => {
        const users = localStorage.getItem('auth_users');
        return users ? JSON.parse(users) : [];
    },
    
    _saveToLocalStorage: (users) => {
        localStorage.setItem('auth_users', JSON.stringify(users));
    },
    
    _findUserInLocalStorage: (email) => {
        const users = Storage._getFromLocalStorage();
        return users.find(user => user.email.toLowerCase() === email.toLowerCase());
    },
    
    _addUserToLocalStorage: (user) => {
        const users = Storage._getFromLocalStorage();
        users.push(user);
        Storage._saveToLocalStorage(users);
    },
    
    // ===== JSON File Methods =====
    
    _getFromJSON: async () => {
        try {
            const response = await fetch(`${CONFIG.apiEndpoint}/users`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Không thể tải dữ liệu người dùng');
            }
            
            const data = await response.json();
            return data.users || [];
        } catch (error) {
            console.error('❌ Lỗi đọc file JSON:', error);
            Toast.error('Không thể kết nối đến server');
            return [];
        }
    },
    
    _saveToJSON: async (users) => {
        try {
            const response = await fetch(`${CONFIG.apiEndpoint}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ users })
            });
            
            if (!response.ok) {
                throw new Error('Không thể lưu dữ liệu');
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ Lỗi ghi file JSON:', error);
            Toast.error('Không thể lưu dữ liệu');
            throw error;
        }
    },
    
    _findUserInJSON: async (email) => {
        try {
            const response = await fetch(`${CONFIG.apiEndpoint}/find-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            if (!response.ok) {
                return null;
            }
            
            const data = await response.json();
            return data.user || null;
        } catch (error) {
            console.error('❌ Lỗi tìm user:', error);
            return null;
        }
    },
    
    _addUserToJSON: async (user) => {
        try {
            const response = await fetch(`${CONFIG.apiEndpoint}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(user)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Không thể đăng ký');
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ Lỗi thêm user:', error);
            throw error;
        }
    },
    
    // ===== Unified Interface =====
    
    // Lấy tất cả users
    getUsers: async () => {
        if (CONFIG.storageMode === 'localStorage') {
            return Storage._getFromLocalStorage();
        } else {
            return await Storage._getFromJSON();
        }
    },
    
    // Lưu user mới
    saveUser: async (user) => {
        if (CONFIG.storageMode === 'localStorage') {
            Storage._addUserToLocalStorage(user);
            return { success: true };
        } else {
            return await Storage._addUserToJSON(user);
        }
    },
    
    // Tìm user theo email
    findUserByEmail: async (email) => {
        if (CONFIG.storageMode === 'localStorage') {
            return Storage._findUserInLocalStorage(email);
        } else {
            return await Storage._findUserInJSON(email);
        }
    },
    
    // Lưu user hiện tại (luôn dùng localStorage để giữ session)
    setCurrentUser: (user) => {
        localStorage.setItem('current_user', JSON.stringify(user));
    },
    
    // Lấy user hiện tại
    getCurrentUser: () => {
        const user = localStorage.getItem('current_user');
        return user ? JSON.parse(user) : null;
    },
    
    // Đăng xuất
    logout: () => {
        localStorage.removeItem('current_user');
        Toast.info('Đã đăng xuất thành công');
    }
};

// ========================================
// FORM SWITCHING
// ========================================

const FormSwitcher = {
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    successMessage: document.getElementById('successMessage'),
    
    // Switch to login form
    showLogin: () => {
        FormSwitcher.loginForm.classList.remove('hidden');
        FormSwitcher.registerForm.classList.add('hidden');
        FormSwitcher.successMessage.classList.add('hidden');
        
        // Reset forms
        document.getElementById('login-form').reset();
        FormSwitcher.clearAllErrors();
    },
    
    // Switch to register form
    showRegister: () => {
        FormSwitcher.registerForm.classList.remove('hidden');
        FormSwitcher.loginForm.classList.add('hidden');
        FormSwitcher.successMessage.classList.add('hidden');
        
        // Reset forms
        document.getElementById('register-form').reset();
        FormSwitcher.clearAllErrors();
    },
    
    // Show success message
    showSuccess: (message) => {
        FormSwitcher.successMessage.classList.remove('hidden');
        FormSwitcher.loginForm.classList.add('hidden');
        FormSwitcher.registerForm.classList.add('hidden');
        
        const successText = FormSwitcher.successMessage.querySelector('.success-text');
        successText.textContent = message;
        
        // Chuyển thẳng vào trang web bán hàng sau 2 giây
        setTimeout(() => {
            // Thay đổi 'index.html' thành tên file trang chủ của bạn
            window.location.href = 'index.html';
        }, 2000);
    },
    
    // Clear all error messages
    clearAllErrors: () => {
        const allInputs = document.querySelectorAll('.form-input');
        allInputs.forEach(input => clearError(input));
    }
};

// ========================================
// PASSWORD TOGGLE
// ========================================

const initPasswordToggle = () => {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                button.innerHTML = `
                    <svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            } else {
                passwordInput.type = 'password';
                button.innerHTML = `
                    <svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        });
    });
};

// ========================================
// LOGIN HANDLER
// ========================================

const LoginHandler = {
    form: document.getElementById('login-form'),
    emailInput: document.getElementById('login-email'),
    passwordInput: document.getElementById('login-password'),
    
    // Validate login form
    validate: () => {
        let isValid = true;
        
        // Validate email
        const email = LoginHandler.emailInput.value.trim();
        if (!email) {
            showError(LoginHandler.emailInput, 'Vui lòng nhập email');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showError(LoginHandler.emailInput, 'Email không hợp lệ');
            isValid = false;
        } else {
            clearError(LoginHandler.emailInput);
        }
        
        // Validate password
        const password = LoginHandler.passwordInput.value;
        if (!password) {
            showError(LoginHandler.passwordInput, 'Vui lòng nhập mật khẩu');
            isValid = false;
        } else {
            clearError(LoginHandler.passwordInput);
        }
        
        return isValid;
    },
    
    // Handle login submission
    submit: async (e) => {
        e.preventDefault();
        
        if (!LoginHandler.validate()) {
            return;
        }
        
        const submitButton = LoginHandler.form.querySelector('.btn-primary');
        setButtonLoading(submitButton, true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const email = LoginHandler.emailInput.value.trim();
        const password = LoginHandler.passwordInput.value;
        
        try {
            // Tìm user
            const user = await Storage.findUserByEmail(email);
            
            if (!user) {
                setButtonLoading(submitButton, false);
                showError(LoginHandler.emailInput, 'Email chưa được đăng ký');
                Toast.error('Email chưa được đăng ký');
                return;
            }
            
            // Kiểm tra mật khẩu
            if (user.password !== password) {
                setButtonLoading(submitButton, false);
                showError(LoginHandler.passwordInput, 'Mật khẩu không chính xác');
                Toast.error('Mật khẩu không chính xác');
                return;
            }
            
            // Đăng nhập thành công
            Storage.setCurrentUser(user);
            setButtonLoading(submitButton, false);
            
            // Hiển thị thông báo thành công
            Toast.success(`Chào mừng trở lại, ${user.name}! 🎉`, 4000);
            
            // Hiển thị màn hình success
            FormSwitcher.showSuccess(`Đăng nhập thành công! Chào mừng trở lại, ${user.name}! 🌿`);
            
            console.log('✅ Đăng nhập thành công:', user);
            
            // Lưu thông tin user vào teaUser để main.js đọc được
            localStorage.setItem('teaUser', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email
            }));

            // Redirect về trang chủ sau 1.5 giây
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
        } catch (error) {
            console.error('❌ Lỗi đăng nhập:', error);
            setButtonLoading(submitButton, false);
            Toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
        }
    }

    
};

// ========================================
// REGISTER HANDLER
// ========================================

const RegisterHandler = {
    form: document.getElementById('register-form'),
    nameInput: document.getElementById('register-name'),
    emailInput: document.getElementById('register-email'),
    passwordInput: document.getElementById('register-password'),
    confirmPasswordInput: document.getElementById('register-confirm-password'),
    
    // Validate register form
    validate: async () => {
        let isValid = true;
        
        // Validate name
        const name = RegisterHandler.nameInput.value.trim();
        if (!name) {
            showError(RegisterHandler.nameInput, 'Vui lòng nhập họ tên');
            isValid = false;
        } else if (name.length < 2) {
            showError(RegisterHandler.nameInput, 'Họ tên quá ngắn');
            isValid = false;
        } else {
            clearError(RegisterHandler.nameInput);
        }
        
        // Validate email
        const email = RegisterHandler.emailInput.value.trim();
        if (!email) {
            showError(RegisterHandler.emailInput, 'Vui lòng nhập email');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showError(RegisterHandler.emailInput, 'Email không hợp lệ');
            isValid = false;
        } else {
            // Kiểm tra email đã tồn tại
            const existingUser = await Storage.findUserByEmail(email);
            if (existingUser) {
                showError(RegisterHandler.emailInput, 'Email đã được đăng ký');
                isValid = false;
            } else {
                clearError(RegisterHandler.emailInput);
            }
        }
        
        // Validate password
        const password = RegisterHandler.passwordInput.value;
        if (!password) {
            showError(RegisterHandler.passwordInput, 'Vui lòng nhập mật khẩu');
            isValid = false;
        } else if (!isValidPassword(password)) {
            showError(RegisterHandler.passwordInput, 'Mật khẩu phải có ít nhất 8 ký tự');
            isValid = false;
        } else {
            clearError(RegisterHandler.passwordInput);
        }
        
        // Validate confirm password
        const confirmPassword = RegisterHandler.confirmPasswordInput.value;
        if (!confirmPassword) {
            showError(RegisterHandler.confirmPasswordInput, 'Vui lòng xác nhận mật khẩu');
            isValid = false;
        } else if (password !== confirmPassword) {
            showError(RegisterHandler.confirmPasswordInput, 'Mật khẩu không khớp');
            isValid = false;
        } else {
            clearError(RegisterHandler.confirmPasswordInput);
        }
        
        return isValid;
    },
    
    // Handle register submission
    submit: async (e) => {
        e.preventDefault();
        
        const isValid = await RegisterHandler.validate();
        if (!isValid) {
            return;
        }
        
        const submitButton = RegisterHandler.form.querySelector('.btn-primary');
        setButtonLoading(submitButton, true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const newUser = {
            id: Date.now().toString(),
            name: RegisterHandler.nameInput.value.trim(),
            email: RegisterHandler.emailInput.value.trim().toLowerCase(),
            password: RegisterHandler.passwordInput.value,
            createdAt: new Date().toISOString()
        };
        
        try {
            // Lưu user
            await Storage.saveUser(newUser);
            
            setButtonLoading(submitButton, false);
            
            // Hiển thị thông báo thành công
            Toast.success(`Đăng ký thành công! Chào mừng ${newUser.name} 🎉`, 4000);
            
            // Hiển thị màn hình success
            FormSwitcher.showSuccess(
                `Tài khoản của bạn đã được tạo thành công! Chào mừng ${newUser.name} đến với Green Tea 🌿`
            );
            
            console.log('✅ Đăng ký thành công:', newUser);
            console.log(`📁 Dữ liệu đã được lưu vào: ${CONFIG.dataPath}`);
            
        } catch (error) {
            console.error('❌ Lỗi đăng ký:', error);
            setButtonLoading(submitButton, false);
            Toast.error(error.message || 'Có lỗi xảy ra. Vui lòng thử lại!');
        }
    }
};

// ========================================
// INPUT VALIDATION ON BLUR
// ========================================

const initInputValidation = () => {
    // Login form inputs
    LoginHandler.emailInput.addEventListener('blur', () => {
        const email = LoginHandler.emailInput.value.trim();
        if (email && !isValidEmail(email)) {
            showError(LoginHandler.emailInput, 'Email không hợp lệ');
        } else if (email) {
            clearError(LoginHandler.emailInput);
        }
    });
    
    // Register form inputs
    RegisterHandler.emailInput.addEventListener('blur', () => {
        const email = RegisterHandler.emailInput.value.trim();
        if (email && !isValidEmail(email)) {
            showError(RegisterHandler.emailInput, 'Email không hợp lệ');
        } else if (email) {
            clearError(RegisterHandler.emailInput);
        }
    });
    
    RegisterHandler.nameInput.addEventListener('blur', () => {
        const name = RegisterHandler.nameInput.value.trim();
        if (name && name.length < 2) {
            showError(RegisterHandler.nameInput, 'Họ tên quá ngắn');
        } else if (name) {
            clearError(RegisterHandler.nameInput);
        }
    });
    
    RegisterHandler.passwordInput.addEventListener('blur', () => {
        const password = RegisterHandler.passwordInput.value;
        if (password && !isValidPassword(password)) {
            showError(RegisterHandler.passwordInput, 'Mật khẩu phải có ít nhất 8 ký tự');
        } else if (password) {
            clearError(RegisterHandler.passwordInput);
        }
    });
    
    RegisterHandler.confirmPasswordInput.addEventListener('blur', () => {
        const password = RegisterHandler.passwordInput.value;
        const confirmPassword = RegisterHandler.confirmPasswordInput.value;
        if (confirmPassword && password !== confirmPassword) {
            showError(RegisterHandler.confirmPasswordInput, 'Mật khẩu không khớp');
        } else if (confirmPassword) {
            clearError(RegisterHandler.confirmPasswordInput);
        }
    });
    
    // Clear error on input
    const allInputs = document.querySelectorAll('.form-input');
    allInputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.classList.contains('error')) {
                clearError(input);
            }
        });
    });
};

// ========================================
// EVENT LISTENERS
// ========================================

const initEventListeners = () => {
    // Form submissions
    LoginHandler.form.addEventListener('submit', LoginHandler.submit);
    RegisterHandler.form.addEventListener('submit', RegisterHandler.submit);
    
    // Form switching links
    const toggleLinks = document.querySelectorAll('.toggle-form-link');
    toggleLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            
            if (target === 'login') {
                FormSwitcher.showLogin();
            } else if (target === 'register') {
                FormSwitcher.showRegister();
            }
        });
    });
    
    // Back to login from success message
    const backToLoginBtn = document.getElementById('backToLogin');
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', () => {
            FormSwitcher.showLogin();
        });
    }
    
    // Forgot password link (placeholder)
    const forgotLink = document.querySelector('.forgot-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            Toast.info('Chức năng "Quên mật khẩu" đang được phát triển');
        });
    }
};

// ========================================
// CHECK LOGIN STATUS
// ========================================

const checkLoginStatus = () => {
    const currentUser = Storage.getCurrentUser();
    if (currentUser) {
        console.log('✅ User đang đăng nhập:', currentUser);
        console.log(`📁 Chế độ lưu trữ: ${CONFIG.storageMode}`);
        // Trong app thực tế, redirect đến dashboard
        // window.location.href = '/dashboard';
    }
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌿 Green Tea Auth System Initialized');
    console.log(`📁 Storage Mode: ${CONFIG.storageMode}`);
    console.log(`📂 Data Path: ${CONFIG.dataPath}`);
    
    // Initialize all modules
    Toast.init();
    initPasswordToggle();
    initInputValidation();
    initEventListeners();
    checkLoginStatus();
    
    // Demo: Log current users
    Storage.getUsers().then(users => {
        console.log(`👥 Tổng số users: ${users.length}`);
        if (users.length > 0) {
            console.log('Users:', users);
        }
    });
});

// ========================================
// DESKTOP PANEL TOGGLE
// ========================================

const panelContainer = document.getElementById('panelContainer');
const panelToggleBtn = document.getElementById('panelToggleBtn');
const welcomeTitle = document.getElementById('welcomeTitle');
const welcomeSubtitle = document.getElementById('welcomeSubtitle');

if (panelToggleBtn) {
    let currentMode = 'login';
    let isAnimating = false;
    
    panelToggleBtn.addEventListener('click', function() {
        if (isAnimating) return;
        
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        isAnimating = true;
        FormSwitcher.clearAllErrors();
        
        if (currentMode === 'login') {
            // CHUYỂN SANG REGISTER
            loginForm.classList.add('hidden');
            
            setTimeout(() => {
                panelContainer.classList.add('slide-left');
            }, 100);
            
            setTimeout(() => {
                registerForm.classList.remove('hidden');
            }, 400);
            
            setTimeout(() => {
                welcomeTitle.textContent = 'Chào mừng trở lại!';
                welcomeSubtitle.textContent = 'Đăng nhập tài khoản của bạn để sử dụng đầy đủ tính năng của trang web';
                panelToggleBtn.textContent = 'ĐĂNG NHẬP';
            }, 300);
            
            document.getElementById('register-form').reset();
            currentMode = 'register';
            
        } else {
            // CHUYỂN SANG LOGIN
            registerForm.classList.add('hidden');
            
            setTimeout(() => {
                panelContainer.classList.remove('slide-left');
            }, 100);
            
            setTimeout(() => {
                loginForm.classList.remove('hidden');
            }, 400);
            
            setTimeout(() => {
                welcomeTitle.textContent = 'Hi! Bạn chưa có tài khoản?';
                welcomeSubtitle.textContent = 'Đăng ký để sử dụng những tính năng tuyệt vời của trang web';
                panelToggleBtn.textContent = 'ĐĂNG KÝ';
            }, 300);
            
            document.getElementById('login-form').reset();
            currentMode = 'login';
        }
        
        setTimeout(() => {
            isAnimating = false;
        }, 700);
    });
}

// ========================================
// ĐỒNG BỘ FORM SWITCHER VỚI PANEL
// ========================================

const originalShowLogin = FormSwitcher.showLogin;
FormSwitcher.showLogin = function() {
    originalShowLogin.call(this);
    
    if (window.innerWidth >= 769 && panelContainer) {
        panelContainer.classList.remove('slide-left');
        
        if (welcomeTitle && welcomeSubtitle && panelToggleBtn) {
            welcomeTitle.textContent = 'Hi! Bạn chưa có tài khoản?';
            welcomeSubtitle.textContent = 'Đăng ký để sử dụng những tính năng tuyệt vời của trang web';
            panelToggleBtn.textContent = 'ĐĂNG KÝ';
        }
    }
};

const originalShowRegister = FormSwitcher.showRegister;
FormSwitcher.showRegister = function() {
    originalShowRegister.call(this);
    
    if (window.innerWidth >= 769 && panelContainer) {
        panelContainer.classList.add('slide-left');
        
        if (welcomeTitle && welcomeSubtitle && panelToggleBtn) {
            welcomeTitle.textContent = 'Chào mừng trở lại!';
            welcomeSubtitle.textContent = 'Đăng nhập tài khoản của bạn để sử dụng đầy đủ tính năng của trang web';
            panelToggleBtn.textContent = 'ĐĂNG NHẬP';
        }
    }
};

// ========================================
// XỬ LÝ RESPONSIVE
// ========================================

window.addEventListener('resize', () => {
    if (window.innerWidth < 769 && panelContainer) {
        panelContainer.classList.remove('slide-left');
    }
});