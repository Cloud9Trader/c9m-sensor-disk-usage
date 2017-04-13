const c9m = require('c9m');
const os = require('os');
const childProcess = require('child_process');


class Sensor extends c9m.Sensor {

  constructor () {
    super();
    this.name = 'disk-usage';
  }

  measure () {
    this.readDiskUsage((error, values) => {
      if (error) {
        return console.error('[ERROR] Cloud9Metrics could not read disk usage', error);
      }
      this.emit('value', values);
    });
  }

  readDiskUsage (callback) {
    childProcess.exec('df -kP', (error, stdout, stderr) => {
      if (error) return callback(error);

      const lines = stdout.split('\n');
      const header = lines.shift();

      let blockSize = 1024;

      const disks = lines.reduce((disks, line) => {

        const match = line.match(/^(.+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)%\s+(.+)$/);
        if (!match) return disks;
        const size = parseInt(match[2]) * blockSize;
        const sizeMb = size / 1024 / 1024;
        const used = parseInt(match[3]) * blockSize;
        const usedMb = used / 1024 / 1024;
        disks.push({
          mounted: match[6],
          sizeMb,
          usedMb
        });
        return disks;
      }, []);

      const rootDisk = disks.find((disk) => disk.mounted === '/');

      if (rootDisk) {
        return callback(null, {
          size: Math.round(rootDisk.sizeMb),
          used: Math.round(rootDisk.usedMb)
        });
      }

      const totalSize = disks.reduce((total, disk) => total + disk.sizeMb, 0);
      const totalUsed = disks.reduce((total, disk) => total + disk.usedMb, 0);

      callback(null, {
        size: Math.round(totalSize),
        used: Math.round(totalUsed)
      });
    });
  }
}

module.exports = Sensor;
