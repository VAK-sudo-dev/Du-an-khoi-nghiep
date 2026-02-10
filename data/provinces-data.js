// provinces-data.js
const vietnamProvinces = {
    "Đồng Nai": {
        districts: {
            "Biên Hòa": ["Bửu Hòa", "Bửu Long", "Hố Nai", "Tam Hiệp", "Tân Biên", "Tân Mai", "Tân Phong", "Thống Nhất", "Trảng Dài", "Quyết Thắng"],
            "Long Khánh": ["Phú Bình", "Xuân Bình", "Xuân Hòa", "Xuân Thanh", "Xuân Trung"],
            "Thống Nhất": ["Bàu Hàm 2", "Dầu Giây", "Gia Kiệm", "Gia Tân 1", "Hưng Lộc"],
            "Nhơn Trạch": ["Đại Phước", "Hiệp Phước", "Long Tân", "Phú Đông", "Phú Hội", "Phú Hữu", "Phú Thạnh", "Vĩnh Thanh"],
            "Trảng Bom": ["An Viễn", "Bắc Sơn", "Bàu Hàm", "Cây Gáo", "Đông Hòa", "Đồi 61"],
            "Tân Phú": ["Dak Lua", "Núi Tượng", "Phú Lập", "Phú Trung", "Phú Xuân", "Tà Lài"],
            "Vĩnh Cửu": ["Bình Hòa", "Bình Lợi", "Hiếu Liêm", "Mã Đà", "Phú Lý", "Thạnh Phú"],
            "Định Quán": ["La Ngà", "Phú Cường", "Phú Hòa", "Phú Ngọc", "Phú Tân", "Suối Nho"],
            "Long Thành": ["An Phước", "Bàu Cạn", "Bình An", "Bình Sơn", "Cẩm Đường", "Long Đức"],
            "Xuân Lộc": ["Bảo Hoà", "Bảo Vinh", "Gia Ray", "Suối Cao", "Xuân Bắc", "Xuân Định"],
            "Cẩm Mỹ": ["Lâm San", "Nhân Nghĩa", "Sông Nhạn", "Sông Trầu", "Xuân Quế"]
        }
    },
    "TP. Hồ Chí Minh": {
        districts: {
            "Quận 1": ["Bến Nghé", "Bến Thành", "Cầu Kho", "Cầu Ông Lãnh", "Cô Giang", "Đa Kao", "Nguyễn Cư Trinh", "Nguyễn Thái Bình", "Phạm Ngũ Lão", "Tân Định"],
            "Quận 2": ["An Khánh", "An Lợi Đông", "An Phú", "Bình An", "Bình Khánh", "Bình Trưng Đông", "Bình Trưng Tây", "Cát Lái", "Thạnh Mỹ Lợi", "Thảo Điền", "Thủ Thiêm"],
            "Quận 3": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14"],
            "Quận 4": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 8", "Phường 9", "Phường 10", "Phường 13", "Phường 14", "Phường 15", "Phường 16", "Phường 18"],
            "Quận 5": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15"],
            "Quận 7": ["Bình Thuận", "Phú Mỹ", "Phú Thuận", "Tân Hưng", "Tân Kiểng", "Tân Phong", "Tân Phú", "Tân Quy", "Tân Thuận Đông", "Tân Thuận Tây"],
            "Thủ Đức": ["An Khánh", "An Lợi Đông", "An Phú", "Bình Chiểu", "Bình Thọ", "Cát Lái", "Hiệp Bình Chánh", "Hiệp Bình Phước", "Linh Chiểu", "Linh Đông"],
            // ... Thêm các quận khác
        }
    },
    "Hà Nội": {
        districts: {
            "Ba Đình": ["Cống Vị", "Điện Biên", "Đội Cấn", "Giảng Võ", "Kim Mã", "Liễu Giai", "Ngọc Hà", "Ngọc Khánh", "Nguyễn Trung Trực", "Phúc Xá", "Quán Thánh", "Thành Công", "Trúc Bạch", "Vĩnh Phúc"],
            "Hoàn Kiếm": ["Chương Dương Độ", "Cửa Đông", "Cửa Nam", "Đồng Xuân", "Hàng Bạc", "Hàng Bài", "Hàng Bồ", "Hàng Bông", "Hàng Buồm", "Hàng Đào"],
            "Hai Bà Trưng": ["Bạch Đằng", "Bùi Thị Xuân", "Đống Mác", "Lê Đại Hành", "Minh Khai", "Ngô Thì Nhậm", "Phạm Đình Hổ", "Phố Huế", "Quỳnh Lôi", "Thanh Lương"],
            // ... Thêm các quận khác
        }
    },
    // Thêm các tỉnh khác...
    "Đà Nẵng": {
        districts: {
            "Hải Châu": ["Bình Hiên", "Bình Thuận", "Hải Châu 1", "Hải Châu 2", "Hòa Cường Bắc", "Hòa Cường Nam", "Hòa Thuận Đông", "Hòa Thuận Tây", "Nam Dương", "Phước Ninh", "Thạch Thang", "Thanh Bình", "Thuận Phước"],
            "Thanh Khê": ["An Khê", "Chính Gián", "Hòa Khê", "Tam Thuận", "Tân Chính", "Thanh Khê Đông", "Thanh Khê Tây", "Thạc Gián", "Vĩnh Trung", "Xuân Hà"],
            // ... Thêm các quận khác
        }
    }
};