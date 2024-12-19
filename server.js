const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = 3000;

// Connessione MongoDB
mongoose.connect('mongodb+srv://ccbrothers:Metanolo89!@ccbrothers.hx3kl.mongodb.net/?retryWrites=true&w=majority&appName=CCBrothers', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connesso a MongoDB Atlas!');
}).catch((error) => {
    console.error('Errore di connessione:', error);
});

// Schema Utente
const userSchema = new mongoose.Schema({
    nome: String,
    cognome: String,
    nickname: String,
    email: String,
    codice: String,
    acquisti: { type: Number, default: 0 },
    dataRegistrazione: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Schema Rewards
const rewardSchema = new mongoose.Schema({
    level: String,
    requiredPurchases: Number,
    description: String
});

const Reward = mongoose.model('Reward', rewardSchema);

// Middleware essenziali con CORS configurato
app.use(cors({
    origin: ['https://ccbrothers-app.netlify.app', 'https://ccbrothers-admin.netlify.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'admin-token']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

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

// Crea utente admin se non esiste
async function createAdminUser() {
    try {
        const adminExists = await User.findOne({ codice: 'DAXX89' });
        if (!adminExists) {
            await User.create({
                nome: "Luca",
                cognome: "Lembo",
                nickname: "Daxx",
                email: "simiangold@icloud.com",
                codice: "DAXX89",
                acquisti: 0,
                dataRegistrazione: new Date()
            });
            console.log('Utente admin creato con successo!');
        }
    } catch (error) {
        console.error('Errore nella creazione utente admin:', error);
    }
}

// Esegui la creazione dell'utente admin
createAdminUser();

// ROTTE PUBBLICHE

// Registrazione nuovo utente
app.post('/register', async (req, res) => {
    try {
        const { nome, cognome, nickname, email } = req.body;

        if (!nome || !cognome || !nickname || !email) {
            return res.status(400).json({
                success: false,
                message: 'Tutti i campi sono obbligatori.'
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email già registrata.'
            });
        }

        const codiceUnivoco = generateUniqueCode();
        const newUser = await User.create({
            nome,
            cognome,
            nickname,
            email,
            codice: codiceUnivoco,
            acquisti: 0,
            dataRegistrazione: new Date()
        });

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
app.post('/verify-code', async (req, res) => {
    try {
        const { codice } = req.body;

        if (!codice) {
            return res.status(400).json({
                success: false,
                message: 'Codice obbligatorio'
            });
        }

        const persona = await User.findOne({ codice });

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
app.get('/admin/users', verifyAdmin, async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel recupero utenti' });
    }
});

// Modifica utente
app.put('/admin/users/:codice', verifyAdmin, async (req, res) => {
    try {
        const { codice } = req.params;
        const { acquisti } = req.body;

        const user = await User.findOne({ codice });
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }

        user.acquisti += parseInt(acquisti);
        await user.save();

        res.json({ 
            success: true, 
            user 
        });
    } catch (error) {
        res.status(500).json({ message: 'Errore nell\'aggiornamento utente' });
    }
});

// Elimina utente
app.delete('/admin/users/:codice', verifyAdmin, async (req, res) => {
    try {
        const { codice } = req.params;
        const result = await User.deleteOne({ codice });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Errore nell\'eliminazione utente' });
    }
});

// Ottieni statistiche
app.get('/admin/stats', verifyAdmin, async (req, res) => {
    try {
        const users = await User.find();
        
        const stats = {
            totalUsers: users.length,
            totalPurchases: users.reduce((sum, user) => sum + user.acquisti, 0),
            averagePurchases: users.length ? 
                users.reduce((sum, user) => sum + user.acquisti, 0) / users.length : 0,
            usersByLevel: {
                bronze: users.filter(user => user.acquisti < 25).length,
                silver: users.filter(user => user.acquisti >= 25 && user.acquisti < 50).length,
                gold: users.filter(user => user.acquisti >= 50 && user.acquisti < 75).length,
                platinum: users.filter(user => user.acquisti >= 75).length
            }
        };
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel recupero statistiche' });
    }
});

// Applicazione del middleware di gestione errori
app.use(errorHandler);

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server avviato con successo su http://localhost:${PORT}`);
});
