const mysql = require("mysql");

function newConnection() {
  let conn = mysql.createConnection({
    host: "104.197.0.222",
    user: "root",
    password: "pswd!",
    database: "usersDB",
  });
  return conn;
}

module.exports = newConnection;
