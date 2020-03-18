var express = require("express");
var mysql = require("mysql");
var bp = require("body-parser");
var SerialPort = require("serialport");
var SerialReadLine = require("@serialport/parser-readline");
var serial_port = new SerialPort("/dev/ttyUSB0", {baudRate: 9600});
var serial_parser = new SerialReadLine();
serial_port.pipe(serial_parser);
var cors = require("cors");

var server_port = 2236;
var res_status = null;
var save = false;

var app = express();
app.use(bp.json());
app.use(cors());

app.use("/example", express.static("public")); // example ui

const path = require("path");

var db = mysql.createConnection({

  host: "localhost",
  user: "r7",
  password: "CCNA61",
  database: "mydb",
  dateStrings: ["DATETIME"]

});

db.connect(function(err) {

  if(err) throw err;
  console.log("MySQL OK");

});

// --- GET / ---
app.get("/", function(req, res, n){

  res.json({status: "OK"});

});

// --- GET DATA ---
app.get("/data", (req, res, n) => {

  var start_time = "";
  var end_time = "";
  
  if(typeof req.query.start_time !== 'undefined' && req.query.start_time) {

    start_time = req.query.start_time;

  }
  
  if(typeof req.query.end_time !== 'undefined' && req.query.end_time) {

      end_time = req.query.end_time;

  }
  
  var q = "SELECT * FROM Mittaukset";
  var params = [];
  
  if(start_time.length > 0 && end_time.length > 0) {

    q += " WHERE SavedOn BETWEEN ? AND ?";
    params = [start_time, end_time];

  } 
  else if(start_time.length > 0) {

    q += " WHERE SavedOn >= ?";
    params = [start_time];

  } 
  else if(end_time.length > 0) {

    q += " WHERE SavedOn <= ?";
    params = [end_time];

  }

  q += " ORDER BY SavedOn DESC";

  if(start_time.length == 0 && end_time.length == 0) q += " LIMIT 1";
  
  db.query(q, params, function(err, mysql_res) {
    
    if(err) throw err;
    res.json(mysql_res)
    
  });

});

// --- RELAY ON/OFF ---
app.post("/switch", (req, res, n) => {

  if(req.body.state !== 'undefined') {

    var state = req.body.state;

    if(state == 1) {

      try {

        save = true;
        serial_port.write("1");
        serial_port.write("s");
        res_status = res;

      }
      catch(err) {

        res.json({status: "NOT_OK"});

      }

    }
    else if(state == 0) {

      try {

        save = true;
        serial_port.write("0");
        serial_port.write("s");
        res_status = res;

      }
      catch(err) {

        res.json({status: "NOT_OK"});

      }

    }
    else {

      res.json({status: "NOT_OK"});

    }

  }
  else {

    res.json({status : "NOT_OK"});

  }

});

// --- REQUEST SENSOR STATUS ---
app.get("/status", function(req, res, n){

  try {

    res_status = res;
    serial_port.write("s");
    save = false;

  }
  catch(err) {

    console.log(err);

  }

});

// --- REQUEST DATA FROM SERIAL EVERY 60 SEC ---
setInterval(function() {
  
  try {

    serial_port.write("s");
    save = true;

  }
  catch(err) {

    console.log(err);

  }

}, 60000);

// --- LISTEN FOR SERIAL DATA & INSERT TO DB ---
serial_parser.on("data", function(line) {
  
  try {

    var obj = JSON.parse(line);
    var q = "INSERT INTO Mittaukset(Temp, Hum, Door, State, SavedOn) VALUES(?, ?, ?, ?, now())";
    var params = [obj.Temp, obj.Hum, obj.Door, obj.State];

    if(save) {
      db.query(q, params, function(err, db_res) {

        if(err) {
    
          console.log(err);
    
        }

        save = false;
      
      });
    
    }

    if(res_status !== null) {
    
      res_status.json(obj);
      res_status = null;
    
    }

  }
  catch(err) {

    console.log(err);

  }

});

// --- GET TASKS ---
app.get("/tasks", function(req, res, n) {

  var q = "SELECT * FROM Tasks WHERE Done = ? AND Deleted = 0 ORDER BY Due ASC";
  var where_done = 0;

  if(typeof req.query.done !== 'undefined') {
    where_done = req.query.done == 1 ? 1 : 0
  }

  var params = [where_done];

  db.query(q, params, function(err, db_res) {

    if(err) {
      console.log(err);
    }

    res.json(db_res);

  });

});

// --- ADD TASKS ---
app.post("/tasks", function(req, res, n){

  if(req.body.length > 0) {

    var status = "OK";

    req.body.forEach(function(task) {
      
      var due = new Date(task.Due);

      if(due.getTime() === due.getTime() && task.Action.length > 0) {

        var q = "INSERT INTO Tasks(Created, Due, Action) VALUES (now(), ?, ?)";
        var params = [due, task.Action];

        db.query(q, params, function(err, db_res){

          if(err) {
  
            console.log(err);
  
          }
  
          status = "OK";
  
        });

      }
      else {
        status = "NOT_OK";
      }

    });

    res.json({status: status});

  }
  else {
    res.json({status: "NOT_OK"});
  }

});

// --- DELETE TASK ---
app.post("/tasks/delete", function(req, res, n){
  
  if(typeof req.body.Id !== 'undefined') {
    
    var task_id = req.body.Id;

    if(task_id > 0) {

      var q = "UPDATE Tasks SET Deleted = 1 WHERE Id = ?";
      var params = [task_id];
    
      db.query(q, params, function(err, db_res) {

        if(err) {

          console.log(err);

        }

        res.json({status: "OK"});

      });

    }
    else {

      res.json({status: "NOT_OK"});
      
    }

  }
  else {

    res.json({status: "NOT_OK"});

  }

});

// --- HANDLE TASKS ---

setInterval(function() {
  
  var now = new Date();
  var q = "select * from Tasks WHERE Done = 0 and Deleted = 0 ORDER BY Due ASC, Action DESC LIMIT 1";
  var done = 0;

  db.query(q, function(err, db_res){

    if(err) {

      console.log(err);

    }
    if(db_res.length > 0) {
      task = db_res[0];

      if(now > new Date(task.Due)) {
      
        switch(task.Action) {

          case "1":
            save = true;
            serial_port.write("1");
            done = 1;
            break;
        
          case "0":
            save = true;
            serial_port.write("0");
            done = 1;
            break;

        }

        var q = "UPDATE Tasks SET Done = ? WHERE Id = ?";
        var params = [done, task.Id];

        db.query(q, params, function(err, db_res){

          if(err) {
            console.log(err);
          }

          console.log("Task #" + task.Id + " done.");

      });

    }

  }

  });

}, 1000);

// --- START SERVER ---
app.listen((server_port), () => {

  console.log("Server running at " + server_port);

});

