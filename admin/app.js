// ========================================
// ADMIN DASHBOARD - MAIN APPLICATION
// ========================================

const SUPABASE_URL = 'https://xcrkjlbwcuudunkgzwcd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcmtqbGJ3Y3V1ZHVua2d6d2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzEzNzcsImV4cCI6MjA4NjA0NzM3N30.GzKI8QesLlfjwDZA_InKeVrfAr7jqnkdNFd4QX-yGaI'

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)

async function checkConnection() {
  const { error } = await supabaseClient
    .from('orders')
    .select('*')
    .limit(1)

  if (error) {
    return { success: false, message: error.message }
  }
  return { success: true, message: 'Kết nối Supabase thành công' }
}

// ========================================
// DATABASE FUNCTIONS
// ========================================

async function fetchOrders() {
  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('❌ Lỗi khi fetch orders:', error)
    return { success: false, error: error.message, data: [] }
  }
}

async function updateOrderStatus(id, newStatus) {
  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .update({ order_status: newStatus })
      .eq('id', id)
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error('❌ Lỗi khi update order status:', error)
    return { success: false, error: error.message }
  }
}

async function updatePaymentStatus(id, newStatus) {
  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .update({ payment_status: newStatus })
      .eq('id', id)
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error('❌ Lỗi khi update payment status:', error)
    return { success: false, error: error.message }
  }
}

async function updateTrackingLink(id, newLink) {
  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .update({ tracking_link: newLink || null })
      .eq('id', id)
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error('❌ Lỗi khi update tracking link:', error)
    return { success: false, error: error.message }
  }
}

function subscribeToOrders(callback) {
  const subscription = supabaseClient
    .channel('orders_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders'
      },
      callback
    )
    .subscribe()

  return subscription
}


// Global state
let ordersData = []
let realtimeSubscription = null

// DOM Elements
const elements = {
    sidebar: document.getElementById('sidebar'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    pageTitle: document.getElementById('page-title'),
    refreshBtn: document.getElementById('refresh-btn'),
    loadingSkeleton: document.getElementById('loading-skeleton'),
    ordersContainer: document.getElementById('orders-container'),
    ordersTbody: document.getElementById('orders-tbody'),
    emptyState: document.getElementById('empty-state'),
    toastContainer: document.getElementById('toast-container'),
    connectionStatus: document.getElementById('connection-status'),
    navItems: document.querySelectorAll('.nav-item')
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Khởi động Admin Dashboard...')
    
    // Setup event listeners
    setupEventListeners()
    
    // Check connection
    await checkSupabaseConnection()
    
    // Load initial data
    await loadOrders()
    
    // Setup realtime subscription
    setupRealtimeSubscription()
})

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Mobile menu toggle
    elements.mobileMenuBtn.addEventListener('click', () => {
        elements.sidebar.classList.toggle('open')
    })

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
            if (!elements.sidebar.contains(e.target) && 
                !elements.mobileMenuBtn.contains(e.target)) {
                elements.sidebar.classList.remove('open')
            }
        }
    })

    // Navigation items
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all
            elements.navItems.forEach(nav => nav.classList.remove('active'))
            // Add active class to clicked item
            item.classList.add('active')
            
            // Close mobile menu
            if (window.innerWidth <= 1024) {
                elements.sidebar.classList.remove('open')
            }

            // Handle database switch (for future expansion)
            const dbType = item.getAttribute('data-db')
            handleDatabaseSwitch(dbType)
        })
    })

    // Refresh button
    elements.refreshBtn.addEventListener('click', async () => {
        const icon = elements.refreshBtn.querySelector('.refresh-icon')
        icon.style.animation = 'spin 0.6s linear'
        
        await loadOrders()
        
        setTimeout(() => {
            icon.style.animation = ''
        }, 600)
    })
}

// ========================================
// SUPABASE CONNECTION
// ========================================

async function checkSupabaseConnection() {
    const statusDot = elements.connectionStatus.querySelector('.status-dot')
    const statusText = elements.connectionStatus.querySelector('.status-text')
    
    const result = await checkConnection()
    
    if (result.success) {
        statusDot.classList.add('connected')
        statusText.textContent = 'Đã kết nối'
        console.log('✅', result.message)
    } else {
        statusDot.classList.add('error')
        statusText.textContent = 'Lỗi kết nối'
        showToast('error', 'Lỗi kết nối', result.message)
        console.error('❌', result.message)
    }
}

// ========================================
// DATA LOADING
// ========================================

async function loadOrders() {
    // Show loading
    elements.loadingSkeleton.style.display = 'block'
    elements.ordersContainer.style.display = 'none'
    elements.emptyState.style.display = 'none'

    const result = await fetchOrders()

    // Hide loading
    elements.loadingSkeleton.style.display = 'none'

    if (result.success) {
        ordersData = result.data

        if (ordersData.length === 0) {
            elements.emptyState.style.display = 'block'
        } else {
            elements.ordersContainer.style.display = 'block'
            renderOrders(ordersData)
        }
    } else {
        showToast('error', 'Lỗi tải dữ liệu', result.error)
        elements.emptyState.style.display = 'block'
    }
}

// ========================================
// RENDER FUNCTIONS
// ========================================

function renderOrders(orders) {
    elements.ordersTbody.innerHTML = ''

    orders.forEach(order => {
        const row = createOrderRow(order)
        elements.ordersTbody.appendChild(row)
    })
}

function createOrderRow(order) {
    const tr = document.createElement('tr')
    tr.setAttribute('data-order-id', order.id)

    tr.innerHTML = `
        <td class="font-mono">${order.id}</td>
        <td class="font-mono">${escapeHtml(order.order_code || '-')}</td>
        <td class="text-truncate" title="${escapeHtml(order.product_name || '-')}">${escapeHtml(order.product_name || '-')}</td>
        <td>${escapeHtml(order.username || '-')}</td>
        <td>${escapeHtml(order.email || '-')}</td>
        <td class="editable-cell" data-field="order_status">
            ${renderStatusBadge(order.order_status, 'order')}
        </td>
        <td class="editable-cell" data-field="payment_status">
            ${renderStatusBadge(order.payment_status, 'payment')}
        </td>
        <td><strong>${formatCurrency(order.total_amount)}</strong></td>
        <td>${escapeHtml(order.payment_method || '-')}</td>
        <td class="editable-cell" data-field="tracking_link">
            ${renderTrackingLink(order.tracking_link)}
        </td>
        <td class="text-truncate" title="${escapeHtml(order.note || '-')}">${escapeHtml(order.note || '-')}</td>
        <td>${formatDate(order.created_at)}</td>
    `

    // Add click handlers for editable cells
    setupEditableCells(tr, order)

    return tr
}

function renderStatusBadge(status, type) {
    const statusClass = status || 'pending'
    const displayText = statusClass.charAt(0).toUpperCase() + statusClass.slice(1)
    return `<span class="status-badge ${statusClass}">${displayText}</span>`
}

function renderTrackingLink(link) {
    if (link && link.trim()) {
        return `<a href="${escapeHtml(link)}" target="_blank" class="tracking-link" onclick="event.stopPropagation()">
            ${escapeHtml(link)}
        </a>`
    }
    return `<span class="tracking-placeholder">Nhấn để thêm</span>`
}

// ========================================
// EDITABLE CELLS LOGIC
// ========================================

function setupEditableCells(row, order) {
    const orderStatusCell = row.querySelector('[data-field="order_status"]')
    const paymentStatusCell = row.querySelector('[data-field="payment_status"]')
    const trackingLinkCell = row.querySelector('[data-field="tracking_link"]')

    // Order Status Dropdown
    orderStatusCell.addEventListener('click', (e) => {
        e.stopPropagation()
        showStatusDropdown(orderStatusCell, order.id, 'order_status', order.order_status, [
            'pending',
            'shipping',
            'completed',
            'cancelled'
        ])
    })

    // Payment Status Dropdown
    paymentStatusCell.addEventListener('click', (e) => {
        e.stopPropagation()
        showStatusDropdown(paymentStatusCell, order.id, 'payment_status', order.payment_status, [
            'pending',
            'paid',
            'failed'
        ])
    })

    // Tracking Link Editable
    trackingLinkCell.addEventListener('click', (e) => {
        e.stopPropagation()
        showTrackingLinkInput(trackingLinkCell, order.id, order.tracking_link)
    })
}

// ========================================
// DROPDOWN MENU
// ========================================

function showStatusDropdown(cell, orderId, field, currentValue, options) {
    // Remove existing dropdowns
    document.querySelectorAll('.dropdown').forEach(d => d.remove())

    const dropdown = document.createElement('div')
    dropdown.className = 'dropdown'

    // Build items
    options.forEach(option => {
        const item = document.createElement('div')
        item.className = `dropdown-item ${option === currentValue ? 'active' : ''}`
        item.textContent = option.charAt(0).toUpperCase() + option.slice(1)

        item.addEventListener('click', async (e) => {
            e.stopPropagation()
            dropdown.remove()

            if (option !== currentValue) {
                await updateStatus(orderId, field, option, cell)
            }
        })

        dropdown.appendChild(item)
    })

    // Position dropdown in viewport by appending to body (prevents clipping)
    dropdown.style.position = 'fixed'
    dropdown.style.zIndex = '2000'
    dropdown.style.minWidth = Math.max(cell.offsetWidth, 150) + 'px'

    const rect = cell.getBoundingClientRect()
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth
    let left = rect.left

    // Avoid overflowing the right edge
    const minW = parseFloat(dropdown.style.minWidth)
    if (left + minW > viewportWidth - 8) {
        left = Math.max(8, viewportWidth - minW - 8)
    }

    dropdown.style.left = left + 'px'
    dropdown.style.top = rect.bottom + 'px'

    document.body.appendChild(dropdown)

    // Close dropdown when clicking outside
    setTimeout(() => {
        function closeDropdown(e) {
            if (!dropdown.contains(e.target) && !cell.contains(e.target)) {
                dropdown.remove()
                document.removeEventListener('click', closeDropdown)
            }
        }
        document.addEventListener('click', closeDropdown)
    }, 0)
}

async function updateStatus(orderId, field, newValue, cell) {
    // Show loading
    const originalContent = cell.innerHTML
    cell.innerHTML = '<span class="loading-spinner"></span>'

    let result
    if (field === 'order_status') {
        result = await updateOrderStatus(orderId, newValue)
    } else if (field === 'payment_status') {
        result = await updatePaymentStatus(orderId, newValue)
    }

    if (result.success) {
        showToast('success', 'Cập nhật thành công', `Đã cập nhật ${field === 'order_status' ? 'trạng thái đơn hàng' : 'trạng thái thanh toán'}`)
        
        // Update local data
        const orderIndex = ordersData.findIndex(o => o.id === orderId)
        if (orderIndex !== -1) {
            ordersData[orderIndex][field] = newValue
        }

        // Re-render cell
        const type = field === 'order_status' ? 'order' : 'payment'
        cell.innerHTML = renderStatusBadge(newValue, type)
        
        // Re-setup click handler
        const order = ordersData[orderIndex]
        cell.addEventListener('click', (e) => {
            e.stopPropagation()
            const options = field === 'order_status' 
                ? ['pending', 'shipping', 'completed', 'cancelled']
                : ['pending', 'paid', 'failed']
            showStatusDropdown(cell, orderId, field, newValue, options)
        })
    } else {
        showToast('error', 'Lỗi cập nhật', result.error)
        cell.innerHTML = originalContent
    }
}

// ========================================
// TRACKING LINK EDITOR
// ========================================

function showTrackingLinkInput(cell, orderId, currentValue) {
    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'editable-input'
    input.value = currentValue || ''
    input.placeholder = 'Nhập link theo dõi...'

    cell.innerHTML = ''
    cell.appendChild(input)
    input.focus()
    input.select()

    async function saveTrackingLink() {
        const newValue = input.value.trim()

        if (newValue === (currentValue || '')) {
            // No change
            cell.innerHTML = renderTrackingLink(currentValue)
            return
        }

        // Show loading
        input.disabled = true
        input.style.opacity = '0.6'

        const result = await updateTrackingLink(orderId, newValue)

        if (result.success) {
            showToast('success', 'Cập nhật thành công', 'Đã cập nhật tracking link')
            
            // Update local data
            const orderIndex = ordersData.findIndex(o => o.id === orderId)
            if (orderIndex !== -1) {
                ordersData[orderIndex].tracking_link = newValue
            }

            // Re-render cell
            cell.innerHTML = renderTrackingLink(newValue)
            
            // Re-setup click handler
            cell.addEventListener('click', (e) => {
                e.stopPropagation()
                showTrackingLinkInput(cell, orderId, newValue)
            })
        } else {
            showToast('error', 'Lỗi cập nhật', result.error)
            cell.innerHTML = renderTrackingLink(currentValue)
        }
    }

    // Save on Enter
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveTrackingLink()
        }
    })

    // Save on blur
    input.addEventListener('blur', () => {
        setTimeout(() => saveTrackingLink(), 100)
    })
}

// ========================================
// REALTIME SUBSCRIPTION
// ========================================

function setupRealtimeSubscription() {
    realtimeSubscription = subscribeToOrders((payload) => {
        console.log('🔔 Realtime update:', payload)

        if (payload.eventType === 'INSERT') {
            ordersData.unshift(payload.new)
            renderOrders(ordersData)
            showToast('info', 'Đơn hàng mới', 'Có đơn hàng mới được tạo')
        } else if (payload.eventType === 'UPDATE') {
            const index = ordersData.findIndex(o => o.id === payload.new.id)
            if (index !== -1) {
                ordersData[index] = payload.new
                renderOrders(ordersData)
            }
        } else if (payload.eventType === 'DELETE') {
            ordersData = ordersData.filter(o => o.id !== payload.old.id)
            renderOrders(ordersData)
            showToast('info', 'Đơn hàng đã xóa', 'Một đơn hàng đã bị xóa')
        }

        // Update empty state
        if (ordersData.length === 0) {
            elements.ordersContainer.style.display = 'none'
            elements.emptyState.style.display = 'block'
        } else {
            elements.ordersContainer.style.display = 'block'
            elements.emptyState.style.display = 'none'
        }
    })
}

// ========================================
// TOAST NOTIFICATIONS
// ========================================

function showToast(type = 'success', title, message, duration = 3000) {
    const toast = document.createElement('div')
    toast.className = `toast ${type}`

    const icons = {
        success: `<svg class="toast-icon success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>`,
        error: `<svg class="toast-icon error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>`,
        info: `<svg class="toast-icon info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>`
    }

    toast.innerHTML = `
        ${icons[type]}
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
        <button class="toast-close">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `

    elements.toastContainer.appendChild(toast)

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        removeToast(toast)
    })

    // Auto remove
    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast)
        }, duration)
    }
}

function removeToast(toast) {
    toast.style.animation = 'toast-slide-in 0.3s ease-out reverse'
    setTimeout(() => {
        toast.remove()
    }, 300)
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatDate(dateString) {
    if (!dateString) return '-'
    
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${day}/${month}/${year} ${hours}:${minutes}`
}

function formatCurrency(amount) {
    if (!amount && amount !== 0) return '-'
    
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount)
}

function escapeHtml(text) {
    if (!text) return ''
    
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

function handleDatabaseSwitch(dbType) {
    console.log('🔄 Switching to database:', dbType)
    
    // Update page title
    const titles = {
        'orders': 'Quản lý đơn hàng',
        'products': 'Quản lý sản phẩm',
        // Add more as needed
    }
    
    elements.pageTitle.textContent = titles[dbType] || 'Database'
    
    // Handle different database types (for future expansion)
    if (dbType === 'orders') {
        loadOrders()
    }
    // Add more cases for other databases
}

// ========================================
// CLEANUP ON PAGE UNLOAD
// ========================================

window.addEventListener('beforeunload', () => {
    if (realtimeSubscription) {
        supabase.removeChannel(realtimeSubscription)
    }
})

console.log('✅ Admin Dashboard đã sẵn sàng!')
