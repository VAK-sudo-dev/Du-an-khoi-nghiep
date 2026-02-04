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
        price: 3600000,
        image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect fill="%233A7D44" width="400" height="400"/><circle cx="200" cy="200" r="120" fill="%236FBF73" opacity="0.3"/><text x="50%" y="50%" font-size="20" fill="white" text-anchor="middle" dy=".3em">Sencha</text></svg>',
        description: 'Trà Phú Hội - Mô tả ngắn',
        badge: 'Bán chạy',
        stock: 50
    }
];

// Export để sử dụng trong các file khác
if (typeof module !== 'undefined' && module.exports) {
    module.exports = productsData;
}