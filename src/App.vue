<script setup>
import LightControl from "@/LightControl.js";
import {computed, onMounted, ref} from "vue";
import iro from "@jaames/iro";

const led = new LightControl();
const isConnected = ref(false);

let busy = false;

const statusText = computed(() => {
    if (isConnected.value)
        return "设备已连接";
    else
        return "设备未连接";
});

function hexToRgb(hex) {
    // Remove the '#' from the start of the string if it's there
    hex = hex.startsWith('#') ? hex.slice(1) : hex;

    // Convert each pair of hexadecimal characters to an integer
    let r = parseInt(hex.slice(0, 2), 16);
    let g = parseInt(hex.slice(2, 4), 16);
    let b = parseInt(hex.slice(4, 6), 16);

    // Return the result as an array
    return [b, g, r, 0];
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    }
}

function __setColor(colorString) {
    let payload = new Uint8Array(hexToRgb(colorString));
    if (busy) return;

    busy = true;
    led.writeColor(payload)
        .then(() => {
            busy = false;
        }).catch(() => {
        busy = false;
        disableLiveUpdate();
    });
}

let setColor = debounce(__setColor, 200);

let colorPicker = null;
const currentColorStr = ref("");
const currentColorTemp = ref(6500);

onMounted(() => {
    colorPicker = new iro.ColorPicker("#colorPicker", {
            layout: [
                {
                    component: iro.ui.Wheel,
                    options: {}
                },
                {
                    component: iro.ui.Slider,
                    options: {
                        sliderType: "hue"
                    }
                },
                {
                    component: iro.ui.Slider,
                    options: {
                        sliderType: "saturation"
                    }
                },
                {
                    component: iro.ui.Slider,
                    options: {
                        sliderType: "value"
                    }
                },
                {
                    component: iro.ui.Slider,
                    options: {
                        sliderType: "kelvin"
                    }
                },
            ]
        }
    );

    colorPicker.on(['color:init', 'color:change'], function (color) {
        currentColorStr.value = color.hexString;
    });

    led.setDisconnectedHook(() => {
        disableLiveUpdate();
        isConnected.value = false;
    });
});

function submit() {
    setColor(currentColorStr.value);
}

async function connect() {
    await led.request();
    led.connect().then(() => {
            isConnected.value = true;
        }
    )
}

async function disconnect() {
    led.disconnect();
    isConnected.value = false;
}

let timer = null;
const livePreview = ref(false);

function enableLiveUpdate() {
    livePreview.value = true;
    timer = setInterval(() => {
        __setColor(currentColorStr.value);
    }, 150);
}

function disableLiveUpdate() {
    clearInterval(timer);
    livePreview.value = false;
}

</script>

<template>
    <div class="w-full h-full flex flex-col items-center">
        <div class="container mx:auto px-4 flex flex-col items-center max-w-[800px]">
            <p class="text-4xl py-8">
                ESP32-C3 BLE Light Controller
            </p>

            <p class="text-gray-600">
                {{ statusText }}
            </p>

            <button class="Button" @click="connect()" v-if="!isConnected">
                连接设备
            </button>
            <button class="Button danger" @click="disconnect()" v-else>
                断开连接
            </button>

            <div class="my-6 flex flex-row gap-4">
                <div class="color-preset" @click="setColor('#ff810d')" style="background: #fa9741"/>
                <div class="color-preset" @click="setColor('#ffa621')" style="background: #ffc477"/>
                <div class="color-preset" @click="setColor('#ffd363')" style="background: #ffffff"/>
            </div>

            <input
                class="outline-none shadow-md w-full px-6 py-2 my-3 max-w-[600px] border-gray-500 border-1 rounded-full"
                type="text" placeholder="自定义颜色"
                v-model="currentColorStr">

            <div class="my-8" id="colorPicker"></div>

            <div class="flex flex-row items-center justify-center gap-4" v-if="isConnected">
                <button class="Button" @click="submit()" v-if="!livePreview">
                    提交
                </button>
                <button class="Button" @click="enableLiveUpdate()" v-if="!livePreview">
                    实时预览
                </button>
                <button class="Button" @click="disableLiveUpdate()" v-else>
                    停止
                </button>
            </div>
        </div>
    </div>
</template>

