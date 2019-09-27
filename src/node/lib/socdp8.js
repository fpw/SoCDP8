"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UIOMapper_1 = require("./UIO/UIOMapper");
let mapper = new UIOMapper_1.UIOMapper();
let buffer = mapper.mapUio('socdp8_core', 'socdp8_core_mem');
console.log(buffer.readUInt16LE(0));
