/* ============================================
   PRODUCT DATA
   Data cho sản phẩm
   ============================================ */

const productsData = [
    // TRÀ
    {
        id: 1,
        name: 'Trà Phú Hội (Hộp 200g)',
        category: 'green',
        price: 200000,
        image: 'src/Hu-tra-phu-hoi.jpg',
        description: 'Trà Phú Hội - Mô tả ngắn',
        badge: 'Bán chạy',
        stock: 50
    },

    {
        id: 2,
        name: 'Trà Phú Hội Vị Gừng (Hộp 200g)',
        category: 'green',
        price: 200000,
        image: 'src/Hu-tra-vi-gung.jpg',
        description: 'Trà Phú Hội - Vị Gừng',
        stock: 50
    }, 

    {
        id: 3,
        name: 'Trà Phú Hội (Túi 500g)',
        category: 'green',
        price: 450000,
        image: 'src/Goi-tra-phu-hoi.jpg',
        description: 'Trà Phú Hội - Mô tả ngắn',
        stock: 50
    }
];

// Export để sử dụng trong các file khác
if (typeof module !== 'undefined' && module.exports) {
    module.exports = productsData;
}