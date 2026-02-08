/* ========================================
   SUPABASE CONFIGURATION
   Thay đổi các giá trị bên dưới bằng thông tin từ Supabase Dashboard
======================================== */

const SUPABASE_CONFIG = {
    // Project URL từ Settings > API
    SUPABASE_URL: 'https://xcrkjlbwcuudunkgzwcd.supabase.co',
    
    // anon/public key từ Settings > API
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcmtqbGJ3Y3V1ZHVua2d6d2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzEzNzcsImV4cCI6MjA4NjA0NzM3N30.GzKI8QesLlfjwDZA_InKeVrfAr7jqnkdNFd4QX-yGaI'
};

// Khởi tạo Supabase client
const { createClient } = supabase;

// Tạo cả 2 biến để tương thích
const supabaseClient = createClient(
    SUPABASE_CONFIG.SUPABASE_URL,
    SUPABASE_CONFIG.SUPABASE_ANON_KEY
);

// Backup vào window để dùng ở file khác
window.supabaseClient = supabaseClient;

console.log('✅ Supabase initialized');