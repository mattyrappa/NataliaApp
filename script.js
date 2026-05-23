// VARIABILI GLOBALI DI PRENOTAZIONE
let bookingData = {
    barber: '',
    service: '',
    price: '',
    date: '',
    time: ''
};

// STRUTTURA DATI PER SIMULARE UN DATABASE (Sincronizzato con localStorage)
let appointments = JSON.parse(localStorage.getItem('barber_appointments')) || [
    { id: 1, customer: "Marco Rossi", barber: "NOME 1", service: "Taglio Capelli", date: "2026-05-25", time: "10:30" },
    { id: 2, customer: "Luca Bianchi", barber: "NOME 2", service: "Regolazione Barba", date: "2026-05-26", time: "15:00" }
];

// Inizializzazione avanzata controlli al caricamento della pagina
document.addEventListener("DOMContentLoaded", () => {
    const datePicker = document.getElementById("datePicker");
    if(datePicker) {
        // PUNTO 1 PALLINO 1: FLATPICKR PER DISABILITARE I LUNEDÌ ALLA COLESTRICE
        flatpickr("#datePicker", {
            minDate: "today",
            dateFormat: "Y-m-d",
            disable: [
                function(date) {
                    // Ritorna true se il giorno è Lunedì (1) per disabilitarlo nativamente
                    return (date.getDay() === 1);
                }
            ],
            locale: {
                firstDayOfWeek: 1
            }
        });
    }

    // PUNTO 3 PALLINO 2: Sincronizzazione automatica se un utente normale è loggato
    const customerInput = document.getElementById('customerName');
    if (customerInput) {
        const loggedUser = localStorage.getItem('loggedUserName');
        if (loggedUser) {
            customerInput.value = loggedUser;
        }
    }
});

// GESTIONE DEI CAMBI DI STEP (Navigazione fluida e tasto indietro)
function goToStep(stepId) {
    document.querySelectorAll('.booking-card').forEach(card => {
        card.classList.remove('active');
    });
    const targetCard = document.getElementById(stepId);
    if(targetCard) {
        targetCard.classList.add('active');
    }
    
    document.querySelectorAll('.selected-barber-name').forEach(el => {
        el.innerText = bookingData.barber || 'NOME 1';
    });
}

function selectBarber(barberName) {
    bookingData.barber = barberName;
    goToStep('stepServizio');
}

function selectService(serviceName, priceVal) {
    bookingData.service = serviceName;
    bookingData.price = priceVal;
    goToStep('stepCalendario');
}

function selectDate() {
    const dateInput = document.getElementById('datePicker').value;
    if (!dateInput) {
        alert('Per favore, seleziona una data valida.');
        return;
    }
    bookingData.date = dateInput;
    
    aggiornaOrariDisponibili();
    goToStep('stepOrario');
}

// FUNZIONE AGGIORNATA CON PUNTO 1 PALLINO 2 (MESSAGGIO SE TUTTO OCCUPATO)
function aggiornaOrariDisponibili() {
    const hourButtons = document.querySelectorAll('.hour-btn-text');
    let orariOccupatiContatore = 0;
    
    hourButtons.forEach(button => {
        const oraBottone = button.getAttribute('data-time');
        
        const giaOccupato = appointments.some(app => 
            app.barber === bookingData.barber && 
            app.date === bookingData.date && 
            app.time === oraBottone
        );
        
        if (giaOccupato) {
            button.classList.add('disabled-hour');
            button.style.backgroundColor = '#333333';
            button.style.color = '#555555';
            button.style.pointerEvents = 'none';
            button.style.textDecoration = 'line-through';
            orariOccupatiContatore++; // Incrementa contatore occupati
        } else {
            button.classList.remove('disabled-hour');
            button.style.backgroundColor = '#828282';
            button.style.color = '#000';
            button.style.pointerEvents = 'auto';
            button.style.textDecoration = 'none';
        }
    });

    const msgBox = document.getElementById('fullyBookedMessage');
    const gridBox = document.getElementById('hoursGridContainer');
    
    // Se il numero di bottoni occupati è uguale al totale dei bottoni disponibili (12)
    if (orariOccupatiContatore === hourButtons.length) {
        msgBox.style.display = 'block';
        gridBox.style.display = 'none';
    } else {
        msgBox.style.display = 'none';
        gridBox.style.display = 'grid';
    }
}

function selectTime(timeVal) {
    bookingData.time = timeVal;
    
    const summaryBox = document.getElementById('summaryDetails');
    if(summaryBox) {
        const dateObj = new Date(bookingData.date);
        const formattedDate = dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
        
        summaryBox.innerHTML = `
            <p><strong>Professionista:</strong> ${bookingData.barber}</p>
            <p><strong>Servizio scelto:</strong> ${bookingData.service} (${bookingData.price})</p>
            <p><strong>Appuntamento il:</strong> ${formattedDate}</p>
            <p><strong>All'orario:</strong> ${bookingData.time}</p>
        `;
    }
    
    goToStep('stepConferma');
}

function finalizzaPrenotazione() {
    const customerName = document.getElementById('customerName').value.trim();
    if (!customerName) {
        alert('Per favore, inserisci il tuo nome e cognome per completare.');
        return;
    }

    const newAppointment = {
        id: Date.now(),
        customer: customerName,
        barber: bookingData.barber,
        service: bookingData.service,
        date: bookingData.date,
        time: bookingData.time
    };

    appointments.push(newAppointment);
    localStorage.setItem('barber_appointments', JSON.stringify(appointments));

    alert(`Grazie ${customerName}! La tua prenotazione con ${bookingData.barber} è stata registrata con successo.`);
    
    bookingData = { barber: '', service: '', price: '', date: '', time: '' };
    
    // Pulisce il campo solo se l'utente non è sincronizzato nativamente
    if(!localStorage.getItem('loggedUserName')) {
        document.getElementById('customerName').value = '';
    }
    
    goToStep('stepBarbiere');
}

// --- LOGICA PANNELLO AMMINISTRATORE AGGIORNATA (PUNTO 2 PALLINO 1: FILTRI) ---
function renderAppointments() {
    const listTable = document.getElementById('appointmentsList');
    if (!listTable) return;

    listTable.innerHTML = '';

    // Recupera i valori impostati nei filtri HTML
    const barberFilterValue = document.getElementById('filterBarber').value;
    const dateFilterValue = document.getElementById('filterDate').value;

    // Applica il filtraggio in cascata
    let filteredAppointments = appointments.filter(app => {
        const matchBarber = (barberFilterValue === 'ALL' || app.barber === barberFilterValue);
        const matchDate = (!dateFilterValue || app.date === dateFilterValue);
        return matchBarber && matchDate;
    });

    if (filteredAppointments.length === 0) {
        listTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#828282;">Nessuna prenotazione corrispondente ai filtri selezionati</td></tr>`;
        return;
    }

    filteredAppointments.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));

    filteredAppointments.forEach(app => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${app.customer}</strong></td>
            <td>${app.barber}</td>
            <td>${app.service}</td>
            <td>${app.date}</td>
            <td>${app.time}</td>
            <td>
                <button class="btn-delete" onclick="deleteAppointment(${app.id})">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        listTable.appendChild(row);
    });
}

// Funzione ausiliaria per resettare i filtri admin
function resetFilters() {
    document.getElementById('filterBarber').value = 'ALL';
    document.getElementById('filterDate').value = '';
    renderAppointments();
}

// PUNTO 2 PALLINO 2: CANCELLAZIONE INTERO ARCHIVIO
function clearAllAppointments() {
    if (confirm("ATTENZIONE! Sei sicuro di voler cancellare TUTTE le prenotazioni in archivio? L'azione è irreversibile.")) {
        appointments = [];
        localStorage.setItem('barber_appointments', JSON.stringify(appointments));
        renderAppointments();
    }
}

function deleteAppointment(id) {
    if (confirm("Sei sicuro di voler cancellare questa prenotazione?")) {
        appointments = appointments.filter(app => app.id !== id);
        localStorage.setItem('barber_appointments', JSON.stringify(appointments));
        renderAppointments();
    }
}

// PUNTO 4: LOGOUT DELL'AMMINISTRATORE
function logoutAdmin() {
    localStorage.removeItem('isAdminLoggedIn');
    window.location.href = "login.html";
}

// --- LOGICA DI ACCESSO / REGISTRAZIONE AGGIORNATA (AUTH CON AGGANCIO REALE) ---
let isRegisterMode = false;

function toggleAuthMode(mode) {
    isRegisterMode = mode;
    const authTitle = document.getElementById('authTitle');
    const authName = document.getElementById('authName');
    const btnAuthSubmit = document.getElementById('btnAuthSubmit');
    const authToggleText = document.getElementById('authToggleText');

    if (isRegisterMode) {
        authTitle.innerText = "Crea un nuovo Account";
        authName.style.display = "block";
        btnAuthSubmit.innerText = "Registrati";
        authToggleText.innerHTML = `Hai già un account? <span onclick="toggleAuthMode(false)">Accedi qui</span>`;
    } else {
        authTitle.innerText = "Accedi al tuo Account";
        authName.style.display = "none";
        btnAuthSubmit.innerText = "Accedi";
        authToggleText.innerHTML = `Non hai un account? <span onclick="toggleAuthMode(true)">Registrati qui</span>`;
    }
}

function handleAuth() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value.trim();

    if (!email || !password) {
        alert("Compila tutti i campi richiesti.");
        return;
    }

    // PUNTO 4: ACCESSO AMMINISTRATORE CENTRALIZZATO
    if (email === "admin@barber.it" && password === "admin") {
        localStorage.setItem('isAdminLoggedIn', 'true');
        alert("Accesso Amministratore autorizzato!");
        window.location.href = "admin.html";
        return;
    }

    if (isRegisterMode) {
        const name = document.getElementById('authName').value.trim();
        if (!name) { alert("Inserisci il tuo nome."); return; }
        
        // Salva l'utente registrato e lo logga
        localStorage.setItem('loggedUserName', name);
        alert(`Registrazione completata! Benvenuto ${name}. Ora puoi effettuare la tua prenotazione.`);
        window.location.href = "prenota.html";
    } else {
        // Simulazione login utente standard prendendo la parte prima della @ come nome di cortesia
        const guessedName = email.split('@')[0];
        localStorage.setItem('loggedUserName', guessedName);
        alert(`Accesso eseguito con successo!`);
        window.location.href = "prenota.html";
    }
}