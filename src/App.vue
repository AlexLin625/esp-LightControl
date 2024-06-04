<script setup>
import LightControl from "@/LightControl.js";
import {computed, onMounted, ref} from "vue";
import iro from "@jaames/iro";

const led = new LightControl();
const isConnected = ref(false);
const statusText = computed(() => {
    if (isConnected.value)
        return "设备已连接";
    else
        return "设备未连接";
});

let timer = null;

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
    led.writeColor(payload);
}

let setColor = debounce(__setColor, 400);

let colorPicker = null;
onMounted(() => {
    colorPicker = new iro.ColorPicker("#colorPicker");

    colorPicker.on(['color:init', 'color:change'], function (color) {
        console.log(color.hexString);
        if (isConnected.value) {
            setColor(color.hexString);
        }
    });
});

async function connect() {
    await led.request();
    led.connect().then(() => {
            isConnected.value = true;
        }
    )
}


</script>

<template>
    <div class="container mx:auto px-4 flex flex-col items-center">
        <p class="text-4xl py-8">
            ESP32-C3 BLE Light Controller
        </p>

        <p class="text-gray-600">
            {{ statusText }}
        </p>

        <button class="px-5 py-2 rounded-full shadow-md border-solid border-1 border-slate-400 my-4" @click="connect()">
            连接设备
        </button>

        <div class="my-8" id="colorPicker"></div>
    </div>
</template>

<style scoped>
</style>
