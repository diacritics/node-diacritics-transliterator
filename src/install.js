const outputGenerator = require('./lib/output-generator'),
  fs = require('fs'),
  path = require('path');

class Installer {
  constructor() {
    this.targetDirectory = path.join(__dirname, '../data');
  }

  init() {
    this.createDirectories();
    this.generateFull();
    this.generateContinents();
  }

  generateFull() {
    outputGenerator().then(json => {
      this.write('full', json);
    }, msg => console.log(msg));
  }

  generateContinents() {
    const continents = ['AF', 'AS', 'EU', 'NA', 'SA', 'OC', 'AN'];
    continents.forEach(continent => {
      outputGenerator({continent}).then(json => {
        this.write(`continents/${continent}`, json);
      }, msg => console.log(msg));
    });
  }

  createDirectories() {
    const directories = [
      this.targetDirectory,
      this.targetDirectory + '/continents'
    ];
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
    });
  }

  write(filename, data) {
    if (!fs.existsSync(filename)) {
      fs.writeFileSync(
        `${this.targetDirectory}/${filename}.json`,
        JSON.stringify(data),
        'utf8'
      );
    }
  }
}

module.exports = new Installer().init();