const net = require("net");

class BiometricService {
  constructor(ip, port = 4370) {
    if (port !== 4370) {
      throw new Error(
        "BiometricService supports PULL only (TCP 4370)."
      );
    }

    this.ip = ip;
    this.port = port;
    this.timeout = 5000;
  }

  // ✅ REAL test connection (TCP reachability)
  testConnection() {
    return new Promise((resolve) => {
      const socket = new net.Socket();

      socket.setTimeout(this.timeout);

      socket.connect(this.port, this.ip, () => {
        console.log(`✅ Device reachable via TCP ${this.ip}:4370`);
        socket.destroy();
        resolve({
          success: true,
          message: "Device reachable via TCP 4370"
        });
      });

      socket.on("timeout", () => {
        socket.destroy();
        resolve({
          success: false,
          error: "Connection timeout"
        });
      });

      socket.on("error", (err) => {
        resolve({
          success: false,
          error: err.message
        });
      });
    });
  }

  // 🚧 Attendance pull placeholder (NEXT STEP)
  async getAttendanceLogs() {
    return {
      success: true,
      logs: [],
      message: "Attendance pull not implemented yet"
    };
  }
}

function createBiometricService(ip, port = 4370) {
  return new BiometricService(ip, port);
}

module.exports = {
  BiometricService,
  createBiometricService
};
