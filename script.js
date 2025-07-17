// Gestione Farmaci - JavaScript
class MedicineManager {
    constructor() {
        this.medicines = this.loadMedicines();
        this.currentEditingId = null;
        this.currentMedicineForEmail = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderMedicines();
        this.checkLowStock();
        this.setupCustomFields();
    }

    bindEvents() {
        // Event listeners per i pulsanti principali
        document.getElementById('btnAddMedicine').addEventListener('click', () => this.openAddModal());
        document.getElementById('medicineForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        document.getElementById('emailForm').addEventListener('submit', (e) => this.handleEmailSubmit(e));
        
        // Event listeners per i modal
        document.getElementById('modalOverlay').addEventListener('click', () => this.closeAllModals());
        
        // Event listeners per i campi personalizzati
        document.getElementById('dosage').addEventListener('change', (e) => this.toggleCustomDosage(e));
        document.getElementById('frequency').addEventListener('change', (e) => this.toggleCustomFrequency(e));
        
        // Event listener per l'upload della foto
        document.getElementById('medicinePhoto').addEventListener('change', (e) => this.handlePhotoUpload(e));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    setupCustomFields() {
        // Setup per i campi personalizzati
        this.toggleCustomDosage({ target: document.getElementById('dosage') });
        this.toggleCustomFrequency({ target: document.getElementById('frequency') });
    }

    toggleCustomDosage(e) {
        const customField = document.getElementById('customDosage');
        if (e.target.value === 'custom') {
            customField.style.display = 'block';
            customField.required = true;
        } else {
            customField.style.display = 'none';
            customField.required = false;
            customField.value = '';
        }
    }

    toggleCustomFrequency(e) {
        const customField = document.getElementById('customFrequency');
        if (e.target.value === 'custom') {
            customField.style.display = 'block';
            customField.required = true;
        } else {
            customField.style.display = 'none';
            customField.required = false;
            customField.value = '';
        }
    }

    handlePhotoUpload(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('photoPreview');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Anteprima farmaco" style="max-width: 150px; max-height: 150px; border-radius: 8px;">`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    }

    // Gestione dei dati
    loadMedicines() {
        const stored = localStorage.getItem('medicines');
        return stored ? JSON.parse(stored) : [];
    }

    saveMedicines() {
        localStorage.setItem('medicines', JSON.stringify(this.medicines));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Gestione dei modal
    openAddModal() {
        this.currentEditingId = null;
        document.getElementById('modalTitle').textContent = 'Aggiungi Farmaco';
        document.getElementById('submitBtn').textContent = 'Salva Farmaco';
        this.resetForm();
        this.showModal('medicineModal');
    }

    openEditModal(medicineId) {
        this.currentEditingId = medicineId;
        const medicine = this.medicines.find(m => m.id === medicineId);
        
        if (medicine) {
            document.getElementById('modalTitle').textContent = 'Modifica Farmaco';
            document.getElementById('submitBtn').textContent = 'Aggiorna Farmaco';
            this.populateForm(medicine);
            this.showModal('medicineModal');
        }
    }

    openDetailsModal(medicineId) {
        const medicine = this.medicines.find(m => m.id === medicineId);
        if (medicine) {
            this.populateDetailsModal(medicine);
            this.showModal('detailsModal');
            
            // Bind events per i pulsanti del modal dettagli
            document.getElementById('editMedicineBtn').onclick = () => {
                this.closeDetailsModal();
                this.openEditModal(medicineId);
            };
            
            document.getElementById('printMedicineBtn').onclick = () => {
                this.printMedicine(medicine);
            };
            
            document.getElementById('emailDoctorBtn').onclick = () => {
                this.openEmailModal(medicine);
            };
        }
    }

    openEmailModal(medicine) {
        this.currentMedicineForEmail = medicine;
        this.closeDetailsModal();
        
        // Popola il messaggio email
        const message = `Gentile Dottore,

Le scrivo per richiedere una nuova prescrizione per il seguente farmaco:

Farmaco: ${medicine.name}
Dosaggio attuale: ${this.getDosageText(medicine.dosage, medicine.customDosage)}
Frequenza: ${this.getFrequencyText(medicine.frequency, medicine.customFrequency)}
Scorte rimanenti: ${this.calculateTotalPills(medicine)} compresse

${medicine.notes ? 'Note aggiuntive: ' + medicine.notes : ''}

La ringrazio per l'attenzione.

Cordiali saluti`;

        document.getElementById('emailMessage').value = message;
        this.showModal('emailModal');
    }

    showModal(modalId) {
        document.getElementById('modalOverlay').classList.add('active');
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
        document.getElementById('medicineModal').classList.remove('active');
        document.body.style.overflow = 'auto';
        this.resetForm();
    }

    closeDetailsModal() {
        document.getElementById('modalOverlay').classList.remove('active');
        document.getElementById('detailsModal').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    closeEmailModal() {
        document.getElementById('modalOverlay').classList.remove('active');
        document.getElementById('emailModal').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    closeAllModals() {
        this.closeModal();
        this.closeDetailsModal();
        this.closeEmailModal();
    }

    // Gestione del form
    resetForm() {
        document.getElementById('medicineForm').reset();
        document.getElementById('photoPreview').innerHTML = '';
        this.setupCustomFields();
    }

    populateForm(medicine) {
        document.getElementById('medicineName').value = medicine.name;
        document.getElementById('quantityPerBox').value = medicine.quantityPerBox;
        document.getElementById('numberOfBoxes').value = medicine.numberOfBoxes;
        document.getElementById('dosage').value = medicine.dosage;
        document.getElementById('frequency').value = medicine.frequency;
        document.getElementById('notes').value = medicine.notes || '';
        
        if (medicine.customDosage) {
            document.getElementById('customDosage').value = medicine.customDosage;
        }
        
        if (medicine.customFrequency) {
            document.getElementById('customFrequency').value = medicine.customFrequency;
        }
        
        if (medicine.photo) {
            document.getElementById('photoPreview').innerHTML = 
                `<img src="${medicine.photo}" alt="Foto farmaco" style="max-width: 150px; max-height: 150px; border-radius: 8px;">`;
        }
        
        this.setupCustomFields();
    }

    populateDetailsModal(medicine) {
        const totalPills = this.calculateTotalPills(medicine);
        const stockStatus = this.getStockStatus(totalPills, medicine.quantityPerBox);
        
        const detailsHtml = `
            ${medicine.photo ? `<div class="detail-item">
                <div class="detail-icon"><i class="fas fa-image"></i></div>
                <div class="detail-content">
                    <div class="detail-label">Foto</div>
                    <img src="${medicine.photo}" alt="Foto farmaco" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin-top: 8px;">
                </div>
            </div>` : ''}
            
            <div class="detail-item">
                <div class="detail-icon"><i class="fas fa-pills"></i></div>
                <div class="detail-content">
                    <div class="detail-label">Nome Farmaco</div>
                    <div class="detail-value">${medicine.name}</div>
                </div>
            </div>
            
            <div class="detail-item">
                <div class="detail-icon"><i class="fas fa-box"></i></div>
                <div class="detail-content">
                    <div class="detail-label">Scorte</div>
                    <div class="detail-value">${medicine.numberOfBoxes} scatole × ${medicine.quantityPerBox} = ${totalPills} compresse totali</div>
                </div>
            </div>
            
            <div class="detail-item">
                <div class="detail-icon"><i class="fas fa-prescription-bottle"></i></div>
                <div class="detail-content">
                    <div class="detail-label">Dosaggio</div>
                    <div class="detail-value">${this.getDosageText(medicine.dosage, medicine.customDosage)}</div>
                </div>
            </div>
            
            <div class="detail-item">
                <div class="detail-icon"><i class="fas fa-clock"></i></div>
                <div class="detail-content">
                    <div class="detail-label">Frequenza</div>
                    <div class="detail-value">${this.getFrequencyText(medicine.frequency, medicine.customFrequency)}</div>
                </div>
            </div>
            
            <div class="detail-item">
                <div class="detail-icon"><i class="fas fa-chart-line"></i></div>
                <div class="detail-content">
                    <div class="detail-label">Stato Scorte</div>
                    <div class="detail-value">
                        <span class="stock-status ${stockStatus.class}">${stockStatus.text}</span>
                    </div>
                </div>
            </div>
            
            ${medicine.notes ? `<div class="detail-item">
                <div class="detail-icon"><i class="fas fa-sticky-note"></i></div>
                <div class="detail-content">
                    <div class="detail-label">Note</div>
                    <div class="detail-value">${medicine.notes}</div>
                </div>
            </div>` : ''}
        `;
        
        document.getElementById('medicineDetails').innerHTML = detailsHtml;
        document.getElementById('detailsTitle').textContent = medicine.name;
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const photoFile = formData.get('medicinePhoto');
        
        const medicine = {
            id: this.currentEditingId || this.generateId(),
            name: formData.get('medicineName'),
            quantityPerBox: parseInt(formData.get('quantityPerBox')),
            numberOfBoxes: parseInt(formData.get('numberOfBoxes')),
            dosage: formData.get('dosage'),
            customDosage: formData.get('customDosage'),
            frequency: formData.get('frequency'),
            customFrequency: formData.get('customFrequency'),
            notes: formData.get('notes'),
            createdAt: this.currentEditingId ? 
                this.medicines.find(m => m.id === this.currentEditingId).createdAt : 
                new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Gestione della foto
        if (photoFile && photoFile.size > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                medicine.photo = e.target.result;
                this.saveMedicine(medicine);
            };
            reader.readAsDataURL(photoFile);
        } else if (this.currentEditingId) {
            // Mantieni la foto esistente se non ne è stata caricata una nuova
            const existingMedicine = this.medicines.find(m => m.id === this.currentEditingId);
            medicine.photo = existingMedicine.photo;
            this.saveMedicine(medicine);
        } else {
            this.saveMedicine(medicine);
        }
    }

    saveMedicine(medicine) {
        if (this.currentEditingId) {
            const index = this.medicines.findIndex(m => m.id === this.currentEditingId);
            this.medicines[index] = medicine;
        } else {
            this.medicines.push(medicine);
        }
        
        this.saveMedicines();
        this.renderMedicines();
        this.checkLowStock();
        this.closeModal();
        
        this.showNotification(
            this.currentEditingId ? 'Farmaco aggiornato con successo!' : 'Farmaco aggiunto con successo!',
            'success'
        );
    }

    deleteMedicine(medicineId) {
        if (confirm('Sei sicuro di voler eliminare questo farmaco?')) {
            this.medicines = this.medicines.filter(m => m.id !== medicineId);
            this.saveMedicines();
            this.renderMedicines();
            this.checkLowStock();
            this.showNotification('Farmaco eliminato con successo!', 'success');
        }
    }

    // Rendering
    renderMedicines() {
        const grid = document.getElementById('medicinesGrid');
        
        if (this.medicines.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #718096;">
                    <i class="fas fa-pills" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;"></i>
                    <h3 style="margin-bottom: 10px;">Nessun farmaco aggiunto</h3>
                    <p>Clicca su "Aggiungi Farmaco" per iniziare</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = this.medicines.map(medicine => {
            const totalPills = this.calculateTotalPills(medicine);
            const stockStatus = this.getStockStatus(totalPills, medicine.quantityPerBox);
            
            return `
                <div class="medicine-card fade-in" onclick="medicineManager.openDetailsModal('${medicine.id}')">
                    ${medicine.photo ? `<img src="${medicine.photo}" alt="${medicine.name}" class="medicine-photo">` : ''}
                    
                    <div class="medicine-name">${medicine.name}</div>
                    
                    <div class="medicine-info">
                        <div class="info-item">
                            <i class="fas fa-box"></i>
                            <span>${medicine.numberOfBoxes} scatole</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-pills"></i>
                            <span>${totalPills} compresse totali</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-prescription-bottle"></i>
                            <span>${this.getDosageText(medicine.dosage, medicine.customDosage)}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-clock"></i>
                            <span>${this.getFrequencyText(medicine.frequency, medicine.customFrequency)}</span>
                        </div>
                    </div>
                    
                    <div class="stock-status ${stockStatus.class}">
                        ${stockStatus.text}
                    </div>
                    
                    <div class="medicine-actions" onclick="event.stopPropagation()">
                        <button class="btn-warning" onclick="medicineManager.openEditModal('${medicine.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-danger" onclick="medicineManager.deleteMedicine('${medicine.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Utility functions
    calculateTotalPills(medicine) {
        return medicine.numberOfBoxes * medicine.quantityPerBox;
    }

    getStockStatus(totalPills, quantityPerBox) {
        if (totalPills <= quantityPerBox * 0.5) {
            return { class: 'low', text: 'Scorte basse' };
        } else if (totalPills <= quantityPerBox * 1.5) {
            return { class: 'medium', text: 'Scorte medie' };
        } else {
            return { class: 'high', text: 'Scorte buone' };
        }
    }

    getDosageText(dosage, customDosage) {
        if (dosage === 'custom') {
            return customDosage || 'Personalizzato';
        }
        
        const dosageMap = {
            '1/4': 'Un quarto (1/4)',
            '1/2': 'Mezza (1/2)',
            '1': 'Intera (1)',
            '2': 'Due (2)',
            '3': 'Tre (3)'
        };
        
        return dosageMap[dosage] || dosage;
    }

    getFrequencyText(frequency, customFrequency) {
        if (frequency === 'custom') {
            return customFrequency || 'Personalizzato';
        }
        
        const frequencyMap = {
            'daily': 'Ogni giorno',
            'alternate': 'Giorni alternati',
            'twice-daily': 'Due volte al giorno',
            'three-times-daily': 'Tre volte al giorno',
            'weekly': 'Una volta a settimana',
            'monthly': 'Una volta al mese',
            'as-needed': 'Al bisogno'
        };
        
        return frequencyMap[frequency] || frequency;
    }

    checkLowStock() {
        const lowStockMedicines = this.medicines.filter(medicine => {
            const totalPills = this.calculateTotalPills(medicine);
            return totalPills <= medicine.quantityPerBox * 0.5;
        });
        
        const notification = document.getElementById('lowStockNotification');
        
        if (lowStockMedicines.length > 0) {
            notification.style.display = 'flex';
            notification.querySelector('span').textContent = 
                `${lowStockMedicines.length} farmaco${lowStockMedicines.length > 1 ? 'i' : ''} con scorte basse!`;
        } else {
            notification.style.display = 'none';
        }
    }

    // Email functionality
    handleEmailSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const emailData = {
            to: formData.get('doctorEmail'),
            subject: formData.get('emailSubject'),
            body: formData.get('emailMessage')
        };
        
        // Crea il link mailto
        const mailtoLink = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
        
        // Apri il client email
        window.location.href = mailtoLink;
        
        this.closeEmailModal();
        this.showNotification('Client email aperto! Completa l\'invio dal tuo programma di posta.', 'info');
    }

    // Print functionality
    printMedicine(medicine) {
        const printWindow = window.open('', '_blank');
        const totalPills = this.calculateTotalPills(medicine);
        const stockStatus = this.getStockStatus(totalPills, medicine.quantityPerBox);
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Scheda Farmaco - ${medicine.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #667eea; padding-bottom: 20px; }
                    .medicine-photo { max-width: 200px; max-height: 200px; border-radius: 8px; margin: 20px auto; display: block; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
                    .info-item { padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; }
                    .info-label { font-weight: bold; color: #667eea; margin-bottom: 5px; }
                    .info-value { color: #4a5568; }
                    .notes { margin: 20px 0; padding: 15px; background: #f7fafc; border-radius: 8px; }
                    .stock-status { padding: 10px; border-radius: 8px; text-align: center; font-weight: bold; margin: 20px 0; }
                    .stock-status.high { background: #c6f6d5; color: #22543d; }
                    .stock-status.medium { background: #ffecd2; color: #744210; }
                    .stock-status.low { background: #fed7d7; color: #742a2a; }
                    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #718096; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Scheda Farmaco</h1>
                    <h2>${medicine.name}</h2>
                </div>
                
                ${medicine.photo ? `<img src="${medicine.photo}" alt="${medicine.name}" class="medicine-photo">` : ''}
                
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Nome Farmaco</div>
                        <div class="info-value">${medicine.name}</div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-label">Quantità per Scatola</div>
                        <div class="info-value">${medicine.quantityPerBox} compresse</div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-label">Numero Scatole</div>
                        <div class="info-value">${medicine.numberOfBoxes}</div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-label">Totale Compresse</div>
                        <div class="info-value">${totalPills}</div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-label">Dosaggio</div>
                        <div class="info-value">${this.getDosageText(medicine.dosage, medicine.customDosage)}</div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-label">Frequenza</div>
                        <div class="info-value">${this.getFrequencyText(medicine.frequency, medicine.customFrequency)}</div>
                    </div>
                </div>
                
                <div class="stock-status ${stockStatus.class}">
                    Stato Scorte: ${stockStatus.text}
                </div>
                
                ${medicine.notes ? `
                    <div class="notes">
                        <div class="info-label">Note</div>
                        <div class="info-value">${medicine.notes}</div>
                    </div>
                ` : ''}
                
                <div class="footer">
                    Stampato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}
                </div>
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }

    // Notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification-item ${type} fade-in`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="btn-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        document.getElementById('notifications').appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Funzioni globali per i pulsanti
function closeModal() {
    medicineManager.closeModal();
}

function closeDetailsModal() {
    medicineManager.closeDetailsModal();
}

function closeEmailModal() {
    medicineManager.closeEmailModal();
}

function closeNotification() {
    document.getElementById('lowStockNotification').style.display = 'none';
}

// Inizializzazione
let medicineManager;

document.addEventListener('DOMContentLoaded', () => {
    medicineManager = new MedicineManager();
});

// Service Worker per funzionalità offline (opzionale)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

