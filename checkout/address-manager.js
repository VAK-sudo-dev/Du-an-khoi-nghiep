// ============================================
// ADDRESS MANAGEMENT MODULE
// ============================================

class AddressManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.currentUser = null;
        this.addresses = [];
        this.selectedAddress = null;
        this.vietnamData = null;
    }

    // Load dữ liệu địa chỉ Việt Nam từ API
    async loadVietnamData() {
        try {
            const response = await fetch('https://provinces.open-api.vn/api/?depth=3');
            this.vietnamData = await response.json();
            return this.vietnamData;
        } catch (error) {
            console.error('Error loading Vietnam data:', error);
            return null;
        }
    }

    // Lấy danh sách địa chỉ của user
    async getUserAddresses(userId) {
        try {
            const { data, error } = await this.supabase
                .from('user_addresses')
                .select('*')
                .eq('user_id', userId)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            this.addresses = data || [];
            return this.addresses;
        } catch (error) {
            console.error('Error fetching addresses:', error);
            return [];
        }
    }

    // Lấy địa chỉ mặc định
    getDefaultAddress() {
        return this.addresses.find(addr => addr.is_default) || this.addresses[0] || null;
    }

    // Lưu địa chỉ mới
    async saveAddress(addressData) {
        try {
            // Nếu là địa chỉ mặc định, bỏ default của các địa chỉ khác
            if (addressData.is_default) {
                await this.supabase
                    .from('user_addresses')
                    .update({ is_default: false })
                    .eq('user_id', addressData.user_id);
            }

            const { data, error } = await this.supabase
                .from('user_addresses')
                .insert([addressData])
                .select()
                .single();

            if (error) throw error;

            // Cập nhật danh sách địa chỉ
            this.addresses.push(data);
            return data;
        } catch (error) {
            console.error('Error saving address:', error);
            throw error;
        }
    }

    // Cập nhật địa chỉ
    async updateAddress(id, addressData) {
        try {
            // Nếu là địa chỉ mặc định, bỏ default của các địa chỉ khác
            if (addressData.is_default) {
                await this.supabase
                    .from('user_addresses')
                    .update({ is_default: false })
                    .eq('user_id', addressData.user_id)
                    .neq('id', id);
            }

            const { data, error } = await this.supabase
                .from('user_addresses')
                .update({...addressData, updated_at: new Date().toISOString()})
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Cập nhật danh sách địa chỉ
            const index = this.addresses.findIndex(addr => addr.id === id);
            if (index !== -1) {
                this.addresses[index] = data;
            }

            return data;
        } catch (error) {
            console.error('Error updating address:', error);
            throw error;
        }
    }

    // Xóa địa chỉ
    async deleteAddress(id) {
        try {
            const { error } = await this.supabase
                .from('user_addresses')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Cập nhật danh sách địa chỉ
            this.addresses = this.addresses.filter(addr => addr.id !== id);
            return true;
        } catch (error) {
            console.error('Error deleting address:', error);
            throw error;
        }
    }

    // Tìm kiếm tỉnh/thành phố
    searchProvinces(query) {
        if (!this.vietnamData || !query) return [];
        
        return this.vietnamData.filter(province => 
            this.removeVietnameseTones(province.name.toLowerCase())
                .includes(this.removeVietnameseTones(query.toLowerCase()))
        );
    }

    // Tìm kiếm quận/huyện
    searchDistricts(provinceCode, query) {
        if (!this.vietnamData || !provinceCode) return [];
        
        const province = this.vietnamData.find(p => p.code === provinceCode);
        if (!province) return [];

        if (!query) return province.districts;

        return province.districts.filter(district =>
            this.removeVietnameseTones(district.name.toLowerCase())
                .includes(this.removeVietnameseTones(query.toLowerCase()))
        );
    }

    // Tìm kiếm phường/xã
    searchWards(districtCode, query) {
        if (!this.vietnamData || !districtCode) return [];

        for (const province of this.vietnamData) {
            const district = province.districts.find(d => d.code === districtCode);
            if (district) {
                if (!query) return district.wards;
                
                return district.wards.filter(ward =>
                    this.removeVietnameseTones(ward.name.toLowerCase())
                        .includes(this.removeVietnameseTones(query.toLowerCase()))
                );
            }
        }
        return [];
    }

    // Xóa dấu tiếng Việt
    removeVietnameseTones(str) {
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
        str = str.replace(/đ/g, 'd');
        str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
        str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
        str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
        str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
        str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
        str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
        str = str.replace(/Đ/g, 'D');
        return str;
    }
}