
const Accessory = require('./src/accessory');

module.exports = function (homebridge) {
    homebridge.registerAccessory(Accessory.pluginName, Accessory.accessoryName, Accessory);
}