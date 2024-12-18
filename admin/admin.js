document.addEventListener('DOMContentLoaded', () => {
    let adminToken = '';  // Variabile per memorizzare il token

    // Gestione del login
    const loginForm = document.getElementById('admin-login-form');
    const loginContainer = document.getElementById('login-container');
    const adminDashboard = document.getElementById('admin-dashboard');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;

        try {
            const response = await fetch('https://ccbrothers-backend.onrender.com/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (response.ok) {
                adminToken = data.token;  // Salva il token
                loginContainer.style.display = 'none';
                adminDashboard.style.display = 'block';
                loadInitialData();
            } else {
                alert('Credenziali non valide');
            }
        } catch (error) {
            console.error('Errore durante il login:', error);
            alert('Errore durante il login');
        }
    });

    // Gestione della navigazione
    const navButtons = document.querySelectorAll('.nav-items button[data-section]');
    const sections = document.querySelectorAll('.admin-section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            sections.forEach(section => section.style.display = 'none');
            document.getElementById(`${button.dataset.section}-section`).style.display = 'block';
        });
    });

    // Caricamento degli utenti
    async function loadUsers() {
        try {
            const response = await fetch('https://ccbrothers-backend.onrender.com/admin/users', {
                headers: {
                    'admin-token': adminToken
                }
            });
            const users = await response.json();
            
            const tbody = document.getElementById('users-table-body');
            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.nome}</td>
                    <td>${user.cognome}</td>
                    <td>${user.nickname}</td>
                    <td>${user.codice}</td>
                    <td>${user.acquisti}</td>
                    <td>
                        <button onclick="editUser('${user.codice}')">Modifica</button>
                        <button onclick="deleteUser('${user.codice}')">Elimina</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Errore nel caricamento degli utenti:', error);
        }
    }

    // Caricamento delle statistiche
    async function loadStats() {
        try {
            const response = await fetch('https://ccbrothers-backend.onrender.com/admin/stats', {
                headers: {
                    'admin-token': adminToken
                }
            });
            const stats = await response.json();
            
            document.getElementById('total-users').textContent = stats.totalUsers;
            document.getElementById('total-purchases').textContent = stats.totalPurchases;
            document.getElementById('avg-purchases').textContent = stats.averagePurchases.toFixed(1);

            // Aggiunta visualizzazione per livelli utente
            const levelStats = stats.usersByLevel;
            const levelBreakdown = `
                <div class="level-stats">
                    <p>Bronze: ${levelStats.bronze}</p>
                    <p>Silver: ${levelStats.silver}</p>
                    <p>Gold: ${levelStats.gold}</p>
                    <p>Platinum: ${levelStats.platinum}</p>
                </div>
            `;
            document.querySelector('.stats-grid').insertAdjacentHTML('beforeend', levelBreakdown);
        } catch (error) {
            console.error('Errore nel caricamento delle statistiche:', error);
        }
    }

    // Caricamento dei rewards
    async function loadRewards() {
        try {
            const response = await fetch('https://ccbrothers-backend.onrender.com/admin/rewards', {
                headers: {
                    'admin-token': adminToken
                }
            });
            const rewards = await response.json();
            
            const rewardsList = document.getElementById('rewards-list');
            rewardsList.innerHTML = rewards.map(reward => `
                <div class="reward-item">
                    <h3>${reward.level} - ${reward.requiredPurchases} Acquisti</h3>
                    <p>${reward.description}</p>
                    <div class="reward-actions">
                        <button onclick="editReward(${reward.id})">Modifica</button>
                        <button onclick="deleteReward(${reward.id})">Elimina</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Errore nel caricamento dei rewards:', error);
        }
    }

    // Funzioni per la gestione utenti
    window.editUser = async function(codice) {
        const newAcquisti = prompt('Inserisci il nuovo numero di acquisti:');
        if (newAcquisti === null) return;

        try {
            const response = await fetch(`https://ccbrothers-backend.onrender.com/admin/users/${codice}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'admin-token': adminToken
                },
                body: JSON.stringify({ acquisti: parseInt(newAcquisti) })
            });

            if (response.ok) {
                alert('Utente aggiornato con successo');
                loadUsers();  // Ricarica la lista utenti
                loadStats(); // Aggiorna le statistiche
            } else {
                alert('Errore durante l\'aggiornamento');
            }
        } catch (error) {
            console.error('Errore durante la modifica:', error);
            alert('Errore durante la modifica');
        }
    };

    window.deleteUser = async function(codice) {
        if (!confirm('Sei sicuro di voler eliminare questo utente?')) return;

        try {
            const response = await fetch(`https://ccbrothers-backend.onrender.com/admin/users/${codice}`, {
                method: 'DELETE',
                headers: {
                    'admin-token': adminToken
                }
            });

            if (response.ok) {
                alert('Utente eliminato con successo');
                loadUsers();  // Ricarica la lista utenti
                loadStats(); // Aggiorna le statistiche
            } else {
                alert('Errore durante l\'eliminazione');
            }
        } catch (error) {
            console.error('Errore durante l\'eliminazione:', error);
            alert('Errore durante l\'eliminazione');
        }
    };

    // Gestione acquisti
    const addPurchaseBtn = document.getElementById('add-purchase-btn');
    if (addPurchaseBtn) {
        addPurchaseBtn.addEventListener('click', async () => {
            const codice = document.getElementById('user-code').value;
            const acquisti = parseInt(document.getElementById('purchase-amount').value);

            if (!codice || isNaN(acquisti) || acquisti <= 0) {
                alert('Inserisci un codice utente valido e un numero di acquisti positivo');
                return;
            }

            try {
                const response = await fetch(`https://ccbrothers-backend.onrender.com/admin/users/${codice}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'admin-token': adminToken
                    },
                    body: JSON.stringify({ acquisti })
                });

                const data = await response.json();
                
                if (response.ok) {
                    alert(`Acquisti aggiornati con successo per l'utente`);
                    document.getElementById('user-code').value = '';
                    document.getElementById('purchase-amount').value = '';
                    
                    // Aggiorna la cronologia acquisti
                    addPurchaseToHistory(codice, acquisti);
                    
                    // Ricarica i dati
                    await Promise.all([loadUsers(), loadStats()]);
                } else {
                    alert(data.message || 'Errore durante l\'aggiornamento degli acquisti');
                }
            } catch (error) {
                console.error('Errore:', error);
                alert('Errore durante l\'aggiornamento degli acquisti');
            }
        });
    }

    // Funzione per aggiungere acquisto alla cronologia
    function addPurchaseToHistory(codice, acquisti) {
        const historyContainer = document.getElementById('purchase-history');
        if (historyContainer) {
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            
            const purchaseElement = document.createElement('div');
            purchaseElement.className = 'purchase-item new';
            purchaseElement.innerHTML = `
                <div class="purchase-info">
                    <span class="purchase-code">${codice}</span>
                    <span class="purchase-amount">+${acquisti} acquisti</span>
                </div>
                <span class="purchase-time">${timeString}</span>
            `;

            historyContainer.insertBefore(purchaseElement, historyContainer.firstChild);

            if (historyContainer.children.length > 50) {
                historyContainer.lastChild.remove();
            }
        }
    }

    // Gestione dei rewards
    window.editReward = async function(id) {
        const newLevel = prompt('Inserisci il nuovo livello:');
        const newRequiredPurchases = prompt('Inserisci il numero di acquisti richiesti:');
        const newDescription = prompt('Inserisci la nuova descrizione:');
        
        if (!newLevel || !newRequiredPurchases || !newDescription) return;

        try {
            const response = await fetch(`https://ccbrothers-backend.onrender.com/admin/rewards/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'admin-token': adminToken
                },
                body: JSON.stringify({
                    level: newLevel,
                    requiredPurchases: parseInt(newRequiredPurchases),
                    description: newDescription
                })
            });

            if (response.ok) {
                alert('Reward aggiornato con successo');
                loadRewards();  // Ricarica la lista dei rewards
            } else {
                alert('Errore durante l\'aggiornamento');
            }
        } catch (error) {
            console.error('Errore durante la modifica:', error);
            alert('Errore durante la modifica');
        }
    };

    window.deleteReward = async function(id) {
        if (!confirm('Sei sicuro di voler eliminare questo reward?')) return;

        try {
            const response = await fetch(`https://ccbrothers-backend.onrender.com/admin/rewards/${id}`, {
                method: 'DELETE',
                headers: {
                    'admin-token': adminToken
                }
            });

            if (response.ok) {
                alert('Reward eliminato con successo');
                loadRewards();
            } else {
                alert('Errore durante l\'eliminazione');
            }
        } catch (error) {
            console.error('Errore durante l\'eliminazione:', error);
            alert('Errore durante l\'eliminazione');
        }
    };

    // Gestione aggiunta nuovo reward
    const addRewardBtn = document.getElementById('add-reward');
    if (addRewardBtn) {
        addRewardBtn.addEventListener('click', async () => {
            const level = prompt('Inserisci il livello:');
            const requiredPurchases = prompt('Inserisci il numero di acquisti richiesti:');
            const description = prompt('Inserisci la descrizione:');
            
            if (!level || !requiredPurchases || !description) return;

            try {
                const response = await fetch('https://ccbrothers-backend.onrender.com/admin/rewards', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'admin-token': adminToken
                    },
                    body: JSON.stringify({
                        level,
                        requiredPurchases: parseInt(requiredPurchases),
                        description
                    })
                });

                if (response.ok) {
                    alert('Nuovo reward aggiunto con successo');
                    loadRewards();
                } else {
                    alert('Errore durante l\'aggiunta');
                }
            } catch (error) {
                console.error('Errore:', error);
                alert('Errore durante l\'aggiunta del reward');
            }
        });
    }

    // Caricamento iniziale dei dati
    async function loadInitialData() {
        await Promise.all([
            loadUsers(),
            loadStats(),
            loadRewards()
        ]);
    }

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        adminToken = '';  // Reset del token
        loginContainer.style.display = 'flex';
        adminDashboard.style.display = 'none';
    });
});
