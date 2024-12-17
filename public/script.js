// Gestione del modal
const modal = document.getElementById('success-modal');
const uniqueCodeDisplay = document.getElementById('unique-code');
const modalCloseBtn = modal.querySelector('.modal-close-btn');

// Gestione chiusura modal
modalCloseBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    formRegistrazione.reset();
});

// Gestione della registrazione
const formRegistrazione = document.getElementById('form-registrazione');
formRegistrazione.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const cognome = document.getElementById('cognome').value;
    const nickname = document.getElementById('nickname').value;
    const email = document.getElementById('email').value;

    try {
        const response = await fetch('https://ccbrothers-backend.onrender.com/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nome, cognome, nickname, email }),
        });

        const data = await response.json();
        
        if (response.ok) {
            // Mostra il modal invece dell'alert
            uniqueCodeDisplay.textContent = data.codice;
            modal.style.display = 'flex';
        } else {
            alert(data.message || 'Errore durante la registrazione.');
        }
    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        alert('Errore durante la registrazione. Contatta il supporto.');
    }
});

// Gestione dell'accesso
const formAccesso = document.getElementById('form-accesso');
formAccesso.addEventListener('submit', async (event) => {
    event.preventDefault();

    const codiceUnivoco = document.getElementById('codice-univoco').value;

    try {
        const response = await fetch('https://ccbrothers-backend.onrender.com/verify-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ codice: codiceUnivoco }),
        });

        const data = await response.json();
        
        if (response.ok) {
            mostraSezionePersonale(data.persona);
        } else {
            alert(data.message || 'Codice non valido.');
        }
    } catch (error) {
        console.error('Errore durante l\'accesso:', error);
        alert('Errore durante l\'accesso. Contatta il supporto.');
    }
});

// Funzione per formattare la data
function formattaData(dateString) {
    const data = new Date(dateString);
    return data.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Funzione per trovare il livello corrente dell'utente
function findCurrentLevel(acquisti) {
    const levels = [
        { min: 0, max: 9 },      // Sotto il primo livello
        { min: 10, max: 24 },    // Livello 1
        { min: 25, max: 49 },    // Livello 2
        { min: 50, max: 74 },    // Livello 3
        { min: 75, max: 99 },    // Livello 4
        { min: 100, max: 149 },  // Livello 5
        { min: 150, max: 199 },  // Livello 6
        { min: 200, max: Infinity } // Livello 7
    ];
    
    return levels.findIndex(level => acquisti >= level.min && acquisti <= level.max);
}

// Funzione per aggiornare lo stato dei reward
function updateRewardsStatus(acquisti) {
    const rewardItems = document.querySelectorAll('.reward-item');
    const livelli = [
        {requisito: 10, completato: false},
        {requisito: 25, completato: false},
        {requisito: 50, completato: false},
        {requisito: 75, completato: false},
        {requisito: 100, completato: false},
        {requisito: 150, completato: false},
        {requisito: 200, completato: false}
    ];

    // Reset - rimuovi tutti i completamenti precedenti
    rewardItems.forEach(item => {
        item.classList.remove('completed');
        const checkmark = item.querySelector('.checkmark');
        if (checkmark) {
            checkmark.remove();
        }
    });

    // Trova il livello attuale
    let livelloAttuale = -1;
    for (let i = 0; i < livelli.length; i++) {
        if (acquisti >= livelli[i].requisito) {
            livelloAttuale = i;
        }
    }

    // Marca come completati solo i livelli fino a quello attuale
    for (let i = 0; i <= livelloAttuale; i++) {
        const item = rewardItems[i];
        if (item) {
            item.classList.add('completed');
            if (!item.querySelector('.checkmark')) {
                const checkmark = document.createElement('span');
                checkmark.className = 'checkmark';
                checkmark.innerHTML = '✓';
                item.appendChild(checkmark);
            }
        }
    }
}

function mostraSezionePersonale(persona) {
    document.querySelector('.form-container').style.display = 'none';
    
    document.getElementById('nome-completo').textContent = `${persona.nome} ${persona.cognome}`;
    document.getElementById('nickname-utente').textContent = persona.nickname;
    document.getElementById('codice-utente').textContent = persona.codice;
    document.getElementById('acquisti-utente').textContent = `${persona.acquisti}/100`;
    document.getElementById('data-registrazione').textContent = formattaData(persona.dataRegistrazione);

    // Calcola e aggiorna la barra di progresso
    const progresso = Math.min((persona.acquisti / 100) * 100, 100);
    document.getElementById('barra-progresso').style.width = `${progresso}%`;

    // Aggiorna lo stato dei reward
    updateRewardsStatus(persona.acquisti);

    // Mostra la sezione personale
    document.getElementById('sezione-personale').style.display = 'flex';
}

// Gestione del flip della carta
document.addEventListener('DOMContentLoaded', () => {
    const chips = document.querySelectorAll('.card-chip');
    const creditCard = document.querySelector('.credit-card');

    chips.forEach(chip => {
        chip.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            creditCard.classList.toggle('flipped');
        });
    });
});

// Funzione per aggiornare i reward in tempo reale
function updateAcquisti(nuovoValore) {
    const acquisti = Math.min(Math.max(0, nuovoValore), 100);
    document.getElementById('acquisti-utente').textContent = `${acquisti}/100`;
    const progresso = (acquisti / 100) * 100;
    document.getElementById('barra-progresso').style.width = `${progresso}%`;
    updateRewardsStatus(acquisti);
}

// update
// force deploy netlify update
