import { spawn } from "node:child_process";

const reportPath = "coverage/index.html";

function openReport() {
  if (process.platform === "darwin") {
    return spawn("open", [reportPath], { stdio: "ignore", detached: true });
  }

  if (process.platform === "win32") {
    return spawn("cmd", ["/c", "start", "", reportPath], {
      stdio: "ignore",
      detached: true,
    });
  }

  return spawn("xdg-open", [reportPath], { stdio: "ignore", detached: true });
}

try {
  const child = openReport();
  child.unref();
  child.on("error", () => {
    console.log("Coverage report generated at next/coverage/index.html");
  });
} catch {
  console.log("Coverage report generated at next/coverage/index.html");
}
