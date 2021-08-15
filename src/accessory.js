const mqtt = require("mqtt");

var Service;
var Characteristic;

class Accessory {
    constructor(logger, config, api) {
        this.configureAccessory = this.configureAccessory.bind(this);
        this.debug = this.debug.bind(this);
        this.log = this.log.bind(this);
        this.buildTopic = this.buildTopic.bind(this);
        this.onState = this.onState.bind(this);
        this.onAttributes = this.onAttributes.bind(this);
        this.getServices = this.getServices.bind(this);
        this.setTargetHeatingCoolingState = this.setTargetHeatingCoolingState.bind(this);
        this.setTargetTemperature = this.setTargetTemperature.bind(this);
        this.setTemperatureDisplayUnits = this.setTemperatureDisplayUnits.bind(this);

        this.config = config;
        this.logger = logger;
        this.api = api;

        this.power = false;

        Service = api.hap.Service;
        Characteristic = api.hap.Characteristic;

        this.configureAccessory();
    }

    debug = (message) => {
        if (this.config && this.config.debug) {
            this.logger(message.toLowerCase());
        }
    }

    log = (message) => {
        this.logger(message.toLowerCase());
    }

    buildTopic = (topic) => {
        return `cybele/kettle/${this.config.mac.toLowerCase().replace(/:/g, "")}/${topic}`;
    }

    getServices = () => {
        return [this.service];
    }

    configureAccessory = () => {
        this.service = new Service.Thermostat(`${this.config.name}`);

        this.log(`[${this.config.mac}] initializing.`);
        this.log(`[${this.config.mac}] connecting to MQTT broker.`);

        this.mqtt = mqtt.connect(this.config.mqtt.url);
        this.mqtt.on("error", (error) => {
            this.log(`[${this.config.mac}] failed to initialize. \r\n${error}`);
        });
        this.mqtt.on("reconnect", () => this.debug(`[${this.config.mac}] reconnecting to mqtt broker.`));
        this.mqtt.on("connect", () => {
            try {
                this.log(`[${this.config.mac}] connected to mqtt broker.`);

                this.mqtt.subscribe(this.buildTopic("attributes"));
                this.mqtt.subscribe(this.buildTopic("state"));

                this.mqtt.on("message", (topic, message) => {
                    switch (topic) {
                        case this.buildTopic("attributes"):
                            this.onAttributes(message);
                            break;
                        case this.buildTopic("state"):
                            this.onState(message);
                            break;
                    }
                });

                this.log(`[${this.config.mac}] accessory ready.`);

                let targetHeatingCoolingStateCHaracteristic = this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState);

                targetHeatingCoolingStateCHaracteristic.onSet(this.setTargetHeatingCoolingState);
                targetHeatingCoolingStateCHaracteristic.props.validValues = [0, 1];

                let targetTemperatureCharacteristic = this.service.getCharacteristic(Characteristic.TargetTemperature);
                    
                targetTemperatureCharacteristic.onSet(this.setTargetTemperature);
                targetTemperatureCharacteristic.props.minValue = 40;
                targetTemperatureCharacteristic.props.maxValue = 100;

                let coolingThresholdTemperatureCharacter = this.service.getCharacteristic(Characteristic.CoolingThresholdTemperature);

                coolingThresholdTemperatureCharacter.onSet(this.setCoolingThresholdTemperature);
                coolingThresholdTemperatureCharacter.props.minValue = 40;
                coolingThresholdTemperatureCharacter.props.maxValue = 100;

                let heatingThresholdTemperatureCharacteristic = this.service.getCharacteristic(Characteristic.HeatingThresholdTemperature);

                heatingThresholdTemperatureCharacteristic.onSet(this.setHeatingThresholdTemperature);
                heatingThresholdTemperatureCharacteristic.props.minValue = 40;
                heatingThresholdTemperatureCharacteristic.props.maxValue = 100;

                this.service
                    .getCharacteristic(Characteristic.TemperatureDisplayUnits)
                    .on("set", this.setTemperatureDisplayUnits);

            } catch (error) {
                this.log(`[${this.config.mac}] accessory failed to initialize. \r\n${error}`);
            }
        });
    }

    setTargetHeatingCoolingState = (value, next) => {
        this.debug(`[${this.config.mac}] setting state to ${value}`);

        this.mqtt.publish(
            this.buildTopic("set_keep_warm_parameters"),
            JSON.stringify({
                mode: value == 1 ? "boil" : "heat",
                temperature: value ? this.maxTemperature : 40,
            })
        );

        next && next();
    }

    getTargetTemperature = (value) => {
        this.debug(`[${this.config.mac}] getting target temperature`);
        this.logger(value);
    }

    setTargetTemperature = (value, next) => {
        this.debug(`[${this.config.mac}] setting target temperature to ${value}`);

        next && next();
    }

    setTemperatureDisplayUnits = (value, next) => {
        this.debug(`[${this.config.mac}] setting temperature display units to ${value}`);

        next && next();
    }

    getTemperatureDisplayUnits = () => {
        this.debug(`[${this.config.mac}] getting temperature display units`);

        return Characteristic.TemperatureDisplayUnits.CELSIUS;
    }

    setOnCharacteristic(value, next) {
        this.debug(`[${this.config.mac}] turning ${value ? "on" : "off"}`);

        // this.mqtt.publish(
        //     this.buildTopic("set_keep_warm_parameters"),
        //     JSON.stringify({
        //         mode: value ? "boil" : "heat",
        //         temperature: value ? this.maxTemperature : 40,
        //     })
        // );

        // this.debug(
        //     `[${this.config.mac}] published set_keep_warm_parameters : \r\n${JSON.stringify({
        //         mode: value ? "boil" : "heat",
        //         temperature: value ? this.maxTemperature : 40,
        //     })}`
        // );

        // this.mqtt.publish(
        //     this.buildTopic("set_keep_warm_time_limit"),
        //     JSON.stringify({
        //         time: value ? 2 : 8,
        //     })
        // );

        // this.debug(
        //     `[${this.config.mac}] ppublished set_keep_warm_time_limit : \r\n${JSON.stringify({
        //         time: value ? 2 : 8,
        //     })}`
        // );

        // this.mqtt.publish(
        //     this.buildTopic("set_keep_warm_refill_mode"),
        //     JSON.stringify({
        //         mode: "keep_warm",
        //     })
        // );

        // this.debug(
        //     `[${this.config.mac}] published set_keep_warm_refill_mode : \r\n${JSON.stringify({
        //         mode: "keep_warm",
        //     })}`
        // );

        next && next();
    }

    onState = (message) => {
        message = message.toString("utf-8");

        this.debug(`[${this.config.mac}] received state : ${message}`);

        this.service.setCharacteristic(Characteristic.CurrentTemperature, message);
    }

    onAttributes = (message) => {
        message = message.toString("utf-8");

        this.debug(`[${this.config.mac}] received attributes : \r\n${message}`);

        message = JSON.parse(message);

        this.switchService.setCharacteristic(Characteristic.CurrentHeatingCoolingState, value === "heating" ? 1 : 0);

        // let value = message.action === "heating";

        // if (!value) {
        //     this.setOnCharacteristic(false);

        //     if (this.power) {
        //         if (this.temperature && !isNaN(this.temperature) && this.temperature > this.maxTemperature) {
        //             this.motionSensor.setCharacteristic(Characteristic.MotionDetected, 1);

        //             setTimeout(() => this.motionSensor.setCharacteristic(Characteristic.MotionDetected, 0), 5000);
        //         }
        //     }
        // }

        // this.switchService.setCharacteristic(Characteristic.On, value);

        // this.power = value;
    }
}

Accessory.pluginName = "homebridge-mi-kettle";
Accessory.accessoryName = "MiKettle";

module.exports = Accessory;
