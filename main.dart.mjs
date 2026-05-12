// Compiles a dart2wasm-generated main module from `source` which can then
// instantiatable via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm modules from `bytes` which is then
// instantiatable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

// DEPRECATED: Please use `compile` or `compileStreaming` to get a compiled app,
// use `instantiate` method to get an instantiated app and then call
// `invokeMain` to invoke the main function.
export async function instantiate(modulePromise, importObjectPromise) {
  var moduleOrCompiledApp = await modulePromise;
  if (!(moduleOrCompiledApp instanceof CompiledApp)) {
    moduleOrCompiledApp = new CompiledApp(moduleOrCompiledApp);
  }
  const instantiatedApp = await moduleOrCompiledApp.instantiate(await importObjectPromise);
  return instantiatedApp.instantiatedModule;
}

// DEPRECATED: Please use `compile` or `compileStreaming` to get a compiled app,
// use `instantiate` method to get an instantiated app and then call
// `invokeMain` to invoke the main function.
export const invoke = (moduleInstance, ...args) => {
  moduleInstance.exports.$invokeMain(args);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arugments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arugments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: Function.prototype.call.bind(DataView.prototype.getInt32),
      AC: Function.prototype.call.bind(DataView.prototype.setInt16),
      AD: x0 => x0.nonce,
      AE: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      AF: x0 => x0.timeStamp,
      AG: x0 => x0.pathname,
      AH: l => new DataView(new ArrayBuffer(l)),
      AI: (x0,x1) => { x0.method = x1 },
      AJ: (x0,x1) => x0.get(x1),
      AK: x0 => x0.duration,
      AL: (x0,x1) => { x0.scaledSize = x1 },
      AM: x0 => x0.getHeading(),
      AN: x0 => x0.convertToBlob(),
      AO: (x0,x1,x2) => x0.setRequestHeader(x1,x2),
      B: () => new Error().stack,
      BB: Function.prototype.call.bind(DataView.prototype.getUint16),
      BC: Function.prototype.call.bind(DataView.prototype.setUint16),
      BD: () => globalThis.window.flutterConfiguration,
      BE: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      BF: x0 => x0.preventDefault(),
      BG: x0 => x0.hostElement,
      BH: o => o.byteLength,
      BI: (x0,x1) => { x0.noValidate = x1 },
      BJ: (module,f) => finalizeWrapper(f, function(x0,x1,x2) { return module.exports.Q(f,arguments.length,x0,x1,x2) }),
      BK: x0 => x0.image,
      BL: (x0,x1) => { x0.size = x1 },
      BM: x0 => x0.getCenter(),
      BN: (x0,x1) => x0.getContext(x1),
      BO: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.m(f,arguments.length,x0) }),
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: Function.prototype.call.bind(DataView.prototype.getInt16),
      CC: Function.prototype.call.bind(DataView.prototype.setUint8),
      CD: (x0,x1) => x0.attachShadow(x1),
      CE: (o, p, r) => o.replaceAll(p, () => r),
      CF: x0 => x0.parent,
      CG: x0 => x0.multiViewEnabled,
      CH: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      CI: (x0,x1) => x0.removeAttribute(x1),
      CJ: (x0,x1) => x0.forEach(x1),
      CK: () => globalThis.window.ImageDecoder,
      CL: (x0,x1) => new google.maps.Size(x0,x1),
      CM: x0 => x0.latLng,
      CN: x0 => x0.height,
      CO: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.n(f,arguments.length,x0) }),
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: Function.prototype.call.bind(DataView.prototype.getUint8),
      DC: Function.prototype.call.bind(DataView.prototype.setInt8),
      DD: (x0,x1) => x0.createElement(x1),
      DE: (x0,x1) => x0[x1],
      DF: (x0,x1) => x0.hasAttribute(x1),
      DG: (x0,x1) => x0.querySelector(x1),
      DH: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      DI: x0 => x0.isConnected,
      DJ: x0 => x0.name,
      DK: (x0,x1) => x0.getRandomValues(x1),
      DL: (x0,x1) => new google.maps.Point(x0,x1),
      DM: (x0,x1) => new google.maps.Map(x0,x1),
      DN: x0 => x0.width,
      DO: (x0,x1,x2) => ({enableHighAccuracy: x0,timeout: x1,maximumAge: x2}),
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: Function.prototype.call.bind(DataView.prototype.getInt8),
      EC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      ED: x0 => x0.scale,
      EE: x0 => x0.index,
      EF: x0 => x0.buttons,
      EG: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.O(f,arguments.length,x0) }),
      EH: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      EI: x0 => x0.click(),
      EJ: x0 => x0.statusText,
      EK: (x0,x1,x2,x3) => x0.encrypt(x1,x2,x3),
      EL: (x0,x1) => { x0.anchor = x1 },
      EM: (x0,x1) => { x0.tilt = x1 },
      EN: x0 => x0.rasterEndMilliseconds,
      EO: (x0,x1,x2,x3) => x0.getCurrentPosition(x1,x2,x3),
      F: Function.prototype.call.bind(Number.prototype.toString),
      FB: o => o.length,
      FC: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      FD: x0 => x0.visualViewport,
      FE: x0 => x0.pop(),
      FF: x0 => x0.ctrlKey,
      FG: x0 => x0.keyCode,
      FH: (a, s, e) => a.slice(s, e),
      FI: (x0,x1) => x0.getElementsByClassName(x1),
      FJ: x0 => x0.url,
      FK: (x0,x1,x2) => x0.setItem(x1,x2),
      FL: x0 => x0.height,
      FM: x0 => x0.rotateControl,
      FN: x0 => x0.rasterStartMilliseconds,
      FO: x0 => x0.message,
      G: Function.prototype.call.bind(String.prototype.indexOf),
      GB: (o, i) => o[i],
      GC: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      GD: x0 => x0.devicePixelRatio,
      GE: x0 => x0.flags,
      GF: x0 => x0.y,
      GG: x0 => x0.location,
      GH: (x0,x1) => x0.querySelector(x1),
      GI: (x0,x1) => x0.dispatchEvent(x1),
      GJ: x0 => x0.status,
      GK: x0 => x0.localStorage,
      GL: x0 => x0.width,
      GM: (x0,x1) => { x0.center = x1 },
      GN: x0 => x0.imageBitmaps,
      GO: x0 => x0.code,
      H: s => JSON.stringify(s),
      HB: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      HC: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      HD: x0 => x0.height,
      HE: s => s.trim(),
      HF: x0 => x0.x,
      HG: (x0,x1) => x0.getModifierState(x1),
      HH: (x0,x1) => x0.createElement(x1),
      HI: (x0,x1) => x0.createEvent(x1),
      HJ: x0 => x0.getReader(),
      HK: x0 => x0.sessionStorage,
      HL: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      HM: (x0,x1) => { x0.zoom = x1 },
      HN: (x0,x1) => x0.getContext(x1),
      HO: x0 => x0.speed,
      I: (s, p, i) => s.lastIndexOf(p, i),
      IB: (x0,x1) => x0.prepend(x1),
      IC: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      ID: x0 => x0.width,
      IE: (a, s) => a.join(s),
      IF: x0 => x0.scrollTop,
      IG: x0 => x0.metaKey,
      IH: (x0,x1) => x0.append(x1),
      II: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      IJ: x0 => x0.read(),
      IK: x0 => x0.subtle,
      IL: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.X(f,arguments.length,x0) }),
      IM: () => ({}),
      IN: (x0,x1,x2,x3,x4) => x0.clearRect(x1,x2,x3,x4),
      IO: x0 => x0.heading,
      J: o => o,
      JB: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      JC: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      JD: x0 => x0.screen,
      JE: (x0,x1) => x0.error(x1),
      JF: x0 => x0.offsetTop,
      JG: x0 => x0.altKey,
      JH: x0 => x0.body,
      JI: x0 => x0.readText(),
      JJ: x0 => x0.value,
      JK: (x0,x1) => x0.getItem(x1),
      JL: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      JM: (x0,x1) => { x0.mapId = x1 },
      JN: (x0,x1,x2,x3,x4,x5) => x0.drawImage(x1,x2,x3,x4,x5),
      JO: x0 => x0.accuracy,
      K: o => String(o),
      KB: b => !!b,
      KC: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      KD: x0 => x0.remove(),
      KE: () => globalThis.console,
      KF: x0 => x0.scrollLeft,
      KG: x0 => x0.ctrlKey,
      KH: (x0,x1) => { x0.id = x1 },
      KI: x0 => x0.clipboard,
      KJ: x0 => x0.done,
      KK: (x0,x1,x2,x3,x4,x5,x6,x7) => x0.unwrapKey(x1,x2,x3,x4,x5,x6,x7),
      KL: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.Y(f,arguments.length,x0) }),
      KM: (x0,x1) => { x0.styles = x1 },
      KN: x0 => x0.close(),
      KO: x0 => x0.altitudeAccuracy,
      L: o => o === undefined,
      LB: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.K(f,arguments.length,x0) }),
      LC: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      LD: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      LE: s => s.trimRight(),
      LF: x0 => x0.offsetLeft,
      LG: x0 => x0.isComposing,
      LH: () => globalThis.document,
      LI: (x0,x1) => x0.writeText(x1),
      LJ: x0 => x0.body,
      LK: (x0,x1,x2,x3,x4,x5) => x0.importKey(x1,x2,x3,x4,x5),
      LL: (x0,x1) => { x0.src = x1 },
      LM: (x0,x1) => { x0.streetViewControl = x1 },
      LN: (x0,x1,x2) => x0.toDataURL(x1,x2),
      LO: x0 => x0.altitude,
      M: (l, r) => l === r,
      MB: (x0,x1) => x0.focus(x1),
      MC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      MD: x0 => x0.tabIndex,
      ME: x0 => x0.visibilityState,
      MF: x0 => x0.offsetParent,
      MG: x0 => x0.code,
      MH: x0 => x0.permissions,
      MI: x0 => x0.unlock(),
      MJ: x0 => x0.cancel(),
      MK: (x0,x1,x2,x3) => x0.generateKey(x1,x2,x3),
      ML: (x0,x1) => { x0.url = x1 },
      MM: (x0,x1) => { x0.fullscreenControl = x1 },
      MN: (x0,x1) => { x0.height = x1 },
      MO: x0 => x0.timestamp,
      N: x0 => x0.random(),
      NB: () => ({}),
      NC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      ND: (x0,x1) => x0.contains(x1),
      NE: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      NF: x0 => x0.deltaMode,
      NG: x0 => x0.stopPropagation(),
      NH: x0 => x0.geolocation,
      NI: (x0,x1) => x0.lock(x1),
      NJ: x0 => x0.headers,
      NK: (x0,x1,x2,x3,x4) => x0.wrapKey(x1,x2,x3,x4),
      NL: (x0,x1) => { x0.draggable = x1 },
      NM: (x0,x1) => { x0.mapTypeControl = x1 },
      NN: (x0,x1) => { x0.width = x1 },
      NO: x0 => x0.longitude,
      O: o => o,
      OB: (o, p, v) => o[p] = v,
      OC: (x0,x1) => x0.querySelector(x1),
      OD: x0 => x0.activeElement,
      OE: x0 => x0.disconnect(),
      OF: x0 => x0.deltaY,
      OG: x0 => x0.repeat,
      OH: (o, a) => o + a,
      OI: x0 => x0.orientation,
      OJ: x0 => x0.signal,
      OK: (x0,x1,x2) => x0.exportKey(x1,x2),
      OL: (x0,x1) => { x0.opacity = x1 },
      OM: (x0,x1) => { x0.rotateControl = x1 },
      ON: x0 => x0.height,
      OO: x0 => x0.latitude,
      P: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      PB: () => [],
      PC: (x0,x1) => x0.item(x1),
      PD: x0 => x0.parentNode,
      PE: x0 => new Intl.Locale(x0),
      PF: x0 => x0.deltaX,
      PG: (x0,x1) => x0.requestAnimationFrame(x1),
      PH: x0 => x0.children,
      PI: (x0,x1) => { x0.title = x1 },
      PJ: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      PK: x0 => x0.crypto,
      PL: (x0,x1) => { x0.visible = x1 },
      PM: (x0,x1) => { x0.cameraControl = x1 },
      PN: x0 => x0.width,
      PO: x0 => x0.coords,
      Q: () => globalThis.Math,
      QB: (a, i) => a.push(i),
      QC: x0 => x0.length,
      QD: x0 => x0.tagName,
      QE: x0 => x0.region,
      QF: x0 => x0.wheelDeltaY,
      QG: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.P(f,arguments.length,x0) }),
      QH: x0 => x0.href,
      QI: (x0,x1) => x0.vibrate(x1),
      QJ: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      QK: x0 => x0.isSecureContext,
      QL: (x0,x1) => { x0.zIndex = x1 },
      QM: (x0,x1) => { x0.gestureHandling = x1 },
      QN: (x0,x1) => x0.createImageBitmap(x1),
      QO: (x0,x1) => x0.query(x1),
      R: s => printToConsole(s),
      RB: x0 => new Int8Array(x0),
      RC: (x0,x1) => x0.querySelectorAll(x1),
      RD: x0 => x0.target,
      RE: x0 => x0.script,
      RF: x0 => x0.wheelDeltaX,
      RG: x0 => x0.now(),
      RH: x0 => x0.location,
      RI: x0 => x0.arrayBuffer(),
      RJ: x0 => x0.naturalHeight,
      RK: x0 => ({type: x0}),
      RL: (x0,x1) => { x0.title = x1 },
      RM: (x0,x1) => { x0.zoomControl = x1 },
      RN: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.g(f,arguments.length,x0) }),
      RO: x0 => x0.state,
      S: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      SB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      SC: (x0,x1) => x0.getAttribute(x1),
      SD: x0 => x0.clientY,
      SE: x0 => x0.language,
      SF: x0 => x0.pressure,
      SG: x0 => x0.performance,
      SH: x0 => x0.parentElement,
      SI: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      SJ: x0 => x0.naturalWidth,
      SK: (x0,x1) => new Blob(x0,x1),
      SL: (x0,x1) => { x0.position = x1 },
      SM: (x0,x1) => { x0.maxZoom = x1 },
      SN: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.h(f,arguments.length,x0) }),
      SO: (x0,x1,x2) => x0.insertBefore(x1,x2),
      T: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      TB: x0 => new Uint8Array(x0),
      TC: (x0,x1) => x0.appendChild(x1),
      TD: x0 => x0.clientX,
      TE: x0 => x0.languages,
      TF: x0 => x0.tiltY,
      TG: x0 => x0.fontFallbackBaseUrl,
      TH: (x0,x1) => x0.querySelectorAll(x1),
      TI: (x0,x1,x2) => x0.slice(x1,x2),
      TJ: (x0,x1) => x0.createElement(x1),
      TK: x0 => globalThis.URL.createObjectURL(x0),
      TL: (x0,x1) => { x0.onclick = x1 },
      TM: (x0,x1) => { x0.minZoom = x1 },
      TN: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.i(f,arguments.length,x0) }),
      TO: x0 => x0.id,
      U: (x0,x1) => x0.didCreateEngineInitializer(x1),
      UB: x0 => new Uint8ClampedArray(x0),
      UC: (x0,x1) => x0.append(x1),
      UD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      UE: (x0,x1) => x0.observe(x1),
      UF: x0 => x0.tiltX,
      UG: x0 => new Uint8Array(x0),
      UH: x0 => x0.maxHeight,
      UI: (x0,x1) => x0.decode(x1),
      UJ: (x0,x1) => { x0.pointerEvents = x1 },
      UK: (x0,x1) => x0.getElementById(x1),
      UL: x0 => x0.content,
      UM: (x0,x1) => { x0.mapTypeId = x1 },
      UN: (x0,x1) => x0.removeChild(x1),
      UO: x0 => x0.offsetHeight,
      V: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.C(f,arguments.length,x0) }),
      VB: x0 => new Int16Array(x0),
      VC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      VD: x0 => x0.getBoundingClientRect(),
      VE: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports.L(f,arguments.length,x0,x1) }),
      VF: x0 => x0.pointerType,
      VG: (x0,x1,x2) => x0.set(x1,x2),
      VH: x0 => x0.maxWidth,
      VI: (x0,x1) => x0.adoptText(x1),
      VJ: (x0,x1) => { x0.height = x1 },
      VK: (x0,x1,x2) => x0.setAttribute(x1,x2),
      VL: (x0,x1) => x0.appendChild(x1),
      VM: () => globalThis.google.maps.MapTypeId.ROADMAP,
      VN: x0 => x0.firstChild,
      VO: x0 => x0.offsetWidth,
      W: (module,f) => finalizeWrapper(f, function() { return module.exports.D(f,arguments.length) }),
      WB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      WC: x0 => x0.style,
      WD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      WE: x0 => new ResizeObserver(x0),
      WF: x0 => x0.pointerId,
      WG: x0 => x0.length,
      WH: x0 => x0.minHeight,
      WI: x0 => x0.first(),
      WJ: (x0,x1) => { x0.width = x1 },
      WK: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.R(f,arguments.length,x0) }),
      WL: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.Z(f,arguments.length,x0) }),
      WM: () => globalThis.google.maps.MapTypeId.HYBRID,
      WN: (x0,x1) => { x0.display = x1 },
      WO: (x0,x1) => { x0.disabled = x1 },
      X: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      XB: x0 => new Uint16Array(x0),
      XC: x0 => x0.debugShowSemanticsNodes,
      XD: x0 => x0.bottom,
      XE: x0 => x0.computedStyleMap(),
      XF: x0 => x0.getCoalescedEvents(),
      XG: x0 => x0.buffer,
      XH: x0 => x0.minWidth,
      XI: x0 => x0.next(),
      XJ: x0 => x0.style,
      XK: (x0,x1,x2) => x0.addEventListener(x1,x2),
      XL: x0 => ({createHTML: x0}),
      XM: () => globalThis.google.maps.MapTypeId.TERRAIN,
      XN: (x0,x1) => { x0.accept = x1 },
      XO: x0 => x0.disabled,
      Y: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports.E(f,arguments.length,x0,x1) }),
      YB: x0 => new Int32Array(x0),
      YC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      YD: x0 => x0.top,
      YE: (x0,x1) => x0.get(x1),
      YF: x0 => x0.blur(),
      YG: x0 => x0.wasmMemory,
      YH: (x0,x1) => x0.removeProperty(x1),
      YI: x0 => x0.current(),
      YJ: (x0,x1) => { x0.src = x1 },
      YK: x0 => x0.remove(),
      YL: (x0,x1,x2) => x0.createPolicy(x1,x2),
      YM: () => globalThis.google.maps.MapTypeId.SATELLITE,
      YN: (x0,x1) => { x0.multiple = x1 },
      YO: (x0,x1) => { x0.min = x1 },
      Z: x0 => new Promise(x0),
      ZB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      ZC: (x0,x1) => x0.warn(x1),
      ZD: x0 => x0.right,
      ZE: (x0,x1) => x0.getPropertyValue(x1),
      ZF: x0 => x0.button,
      ZG: () => globalThis.window._flutter_skwasmInstance,
      ZH: (x0,x1) => x0.add(x1),
      ZI: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      ZJ: () => globalThis.document,
      ZK: x0 => x0.click(),
      ZL: (x0,x1) => x0.createHTML(x1),
      ZM: (x0,x1) => { x0.height = x1 },
      ZN: (x0,x1) => { x0.draggable = x1 },
      ZO: (x0,x1) => { x0.max = x1 },
      a: (x0,x1,x2) => x0.call(x1,x2),
      aB: x0 => new Uint32Array(x0),
      aC: x0 => x0.console,
      aD: x0 => x0.left,
      aE: x0 => globalThis.parseFloat(x0),
      aF: x0 => x0.innerHeight,
      aG: x0 => x0.getReader(),
      aH: x0 => x0.data,
      aI: x0 => x0.v8BreakIterator,
      aJ: x0 => x0.src,
      aK: (x0,x1) => { x0.target = x1 },
      aL: () => ({}),
      aM: (x0,x1) => { x0.width = x1 },
      aN: (x0,x1) => { x0.type = x1 },
      aO: (x0,x1) => { x0.scrollLeft = x1 },
      b: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      bB: x0 => new Float32Array(x0),
      bC: () => globalThis.window,
      bD: x0 => x0.clientY,
      bE: (x0,x1) => x0.getComputedStyle(x1),
      bF: x0 => x0.innerWidth,
      bG: x0 => x0.value,
      bH: (x0,x1) => { x0.scrollTop = x1 },
      bI: () => globalThis.Intl,
      bJ: (x0,x1) => x0.revokeObjectURL(x1),
      bK: (x0,x1) => { x0.href = x1 },
      bL: (x0,x1) => { x0.zIndex = x1 },
      bM: x0 => x0.style,
      bN: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.j(f,arguments.length,x0) }),
      bO: (x0,x1) => { x0.spellcheck = x1 },
      c: x0 => new Array(x0),
      cB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      cC: (o, c) => o instanceof c,
      cD: x0 => x0.clientX,
      cE: (o, p) => p in o,
      cF: x0 => x0.height,
      cG: x0 => x0.done,
      cH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      cI: (x0,x1) => x0.segment(x1),
      cJ: (x0,x1) => { x0.src = x1 },
      cK: (x0,x1) => { x0.innerHTML = x1 },
      cL: (x0,x1) => { x0.content = x1 },
      cM: (x0,x1) => x0.setVisible(x1),
      cN: x0 => x0.result,
      cO: (x0,x1) => { x0.disabled = x1 },
      d: o => [o],
      dB: x0 => new Float64Array(x0),
      dC: (x0,x1) => x0.exec(x1),
      dD: x0 => x0.changedTouches,
      dE: (x0,x1) => { x0.textContent = x1 },
      dF: x0 => x0.width,
      dG: x0 => x0.read(),
      dH: (x0,x1) => { x0.value = x1 },
      dI: x0 => x0.index,
      dJ: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      dK: x0 => x0.document,
      dL: (x0,x1) => { x0.innerHTML = x1 },
      dM: (x0,x1) => x0.setContent(x1),
      dN: x0 => x0.length,
      dO: x0 => x0.baseURI,
      e: (o0, o1) => [o0, o1],
      eB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      eC: x0 => x0.length,
      eD: x0 => x0.offsetY,
      eE: x0 => x0.documentElement,
      eF: x0 => x0.clientHeight,
      eG: x0 => x0.body,
      eH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      eI: x0 => x0.next(),
      eJ: x0 => x0.naturalHeight,
      eK: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      eL: (x0,x1) => { x0.innerHTML = x1 },
      eM: (x0,x1) => x0.setOptions(x1),
      eN: x0 => x0.size,
      eO: (x0,x1) => x0.getContext(x1),
      f: (o0, o1, o2) => [o0, o1, o2],
      fB: x0 => new ArrayBuffer(x0),
      fC: (x0,x1) => { x0.lastIndex = x1 },
      fD: x0 => x0.offsetX,
      fE: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.M(f,arguments.length,x0) }),
      fF: x0 => x0.clientWidth,
      fG: x0 => x0.status,
      fH: (x0,x1) => { x0.value = x1 },
      fI: x0 => x0.value,
      fJ: x0 => x0.naturalWidth,
      fK: (x0,x1) => x0.removeAt(x1),
      fL: x0 => x0.trustedTypes,
      fM: (x0,x1) => x0.clearMarkers(x1),
      fN: x0 => x0.name,
      fO: (x0,x1) => { x0.height = x1 },
      g: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      gB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      gC: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      gD: x0 => x0.type,
      gE: x0 => x0.matches,
      gF: (x0,x1) => { x0.content = x1 },
      gG: x0 => x0.content,
      gH: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      gI: x0 => x0.done,
      gJ: x0 => x0.decode(),
      gK: x0 => x0.overlayMapTypes,
      gL: x0 => x0.trustedTypes,
      gM: x0 => x0.onRemove(),
      gN: x0 => x0.type,
      gO: (x0,x1) => { x0.width = x1 },
      h: (x0,x1,x2) => { x0[x1] = x2 },
      hB: (x0,x1,x2) => new DataView(x0,x1,x2),
      hC: o => o instanceof RegExp,
      hD: (handle) => clearTimeout(handle),
      hE: (x0,x1) => x0.matchMedia(x1),
      hF: (x0,x1) => { x0.name = x1 },
      hG: x0 => x0.document,
      hH: x0 => x0.value,
      hI: (o, m, a) => o[m].apply(o, a),
      hJ: (x0,x1) => { x0.decoding = x1 },
      hK: () => ({}),
      hL: (x0,x1) => { x0.innerText = x1 },
      hM: (x0,x1) => x0.setOptions(x1),
      hN: (x0,x1) => x0.item(x1),
      hO: x0 => x0.canvasKitMaximumSurfaces,
      i: (o, p) => o[p],
      iB: (o, p) => o[p],
      iC: (string, times) => string.repeat(times),
      iD: (x0,x1) => x0.closest(x1),
      iE: x0 => x0.matches,
      iF: x0 => x0.head,
      iG: (x0,x1) => x0.fetch(x1),
      iH: x0 => x0.selectionDirection,
      iI: x0 => x0.iterator,
      iJ: (x0,x1) => { x0.crossOrigin = x1 },
      iK: x0 => new google.maps.InfoWindow(x0),
      iL: (x0,x1) => { x0.className = x1 },
      iM: (x0,x1) => x0.panTo(x1),
      iN: () => new FileReader(),
      iO: x0 => x0.nextSibling,
      j: () => globalThis,
      jB: (b, o) => new DataView(b, o),
      jC: x0 => x0.dotAll,
      jD: x0 => x0.maxTouchPoints,
      jE: x0 => x0.language,
      jF: (x0,x1) => x0.removeChild(x1),
      jG: x0 => x0.assetBase,
      jH: x0 => x0.selectionStart,
      jI: () => globalThis.Symbol,
      jJ: (x0,x1) => x0.createObjectURL(x1),
      jK: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.S(f,arguments.length,x0) }),
      jL: x0 => x0.lng(),
      jM: (x0,x1) => new google.maps.LatLngBounds(x0,x1),
      jN: (x0,x1) => x0.readAsArrayBuffer(x1),
      jO: (x0,x1) => x0.debug(x1),
      k: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.F(f,arguments.length,x0) }),
      kB: (b, o, l) => new DataView(b, o, l),
      kC: x0 => x0.unicode,
      kD: x0 => x0.platform,
      kE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      kF: x0 => x0.firstChild,
      kG: (x0,x1) => new OffscreenCanvas(x0,x1),
      kH: x0 => x0.selectionEnd,
      kI: (x0,x1) => new Intl.Segmenter(x0,x1),
      kJ: x0 => x0.URL,
      kK: x0 => new google.maps.Marker(x0),
      kL: x0 => x0.lat(),
      kM: (x0,x1,x2) => x0.fitBounds(x1,x2),
      kN: x0 => x0.files,
      l: x0 => ({runApp: x0}),
      lB: o => o.buffer,
      lC: x0 => x0.ignoreCase,
      lD: s => new Date(s * 1000).getTimezoneOffset() * 60,
      lE: () => globalThis.window.FinalizationRegistry,
      lF: x0 => x0.viewConstraints,
      lG: (map, o, v) => map.set(o, v),
      lH: x0 => x0.value,
      lI: x0 => x0.Segmenter,
      lJ: x0 => new Blob(x0),
      lK: (x0,x1,x2) => x0.set(x1,x2),
      lL: (x0,x1,x2) => x0.open(x1,x2),
      lM: (x0,x1,x2) => x0.panBy(x1,x2),
      lN: (x0,x1) => x0.key(x1),
      m: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.G(f,arguments.length,x0) }),
      mB: o => o.byteOffset,
      mC: x0 => x0.multiline,
      mD: Date.now,
      mE: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.N(f,arguments.length,x0) }),
      mF: x0 => x0.hostElement,
      mG: () => new WeakMap(),
      mH: x0 => x0.selectionDirection,
      mI: () => new TextDecoder(),
      mJ: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      mK: x0 => x0.remove(),
      mL: x0 => x0.getMap(),
      mM: (x0,x1,x2) => x0.fromPointToLatLng(x1,x2),
      mN: (x0,x1) => x0.removeItem(x1),
      n: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.H(f,arguments.length,x0) }),
      nB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      nC: (string, token) => string.split(token),
      nD: x0 => x0.body,
      nE: x0 => new window.FinalizationRegistry(x0),
      nF: x0 => x0.loader,
      nG: (map, o) => map.get(o),
      nH: x0 => x0.selectionStart,
      nI: (a, i) => a.splice(i, 1),
      nJ: x0 => new window.ImageDecoder(x0),
      nK: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.T(f,arguments.length,x0) }),
      nL: x0 => x0.close(),
      nM: x0 => x0.y,
      nN: x0 => x0.length,
      o: (x0,x1) => ({addView: x0,removeView: x1}),
      oB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      oC: o => o instanceof Array,
      oD: () => globalThis.document,
      oE: (x0,x1) => x0.unregister(x1),
      oF: () => globalThis._flutter,
      oG: x0 => x0.userAgent,
      oH: x0 => x0.selectionEnd,
      oI: a => a.pop(),
      oJ: x0 => x0.name,
      oK: (x0,x1,x2) => globalThis.google.maps.event.addListener(x0,x1,x2),
      oL: x0 => x0.onAdd(),
      oM: x0 => x0.x,
      oN: x0 => x0.onLine,
      p: o => o,
      pB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      pC: (a, i) => a[i],
      pD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      pE: (x0,x1) => x0.contains(x1),
      pF: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      pG: x0 => x0.navigator,
      pH: (x0,x1) => x0.scrollIntoView(x1),
      pI: (handle) => clearInterval(handle),
      pJ: x0 => x0.repetitionCount,
      pK: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.U(f,arguments.length,x0) }),
      pL: x0 => new markerClusterer.MarkerClusterer(x0),
      pM: (x0,x1,x2) => x0.fromLatLngToPoint(x1,x2),
      pN: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      q: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      qB: (t, s) => t.set(s),
      qC: a => a.length,
      qD: x0 => x0.hasFocus(),
      qE: () => ({}),
      qF: x0 => x0.history,
      qG: () => globalThis.window,
      qH: (x0,x1) => x0.replaceWith(x1),
      qI: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      qJ: x0 => x0.frameCount,
      qK: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.V(f,arguments.length,x0) }),
      qL: () => new Array(),
      qM: (x0,x1) => x0.fromLatLngToPoint(x1),
      qN: x0 => x0.decode(),
      r: f => f.dartFunction,
      rB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      rC: (x0,x1) => x0.test(x1),
      rD: x0 => x0.relatedTarget,
      rE: (x0,x1) => { x0.stylers = x1 },
      rF: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      rG: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      rH: (x0,x1) => { x0.type = x1 },
      rI: () => Date.now(),
      rJ: x0 => x0.selectedTrack,
      rK: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.W(f,arguments.length,x0) }),
      rL: (module,f) => finalizeWrapper(f, function(x0,x1,x2) { return module.exports.a(f,arguments.length,x0,x1,x2) }),
      rM: x0 => x0.getSouthWest(),
      rN: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      s: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.I(f,arguments.length,x0) }),
      sB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      sC: x0 => x0.userAgent,
      sD: x0 => x0.shiftKey,
      sE: (x0,x1) => { x0.featureType = x1 },
      sF: o => Object.keys(o),
      sG: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      sH: (x0,x1) => { x0.className = x1 },
      sI: x0 => x0.debugSkipFontRetryDelay,
      sJ: x0 => x0.completed,
      sK: (x0,x1) => new google.maps.LatLng(x0,x1),
      sL: (x0,x1,x2) => ({map: x0,markers: x1,onClusterClick: x2}),
      sM: x0 => x0.getNorthEast(),
      sN: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.k(f,arguments.length,x0) }),
      t: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports.J(f,arguments.length,x0,x1) }),
      tB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      tC: x0 => x0.navigator,
      tD: s => s.trimLeft(),
      tE: (x0,x1) => { x0.elementType = x1 },
      tF: x0 => x0.state,
      tG: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      tH: (x0,x1) => { x0.tabIndex = x1 },
      tI: x0 => new WeakRef(x0),
      tJ: x0 => x0.ready,
      tK: (x0,x1) => x0.setPosition(x1),
      tL: (module,f) => finalizeWrapper(f, function() { return module.exports.b(f,arguments.length) }),
      tM: x0 => x0.getProjection(),
      tN: (x0,x1,x2) => x0.addEventListener(x1,x2),
      u: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      uB: o => o instanceof Uint16Array,
      uC: Function.prototype.call.bind(String.prototype.toLowerCase),
      uD: (a, i, v) => a[i] = v,
      uE: (x0,x1,x2,x3,x4,x5,x6,x7) => ({hue: x0,lightness: x1,saturation: x2,gamma: x3,invert_lightness: x4,visibility: x5,color: x6,weight: x7}),
      uF: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      uG: (d, digits) => d.toFixed(digits),
      uH: (x0,x1) => { x0.name = x1 },
      uI: x0 => x0.deref(),
      uJ: x0 => x0.tracks,
      uK: x0 => x0.latLng,
      uL: (module,f) => finalizeWrapper(f, function() { return module.exports.c(f,arguments.length) }),
      uM: x0 => x0.getBounds(),
      uN: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.l(f,arguments.length,x0) }),
      v: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      vB: o => o instanceof Int16Array,
      vC: Object.is,
      vD: (decoder, codeUnits) => decoder.decode(codeUnits),
      vE: (s) => +s,
      vF: (x0,x1) => x0.go(x1),
      vG: () => Date.now(),
      vH: (x0,x1) => { x0.placeholder = x1 },
      vI: () => globalThis.WeakRef,
      vJ: x0 => x0.close(),
      vK: (x0,x1) => x0.setMap(x1),
      vL: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.d(f,arguments.length,x0) }),
      vM: (x0,x1) => x0.setTilt(x1),
      vN: x0 => x0.send(),
      w: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      wB: o => o instanceof Uint8ClampedArray,
      wC: x0 => x0.vendor,
      wD: () => new TextDecoder("utf-8", {fatal: true}),
      wE: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      wF: x0 => x0.state,
      wG: () => typeof dartUseDateNowForTicks !== "undefined",
      wH: (x0,x1) => { x0.autocomplete = x1 },
      wI: x0 => x0.abort(),
      wJ: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      wK: () => ({}),
      wL: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.e(f,arguments.length,x0) }),
      wM: (x0,x1) => x0.setZoom(x1),
      wN: x0 => x0.status,
      x: Function.prototype.call.bind(DataView.prototype.getFloat64),
      xB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      xC: (x0,x1) => x0.createTextNode(x1),
      xD: () => new TextDecoder("utf-8", {fatal: false}),
      xE: x0 => x0.classList,
      xF: x0 => x0.hash,
      xG: () => 1000 * performance.now(),
      xH: (x0,x1) => { x0.name = x1 },
      xI: () => new AbortController(),
      xJ: (x0,x1) => x0.decode(x1),
      xK: (x0,x1) => { x0.icon = x1 },
      xL: (module,f) => finalizeWrapper(f, function() { return module.exports.f(f,arguments.length) }),
      xM: (x0,x1) => x0.setHeading(x1),
      xN: x0 => x0.response,
      y: Function.prototype.call.bind(DataView.prototype.getFloat32),
      yB: Function.prototype.call.bind(DataView.prototype.setInt32),
      yC: (x0,x1) => { x0.id = x1 },
      yD: s => s.toUpperCase(),
      yE: x0 => x0.key,
      yF: x0 => x0.location,
      yG: (x0,x1) => x0.getRandomValues(x1),
      yH: (x0,x1) => { x0.placeholder = x1 },
      yI: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      yJ: x0 => x0.displayHeight,
      yK: () => ({}),
      yL: x0 => x0.getZoom(),
      yM: (x0,x1) => x0.transferFromImageBitmap(x1),
      yN: (x0,x1) => { x0.responseType = x1 },
      z: Function.prototype.call.bind(DataView.prototype.getUint32),
      zB: Function.prototype.call.bind(DataView.prototype.setUint32),
      zC: (x0,x1) => { x0.nonce = x1 },
      zD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      zE: (x0,x1) => x0.getModifierState(x1),
      zF: x0 => x0.search,
      zG: () => globalThis.crypto,
      zH: (x0,x1) => { x0.action = x1 },
      zI: (x0,x1) => globalThis.fetch(x0,x1),
      zJ: x0 => x0.displayWidth,
      zK: x0 => new Blob(x0),
      zL: x0 => x0.getTilt(),
      zM: x0 => x0.arrayBuffer(),
      zN: () => new XMLHttpRequest(),

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });
    dartInstance.exports.B(dartInstance);

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
