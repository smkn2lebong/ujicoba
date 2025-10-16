// =============================================
// KONFIGURASI SISTEM URC JKN - FIXED VERSION
// =============================================

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxPTZY4qDtAQANSBVRFQfaf3NakkY00wDOtQXic8I1PvLPu9TffgEn9An1Uny1L3xK6WA/exec";

// API Functions dengan CORS handling
class URC_API {
    static async testConnection() {
        try {
            console.log('Testing connection...');
            const response = await fetch(WEB_APP_URL + '?action=test');
            const result = await response.text();
            console.log('Connection test result:', result);
            return result;
        } catch (error) {
            console.error('Connection failed:', error);
            return 'offline';
        }
    }

    static async savePengajuan(pengajuanData) {
        try {
            console.log('Saving pengajuan...', pengajuanData);
            
            const dataToSend = {
                action: 'save',
                id: 'URC_' + Date.now(),
                tanggalAjuan: new Date().toLocaleDateString('id-ID'),
                ...pengajuanData
            };

            const response = await fetch(WEB_APP_URL, {
                method: "POST",
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(dataToSend)
            });
            
            const result = await response.json();
            console.log('Save result:', result);
            return result;
            
        } catch (error) {
            console.error('Save error:', error);
            throw error;
        }
    }

    static async updateStatus(id, status, alasan = '') {
        try {
            console.log('Updating status...', {id, status, alasan});
            
            const response = await fetch(WEB_APP_URL, {
                method: "POST",
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'update',
                    id: id,
                    status: status,
                    alasan: alasan
                })
            });
            
            const result = await response.json();
            console.log('Update result:', result);
            return result;
            
        } catch (error) {
            console.error('Update error:', error);
            throw error;
        }
    }

    static async getAllData() {
        try {
            console.log('Fetching all data...');
            const response = await fetch(WEB_APP_URL + '?action=get_all');
            
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            
            const result = await response.json();
            console.log('Get all data result:', result);
            return result;
        } catch (error) {
            console.error('Get all data error:', error);
            // Return empty array instead of throwing
            return { status: 'success', data: [] };
        }
    }

    static async getDataByRelawan(relawanName) {
        try {
            console.log('Fetching relawan data for:', relawanName);
            
            // FIX: Proper URL encoding untuk nama dengan spasi
            const encodedRelawan = encodeURIComponent(relawanName);
            const url = `${WEB_APP_URL}?action=get_by_relawan&relawan=${encodedRelawan}`;
            
            console.log('Fetching from URL:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Network error: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Get relawan data result:', result);
            
            // FIX: Handle case ketika data tidak ditemukan
            if (!result) {
                return { status: 'success', data: [] };
            }
            
            return result;
            
        } catch (error) {
            console.error('Get relawan data error:', error);
            // FIX: Return empty data instead of throwing error
            return { 
                status: 'success', 
                data: [],
                message: 'Gagal memuat data: ' + error.message 
            };
        }
    }

    // DEBUG FUNCTION - Client-side filtering sebagai backup
    static async getDataByRelawanBackup(relawanName) {
        try {
            console.log('🔧 Using backup method for relawan:', relawanName);
            
            // Ambil semua data dulu
            const allData = await this.getAllData();
            
            if (allData.status !== 'success' || !allData.data) {
                return { status: 'success', data: [] };
            }
            
            // Filter di client-side
            const filteredData = allData.data.filter(item => {
                if (!item.relawan) return false;
                
                // Case-insensitive comparison dengan trim
                const itemRelawan = item.relawan.toString().trim().toLowerCase();
                const searchRelawan = relawanName.trim().toLowerCase();
                
                return itemRelawan === searchRelawan;
            });
            
            console.log('🔧 Backup method result:', filteredData.length + ' data found');
            
            return {
                status: 'success',
                data: filteredData,
                message: `Data ditemukan: ${filteredData.length} pengajuan (client-side filter)`
            };
            
        } catch (error) {
            console.error('Backup method error:', error);
            return { status: 'success', data: [] };
        }
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    // Simple notification
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';

    // Create simple alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to page
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function showLoading(show = true, message = '') {
    let loader = document.getElementById('globalLoader');
    
    if (!loader && show) {
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
        loader.style.cssText = 'background: rgba(0,0,0,0.5); z-index: 9999;';
        loader.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <div class="ms-2 text-white">${message || 'Memuat...'}</div>
        `;
        document.body.appendChild(loader);
    } else if (loader && !show) {
        loader.remove();
    }
}

// Test function
async function testSystem() {
    try {
        console.log('Testing system...');
        const result = await URC_API.testConnection();
        console.log('System test result:', result);
        return result === '✅ URC JKN API Connected!';
    } catch (error) {
        console.error('System test failed:', error);
        return false;
    }
}

// Debug function untuk testing
window.debugURC = {
    testRelawan: async function(relawanName) {
        console.log('🔍 DEBUG: Testing relawan data for:', relawanName);
        try {
            const result = await URC_API.getDataByRelawan(relawanName);
            console.log('🔍 DEBUG Result:', result);
            
            // Jika gagal, coba backup method
            if (result.status === 'error' || !result.data) {
                console.log('🔍 Trying backup method...');
                const backupResult = await URC_API.getDataByRelawanBackup(relawanName);
                console.log('🔍 Backup Result:', backupResult);
                return backupResult;
            }
            
            return result;
        } catch (error) {
            console.error('🔍 DEBUG Error:', error);
            return null;
        }
    },
    
    testAllData: async function() {
        console.log('🔍 DEBUG: Testing all data');
        try {
            const result = await URC_API.getAllData();
            console.log('🔍 All Data Result:', result);
            
            // Show relawan list
            if (result.status === 'success' && result.data) {
                const relawanList = [...new Set(result.data
                    .filter(item => item.relawan)
                    .map(item => item.relawan))];
                console.log('🔍 Daftar Relawan di Database:', relawanList);
            }
            
            return result;
        } catch (error) {
            console.error('🔍 All Data Error:', error);
            return null;
        }
    },
    
    testConnection: async function() {
        console.log('🔍 DEBUG: Testing connection');
        try {
            const result = await URC_API.testConnection();
            console.log('🔍 Connection Result:', result);
            return result;
        } catch (error) {
            console.error('🔍 Connection Error:', error);
            return null;
        }
    }
};

// Enhanced URC_API dengan auto-fallback
URC_API.getDataByRelawanEnhanced = async function(relawanName) {
    console.log('🔄 Enhanced method for:', relawanName);
    
    try {
        // Coba method utama dulu
        const mainResult = await this.getDataByRelawan(relawanName);
        
        // Jika berhasil dan ada data, return
        if (mainResult.status === 'success' && mainResult.data && mainResult.data.length > 0) {
            console.log('✅ Enhanced: Main method success');
            return mainResult;
        }
        
        // Jika gagal atau tidak ada data, coba backup method
        console.log('🔄 Enhanced: Trying backup method...');
        const backupResult = await this.getDataByRelawanBackup(relawanName);
        
        return backupResult;
        
    } catch (error) {
        console.error('Enhanced method error:', error);
        // Last resort - return empty data
        return { status: 'success', data: [] };
    }
};

// Export untuk penggunaan global
window.URC_API = URC_API;
window.showNotification = showNotification;
window.showLoading = showLoading;
window.testSystem = testSystem;