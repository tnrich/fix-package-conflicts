#!/usr/bin/env node
const glob = require("glob");
const fs = require("fs");
const semver = require("semver");
const { exec, execSync } = require("child_process");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const logger = (...rest) => {
  console.log("\x1b[36m%s\x1b[0m", ...rest);
};
// ~/Sites/react-snowpack master zoinkl
const argus = yargs(hideBin(process.argv))
  .command(
    "$0 [folderPath] [branch]",
    `Merge in a branch and fix any merge conflicts. 
    
    USAGE: fix-package-conflicts ~/Sites/react-snowpack zoinkl --useYarn --incomingBranch=main`,
    (yargs) => {
      return yargs
        .positional("folderPath", {
          describe: "folderPath to fix conflicts at eg ~/Sites/yourRepoName",
          default: "~/Sites/yourRepoName",
        })
        .positional("branch", {
          describe: "branch to fix conflicts on eg someBranchWithConflicts",
          default: "someBranchWithConflicts",
        });
    },
    (argv) => {
      const { folderPath, incomingBranch, branch, useYarn } = argv;
      logger(`CHECKING OUT ${folderPath}`);
      logger(`MERGING ${incomingBranch} into ${branch}`);
      const toExec = `cd ${folderPath} && git checkout ${branch}; git merge origin/${incomingBranch}`;

      try {
        const res = execSync(toExec);
      } catch (e) {}
      // options is optional
      glob(
        `${folderPath}/**/package.json`,
        {
          ignore: "**/node_modules/**",
        },
        async function (err, files) {
          if (err) throw err;
          if (!files || !files.length) {
            logger(`NO FILES FOUND!!`);
          }
          try {
            await Promise.all(
              files.map(async (file) => {
                const contents = await readFilePromise(file);
                if (contents.includes("<<<<<<<")) {
                  await fixPackageConflict(file, contents);
                } else {
                  logger('FILE ALREADY FIXED: ', file)
                }
              })
            );
            logger(`FINISHED`);
          } catch (error) {
            console.error(`error:`, error);
          }
        }
      );

      const readFilePromise = (path, options) => {
        return new Promise((resolve, reject) => {
          fs.readFile(
            path,
            { encoding: "utf8", ...options },
            (err, contents) => {
              if (err) reject(err);
              resolve(contents);
            }
          );
        });
      };

      const writeFilePromise = (path, contents, options) => {
        return new Promise((resolve, reject) => {
          fs.writeFile(
            path,
            contents,
            { encoding: "utf8", ...options },
            (err) => {
              if (err) reject(err);
              resolve();
            }
          );
        });
      };

      async function fixPackageConflict(file, contents) {
        const mergedPackageFile = contents.replace(
          /<<<<<<< HEAD.*[\s\S]*>>>>>>> origin\/.*/g,
          (match) => {
            if (match) {
              const split = match.split("\n");
              const left = [];
              const right = [];
              let onLeft = true;
              split.forEach((line) => {
                if (line.includes("<<<<<<<") || line.includes(">>>>>>>")) {
                  return;
                }
                if (line.includes("=======")) {
                  onLeft = false;
                  return;
                }
                if (onLeft) {
                  left.push(line);
                } else {
                  right.push(line);
                }
              });
              let cleaned = "";
              const keyedLeft = keyByPackage(left);
              const keyedRight = keyByPackage(right);
              Object.keys(keyedLeft).forEach((package, i) => {
                if (!keyedRight[package])
                  throw new Error(`Package ${package} was not in origin.`);
                const oldVersion = keyedLeft[package].version;
                const newVersion = keyedRight[package].version;
                const gt = semver.gt(
                  semver.coerce(oldVersion),
                  semver.coerce(newVersion)
                );
                cleaned += `    "${package}": "${
                  gt ? oldVersion : newVersion
                }"`;
                if (keyedLeft[package].line.includes(",")) {
                  cleaned += ",";
                }
                if (i !== left.length - 1) cleaned += "\n";
              });
              return cleaned;
            }
          }
        );
        logger(`CONFLICT DETECTED IN FILE:`, file);
        await writeFilePromise(file, mergedPackageFile);
        const npmCmd = `yarn --cwd ${file.replace("/package.json", "")}`;
        logger(
          `EXECUTING ${
            useYarn ? "YARN" : "NPM"
          } TO FIX LOCK FILE ...may take a minute...`
        );
        await new Promise((resolve, reject) => {
          exec(npmCmd, (error, stdout, stderr) => {
            if (error) {
              reject(`error: ${error.message}`);
            }
            if (stderr) {
              console.log(`stderr: ${stderr}`);
            }
            resolve();
          });
        });
      }

      function keyByPackage(lines) {
        const keyed = {};
        lines.forEach((line) => {
          const match = line.match(/"(.*)": "(.*)"/);
          if (match) {
            const packageName = match[1];
            const version = match[2];
            keyed[packageName] = { version, line };
          }
        });
        return keyed;
      }
    }
  )
  .help("h")
  .alias("h", "help")
  .option("incomingBranch", {
    alias: "i",
    default: "master",
    type: "string",
    description: "Set the incoming branch to something other than master",
  })
  .option("useYarn", {
    alias: "y",
    type: "boolean",
    description: "Run with yarn",
  }).argv;

return;
