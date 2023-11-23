import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const databasePath = path.join(__dirname, 'Database', 'gamebase.db');

const app = express();
const port = process.env.PORT || 3000;

let db = null;

app.use(express.json());
// Ustawienie ścieżki do folderu z plikami statycznymi (public)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/Extras/Fonts', express.static(path.join(__dirname, '/Extras/Fonts')));
app.use('/Graphics/GUI', express.static(path.join(__dirname, '/Graphics/GUI')));
app.use('/Graphics/Heroes', express.static(path.join(__dirname, '/Graphics/Heroes')));
app.use('/Graphics/Maps', express.static(path.join(__dirname, '/Graphics/Maps')));
app.use('/Graphics/Monsters', express.static(path.join(__dirname, '/Graphics/Monsters')));
app.use('/Graphics/Weapons', express.static(path.join(__dirname, '/Graphics/Weapons')));
// app.use('/node_modules/sqlite3', express.static(path.join(__dirname, '/node_modules/sqlite3')));


// Routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ustawienie typu MIME dla plików CSS
app.get('/styles.css', (req, res) => {
  res.set('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, 'public', 'styles.css'));
});

// Serwowanie pliku skrypt.js z folderu "JavaScript" w głównym folderze projektu
app.get('/skrypt.mjs', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript', 'skrypt.mjs'));
});

app.get('/connection.mjs', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript', 'connection.mjs'));
});

app.get('/config.mjs', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript', 'config.mjs'));
});

app.get('/characters.mjs', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript', 'characters.mjs'));
});

app.get('/utilities.mjs', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript', 'utilities.mjs'));
});

app.get('/images.mjs', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript', 'images.mjs'));
});

app.get('/inventory.mjs', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript', 'inventory.mjs'));
});

app.get('/api/connect', (req, res) => {
  db = new sqlite3.Database(databasePath, (err) => {
    if (err) {
      res.status(500).json({ message: err.message });
    } else {
      res.json({ message: 'Connected to the database successfully!' });
    }
  });
});

app.get('/api/load-assets', (req, res) => {
  db.all('SELECT * FROM assets', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ assets: rows });
  });
});

app.get('/api/load-items', (req, res) => {
  db.all('SELECT * FROM items', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ items: rows });
  });
});

app.post('/api/save-inventory', (req, res) => {
  const { name, frame } = req.body;
  db.run('UPDATE inventory SET frame = ? WHERE item_name = ?', [frame, name], (err) => {
    if (err) {
      res.status(500).json({ message: err.message });
    } else {
      res.json({ message: 'Inventory was updated!' });
    }
  });
});

app.get('/api/load-inventory', (req, res) => {
  db.all('SELECT item_name, frame FROM inventory', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ inventory: rows });
  });
});

app.get('/api/clear-inventory', (req, res) => {
  db.run('DELETE FROM inventory', (err) => {
    if (err) {
      res.status(500).json({ message: err.message });
    } else {
      res.json({ message: 'Error clearing inventory!' });
    }
  });
});

// Uruchomienie serwera
app.listen(port, () => {
  console.log(`Serwer działa na porcie ${port}`);
});
