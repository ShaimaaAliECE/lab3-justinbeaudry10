const express = require("express");
const newConnection = require("./DBconnection");

// Admin login info
const adminCredentials = {
  username: "admin",
  password: "pswd",
};

const app = express();

// Serve static markups
app.use(express.static("static"));

// Need for post request in admin login form
app.use(
  express.urlencoded({
    extended: true,
  })
);

// Admin page
app.post("/admin", (req, res) => {
  // Checks admin login info using adminCredential object created above
  if (
    req.body.username === adminCredentials.username &&
    req.body.password === adminCredentials.password
  ) {
    let conn = newConnection();
    conn.connect();

    let markup = `<div>
        <div style="margin-left: 1rem">
            <h3 style="margin-bottom: 0rem">Admin Portal</h3>
        </div>
        `;

    // Gets the name and TimesAvailable json object from availability, with Admin entry first
    conn.query(
      `SELECT Name, TimesAvailable FROM Availability
       ORDER BY Name, CASE Name 
       WHEN "Admin" THEN '1' 
       ELSE '2' 
       END`,
      (err, rows, fields) => {
        if (err) console.log(err);
        else {
          // Get the current ordered times array
          let availableTimes = JSON.parse(rows[0].TimesAvailable);
          rows.shift(); // Remove the Admin entry from the array

          markup +=
            '<table style="min-width: 100vw; border-top: 1px solid gray">' +
            '<form action="/admin/time" method="post" style="display:table-header-group; vertical-align: middle">' +
            "<tr>" +
            "<th>Name</th>";

          // Time headers
          for (let i = 0; i < 10; i++) {
            markup +=
              '<th><p id="t' +
              i +
              '" name="t' +
              i +
              '">' +
              availableTimes[i] +
              "</p></th>";
          }

          markup +=
            "</tr>" +
            "</form>" +
            '<form action="/admin/availability" method="post">';

          // Adds a row for each user
          for (r of rows) {
            // JSON string to json object for users availability times
            let times = JSON.parse(r.TimesAvailable);

            markup +=
              '<tr><td style="text-align: center; width:175px"><input type="text" id="' +
              r.Name +
              '-row" value="' +
              r.Name +
              '" readonly></td>';

            // Adds a checkbox for each column (chekced indicates available)
            for (let i = 0; i < availableTimes.length; i++) {
              // Checks what availability is set to
              if (times[`${availableTimes[i]}`]) {
                markup +=
                  '<td style="text-align: center"><input type="checkbox" id="' +
                  r.Name +
                  "Box" +
                  i +
                  '" name="' +
                  r.Name +
                  "Box" +
                  i +
                  '" checked="checked"></td>';
              } else {
                markup +=
                  '<td style="text-align: center"><input type="checkbox" id="' +
                  r.Name +
                  "Box" +
                  i +
                  '" name="' +
                  r.Name +
                  "Box" +
                  i +
                  '"></td>';
              }
            }

            markup += "</tr>";
          }

          // Adds save availability  btn for the save avail post form
          markup +=
            "<tr>" +
            "<th></th>" +
            '<th colspan="10"><button type="submit">Update Available Times</button></th>' +
            "</tr></form></table></div>";

          // Sends the response markup
          res.send(markup);
        }
      }
    );
    conn.end();
  } else {
    // If login failed, send user to home page
    res.redirect("/");
  }
});

// Change availability post
app.post("/admin/availability", (req, res) => {
  let times = []; // List of times
  let users = []; // Mame and availability for each user
  let updates = []; // Index of availability that is updates in users array
  let updateStr = `UPDATE Availability SET LastUpdated = CURRENT_TIME(), TimesAvailable = (CASE Name `; //Update query string

  let conn = newConnection();
  conn.connect();

  // Selects the name and TimesAvailable object from availability. selects Admin entry first
  conn.query(
    `SELECT Name, TimesAvailable FROM Availability ORDER BY Name, CASE Name
    WHEN "Admin" THEN '1' 
    ELSE '2' END`,
    (err, rows, fields) => {
      if (err) {
        console.log(err);
        conn.end();
        res.send("Unkown Error Occured. Update not completed.");
      } else {
        // Gets array of admin times and removes admin from the rows
        times = JSON.parse(rows[0].TimesAvailable);
        rows.shift();

        // Populates the users array with users name and availability times obj
        for (r of rows) {
          users.push([r.Name, JSON.parse(r.TimesAvailable)]);
        }

        // Checks if the users avail times stored in the db match whats currently displayed
        for (let i = 0; i < users.length; i++) {
          for (let j = 0; j < 10; j++) {
            // If the index isnt in the update array and stored avail times dont match displayed
            if (
              !updates.includes(i) &&
              !(
                (req.body[`${users[i][0] + "Box" + j}`] == "on") ==
                users[i][1][`${times[j]}`]
              )
            ) {
              updates.push(i);
            }
            // Updates usr object incase its needed for update statement
            users[i][1][`${times[j]}`] =
              req.body[`${users[i][0] + "Box" + j}`] == "on";
          }
        }

        // Adds each update requirement to the query string
        for (u of updates) {
          updateStr +=
            `WHEN '` +
            users[u][0] +
            `' THEN '` +
            JSON.stringify(users[u][1]) +
            `' `;
        }

        updateStr += `ELSE (TimesAvailable) End)`;

        // If there is an update, update the database
        if (updates.length > 0) {
          conn.query(updateStr, (err, rows, fields) => {
            if (err) {
              console.log(err);
              res.send("Could not complete update");
            } else {
              res.send("Update Successful");
            }
          });
        } else {
          res.send("No Updates made as no changes were made");
        }
        conn.end();
      }
    }
  );
});

// // Guest page
app.get("/guest", (req, res) => {
  let conn = newConnection();
  conn.connect();
  let markup = `<div>
    <div style="margin-left: 1rem">
      <h3 style="margin-bottom: 0rem">Guest Portal</h3>
    </div>`;

  // Selects all the peope in the databese, selects the admin first and sorts alphabetically
  conn.query(
    `SELECT Name, TimesAvailable FROM Availability ORDER BY Name, CASE Name
    WHEN "Admin" THEN '1'
    ELSE '2' END`,
    (err, rows, fields) => {
      if (err) {
        console.log(err);
        res.send("Unknown Error Occured");
      } else {
        // Gets the admin times and removes the admin from the rows
        let availableTimes = JSON.parse(rows[0].TimesAvailable);
        rows.shift();

        markup +=
          '<table style="min-width: 100vw; border-top: 1px solid gray">' +
          '<form method="post" action="/guest/register" style="display:table-row-group; vertical-align: middle">' +
          "<thead>" +
          "<tr>" +
          "<th>Name</th>";

        // Time headers
        for (let i = 0; i < 10; i++) {
          markup +=
            '<th><input type="time" name="t' +
            i +
            '" value="' +
            availableTimes[i] +
            '" readonly></th>';
        }

        markup += "</tr></thead><tbody>";

        for (r of rows) {
          let times = JSON.parse(r.TimesAvailable); // Parses the times available to json object

          markup +=
            '<tr><td style="text-align: center; width:175px"><input type="text" id="' +
            r.Name +
            '-row" name="otherNames" value="' +
            r.Name +
            '" readonly></td>';

          // Adds text displaying each previous guest's availability
          for (let i = 0; i < availableTimes.length; i++) {
            // Checks what availability is set to
            if (times[`${availableTimes[i]}`]) {
              markup += '<td style="text-align: center; color: green">Yes</td>';
            } else {
              markup += '<td style="text-align: center; color: red">No</td>';
            }
          }
          markup += "</tr>";
        }

        markup +=
          "<tr>" +
          '<td style="text-align: center; width:175px">' +
          '<input type="text" name="guestName" placeholder="Name" required>' +
          "</td>";

        // Adds a row of check boxes incase the guest would like to enter their availability
        for (let i = 0; i < 10; i++) {
          markup +=
            '<td style="text-align: center"><input type="checkbox" name="box' +
            i +
            '"></td>';
        }

        // Adds a save guest btn for the form and closes other html elements
        markup +=
          '</tr><tr><td style="text-align:center" colspan=11><button type="submit">Add Availability</button></td></tr></tbody></form></table></div>';

        res.send(markup);
      }
    }
  );
  conn.end();
});

// Guest availability registration
app.post("/guest/register", (req, res) => {
  // If row doesn't already exist in DB
  if (!req.body.otherNames.includes(req.body.guestName)) {
    let conn = newConnection();
    conn.connect();

    let newAvailability = {}; // New availability entered by the guest

    // Adds a true false value for each availability entry time. Converts checkbox values to true false
    for (let i = 0; i < 10; i++) {
      newAvailability[req.body[`${"t" + i}`]] =
        req.body[`${"box" + i}`] === "on";
    }

    // Adds the new guest to the database
    conn.query(
      `INSERT INTO Availability VALUES("${req.body.guestName}", CURRENT_TIME(),'` +
        JSON.stringify(newAvailability) +
        `')`,
      (err, rows, fields) => {
        if (err) {
          console.log(err);
          res.send("There was an unexpected error. Please try again");
        } else {
          res.redirect("/guest"); // Reloads and sends user back to the guest page
        }
      }
    );
    conn.end();
  } else {
    res.send(
      "Error: This name has already been added. Please enter a unique name"
    );
  }
});

// Server listens at port 80
app.listen(80);
