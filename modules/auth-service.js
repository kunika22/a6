const mongoose = require("mongoose");

require("dotenv").config();
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

let User;
const initialize = () => {
  return new Promise((resolve, reject) => {
    let db = mongoose.createConnection(process.env.MONGODB);

    db.on("error", (err) => {
      reject(err);
    });

    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
};
const registerUser = (userData) => {
  return new Promise((resolve, reject) => {
    // Validate passwords match
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
      return;
    }

    // Hash the password
    bcrypt
      .hash(userData.password, 10)
      .then((hash) => {
        // Set the hashed password
        userData.password = hash;

        // Create a new user instance
        const newUser = new User(userData);

        // Save the user to the database
        newUser
          .save()
          .then(() => resolve()) // User created successfully
          .catch((err) => {
            if (err.code === 11000) {
              // Duplicate username error
              reject("User Name already taken");
            } else {
              // Other errors
              reject(`There was an error creating the user: ${err}`);
            }
          });
      })
      .catch(() => {
        // Handle password hashing errors
        reject("There was an error encrypting the password");
      });
  });
};
function checkUser(userData) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName: userData.userName })
      .then((user) => {
        if (!user) {
          reject(`Unable to find user: ${userData.userName}`);
          return;
        }
        bcrypt
          .compare(userData.password, user.password)
          .then((result) => {
            if (!result) {
              reject(`Incorrect Password for user: ${userData.userName}`);
            } else {
              if (user.loginHistory.length === 8) {
                user.loginHistory.pop();
              }

              user.loginHistory.unshift({
                dateTime: new Date().toString(),
                userAgent: userData.userAgent,
              });
              User.updateOne(
                { userName: user.userName },
                { $set: { loginHistory: user.loginHistory } }
              )
                .then(() => {
                  resolve(user);
                })
                .catch((err) => {
                  reject(`There was an error verifying the user: ${err}`);
                });
            }
          })
          .catch(() => {
            reject(`Incorrect Password for user: ${userData.userName}`);
          });
      })
      .catch(() => {
        reject(`Unable to find user: ${userData.userName}`);
      });
  });
}

module.exports = { initialize, registerUser, checkUser };
