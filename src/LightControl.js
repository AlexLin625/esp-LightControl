const service_uuid = 0x1EDC; // LEDC
const char_uuid = 0x1145;

export default class LightControl {
    constructor() {
        this.device = null;
        this.disconnectCb = null;
        this.onDisconnected = this.onDisconnected.bind(this);
    }

    request() {
        let options = {
            "filters": [{
                "name": "LEDStrip_esp32-C3"
            }],
            "optionalServices": [0x1EDC]
        };
        return navigator.bluetooth.requestDevice(options)
            .then(device => {
                this.device = device;
                this.device.addEventListener('gattserverdisconnected', this.onDisconnected);
            });
    }

    connect() {
        if (!this.device) {
            return Promise.reject('Device is not connected.');
        }
        return this.device.gatt.connect();
    }

    readColor() {
        return this.device.gatt.getPrimaryService(service_uuid)
            .then(service => service.getCharacteristic(char_uuid))
            .then(characteristic => characteristic.readValue());
    }

    writeColor(data) {
        return this.device.gatt.getPrimaryService(service_uuid)
            .then(service => service.getCharacteristic(char_uuid))
            .then(characteristic => characteristic.writeValue(data));
    }

    disconnect() {
        if (!this.device) {
            return Promise.reject('Device is not connected.');
        }
        return this.device.gatt.disconnect();
    }

    onDisconnected() {
        console.log('Device is disconnected.');
        if (this.disconnectCb)
            this.disconnectCb();
    }

    setDisconnectedHook(f) {
        this.disconnectCb = f;
    }
}