var express = require("express");
var mysql = require("mysql");
var bp = require("body-parser");
const { exec } = require("child_process");

var server_port = 9999;

var db = mysql.createConnection({

  host: "localhost",
  user: "r7",
  password: "CCNA61",
  database: "mydb"

});

db.connect(function(err) {

  if(err) throw err;
  console.log("MySQL OK");

});

var app = express();
app.use(bp.json());

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
    q += " WHERE Ajanhetki BETWEEN ? AND ?";
    params = [start_time, end_time];
  } 
  else if(start_time.length > 0) {
    q += " WHERE Ajanhetki >= ?";
    params = [start_time];
  } 
  else if(end_time.length > 0) {
    q += " WHERE Ajanhetki <= ?";
    params = [end_time];
  }

  q += " ORDER BY Ajanhetki DESC";

  if(start_time.length == 0 && end_time.length == 0) q += " LIMIT 1";

  console.log(q);
  
  db.query(q, params, function(err, mysql_res) {
    
    if(err) throw err;
    res.json(mysql_res)
    
  });

});

// --- POST DATA ---
app.post("/data", (req, res, n) => {

  if(req.body.Temp !== 'undefined') {
    var q = "INSERT INTO Mittaukset(Ajanhetki, Temp) VALUES(now(), ?)";
    var params = [req.body.Temp];
    console.log(q);
    db.query(q, params, function(err, mysql_res) {
    
      if(err) throw err;
      res.json({status : "OK"})
      
    });
  }
  else {
    res.json({status : "NOT_OK"});
  }
});

// --- SWITCH ON/OFF ---
app.post("/switch", (req, res, n) => {

  if(req.body.state !== 'undefined') {
    var state = req.body.state;
    if(state == 1) {
      exec("../switch.py 1", (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
        }
        console.log("Switch on");
        res.json({status : "SWITCH ON"});
      });
    }
    if(state == 0) {
      exec("../switch.py 0", (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
        }
        console.log("Switch off");
        res.json({status : "SWITCH OFF"});
      });

    }
  }
  else {
    res.json({status : "NOT_OK"});
  }

});



// --- ---
app.listen((server_port), () => {

  console.log("Server running at " + server_port);

});