require('dotenv').config();
require('pg');
const Sequelize = require('sequelize');

let sequelize = new Sequelize( 
  process.env.DB_DATABASE, 
  process.env.DB_USER, 
  process.env.DB_PASSWORD, 
  { 
    host: process.env.DB_HOST, 
    dialect: "postgres", 
    port: 5432, 
    dialectModule: require("pg"), 
    dialectOptions: { 
      ssl: { rejectUnauthorized: false }, 
    }, 
  } 
); 

const Theme = sequelize.define('Theme', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
  },
}, {
  timestamps: false,
});


const Set = sequelize.define('Set', {
  set_num: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
  },
  year: {
    type: Sequelize.INTEGER,
  },
  num_parts: {
    type: Sequelize.INTEGER,
  },
  theme_id: {
    type: Sequelize.INTEGER,
  },
  img_url: {
    type: Sequelize.STRING,
  },
}, {
  timestamps: false,
});
Set.belongsTo(Theme, { foreignKey: 'theme_id' }); //setbelongs
function initialize() {
  return new Promise((resolve, reject) => {
    sequelize.sync()
      .then(() => resolve())
      .catch(err => reject("Failed to initialize database: " + err));
  });
}

// Get all themes
function getAllThemes() {
  return new Promise((resolve, reject) => {
    Theme.findAll()
      .then(themes => resolve(themes))
      .catch(err => reject("Error retrieving themes: " + err));
  });
}

// Adding a new set
function addSet(setData) {
  return new Promise((resolve, reject) => {
    Set.create(setData)
      .then(() => resolve())
      .catch(err => reject("Error adding set: " + err));
  });
}

// Edit an existing set
function editSet(set_num, setData) {
  return new Promise((resolve, reject) => {
    Set.update(setData, { where: { set_num } })
      .then(() => resolve())
      .catch(err => reject(err.errors[0].message));
  });
}

// Delete an existing set
function deleteSet(set_num) {
  return new Promise((resolve, reject) => {
    Set.destroy({ where: { set_num } })
      .then(() => resolve())
      .catch(err => reject(err.errors[0].message));
  });
}

// Get all sets
function getAllSets() {
  return new Promise((resolve, reject) => {
    Set.findAll({ include: [Theme] })
      .then(sets => resolve(sets))
      .catch(err => reject("Error retrieving sets: " + err));
  });
}

// Get a set by its set_num
function getSetByNum(setNum) {
  return new Promise((resolve, reject) => {
    Set.findAll({ include: [Theme], where: { set_num: setNum } })
      .then(results => {
        if (results.length > 0) {
          resolve(results[0]);
        } else {
          reject(`Unable to find requested set with set_num: ${setNum}`);
        }
      })
      .catch(err => reject("Error retrieving set: " + err));
  });
}

// Get sets by theme name
function getSetsByTheme(theme) {
  return new Promise((resolve, reject) => {
    Set.findAll({
      include: [Theme],
      where: {
        '$Theme.name$': {
          [Sequelize.Op.iLike]: `%${theme}%`,
        }
      }
    })
      .then(sets => {
        if (sets.length > 0) {
          resolve(sets);
        } else {
          reject(`Unable to find sets for theme: ${theme}`);
        }
      })
      .catch(err => reject("Error retrieving sets by theme: " + err));
  });
}

module.exports = { initialize, getAllThemes, addSet, editSet, deleteSet, getAllSets, getSetByNum, getSetsByTheme };