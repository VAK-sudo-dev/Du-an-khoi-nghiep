/* HỆ THỐNG XÁC THỰC - JAVASCRIPT
   Quản lý đăng nhập, đăng ký và toast
*/

// ========================================
// CẤU HÌNH
// ========================================

const CONFIG = {
    storageMode: 'supabase',
    apiEndpoint: null,
    dataPath: null
};

// ========================================
// TIỆN ÍCH & HÀM HỖ TRỢ
// ========================================

// Dùng regex để xác nhận có dạng "chuỗi@chuỗi.đuôi"
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Kiểm tra chiều dài >= 8.
const isValidPassword = (password) => {
    return password.length >= 8;
};

// Hiển thị lỗi cho input.
const showError = (input, message) => {
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');
    
    input.classList.add('error');
    errorElement.textContent = message;
    errorElement.classList.add('show');
};

// Xóa lỗi trên input.
const clearError = (input) => {
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');
    
    input.classList.remove('error');
    errorElement.textContent = '';
    errorElement.classList.remove('show');
};

// Thiết lập trạng thái loading cho button.
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
// THÔNG BÁO TOAST
// ========================================

// Toast.init
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
    // 1) Tạo phần tử toast với icon + message + close button
    // 2) Thêm vào container, bật animation (thêm class 'show')
    // 3) Sau duration: tắt animation rồi remove phần tử
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
        


        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
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
// LƯU THÔNG TIN NGƯỜI DÙNG (localSTORAGE)
// ========================================

// Khi dùng Supabase, các hàm local bị vô hiệu hóa.
// Khi dùng JSON server, các phương thức fetch dữ liệu qua API endpoint.
const Storage = {
    // KHÔNG DÙNG STORAGE KHI DÙNG SUPABASE
    getUsers: async () => {
        if (CONFIG.storageMode === 'supabase') {
            console.warn('⚠️ Storage.getUsers() bị vô hiệu khi dùng Supabase');
            return [];
        }
        return Storage._getFromLocalStorage();
    },

    saveUser: async () => {
        if (CONFIG.storageMode === 'supabase') {
            console.warn('⚠️ Storage.saveUser() bị vô hiệu khi dùng Supabase');
            return;
        }
    },

    findUserByEmail: async () => {
        if (CONFIG.storageMode === 'supabase') {
            console.warn('⚠️ Storage.findUserByEmail() bị vô hiệu khi dùng Supabase');
            return null;
        }
    },


    
    // Lấy users từ endpoint GET /users
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
    
    // Lưu users bằng POST /users
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
    
    // Tìm user bằng API POST /find-user
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
    
    // Thêm user qua POST /register
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
};

// ========================================
// HỆ THỐNG SUPABASE
// ========================================

// Mỗi phương thức trả về object hoặc ném lỗi để caller xử lý.
const SupabaseAuth = {
    // Đăng ký
    // xử lý error và trả về { success, user/message }.
    register: async (email, password, options = {}) => {
        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: options.data || {} 
                }
            });

            if (error) {
                console.error('❌ Supabase register error:', error);
                return {
                    success: false,
                    message: error.message === 'User already registered' 
                        ? 'Email đã được đăng ký' 
                        : 'Đăng ký thất bại'
                };
            }

            console.log('✅ Đăng ký thành công:', data);

            return {
                success: true,
                user: data.user
            };
        } catch (error) {
            console.error('❌ Lỗi không mong đợi:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra'
            };
        }
    },

    // Đăng nhập
    // Gọi signInWithPassword, trả về user hoặc ném lỗi.
    login: async (email, password) => {
        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                throw error;
            }
            
            return data.user;
        } catch (error) {
            throw error;
        }
    },

    // Lấy user hiện tại
    // supabaseClient.auth.getUser() và trả về data.user hoặc null
    currentUser: async () => {
        const { data } = await supabaseClient.auth.getUser();
        return data?.user || null;
    },

    // Logout
    logout: async () => {
        await supabaseClient.auth.signOut();
    }
};

// ========================================
// FACEBOOK LOGIN HANDLER (SUPABASE OAUTH)
// ========================================

const FacebookAuth = {
    // Đăng nhập qua Supabase OAuth (redirect)
    loginWithSupabase: async () => {
        try {
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'facebook',
                options: {
                    redirectTo: window.location.origin + '/index.html'
                }
            });

            if (error) {
                throw error;
            }

            // Supabase sẽ tự động redirect sang Facebook
            // Sau khi đăng nhập xong, Facebook sẽ redirect về redirectTo

        } catch (error) {
            console.error('❌ Facebook login error:', error);
            Toast.error('Không thể kết nối Facebook. Vui lòng thử lại!');
        }
    },

    // [FIX] Xử lý callback sau khi Facebook redirect về
    handleCallback: async () => {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) {
            console.error('❌ Lỗi lấy session Facebook:', error);
            return null;
        }

        if (session) {
            console.log('✅ Đăng nhập Facebook thành công:', session.user);
            
            // [FIX] Lưu provider: 'facebook' để profile.js nhận biết
            localStorage.setItem('teaUser', JSON.stringify({
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email,
                avatar: session.user.user_metadata?.avatar_url,
                provider: 'facebook',  // ← FIX: thêm provider
                loginAt: Date.now()
            }));
            
            return session.user;
        }

        return null;
    }
};

// ========================================
// GOOGLE AUTHENTICATION
// ========================================

const GoogleAuth = {
    // Đăng nhập với Google qua Supabase OAuth
    loginWithSupabase: async () => {
        try {
            console.log('🔐 Bắt đầu đăng nhập Google...');
            
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/index.html',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            });

            if (error) {
                console.error('❌ Lỗi Google login:', error);
                Toast.error('Không thể đăng nhập bằng Google');
                return;
            }

            console.log('✅ Đang chuyển hướng đến Google...');
            
        } catch (error) {
            console.error('❌ Lỗi Google login:', error);
            Toast.error('Có lỗi xảy ra khi đăng nhập');
        }
    },

    // Xử lý callback sau khi Google redirect về
    handleCallback: async () => {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) {
            console.error('❌ Lỗi lấy session:', error);
            return null;
        }

        if (session) {
            console.log('✅ Đăng nhập Google thành công:', session.user);
            
            // Lưu thông tin user
            localStorage.setItem('teaUser', JSON.stringify({
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || session.user.email,
                avatar: session.user.user_metadata?.avatar_url,
                provider: 'google',  // ← đã có sẵn, giữ nguyên
                loginAt: Date.now()
            }));
            
            return session.user;
        }

        return null;
    }
};

// ========================================
// CHUYỂN ĐỔI FORM (FORM SWITCHING)
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
        
        // Chuyển thẳng vào trang web sau 2 giây
        setTimeout(() => {
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
// CHUYỂN ẨN/HIỆN MẬT KHẨU (PASSWORD TOGGLE)
// ========================================

// Đổi thuộc tính type của input giữa 'password' và 'text', đồng thời thay icon tương ứng.
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
// XỬ LÝ ĐĂNG NHẬP (LOGIN HANDLER)
// ========================================

// LoginHandler.validate:
// Check email và password, cập nhật lỗi tương ứng, trả về boolean.
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
    // 1) preventDefault, validate form
    // 2) bật loading, gọi SupabaseAuth.login
    // 3) nếu thành công: lưu vào localStorage, show toast, redirect
    // 4) nếu lỗi: phân tích error.message để hiển thị thông báo phù hợp
    submit: async (e) => {
        e.preventDefault();
        
        if (!LoginHandler.validate()) {
            return;
        }
        
        const submitButton = LoginHandler.form.querySelector('.btn-primary');
        setButtonLoading(submitButton, true);
        
        const email = LoginHandler.emailInput.value.trim();
        const password = LoginHandler.passwordInput.value;
        
        try {
            // Check user
            const user = await SupabaseAuth.login(email, password);

            if (!user) {
                throw new Error('Đăng nhập thất bại');
            }

            setButtonLoading(submitButton, false);

            // [FIX] Thêm provider: 'email' để profile.js phân biệt được
            localStorage.setItem('teaUser', JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || 'Người dùng',
                provider: 'email',  // ← FIX: thêm provider
                loginAt: Date.now()
            }));

            Toast.success('Đăng nhập thành công 🎉', 3000);

            FormSwitcher.showSuccess('Chào mừng bạn quay trở lại 🌿');

            // Redirect về trang chủ sau 1.5 giây
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
        } catch (error) {
            console.error('❌ Lỗi đăng nhập:', error);
            setButtonLoading(submitButton, false);
            Toast.error('Có lỗi xảy ra. Vui lòng thử lại!');

            // Phân tích lỗi dựa trên error.message từ Supabase
            let errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại!';
            
            if (error.message === 'Invalid login credentials') {
                errorMessage = 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại!';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư';
            } else if (error.message.includes('not found')) {
                errorMessage = 'Email này chưa được đăng ký';
            } else if (error.message.includes('Too many requests')) {
                errorMessage = 'Quá nhiều lần thử. Vui lòng đợi một chút';
            }
            
            Toast.error(errorMessage, 4000);

        }
    }

    
};

// ========================================
// XỬ LÝ ĐĂNG KÝ (REGISTER HANDLER)
// ========================================

// validate: Check name, email, password, confirm.
// Submit: call SupabaseAuth.register với user_metadata.name,
// xử lý kết quả, hiển thị toast và chuyển sang success.
const RegisterHandler = {
    form: document.getElementById('register-form'),
    nameInput: document.getElementById('register-name'),
    emailInput: document.getElementById('register-email'),
    passwordInput: document.getElementById('register-password'),
    confirmPasswordInput: document.getElementById('register-confirm-password'),
    submitBtn: document.querySelector('#register-form .btn-primary'),
    
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
            clearError(RegisterHandler.emailInput);
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
        
        const name = RegisterHandler.nameInput.value.trim();
        const email = RegisterHandler.emailInput.value.trim();
        const password = RegisterHandler.passwordInput.value;
        const confirmPassword = RegisterHandler.confirmPasswordInput.value;
        
        // Validation
        let hasError = false;
        
        if (!name || name.length < 2) {
            showError(RegisterHandler.nameInput, 'Vui lòng nhập họ tên (tối thiểu 2 ký tự)');
            hasError = true;
        }
        
        if (!email || !isValidEmail(email)) {
            showError(RegisterHandler.emailInput, 'Email không hợp lệ');
            hasError = true;
        }
        
        if (!password || !isValidPassword(password)) {
            showError(RegisterHandler.passwordInput, 'Mật khẩu phải có ít nhất 8 ký tự');
            hasError = true;
        }
        
        if (password !== confirmPassword) {
            showError(RegisterHandler.confirmPasswordInput, 'Mật khẩu không khớp');
            hasError = true;
        }
        
        if (hasError) return;
        
        const submitButton = RegisterHandler.form.querySelector('.btn-primary'); 
        setButtonLoading(submitButton, true);
        
        try {
            const result = await SupabaseAuth.register(email, password, {
                data: {
                    name: name 
                }
            });
            
            if (result.success) {
                Toast.success(`Đăng ký thành công! Chào mừng ${name} đến với TeaVerse 🎉`);
                RegisterHandler.form.reset();
                FormSwitcher.showSuccess(`Đăng ký thành công! Chào mừng ${name} đến với TeaVerse`);
            } else {
                Toast.error(result.message || 'Đăng ký thất bại');
            }
        } catch (error) {
            console.error('❌ Lỗi đăng ký:', error);
            Toast.error('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            const submitButton = RegisterHandler.form.querySelector('.btn-primary');
            setButtonLoading(submitButton, false);
        }
    }
};

// ========================================
// VALIDATION KHI MẤT FOCUS (ON BLUR)
// ========================================

// Gắn sự kiện 'blur' cho các input chính để kiểm tra tức thì, và 'input' để xóa lỗi khi người dùng bắt đầu gõ lại.
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
// SỰ KIỆN CHUNG (EVENT LISTENERS)
// ========================================

// Gắn submit handlers, link chuyển form, back to login, forgot password.
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
    
    // Forgot password link (Cập nhật sau)
    const forgotLink = document.querySelector('.forgot-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            Toast.info('Chức năng "Quên mật khẩu" đang được phát triển');
        });
    }

    // Facebook login buttons
    const fbButtons = document.querySelectorAll('.social-btn[aria-label="Facebook"]');
    fbButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            await FacebookAuth.loginWithSupabase();
        });
    });

    // Google login buttons
    const googleButtons = document.querySelectorAll('.social-btn[aria-label="Google"]');
    googleButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            await GoogleAuth.loginWithSupabase();
        });
    });
};

// ========================================
// KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP
// ========================================

const checkLoginStatus = async () => {
    // Kiểm tra nếu đang ở callback URL (có access_token trong URL)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('access_token')) {
        console.log('🔄 Đang xử lý OAuth callback...');

        // [FIX] Phân biệt Google vs Facebook qua session provider
        const { data: { session } } = await supabaseClient.auth.getSession();
        const oauthProvider = session?.user?.app_metadata?.provider;

        let user = null;
        if (oauthProvider === 'facebook') {
            user = await FacebookAuth.handleCallback();
        } else {
            // Mặc định xử lý như Google
            user = await GoogleAuth.handleCallback();
        }

        if (user) {
            Toast.success('Đăng nhập thành công!');
            FormSwitcher.showSuccess('Chào mừng bạn đến với Trà Phú Hội 🌿');
            
            // Redirect về trang chủ sau 1.5 giây
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1500);
            return;
        }
    }

    // Kiểm tra session hiện tại
    const user = await SupabaseAuth.currentUser();
    if (user) {
        console.log('✅ User đang đăng nhập:', user);
        console.log(`📁 Chế độ lưu trữ: ${CONFIG.storageMode}`);
    }
};

// ========================================
// KHỞI TẠO (INITIALIZATION)
// ========================================

// Khi DOMContentLoaded -> init toast, toggle, validation, sự kiện, check login.
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
    
    // Log current users
    if (CONFIG.storageMode !== 'supabase') {
        Storage.getUsers().then(users => {
            console.log(`👥 Tổng số users: ${users.length}`);
            if (users.length > 0) {
                console.log('Users:', users);
            }
        });
    }
});

// ========================================
// CHUYỂN PANEL TRÊN MÁY TÍNH (DESKTOP PANEL TOGGLE)
// ========================================

// Quản lý trạng thái currentMode và isAnimating để prevent bấm nhanh, ẩn/hiện form với delay để tạo hiệu ứng, thay đổi văn bản chào mừng.
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

// Ghi đè FormSwitcher.showLogin/showRegister để đồng bộ class panel và văn bản.
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

// Ưhen resize < 769px, đảm bảo panel không ở trạng thái slide-left.
window.addEventListener('resize', () => {
    if (window.innerWidth < 769 && panelContainer) {
        panelContainer.classList.remove('slide-left');
    }
});