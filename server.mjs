import express from 'express';
import session from 'express-session';
import { fileURLToPath } from 'url';
import path from 'path';
import sqlite3 from 'sqlite3';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const databasePath = path.join(__dirname, 'Database', 'gamebase.db');

const app = express();
const port = process.env.PORT || 3000;

let db = null;

app.use(session({
  secret: 'session-secret-key',
  resave: false,
  saveUninitialized: true
}));
app.use(express.json());
// Ustawienie ścieżki do folderu z plikami statycznymi (public)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/Extras/Cursors', express.static(path.join(__dirname, '/Extras/Cursors')));
app.use('/Extras/Fonts', express.static(path.join(__dirname, '/Extras/Fonts')));
app.use('/Extras/Sounds', express.static(path.join(__dirname, '/Extras/Sounds')));
app.use('/Graphics/GUI', express.static(path.join(__dirname, '/Graphics/GUI')));
app.use('/Graphics/Heroes', express.static(path.join(__dirname, '/Graphics/Heroes')));
app.use('/Graphics/NPCs', express.static(path.join(__dirname, '/Graphics/NPCs')));
app.use('/Graphics/Maps', express.static(path.join(__dirname, '/Graphics/Maps')));
app.use('/Graphics/Monsters', express.static(path.join(__dirname, '/Graphics/Monsters')));
app.use('/Graphics/Weapons', express.static(path.join(__dirname, '/Graphics/Weapons')));
// app.use('/javascript/objects', express.static(path.join(__dirname, 'javascript/objects')));
// app.use('/node_modules/sqlite3', express.static(path.join(__dirname, '/node_modules/sqlite3')));

// Routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
})

// Serwowanie pliku skrypt.js z folderu "JavaScript" w głównym folderze projektu
app.get('/login.mjs', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript', 'login.mjs'));
});

app.get('/skrypt.mjs', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript', 'skrypt.mjs'));
});

app.get('/progress.mjs', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript', 'progress.mjs'));
});

app.get('/collisions.mjs', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript', 'collisions.mjs'));
});

app.get('/sounds.mjs', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript', 'sounds.mjs'));
});

app.get('/collisionsMap.mjs', (req, res) => {
  res.sendFile(path.join(__dirname, '/javascript/objects', 'collisionsMap.mjs'));
});

app.get('/charactersMap.mjs', (req, res) => {
  res.sendFile(path.join(__dirname, '/javascript/objects', 'charactersMap.mjs'));
});

app.get('/monstersMap.mjs', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript/objects', 'monstersMap.mjs'));
});

app.get('/locationsMap.mjs', (req, res) => {
  res.sendFile(path.join(__dirname, '/javascript/objects', 'locationsMap.mjs'));
});

app.get('/quests.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript/objects', 'quests.json'));
});

app.get('/dialogues.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript/objects', 'dialogues.json'));
});

app.get('/statistics.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript/objects', 'statistics.json'));
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

app.get('/requests.mjs', (req, res) => {
  res.sendFile(path.join(__dirname, 'javascript', 'requests.mjs'));
});

app.get('/game/database/connect', (req, res) => {
  db = new sqlite3.Database(databasePath, (err) => {
    if (err) {
      res.status(500).json({ message: err.message });
    } else {
      res.json({ message: 'Connected to the database successfully!' });
    }
  });
});

app.get('/game/auth', (req, res) => {
  res.json({ user: req.session.userId });
});

app.post('/game/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM user WHERE username = ? AND password = ?', [username, password], (err, row) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }

      if (row) {
          req.session.userId = row.id_user;
          req.session.username = row.username;
          console.log(req.session);
          return res.json({ success: true, user: row });
      } else {
          return res.json({ success: false, message: 'Invalid username or password!' });
      }
  });
});

app.get('/game/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.json({ success: false, message: 'Error destroying session!' });
    } else {
      return res.json({ success: true });
    }
  });
});

app.post('/game/register', (req, res) => {
  const { username, password } = req.body;

  // Check if the user already exists
  db.get('SELECT * FROM user WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      return res.json({ success: false, message: 'User already exists.' });
    }
    // Insert the new user if they don't already exist
    db.run('INSERT INTO user (username, password) VALUES (?, ?)', [username, password], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
        const id = this.lastID;
        req.session.userId = id;
        req.session.username = username;
        console.log(req.session);
        return res.json({ success: true, message: 'User was created successfully!' });
    });
  });
});

app.post('/game/create-hero', (req, res) => {
  db.run('INSERT INTO hero (hero_name, id_user) VALUES (?, ?)', [req.session.username, req.session.userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json({ success: true, message: 'Hero was created successfully!' });
  });
})

app.post('/game/create-invenotry', (req, res) => {
  const { frame } = req.body;
  db.run('INSERT INTO inventory (frame, id_user) VALUES (?, ?)', [frame, req.session.userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json({ success: true, message: 'Invenotry was created successfully!' });
  });
})

app.get('/game/load-assets', (req, res) => {
  db.all('SELECT * FROM assets', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json({ assets: rows });
  });
});

app.get('/game/load-items', (req, res) => {
  db.all('SELECT * FROM items', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json({ items: rows });
  });
});

app.post('/game/save-inventory', async (req, res) => {
  const { name, frame } = req.body;

  // Sprawdź, czy istnieje rekord o danej nazwie przedmiotu i dla danego użytkownika
  const selectQuery = 'SELECT COUNT(*) AS count FROM inventory WHERE item_name = ? AND id_user = ?';

  db.get(selectQuery, [name, req.session.userId], async (err, result) => {
      if (err) {
          return res.status(500).json({ message: err.message });
      }

      const existingRecordCount = result.count;

      // Jeżeli rekord istnieje, zaktualizuj
      if (existingRecordCount > 0) {
          const updateQuery = 'UPDATE inventory SET frame = ? WHERE item_name = ? AND id_user = ?';

          db.run(updateQuery, [frame, name, req.session.userId], (updateErr) => {
              if (updateErr) {
                  return res.status(500).json({ message: updateErr.message });
              }
              return res.json({ message: 'Inventory was updated!' });
          });
      } else {
          // Jeżeli rekord nie istnieje, wstaw nowy
          const insertQuery = 'INSERT INTO inventory (item_name, frame, id_user) VALUES (?, ?, ?)';

          db.run(insertQuery, [name, frame, req.session.userId], (insertErr) => {
              if (insertErr) {
                  return res.status(500).json({ message: insertErr.message });
              }
              return res.json({ message: 'New item was inserted into inventory!' });
          });
      }
  });
});


app.get('/game/load-inventory', (req, res) => {
  db.all('SELECT item_name, frame FROM inventory WHERE id_user = ?', [req.session.userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json({ inventory: rows });
  });
});

app.post('/game/save-game', (req, res) => {
  console.log(req.session.userId);
  const { posX, posY, stage, monsters, places } = req.body;
  db.run(`UPDATE hero
          SET position_x = ?, position_y = ?, current_stage = ?, killed_monsters = ?, founded_places = ?
          WHERE id_user = ?`, [posX, posY, stage, monsters, places, req.session.userId], (err) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    return res.json({ message: 'Saved successfully!' });
  });
});

app.get('/game/load-game', (req, res) => {
  db.all(`SELECT hero_name, position_x, position_y, current_stage, killed_monsters, founded_places
          FROM hero
          WHERE id_user = ?`, [req.session.userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json({ hero: rows });
  });
});

// Uruchomienie serwera
app.listen(port, () => {
  console.log(`Serwer działa na porcie ${port}`);
});
