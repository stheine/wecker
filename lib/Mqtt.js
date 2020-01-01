'use strict';

/* eslint-disable no-console */

const mqtt = require('async-mqtt');

class Mqtt {
  constructor() {
    this.mqttClient = undefined;
  }

  async terminate() {
    if(this.mqttClient) {
      await this.mqttClient.end();
      this.mqttClient = undefined;
    }
  }

  async start() {
    this.mqttClient = await mqtt.connectAsync('tcp://192.168.6.7:1883');

    this.mqttClient.on('message', async(topic, messageBuffer) => {
      const messageRaw = messageBuffer.toString();

      try {
        let message;

        try {
          message = JSON.parse(messageRaw);
        } catch(err) {
          // ignore
        }

        switch(topic) {
          case 'Zigbee/FensterSensor Garage':
          case 'Zigbee/FensterSensor Toilette': {
            const {contact} = message;

            console.log(topic, {contact});
            break;
          }

          default:
            console.error(`Unhandled topic '${topic}'`, message);
            break;
        }
      } catch(err) {
        console.error(`Failed mqtt handling for '${topic}': ${messageRaw}`, err);
      }
    });

    await this.mqttClient.subscribe('Zigbee/FensterSensor Garage');
    await this.mqttClient.subscribe('Zigbee/FensterSensor Toilette');
  }
}

module.exports = Mqtt;
