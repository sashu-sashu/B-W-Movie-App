const express = require('express');
const app = express();
const morgan = require('morgan');
//const movieList = require('./public/movie-list.json');
const uuid = require('uuid');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const methodOverride = require('method-override');

// integrating Mongoose
const mongoose = require('mongoose');
const Models = require('./models/models.js');

const Movies = Models.Movie;
const Users = Models.User;
const Directors = Models.Director;
const Genres = Models.Genre;

mongoose.connect('mongodb://localhost:27017/BW_Movies', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.json());
app.use(methodOverride());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use(morgan('common'));
app.use(express.static('public')); // function for static files

app.use(bodyParser.urlencoded({
  extended: true
}));

//must be included before let auth = require('./auth')(app);
const cors = require('cors');
//with this code certain origins will be given access
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message ), false);
    }
    return callback(null, true);
  }
}));

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');


// GET
//return JSON obj when at /movies
app.get("/movies", passport.authenticate("jwt", { session: false }), (req, res) => {
  Movies.find()
  .then((movies) => {
    res.status(201).json(movies);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
});

//return list of all users
app.get("/users", passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.find()
  .then((users) => {
    res.status(201).json(users);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
});

//return a user by username
app.get("/users/:Username", passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//return movie info by a specific title
app.get("/movies/:Title", passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({Title: req.params.Title})
  .then((movie) => {
    res.json(movie);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
});

//return director information
app.get("/movies/directors/:Name", 

//passport.authenticate('jwt', { session: false }),
 (req, res) => {
  Movies.findOne({ "Director.Name": req.params.Name })
    .then((movies) => {
      console.log(req.params);
      res.json(movies);
    })
  
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//return movies by a specific genre
app.get("/movies/genre/:Name", passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({"Genre.Name": req.params.Name})
  .then((movies) => {
    res.json(movies.Genre);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
});

//POST
//allow users to register
app.post("/users", (req, res) => {
  Users.findOne({Username: req.body.Username})
  .then((user) => {
    if (user) {
      return res.status(400).send(req.body.Username + " already exist")
    } else {
      Users
      .create({
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      })
      .then((user) => {
        res.status(201).json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
    }
  })
  .catch((error) => {
    console.error(error);
      res.status(500).send('Error: ' + error);
  });
});

//allow users to update their user info
app.put("/users/:Username", passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate(
    {Username: req.params.Username},
    {
      $set: {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      },
    },
    { new: true }, //this line makes sure that the updated doc is
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
      } else {
        res.json(updatedUser);
      }
    }
  );
});

// add movie to the user's favorite movie list
app.post("/users/:Username/movies/:MovieID", passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
     $push: { FavoriteMovies: req.params.MovieID }
   },
   { new: true }, // This line makes sure that the updated document is returned
  (err, updatedUser) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});

//DELETE
//allow user to deregister
app.delete("/users/:Username", passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndRemove({Username: req.params.Username})
  .then((user) => {
    if (!user) {
      res.status(400).send(req.params.Username + " was not found ");
    } else {
      res.status(200).send(req.params.Username + " was deleted ");
    }
  })  
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
});

//remove a movie from user's favlist
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
     $pull: { FavoriteMovies: req.params.MovieID }
   },
   { new: true }, // This line makes sure that the updated document is returned
  (err, updatedUser) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});
  

// listen for requests
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});