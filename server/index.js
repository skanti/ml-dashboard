const env = require('dotenv').config()
require('dotenv-expand')(env)
global.__basedir = __dirname;

const path = require('path');
const csv = require('csv-parser');
const fs = require('fs');
const express = require('express');
const history = require('connect-history-api-fallback');
const bodyParser = require('body-parser');
const http = require('http');
const axios = require('axios');
const cors = require('cors');
const assert = require('assert').strict;
const glob = require("glob");

// express setup
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// routes
app.get("/api/project", function (req, res, next) {
  const { project_dir } = req.query;
  const search_dir = project_dir + "/*";
  const options = { };
  glob(search_dir, options, function (err, experiments) {
    if (err)
      return res.send(err);
    experiments = experiments.map(x => {
      const stats = fs.statSync(x);
      return { id: path.basename(x), timestamp: stats.mtime };
      });
    res.send(experiments);
  });

});

app.get("/api/experiment", function (req, res, next) {
  let { project_dir, experiment } = req.query;
  experiment = JSON.parse(experiment);
  const search_dir = project_dir + "/" + experiment.id + "/log/version_*";
  const options = { };
  glob(search_dir, options, function (err, outputs) {
    if (err)
      return res.send(err);
    outputs = outputs.sort(function(a, b) {
      a = path.basename(a);
      b = path.basename(b);
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    const log_dir = outputs.pop();
    const csv_filename = `${log_dir}/metrics.csv`;
    if (!fs.existsSync(csv_filename)) {
      res.status(500).send();
      return;
    }

    const rows = [];
    fs.createReadStream(csv_filename)
      .pipe(csv())
      .on('data', (data) => rows.push(data))
      .on('end', () => {
        res.send(rows);
      });
  });
});

app.get("/api/download", function (req, res, next) {
  const { project_dir, experiment_name, output_name, out } = req.query;
  const out_filename = `${project_dir}/${experiment_name}/${output_name}/${out}.json`;
  res.sendFile(out_filename);
});

// timeout helper function
const timeout = function(s) {
  return new Promise(resolve => setTimeout(resolve, s*1000));
}

// vue client static
const middleware_static = express.static('../client/dist');
app.use(middleware_static);
app.use(history({ }));
app.use(middleware_static);


// start server
assert.ok(process.env.HOSTNAME);
assert.ok(process.env.PORT);
assert.ok(process.env.URL);
let server = http.createServer(app);
server.listen({"port" : process.env.PORT, host: process.env.HOSTNAME}, () => {
  app.emit( "app_started" )
  console.log(`Server running at ${process.env.URL}`);
});

