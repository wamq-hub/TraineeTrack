/**
 * ملف التكامل مع Google Apps Script Web App
 * منصة سجل المواقف اليومية للمتدربين
 * المؤسسة العامة للتدريب التقني والمهني
 */

// رابط Google Apps Script Web App
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyh21-h1E3FuKAZT2FVa9Ttu6qFgJ6gjp9GGH_1kKdRkjzOds0UOoxsXUsWDv_QOcJHRw/exec';
/**
 * إرسال طلب إلى Google Apps Script
 */
async function sendRequest(action, data = {}) {
  return new Promise((resolve) => {
    try {
      const cbName = `__gas_cb_${Date.now()}_${Math.floor(Math.random()*1e6)}`;
      const params = new URLSearchParams({ action, ...data, _: Date.now().toString(), callback: cbName });

      window[cbName] = (result) => {
        try { delete window[cbName]; } catch(_) {}
        try {
          if (typeof script !== 'undefined' && script.parentNode) {
            script.parentNode.removeChild(script);
          }
        } catch(_) {}
        if (result && result.success === false) {
          showError(result.message || 'فشلت العملية');
        }
        resolve(result || { success: false, message: 'رد غير معروف' });
      };

      const script = document.createElement('script');
      script.src = `${WEB_APP_URL}?${params.toString()}`;
      script.onerror = () => {
        try { delete window[cbName]; } catch(_) {}
        try {
          if (script.parentNode) script.parentNode.removeChild(script);
        } catch(_) {}
        showError('فشل الاتصال بقاعدة البيانات');
        resolve({ success: false, message: 'Network/JSONP error' });
      };
      document.head.appendChild(script);
    } catch (e) {
      showError('فشل الاتصال بقاعدة البيانات: ' + e.message);
      resolve({ success: false, message: e.message });
    }
  });
}

/**
 * تحميل بيانات المتدربين
 */
async function loadTraineesData() {
    showLoading('جاري تحميل بيانات المتدربين...');
    const result = await sendRequest('getTrainees');
    hideLoading();
    if (result.success && result.data) {
        return result.data;
    }
    return {};
}

/**
 * تحميل بيانات الموظفين
 */
async function loadStaffData() {
    showLoading('جاري تحميل بيانات الموظفين...');
    const result = await sendRequest('getStaff');
    hideLoading();
    if (result.success && result.data) {
        return result.data;
    }
    return {};
}

/**
 * تحميل بيانات المرشدين
 */
async function loadAdvisorsData() {
    const result = await sendRequest('getAdvisors');
    if (result.success && result.data) {
        return result.data;
    }
    return {};
}

/**
 * البحث عن متدرب بالرقم التدريبي
 */
async function getTraineeById(traineeId) {
    showLoading('جاري البحث عن بيانات المتدرب...');
    const result = await sendRequest('getTrainee', { traineeId: traineeId });
    hideLoading();
    if (result.success && result.data) {
        return result.data;
    }
    return null;
}

/**
 * حفظ تذكرة جديدة
 */
async function saveNewTicket(ticketData) {
    showLoading('جاري حفظ التذكرة...');
    const result = await sendRequest('createTicket', ticketData);
    hideLoading();
    if (result.success) {
        showSuccess(`تم إنشاء التذكرة بنجاح! رقم التذكرة: ${result.ticketNumber}`);
        return { success: true, ticketNumber: result.ticketNumber };
    } else {
        showError('فشل في إنشاء التذكرة: ' + result.message);
        return { success: false };
    }
}

/**
 * تحميل جميع التذاكر
 */
async function loadAllTickets() {
    showLoading('جاري تحميل التذاكر...');
    const result = await sendRequest('getAllTickets');
    hideLoading();
    if (result.success && result.data) {
        return result.data;
    }
    return [];
}

/**
 * تحميل تذاكر متدرب محدد
 */
async function loadTraineeTickets(traineeId) {
    showLoading('جاري تحميل تذاكر المتدرب...');
    const result = await sendRequest('getTraineeTickets', { traineeId: traineeId });
    hideLoading();
    if (result.success && result.data) {
        return result.data;
    }
    return [];
}

/**
 * تحميل تذاكر مرشد محدد
 */
async function loadAdvisorTickets(advisorName) {
    showLoading('جاري تحميل تذاكر المرشد...');
    const result = await sendRequest('getAdvisorTickets', { advisorName: advisorName });
    hideLoading();
    if (result.success && result.data) {
        return result.data;
    }
    return [];
}

/**
 * تحميل التذاكر المفلترة حسب صلاحية المستخدم
 */
async function loadAllTicketsScoped(userId) {
    showLoading('جاري تحميل التذاكر...');
    const result = await sendRequest('getAllTicketsScoped', { userId: userId });
    hideLoading();
    if (result.success && result.data) {
        return result.data;
    }
    return [];
}

/**
 * تحديث حالة تذكرة
 */
async function updateTicketStatus(ticketNumber, updates) {
    showLoading('جاري تحديث حالة التذكرة...');
    const result = await sendRequest('updateTicket', {
        ticketNumber: ticketNumber,
        ...updates
    });
    hideLoading();
    if (result.success) {
        showSuccess('تم تحديث حالة التذكرة بنجاح');
        return true;
    } else {
        showError('فشل في تحديث التذكرة');
        return false;
    }
}

/**
 * حفظ تقييم متدرب
 */
async function saveRating(ticketNumber, rating, comment = '') {
    showLoading('جاري حفظ التقييم...');
    const res = await sendRequest('saveRating', {
        ticketNumber,
        rating,
        comment,
        ratingDate: new Date().toLocaleDateString('ar-SA')
    });
    hideLoading();
    return {
        success: !!res?.success,
        code: res?.code || null,
        message: res?.message || ''
    };
}

/**
 * حساب الإحصائيات
 */
async function calculateStatistics() {
    showLoading('جاري حساب الإحصائيات...');
    const result = await sendRequest('getStatistics');
    hideLoading();
    if (result.success && result.data) {
        return result.data;
    }
    return {
        total: 0,
        completed: 0,
        pending: 0,
        inProgress: 0
    };
}

/**
 * تحويل تذكرة إلى مسؤول آخر
 */
// ✅ CORRECT: نفس الأساس لديك (JSONP عبر sendRequest) مع أسماء الحقول القياسية
    async function transferTicket(ticketNumber, transferTo, transferredBy) {
    showLoading('جاري تحويل التذكرة...');
    const result = await sendRequest('transferTicket', {
        ticketNumber: ticketNumber,
        transferTo: transferTo,
        transferredBy: transferredBy,
        transferDate: new Date().toLocaleDateString('ar-SA') // مهم لتتبع الشارة
    });
    hideLoading();
    if (result && result.success) {
        showSuccess('تم تحويل التذكرة بنجاح');
        return true;
    } else {
        showError(result?.message || 'فشل في تحويل التذكرة');
        return false;
    }
    }


/**
 * إنهاء تذكرة
 */
async function completeTicketRequest(ticketNumber, solution, completedBy) {
    showLoading('جاري إنهاء التذكرة...');
    const result = await sendRequest('completeTicket', {
        ticketNumber: ticketNumber,
        solution: solution,
        completedBy: completedBy,
        completionDate: new Date().toLocaleDateString('ar-SA')
    });
    hideLoading();
    if (result.success) {
        showSuccess('تم إنهاء التذكرة بنجاح');
        return true;
    } else {
        showError('فشل في إنهاء التذكرة');
        return false;
    }
}

/**
 * التحقق من صلاحيات المستخدم
 */
async function checkUserPermission(userId) {
    showLoading('جاري التحقق من الصلاحيات...');
    const result = await sendRequest('checkPermission', { userId: userId });
    hideLoading();
    if (result.success && result.data) {
        return result.data;
    }
    return null;
}

/**
 * البحث في التذاكر
 */
async function searchTickets(filters) {
    showLoading('جاري البحث...');
    const result = await sendRequest('searchTickets', filters);
    hideLoading();
    if (result.success && result.data) {
        return result.data;
    }
    return [];
}

/**
 * جلب بيانات التقارير للصلاحيات العليا
 */
async function getReportData() {
    if (!currentUser || !currentUser.data) {
        showError('الرجاء تسجيل الدخول أولاً');
        return null;
    }
    
    showLoading('جاري تحميل بيانات التقارير...');
    const result = await sendRequest('getReportData', {
        userId: currentUser.id,
        userRole: currentUser.data.role
    });
    hideLoading();
    
    if (result.success && result.data) {
        return result.data;
    } else {
        showError(result.message || 'فشل في تحميل بيانات التقارير');
        return null;
    }
}

/**
 * عرض رسالة تحميل
 */
function showLoading(message = 'جاري التحميل...') {
    hideLoading();
    const loader = document.createElement('div');
    loader.id = 'loadingOverlay';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        flex-direction: column;
        gap: 20px;
    `;
    loader.innerHTML = `
        <div style="
            width: 60px;
            height: 60px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #0A5F8F;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        "></div>
        <p style="color: white; font-size: 18px; font-weight: 600;">${message}</p>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(loader);
}

/**
 * إخفاء رسالة التحميل
 */
function hideLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.remove();
    }
}

/**
 * عرض رسالة نجاح
 */
function showSuccess(message) {
    showNotification(message, 'success');
}

/**
 * عرض رسالة خطأ
 */
function showError(message) {
    showNotification(message, 'error');
}

/**
 * عرض إشعار
 */
function showNotification(message, type = 'info') {
    const oldNotif = document.getElementById('notification');
    if (oldNotif) {
        oldNotif.remove();
    }
    
    const colors = {
        success: '#2C9A4F',
        error: '#DC3545',
        info: '#0A5F8F'
    };
    
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };
    
    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 15px;
        font-size: 16px;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
    `;
    
    notification.innerHTML = `
        <span style="font-size: 24px;">${icons[type]}</span>
        <span>${message}</span>
        <style>
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        </style>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        notification.style.cssText += `
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

/**
 * تصدير البيانات كـ CSV
 */
async function exportToCSV(sheetName) {
    showLoading('جاري تصدير البيانات...');
    const result = await sendRequest('exportData', { sheetName: sheetName });
    hideLoading();
    if (result.success && result.data) {
        const csv = convertToCSV(result.data);
        downloadCSV(csv, `${sheetName}_${new Date().getTime()}.csv`);
        showSuccess('تم تصدير البيانات بنجاح');
    } else {
        showError('فشل في تصدير البيانات');
    }
}

/**
 * تحويل البيانات إلى CSV
 */
function convertToCSV(data) {
    let csv = '';
    data.forEach(row => {
        csv += row.join(',') + '\n';
    });
    return csv;
}

/**
 * تنزيل ملف CSV
 */
function downloadCSV(csv, filename) {
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// تصدير الدوال للاستخدام العام
if (typeof window !== 'undefined') {
    window.TraineePlatformAPI = {
        loadTraineesData,
        loadStaffData,
        loadAdvisorsData,
        getTraineeById,
        saveNewTicket,
        loadAllTickets,
        loadTraineeTickets,
        loadAdvisorTickets,
        loadAllTicketsScoped,
        updateTicketStatus,
        saveRating,
        calculateStatistics,
        transferTicket,
        completeTicketRequest,
        checkUserPermission,
        searchTickets,
        exportToCSV,
        getReportData,
        showSuccess,
        showError,
        showLoading,
        hideLoading
    };
}
