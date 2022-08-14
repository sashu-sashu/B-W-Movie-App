const express = require('express');
const morgan = require('morgan');
const movieList = require('./public/movie-list.json');
const uuid = require('uuid');
//const app = express();

// error handler
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const app = express();

const methodOverride = require('method-override');

// integrating Mongoose
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;
const Directors = Models.Director;
const Genres = Models.Genre;

mongoose.connect('mongodb://localhost:27017/BW_Movies', { useNewUrlParser: true, useUnifiedTopology: true });
/*
app.use(bodyParser.urlencoded({
  extended: true
}));*/

let users = [
  {
    id: 1,
    name: "Gretchen",
    favoriteMovies: ["Psycho"]
  },
  {
    id: 2,
    name: "Ada",
    favoriteMovies: []
  }
]  

app.use(bodyParser.json());
app.use(methodOverride());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use(morgan('common'));

// CREATE new user
app.post('/users', (req, res) => {
  const newUser = req.body;

  if (newUser.name) {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).json(newUser);
  } else {
    res.status(400).send('Users need names!');
  }
});

// UPDATE user name
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find( user => user.id == id ); //search user by id

  if (user) {
    user.name = updatedUser.name;
    res.status(200).json(user);
  } else {
    res.status(400).send('No such user found!');
  }
});

// Remove user
app.delete('/users/:id/', (req, res) => {
  const { id } = req.params;

  let user = users.find( user => user.id == id ); //search user by id

  if (user) {
    users= users.filter( user => user.id != id);
    res.json(users)
    //res.status(200).send(`${user.name}'s account has been deleted!`);
  } else {
    res.status(400).send('No such user found!');
  }
});


// GET requests
app.get('/', (req, res) => {
  let responseText = 'My Movies';
  responseText += '<small>Requested at: ' + req.requestTime + '</small>';
  res.send(responseText);
});

app.get('/movie-list', (req, res) => {                  
  res.sendFile('public/movie-list.html', { root: __dirname });
});

// movies API
app.get('/movieList', (req, res)=> {
  res.json(movieList);
});

app.get('/movieList/:title', (req, res) => {
  const {title} = req.params;
  const movie = movieList.find( movie => movie.title === title);

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400).send('Movie not found');
  }
});

app.get('/movieList/genre/:genreName', (req, res) => {
  const {genreName} = req.params;
  const genre = movieList.find( movie => movie.genre === genreName).genre;

  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(400).send('Genre not found');
  }
});

app.get('/movieList/directors/:directorName', (req, res) => {
  const {directorName} = req.params;
  const director = movieList.find( movie => movie.director.name === directorName).director;

  if (director) {
    res.status(200).json(director);
  } else {
    res.status(400).send('Director not found');
  }
});

//CREATE
app.post('/api/movieList', (req, res) => {
  let newMovie = req.body;

  if (!newMovie.name) {
    const message = 'Missing name in request body';
    res.status(400).send(message);
  } else {
    console.log(newMovie)
    newMovie.id = uuid.v4();
    movieList.push(newMovie);
    res.status(201).send(newMovie);
  }
});

// Create. Add new movie to favorite movies array
app.post('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find( user => user.id == id ); //search user by id

  if (user) {
    user.favoriteMovies.push(movieTitle);
    /*res.status(200).json(user);*/ //shows added movie in array
    res.status(200).send(`${movieTitle} has been added to ${user.name}'s array`);
  } else {
    res.status(400).send('No such user found!');
  }
});

// Remove movie from favorite movies array
app.delete('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find( user => user.id == id ); //search user by id

  if (user) {
    user.favoriteMovies = user.favoriteMovies.filter( title => title !== movieTitle);
    res.status(200).send(`${movieTitle} has been Removed from ${user.name}'s array`);
  } else {
    res.status(400).send('No such user found!');
  }
});

app.get('/documentation', (req, res) => {                  
  res.sendFile('public/documentation.html', { root: __dirname });
});

// function for static files
// this syntax does not work
//app.use('/documentation', express.static('public'));

// error handling code
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// listen for requests
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});