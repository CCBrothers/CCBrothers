const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware essenziali
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Configurazione paths
const DATABASE_PATH = path.join(__dirname, 'database.json');
const REWARDS_PATH = path.join(__dirname, 'rewards.json');

// Inizializza il database se non esiste
if (!fs.existsSync(DATABASE_PATH)) {
    fs.writeFileSync(DATABASE_PATH, '[]', 'utf8');
}

// Funzioni di utilità per il database
const readDatabase = () => {
    try {
        const data = fs.readFileSync(DATABASE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Errore nella lettura del database:', error);
        return [];
    }
};

const writeDatabase = (data) => {
    try {
        fs.writeFileSync(DATABASE_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Errore nella scrittura del database:', error);
        return false;
    }
};

const readRewards = () => {
    if (!fs.existsSync(REWARDS_PATH)) {
        const defaultRewards = [
            { id: 1, level: "LEVEL 1", requiredPurchases: 25, description: "10% Sconto su tutti i prodotti" },
            { id: 2, level: "LEVEL 2", requiredPurchases: 50, description: "Accesso anticipato alle nuove uscite" },
            { id: 3, level: "LEVEL 3", requiredPurchases: 75, description: "Card Collector esclusiva omaggio" }
        ];
        fs.writeFileSync(REWARDS_PATH, JSON.stringify(defaultRewards, null, 2));
        return defaultRewards;
    }
    return JSON.parse(fs.readFileSync(REWARDS_PATH, 'utf8'));
};

const writeRewards = (data) => {
    try {
        fs.writeFileSync(REWARDS_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Errore nella scrittura dei rewards:', error);
        return false;
    }
};

// Funzione per generare codice univoco
const generateUniqueCode = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
};

// Middleware per verificare l'autenticazione admin
const verifyAdmin = (req, res, next) => {
    const adminToken = req.headers['admin-token'];
    if (adminToken === 'your-secure-admin-token') {
        next();
    } else {
        res.status(401).json({ message: 'Non autorizzato' });
    }
};

// Middleware per gestire gli errori
const errorHandler = (err, req, res, next) => {
    console.error('Errore:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Si è verificato un errore interno del server.' 
    });
};

// Funzione per generare il primo utente
const createFirstUser = () => {
    const firstUser = {
        nome: "Luca",
        cognome: "Lembo",
        nickname: "Daxx",
        email: "simiangold@icloud.com",
        codice: "DAXX89", // Manteniamo tutto maiuscolo per coerenza
        acquisti: 0,
        dataRegistrazione: new Date().toISOString()
    };

    writeDatabase([firstUser]);
    console.log('Primo utente creato con successo!');
};

if (readDatabase().length === 0) {
    createFirstUser();
}

// ROTTE PUBBLICHE

// Registrazione nuovo utente
app.post('/register', (req, res) => {
    try {
        const { nome, cognome, nickname, email } = req.body;

        if (!nome || !cognome || !nickname || !email) {
            return res.status(400).json({
                success: false,
                message: 'Tutti i campi sono obbligatori.'
            });
        }

        const database = readDatabase();
        
        if (database.some(user => user.email === email)) {
            return res.status(400).json({
                success: false,
                message: 'Email già registrata.'
            });
        }

        const codiceUnivoco = generateUniqueCode();
        const newUser = {
            nome,
            cognome,
            nickname,
            email,
            codice: codiceUnivoco,
            acquisti: 0,
            dataRegistrazione: new Date().toISOString()
        };

        database.push(newUser);
        writeDatabase(database);

        res.status(201).json({
            success: true,
            message: 'Registrazione completata con successo',
            codice: codiceUnivoco
        });
    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante la registrazione'
        });
    }
});

// Verifica codice utente
app.post('/verify-code', (req, res) => {
    try {
        const { codice } = req.body;

        if (!codice) {
            return res.status(400).json({
                success: false,
                message: 'Codice obbligatorio'
            });
        }

        const database = readDatabase();
        const persona = database.find(p => p.codice === codice);

        if (!persona) {
            return res.status(404).json({
                success: false,
                message: 'Utente non trovato'
            });
        }

        res.json({
            success: true,
            message: 'Utente trovato',
            persona
        });
    } catch (error) {
        console.error('Errore durante la verifica del codice:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante la verifica del codice'
        });
    }
});

// ROTTE ADMIN

// Login admin
app.post('/admin/login', (req, res) => {
    console.log('Tentativo di login admin:', req.body);
    const { username, password } = req.body;
    
    if (username === 'Daxx' && password === 'Metanolo89!') {
        res.json({ 
            success: true, 
            token: 'your-secure-admin-token' 
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Credenziali non valide' 
        });
    }
});

// Ottieni lista utenti
app.get('/admin/users', verifyAdmin, (req, res) => {
    const database = readDatabase();
    res.json(database);
});

// Modifica utente
app.put('/admin/users/:codice', verifyAdmin, (req, res) => {
    const { codice } = req.params;
    const updateData = req.body;
    
    const database = readDatabase();
    const userIndex = database.findIndex(user => user.codice === codice);
    
    if (userIndex === -1) {
        return res.status(404).json({ message: 'Utente non trovato' });
    }

    const currentUser = database[userIndex];
    const newAcquisti = currentUser.acquisti + parseInt(updateData.acquisti);

    database[userIndex] = {
        ...currentUser,
        acquisti: newAcquisti
    };

    writeDatabase(database);
    
    res.json({ 
        success: true, 
        user: database[userIndex] 
    });
});

// Aggiornamento acquisti
app.post('/update-purchase', (req, res) => {
    try {
        const { codice, acquisti } = req.body;
        
        if (!codice || acquisti === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Codice e numero di acquisti sono obbligatori'
            });
        }

        const database = readDatabase();
        const userIndex = database.findIndex(user => user.codice === codice);

        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Utente non trovato'
            });
        }

        // SOMMA i nuovi acquisti a quelli esistenti
        const currentUser = database[userIndex];
        const newTotal = currentUser.acquisti + parseInt(acquisti);

        database[userIndex] = {
            ...currentUser,
            acquisti: newTotal
        };

        writeDatabase(database);

        res.json({
            success: true,
            message: 'Acquisti aggiornati con successo',
            persona: database[userIndex]
        });
    } catch (error) {
        console.error('Errore durante l\'aggiornamento degli acquisti:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante l\'aggiornamento degli acquisti'
        });
    }
});
// Elimina utente
app.delete('/admin/users/:codice', verifyAdmin, (req, res) => {
    const { codice } = req.params;
    
    const database = readDatabase();
    const filteredDb = database.filter(user => user.codice !== codice);
    
    if (filteredDb.length === database.length) {
        return res.status(404).json({ message: 'Utente non trovato' });
    }
    
    writeDatabase(filteredDb);
    res.json({ success: true });
});

// Ottieni statistiche
app.get('/admin/stats', verifyAdmin, (req, res) => {
    const database = readDatabase();
    
    const stats = {
        totalUsers: database.length,
        totalPurchases: database.reduce((sum, user) => sum + user.acquisti, 0),
        averagePurchases: database.length ? 
            database.reduce((sum, user) => sum + user.acquisti, 0) / database.length : 0,
        usersByLevel: {
            bronze: database.filter(user => user.acquisti < 25).length,
            silver: database.filter(user => user.acquisti >= 25 && user.acquisti < 50).length,
            gold: database.filter(user => user.acquisti >= 50 && user.acquisti < 75).length,
            platinum: database.filter(user => user.acquisti >= 75).length
        }
    };
    
    res.json(stats);
});

// Ottieni rewards
app.get('/admin/rewards', verifyAdmin, (req, res) => {
    const rewards = readRewards();
    res.json(rewards);
});

// Aggiungi reward
app.post('/admin/rewards', verifyAdmin, (req, res) => {
    const rewards = readRewards();
    const newReward = {
        id: Date.now(),
        ...req.body
    };
    
    rewards.push(newReward);
    writeRewards(rewards);
    
    res.json({ 
        success: true, 
        reward: newReward 
    });
});

// Modifica reward
app.put('/admin/rewards/:id', verifyAdmin, (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const rewards = readRewards();
    const rewardIndex = rewards.findIndex(r => r.id === parseInt(id));
    
    if (rewardIndex === -1) {
        return res.status(404).json({ message: 'Reward non trovato' });
    }
    
    rewards[rewardIndex] = { ...rewards[rewardIndex], ...updateData };
    writeRewards(rewards);
    
    res.json({ 
        success: true, 
        reward: rewards[rewardIndex] 
    });
});

// Elimina reward
app.delete('/admin/rewards/:id', verifyAdmin, (req, res) => {
    const { id } = req.params;
    
    const rewards = readRewards();
    const filteredRewards = rewards.filter(r => r.id !== parseInt(id));
    
    if (filteredRewards.length === rewards.length) {
        return res.status(404).json({ message: 'Reward non trovato' });
    }
    
    writeRewards(filteredRewards);
    res.json({ success: true });
});

// Applicazione del middleware di gestione errori
app.use(errorHandler);

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server avviato con successo su http://localhost:${PORT}`);
});
