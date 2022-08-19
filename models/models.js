const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const movieSchema = mongoose.Schema ({
    Title: {type: String, required: true},
    Description: {type: String, required: true},
    Director: {
        Name: String,
        BIO: String,
        Birth: Date,
        Death: Date
    },
    Duration: String,
    Year: {type: Date, required: true},
    Duration: String,
    Genre: {
        Name: String,
        Description: String
    },
    ImageURL: String
});

const userSchema = mongoose.Schema ({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Birthday: Date,
    FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie'}]
});

userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
  };
  
userSchema.methods.validatePassword = function validatePassword(password) {
    return bcrypt.compareSync(password, this.Password);
  };

const Movie = mongoose.model('Movie', movieSchema);
const User = mongoose.model('User', userSchema);

module.exports.Movie = Movie;
module.exports.User = User;
