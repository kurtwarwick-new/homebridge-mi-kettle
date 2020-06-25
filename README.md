# Homebridge Mi Kettle

*NOTE: This is in development stages and should not be used!*

A [homebridge](https://github.com/nfarina/homebridge) plugin that exposes your Xiaomi Smart Kettle to Homekit.

## Overview

This plugin exposes the Xiaomi Smart Kettle as a switch device, with the switch power state representing the Kettle boile state. The current temperature is exposed through a linked Temperature Sensor.

** Note: ** This plugin is dependent on the amazing [Cybele project]:https://github.com/Hypfer/Cybele by [Hypfer]:https://github.com/Hypfer. Please follow the instructions provided by the project readme.

## Sample Configuration

```yaml
"accessories": [
    {
      "accessory": "MiKettle",
      "debug": true,
      "name": "My Smart Kettle",
      "mac": "1a2b3c4d5e6f",
      "mqtt": {
        "url": "http://mqtthost:port"
      }
    }   
]
```
### Configuration Definition

* **accessory**: The identifier for the accessory (*AppleTvNowPlayingPlatform*).
* **debug** [*optional*]: Enables limited debugging.
* **name**: The name you would like to expose for the device.
* **mac**: The mac address of your kettle. You can follow the 

## Retrieving credentials

This guide assumes that you are using a Raspberry Pi. These should apply to any linux based device with bluetooth capabilities.

In order to retrieve the MAC address for your Kettle, please follow these steps

1. Place your Raspberry Pi near your kettle.
1. Execute this command
```
hciconfig hci0 down
```
2. You should see your kettle within the reuslt list
```
B8:**:5A:**:FB:** (unknown)
*E2:7C:**:45:**:12 MiKettle*
53:**:1A:**:39:** (unknown)
2A:D6:**:9A:**:23 (unknown)
```

If you get the error *Set scan parameters failed: Input/output error* try running

```
hciconfig hci0 down
hciconfig hci0 up
```