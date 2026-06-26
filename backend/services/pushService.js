
// Push Service for eSSL / ZKTeco Biometric Devices
// DEVICE CONNECTIVITY TEST MODE (NO DB, NO PARSING)

const http = require("http");

class PushService {
  constructor(port = 8081) {
    this.port = port;
    this.server = null;
    this.isRunning = false;
  }

  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = http.createServer((req, res) => {
          let body = "";

          req.on("data", chunk => {
            body += chunk.toString();
          });

          req.on("end", () => {
            const deviceIp = req.socket.remoteAddress.replace("::ffff:", "");

            // 🔴 IGNORE BROWSER NOISE
            if (
              req.url === "/test" ||
              req.url === "/favicon.ico"
            ) {
              res.writeHead(200, { "Content-Type": "text/plain" });
              return res.end("OK");
            }

            // ✅ REAL DEVICE LOG
            console.log("🔥 BIOMETRIC DEVICE HIT");
            console.log("➡️ Device IP :", deviceIp);
            console.log("➡️ METHOD    :", req.method);
            console.log("➡️ URL       :", req.url);
            console.log("➡️ BODY      :", body || "(empty)");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            // MUST respond OK or device stops pushing
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("OK");
          });
        });

        this.server.listen(this.port, "0.0.0.0", () => {
          this.isRunning = true;
          console.log(`✅ PUSH Service listening on port ${this.port}`);
          resolve(true);
        });

        this.server.on("error", err => {
          console.error("❌ PUSH Server Error:", err);
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  stop() {
    return new Promise(resolve => {
      if (this.server) {
        this.server.close(() => {
          this.isRunning = false;
          console.log("🛑 PUSH Service stopped");
          resolve(true);
        });
      } else {
        resolve(true);
      }
    });
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port
    };
  }
}

// SINGLETON
let pushServiceInstance = null;

function getPushService(port = 8081) {
  if (!pushServiceInstance) {
    pushServiceInstance = new PushService(port);
  }
  return pushServiceInstance;
}

module.exports = {
  PushService,
  getPushService
};
