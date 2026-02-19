'use strict';

/* ============================================================
    DOM SELECTION
    ============================================================ */
const avatarInput      = document.getElementById('avatar-input');
const avatarPreview    = document.getElementById('avatar-preview');
const panelName        = document.getElementById('panel-display-name');
const panelEmail       = document.getElementById('panel-display-email');
const toastContainer   = document.getElementById('toast-container');

// Profile form
const profileForm      = document.getElementById('profile-form');
const inputName        = document.getElementById('input-name');
const inputEmail       = document.getElementById('input-email');
const nameError        = document.getElementById('name-error');
const emailError       = document.getElementById('email-error');

// Password form
const passwordForm     = document.getElementById('password-form');
const inputOldPass     = document.getElementById('input-old-pass');
const inputNewPass     = document.getElementById('input-new-pass');
const inputConfirmPass = document.getElementById('input-confirm-pass');
const oldPassError     = document.getElementById('old-pass-error');
const newPassError     = document.getElementById('new-pass-error');
const confirmPassError = document.getElementById('confirm-pass-error');

// Strength segments
const strengthSegments = [
    document.getElementById('seg1'),
    document.getElementById('seg2'),
    document.getElementById('seg3'),
    document.getElementById('seg4'),
];
const strengthLabel = document.getElementById('strength-label');

/* ============================================================
    LOAD USER PROFILE – điền dữ liệu user vào form khi trang load
    ============================================================ */
async function loadUserProfile() {
    let userData = null;

    // Ưu tiên: lấy từ Supabase (nguồn chính xác nhất)
    try {
        const { data } = await supabaseClient.auth.getUser();
        if (data?.user) {
            const user = data.user;
            userData = {
                id:     user.id,
                email:  user.email,
                name:   user.user_metadata?.name 
                     || user.user_metadata?.full_name 
                     || 'Người dùng',
                avatar: user.user_metadata?.avatar_url || null,
                provider: user.app_metadata?.provider || 'email'
            };
            // Đồng bộ lại localStorage
            localStorage.setItem('teaUser', JSON.stringify(userData));
        }
    } catch (err) {
        console.warn('Không thể lấy user từ Supabase, thử localStorage...', err);
    }

    // Fallback: đọc từ localStorage nếu Supabase thất bại
    if (!userData) {
        const stored = localStorage.getItem('teaUser');
        if (stored) {
            userData = JSON.parse(stored);
        }
    }

    // Nếu không có user → chuyển về trang đăng nhập
    if (!userData) {
        window.location.href = '../../login.html';
        return;
    }

    // Điền vào form
    inputName.value  = userData.name  || '';
    inputEmail.value = userData.email || '';

    // Cập nhật side-panel
    panelName.textContent  = userData.name  || 'Người dùng';
    panelEmail.textContent = userData.email || '';

    // Nếu đăng nhập bằng Google/Facebook → có avatar
    if (userData.avatar) {
        avatarPreview.src = userData.avatar;
    }

    // [FIX] Luôn khóa email với mọi phương thức đăng nhập
    lockEmailField();

    // [FIX] Chỉ khóa password nếu là Google/Facebook
    if (userData.provider && userData.provider !== 'email') {
        lockPasswordCard(userData.provider);
    }
}

/* ============================================================
    TOAST NOTIFICATION
    ============================================================ */
/**
 * Show a slide-down toast message.
 * @param {string} message
 * @param {'success'|'error'} type
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = type === 'success' ? '✓  ' + message : '✕  ' + message;
    toastContainer.appendChild(toast);

    // Auto-dismiss after 3s
    setTimeout(() => {
    toast.classList.add('hide');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, 3000);
}

/* ============================================================
    VALIDATION HELPERS
    ============================================================ */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mark an input as invalid and show its error message.
 * @param {HTMLInputElement} input
 * @param {HTMLElement}      errorEl
 * @param {string}           message
 */
function setError(input, errorEl, message) {
    input.classList.add('invalid');
    errorEl.textContent = message;
    errorEl.classList.add('visible');
}

/**
 * Clear validation state from an input.
 * @param {HTMLInputElement} input
 * @param {HTMLElement}      errorEl
 */
function clearError(input, errorEl) {
    input.classList.remove('invalid');
    errorEl.classList.remove('visible');
}

/* ============================================================
    AVATAR UPLOAD MOCK (FileReader preview)
    ============================================================ */
avatarInput.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
    showToast('Vui lòng chọn file ảnh hợp lệ.', 'error');
    return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
    avatarPreview.src = e.target.result;
    showToast('Ảnh đại diện đã được cập nhật!');
    };
    reader.readAsDataURL(file);
});

/* ============================================================
    PASSWORD STRENGTH METER
    ============================================================ */
function getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 6)  score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password) || /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score; // 0–4
}

const STRENGTH_COLORS = ['', '#C0392B', '#E67E22', '#F1C40F', '#2D7D46'];
const STRENGTH_LABELS = ['', 'Rất yếu', 'Yếu', 'Trung bình', 'Mạnh'];

inputNewPass.addEventListener('input', function () {
    const score = getPasswordStrength(this.value);
    strengthSegments.forEach((seg, i) => {
    seg.style.background = i < score ? STRENGTH_COLORS[score] : '';
    });
    strengthLabel.textContent = this.value.length ? STRENGTH_LABELS[score] : '';
    clearError(inputNewPass, newPassError);
});

/* ============================================================
    INLINE VALIDATION – clear on type
    ============================================================ */
inputName.addEventListener('input',        () => clearError(inputName, nameError));
inputEmail.addEventListener('input',       () => clearError(inputEmail, emailError));
inputOldPass.addEventListener('input',     () => clearError(inputOldPass, oldPassError));
inputConfirmPass.addEventListener('input', () => clearError(inputConfirmPass, confirmPassError));

/* ============================================================
    EYE TOGGLE – show/hide password
    ============================================================ */
document.querySelectorAll('.eye-toggle').forEach(btn => {
    btn.addEventListener('click', function () {
    const targetId = this.dataset.target;
    const field    = document.getElementById(targetId);
    const isPass   = field.type === 'password';
    field.type = isPass ? 'text' : 'password';

    // Swap icon (show/hide lines)
    const svg = this.querySelector('svg');
    if (isPass) {
        svg.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
        `;
    } else {
        svg.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
        `;
    }
    });
});

/* ============================================================
    [FIX] LOCK EMAIL – khóa email với MỌI phương thức đăng nhập
    ============================================================ */
function lockEmailField() {
    const emailFormGroup = inputEmail.closest('.form-group');
    if (!emailFormGroup) return;

    inputEmail.disabled = true;
    emailFormGroup.style.position = 'relative';

    const overlay = document.createElement('div');
    overlay.className = 'locked-overlay';
    overlay.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>Email không thể thay đổi</span>
    `;

    // Blur chỉ phần input-wrap, không blur label
    const inputWrap = emailFormGroup.querySelector('.input-wrap');
    if (inputWrap) inputWrap.style.filter = 'blur(3px)';

    emailFormGroup.appendChild(overlay);
}

/* ============================================================
    [FIX] LOCK PASSWORD CARD – khóa password với Google/Facebook
    ============================================================ */
function lockPasswordCard(provider) {
    const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
    const message = `Bạn không thể thay đổi thông tin này khi đăng nhập bằng ${providerLabel}`;

    const passwordCard = passwordForm.closest('.card');
    if (!passwordCard) return;

    passwordCard.style.position = 'relative';
    passwordCard.style.overflow = 'hidden';

    // Wrap nội dung form vào div rồi blur div đó (tránh lỗi filter + position: absolute)
    const blurWrapper = document.createElement('div');
    blurWrapper.style.filter = 'blur(4px)';
    blurWrapper.style.pointerEvents = 'none';
    blurWrapper.style.userSelect = 'none';

    // Di chuyển tất cả children của form vào blurWrapper
    while (passwordForm.firstChild) {
        blurWrapper.appendChild(passwordForm.firstChild);
    }
    passwordForm.appendChild(blurWrapper);

    // Tạo overlay thông báo
    const overlay = document.createElement('div');
    overlay.className = 'locked-overlay locked-overlay--card';
    overlay.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>${message}</span>
    `;
    passwordCard.appendChild(overlay);

    // Disable tất cả inputs để tránh focus bằng tab
    passwordForm.querySelectorAll('input, button').forEach(el => el.disabled = true);
}

/* ============================================================
    MOCK BACKEND FUNCTIONS
    ============================================================ */
/**
 * Mock: update display name & email.
 * Replace with real API call when backend is ready.
 * @param {{ name: string, email: string }} data
 */

async function updateProfile(data) {
    // Kiểm tra xem email có thay đổi không
    const stored = localStorage.getItem('teaUser');
    if (stored) {
        const user = JSON.parse(stored);
        // Nếu là external provider, không cho update email
        if (user.provider && user.provider !== 'email') {
            data.email = user.email; // Keep original email
        }
    }
    
    // Cập nhật Supabase
    try {
        const { error } = await supabaseClient.auth.updateUser({
            data: { name: data.name }
        });
        if (error) throw error;
    } catch (err) {
        console.error('Lỗi cập nhật Supabase:', err);
    }

    // Cập nhật localStorage để đồng bộ với main.js
    if (stored) {
        const user = JSON.parse(stored);
        user.name  = data.name;
        // Email không đổi cho external provider
        if (!user.provider || user.provider === 'email') {
            user.email = data.email;
        }
        localStorage.setItem('teaUser', JSON.stringify(user));
    }
}

/**
 * Mock: update user password.
 * Replace with real API call when backend is ready.
 * @param {{ oldPassword: string, newPassword: string }} data
 */

async function updatePassword(data) {
    // Kiểm tra external provider
    const stored = localStorage.getItem('teaUser');
    if (stored) {
        const user = JSON.parse(stored);
        if (user.provider && user.provider !== 'email') {
            showToast(`Không thể đổi mật khẩu khi đăng nhập bằng ${user.provider}.`, 'error');
            return;
        }
    }
    
    try {
        // Supabase không cần xác minh mật khẩu cũ qua client
        // nhưng bạn có thể re-authenticate trước nếu cần
        const { error } = await supabaseClient.auth.updateUser({
            password: data.newPassword
        });
        if (error) throw error;
    } catch (err) {
        console.error('Lỗi cập nhật mật khẩu:', err);
        showToast('Không thể cập nhật mật khẩu. Vui lòng thử lại.', 'error');
    }
}

/* ============================================================
    EVENT LISTENER – Profile form submit
    ============================================================ */
profileForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const name  = inputName.value.trim();
    let email   = inputEmail.value.trim();
    let valid   = true;
    
    // Nếu là external provider, không cho update email
    const stored = localStorage.getItem('teaUser');
    if (stored) {
        const user = JSON.parse(stored);
        if (user.provider && user.provider !== 'email') {
            email = user.email; // Giữ email cũ
        }
    }

    // Validate name
    if (!name) {
    setError(inputName, nameError, 'Vui lòng nhập họ và tên.');
    valid = false;
    }

    // Validate email (chỉ validate nếu không phải external provider)
    const userData = localStorage.getItem('teaUser') ? JSON.parse(localStorage.getItem('teaUser')) : null;
    if (!userData || userData.provider === 'email') {
        if (!email) {
        setError(inputEmail, emailError, 'Vui lòng nhập địa chỉ email.');
        valid = false;
        } else if (!EMAIL_RE.test(email)) {
        setError(inputEmail, emailError, 'Email không đúng định dạng (vd: ten@email.com).');
        valid = false;
        }
    }

    if (!valid) {
    showToast('Vui lòng kiểm tra lại thông tin.', 'error');
    return;
    }

    // Update side-panel display
    panelName.textContent  = name;
    panelEmail.textContent = email;

    // Call mock function
    updateProfile({ name, email });

    showToast('Thông tin cá nhân đã được cập nhật!');
});

/* ============================================================
    EVENT LISTENER – Password form submit
    ============================================================ */
passwordForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Kiểm tra nếu là external provider
    const stored = localStorage.getItem('teaUser');
    if (stored) {
        const user = JSON.parse(stored);
        if (user.provider && user.provider !== 'email') {
            showToast(`Không thể đổi mật khẩu khi đăng nhập bằng ${user.provider}.`, 'error');
            return;
        }
    }

    const oldPass     = inputOldPass.value;
    const newPass     = inputNewPass.value;
    const confirmPass = inputConfirmPass.value;
    let valid         = true;

    // Validate old password
    if (!oldPass) {
    setError(inputOldPass, oldPassError, 'Vui lòng nhập mật khẩu hiện tại.');
    valid = false;
    }

    // Validate new password
    if (!newPass) {
    setError(inputNewPass, newPassError, 'Vui lòng nhập mật khẩu mới.');
    valid = false;
    } else if (newPass.length < 6) {
    setError(inputNewPass, newPassError, 'Mật khẩu mới phải có ít nhất 6 ký tự.');
    valid = false;
    }

    // Validate confirm password
    if (!confirmPass) {
    setError(inputConfirmPass, confirmPassError, 'Vui lòng xác nhận mật khẩu mới.');
    valid = false;
    } else if (newPass !== confirmPass) {
    setError(inputConfirmPass, confirmPassError, 'Mật khẩu xác nhận không khớp.');
    valid = false;
    }

    if (!valid) {
    showToast('Vui lòng kiểm tra lại thông tin mật khẩu.', 'error');
    return;
    }

    // Call mock function
    updatePassword({ oldPassword: oldPass, newPassword: newPass });

    // Reset password form
    passwordForm.reset();
    strengthSegments.forEach(seg => (seg.style.background = ''));
    strengthLabel.textContent = '';

    showToast('Mật khẩu đã được cập nhật thành công!');
});

/* ============================================================
    PAGE INITIALIZATION
    ============================================================ */

// Load profile khi page ready (handle cả case DOM đã load trước)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUserProfile);
} else {
    loadUserProfile();
}