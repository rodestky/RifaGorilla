const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

app.use(express.json());
app.use(express.static('public'));

app.get('/publico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'publico.html'));
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS numeros (
      numero INTEGER PRIMARY KEY,
      comprador TEXT NOT NULL
    )
  `);
}

app.get('/api/numeros', async (req, res) => {
  const result = await pool.query('SELECT numero, comprador FROM numeros');
  const data = {};
  result.rows.forEach(r => data[r.numero] = r.comprador);
  res.json(data);
});

app.post('/api/numeros/:num', async (req, res) => {
  const num = parseInt(req.params.num);
  const { nombre } = req.body;
  if (!nombre || num < 1 || num > 100)
    return res.status(400).json({ error: 'Datos inválidos' });
  try {
    await pool.query(
      'INSERT INTO numeros (numero, comprador) VALUES ($1, $2)',
      [num, nombre]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(409).json({ error: 'Número ya tomado' });
  }
});

app.delete('/api/numeros/:num', async (req, res) => {
  const num = parseInt(req.params.num);
  await pool.query('DELETE FROM numeros WHERE numero = $1', [num]);
  res.json({ ok: true });
});

init().then(() => {
  app.listen(PORT, () => console.log(`Rifa corriendo en puerto ${PORT}`));
});
