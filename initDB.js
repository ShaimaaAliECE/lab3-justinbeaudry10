const newConnection = require("./DBConnection");

let conn = newConnection();
conn.connect();

// Drop existing table (if there is one)
conn.query("DROP TABLE Availability", (err, rows, fields) => {
  if (err) console.log(err);
  else console.log("Table Dropped");
});

// Create new table
conn.query(
  `
    CREATE TABLE Availability 
    (
      Name varchar(100) NOT NULL PRIMARY KEY, 
      LastUpdated timestamp, 
      TimesAvailable json
    )
`,
  (err, rows, fields) => {
    if (err) console.log(err);
    else console.log("Table Created");
  }
);

// Insert row for admin into table, with 10 time slots
conn.query(
  `
    INSERT INTO Availability VALUES ("Admin", CURRENT_TIME(), '["8:00", "9:00", "10:00", "11:00", "12:00", "1:00", "2:00", "3:00", "4:00", "5:00"]')
    `,
  (err, rows, fields) => {
    if (err) console.log(err);
    else console.log("One row inserted");
  }
);

conn.query(
  `
    INSERT INTO Availability VALUES ("Justin", CURRENT_TIME(), '{"8:00":false, "9:00":true, "10:00":true, "11:00":true, "12:00":true, "1:00":false, "2:00":true, "3:00":true, "4:00":true, "5:00":true}')
    `,
  (err, rows, fields) => {
    if (err) console.log(err);
    else console.log("One row inserted");
  }
);

// Select the created row
conn.query("SELECT * FROM Availability", (err, rows, fields) => {
  if (err) console.log(err);
  else console.log("One row selected");
  for (r of rows) console.log(r);
});

conn.end();