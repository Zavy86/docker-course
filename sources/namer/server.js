const path = require('path');
const express = require('express');

const app = express();

const adjectives = [
  'Brilliant', 'Curious', 'Innovative', 'Legendary', 'Mysterious',
  'Genius', 'Visionary', 'Extraordinary', 'Revolutionary', 'Eccentric'
];

const scientists = [
  'Einstein', 'Curie', 'Tesla', 'Newton', 'Darwin', 'Galilei',
  'Archimede', 'Leonardo', 'Volta', 'Hawking', 'Mendel', 'Pasteur',
  'Franklin', 'Bohr', 'Heisenberg', 'Planck', 'Kepler',
];

app.use(express.static('public'));

function generateRandomName() {
  const randomAdjective = adjectives[ Math.floor(Math.random() * adjectives.length) ];
  const randomScientist = scientists[ Math.floor(Math.random() * scientists.length) ];
  return `${randomAdjective} ${randomScientist}`;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/generate', (req, res) => {
  const name = generateRandomName();
  console.log(`Last generated name: ${name}`);
  res.json(name);
});

app.listen(3000, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:3000`);
});
