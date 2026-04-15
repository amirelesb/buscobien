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
  //   compiler when the `load-ids` option is passed. Each load ID maps to one
  //   or more wasm files as specified in the emitted JSON file. It also takes a
  //   callback that should be invoked for each loaded module with 2 arugments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDynamicModule` is a JS function that takes two string names matching,
  //   in order, a wasm file produced by the dart2wasm compiler during dynamic
  //   module compilation and a corresponding js file produced by the same
  //   compilation. It also takes a callback that should be invoked with the
  //   loaded module in a format supported by `WebAssembly.compile` or
  //   `WebAssembly.compileStreaming` and the result of using the JS 'import'
  //   API on the js file path. It should return a Promise that resolves when
  //   all the modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports,
      {loadDeferredModules, loadDynamicModule, loadDeferredId} = {}) {
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
            _1: (decoder, codeUnits) => decoder.decode(codeUnits),
      _2: () => new TextDecoder("utf-8", {fatal: true}),
      _3: () => new TextDecoder("utf-8", {fatal: false}),
      _4: (s) => +s,
      _5: x0 => new Uint8Array(x0),
      _6: (x0,x1,x2) => x0.set(x1,x2),
      _7: (x0,x1) => x0.transferFromImageBitmap(x1),
      _8: x0 => x0.arrayBuffer(),
      _9: (x0,x1,x2) => x0.slice(x1,x2),
      _10: (x0,x1) => x0.decode(x1),
      _11: (x0,x1) => x0.segment(x1),
      _12: () => new TextDecoder(),
      _14: x0 => x0.buffer,
      _15: x0 => x0.wasmMemory,
      _16: () => globalThis.window._flutter_skwasmInstance,
      _17: x0 => x0.rasterStartMilliseconds,
      _18: x0 => x0.rasterEndMilliseconds,
      _19: x0 => x0.imageBitmaps,
      _135: (x0,x1) => x0.appendChild(x1),
      _166: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _167: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      _168: (x0,x1) => new OffscreenCanvas(x0,x1),
      _169: x0 => x0.remove(),
      _170: (x0,x1) => x0.append(x1),
      _172: x0 => x0.unlock(),
      _173: x0 => x0.getReader(),
      _174: (x0,x1) => x0.item(x1),
      _175: x0 => x0.next(),
      _176: x0 => x0.now(),
      _177: (x0,x1) => x0.revokeObjectURL(x1),
      _178: x0 => x0.close(),
      _179: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      _180: x0 => new window.ImageDecoder(x0),
      _181: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      _182: (x0,x1) => x0.decode(x1),
      _183: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._183(f,arguments.length,x0) }),
      _184: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _186: (x0,x1) => x0.getModifierState(x1),
      _187: x0 => x0.preventDefault(),
      _188: x0 => x0.stopPropagation(),
      _189: (x0,x1) => x0.removeProperty(x1),
      _190: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._190(f,arguments.length,x0) }),
      _191: x0 => new window.FinalizationRegistry(x0),
      _192: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      _194: (x0,x1) => x0.unregister(x1),
      _195: (x0,x1) => x0.prepend(x1),
      _196: x0 => new Intl.Locale(x0),
      _197: (x0,x1) => x0.observe(x1),
      _198: x0 => x0.disconnect(),
      _199: (x0,x1) => x0.getAttribute(x1),
      _200: (x0,x1) => x0.contains(x1),
      _201: (x0,x1) => x0.querySelector(x1),
      _202: (x0,x1) => x0.matchMedia(x1),
      _203: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._203(f,arguments.length,x0) }),
      _204: (x0,x1,x2) => x0.call(x1,x2),
      _205: x0 => x0.blur(),
      _206: x0 => x0.hasFocus(),
      _207: (x0,x1) => x0.removeAttribute(x1),
      _208: (x0,x1,x2) => x0.insertBefore(x1,x2),
      _209: (x0,x1) => x0.hasAttribute(x1),
      _210: (x0,x1) => x0.getModifierState(x1),
      _211: (x0,x1) => x0.createTextNode(x1),
      _212: x0 => x0.getBoundingClientRect(),
      _213: (x0,x1) => x0.replaceWith(x1),
      _214: (x0,x1) => x0.contains(x1),
      _215: (x0,x1) => x0.closest(x1),
      _216: () => new Array(),
      _653: x0 => new Uint8Array(x0),
      _656: () => globalThis.window.flutterConfiguration,
      _658: x0 => x0.assetBase,
      _663: x0 => x0.canvasKitMaximumSurfaces,
      _664: x0 => x0.debugShowSemanticsNodes,
      _665: x0 => x0.hostElement,
      _666: x0 => x0.multiViewEnabled,
      _667: x0 => x0.nonce,
      _669: x0 => x0.fontFallbackBaseUrl,
      _679: x0 => x0.console,
      _680: x0 => x0.devicePixelRatio,
      _681: x0 => x0.document,
      _682: x0 => x0.history,
      _683: x0 => x0.innerHeight,
      _684: x0 => x0.innerWidth,
      _685: x0 => x0.location,
      _686: x0 => x0.navigator,
      _687: x0 => x0.visualViewport,
      _688: x0 => x0.performance,
      _689: x0 => x0.parent,
      _691: x0 => x0.URL,
      _693: (x0,x1) => x0.getComputedStyle(x1),
      _694: x0 => x0.screen,
      _695: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._695(f,arguments.length,x0) }),
      _696: (x0,x1) => x0.requestAnimationFrame(x1),
      _700: (x0,x1) => x0.warn(x1),
      _702: (x0,x1) => x0.debug(x1),
      _703: x0 => globalThis.parseFloat(x0),
      _704: () => globalThis.window,
      _705: () => globalThis.Intl,
      _706: () => globalThis.Symbol,
      _707: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      _709: x0 => x0.clipboard,
      _710: x0 => x0.maxTouchPoints,
      _711: x0 => x0.vendor,
      _712: x0 => x0.language,
      _713: x0 => x0.platform,
      _714: x0 => x0.userAgent,
      _715: (x0,x1) => x0.vibrate(x1),
      _716: x0 => x0.languages,
      _717: x0 => x0.documentElement,
      _718: (x0,x1) => x0.querySelector(x1),
      _719: (x0,x1) => x0.querySelectorAll(x1),
      _721: (x0,x1) => x0.createElement(x1),
      _724: (x0,x1) => x0.createEvent(x1),
      _725: x0 => x0.activeElement,
      _728: x0 => x0.head,
      _729: x0 => x0.body,
      _731: (x0,x1) => { x0.title = x1 },
      _734: x0 => x0.visibilityState,
      _735: () => globalThis.document,
      _736: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._736(f,arguments.length,x0) }),
      _737: (x0,x1) => x0.dispatchEvent(x1),
      _745: x0 => x0.target,
      _747: x0 => x0.timeStamp,
      _748: x0 => x0.type,
      _750: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      _756: x0 => x0.baseURI,
      _757: x0 => x0.firstChild,
      _761: x0 => x0.parentElement,
      _763: (x0,x1) => { x0.textContent = x1 },
      _764: x0 => x0.parentNode,
      _765: x0 => x0.nextSibling,
      _766: (x0,x1) => x0.removeChild(x1),
      _767: x0 => x0.isConnected,
      _775: x0 => x0.clientHeight,
      _776: x0 => x0.clientWidth,
      _777: x0 => x0.offsetHeight,
      _778: x0 => x0.offsetWidth,
      _779: x0 => x0.id,
      _780: (x0,x1) => { x0.id = x1 },
      _783: (x0,x1) => { x0.spellcheck = x1 },
      _784: x0 => x0.tagName,
      _785: x0 => x0.style,
      _787: (x0,x1) => x0.querySelectorAll(x1),
      _788: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _789: x0 => x0.tabIndex,
      _790: (x0,x1) => { x0.tabIndex = x1 },
      _791: (x0,x1) => x0.focus(x1),
      _792: x0 => x0.scrollTop,
      _793: (x0,x1) => { x0.scrollTop = x1 },
      _794: (x0,x1) => { x0.scrollLeft = x1 },
      _795: x0 => x0.scrollLeft,
      _796: x0 => x0.classList,
      _797: (x0,x1) => x0.scrollIntoView(x1),
      _800: (x0,x1) => { x0.className = x1 },
      _802: (x0,x1) => x0.getElementsByClassName(x1),
      _803: x0 => x0.click(),
      _804: (x0,x1) => x0.attachShadow(x1),
      _807: x0 => x0.computedStyleMap(),
      _808: (x0,x1) => x0.get(x1),
      _814: (x0,x1) => x0.getPropertyValue(x1),
      _815: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      _816: x0 => x0.offsetLeft,
      _817: x0 => x0.offsetTop,
      _818: x0 => x0.offsetParent,
      _820: (x0,x1) => { x0.name = x1 },
      _821: x0 => x0.content,
      _822: (x0,x1) => { x0.content = x1 },
      _826: (x0,x1) => { x0.src = x1 },
      _827: x0 => x0.naturalWidth,
      _828: x0 => x0.naturalHeight,
      _832: (x0,x1) => { x0.crossOrigin = x1 },
      _834: (x0,x1) => { x0.decoding = x1 },
      _835: x0 => x0.decode(),
      _840: (x0,x1) => { x0.nonce = x1 },
      _845: (x0,x1) => { x0.width = x1 },
      _847: (x0,x1) => { x0.height = x1 },
      _850: (x0,x1) => x0.getContext(x1),
      _918: x0 => x0.width,
      _919: x0 => x0.height,
      _921: (x0,x1) => x0.fetch(x1),
      _922: x0 => x0.status,
      _924: x0 => x0.body,
      _925: x0 => x0.arrayBuffer(),
      _928: x0 => x0.read(),
      _929: x0 => x0.value,
      _930: x0 => x0.done,
      _937: x0 => x0.name,
      _938: x0 => x0.x,
      _939: x0 => x0.y,
      _942: x0 => x0.top,
      _943: x0 => x0.right,
      _944: x0 => x0.bottom,
      _945: x0 => x0.left,
      _955: x0 => x0.height,
      _956: x0 => x0.width,
      _957: x0 => x0.scale,
      _958: (x0,x1) => { x0.value = x1 },
      _961: (x0,x1) => { x0.placeholder = x1 },
      _963: (x0,x1) => { x0.name = x1 },
      _964: x0 => x0.selectionDirection,
      _965: x0 => x0.selectionStart,
      _966: x0 => x0.selectionEnd,
      _969: x0 => x0.value,
      _971: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _972: x0 => x0.readText(),
      _973: (x0,x1) => x0.writeText(x1),
      _975: x0 => x0.altKey,
      _976: x0 => x0.code,
      _977: x0 => x0.ctrlKey,
      _978: x0 => x0.key,
      _979: x0 => x0.keyCode,
      _980: x0 => x0.location,
      _981: x0 => x0.metaKey,
      _982: x0 => x0.repeat,
      _983: x0 => x0.shiftKey,
      _984: x0 => x0.isComposing,
      _986: x0 => x0.state,
      _987: (x0,x1) => x0.go(x1),
      _989: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      _990: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      _991: x0 => x0.pathname,
      _992: x0 => x0.search,
      _993: x0 => x0.hash,
      _997: x0 => x0.state,
      _1000: (x0,x1) => x0.createObjectURL(x1),
      _1002: x0 => new Blob(x0),
      _1012: x0 => x0.matches,
      _1016: x0 => x0.matches,
      _1020: x0 => x0.relatedTarget,
      _1022: x0 => x0.clientX,
      _1023: x0 => x0.clientY,
      _1024: x0 => x0.offsetX,
      _1025: x0 => x0.offsetY,
      _1028: x0 => x0.button,
      _1029: x0 => x0.buttons,
      _1030: x0 => x0.ctrlKey,
      _1034: x0 => x0.pointerId,
      _1035: x0 => x0.pointerType,
      _1036: x0 => x0.pressure,
      _1037: x0 => x0.tiltX,
      _1038: x0 => x0.tiltY,
      _1039: x0 => x0.getCoalescedEvents(),
      _1042: x0 => x0.deltaX,
      _1043: x0 => x0.deltaY,
      _1044: x0 => x0.wheelDeltaX,
      _1045: x0 => x0.wheelDeltaY,
      _1046: x0 => x0.deltaMode,
      _1053: x0 => x0.changedTouches,
      _1056: x0 => x0.clientX,
      _1057: x0 => x0.clientY,
      _1060: x0 => x0.data,
      _1063: (x0,x1) => { x0.disabled = x1 },
      _1065: (x0,x1) => { x0.type = x1 },
      _1066: (x0,x1) => { x0.max = x1 },
      _1067: (x0,x1) => { x0.min = x1 },
      _1068: x0 => x0.value,
      _1069: (x0,x1) => { x0.value = x1 },
      _1070: x0 => x0.disabled,
      _1071: (x0,x1) => { x0.disabled = x1 },
      _1073: (x0,x1) => { x0.placeholder = x1 },
      _1075: (x0,x1) => { x0.name = x1 },
      _1076: (x0,x1) => { x0.autocomplete = x1 },
      _1078: x0 => x0.selectionDirection,
      _1079: x0 => x0.selectionStart,
      _1081: x0 => x0.selectionEnd,
      _1084: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _1085: (x0,x1) => x0.add(x1),
      _1087: (x0,x1) => { x0.noValidate = x1 },
      _1088: (x0,x1) => { x0.method = x1 },
      _1089: (x0,x1) => { x0.action = x1 },
      _1095: (x0,x1) => x0.getContext(x1),
      _1097: x0 => x0.convertToBlob(),
      _1114: x0 => x0.orientation,
      _1115: x0 => x0.width,
      _1116: x0 => x0.height,
      _1117: (x0,x1) => x0.lock(x1),
      _1136: x0 => new ResizeObserver(x0),
      _1139: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._1139(f,arguments.length,x0,x1) }),
      _1147: x0 => x0.length,
      _1148: x0 => x0.iterator,
      _1149: x0 => x0.Segmenter,
      _1150: x0 => x0.v8BreakIterator,
      _1151: (x0,x1) => new Intl.Segmenter(x0,x1),
      _1154: x0 => x0.language,
      _1155: x0 => x0.script,
      _1156: x0 => x0.region,
      _1174: x0 => x0.done,
      _1175: x0 => x0.value,
      _1176: x0 => x0.index,
      _1180: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      _1181: (x0,x1) => x0.adoptText(x1),
      _1182: x0 => x0.first(),
      _1183: x0 => x0.next(),
      _1184: x0 => x0.current(),
      _1186: () => globalThis.window.FinalizationRegistry,
      _1197: x0 => x0.hostElement,
      _1198: x0 => x0.viewConstraints,
      _1201: x0 => x0.maxHeight,
      _1202: x0 => x0.maxWidth,
      _1203: x0 => x0.minHeight,
      _1204: x0 => x0.minWidth,
      _1205: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1205(f,arguments.length,x0) }),
      _1206: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1206(f,arguments.length,x0) }),
      _1207: (x0,x1) => ({addView: x0,removeView: x1}),
      _1210: x0 => x0.loader,
      _1211: () => globalThis._flutter,
      _1212: (x0,x1) => x0.didCreateEngineInitializer(x1),
      _1213: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1213(f,arguments.length,x0) }),
      _1214: (module,f) => finalizeWrapper(f, function() { return module.exports._1214(f,arguments.length) }),
      _1215: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      _1218: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1218(f,arguments.length,x0) }),
      _1219: x0 => ({runApp: x0}),
      _1221: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._1221(f,arguments.length,x0,x1) }),
      _1222: x0 => new Promise(x0),
      _1223: x0 => x0.length,
      _1224: () => globalThis.window.ImageDecoder,
      _1225: x0 => x0.tracks,
      _1227: x0 => x0.completed,
      _1229: x0 => x0.image,
      _1235: x0 => x0.displayWidth,
      _1236: x0 => x0.displayHeight,
      _1237: x0 => x0.duration,
      _1240: x0 => x0.ready,
      _1241: x0 => x0.selectedTrack,
      _1242: x0 => x0.repetitionCount,
      _1243: x0 => x0.frameCount,
      _1297: (x0,x1) => x0.createElement(x1),
      _1303: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _1304: x0 => x0.onAdd(),
      _1305: (x0,x1) => x0.clearMarkers(x1),
      _1306: x0 => x0.onRemove(),
      _1310: (x0,x1) => new google.maps.Map(x0,x1),
      _1312: (x0,x1,x2) => x0.set(x1,x2),
      _1313: () => ({}),
      _1316: x0 => x0.close(),
      _1317: (x0,x1,x2) => x0.open(x1,x2),
      _1318: x0 => new google.maps.InfoWindow(x0),
      _1319: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1319(f,arguments.length,x0) }),
      _1320: x0 => new google.maps.Marker(x0),
      _1322: (x0,x1) => new google.maps.Size(x0,x1),
      _1323: (x0,x1) => x0.createElement(x1),
      _1324: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _1325: x0 => new Blob(x0),
      _1326: x0 => globalThis.URL.createObjectURL(x0),
      _1330: (x0,x1) => x0.removeAt(x1),
      _1334: () => ({}),
      _1337: (x0,x1) => new google.maps.LatLng(x0,x1),
      _1338: () => ({}),
      _1339: (x0,x1) => new google.maps.LatLngBounds(x0,x1),
      _1340: (x0,x1) => x0.appendChild(x1),
      _1341: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1341(f,arguments.length,x0) }),
      _1342: x0 => ({createHTML: x0}),
      _1343: (x0,x1,x2) => x0.createPolicy(x1,x2),
      _1344: (x0,x1) => x0.createHTML(x1),
      _1345: () => ({}),
      _1346: (x0,x1) => new google.maps.Point(x0,x1),
      _1347: () => ({}),
      _1348: () => ({}),
      _1354: (x0,x1) => x0.panTo(x1),
      _1355: (x0,x1,x2) => x0.fitBounds(x1,x2),
      _1356: (x0,x1,x2) => x0.panBy(x1,x2),
      _1358: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _1359: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      _1365: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _1366: (x0,x1) => x0.append(x1),
      _1367: x0 => ({type: x0}),
      _1368: (x0,x1) => new Blob(x0,x1),
      _1369: (x0,x1) => x0.getElementById(x1),
      _1370: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      _1371: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1371(f,arguments.length,x0) }),
      _1372: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _1373: x0 => x0.remove(),
      _1374: x0 => x0.click(),
      _1377: (x0,x1) => x0.getContext(x1),
      _1383: () => new FileReader(),
      _1384: (x0,x1) => x0.readAsArrayBuffer(x1),
      _1389: x0 => x0.decode(),
      _1390: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _1391: (x0,x1,x2) => x0.setRequestHeader(x1,x2),
      _1392: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1392(f,arguments.length,x0) }),
      _1393: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1393(f,arguments.length,x0) }),
      _1394: x0 => x0.send(),
      _1395: () => new XMLHttpRequest(),
      _1396: (x0,x1) => x0.query(x1),
      _1397: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1397(f,arguments.length,x0) }),
      _1398: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1398(f,arguments.length,x0) }),
      _1399: (x0,x1,x2) => ({enableHighAccuracy: x0,timeout: x1,maximumAge: x2}),
      _1400: (x0,x1,x2,x3) => x0.getCurrentPosition(x1,x2,x3),
      _1405: (x0,x1) => x0.getItem(x1),
      _1406: (x0,x1) => x0.removeItem(x1),
      _1407: (x0,x1,x2) => x0.setItem(x1,x2),
      _1408: (x0,x1,x2,x3,x4) => x0.clearRect(x1,x2,x3,x4),
      _1409: (x0,x1,x2,x3,x4,x5) => x0.drawImage(x1,x2,x3,x4,x5),
      _1410: x0 => x0.close(),
      _1411: (x0,x1) => x0.querySelector(x1),
      _1412: (x0,x1) => x0.item(x1),
      _1414: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1414(f,arguments.length,x0) }),
      _1415: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1415(f,arguments.length,x0) }),
      _1416: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1416(f,arguments.length,x0) }),
      _1417: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1417(f,arguments.length,x0) }),
      _1418: (x0,x1) => x0.removeChild(x1),
      _1420: (x0,x1) => x0.key(x1),
      _1432: Date.now,
      _1434: s => new Date(s * 1000).getTimezoneOffset() * 60,
      _1435: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      _1436: () => typeof dartUseDateNowForTicks !== "undefined",
      _1437: () => 1000 * performance.now(),
      _1438: () => Date.now(),
      _1439: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      _1440: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      _1441: () => new WeakMap(),
      _1442: (map, o) => map.get(o),
      _1443: (map, o, v) => map.set(o, v),
      _1444: x0 => new WeakRef(x0),
      _1445: x0 => x0.deref(),
      _1452: () => globalThis.WeakRef,
      _1456: s => JSON.stringify(s),
      _1457: s => printToConsole(s),
      _1458: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      _1459: (o, p, r) => o.replaceAll(p, () => r),
      _1461: Function.prototype.call.bind(String.prototype.toLowerCase),
      _1462: s => s.toUpperCase(),
      _1463: s => s.trim(),
      _1464: s => s.trimLeft(),
      _1465: s => s.trimRight(),
      _1466: (string, times) => string.repeat(times),
      _1467: Function.prototype.call.bind(String.prototype.indexOf),
      _1468: (s, p, i) => s.lastIndexOf(p, i),
      _1469: (string, token) => string.split(token),
      _1470: Object.is,
      _1474: (o, c) => o instanceof c,
      _1475: o => Object.keys(o),
      _1479: (o, a) => o + a,
      _1507: x0 => new Array(x0),
      _1509: x0 => x0.length,
      _1511: (x0,x1) => x0[x1],
      _1512: (x0,x1,x2) => { x0[x1] = x2 },
      _1515: (x0,x1,x2) => new DataView(x0,x1,x2),
      _1517: x0 => new Int8Array(x0),
      _1518: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      _1520: x0 => new Uint8ClampedArray(x0),
      _1522: x0 => new Int16Array(x0),
      _1524: x0 => new Uint16Array(x0),
      _1526: x0 => new Int32Array(x0),
      _1528: x0 => new Uint32Array(x0),
      _1530: x0 => new Float32Array(x0),
      _1532: x0 => new Float64Array(x0),
      _1556: x0 => x0.random(),
      _1557: (x0,x1) => x0.getRandomValues(x1),
      _1558: () => globalThis.crypto,
      _1559: () => globalThis.Math,
      _1572: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      _1573: (handle) => clearTimeout(handle),
      _1574: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      _1575: (handle) => clearInterval(handle),
      _1576: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      _1577: () => Date.now(),
      _1578: () => new Error().stack,
      _1579: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      _1580: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      _1581: (x0,x1) => x0.exec(x1),
      _1582: (x0,x1) => x0.test(x1),
      _1583: x0 => x0.pop(),
      _1585: o => o === undefined,
      _1587: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      _1589: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      _1590: o => o instanceof RegExp,
      _1591: (l, r) => l === r,
      _1592: o => o,
      _1593: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      _1594: o => o,
      _1595: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      _1596: o => o,
      _1597: b => !!b,
      _1598: o => o.length,
      _1600: (o, i) => o[i],
      _1601: f => f.dartFunction,
      _1602: () => ({}),
      _1603: () => [],
      _1605: () => globalThis,
      _1606: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      _1608: (o, p) => o[p],
      _1609: (o, p, v) => o[p] = v,
      _1610: (o, m, a) => o[m].apply(o, a),
      _1612: o => String(o),
      _1613: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      _1614: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1614(f,arguments.length,x0) }),
      _1615: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._1615(f,arguments.length,x0,x1) }),
      _1616: o => {
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
      _1617: o => [o],
      _1618: (o0, o1) => [o0, o1],
      _1619: (o0, o1, o2) => [o0, o1, o2],
      _1620: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      _1621: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      _1622: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1623: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1624: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1625: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1626: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1627: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1628: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1629: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1630: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1631: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1632: x0 => new ArrayBuffer(x0),
      _1633: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      _1635: x0 => x0.index,
      _1637: x0 => x0.flags,
      _1638: x0 => x0.multiline,
      _1639: x0 => x0.ignoreCase,
      _1640: x0 => x0.unicode,
      _1641: x0 => x0.dotAll,
      _1642: (x0,x1) => { x0.lastIndex = x1 },
      _1643: (o, p) => p in o,
      _1644: (o, p) => o[p],
      _1680: (x0,x1,x2) => globalThis.google.maps.event.addListener(x0,x1,x2),
      _1681: x0 => x0.remove(),
      _2053: x0 => x0.overlayMapTypes,
      _2055: x0 => x0.getBounds(),
      _2056: x0 => x0.getCenter(),
      _2060: x0 => x0.getHeading(),
      _2065: x0 => x0.getProjection(),
      _2068: x0 => x0.getTilt(),
      _2070: x0 => x0.getZoom(),
      _2075: (x0,x1) => x0.setHeading(x1),
      _2078: (x0,x1) => x0.setOptions(x1),
      _2081: (x0,x1) => x0.setTilt(x1),
      _2083: (x0,x1) => x0.setZoom(x1),
      _2084: (module,f) => finalizeWrapper(f, function() { return module.exports._2084(f,arguments.length) }),
      _2086: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2086(f,arguments.length,x0) }),
      _2093: (module,f) => finalizeWrapper(f, function() { return module.exports._2093(f,arguments.length) }),
      _2102: (module,f) => finalizeWrapper(f, function() { return module.exports._2102(f,arguments.length) }),
      _2105: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2105(f,arguments.length,x0) }),
      _2106: x0 => x0.latLng,
      _2152: x0 => x0.latLng,
      _2159: (x0,x1) => { x0.cameraControl = x1 },
      _2163: (x0,x1) => { x0.center = x1 },
      _2181: (x0,x1) => { x0.fullscreenControl = x1 },
      _2184: (x0,x1) => { x0.gestureHandling = x1 },
      _2197: (x0,x1) => { x0.mapId = x1 },
      _2199: (x0,x1) => { x0.mapTypeControl = x1 },
      _2203: (x0,x1) => { x0.mapTypeId = x1 },
      _2205: (x0,x1) => { x0.maxZoom = x1 },
      _2207: (x0,x1) => { x0.minZoom = x1 },
      _2218: x0 => x0.rotateControl,
      _2219: (x0,x1) => { x0.rotateControl = x1 },
      _2231: (x0,x1) => { x0.streetViewControl = x1 },
      _2234: (x0,x1) => { x0.styles = x1 },
      _2237: (x0,x1) => { x0.tilt = x1 },
      _2241: (x0,x1) => { x0.zoom = x1 },
      _2243: (x0,x1) => { x0.zoomControl = x1 },
      _2251: () => globalThis.google.maps.MapTypeId.HYBRID,
      _2252: () => globalThis.google.maps.MapTypeId.ROADMAP,
      _2253: () => globalThis.google.maps.MapTypeId.SATELLITE,
      _2254: () => globalThis.google.maps.MapTypeId.TERRAIN,
      _2259: (x0,x1) => { x0.stylers = x1 },
      _2261: (x0,x1) => { x0.elementType = x1 },
      _2263: (x0,x1) => { x0.featureType = x1 },
      _2356: (module,f) => finalizeWrapper(f, function(x0,x1,x2) { return module.exports._2356(f,arguments.length,x0,x1,x2) }),
      _2357: (x0,x1,x2) => ({map: x0,markers: x1,onClusterClick: x2}),
      _2368: x0 => new markerClusterer.MarkerClusterer(x0),
      _2962: x0 => x0.lat(),
      _2963: x0 => x0.lng(),
      _2991: x0 => x0.getNorthEast(),
      _2992: x0 => x0.getSouthWest(),
      _3023: x0 => x0.x,
      _3025: x0 => x0.y,
      _3961: (x0,x1) => x0.setContent(x1),
      _3986: x0 => x0.content,
      _3987: (x0,x1) => { x0.content = x1 },
      _4003: (x0,x1) => { x0.zIndex = x1 },
      _4071: (x0,x1,x2) => x0.fromLatLngToPoint(x1,x2),
      _4072: (x0,x1) => x0.fromLatLngToPoint(x1),
      _4074: (x0,x1,x2) => x0.fromPointToLatLng(x1,x2),
      _4107: (x0,x1) => { x0.url = x1 },
      _4108: (x0,x1) => { x0.anchor = x1 },
      _4115: (x0,x1) => { x0.scaledSize = x1 },
      _4117: (x0,x1) => { x0.size = x1 },
      _4125: x0 => x0.getMap(),
      _4138: (x0,x1) => x0.setMap(x1),
      _4140: (x0,x1) => x0.setOptions(x1),
      _4141: (x0,x1) => x0.setPosition(x1),
      _4144: (x0,x1) => x0.setVisible(x1),
      _4147: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._4147(f,arguments.length,x0) }),
      _4152: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._4152(f,arguments.length,x0) }),
      _4153: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._4153(f,arguments.length,x0) }),
      _4155: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._4155(f,arguments.length,x0) }),
      _4193: (x0,x1) => { x0.draggable = x1 },
      _4195: (x0,x1) => { x0.icon = x1 },
      _4201: (x0,x1) => { x0.opacity = x1 },
      _4205: (x0,x1) => { x0.position = x1 },
      _4209: (x0,x1) => { x0.title = x1 },
      _4211: (x0,x1) => { x0.visible = x1 },
      _4213: (x0,x1) => { x0.zIndex = x1 },
      _4277: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._4277(f,arguments.length,x0) }),
      _4278: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._4278(f,arguments.length,x0) }),
      _4285: () => new AbortController(),
      _4286: x0 => x0.abort(),
      _4287: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      _4288: (x0,x1) => globalThis.fetch(x0,x1),
      _4289: (x0,x1) => x0.get(x1),
      _4290: (module,f) => finalizeWrapper(f, function(x0,x1,x2) { return module.exports._4290(f,arguments.length,x0,x1,x2) }),
      _4291: (x0,x1) => x0.forEach(x1),
      _4292: x0 => x0.getReader(),
      _4293: x0 => x0.cancel(),
      _4294: x0 => x0.read(),
      _4295: (x0,x1) => x0.createImageBitmap(x1),
      _4308: x0 => x0.trustedTypes,
      _4309: (x0,x1) => { x0.innerHTML = x1 },
      _4310: (x0,x1) => { x0.innerHTML = x1 },
      _4311: o => o instanceof Array,
      _4315: a => a.pop(),
      _4316: (a, i) => a.splice(i, 1),
      _4317: (a, s) => a.join(s),
      _4318: (a, s, e) => a.slice(s, e),
      _4320: (a, b) => a == b ? 0 : (a > b ? 1 : -1),
      _4321: a => a.length,
      _4323: (a, i) => a[i],
      _4324: (a, i, v) => a[i] = v,
      _4326: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      _4327: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      _4329: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      _4330: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      _4331: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      _4332: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      _4333: o => o instanceof Uint8ClampedArray,
      _4334: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      _4335: o => o instanceof Uint16Array,
      _4336: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      _4337: o => o instanceof Int16Array,
      _4338: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      _4339: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      _4340: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      _4341: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      _4342: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      _4344: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      _4345: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      _4346: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      _4347: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      _4348: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      _4349: (a, i) => a.push(i),
      _4350: (t, s) => t.set(s),
      _4351: l => new DataView(new ArrayBuffer(l)),
      _4352: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      _4353: o => o.byteLength,
      _4354: o => o.buffer,
      _4355: o => o.byteOffset,
      _4356: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      _4357: (b, o) => new DataView(b, o),
      _4358: (b, o, l) => new DataView(b, o, l),
      _4359: Function.prototype.call.bind(DataView.prototype.getUint8),
      _4360: Function.prototype.call.bind(DataView.prototype.setUint8),
      _4361: Function.prototype.call.bind(DataView.prototype.getInt8),
      _4362: Function.prototype.call.bind(DataView.prototype.setInt8),
      _4363: Function.prototype.call.bind(DataView.prototype.getUint16),
      _4364: Function.prototype.call.bind(DataView.prototype.setUint16),
      _4365: Function.prototype.call.bind(DataView.prototype.getInt16),
      _4366: Function.prototype.call.bind(DataView.prototype.setInt16),
      _4367: Function.prototype.call.bind(DataView.prototype.getUint32),
      _4368: Function.prototype.call.bind(DataView.prototype.setUint32),
      _4369: Function.prototype.call.bind(DataView.prototype.getInt32),
      _4370: Function.prototype.call.bind(DataView.prototype.setInt32),
      _4373: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      _4374: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      _4375: Function.prototype.call.bind(DataView.prototype.getFloat32),
      _4376: Function.prototype.call.bind(DataView.prototype.setFloat32),
      _4377: Function.prototype.call.bind(DataView.prototype.getFloat64),
      _4378: Function.prototype.call.bind(DataView.prototype.setFloat64),
      _4379: Function.prototype.call.bind(Number.prototype.toString),
      _4380: Function.prototype.call.bind(BigInt.prototype.toString),
      _4381: Function.prototype.call.bind(Number.prototype.toString),
      _4382: (d, digits) => d.toFixed(digits),
      _4389: (x0,x1,x2) => x0.toDataURL(x1,x2),
      _4491: () => globalThis.document,
      _4493: () => globalThis.console,
      _4498: (x0,x1) => { x0.height = x1 },
      _4500: (x0,x1) => { x0.width = x1 },
      _4502: (x0,x1) => { x0.pointerEvents = x1 },
      _4511: x0 => x0.style,
      _4514: x0 => x0.src,
      _4515: (x0,x1) => { x0.src = x1 },
      _4516: x0 => x0.naturalWidth,
      _4517: x0 => x0.naturalHeight,
      _4532: (x0,x1) => x0.error(x1),
      _4537: x0 => x0.status,
      _4538: (x0,x1) => { x0.responseType = x1 },
      _4540: x0 => x0.response,
      _4657: (x0,x1) => { x0.draggable = x1 },
      _4663: (x0,x1) => { x0.innerText = x1 },
      _4673: x0 => x0.style,
      _4694: (x0,x1) => { x0.onclick = x1 },
      _5030: (x0,x1) => { x0.target = x1 },
      _5057: (x0,x1) => { x0.href = x1 },
      _5105: (x0,x1) => { x0.src = x1 },
      _5116: x0 => x0.width,
      _5118: x0 => x0.height,
      _5602: (x0,x1) => { x0.accept = x1 },
      _5616: x0 => x0.files,
      _5642: (x0,x1) => { x0.multiple = x1 },
      _5660: (x0,x1) => { x0.type = x1 },
      _5956: (x0,x1) => { x0.width = x1 },
      _5958: (x0,x1) => { x0.height = x1 },
      _6378: () => globalThis.window,
      _6418: x0 => x0.document,
      _6440: x0 => x0.navigator,
      _6702: x0 => x0.trustedTypes,
      _6704: x0 => x0.localStorage,
      _6810: x0 => x0.geolocation,
      _6815: x0 => x0.permissions,
      _6829: x0 => x0.userAgent,
      _6835: x0 => x0.onLine,
      _6862: x0 => x0.width,
      _6863: x0 => x0.height,
      _7036: x0 => x0.length,
      _8981: x0 => x0.signal,
      _9042: x0 => x0.firstChild,
      _9053: () => globalThis.document,
      _9134: x0 => x0.body,
      _9466: (x0,x1) => { x0.id = x1 },
      _9468: (x0,x1) => { x0.className = x1 },
      _9490: (x0,x1) => { x0.innerHTML = x1 },
      _9493: x0 => x0.children,
      _10812: x0 => x0.value,
      _10814: x0 => x0.done,
      _10994: x0 => x0.size,
      _10995: x0 => x0.type,
      _11002: x0 => x0.name,
      _11008: x0 => x0.length,
      _11013: x0 => x0.result,
      _11510: x0 => x0.url,
      _11512: x0 => x0.status,
      _11514: x0 => x0.statusText,
      _11515: x0 => x0.headers,
      _11516: x0 => x0.body,
      _11903: x0 => x0.state,
      _13220: x0 => x0.coords,
      _13221: x0 => x0.timestamp,
      _13223: x0 => x0.accuracy,
      _13224: x0 => x0.latitude,
      _13225: x0 => x0.longitude,
      _13226: x0 => x0.altitude,
      _13227: x0 => x0.altitudeAccuracy,
      _13228: x0 => x0.heading,
      _13229: x0 => x0.speed,
      _13230: x0 => x0.code,
      _13231: x0 => x0.message,
      _13917: (x0,x1) => { x0.display = x1 },
      _14081: (x0,x1) => { x0.height = x1 },
      _14771: (x0,x1) => { x0.width = x1 },
      _15139: x0 => x0.name,
      _15873: (x0,x1,x2,x3,x4,x5,x6,x7) => ({hue: x0,lightness: x1,saturation: x2,gamma: x3,invert_lightness: x4,visibility: x5,color: x6,weight: x7}),

    };

    const baseImports = {
      dart2wasm: dart2wasm,
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
    dartInstance.exports.$setThisModule(dartInstance);

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
