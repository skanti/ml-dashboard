const env = require('dotenv').config()
require('dotenv-expand')(env)
global.__basedir = __dirname;

const path = require('path');
const csv = require('csv-parse')
const fs = require('fs');
const express = require('express');
const history = require('connect-history-api-fallback');
const bodyParser = require('body-parser');
const http = require('http');
const axios = require('axios');
const cors = require('cors');
const assert = require('assert').strict;
const glob = require("glob");
const { spawnSync } = require('child_process');

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
      return { id: path.basename(x), timestamp: stats.birthtime };
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
    // sort versions
    outputs = outputs.sort(function(a, b) {
      a = path.basename(a);
      b = path.basename(b);
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    // pick last
    const jobs = [];
    const parser = csv({cast: true, columns: true});
    for (const log_dir of outputs) {
      // HACK: needed to avoid loading from cache (eg.g. mounted S3 bucket)
      spawnSync('ls', [log_dir]);

      // check csv file
      const csv_path = `${log_dir}/metrics.csv`;
      if (!fs.existsSync(csv_path)) {
        continue
      }

      // load and parse csv
      const rows = []
      jobs.push(new Promise((resolve, reject) => {
        fs.createReadStream(csv_path)
          .pipe(parser)
          .on('data', row => rows.push(row))
          .on('error', err => reject(err))
          .on('finish', () => resolve(rows))
      }));
    }
    Promise.all(jobs).then(reses => {
      res.send(reses.flat());
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
assert.ok(process.env.SERVER_HOSTNAME);
assert.ok(process.env.SERVER_PORT);
assert.ok(process.env.SERVER_URL);
let server = http.createServer(app);
server.listen({"port" : process.env.SERVER_PORT, host: process.env.SERVER_HOSTNAME}, () => {
  app.emit( "app_started" )
  console.log(`Server running at ${process.env.SERVER_URL}`);
});

