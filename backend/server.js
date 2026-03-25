const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running\n');
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('exit', (code) => {
  console.log('Process exiting with code', code);
});

process.on('SIGINT', () => {
  console.log('Stopped with Ctrl+C');
  process.exit(0);
});