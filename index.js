const spawn = require("child_process").spawn;
const fs = require("fs");
const path = require("path");
const CONFIG = require('./config');

const PATH = {
  MONGO_DB: path.resolve("./db/mongodb"),
  MONGO_CONF: path.resolve("./mongod.conf"),
  REDIS_DB: path.resolve("./db/redis"),
  RABBITMQ: path.resolve("./db/rabbitmq"),
  POSTGRESQL_DB: path.resolve("./db/postgresql")
};

const PROCESSES = [
  // Start MongoDB server
  ["mongod", [`--dbpath=${PATH.MONGO_DB}`, `--config=${PATH.MONGO_CONF}`]],
  // Setup MongoDB replica set
  [
    "mongo",
    [
      "--eval",
      'rs.initiate({_id: "myreplica", members: [{_id: 0, host: "localhost:27017"}] })'
    ]
  ],
  // Start Redis server
  ["redis-server", ["--dir", PATH.REDIS_DB]],
  // Start RabbitMQ server
  [
    "/usr/local/sbin/rabbitmq-server",
    [],
    {
      env: {
        RABBITMQ_SCHEMA_DIR: PATH.RABBITMQ,
        RABBITMQ_MNESIA_BASE: PATH.RABBITMQ,
        RABBITMQ_MNESIA_DIR: `${PATH.RABBITMQ}/rabbit@localhost`,
        HOME: PATH.RABBITMQ
      }
    }
  ],
  // Start Elasticsearch
  [
    "/usr/local/bin/elasticsearch",
    [],
    {
      env: CONFIG.ELASTICSEARCH_ENV
    }
  ],
  // Start Postgres
  ["postgres", ["-D", PATH.POSTGRESQL_DB]]
];

for (const key in PATH) {
  mkDirByPathSync(PATH[key]);
}

PROCESSES.forEach(startProcess);

//
// HELPERS
//

function startProcess(commands) {
  const pipe = spawn(...commands);

  pipe.stdout.on("data", data => {
    console.log(`${commands[0]}:`, data.toString("utf8"));
  });

  pipe.stderr.on("data", data => {
    console.log(`${commands[0]} error:`, data.toString("utf8"));
  });

  pipe.on("close", code => {
    console.log(`${commands[0]} exited with code: ${code}`);
  });
}

// https://stackoverflow.com/questions/31645738/how-to-create-full-path-with-nodes-fs-mkdirsync
function mkDirByPathSync(targetDir) {
  const sep = path.sep;

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === "EEXIST") {
        // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === "ENOENT") {
        // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ["EACCES", "EPERM", "EISDIR"].indexOf(err.code) > -1;
      if (!caughtErr || (caughtErr && curDir === path.resolve(targetDir))) {
        throw err; // Throw if it's just the last created dir.
      }
    }

    return curDir;
  }, sep);
}
