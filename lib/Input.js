/* eslint-disable camelcase */
/* eslint-disable no-sync */

import check         from 'check-types-2';
import InputEvent    from 'input-event';

class Input {
  constructor({handler}) {
    // Detect the event inputs

//    logger.info('Input:constructor');

    // Register the callback functions

    // Rotary Encoder - 1
    this.rotaryEncoder1 = new InputEvent.Rotary('/dev/input/by-path/platform-rotary@c-event');
    this.rotaryEncoder1.on('left', async(/* data */) => {
//      logger.info('Input:rotary1 left');

      check.assert.function(handler.left1, 'handler.left1 not a function');

      handler.left1();
    });
    this.rotaryEncoder1.on('right', async(/* data */) => {
//      logger.info('Input:rotary1 right');

      check.assert.function(handler.right1, 'handler.right1 not a function');

      handler.right1();
    });

    // Rotary Button - 1
    this.rotaryButton1 = new InputEvent.Keyboard('/dev/input/by-path/platform-button@17-event');
    this.rotaryButton1.on('keypress', async(/* data */) => {
//      logger.info('Input:button1 press');

      check.assert.function(handler.press1, 'handler.press1 not a function');

      handler.press1();
    });
    this.rotaryButton1.on('keyup', async(/* data */) => {
//      logger.info('Input:button1 up');

      check.assert.function(handler.up1, 'handler.up1 not a function');

      handler.up1();
    });

    // Rotary Encoder - 2
    this.rotaryEncoder2 = new InputEvent.Rotary('/dev/input/by-path/platform-rotary@16-event');
    this.rotaryEncoder2.on('left', async(/* data */) => {
//      logger.info('Input:rotary2 left');

      check.assert.function(handler.left2, 'handler.left2 not a function');

      handler.left2();
    });
    this.rotaryEncoder2.on('right', async(/* data */) => {
//      logger.info('Input:rotary2 right');

      check.assert.function(handler.right2, 'handler.right2 not a function');

      handler.right2();
    });

    // Rotary Button - 2
    this.rotaryButton2 = new InputEvent.Keyboard('/dev/input/by-path/platform-button@11-event');
    this.rotaryButton2.on('keypress', async(/* data */) => {
//      logger.info('Input:button2 press');

      check.assert.function(handler.press2, 'handler.press2 not a function');

      handler.press2();
    });
    this.rotaryButton2.on('keyup', async(/* data */) => {
//      logger.info('Input:button2 up');

      check.assert.function(handler.up2, 'handler.up2 not a function');

      handler.up2();
    });
  }

  terminate() {
    if(this.rotaryEncoder1) {
      this.rotaryEncoder1.close();
      this.rotaryEncoder1 = undefined;
    }
    if(this.rotaryButton1) {
      this.rotaryButton1.close();
      this.rotaryButton1 = undefined;
    }
    if(this.rotaryEncoder2) {
      this.rotaryEncoder2.close();
      this.rotaryEncoder2 = undefined;
    }
    if(this.rotaryButton2) {
      this.rotaryButton2.close();
      this.rotaryButton2 = undefined;
    }
  }
}

export default Input;
