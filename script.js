document.addEventListener('DOMContentLoaded', () => {

    // --- انتخاب عناصر DOM ---
    const balanceEl = document.getElementById('balance');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const transactionListEl = document.getElementById('transaction-list');
    const form = document.getElementById('transaction-form');
    const transactionIdInput = document.getElementById('transaction-id');
    const titleInput = document.getElementById('title');
    const amountInput = document.getElementById('amount');
    const typeInput = document.getElementById('type');
    const dateInput = document.getElementById('date');
    const descriptionInput = document.getElementById('description');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const submitBtn = form.querySelector('button[type="submit"]');

    // --- مقداردهی اولیه کتابخانه jsPDF ---
    const { jsPDF } = window.jspdf;

    // --- وضعیت برنامه (State) ---
    // بارگذاری تراکنش‌ها از LocalStorage یا استفاده از آرایه خالی
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let isEditing = false;

    // --- توابع ---

    /**
     * ذخیره تراکنش‌ها در LocalStorage
     */
    function saveToLocalStorage() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    /**
     * فرمت کردن اعداد به صورت واحد پولی ریال
     * @param {number} number - عدد ورودی
     * @returns {string} - رشته فرمت شده
     */
    function formatCurrency(number) {
        return new Intl.NumberFormat('fa-IR').format(number) + ' ریال';
    }
    
    /**
     * افزودن یک تراکنش به DOM
     * @param {object} transaction - آبجکت تراکنش
     */
    function addTransactionToDOM(transaction) {
        const { id, title, amount, type, date, description } = transaction;

        const card = document.createElement('div');
        card.classList.add('transaction-card', type);
        card.setAttribute('data-id', id);

        card.innerHTML = `
            <div class="transaction-details">
                <div class="title">${title}</div>
                <div class="amount">${type === 'income' ? '+' : '-'} ${formatCurrency(amount)}</div>
                <div class="meta">
                    <span>تاریخ: ${date}</span>
                    ${description ? `| <span>توضیحات: ${description}</span>` : ''}
                </div>
            </div>
            <div class="transaction-actions">
                <button onclick="generatePDF('${id}')" class="btn btn-info">PDF</button>
                <button onclick="startEditTransaction('${id}')" class="btn btn-warning">ویرایش</button>
                <button onclick="deleteTransaction('${id}')" class="btn btn-danger">حذف</button>
            </div>
        `;

        transactionListEl.appendChild(card);
    }
    
    /**
     * به‌روزرسانی مقادیر خلاصه حساب (موجودی، درآمد، هزینه)
     */
    function updateSummary() {
        const amounts = transactions.map(t => t.amount);
        
        const totalIncome = amounts
            .filter((item, index) => transactions[index].type === 'income')
            .reduce((acc, item) => (acc += item), 0);
            
        const totalExpense = amounts
            .filter((item, index) => transactions[index].type === 'expense')
            .reduce((acc, item) => (acc += item), 0);

        const balance = totalIncome - totalExpense;

        balanceEl.innerText = formatCurrency(balance);
        totalIncomeEl.innerText = formatCurrency(totalIncome);
        totalExpenseEl.innerText = formatCurrency(totalExpense);
    }
    
    /**
     * رندر کردن کل صفحه (خلاصه و لیست تراکنش‌ها)
     */
    function render() {
        transactionListEl.innerHTML = '';
        transactions.forEach(addTransactionToDOM);
        updateSummary();
    }

    /**
     * حذف یک تراکنش
     * @param {string} id - شناسه تراکنش
     */
    window.deleteTransaction = function(id) {
        if (confirm('آیا از حذف این تراکنش مطمئن هستید؟')) {
            transactions = transactions.filter(t => t.id != id);
            saveToLocalStorage();
            render();
        }
    }

    /**
     * شروع فرآیند ویرایش یک تراکنش
     * @param {string} id - شناسه تراکنش
     */
    window.startEditTransaction = function(id) {
        const transaction = transactions.find(t => t.id == id);
        if (!transaction) return;

        isEditing = true;
        transactionIdInput.value = transaction.id;
        titleInput.value = transaction.title;
        amountInput.value = transaction.amount;
        typeInput.value = transaction.type;
        dateInput.value = transaction.date;
        descriptionInput.value = transaction.description;

        submitBtn.textContent = 'به‌روزرسانی تراکنش';
        submitBtn.classList.remove('btn-primary');
        submitBtn.classList.add('btn-warning');
        cancelEditBtn.style.display = 'inline-block';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * لغو حالت ویرایش
     */
    function cancelEdit() {
        isEditing = false;
        form.reset();
        transactionIdInput.value = '';
        submitBtn.textContent = 'افزودن تراکنش';
        submitBtn.classList.remove('btn-warning');
        submitBtn.classList.add('btn-primary');
        cancelEditBtn.style.display = 'none';
    }

    /**
     * مدیریت ارسال فرم (افزودن یا ویرایش تراکنش)
     * @param {Event} e - رویداد ارسال فرم
     */
    function handleFormSubmit(e) {
        e.preventDefault();

        // اعتبارسنجی ساده
        if (titleInput.value.trim() === '' || amountInput.value.trim() === '' || dateInput.value.trim() === '') {
            alert('لطفاً فیلدهای عنوان، مبلغ و تاریخ را پر کنید.');
            return;
        }

        const transactionData = {
            id: isEditing ? transactionIdInput.value : Date.now().toString(),
            title: titleInput.value,
            amount: +amountInput.value,
            type: typeInput.value,
            date: dateInput.value,
            description: descriptionInput.value
        };

        if (isEditing) {
            // ویرایش تراکنش موجود
            const index = transactions.findIndex(t => t.id === transactionData.id);
            if (index > -1) {
                transactions[index] = transactionData;
            }
        } else {
            // افزودن تراکنش جدید
            transactions.push(transactionData);
        }

        saveToLocalStorage();
        render();
        cancelEdit(); // فرم را ریست و به حالت عادی برمی‌گرداند
    }

    /**
     * ساخت و دانلود رسید PDF برای یک تراکنش
     * @param {string} id - شناسه تراکنش
     */
    window.generatePDF = function(id) {
        const transaction = transactions.find(t => t.id == id);
        if (!transaction) return;

        try {
            const doc = new jsPDF();

            // تنظیم فونت فارسی (بسیار مهم)
            // نام 'Vazirmatn' باید با نام فونت در فایل Vazirmatn-normal.js یکی باشد
            doc.setFont('Vazirmatn');

            // --- طراحی رسید ---
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            const contentWidth = pageWidth - margin * 2;
            let y = 20;

            // لوگو (فرضی) و عنوان
            doc.setFontSize(10);
            doc.text('شرکت فرضی شما', pageWidth - margin, y, { align: 'right' });
            doc.setFontSize(22);
            doc.text('رسید تراکنش', pageWidth / 2, y + 10, { align: 'center' });
            y += 30;

            // خط جداکننده
            doc.setLineWidth(0.5);
            doc.line(margin, y, pageWidth - margin, y);
            y += 15;

            // اطلاعات رسید
            doc.setFontSize(12);
            doc.text(`شماره رسید: ${transaction.id}`, pageWidth - margin, y, { align: 'right' });
            doc.text(`تاریخ: ${transaction.date}`, margin, y);
            y += 15;

            // تابع کمکی برای نمایش متن راست‌چین
            const addRightAlignedText = (label, value, currentY) => {
                doc.setFont('Vazirmatn', 'bold');
                doc.text(label, pageWidth - margin, currentY, { align: 'right' });
                doc.setFont('Vazirmatn', 'normal');
                doc.text(value, pageWidth - margin - 40, currentY, { align: 'right' });
                return currentY + 10;
            };

            y = addRightAlignedText('عنوان تراکنش:', transaction.title, y);
            y = addRightAlignedText('نوع تراکنش:', transaction.type === 'income' ? 'درآمد' : 'هزینه', y);
            y = addRightAlignedText('مبلغ:', formatCurrency(transaction.amount), y);
            if (transaction.description) {
                y = addRightAlignedText('توضیحات:', transaction.description, y);
            }
            
            // فوتر رسید
            y += 30;
            doc.setLineWidth(0.2);
            doc.line(margin, y, pageWidth - margin, y);
            y += 10;
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text('این رسید به صورت خودکار تولید شده و نیازی به مهر و امضا ندارد.', pageWidth / 2, y, { align: 'center' });

            // ذخیره فایل PDF
            doc.save(`receipt-${transaction.id}.pdf`);

        } catch (error) {
            console.error('خطا در تولید PDF:', error);
            alert('خطا در تولید فایل PDF. ممکن است فونت به درستی بارگذاری نشده باشد. لطفاً از صحت وجود فایل libs/Vazirmatn-normal.js مطمئن شوید.');
        }
    }
    
    // --- رویدادها و اجرای اولیه ---
    form.addEventListener('submit', handleFormSubmit);
    cancelEditBtn.addEventListener('click', cancelEdit);
    
    // اجرای اولیه برای نمایش داده‌ها در زمان بارگذاری صفحه
    render();
});
