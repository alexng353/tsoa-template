import { watch } from "fs/promises";
import { spawn } from "child_process";
import { FileChangeInfo } from "fs/promises";
import os from "node:os";
import { conditions, defaultCondition } from "./conditions";

const isHelp = process.argv.includes("--help") || process.argv.includes("-h");
const helpMessage = `Usage: bun dev
  --verbose, -v: Print verbose output (default false)
                 Verbose output includes the event type, filename,
                 and unique key used to determine if the server should be restarted.
  --help, -h:    Print this help message



If this is your first time running this script, you need to modify the conditions.ts 
file and add your unique key to the conditions object. The unique key is a string
that identifies your computer. You can get this by running the following command:

node -e "console.log(os.userInfo().username + '@' + os.hostname())"

Then, you need to run the script with the --verbose flag to check the event type,
filename, and unique key. Once the script is running, you should make changes to
any file within the src directory and save it. If the server restarts, then the
condition function is working correctly. If the server does not restart, then the
condition function needs to be adjusted. Different editors will emit different 
events, so you may need to adjust the condition function in conditions.ts to
match the events emitted by your editor.

The default condition function is:

export const defaultCondition = (event: FileChangeInfo<string>) => {
  if (!event.filename) return false;
  return event.filename?.startsWith("src") && event.filename.endsWith("~")
}

This condition works for NEOVIM only, and has not been tested with other editors.
`;

if (isHelp) {
  console.log(helpMessage);
  process.exit(0);
}

const isVerbose =
  process.argv.includes("--verbose") || process.argv.includes("-v");

await reloadTsoa();

let currentProcess = spawn("bun", ["run", "./src/server.ts"], {
  stdio: "inherit",
});

currentProcess.stdout?.on("data", (data) => {
  console.log(data.toString());
});
currentProcess.stderr?.on("data", (data) => {
  console.error(data.toString());
});
currentProcess.on("close", (code) => {
  console.log(`Process ${currentProcess.pid} exited with code ${code}`);
});

const watcher = watch(import.meta.dir, {
  recursive: true,
});
for await (const event of watcher) {
  if (generateCondition(event)) {
    console.log("\nkilling previous process");
    if (currentProcess) {
      const isDead = currentProcess.killed;
      const success = currentProcess.kill("SIGTERM");
      if (!success) {
        if (isDead) {
          console.error("Previous process was already dead.");
        } else {
          console.error("Failed to kill previous process.");
          console.error("Consider killing it manually.");
        }
      }
    }

    await reloadTsoa();

    const proc = spawn("bun", ["run", "./src/server.ts"], {
      stdio: "inherit",
    });
    currentProcess = proc;
  }
}

function generateCondition(event: FileChangeInfo<string>) {
  const userName = os.userInfo().username;
  const hostName = os.hostname();
  const uniqueKey = `${userName}@${hostName}`;

  if (isVerbose) {
    console.log(
      "event:",
      event.eventType,
      "file:",
      event.filename,
      "uniqueKey:",
      uniqueKey,
    );
  }

  const condition = conditions[uniqueKey] || defaultCondition;

  return condition(event);
}

async function asyncSpawn(command: string[]) {
  return new Promise<void>((resolve, reject) => {
    Bun.spawn(command, {
      onExit: (_proc, exitCode) => {
        if (exitCode === 0) {
          resolve();
        } else {
          reject();
        }
      },
    });
  });
}

async function reloadTsoa() {
  console.time("reloaded tsoa");
  try {
    await asyncSpawn(["bun", "run", "tsoa", "spec-and-routes"]);
  } catch (e) {
    console.error("Failed to reload tsoa");
    console.error(e);
  }
  console.timeEnd("reloaded tsoa");
}
