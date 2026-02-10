// ============================================
// CHECKOUT PAGE JAVASCRIPT
// ============================================


// ============================================
// GLOBAL VARIABLES
// ============================================

// Cart & User
let cart = [];
let currentUser = null;
let isLoggedIn = false;

// Voucher Manager
let voucherManager = null;
let currentShippingFee = 30000;
let voucherDiscount = 0;

// Address Manager
let addressManager = null;
let selectedProvinceCode = null;
let selectedDistrictCode = null;
let selectedWardCode = null;
let isEditingAddress = false;
let editingAddressId = null;

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

// Calculate subtotal
function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Khởi tạo Voucher Manager
async function initVoucherManager() {
    try {
        console.log('🔄 Initializing VoucherManager...');
        voucherManager = new VoucherManager(supabaseClient);
        console.log('✅ VoucherManager instance created');
        
        // Load available vouchers
        await loadAvailableVouchers();
        
        // Setup event listeners
        setupVoucherListeners();
        console.log('✅ VoucherManager initialized');
        
        // Auto apply best voucher
        // await autoApplyDefaultVoucher();
    } catch (error) {
        console.error('❌ Error initializing VoucherManager:', error);
    }
}

// Load danh sách voucher khả dụng
async function loadAvailableVouchers() {
    try {
        console.log('Loading vouchers...');
        const vouchers = await voucherManager.getAvailableVouchers();
        const voucherList = document.getElementById('voucherList');
        
        if (!voucherList) {
            console.warn('⚠️ voucherList element not found');
            return;
        }
        
        if (vouchers.length === 0) {
            voucherList.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #999;">
                    <i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 8px;"></i>
                    <p>Không có mã giảm giá khả dụng</p>
                </div>
            `;
            console.log('No vouchers available');
            return;
        }

        const subtotal = calculateSubtotal();
        const appliedVoucher = voucherManager.getAppliedVoucher();
        
        console.log('📋 Rendering', vouchers.length, 'vouchers');
        
        // Build HTML synchronously first
        let voucherItemsHTML = '';
        
        for (const voucher of vouchers) {
            const isApplied = appliedVoucher && appliedVoucher.code === voucher.code;
            const validation = await voucherManager.validateVoucher(voucher.code, subtotal);
            const canUse = validation.valid || subtotal === 0;
            
            voucherItemsHTML += `
                <div class="voucher-item ${!canUse ? 'disabled' : ''}" data-code="${voucher.code}">
                    <div class="voucher-item-info">
                        <h5>${voucher.code}</h5>
                        <p>${voucherManager.getVoucherDescription(voucher)}</p>
                        ${voucher.min_order_value > 0 ? `
                            <small style="color: #999; font-size: 0.8rem;">
                                Đơn tối thiểu: ${formatPrice(voucher.min_order_value)}
                            </small>
                        ` : ''}
                        ${isApplied ? '<small style="color: var(--success-color); font-size: 0.8rem;">(Đang áp dụng)</small>' : ''}
                    </div>
                    <button 
                        class="btn-use-voucher" 
                        data-code="${voucher.code}"
                        ${!canUse || isApplied ? 'disabled' : ''}
                    >
                        ${isApplied ? 'Đã áp dụng' : 'Dùng ngay'}
                    </button>
                </div>
            `;
        }

        voucherList.innerHTML = voucherItemsHTML;
        console.log('✅ Vouchers rendered');

        // Add click handlers after rendering
        setupVoucherItemListeners();
        
    } catch (error) {
        console.error('❌ Error loading vouchers:', error);
    }
}

// Thêm hàm mới để setup listeners cho voucher items
function setupVoucherItemListeners() {
    const voucherList = document.getElementById('voucherList');
    if (!voucherList) return;
    
    // Xóa tất cả event listeners cũ bằng cách replace với clone
    const newVoucherList = voucherList.cloneNode(true);
    voucherList.parentNode.replaceChild(newVoucherList, voucherList);
    
    // Cập nhật reference
    const refreshedList = document.getElementById('voucherList');
    
    // Add new listeners cho voucher buttons
    refreshedList.querySelectorAll('.btn-use-voucher:not(:disabled)').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const code = btn.dataset.code;
            await applyVoucherByCode(code);
        });
    });
    
    // Cho phép click vào toàn bộ item voucher
    refreshedList.querySelectorAll('.voucher-item:not(.disabled)').forEach(item => {
        item.addEventListener('click', async (e) => {
            if (!e.target.closest('.btn-use-voucher')) {
                const code = item.dataset.code;
                await applyVoucherByCode(code);
            }
        });
    });
}

// Sửa hàm removeAppliedVoucher để reload vouchers
function removeAppliedVoucher() {
    voucherManager.removeVoucher();
    
    // Update UI
    document.getElementById('voucherApplied').style.display = 'none';
    document.getElementById('voucherInput').value = '';
    
    // Reload voucher list để cập nhật trạng thái nút
    loadAvailableVouchers();
    
    updateOrderSummary();
    showToast('Đã bỏ mã giảm giá', 'info');
}

// Sửa hàm applyVoucherByCode để reload vouchers
async function applyVoucherByCode(code) {
    try {
        const subtotal = calculateSubtotal();
        
        if (subtotal === 0) {
            showToast('Giỏ hàng trống, không thể áp dụng mã giảm giá', 'error');
            return;
        }

        const validation = await voucherManager.validateVoucher(code, subtotal);
        
        if (!validation.valid) {
            showToast(validation.message, 'error');
            return;
        }

        // Apply voucher
        voucherManager.applyVoucher(validation.voucher);
        
        // Update UI
        updateVoucherDisplay(validation.voucher);
        updateOrderSummary();
        
        // Reload voucher list để cập nhật trạng thái nút
        await loadAvailableVouchers();
        
        showToast(validation.message, 'success');
        
        // Clear input
        const voucherInput = document.getElementById('voucherInput');
        if (voucherInput) voucherInput.value = '';
        
    } catch (error) {
        console.error('Error applying voucher:', error);
        showToast('Có lỗi xảy ra khi áp dụng mã giảm giá', 'error');
    }
}

// Setup voucher event listeners
function setupVoucherListeners() {
    const voucherInput = document.getElementById('voucherInput');
    const btnApplyVoucher = document.getElementById('btnApplyVoucher');
    const btnRemoveVoucher = document.getElementById('btnRemoveVoucher');

    // Apply voucher button
    if (btnApplyVoucher) {
        btnApplyVoucher.addEventListener('click', async () => {
            const code = voucherInput.value.trim();
            if (!code) {
                showToast('Vui lòng nhập mã giảm giá', 'error');
                return;
            }
            await applyVoucherByCode(code);
        });
    }

    // Enter key to apply
    if (voucherInput) {
        voucherInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                btnApplyVoucher.click();
            }
        });
        
        // Auto uppercase
        voucherInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    // Remove voucher button
    if (btnRemoveVoucher) {
        btnRemoveVoucher.addEventListener('click', () => {
            removeAppliedVoucher();
        });
    }
}

// Apply voucher by code
async function applyVoucherByCode(code) {
    try {
        const subtotal = calculateSubtotal();
        
        if (subtotal === 0) {
            showToast('Giỏ hàng trống, không thể áp dụng mã giảm giá', 'error');
            return;
        }

        const validation = await voucherManager.validateVoucher(code, subtotal);
        
        if (!validation.valid) {
            showToast(validation.message, 'error');
            return;
        }

        // Apply voucher
        voucherManager.applyVoucher(validation.voucher);
        
        // Update UI
        updateVoucherDisplay(validation.voucher);
        updateOrderSummary();
        
        showToast(validation.message, 'success');
        
        // Clear input
        const voucherInput = document.getElementById('voucherInput');
        if (voucherInput) voucherInput.value = '';
        
        // Reload vouchers để cập nhật trạng thái nút
        setTimeout(() => {
            loadAvailableVouchers();
        }, 100);
        
    } catch (error) {
        console.error('Error applying voucher:', error);
        showToast('Có lỗi xảy ra khi áp dụng mã giảm giá', 'error');
    }
}

// Remove applied voucher
function removeAppliedVoucher() {
    voucherManager.removeVoucher();
    
    // Update UI
    document.getElementById('voucherApplied').style.display = 'none';
    document.getElementById('voucherInput').value = '';
    
    // Update order summary first
    updateOrderSummary();
    
    // Reload vouchers để cập nhật trạng thái nút
    setTimeout(() => {
        loadAvailableVouchers();
    }, 100);
    
    showToast('Đã bỏ mã giảm giá', 'info');
}

// Update voucher display
function updateVoucherDisplay(voucher) {
    const voucherApplied = document.getElementById('voucherApplied');
    const appliedVoucherCode = document.getElementById('appliedVoucherCode');
    const appliedVoucherDesc = document.getElementById('appliedVoucherDesc');
    
    if (voucher) {
        appliedVoucherCode.textContent = voucher.code;
        appliedVoucherDesc.textContent = voucherManager.getVoucherDescription(voucher);
        voucherApplied.style.display = 'flex';
    } else {
        voucherApplied.style.display = 'none';
    }
}

// Auto apply default voucher (FREESHIP)
async function autoApplyDefaultVoucher() {
    try {
        const subtotal = calculateSubtotal();
        if (subtotal === 0) return;

        // Tự động áp dụng mã FREESHIP nếu có
        const result = await voucherManager.validateVoucher('FREESHIP', subtotal);
        if (result.valid) {
            voucherManager.applyVoucher(result.voucher);
            updateVoucherDisplay(result.voucher);
            updateOrderSummary();
        }
    } catch (error) {
        console.log('No default voucher available');
    }
}

// ============================================
// ADDRESS MANAGEMENT
// ============================================

// Khởi tạo Address Manager
async function initAddressManager() {
    try {
        console.log('🔄 Initializing AddressManager...');
        addressManager = new AddressManager(supabaseClient);
        
        // Load Vietnam data
        const vietnamData = await addressManager.loadVietnamData();
        console.log('📍 Vietnam data loaded:', vietnamData?.length, 'provinces');
        
        // Load user addresses
        if (currentUser) {
            console.log('👤 Loading addresses for user:', currentUser.id);
            await loadUserAddresses();
        } else {
            console.warn('⚠️ No currentUser when initializing addressManager');
        }
        
        // Setup event listeners
        setupAddressListeners();
        console.log('✅ AddressManager initialized');
    } catch (error) {
        console.error('❌ Error initializing AddressManager:', error);
    }
}


// Load địa chỉ của user
async function loadUserAddresses() {
    try {
        const addresses = await addressManager.getUserAddresses(currentUser?.id);
        
        // Render saved addresses
        renderSavedAddresses(addresses);
        
        // Update checkout page
        if (addresses.length === 0) {
            updateCheckoutAddress(null); // Hiển thị "Chưa có địa chỉ"
        } else {
            const defaultAddress = addressManager.getDefaultAddress();
            if (defaultAddress) {
                updateCheckoutAddress(defaultAddress);
            } else {
                updateCheckoutAddress(addresses[0]); // Lấy địa chỉ đầu tiên
            }
        }
        
    } catch (error) {
        console.error('Error loading addresses:', error);
        updateCheckoutAddress(null); // Hiển thị "Chưa có địa chỉ" nếu có lỗi
    }
}

// Render danh sách địa chỉ đã lưu
function renderSavedAddresses(addresses) {
    const savedAddressesList = document.getElementById('savedAddressesList');
    
    if (!addresses || addresses.length === 0) {
        savedAddressesList.innerHTML = '';
        return;
    }
    
    // Clone container to remove all old event listeners
    const newSavedAddressesList = savedAddressesList.cloneNode(true);
    newSavedAddressesList.innerHTML = addresses.map(addr => `
        <div class="address-item ${addr.is_default ? 'selected' : ''}" data-id="${addr.id}">
            <div class="address-item-header">
                <span class="address-item-name">${addr.name}</span>
                ${addr.is_default ? '<span class="address-item-default">Mặc định</span>' : ''}
            </div>
            <div class="address-item-phone">${addr.phone}</div>
            <div class="address-item-address">${addr.full_address}</div>
            <div class="address-item-actions">
                <button class="btn-edit-address" data-id="${addr.id}">
                    <i class="fas fa-edit"></i> Sửa
                </button>
                ${!addr.is_default ? `
                    <button class="btn-delete-address" data-id="${addr.id}">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    // Replace old element with new one (purges old listeners)
    savedAddressesList.parentNode.replaceChild(newSavedAddressesList, savedAddressesList);
    
    // Get fresh reference to the new element
    const refreshedList = document.getElementById('savedAddressesList');
    
    // Add click handlers only once to fresh elements
    refreshedList.querySelectorAll('.address-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.target.closest('.btn-edit-address') || e.target.closest('.btn-delete-address')) {
                return;
            }
            
            const addressId = this.dataset.id;
            console.log('📍 Address item clicked:', addressId);
            selectAddress(addressId);
        });
    });
    
    refreshedList.querySelectorAll('.btn-edit-address').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const addressId = btn.dataset.id;
            console.log('✎️ Edit address:', addressId);
            editAddress(addressId);
            showAddressForm();
        });
    });
    
    refreshedList.querySelectorAll('.btn-delete-address').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const addressId = btn.dataset.id;
            console.log('🗑️ Delete address:', addressId);
            deleteAddress(addressId);
        });
    });
}

// Setup address event listeners
function setupAddressListeners() {
    console.log('🔄 Setting up address listeners...');
    
    const addressModal = document.getElementById('addressModal');
    const closeAddressModal = document.getElementById('closeAddressModal');
    const btnAddNewAddress = document.getElementById('btnAddNewAddress');
    const btnCancelAddress = document.getElementById('btnCancelAddress');
    const btnSaveAddress = document.getElementById('btnSaveAddress');
    
    console.log('Elements found:', {
        addressModal: !!addressModal,
        closeAddressModal: !!closeAddressModal,
        btnAddNewAddress: !!btnAddNewAddress,
        btnCancelAddress: !!btnCancelAddress,
        btnSaveAddress: !!btnSaveAddress
    });
    
    // Close modal
    if (closeAddressModal) {
        closeAddressModal.addEventListener('click', () => {
            hideAddressModal();
        });
    }
    
    if (btnCancelAddress) {
        btnCancelAddress.addEventListener('click', () => {
            if (isEditingAddress) {
                hideAddressForm();
            } else {
                hideAddressModal();
            }
        });
    }
    
    // Click outside to close
    if (addressModal) {
        addressModal.addEventListener('click', (e) => {
            if (e.target === addressModal) {
                hideAddressModal();
            }
        });
    }
    
    // Add new address
    if (btnAddNewAddress) {
        btnAddNewAddress.addEventListener('click', () => {
            showAddressForm();
        });
    }
    
    // Save address
    if (btnSaveAddress) {
        btnSaveAddress.addEventListener('click', () => {
            saveAddress();
        });
    }
    
    // Setup autocomplete
    setupAutocomplete();
    
    // Address type buttons
    document.querySelectorAll('.address-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.address-type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Setup autocomplete cho địa chỉ
function setupAutocomplete() {
    const inputProvince = document.getElementById('inputProvince');
    const inputDistrict = document.getElementById('inputDistrict');
    const inputWard = document.getElementById('inputWard');
    const provinceSuggestions = document.getElementById('provinceSuggestions');
    const districtSuggestions = document.getElementById('districtSuggestions');
    const wardSuggestions = document.getElementById('wardSuggestions');
    
    // Province autocomplete
    if (inputProvince) {
        inputProvince.addEventListener('input', function() {
            const query = this.value;
            if (query.length < 2) {
                provinceSuggestions.classList.remove('show');
                return;
            }
            
            const results = addressManager.searchProvinces(query);
            renderSuggestions(provinceSuggestions, results, (item) => {
                inputProvince.value = item.name;
                selectedProvinceCode = item.code;
                provinceSuggestions.classList.remove('show');
                
                // Enable district input
                inputDistrict.disabled = false;
                inputDistrict.value = '';
                inputDistrict.placeholder = 'Nhập tên quận/huyện';
                selectedDistrictCode = null;
                
                // Disable ward input
                inputWard.disabled = true;
                inputWard.value = '';
                selectedWardCode = null;
            });
        });
        
        inputProvince.addEventListener('focus', function() {
            if (this.value.length >= 2) {
                const results = addressManager.searchProvinces(this.value);
                if (results.length > 0) {
                    renderSuggestions(provinceSuggestions, results, () => {});
                }
            }
        });
    }
    
    // District autocomplete
    if (inputDistrict) {
        inputDistrict.addEventListener('input', function() {
            if (!selectedProvinceCode) return;
            
            const query = this.value;
            if (query.length < 2) {
                districtSuggestions.classList.remove('show');
                return;
            }
            
            const results = addressManager.searchDistricts(selectedProvinceCode, query);
            renderSuggestions(districtSuggestions, results, (item) => {
                inputDistrict.value = item.name;
                selectedDistrictCode = item.code;
                districtSuggestions.classList.remove('show');
                
                // Enable ward input
                inputWard.disabled = false;
                inputWard.value = '';
                inputWard.placeholder = 'Nhập tên phường/xã';
                selectedWardCode = null;
            });
        });
        
        inputDistrict.addEventListener('focus', function() {
            if (selectedProvinceCode && this.value.length >= 2) {
                const results = addressManager.searchDistricts(selectedProvinceCode, this.value);
                if (results.length > 0) {
                    renderSuggestions(districtSuggestions, results, () => {});
                }
            }
        });
    }
    
    // Ward autocomplete
    if (inputWard) {
        inputWard.addEventListener('input', function() {
            if (!selectedDistrictCode) return;
            
            const query = this.value;
            if (query.length < 2) {
                wardSuggestions.classList.remove('show');
                return;
            }
            
            const results = addressManager.searchWards(selectedDistrictCode, query);
            renderSuggestions(wardSuggestions, results, (item) => {
                inputWard.value = item.name;
                selectedWardCode = item.code;
                wardSuggestions.classList.remove('show');
            });
        });
        
        inputWard.addEventListener('focus', function() {
            if (selectedDistrictCode && this.value.length >= 2) {
                const results = addressManager.searchWards(selectedDistrictCode, this.value);
                if (results.length > 0) {
                    renderSuggestions(wardSuggestions, results, () => {});
                }
            }
        });
    }
    
    // Click outside to close suggestions
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.autocomplete-wrapper')) {
            provinceSuggestions.classList.remove('show');
            districtSuggestions.classList.remove('show');
            wardSuggestions.classList.remove('show');
        }
    });
}

// Render autocomplete suggestions
function renderSuggestions(container, items, onSelect) {
    if (items.length === 0) {
        container.classList.remove('show');
        return;
    }
    
    container.innerHTML = items.slice(0, 10).map(item => `
        <div class="autocomplete-item" data-code="${item.code}">
            ${item.name}
        </div>
    `).join('');
    
    container.classList.add('show');
    
    container.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', function() {
            const code = parseInt(this.dataset.code);
            const data = items.find(i => i.code === code);
            onSelect(data);
        });
    });
}

// Show address modal
function showAddressModal() {
    console.log('🎬 Showing address modal');
    const modal = document.getElementById('addressModal');
    if (!modal) {
        console.error('❌ addressModal not found!');
        return;
    }
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    console.log('✅ Address modal shown');
}

// Hide address modal
function hideAddressModal() {
    console.log('🎬 Hiding address modal');
    const modal = document.getElementById('addressModal');
    if (modal) modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Reset form
    hideAddressForm();
}

// Show address form
function showAddressForm() {
    console.log('📝 Showing address form');
    const form = document.getElementById('addressForm');
    const btnSave = document.getElementById('btnSaveAddress');
    const btnAddNew = document.getElementById('btnAddNewAddress');
    
    if (form) form.style.display = 'block';
    if (btnSave) btnSave.style.display = 'flex';
    if (btnAddNew) btnAddNew.style.display = 'none';
    
    isEditingAddress = false;
    editingAddressId = null;
    resetAddressForm();
    console.log('✅ Address form shown');
}

// Hide address form
function hideAddressForm() {
    console.log('📝 Hiding address form');
    const form = document.getElementById('addressForm');
    const btnSave = document.getElementById('btnSaveAddress');
    const btnAddNew = document.getElementById('btnAddNewAddress');
    
    if (form) form.style.display = 'none';
    if (btnSave) btnSave.style.display = 'none';
    if (btnAddNew) btnAddNew.style.display = 'flex';
    
    resetAddressForm();
    console.log('✅ Address form hidden');
}

// Reset address form
function resetAddressForm() {
    document.getElementById('inputName').value = '';
    document.getElementById('inputPhone').value = '';
    document.getElementById('inputProvince').value = '';
    document.getElementById('inputDistrict').value = '';
    document.getElementById('inputWard').value = '';
    document.getElementById('inputStreet').value = '';
    document.getElementById('inputDefault').checked = false;
    
    selectedProvinceCode = null;
    selectedDistrictCode = null;
    selectedWardCode = null;
    
    document.getElementById('inputDistrict').disabled = true;
    document.getElementById('inputWard').disabled = true;
    
    document.querySelectorAll('.address-type-btn').forEach((btn, index) => {
        btn.classList.toggle('active', index === 0);
    });
}

// Save address
async function saveAddress() {
    try {
        // KIỂM TRA ĐĂNG NHẬP TRƯỚC TIÊN
        if (!isLoggedIn || !currentUser) {
            console.error('❌ Not logged in. currentUser:', currentUser, 'isLoggedIn:', isLoggedIn);
            showToast('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'error');
            setTimeout(() => {
                localStorage.removeItem('teaUser');
                window.location.href = '../login.html';
            }, 1500);
            return;
        }
        
        const userId = currentUser.id;
        console.log('💾 Saving address for user:', userId);

        // Validate form data
        const name = document.getElementById('inputName').value.trim();
        const phone = document.getElementById('inputPhone').value.trim();
        const province = document.getElementById('inputProvince').value.trim();
        const district = document.getElementById('inputDistrict').value.trim();
        const ward = document.getElementById('inputWard').value.trim();
        const street = document.getElementById('inputStreet').value.trim();
        const isDefault = document.getElementById('inputDefault').checked;
        
        if (!name || !phone || !province || !district || !ward || !street) {
            showToast('Vui lòng điền đầy đủ thông tin', 'error');
            return;
        }
        
        if (!/^[0-9]{10}$/.test(phone)) {
            showToast('Số điện thoại không hợp lệ (10 số)', 'error');
            return;
        }
        
        if (!selectedProvinceCode || !selectedDistrictCode || !selectedWardCode) {
            showToast('Vui lòng chọn địa chỉ từ danh sách gợi ý', 'error');
            return;
        }
        
        const fullAddress = `${street}, ${ward}, ${district}, ${province}`;
        
        // Get address type
        const addressType = document.querySelector('.address-type-btn.active')?.dataset.type || 'home';
        
        const addressData = {
            user_id: userId,
            name: name,
            phone: phone,
            province: province,
            district: district,
            ward: ward,
            street_address: street,
            full_address: fullAddress,
            address_type: addressType,
            is_default: isDefault
        };
        
        console.log('📦 Address data to save:', addressData);
        
        // Show loading
        showAddressLoading();
        
        let savedAddress;
        
        if (isEditingAddress && editingAddressId) {
            // Update existing address
            const { data, error } = await supabaseClient
                .from('user_addresses')
                .update({
                    ...addressData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingAddressId)
                .select()
                .single();
                
            if (error) throw error;
            savedAddress = data;
            showToast('Cập nhật địa chỉ thành công', 'success');
        } else {
            // Save new address
            const { data, error } = await supabaseClient
                .from('user_addresses')
                .insert([addressData])
                .select()
                .single();
                
            if (error) throw error;
            savedAddress = data;
            showToast('Thêm địa chỉ thành công', 'success');
        }
        
        // Reload addresses
        await loadUserAddresses();
        
        // Auto-select this address if it's the only one or is default
        if (isDefault || addressManager.addresses.length === 1) {
            selectAddress(savedAddress.id);
        }
        
        // Hide form
        hideAddressForm();
        hideAddressLoading();
        
    } catch (error) {
        console.error('Error saving address:', error);
        showToast('Có lỗi xảy ra khi lưu địa chỉ: ' + error.message, 'error');
        hideAddressLoading();
    }
}

// Update checkout page address
function updateCheckoutAddress(address) {
    const addressInfo = document.getElementById('addressInfo');
    if (!addressInfo) return;
    
    if (!address) {
        addressInfo.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #999;">
                <i class="fas fa-map-marker-alt" style="font-size: 32px; margin-bottom: 10px;"></i>
                <p>Chưa có địa chỉ giao hàng</p>
                <button class="btn-change" style="margin-top: 10px;" id="addFirstAddressBtn">
                    <i class="fas fa-plus"></i> Thêm địa chỉ ngay
                </button>
            </div>
        `;
        
        // Add event listener for the button
        setTimeout(() => {
            document.getElementById('addFirstAddressBtn')?.addEventListener('click', () => {
                showAddressModal();
                showAddressForm();
            });
        }, 100);
        return;
    }
    
    addressInfo.innerHTML = `
        <div class="address-row">
            <strong>${address.name}</strong>
            <span class="phone">${address.phone}</span>
        </div>
        <p class="address-detail">${address.full_address}</p>
    `;
    
    // Store selected address for checkout
    addressManager.selectedAddress = address;
    
    // Store selected address for checkout
    addressManager.selectedAddress = address;
}

// Edit address
function editAddress(addressId) {
    // Convert to number if it's a string from data attribute
    const id = parseInt(addressId, 10);
    const address = addressManager.addresses.find(addr => addr.id === id);
    if (!address) {
        console.warn('Address not found for edit:', id, addressId);
        return;
    }
    
    isEditingAddress = true;
    editingAddressId = id;
    
    // Fill form
    document.getElementById('inputName').value = address.name;
    document.getElementById('inputPhone').value = address.phone;
    document.getElementById('inputProvince').value = address.province;
    document.getElementById('inputDistrict').value = address.district;
    document.getElementById('inputWard').value = address.ward;
    document.getElementById('inputStreet').value = address.street_address;
    document.getElementById('inputDefault').checked = address.is_default;
    
    // Enable inputs
    document.getElementById('inputDistrict').disabled = false;
    document.getElementById('inputWard').disabled = false;
    
    // Show form
    showAddressForm();
}

// Delete address
async function deleteAddress(addressId) {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    
    // Convert to number if it's a string from data attribute
    const id = parseInt(addressId, 10);
    
    try {
        showAddressLoading();
        await addressManager.deleteAddress(id);
        await loadUserAddresses();
        showToast('Đã xóa địa chỉ', 'success');
        hideAddressLoading();
    } catch (error) {
        console.error('Error deleting address:', error);
        showToast('Có lỗi xảy ra khi xóa địa chỉ', 'error');
        hideAddressLoading();
    }
}

// Select address
function selectAddress(addressId) {
    // Convert to number if it's a string from data attribute
    const id = parseInt(addressId, 10);
    const address = addressManager.addresses.find(addr => addr.id === id);
    if (!address) {
        console.warn('Address not found:', id, addressId);
        return;
    }
    
    console.log('✅ Selected address:', address);
    
    // Update UI
    document.querySelectorAll('.address-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelector(`[data-id="${addressId}"]`)?.classList.add('selected');
    
    // Update checkout page
    updateCheckoutAddress(address);
    
    // Close modal
    hideAddressModal();
    
    showToast('Đã chọn địa chỉ giao hàng', 'success');
}

// Show address loading
function showAddressLoading() {
    document.getElementById('addressLoading').style.display = 'flex';
}

// Hide address loading
function hideAddressLoading() {
    document.getElementById('addressLoading').style.display = 'none';
}

// Handle change address button
function handleChangeAddress() {
    console.log('📍 handleChangeAddress called');
    console.log('isLoggedIn:', isLoggedIn);
    
    if (!isLoggedIn) {
        showToast('Vui lòng đăng nhập để tiếp tục', 'error');
        return;
    }
    
    console.log('✅ Opening address modal');
    showAddressModal();
}

// Hàm tạo mã đơn hàng unique
function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD${timestamp}${random}`;
}

// Hàm lấy tên phương thức thanh toán
function getPaymentMethodName(value) {
    const methods = {
        'vietqr': 'VietQR',
        'credit-card': 'Thẻ tín dụng/ghi nợ',
        'cod': 'Thanh toán khi nhận hàng (COD)'
    };
    return methods[value] || value;
}

// Hàm tạo chuỗi tên sản phẩm từ giỏ hàng
function getProductNamesString(cart) {
    return cart.map(item => `${item.name} (x${item.quantity})`).join(', ');
}

// Hàm tạo đơn hàng trong Supabase
async function createOrderInSupabase(orderData) {
    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .insert([orderData])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        return data[0];
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

// Hàm cập nhật trạng thái thanh toán
async function updatePaymentStatus(orderId, paymentStatus) {
    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .update({ payment_status: paymentStatus })
            .eq('order_code', orderId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error updating payment status:', error);
        throw error;
    }
}

// ============================================
// VIETQR PAYMENT
// ============================================

// Cấu hình VietQR
const VIETQR_CONFIG = {
    CLIENT_ID: '66fa6715-6c68-4113-b1bf-cd1f23080293',
    API_KEY: '886330f3-9a00-44c2-ac4d-7b944bc67176',
    ACCOUNT_NO: '9188045135923',
    ACCOUNT_NAME: 'VONG ANH KHOI',
    ACQ_ID: 970422,
    TEMPLATE: 'compact'
};

// Tạo mã QR từ VietQR API
async function generateVietQR(amount, orderCode) {
    try {
        const response = await fetch('https://api.vietqr.io/v2/generate', {
            method: 'POST',
            headers: {
                'x-client-id': VIETQR_CONFIG.CLIENT_ID,
                'x-api-key': VIETQR_CONFIG.API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accountNo: VIETQR_CONFIG.ACCOUNT_NO,
                accountName: VIETQR_CONFIG.ACCOUNT_NAME,
                acqId: VIETQR_CONFIG.ACQ_ID,
                amount: amount,
                addInfo: `Thanh toan ${orderCode}`,
                format: 'text',
                template: VIETQR_CONFIG.TEMPLATE
            })
        });

        const data = await response.json();
        
        if (data.code === '00') {
            return {
                success: true,
                qrDataURL: data.data.qrDataURL,
                qrCode: data.data.qrCode
            };
        } else {
            throw new Error(data.desc || 'Không thể tạo mã QR');
        }
    } catch (error) {
        console.error('VietQR Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Hiển thị modal QR code
function showQRModal(qrDataURL, totalAmount, orderId) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'qr-modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'qr-modal';
    
    modal.innerHTML = `
        <div class="qr-modal-content">
            <button class="qr-modal-close" id="closeQRModal">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="qr-header">
                <div class="qr-icon">
                    <i class="fas fa-qrcode"></i>
                </div>
                <h2>Quét mã để thanh toán</h2>
                <p class="qr-subtitle">Sử dụng ứng dụng ngân hàng để quét mã QR</p>
            </div>
            
            <div class="qr-body">
                <div class="qr-image-container">
                    <img src="${qrDataURL}" alt="VietQR Code" class="qr-image">
                </div>
                
                <div class="qr-info">
                    <div class="qr-info-item">
                        <span class="label">Mã đơn hàng:</span>
                        <span class="value">${orderId}</span>
                    </div>
                    <div class="qr-info-item">
                        <span class="label">Số tiền:</span>
                        <span class="value highlight">${formatPrice(totalAmount)}</span>
                    </div>
                    <div class="qr-info-item">
                        <span class="label">Nội dung:</span>
                        <span class="value">Thanh toan ${orderId}</span>
                    </div>
                </div>
                
                <div class="qr-instructions">
                    <h3><i class="fas fa-info-circle"></i> Hướng dẫn thanh toán</h3>
                    <ol>
                        <li>Mở ứng dụng ngân hàng trên điện thoại</li>
                        <li>Chọn chức năng <strong>Quét QR</strong></li>
                        <li>Quét mã QR phía trên</li>
                        <li>Kiểm tra thông tin và xác nhận thanh toán</li>
                    </ol>
                </div>
                
                <div class="qr-timer">
                    <i class="fas fa-clock"></i>
                    <span>Mã QR có hiệu lực trong <strong id="qrTimer">15:00</strong> phút</span>
                </div>
            </div>
            
            <div class="qr-footer">
                <button class="btn-confirm-payment" id="confirmPaymentBtn">
                    <i class="fas fa-check-circle"></i>
                    Tôi đã thanh toán
                </button>
                <button class="btn-cancel-payment" id="cancelPaymentBtn">
                    Hủy
                </button>
            </div>
        </div>
    `;
    
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    
    setTimeout(() => {
        modalOverlay.classList.add('show');
        modal.classList.add('show');
    }, 10);
    
    startQRTimer();

    document.getElementById('confirmPaymentBtn').addEventListener('click', () => {
        handleConfirmPayment(modalOverlay);
    });
    
    document.getElementById('cancelPaymentBtn').addEventListener('click', () => {
        handleCancelPayment(modalOverlay);
    });
    
    document.getElementById('closeQRModal').addEventListener('click', () => {
        handleCancelPayment(modalOverlay);
    });
}

// Đếm ngược timer
function startQRTimer() {
    let timeLeft = 15 * 60;
    const timerElement = document.getElementById('qrTimer');
    
    const countdown = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(countdown);
            timerElement.textContent = 'Hết hạn';
        }
    }, 1000);
}

// Xác nhận thanh toán
async function handleConfirmPayment(modalOverlay) {
    try {
        const confirmBtn = document.getElementById('confirmPaymentBtn');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

        const orderData = window.pendingOrder;
        if (!orderData) throw new Error('Không tìm thấy thông tin đơn hàng');

        console.log('📦 Creating order from pending:', orderData);

        // Tạo đơn hàng với dữ liệu đầy đủ
        const createdOrder = await createOrderInSupabase(orderData);
        if (!createdOrder) throw new Error('Không thể tạo đơn hàng');

        console.log('✅ Order created successfully:', createdOrder);

        // Cập nhật payment status
        await updatePaymentStatus(createdOrder.order_code, 'paid');

        // Increment voucher nếu có
        if (orderData.appliedVoucher) {
            await voucherManager.incrementUsageCount(orderData.appliedVoucher.code);
            console.log('🎟️ Voucher usage incremented');
        }
        
        // Xóa dữ liệu tạm
        localStorage.removeItem('teaCart');
        localStorage.removeItem('orderNote');
        delete window.pendingOrder;
        
        // Đóng QR modal
        modalOverlay.classList.remove('show');
        setTimeout(() => modalOverlay.remove(), 300);
        
        // Hiển thị success modal
        showSuccessModal(orderData.total_amount, orderData.order_code, 'vietqr');
        
        // Cập nhật giỏ hàng
        if (typeof updateCartCount === 'function') {
            updateCartCount();
        }
        
    } catch (error) {
        console.error('❌ Confirm payment error:', error);
        showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
        
        // Reset button
        const confirmBtn = document.getElementById('confirmPaymentBtn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Tôi đã thanh toán';
        }
    }
}

// Hủy thanh toán
function handleCancelPayment(modalOverlay) {
    modalOverlay.classList.remove('show');
    setTimeout(() => modalOverlay.remove(), 300);
    delete window.pendingOrder;
    showToast('Đã hủy thanh toán', 'info');
}

function updateOrderSummary() {
    const subtotal = calculateSubtotal();
    let shipping = currentShippingFee;
    
    // Calculate voucher discount
    const appliedVoucher = voucherManager?.getAppliedVoucher();
    let productDiscount = 0;
    let shippingDiscount = 0;
    
    if (appliedVoucher) {
        const discountType = voucherManager.getDiscountType(appliedVoucher);
        
        if (discountType === 'shipping') {
            // Chỉ giảm phí ship
            shippingDiscount = voucherManager.calculateDiscount(appliedVoucher, subtotal, shipping);
            shipping = Math.max(0, shipping - shippingDiscount);
        } else {
            // Giảm trên sản phẩm (percentage hoặc fixed)
            productDiscount = voucherManager.calculateDiscount(appliedVoucher, subtotal, shipping);
        }
    }
    
    // Calculate total: subtotal + shipping - product_discount
    // (shipping discount đã được trừ khỏi shipping)
    const total = subtotal - productDiscount + shipping;

    // Update all summary sections
    document.querySelectorAll('.summary-row').forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes('tổng tiền hàng') || text.includes('tạm tính')) {
            row.querySelector('span:last-child').textContent = formatPrice(subtotal);
        } else if (text.includes('phí vận chuyển')) {
            row.querySelector('span:last-child').textContent = formatPrice(shipping);
        } else if (text.includes('giảm giá')) {
            const discountSpan = row.querySelector('span:last-child');
            const displayDiscount = productDiscount + shippingDiscount;
            if (displayDiscount > 0) {
                discountSpan.textContent = '-' + formatPrice(displayDiscount);
                row.style.display = 'flex';
            } else {
                row.style.display = 'none';
            }
        }
    });

    // Update payment summary on the right
    const rightSummaryItems = document.querySelectorAll('.summary-item');
    rightSummaryItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes('tạm tính')) {
            item.querySelector('span:last-child').textContent = formatPrice(subtotal);
        } else if (text.includes('phí vận chuyển')) {
            item.querySelector('span:last-child').textContent = formatPrice(shipping);
        } else if (text.includes('giảm giá')) {
            const discountSpan = item.querySelector('span:last-child');
            const displayDiscount = productDiscount + shippingDiscount;
            if (displayDiscount > 0) {
                discountSpan.textContent = '-' + formatPrice(displayDiscount);
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        }
    });

    document.querySelectorAll('.total-amount, .total-price').forEach(el => {
        el.textContent = formatPrice(total);
    });
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

// ====== SUCCESS MODAL ======
function showSuccessModal(orderTotal, orderId, paymentMethod) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'success-modal-overlay';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'success-modal';
    
    // Lấy tên phương thức thanh toán
    const paymentMethodName = getPaymentMethodName(paymentMethod);
    
    // Xác định trạng thái thanh toán
    const paymentStatusText = paymentMethod === 'cod' 
        ? 'Thanh toán khi nhận hàng' 
        : 'Chờ thanh toán';
    
    const paymentStatusClass = paymentMethod === 'cod' 
        ? 'status-pending' 
        : 'status-pending';
    
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
                    <span class="value" style="color: #2D5016; font-weight: 700;">#${orderId}</span>
                </div>
                <div class="order-info-item">
                    <span class="label">Phương thức thanh toán:</span>
                    <span class="value">${paymentMethodName}</span>
                </div>
                <div class="order-info-item">
                    <span class="label">Trạng thái thanh toán:</span>
                    <span class="value">
                        <span class="status-badge ${paymentStatusClass}" style="padding: 4px 12px; border-radius: 12px; font-size: 0.85rem;">
                            ${paymentStatusText}
                        </span>
                    </span>
                </div>
                <div class="order-info-item">
                    <span class="label">Tổng thanh toán:</span>
                    <span class="value highlight">${formatPrice(orderTotal)}</span>
                </div>
            </div>
            
            <div class="success-actions">
                <button class="btn-view-order" onclick="window.location.href='../dropdown/history/history.html'">
                    <i class="fas fa-receipt"></i>
                    Xem đơn hàng
                </button>
                <button class="btn-continue-shopping" onclick="window.location.href='../index.html'">
                    <i class="fas fa-shopping-bag"></i>
                    Tiếp tục mua sắm
                </button>
            </div>
        </div>
    `;
    
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    
    // Trigger animation
    setTimeout(() => {
        modalOverlay.classList.add('show');
        setTimeout(() => modal.classList.add('show'), 100);
    }, 100);
}

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const changeAddressBtn = document.getElementById('changeAddressBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const orderNote = document.getElementById('orderNote');
    const paymentOptions = document.querySelectorAll('input[name="payment"]');
    const productsList = document.getElementById('productsList');

    // Load cart from localStorage (from main.js)

    // Initialize
    init();

    async function init() {
        console.log('🚀 Checkout init started...');
        await initAuth();

        if (!currentUser) {
            console.error('❌ Init failed: No user');
            return;
        }
        console.log('✅ Init with user:', currentUser.id);

        loadCartFromStorage();
        console.log('📦 Cart loaded:', cart.length, 'items');
        
        // Khởi tạo address manager TRƯỚC khi render
        await initAddressManager();
        console.log('📍 Address Manager initialized');
        
        // Khởi tạo voucher manager SAU khi có cart
        await initVoucherManager();
        console.log('🎟️ Voucher Manager initialized');
        
        // Cập nhật UI
        updatePaymentSubtitle();
        renderCartProducts();
        console.log('🖼️ Cart UI rendered');
        
        updateOrderSummary();
        console.log('💰 Order summary updated');
        
        setupEventListeners();
        console.log('🎯 Event listeners attached');
        
        console.log('✅ Init completed successfully!');
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
        // Không hiển thị demo address nữa, chỉ hiển thị "Chưa có địa chỉ"
        // Demo address sẽ được thay thế bởi loadUserAddresses() khi khởi tạo
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

        productsList.innerHTML = cart.map(item => {
            // Lấy thông tin sản phẩm từ productsData
            const productInfo = typeof productsData !== 'undefined' 
                ? productsData.find(p => p.id === item.id)
                : null;
            
            // Sử dụng dữ liệu từ productsData, nếu không có thì dùng dữ liệu từ cart
            const name = productInfo?.name || item.name;
            const image = productInfo?.image ? '../' + productInfo.image : '../src/Tra-phu-hoi-1.jpg';
            const category = productInfo?.category || 'Trà';
            
            return `
                <div class="product-item">
                    <div class="product-image">
                        <img src="${image}" alt="${name}" onerror="this.src='../src/Hu-tra-phu-hoi.jpg'">
                    </div>
                    <div class="product-details">
                        <h4 class="product-name">${name}</h4>
                        <p class="product-variant">Phân loại: ${category}</p>
                        <div class="product-bottom">
                            <span class="product-quantity">x${item.quantity}</span>
                            <span class="product-price">${formatPrice(item.price)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        updateOrderSummary();
    }

    // ====== EVENT LISTENERS ======
    function setupEventListeners() {
        console.log('📌 Setting up event listeners...');
        console.log('changeAddressBtn:', changeAddressBtn);
        
        if (changeAddressBtn) {
            changeAddressBtn.addEventListener('click', handleChangeAddress);
            console.log('✅ Change address listener attached');
        } else {
            console.warn('⚠️ changeAddressBtn not found!');
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
        // BƯỚC 1: Validate dữ liệu đầu vào
        if (cart.length === 0) {
            showToast('Giỏ hàng trống!', 'error');
            return;
        }

        if (!isLoggedIn || !currentUser) {
            showToast('Vui lòng đăng nhập để tiếp tục', 'error');
            setTimeout(() => window.location.href = '../login.html', 1500);
            return;
        }

        // Kiểm tra địa chỉ giao hàng
        const selectedAddress = addressManager?.selectedAddress || addressManager?.getDefaultAddress();
        if (!selectedAddress) {
            showToast('Vui lòng chọn địa chỉ giao hàng', 'error');
            showAddressModal();
            return;
        }

        const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
        if (!paymentMethod) {
            showToast('Vui lòng chọn phương thức thanh toán', 'error');
            return;
        }

        // BƯỚC 2: Hiển thị trạng thái loading
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

        try {
            // BƯỚC 3: Tính toán tổng tiền
            const subtotal = calculateSubtotal();
            let shipping = currentShippingFee;
            
            // Calculate voucher discount
            const appliedVoucher = voucherManager?.getAppliedVoucher();
            let productDiscount = 0;
            let shippingDiscount = 0;
            
            if (appliedVoucher) {
                const discountType = voucherManager.getDiscountType(appliedVoucher);
                
                if (discountType === 'shipping') {
                    // Chỉ giảm phí ship
                    shippingDiscount = voucherManager.calculateDiscount(appliedVoucher, subtotal, shipping);
                    shipping = Math.max(0, shipping - shippingDiscount);
                } else {
                    // Giảm trên sản phẩm (percentage hoặc fixed)
                    productDiscount = voucherManager.calculateDiscount(appliedVoucher, subtotal, shipping);
                }
            }
            
            const totalAmount = subtotal - productDiscount + shipping;
            const totalDiscount = productDiscount + shippingDiscount;

            // BƯỚC 4: Tạo dữ liệu đơn hàng
            const orderId = generateOrderId();
            const productNames = getProductNamesString(cart);
            const note = orderNote?.value || '';

            const orderData = {
                order_code: orderId,
                product_name: productNames,
                username: selectedAddress.name,
                email: currentUser.email,
                phone: selectedAddress.phone,
                shipping_address: selectedAddress.full_address,
                order_status: 'pending',
                total_amount: totalAmount,
                shipping_fee: shipping,
                discount_amount: totalDiscount,
                voucher_code: appliedVoucher?.code || null,
                tracking_link: '',
                payment_method: getPaymentMethodName(paymentMethod),
                payment_status: 'pending',
                note: note,
            };

            // BƯỚC 5: Tạo mã QR nếu là VietQR (TRƯỚC khi lưu đơn hàng)
            let qrResult = null;
            if (paymentMethod === 'vietqr') {
                qrResult = await generateVietQR(totalAmount, orderId);
                if (!qrResult.success) {
                    throw new Error(qrResult.error);
                }
                console.log('✅ VietQR generated successfully');
            }

            // BƯỚC 6: Xử lý theo phương thức thanh toán
            if (paymentMethod === 'vietqr') {
                // Với VietQR: Lưu thông tin đơn hàng tạm, chưa lưu vào DB
                // Chỉ lưu vào DB khi user xác nhận thanh toán
                checkoutBtn.disabled = false;
                checkoutBtn.innerHTML = '<i class="fas fa-lock"></i> Thanh toán ngay';

                // Lưu đầy đủ thông tin đơn hàng để tạo sau khi thanh toán
                window.pendingOrder = {
                    ...orderData,
                    appliedVoucher: appliedVoucher
                };
                
                console.log('💾 Pending order saved:', window.pendingOrder);

                // Hiển thị QR modal
                showQRModal(qrResult.qrDataURL, totalAmount, orderId);
                return;

            } else {
                // Với credit card và COD: Tạo đơn hàng ngay
                console.log('💾 Creating order with data:', orderData);
                const createdOrder = await createOrderInSupabase(orderData);

                if (!createdOrder) {
                    throw new Error('Không thể tạo đơn hàng');
                }

                console.log('✅ Order created successfully:', createdOrder);

                // BƯỚC 7: Increment voucher usage nếu có
                if (appliedVoucher) {
                    await voucherManager.incrementUsageCount(appliedVoucher.code);
                }

                // BƯỚC 8: Xử lý thanh toán theo phương thức
                if (paymentMethod === 'credit-card') {
                    await handleCreditCardPayment(createdOrder);
                } else if (paymentMethod === 'cod') {
                    await handleCODPayment(createdOrder);
                }
            }

            // BƯỚC 8: Xóa giỏ hàng và dữ liệu tạm
            localStorage.removeItem('teaCart');
            localStorage.removeItem('orderNote');

            // BƯỚC 9: Hiển thị modal thành công
            showSuccessModal(totalAmount, orderId, paymentMethod);

            // BƯỚC 10: Cập nhật lại giỏ hàng
            if (typeof updateCartCount === 'function') {
                updateCartCount();
            }

        } catch (error) {
            console.error('Checkout error:', error);
            showToast('Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.', 'error');
            
            // Reset button
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = '<i class="fas fa-lock"></i> Thanh toán ngay';
        }
    }

    // ====== XỬ LÝ THANH TOÁN THEO PHƯƠNG THỨC ======

    // Thanh toán thẻ tín dụng
    async function handleCreditCardPayment(order) {
        // Simulate payment gateway processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Trong thực tế, bạn sẽ tích hợp với payment gateway như:
        // - Stripe
        // - PayPal
        // - OnePay
        // - VNPay
        
        console.log('Credit card payment initiated for order:', order.order_id);
        
        // Ví dụ redirect (uncomment khi có payment gateway):
        // window.location.href = `card-payment.html?orderId=${order.order_id}&amount=${order.total_amount}`;
    }

    // Thanh toán COD
    async function handleCODPayment(order) {
        // COD không cần xử lý thanh toán ngay
        // payment_status sẽ giữ ở 'pending' cho đến khi giao hàng thành công
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('COD order created:', order.order_id);
        
        // Có thể gửi email xác nhận đơn hàng ở đây
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