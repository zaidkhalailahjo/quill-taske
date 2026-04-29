// settings-export.js
import { db, appId, doc, updateDoc } from './firebase-config.js';

window.handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    if(file.size > 500 * 1024) { window.showToast('الصورة كبيرة جداً، الحد الأقصى 500KB', 'warning'); return; }

    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', window.currentUserData.uid), {
                photoURL: ev.target.result
            });
            window.showToast('تم تحديث صورتك الشخصية بنجاح!', 'success');
        } catch(e) { console.error(e); }
    };
    reader.readAsDataURL(file);
};

window.exportSystemData = (format) => {
    if(!window.currentUserData || window.currentUserData.role !== 'CEO') return;
    window.showToast('جاري تجهيز البيانات، سيتم التحميل خلال لحظات...', 'info');

    const now = new Date();
    if (format === 'excel') {
        let content = "\uFEFF"; 
        content += `تقرير نظام شركة Quill الشامل\nتاريخ السحب: ${now.toLocaleString('ar-EG')}\n\n`;
        content += "--- الموظفون ---\nالاسم,الوظيفة\n";
        window.globalUsers.forEach(u => { content += `"${window.escapeHTML(u.name)}","${u.role}"\n`; });
        
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Quill_System_Export_${now.getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } else if (format === 'pdf') {
        const htmlContent = `
            <div style="font-family: 'Cairo', sans-serif; padding: 20px;">
                <h1 style="color: #002d74; border-bottom: 2px solid #00839b; padding-bottom: 10px;">تقرير نظام شركة Quill الشامل</h1>
                <p style="color: gray;">تاريخ سحب التقرير: ${now.toLocaleString('ar-EG')}</p>
                <h3 style="color: #00839b; margin-top: 30px;">إحصائيات النظام:</h3>
                <ul>
                    <li>عدد الموظفين المسجلين: ${window.globalUsers.length}</li>
                    <li>إجمالي المهام في النظام: ${window.globalTasks.length}</li>
                    <li>إجمالي العملاء المسجلين: ${window.globalCRM.length}</li>
                </ul>
                <p style="margin-top: 50px; text-align: center; color: gray; font-size: 12px;">نهاية التقرير.</p>
            </div>
        `;
        let printDiv = document.getElementById('printArea');
        if(!printDiv) {
            printDiv = document.createElement('div');
            printDiv.id = 'printArea';
            document.body.appendChild(printDiv);
        }
        printDiv.innerHTML = htmlContent;
        window.print();
    }

    const exportTime = Date.now();
    updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', window.currentUserData.uid), { lastSystemExport: exportTime }).catch(e=>console.log(e));
    window.closeModal('exportModal');
    window.logAction('تحميل تقرير', `قام المدير بسحب تفاصيل النظام الكاملة بصيغة ${format.toUpperCase()}`);
};
