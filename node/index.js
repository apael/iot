var express = require("express");
var mysql = require("mysql");
var bp = require("body-parser");
var child_process = require("child_process");
var SerialPort = require("serialport");
var SerialReadLine = require("@serialport/parser-readline");
var serial_port = new SerialPort("/dev/ttyUSB0", {baudRate: 9600});
var serial_parser = new SerialReadLine();
serial_port.pipe(serial_parser);

var server_port = 2236;
var res_status = null;

var app = express();
app.use(bp.json());

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

        serial_port.write("1");
        res.json({status: "OK"});

      }
      catch(err) {

        res.json({status: "NOT_OK"});

      }

    }
    else if(state == 0) {

      try {

        serial_port.write("0");
        res.json({status: "OK"});

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
app.post("/status", function(req, res, n){

  try {

    serial_port.write("s");
    res_status = res;

  }
  catch(err) {

    console.log(err);

  }

});

// --- REQUEST DATA FROM SERIAL EVERY 60 SEC ---
setInterval(() => {
  
  try {

    serial_port.write("s");

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

    db.query(q, params, function(err, db_res) {

      if(err) {
        console.log(err);
      }

      if(res_status !== null) {  // getting status
        res_status.json(obj);
        res_status = null;
      }

    });

  }
  catch(err) {

    console.log(err);

  }

});

// --- START SERVER ---
app.listen((server_port), () => {

  console.log("Server running at " + server_port);

});

