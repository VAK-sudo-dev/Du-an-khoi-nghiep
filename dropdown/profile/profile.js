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

    // Luôn khóa email với mọi phương thức đăng nhập
    lockEmailField();

    // Chỉ khóa password nếu là Google/Facebook
    if (userData.provider && userData.provider !== 'email') {
        lockPasswordCard(userData.provider);
    }
}

/* ============================================================
    TOAST NOTIFICATION
    ============================================================ */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = type === 'success' ? '✓  ' + message : '✕  ' + message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, 3000);
}

/* ============================================================
    VALIDATION HELPERS
    ============================================================ */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setError(input, errorEl, message) {
    input.classList.add('invalid');
    errorEl.textContent = message;
    errorEl.classList.add('visible');
}

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
    return score;
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
    LOCK EMAIL – khóa email với MỌI phương thức đăng nhập
    ============================================================ */
function lockEmailField() {
    const emailFormGroup = inputEmail.closest('.form-group');
    if (!emailFormGroup) return;

    inputEmail.disabled = true;
    emailFormGroup.style.position = 'relative';

    // Blur phần input-wrap
    const inputWrap = emailFormGroup.querySelector('.input-wrap');
   if (inputWrap) {
        const lockIcon = document.createElement('span');
        lockIcon.style.cssText = `
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
        `;
        lockIcon.innerHTML = `
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#34a853" stroke-width="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
        `;
        inputWrap.style.position = 'relative';
        inputWrap.appendChild(lockIcon);
    }

    // Overlay thông báo
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        z-index: 10;
        pointer-events: none;
        padding: 0 8px;
    `;
    emailFormGroup.appendChild(overlay);
}

/* ============================================================
    LOCK PASSWORD CARD – khóa password với Google/Facebook
    ============================================================ */
function lockPasswordCard(provider) {
    const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
    const message = `Bạn không thể thay đổi thông tin này khi đăng nhập bằng ${providerLabel}`;

    const passwordCard = passwordForm.closest('.card');
    if (!passwordCard) return;

    // ── Bước 1: Lấy card-title ra khỏi card tạm thời ─────────────
    const cardTitle = passwordCard.querySelector('.card-title');

    // ── Bước 2: Tạo blurWrapper bọc TẤT CẢ nội dung card ─────────
    const blurWrapper = document.createElement('div');
    blurWrapper.style.cssText = `
        filter: blur(5px) sepia(1) saturate(3) hue-rotate(80deg) brightness(1.1);
        pointer-events: none;
        user-select: none;
    `;

    // Di chuyển toàn bộ children của passwordCard vào blurWrapper
    while (passwordCard.firstChild) {
        blurWrapper.appendChild(passwordCard.firstChild);
    }
    passwordCard.appendChild(blurWrapper);

    // ── Bước 3: Đưa card-title ra ngoài blurWrapper (không bị blur)
    if (cardTitle) {
        passwordCard.insertBefore(cardTitle, blurWrapper);
    }

    // ── Bước 4: Overlay thông báo nằm trên blurWrapper ────────────
    passwordCard.style.position = 'relative';
    passwordCard.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        top: ${cardTitle ? cardTitle.offsetHeight + 'px' : '70px'};
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        background: rgba(255, 255, 255, 0.5);
        z-index: 20;
        pointer-events: none;
        padding: 0 24px;
    `;
    overlay.innerHTML = `
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#5a3e2b" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span style="
            color: #5a3e2b;
            font-size: 0.88rem;
            font-weight: 700;
            font-family: 'Quicksand', sans-serif;
            text-align: center;
            line-height: 1.4;
        ">${message}</span>
    `;
    passwordCard.appendChild(overlay);

    // ── Bước 5: Disable inputs để tránh focus bằng tab ───────────
    passwordForm.querySelectorAll('input, button').forEach(el => el.disabled = true);
}

/* ============================================================
    MOCK BACKEND FUNCTIONS
    ============================================================ */
async function updateProfile(data) {
    const stored = localStorage.getItem('teaUser');
    if (stored) {
        const user = JSON.parse(stored);
        if (user.provider && user.provider !== 'email') {
            data.email = user.email;
        }
    }
    
    try {
        const { error } = await supabaseClient.auth.updateUser({
            data: { name: data.name }
        });
        if (error) throw error;
    } catch (err) {
        console.error('Lỗi cập nhật Supabase:', err);
    }

    if (stored) {
        const user = JSON.parse(stored);
        user.name  = data.name;
        if (!user.provider || user.provider === 'email') {
            user.email = data.email;
        }
        localStorage.setItem('teaUser', JSON.stringify(user));
    }
}

async function updatePassword(data) {
    const stored = localStorage.getItem('teaUser');
    if (stored) {
        const user = JSON.parse(stored);
        if (user.provider && user.provider !== 'email') {
            showToast(`Không thể đổi mật khẩu khi đăng nhập bằng ${user.provider}.`, 'error');
            return;
        }
    }
    
    try {
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
    
    const stored = localStorage.getItem('teaUser');
    if (stored) {
        const user = JSON.parse(stored);
        if (user.provider && user.provider !== 'email') {
            email = user.email;
        }
    }

    if (!name) {
        setError(inputName, nameError, 'Vui lòng nhập họ và tên.');
        valid = false;
    }

    const userData = stored ? JSON.parse(stored) : null;
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

    panelName.textContent  = name;
    panelEmail.textContent = email;

    updateProfile({ name, email });
    showToast('Thông tin cá nhân đã được cập nhật!');
});

/* ============================================================
    EVENT LISTENER – Password form submit
    ============================================================ */
passwordForm.addEventListener('submit', function (e) {
    e.preventDefault();

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

    if (!oldPass) {
        setError(inputOldPass, oldPassError, 'Vui lòng nhập mật khẩu hiện tại.');
        valid = false;
    }
    if (!newPass) {
        setError(inputNewPass, newPassError, 'Vui lòng nhập mật khẩu mới.');
        valid = false;
    } else if (newPass.length < 6) {
        setError(inputNewPass, newPassError, 'Mật khẩu mới phải có ít nhất 6 ký tự.');
        valid = false;
    }
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

    updatePassword({ oldPassword: oldPass, newPassword: newPass });
    passwordForm.reset();
    strengthSegments.forEach(seg => (seg.style.background = ''));
    strengthLabel.textContent = '';
    showToast('Mật khẩu đã được cập nhật thành công!');
});

/* ============================================================
    PAGE INITIALIZATION
    ============================================================ */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUserProfile);
} else {
    loadUserProfile();
}