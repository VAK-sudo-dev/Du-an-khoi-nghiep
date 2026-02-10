// Fix voucher logic
document.addEventListener('DOMContentLoaded', function() {
    // Override voucher manager methods
    if (window.VoucherManager) {
        console.log('✅ Patching VoucherManager...');
        
        // Store original calculateDiscount
        const originalCalculateDiscount = VoucherManager.prototype.calculateDiscount;
        
        // Override with fixed version
        VoucherManager.prototype.calculateDiscount = function(voucher, subtotal, shippingFee = 0) {
            if (!voucher) return 0;
            
            let discount = 0;
            
            if (voucher.discount_type === 'percentage') {
                discount = (subtotal * voucher.discount_value) / 100;
                if (voucher.max_discount && discount > voucher.max_discount) {
                    discount = voucher.max_discount;
                }
            } else if (voucher.discount_type === 'fixed') {
                discount = Math.min(voucher.discount_value, subtotal);
            } else if (voucher.discount_type === 'shipping') {
                discount = Math.min(voucher.discount_value, shippingFee);
            }
            
            return Math.max(0, discount);
        };
        
        // Add helper method
        VoucherManager.prototype.isFreeShipping = function(voucher) {
            return voucher && (
                voucher.discount_type === 'shipping' ||
                voucher.code.includes('FREESHIP') ||
                voucher.code.includes('SHIP')
            );
        };
    }
});