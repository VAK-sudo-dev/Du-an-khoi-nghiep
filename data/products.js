/* ============================================
   PRODUCT DATA
   Data cho sản phẩm
   ============================================ */

const productsData = [
    // TRÀ
    {
        id: 1,
        name: 'Trà Phú Hội',
        category: 'green',
        price: 200000,
        image: 'src/Tra-phu-hoi-1.jpg',
        description: 'Trà Phú Hội - Mô tả ngắn',
        badge: 'Bán chạy',
        stock: 50
    }
];

// Export để sử dụng trong các file khác
if (typeof module !== 'undefined' && module.exports) {
    module.exports = productsData;
}