# wecker

## Issues

### Node support

Only supports `node 10`, due to https://github.com/TooTallNate/node-lame/issues/92 .

### Soundcard not detected

```
ALSA lib confmisc.c:767:(parse_card) cannot find card '1'
ALSA lib conf.c:4528:(_snd_config_evaluate) function snd_func_card_driver returned error: No such file or directory
```

```sh
sudo lsusb -v | grep -i audio
aplay -l
# **** List of PLAYBACK Hardware Devices ****
# card 1: Device [USB Audio Device], device 0: USB Audio [USB Audio]
#   Subdevices: 1/1
#     Subdevice #0: subdevice #0

sudo apt install mpg321

mpg321 -m -a hw:1,0 sounds/alarmClock.mp3
```

```sh
sudo vi /etc/asound.conf

pcm.!default {
  type hw
  card 1
}
```
