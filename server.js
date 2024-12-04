/********************************************************************************
* WEB322 – Assignment 05
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
*
* Name: ___Kunika Sood___________________ Student ID: __156799223____________ Date: ___18-11-2024___________
*
* Published URL: ___________________________________________________________
*
********************************************************************************/
// Import required modules
require('dotenv').config();  
const express = require('express');
const path = require('path');
const legoData = require('./modules/legoSets'); 
const authData = require("./modules/auth-service");
const clientSessions = require("client-sessions");

const app = express();
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));  
app.use(express.static(path.join(__dirname, "public"))); 
app.use(express.urlencoded({ extended: true })); 
app.use(
  clientSessions({
    cookieName: 'session', // this is the object name that will be added to 'req'
    secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr', // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
  })
);
app.use((req, res, next) => { 
  res.locals.session = req.session; 
  next(); 
}); 

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
}


legoData.initialize()
    .then(authData.initialize)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error("Failed to initialize data:", err);
    });

// Serving the home page
app.get('/', (req, res) => {
    res.render('home');  // Rendering home.ejs
});

// Serve the about page
app.get('/about', (req, res) => {
    res.render('about');  // Rendering about.ejs
});

app.get('/lego/sets', (req, res) => {
    const theme = req.query.theme; 

    if (theme) {
        legoData.getSetsByTheme(theme)
            .then(sets => {
                if (sets.length === 0) {
                    res.status(404).render("404", { message: `No sets found for theme '${theme}'.` });
                } else {
                    res.render('sets', { sets: sets, theme: theme });  
                }
            })
            .catch(err => {
                res.status(404).render("404", { message: `Error fetching theme '${theme}' sets: ${err}` });
            });
    } else {
        legoData.getAllSets()
            .then(sets => res.render('sets', { sets: sets, theme: 'All' }))  
            .catch(err => {
                res.status(404).render("404", { message: `Error fetching all sets: ${err}` });
            });
    }
});

app.get('/lego/sets/:set_num', (req, res) => {
    const setNum = req.params.set_num;

    legoData.getSetByNum(setNum)
        .then(set => {
            if (!set) {
                res.status(404).render("404", { message: `No set found with set_num '${setNum}'.` });
            } else {
                res.render('setDetail', { set: set });  
            }
        })
        .catch(err => {
            console.error(`Error fetching set with set_num '${setNum}':`, err);
            res.status(404).render("404", { message: `Error fetching set with set_num '${setNum}': ${err}` });
        });
});

// GET /lego/editSet/:num
app.get('/lego/editSet/:num', ensureLogin, (req, res) => {
    const setNum = req.params.num;

    Promise.all([legoData.getSetByNum(setNum), legoData.getAllThemes()])
        .then(([setData, themeData]) => {
            if (!setData) {
                res.status(404).render('404', { message: `No set found with set_num '${setNum}'.` });
            } else {
                res.render('editSet', { themes: themeData, set: setData });
            }
        })
        .catch(err => {
            console.error(`Error fetching set or themes for set_num '${setNum}':`, err);
            res.status(404).render('404', { message: err });
        });
});

// GET /lego/addSet
app.get('/lego/addSet', ensureLogin ,(req, res) => {
    legoData.getAllThemes()
        .then(themeData => {
            res.render('addSet', { themes: themeData });
        })
        .catch(err => {
            res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
        });
});

// POST /lego/addSet
app.post('/lego/addSet', ensureLogin,  (req, res) => {
    legoData.addSet(req.body)
        .then(() => {
            res.redirect('/lego/sets');
        })
        .catch(err => {
            res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
        });
});

app.get("/lego/deleteSet/:num", ensureLogin, async (req, res) => {
  try {
    await legoData.deleteSet(req.params.num);
    res.redirect("/lego/sets");
  } catch (err) {
    res.render("500", { message: `Error deleting set: ${err}`, page: "" });
  }
});

// POST /lego/editSet
app.post('/lego/editSet', ensureLogin,  (req, res) => {
    const setNum = req.body.set_num;
    const setData = req.body;

    legoData.editSet(setNum, setData)
        .then(() => {
            res.redirect('/lego/sets');
        })
        .catch(err => {
            res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
        });
});


app.get("/login", function (req, res) {
  res.render("login", {
    errorMessage: "",
  });
});

app.get("/register", function (req, res) {
  res.render("register", {
    errorMessage: "",
    successMessage: "",
  });
});

app.post("/register", (req, res) => {
  authData
    .registerUser(req.body)
    .then(() => {
      res.render("register", {
        successMessage: "User created",
        errorMessage: null,
      });
    })
    .catch((err) => {
      res.render("register", {
        successMessage: null,
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  authData
    .checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };
      res.redirect("/lego/sets");
    })
    .catch((err) =>
      res.render("login", { errorMessage: err, userName: req.body.userName })
    );
});
