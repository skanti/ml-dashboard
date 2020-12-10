const env = require('dotenv').config({ path: "./.env" });
require('dotenv-expand')(env)
global.__basedir = __dirname;

const fs = require('fs');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const cors = require('cors');
const axios = require("axios");
const glob = require("glob");
axios.defaults.baseURL = process.env.URL_SERVER;

const router = express.Router();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

let db = null;
let collection_users = null;

// -> routes
router.get("/alive", function (req, res, next) {
  res.send("ok");
});

router.get("/project", function (req, res, next) {
  let project_dir = req.query.project_dir;
  //let search_dir = path.join(__dirname, "/static/**/",project_dir, "/*");
  //let symlinks = [ path.join(__dirname, "/static/rohan") ];
  let search_dir = "./static/*/" + project_dir + "/*";

  let options = { follow: true };
  glob(search_dir, options, function (err, experiments) {
    if (err)
      return res.send(err);
    let timestamps = experiments.map(x => {
      try {
        let meta_path = x + "/metadata.json";
        let meta = JSON.parse(fs.readFileSync(meta_path));
        return meta["timestamp"];
      } catch(e) {
        return "-";
      }
    });
    let experiments_clean = experiments.map(x => path.basename(x));

    let ret = [];
    for (let i in experiments)
      ret.push({ id: experiments_clean[i], path: experiments[i], timestamp: timestamps[i] });

    res.send(ret);
  });
});

router.get("/experiment", function (req, res, next) {
  let experiment_dir = req.query.path

  let log_path = experiment_dir + "/log_eval.json"
  let log = JSON.parse(fs.readFileSync(log_path));

  glob(experiment_dir + "/**/*", function (err, files) {
    const is_dir = source => fs.lstatSync(source).isDirectory();
    files = files.filter(is_dir);
    //files = files.map(x => path.join("/", path.dirname(x).split("/").slice(2).join()));
    files = files.map( x => {
      x = x.substring(x.indexOf('/') + 1);
      return x.substring(x.indexOf('/'));
    });
    let ret = { "log": log, "dirs": files };
    res.send(ret);
  });
});

// <--

app.use("/", router);



const hostname = process.env.HOSTNAME_SERVER;
const port = process.env.PORT_SERVER;
const url = process.env.URL_SERVER;
const server_handle = http.createServer(app);


server_handle.listen({"port" : port, "host" : hostname}, () => {
  app.emit( "app_started" )
  console.log(`Server running at ${url}`);
});

module.exports = server_handle;
