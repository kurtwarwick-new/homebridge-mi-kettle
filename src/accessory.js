const mqtt = require("mqtt");

class Accessory {
    constructor(logger, config) {
        this.configureAccessory = this.configureAccessory.bind(this);
        this.debug = this.debug.bind(this);
        this.log = this.log.bind(this);
        this.buildTopic = this.buildTopic.bind(this);
        this.setOnCharacteristic = this.setOnCharacteristic.bind(this);
        this.onState = this.onState.bind(this);
        this.onPresence = this.onPresence.bind(this);
        this.onAttributes = this.onAttributes.bind(this);

        this.config = config;
        this.logger = logger;

        this.configureAccessory();
    }

    debug(message) {
        if (this.config && this.config.debug) {
            this.logger(message.toLowerCase());
        }
    }

    log(message) {
        this.logger(message.toLowerCase());
    }

    buildTopic(topic) {
        return `cybele/kettle/${this.config.mac.toLowerCase().replace(":", "")}/${topic}`;
    }

    configureAccessory() {
        this.switchService = new Service.Switch(`${this.config.name} Switch`);
        this.temperatureService = new Service.TemperatureSensor(`${this.config.name} Temperature`);

        this.switchService.addLinkedService(this.temperatureService);

        this.platform.log(`Xiaomi Smart Kettle accessory [${this.config.mac}] initializing. \r\n${error}`);

        this.mqtt = mqtt.connect(config.mqtt.url);
        this.mqtt.on("error", (error) => {
            this.platform.log(`Xiaomi Smart Kettle accessory [${this.config.mac}] failed to initialize. \r\n${error}`);
        });
        this.mqtt.on("reconnect", () => this.debug(`reconnecting to mqtt host ${config.mqtt.url}.`));
        this.mqtt.on("connect", () => {
            this.debug(`connected to mqtt host ${config.mqtt.url}.`);
            this.mqtt.subscribe("");
            this.mqtt.on("message", (topic, message) => {
                switch (topic) {
                    case this.buildTopic("attributes"):
                        this.onAttributes(message);
                        break;
                    case this.buildTopic("presence"):
                        this.onPresence(message);
                        break;
                    case this.buildTopic("attributes"):
                        this.onState(message);
                        break;
                }
            });

            this.platform.log(`Xiaomi Smart Kettle accessory [${this.config.mac}] ready.`);

            this.switchService.getCharacteristic(Characteristic.On).on("set", this.setOnCharacteristic);
        });
    }

    setOnCharacteristic(value) {
        this.mqtt.publish(this.buildTopic("set_keep_warm_parameters"), {
            mode: value ? "boil" : "heat",
            temperature: value ? 90 : 40,
        });

        this.mqtt.publish(this.buildTopic("set_keep_warm_time_limit"), {
            time: value ? 2 : 8,
        });

        this.mqtt.publish(this.buildTopic("set_keep_warm_refill_mode"), {
            mode: "keep_warm",
        });
    }

    onState(message) {
        this.temperatureService.setCharacteristic(Characteristic.CurrentTemperature, message);
    }

    onPresence(message) {
        this.switchService.setCharacteristic(Characteristic.On, message === "online");
    }

    onAttributes(message) {
        this.switchService.getCharacteristic(Characteristic.On, message.action === "heating");
    }
}

Accessory.pluginName = "homebridge-mi-kettle";
Accessory.accessoryName = "Xiaomi Smart Kettle";

module.exports = Accessory;
