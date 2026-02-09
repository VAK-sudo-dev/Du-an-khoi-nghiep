// blog.js - JavaScript riêng cho trang blog
document.addEventListener('DOMContentLoaded', () => {
    // Không cần re-init các chức năng đã có trong main.js
    // Chỉ thêm chức năng đặc biệt cho blog nếu cần
    
    console.log('Blog page loaded');
    
    // Xử lý share buttons
    initShareButtons();
});

function initShareButtons() {
    const shareButtons = document.querySelectorAll('.share-btn');
    
    shareButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const platform = btn.classList.contains('facebook') ? 'facebook' :
                           btn.classList.contains('twitter') ? 'twitter' :
                           btn.classList.contains('linkedin') ? 'linkedin' : 'email';
            
            shareOnPlatform(platform);
        });
    });
}

function shareOnPlatform(platform) {
    const url = window.location.href;
    const title = document.title;
    
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`
    };
    
    if (platform === 'email') {
        window.location.href = shareUrls[platform];
    } else {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
}