const spawn = require("child_process").spawn;
const fs = require("fs");
const path = require("path");

const MONGO_DB_PATH = path.resolve(__dirname, "db/mongodb");
const MONGO_CONF_PATH = path.resolve(__dirname, "mongod.conf");

const POSTGRESQL_DB_PATH = path.resolve(__dirname, "db/postgresql");
const REDIS_DB_PATH = path.resolve(__dirname, "db/redis");

mkDirByPathSync(MONGO_DB_PATH);
mkDirByPathSync(POSTGRESQL_DB_PATH);
mkDirByPathSync(REDIS_DB_PATH);

startProcess("mongod", [
  `--dbpath=${MONGO_DB_PATH}`,
  `--config=${MONGO_CONF_PATH}`
]);
startProcess("redis-server", ["--dir", REDIS_DB_PATH]);
startProcess("/usr/local/sbin/rabbitmq-server");
startProcess("elasticsearch");
startProcess("postgres", ["-D", POSTGRESQL_DB_PATH]);

function startProcess(...commands) {
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
