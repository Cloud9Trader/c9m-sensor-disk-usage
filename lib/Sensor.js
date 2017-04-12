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
          filesystem: match[1].trim(),
          size: sizeMb,
          used: usedMb
        });
        return disks;
      }, []);
      const totals = disks.reduce((totals, disk) => {
        totals.size += Math.round(disk.size);
        totals.used += Math.round(disk.used);
        return totals;
      }, {
        size: 0,
        used: 0
      });

      callback(null, totals);
    });
  }
}

module.exports = Sensor;
