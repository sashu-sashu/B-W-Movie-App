const express = require('express'),
  fs = require('fs'),
  path = require('path'),
  bodyParser = require('body-parser'),
  uuid = require('uuid');

const morgan = require('morgan');
const app = express();
const mongoose = require('mongoose');
const model = require('./models/models.js');

const movies = model.Movie;
const users = model.User;

mongoose.connect(process.env.CONNECTION_URI, (err) => {
  if (err) throw err;
  console.log('Connected to MongoDB!!!');
});

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
  flags: 'a',
});

app.use(morgan('combined', { stream: accessLogStream }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require('cors');
const { check, validationResult } = require('express-validator');

app.use(cors());

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');


//Routing
app.get('/', (req, res) => {
  res.send('Welcome to Top 10 BW Movies!');
});


// READ
//return JSON obj when at /movies
app.get('/movies', ('jwt', { session: false }), 
(req, res) => {
  movies.find()
  .then((movies) => {
    res.status(201).json(movies);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error:  + ${err}');
  });
});

//return list of all users
app.get('/users', 
//passport.authenticate('jwt', { session: false }), 
(req, res) => {
  users.find()
  .then((users) => {
    res.status(201).json(users);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error:  + ${err}');
  });
});

//return a user by username
app.get('/users/:Username', 
passport.authenticate('jwt', { session: false }), 
(req, res) => {
  users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error:  + ${err}');
    });
});

//return movie info by a specific title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), 
(req, res) => {
  movies.findOne({Title: req.params.Title})
  .then((movie) => {
    res.json(movie);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

//return director information
app.get('/movies/directors/:Name', 
passport.authenticate('jwt', { session: false }),
 (req, res) => {
  movies.findOne({ 'Director.Name': req.params.Name })
    .then((movies) => {
      console.log(req.params);
      res.json(movies.Director);
    })
  
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error:  + ${err}');
    });
});

//return movies by a specific genre
app.get('/movies/genre/:Name', passport.authenticate('jwt', { session: false }), 
(req, res) => {
  movies.findOne({'Genre.Name': req.params.Name})
  .then((movies) => {
    res.json(movies.Genre);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error:  + ${err}');
  });
});

//UPDATE
//allow users to register
app.post('/users', 
[
  check('Username', 'Username is required').isLength({ min: 5 }),
  check('Username', 'Username contains non alphanumeric characters - not allowed').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail(),
],
 
(req, res) => {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
  const hashedPassword = users.hashPassword(req.body.Password);
  users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
    .then((user) => {
      if (user) {
      //If the user is found, send a response that it already exists
        return res.status(400).send('${req.body.Username} already exists');
      } else {
        users
          .create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
          .then((createdUser) => { res.status(201).json(createdUser) })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error:  + ${err}');
          });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error:  + ${err}');
    });
});

  


//allow users to update their user info
app.put('/users/:Username', 
[
  check('Username', 'Username is required').isLength({ min: 5 }),
  check('Username', 'Username contains non alphanumeric characters - not allowed').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail(),
],
passport.authenticate('jwt', { session: false }), 
(req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  let hashedPassword = users.hashPassword(req.body.Password);
  users.findOneAndUpdate(
    {Username: req.params.Username},
    {
      $set: {
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      },
    },
    { new: true }, //this line makes sure that the updated doc is returned
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error:  + ${err}');
      } else {
        res.json(updatedUser);
      }
    }
  );
});

// add movie to the user's favorite movie list
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  let hashedPassword = users.hashPassword(req.body.Password);
  users.findOneAndUpdate({ Username: req.params.Username }, {
     $push: { FavoriteMovies: req.params.MovieID }
   },
   { new: true }, // This line makes sure that the updated document is returned
  (err, updatedUser) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error:  + ${err}');
    } else {
      res.json(updatedUser);
    }
  });
});

//DELETE
//allow user to deregister
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  users.findOneAndRemove({Username: req.params.Username})
  .then((user) => {
    if (!user) {
      res.status(400).send(req.params.Username + ' was not found ');
    } else {
      res.status(200).send(req.params.Username + ' was deleted ');
    }
  })  
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error:  + ${err}');
  });
});

//remove a movie from user's favlist
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  users.findOneAndUpdate({ Username: req.params.Username }, {
     $pull: { FavoriteMovies: req.params.MovieID }
   },
   { new: true }, // This line makes sure that the updated document is returned
  (err, updatedUser) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error:  + ${err}');
    } else {
      res.json(updatedUser);
    }
  });
});
  

// listen for requests
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Listening on port: ${port}`);
});