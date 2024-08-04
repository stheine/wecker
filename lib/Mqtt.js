import mqtt   from 'mqtt';
import ms     from 'ms';

import logger from './logger.js';

class Mqtt {
  constructor({logic}) {
    this.logic          = logic;

    this.healthInterval = undefined;
    this.mqttClient     = undefined;

    this.tempAussen     = null;
  }

  async terminate() {
    if(this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = undefined;
    }

    if(this.mqttClient) {
      await this.mqttClient.endAsync();
      this.mqttClient = undefined;
    }
  }

  async start() {
    this.mqttClient = await mqtt.connectAsync('tcp://192.168.6.5:1883');

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
          case 'vito/tele/SENSOR':
            this.tempAussen = message.tempAussen;
            break;

          case 'Zigbee/FensterSensor Büro':
          case 'Zigbee/FensterSensor Garage':
          case 'Zigbee/FensterSensor Kinderbad':
          case 'Zigbee/FensterSensor Toilette': {
            const {contact} = message;
            const name      = topic.split(' ')[1];
            const value     = this.tempAussen < 15 && !contact ? 'Offen' : null;

            this.logic.warn({name, value});
            break;
          }

          default:
            logger.error(`Unhandled topic '${topic}'`, message);
            break;
        }
      } catch(err) {
        logger.error(`Failed mqtt handling for '${topic}': ${messageRaw}`, err);
      }
    });

    await this.mqttClient.subscribeAsync('vito/tele/SENSOR');
    await this.mqttClient.subscribeAsync('Zigbee/FensterSensor Büro');
    await this.mqttClient.subscribeAsync('Zigbee/FensterSensor Garage');
    await this.mqttClient.subscribeAsync('Zigbee/FensterSensor Kinderbad');
    await this.mqttClient.subscribeAsync('Zigbee/FensterSensor Toilette');

    this.healthInterval = setInterval(async() => {
      await this.mqttClient.publishAsync(`wecker/health/STATE`, 'OK');
    }, ms('1min'));
  }
}

export default Mqtt;
