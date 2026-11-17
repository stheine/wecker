import mqtt   from 'mqtt';
import ms     from 'ms';

import logger from './logger.js';

class Mqtt {
  constructor({logic}) {
    this.logic          = logic;

    this.healthInterval = undefined;
    this.mqttClient     = undefined;

    this.tempAussen     = null;

    this.friendlyNames  = {};
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
          message = messageRaw;
        }

        switch(topic) {
          case 'vito/tele/SENSOR':
            this.tempAussen = message.tempAussen;
            break;

          case 'homeassistant/binary_sensor/fenstersensor_badezimmer/friendly_name':
          case 'homeassistant/binary_sensor/fenstersensor_buero/friendly_name':
          case 'homeassistant/binary_sensor/fenstersensor_garage/friendly_name':
          case 'homeassistant/binary_sensor/fenstersensor_kinderbad/friendly_name':
          case 'homeassistant/binary_sensor/fenstersensor_toilette/friendly_name': {
            const name = topic.replace(/^homeassistant\/binary_sensor\/(?<name>.*)\/friendly_name$/, '$<name>');

            this.friendlyNames[name] = message.replace(/^FensterSensor /, '');
            break;
          }

          case 'homeassistant/binary_sensor/fenstersensor_badezimmer/state':
          case 'homeassistant/binary_sensor/fenstersensor_buero/state':
          case 'homeassistant/binary_sensor/fenstersensor_garage/state':
          case 'homeassistant/binary_sensor/fenstersensor_kinderbad/state':
          case 'homeassistant/binary_sensor/fenstersensor_toilette/state': {
            const contact = message === 'off';
            const intName = topic.replace(/^homeassistant\/binary_sensor\/(?<name>.*)\/state$/, '$<name>');
            const name    = this.friendlyNames[intName];
            const value   = this.tempAussen < 15 && contact ? null : 'Offen';

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
    await this.mqttClient.subscribeAsync('homeassistant/binary_sensor/fenstersensor_badezimmer/friendly_name');
    await this.mqttClient.subscribeAsync('homeassistant/binary_sensor/fenstersensor_badezimmer/state');
    await this.mqttClient.subscribeAsync('homeassistant/binary_sensor/fenstersensor_buero/friendly_name');
    await this.mqttClient.subscribeAsync('homeassistant/binary_sensor/fenstersensor_buero/state');
    await this.mqttClient.subscribeAsync('homeassistant/binary_sensor/fenstersensor_garage/friendly_name');
    await this.mqttClient.subscribeAsync('homeassistant/binary_sensor/fenstersensor_garage/state');
    await this.mqttClient.subscribeAsync('homeassistant/binary_sensor/fenstersensor_kinderbad/friendly_name');
    await this.mqttClient.subscribeAsync('homeassistant/binary_sensor/fenstersensor_kinderbad/state');
    await this.mqttClient.subscribeAsync('homeassistant/binary_sensor/fenstersensor_toilette/friendly_name');
    await this.mqttClient.subscribeAsync('homeassistant/binary_sensor/fenstersensor_toilette/state');

    this.healthInterval = setInterval(async() => {
      await this.mqttClient.publishAsync(`wecker/health/STATE`, 'OK');
    }, ms('1min'));
  }
}

export default Mqtt;
