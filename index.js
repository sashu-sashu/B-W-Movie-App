const express = require('express');
const morgan = require('morgan');

const app = express();

// error handler
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.use(methodOverride());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use(morgan('common'));


let topMovies = [
    {
      title: 'Coffee and Cigarettes',
      director: 'Jim Jarmusch',
      year: '2003',
      duration: '96 min'
    },
    {
      title: 'Schindler/’s List',
      director: 'J.R.R. Tolkien',
      year: '1993',
      duration: '195 min'
    },
    {
      title: 'Metropolis',
      director: 'Fritz Lang',
      year: '1926',
      duration: '109 min'
    },
    {
      title: 'Psycho',
      director: 'Alfred Hitchcock',
      year: '1960',
      duration: '109 min'
    },
    {
      title: 'To Kill A Mockingbird',
      director: 'Robert Mulligan',
      year: '1962',
      duration: '129 min'
    },
    {
      title: 'All About Eve',
      director: 'Joseph L. Mankiewicz',
      year: '1950',
      duration: '138 min'
    },
    {
      title: 'Casablanca',
      director: 'Starring Humphrey Bogart and Ingrid Bergman',
      year: '1942',
      duration: '102 min'
    },
    {
      title: 'The Seventh Seal',
      director: 'Ingmar Bergman',
      year: '1957',
      duration: '2 h'
    },
    {
      title: 'Modern Times',
      director: 'Charles Chaplin',
      year: '1936',
      duration: '87 min'
    },
    {
      title: '8½',
      director: 'Federico Fellini',
      year: '1963',
      duration: '138 min'
    },
    

  ];

// GET requests
app.get('/', (req, res) => {
  let responseText = 'Welcome to my Movies app!';
  responseText += '<small>Requested at: ' + req.requestTime + '</small>';
  res.send(responseText);
});

app.get('/movies', (req, res) => {                  
  res.sendFile('public/movies.html', { root: __dirname });
});

app.get('/documentation', (req, res) => {                  
  res.sendFile('public/documentation.html', { root: __dirname });
});

// function for static files
// this syntax does not work
//app.use('/documentation', express.static('public'));

// listen for requests
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});