const express = require('express');
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');
const fs = require('fs');
const csv = require('fast-csv');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const db = new sqlite3.Database('data.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS inputs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      input1 DATE,
      input2 TEXT,
      input3 TEXT,
      input4 TEXT,
      input5 TEXT,
      input6 TEXT,
      input7 TEXT
    )`);
  }
});

app.get('/', (req, res) => {
  db.all(`SELECT * FROM inputs`, (err, rows) => {
    if (err) {
      console.error(err.message);
      res.send('Error fetching data');
    } else {
      res.render('form', { inputs: rows });
    }
  });
});

app.post('/submit-form', (req, res) => {
  const { input1, input2, input3, input4, input5, input6, input7 } = req.body;

  db.run(`INSERT INTO inputs (input1, input2, input3, input4, input5, input6, input7) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [input1, input2, input3, input4, input5, input6, input7],
    (err) => {
      if (err) {
        console.error(err.message);
        res.send('Error submitting the form');
      } else {
        res.redirect('/');
      }
    });
});
// Download data as CSV
app.get('/download-csv', (req, res) => {
  db.all(`SELECT * FROM inputs`, (err, rows) => {
    if (err) {
      console.error(err.message);
      res.send('Error downloading data');
    } else {
      const csvStream = csv.format({ headers: true });
      const writableStream = fs.createWriteStream('inputs.csv', { encoding: 'utf8' });

      const headers = [
        'Date',
        'Centre Name',
        'Vehicle Number',
        'Bags',
        'Quantity',
        'Gunny details',
        'Bill No'
      ];

      writableStream.on('finish', () => {
        res.download('inputs.csv');
      });

      csvStream.pipe(writableStream);

      csvStream.write(headers);

      rows.forEach(row => {
        const formattedRow = [
          row.input1, // Date
          row.input2, // Centre Name
          row.input3, // Vehicle Number
          row.input4, // Bags
          row.input5, // Quantity
          row.input6, // Gunny details
          row.input7  // Bill No
        ];
        csvStream.write(formattedRow);
      });

      csvStream.end();
    }
  });
});




app.post('/delete-row/:id', (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM inputs WHERE id = ?`, id, (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Error deleting row' });
    } else {
      res.status(200).json({ message: 'Row deleted successfully' });
    }
  });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
