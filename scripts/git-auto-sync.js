// Файл містить службовий Node.js-скрипт для підтримки проєкту.
const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const pidFile = path.join(repoRoot, ".gitautosync.pid");
const logFile = path.join(repoRoot, ".gitautosync.log");
const debounceMs = 5000;

const ignoredParts = [
  ".git",
  "node_modules",
  "public/react-app",
  ".playwright-mcp",
  ".tmp_pptxgen",
  "tmp_pptxgen_pkg"
];

let timer = null;
let syncing = false;
let pending = false;

// Виконує локальну логіку timestamp для модуля службового скрипта.
function timestamp() {
  return new Date().toISOString().replace("T", " ").replace(/\..+/, "");
}

// Виконує локальну логіку append log для модуля службового скрипта.
function appendLog(message) {
  const line = `[${timestamp()}] ${message}\n`;
  fs.appendFileSync(logFile, line);
  process.stdout.write(line);
}

// Виконує локальну логіку run git для модуля службового скрипта.
function runGit(args, options = {}) {
  return spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    ...options
  });
}

// Перевіряє is ignored і повертає результат або кидає помилку валідації.
function isIgnored(targetPath) {
  const normalized = targetPath.replace(/\\/g, "/");
  return ignoredParts.some((part) => normalized.includes(part));
}

// Перевіряє has pending changes і повертає результат або кидає помилку валідації.
function hasPendingChanges() {
  const result = runGit(["status", "--porcelain"]);
  if (result.status !== 0) {
    appendLog(`git status failed: ${result.stderr.trim() || result.stdout.trim()}`);
    return false;
  }

  return Boolean(result.stdout.trim());
}

// Виконує локальну логіку current branch для модуля службового скрипта.
function currentBranch() {
  const result = runGit(["branch", "--show-current"]);
  return result.status === 0 ? result.stdout.trim() : "main";
}

// Виконує локальну логіку schedule sync для модуля службового скрипта.
function scheduleSync(reason) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    syncNow(reason).catch((error) => {
      appendLog(`sync error: ${error.message}`);
    });
  }, debounceMs);
}

// Синхронізує sync now між локальним станом, URL, подіями або сховищем.
async function syncNow(reason) {
  if (syncing) {
    pending = true;
    return;
  }

  if (!hasPendingChanges()) {
    return;
  }

  syncing = true;
  appendLog(`detected changes (${reason}), starting auto-sync`);

  try {
    const addResult = runGit(["add", "-A"]);
    if (addResult.status !== 0) {
      appendLog(`git add failed: ${addResult.stderr.trim() || addResult.stdout.trim()}`);
      return;
    }

    const commitMessage = `Auto-sync ${timestamp()}`;
    const commitResult = runGit(["commit", "-m", commitMessage]);

    if (commitResult.status !== 0) {
      const output = `${commitResult.stdout}\n${commitResult.stderr}`.trim();
      if (output.includes("nothing to commit")) {
        appendLog("nothing to commit after staging");
      } else {
        appendLog(`git commit failed: ${output}`);
      }
      return;
    }

    appendLog(`created commit: ${commitMessage}`);

    const branch = currentBranch();
    const pushResult = runGit(["push", "origin", branch]);
    if (pushResult.status !== 0) {
      appendLog(`git push failed: ${pushResult.stderr.trim() || pushResult.stdout.trim()}`);
      return;
    }

    appendLog(`pushed ${branch} to origin`);
  } finally {
    syncing = false;
    if (pending) {
      pending = false;
      scheduleSync("queued changes");
    }
  }
}

// Виконує локальну логіку watch repo для модуля службового скрипта.
function watchRepo() {
  appendLog("auto-sync watcher is running");

  const watcher = fs.watch(repoRoot, { recursive: true }, (_, filename) => {
    if (!filename) return;
    if (isIgnored(filename)) return;
    scheduleSync(filename);
  });

  watcher.on("error", (error) => {
    appendLog(`watcher error: ${error.message}`);
  });

  // Виконує локальну логіку cleanup для модуля службового скрипта.
  const cleanup = () => {
    try {
      watcher.close();
    } catch {}
    try {
      if (fs.existsSync(pidFile) && String(process.pid) === fs.readFileSync(pidFile, "utf8").trim()) {
        fs.unlinkSync(pidFile);
      }
    } catch {}
    appendLog("auto-sync watcher stopped");
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

// Виконує локальну логіку start daemon для модуля службового скрипта.
function startDaemon() {
  if (fs.existsSync(pidFile)) {
    const pid = fs.readFileSync(pidFile, "utf8").trim();
    try {
      process.kill(Number(pid), 0);
      console.log(`Auto-sync already running with PID ${pid}`);
      return;
    } catch {
      fs.unlinkSync(pidFile);
    }
  }

  const child = spawn(process.execPath, [__filename, "--run"], {
    cwd: repoRoot,
    detached: true,
    stdio: "ignore"
  });

  fs.writeFileSync(pidFile, String(child.pid));
  child.unref();
  console.log(`Auto-sync started with PID ${child.pid}`);
}

// Виконує локальну логіку stop daemon для модуля службового скрипта.
function stopDaemon() {
  if (!fs.existsSync(pidFile)) {
    console.log("Auto-sync is not running");
    return;
  }

  const pid = Number(fs.readFileSync(pidFile, "utf8").trim());
  try {
    process.kill(pid);
  } catch {}

  try {
    fs.unlinkSync(pidFile);
  } catch {}

  console.log(`Auto-sync stopped${pid ? ` (PID ${pid})` : ""}`);
}

// Виконує локальну логіку print status для модуля службового скрипта.
function printStatus() {
  if (!fs.existsSync(pidFile)) {
    console.log("Auto-sync status: stopped");
    return;
  }

  const pid = Number(fs.readFileSync(pidFile, "utf8").trim());
  try {
    process.kill(pid, 0);
    console.log(`Auto-sync status: running (PID ${pid})`);
  } catch {
    console.log("Auto-sync status: stale pid file");
  }
}

const mode = process.argv[2];

if (mode === "--daemon") {
  startDaemon();
} else if (mode === "--stop") {
  stopDaemon();
} else if (mode === "--status") {
  printStatus();
} else if (mode === "--run") {
  watchRepo();
} else {
  watchRepo();
}
