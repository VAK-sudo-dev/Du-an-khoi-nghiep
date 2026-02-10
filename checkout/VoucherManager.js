// ============================================
// VOUCHER MANAGER CLASS
// ============================================

class VoucherManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.appliedVoucher = null;
        this.availableVouchers = [];
    }

    // Lấy danh sách voucher khả dụng từ Supabase
    async getAvailableVouchers() {
        try {
            const { data, error } = await this.supabase
                .from('vouchers')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            this.availableVouchers = data || [];
            return this.availableVouchers;
        } catch (error) {
            console.error('Error fetching vouchers:', error);
            return [];
        }
    }

    // Kiểm tra và validate voucher
    async validateVoucher(code, subtotal = 0) {
        try {
            const { data, error } = await this.supabase
                .from('vouchers')
                .select('*')
                .eq('code', code.toUpperCase())
                .eq('is_active', true)
                .single();

            if (error || !data) {
                return {
                    valid: false,
                    message: 'Mã giảm giá không tồn tại hoặc đã hết hạn'
                };
            }

            // Check ngày hết hạn
            if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
                return {
                    valid: false,
                    message: 'Mã giảm giá đã hết hạn'
                };
            }

            // Check giá trị tối thiểu đơn hàng
            if (data.min_order_value && subtotal < data.min_order_value) {
                return {
                    valid: false,
                    message: `Đơn hàng phải từ ${this.formatPrice(data.min_order_value)} để áp dụng mã này`
                };
            }

            // Check số lần sử dụng
            if (data.usage_limit && data.usage_count >= data.usage_limit) {
                return {
                    valid: false,
                    message: 'Mã giảm giá đã hết lượt sử dụng'
                };
            }

            return {
                valid: true,
                voucher: data,
                message: 'Mã giảm giá hợp lệ'
            };
        } catch (error) {
            console.error('Error validating voucher:', error);
            return {
                valid: false,
                message: 'Có lỗi xảy ra khi kiểm tra mã giảm giá'
            };
        }
    }

    // Áp dụng voucher
    applyVoucher(voucher) {
        this.appliedVoucher = voucher;
        console.log('✅ Voucher applied:', voucher.code);
    }

    // Xóa voucher đã áp dụng
    removeVoucher() {
        this.appliedVoucher = null;
        console.log('❌ Voucher removed');
    }

    // Lấy voucher đã áp dụng
    getAppliedVoucher() {
        return this.appliedVoucher;
    }

    // Tính toán discount
    calculateDiscount(voucher, subtotal, shippingFee = 0) {
        if (!voucher) return 0;

        let discount = 0;

        if (voucher.discount_type === 'percentage') {
            // Giảm theo phần trăm (chỉ trên subtotal)
            discount = (subtotal * voucher.discount_value) / 100;
            
            // Áp dụng max_discount nếu có
            if (voucher.max_discount && discount > voucher.max_discount) {
                discount = voucher.max_discount;
            }
        } else if (voucher.discount_type === 'fixed') {
            // Giảm cố định (chỉ trên subtotal)
            discount = Math.min(voucher.discount_value, subtotal);
        } else if (voucher.discount_type === 'shipping') {
            // Giảm phí ship
            discount = Math.min(voucher.discount_value, shippingFee);
        }

        return Math.max(0, discount);
    }

    // Xác định loại discount
    getDiscountType(voucher) {
        if (!voucher) return 'none';
        
        if (voucher.discount_type === 'shipping' || 
            voucher.code.includes('FREESHIP') || 
            voucher.code.includes('SHIP')) {
            return 'shipping';
        }
        
        return voucher.discount_type;
    }

    // Tăng số lần sử dụng voucher
    async incrementUsageCount(code) {
        try {
            const { data, error } = await this.supabase
                .from('vouchers')
                .select('usage_count')
                .eq('code', code)
                .single();

            if (error) throw error;

            const newCount = (data?.usage_count || 0) + 1;

            const { error: updateError } = await this.supabase
                .from('vouchers')
                .update({ usage_count: newCount })
                .eq('code', code);

            if (updateError) throw updateError;
            
            console.log('✅ Usage count updated for:', code);
        } catch (error) {
            console.error('Error incrementing usage count:', error);
        }
    }

    // Mô tả voucher
    getVoucherDescription(voucher) {
        if (!voucher) return '';

        if (voucher.discount_type === 'percentage') {
            return `Giảm ${voucher.discount_value}%${voucher.max_discount ? ` (tối đa ${this.formatPrice(voucher.max_discount)})` : ''}`;
        } else if (voucher.discount_type === 'fixed') {
            return `Giảm ${this.formatPrice(voucher.discount_value)}`;
        } else if (voucher.discount_type === 'shipping') {
            return `Miễn phí vận chuyển${voucher.discount_value < 1000000 ? ` (${this.formatPrice(voucher.discount_value)})` : ''}`;
        }

        return voucher.description || '';
    }

    // Format giá tiền
    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    }
}
