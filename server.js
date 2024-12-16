const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan'); // Logger per le richieste
const Joi = require('joi'); // Validazione dei dati

const app = express();
const PORT = process.env.PORT || 3000;

// Configurazione CORS
const corsOptions = {
    origin: 'https://ccbrothers-app.netlify.app', // Dominio del tuo frontend
    credentials: true, // Permette l'uso di cookie o credenziali
};
app.use(cors(corsOptions));

// Middleware essenziali
app.use(express.json());
app.use(morgan('combined')); // Logger delle richieste

// Configurazione dei percorsi
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
    } catch (error) {
        console.error('Errore nella scrittura del database:', error);
    }
};

const readRewards = () => {
    if (!fs.existsSync(REWARDS_PATH)) {
        const defaultRewards = [
            { id: 1, level: "LEVEL 1", requiredPurchases: 25, description: "10% Sconto su tutti i prodotti" },
            { id: 2, level: "LEVEL 2", requiredPurchases: 50, description: "Accesso anticipato alle nuove uscite" },
            { id: 3, level: "LEVEL 3", requiredPurchases: 75, description: "Card Collector esclusiva omaggio" },
        ];
        fs.writeFileSync(REWARDS_PATH, JSON.stringify(defaultRewards, null, 2), 'utf8');
        return defaultRewards;
    }
    return JSON.parse(fs.readFileSync(REWARDS_PATH, 'utf8'));
};

const writeRewards = (data) => {
    try {
        fs.writeFileSync(REWARDS_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Errore nella scrittura dei rewards:', error);
    }
};

// Genera un codice univoco
const generateUniqueCode = () => Math.random().toString(36).substr(2, 8).toUpperCase();

// Middleware per verificare l'autenticazione admin
const verifyAdmin = (req, res, next) => {
    const adminToken = req.headers['admin-token'];
    const validToken = process.env.ADMIN_TOKEN || 'your-secure-admin-token';
    if (adminToken === validToken) {
        next();
    } else {
        res.status(401).json({ message: 'Non autorizzato' });
    }
};

// Rotte pubbliche

// Validazione dei dati di registrazione
const userSchema = Joi.object({
    nome: Joi.string().min(2).required(),
    cognome: Joi.string().min(2).required(),
    nickname: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
});

// Registrazione di un nuovo utente
app.post('/register', (req, res) => {
    try {
        const { error } = userSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { nome, cognome, nickname, email } = req.body;
        const database = readDatabase();

        if (database.some(user => user.email === email)) {
            return res.status(400).json({
                success: false,
                message: 'Email già registrata',
            });
        }

        const newUser = {
            nome,
            cognome,
            nickname,
            email,
            codice: generateUniqueCode(),
            acquisti: 0,
            dataRegistrazione: new Date().toISOString(),
        };

        database.push(newUser);
        writeDatabase(database);

        res.status(201).json({
            success: true,
            message: 'Registrazione completata con successo',
            codice: newUser.codice,
        });
    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante la registrazione',
        });
    }
});

// Verifica codice univoco
app.post('/verify-code', (req, res) => {
    try {
        const { codice } = req.body;
        if (!codice) {
            return res.status(400).json({ success: false, message: 'Codice obbligatorio' });
        }

        const database = readDatabase();
        const user = database.find(u => u.codice === codice);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utente non trovato' });
        }

        res.json({ success: true, message: 'Utente trovato', user });
    } catch (error) {
        console.error('Errore durante la verifica del codice:', error);
        res.status(500).json({ success: false, message: 'Errore durante la verifica' });
    }
});

// Rotte admin

// Login admin
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'Daxx' && password === 'Metanolo89!') {
        res.json({ success: true, token: process.env.ADMIN_TOKEN || 'your-secure-admin-token' });
    } else {
        res.status(401).json({ success: false, message: 'Credenziali non valide' });
    }
});

// Ottieni lista utenti
app.get('/admin/users', verifyAdmin, (req, res) => {
    const database = readDatabase();
    res.json(database);
});

// Middleware per gestire gli errori
app.use((err, req, res, next) => {
    console.error('Errore:', err);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
});

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});
