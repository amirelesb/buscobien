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
      _1293: x0 => x0.remove(),
      _1295: (x0,x1,x2,x3,x4,x5) => x0.drawImage(x1,x2,x3,x4,x5),
      _1296: x0 => globalThis.URL.createObjectURL(x0),
      _1302: (x0,x1) => x0.querySelector(x1),
      _1303: (x0,x1) => x0.createElement(x1),
      _1304: (x0,x1) => x0.append(x1),
      _1305: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _1307: x0 => x0.click(),
      _1313: (x0,x1) => x0.createElement(x1),
      _1319: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _1320: x0 => x0.onAdd(),
      _1321: (x0,x1) => x0.clearMarkers(x1),
      _1322: x0 => x0.onRemove(),
      _1326: (x0,x1) => new google.maps.Map(x0,x1),
      _1328: (x0,x1,x2) => x0.set(x1,x2),
      _1329: () => ({}),
      _1332: x0 => x0.close(),
      _1333: (x0,x1,x2) => x0.open(x1,x2),
      _1334: x0 => new google.maps.InfoWindow(x0),
      _1335: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1335(f,arguments.length,x0) }),
      _1336: x0 => new google.maps.Marker(x0),
      _1338: (x0,x1) => new google.maps.Size(x0,x1),
      _1339: x0 => new Blob(x0),
      _1342: (x0,x1) => x0.removeAt(x1),
      _1346: () => ({}),
      _1349: (x0,x1) => new google.maps.LatLng(x0,x1),
      _1350: () => ({}),
      _1351: (x0,x1) => new google.maps.LatLngBounds(x0,x1),
      _1352: (x0,x1) => x0.appendChild(x1),
      _1353: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1353(f,arguments.length,x0) }),
      _1354: x0 => ({createHTML: x0}),
      _1355: (x0,x1,x2) => x0.createPolicy(x1,x2),
      _1356: (x0,x1) => x0.createHTML(x1),
      _1357: () => ({}),
      _1358: (x0,x1) => new google.maps.Point(x0,x1),
      _1359: () => ({}),
      _1360: () => ({}),
      _1366: (x0,x1) => x0.panTo(x1),
      _1367: (x0,x1,x2) => x0.fitBounds(x1,x2),
      _1368: (x0,x1,x2) => x0.panBy(x1,x2),
      _1370: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _1371: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      _1377: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _1378: x0 => ({type: x0}),
      _1379: (x0,x1) => new Blob(x0,x1),
      _1380: (x0,x1) => x0.getElementById(x1),
      _1381: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      _1382: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1382(f,arguments.length,x0) }),
      _1383: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _1386: (x0,x1) => x0.getContext(x1),
      _1392: () => new FileReader(),
      _1393: (x0,x1) => x0.readAsArrayBuffer(x1),
      _1398: x0 => x0.decode(),
      _1399: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _1400: (x0,x1,x2) => x0.setRequestHeader(x1,x2),
      _1401: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1401(f,arguments.length,x0) }),
      _1402: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1402(f,arguments.length,x0) }),
      _1403: x0 => x0.send(),
      _1404: () => new XMLHttpRequest(),
      _1405: (x0,x1) => x0.query(x1),
      _1406: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1406(f,arguments.length,x0) }),
      _1407: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1407(f,arguments.length,x0) }),
      _1408: (x0,x1,x2) => ({enableHighAccuracy: x0,timeout: x1,maximumAge: x2}),
      _1409: (x0,x1,x2,x3) => x0.getCurrentPosition(x1,x2,x3),
      _1414: (x0,x1) => x0.getItem(x1),
      _1415: (x0,x1) => x0.removeItem(x1),
      _1416: (x0,x1,x2) => x0.setItem(x1,x2),
      _1417: (x0,x1,x2,x3,x4) => x0.clearRect(x1,x2,x3,x4),
      _1418: x0 => x0.close(),
      _1419: (x0,x1) => x0.item(x1),
      _1421: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1421(f,arguments.length,x0) }),
      _1422: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1422(f,arguments.length,x0) }),
      _1423: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1423(f,arguments.length,x0) }),
      _1424: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1424(f,arguments.length,x0) }),
      _1425: (x0,x1) => x0.removeChild(x1),
      _1427: (x0,x1) => x0.key(x1),
      _1428: (x0,x1,x2,x3,x4,x5,x6,x7) => x0.unwrapKey(x1,x2,x3,x4,x5,x6,x7),
      _1429: (x0,x1,x2,x3,x4,x5) => x0.importKey(x1,x2,x3,x4,x5),
      _1430: (x0,x1,x2,x3) => x0.generateKey(x1,x2,x3),
      _1431: (x0,x1,x2,x3,x4) => x0.wrapKey(x1,x2,x3,x4),
      _1432: (x0,x1,x2) => x0.exportKey(x1,x2),
      _1433: (x0,x1) => x0.getRandomValues(x1),
      _1434: (x0,x1,x2,x3) => x0.encrypt(x1,x2,x3),
      _1439: Date.now,
      _1441: s => new Date(s * 1000).getTimezoneOffset() * 60,
      _1442: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      _1443: () => typeof dartUseDateNowForTicks !== "undefined",
      _1444: () => 1000 * performance.now(),
      _1445: () => Date.now(),
      _1446: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      _1447: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      _1448: () => new WeakMap(),
      _1449: (map, o) => map.get(o),
      _1450: (map, o, v) => map.set(o, v),
      _1451: x0 => new WeakRef(x0),
      _1452: x0 => x0.deref(),
      _1459: () => globalThis.WeakRef,
      _1463: s => JSON.stringify(s),
      _1464: s => printToConsole(s),
      _1465: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      _1466: (o, p, r) => o.replaceAll(p, () => r),
      _1468: Function.prototype.call.bind(String.prototype.toLowerCase),
      _1469: s => s.toUpperCase(),
      _1470: s => s.trim(),
      _1471: s => s.trimLeft(),
      _1472: s => s.trimRight(),
      _1473: (string, times) => string.repeat(times),
      _1474: Function.prototype.call.bind(String.prototype.indexOf),
      _1475: (s, p, i) => s.lastIndexOf(p, i),
      _1476: (string, token) => string.split(token),
      _1477: Object.is,
      _1481: (o, c) => o instanceof c,
      _1482: o => Object.keys(o),
      _1486: (o, a) => o + a,
      _1514: x0 => new Array(x0),
      _1516: x0 => x0.length,
      _1518: (x0,x1) => x0[x1],
      _1519: (x0,x1,x2) => { x0[x1] = x2 },
      _1522: (x0,x1,x2) => new DataView(x0,x1,x2),
      _1524: x0 => new Int8Array(x0),
      _1525: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      _1527: x0 => new Uint8ClampedArray(x0),
      _1529: x0 => new Int16Array(x0),
      _1531: x0 => new Uint16Array(x0),
      _1533: x0 => new Int32Array(x0),
      _1535: x0 => new Uint32Array(x0),
      _1537: x0 => new Float32Array(x0),
      _1539: x0 => new Float64Array(x0),
      _1563: x0 => x0.random(),
      _1564: (x0,x1) => x0.getRandomValues(x1),
      _1565: () => globalThis.crypto,
      _1566: () => globalThis.Math,
      _1579: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      _1580: (handle) => clearTimeout(handle),
      _1581: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      _1582: (handle) => clearInterval(handle),
      _1583: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      _1584: () => Date.now(),
      _1585: () => new Error().stack,
      _1586: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      _1587: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      _1588: (x0,x1) => x0.exec(x1),
      _1589: (x0,x1) => x0.test(x1),
      _1590: x0 => x0.pop(),
      _1592: o => o === undefined,
      _1594: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      _1596: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      _1597: o => o instanceof RegExp,
      _1598: (l, r) => l === r,
      _1599: o => o,
      _1600: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      _1601: o => o,
      _1602: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      _1603: o => o,
      _1604: b => !!b,
      _1605: o => o.length,
      _1607: (o, i) => o[i],
      _1608: f => f.dartFunction,
      _1609: () => ({}),
      _1610: () => [],
      _1612: () => globalThis,
      _1613: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      _1615: (o, p) => o[p],
      _1616: (o, p, v) => o[p] = v,
      _1617: (o, m, a) => o[m].apply(o, a),
      _1619: o => String(o),
      _1620: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      _1621: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1621(f,arguments.length,x0) }),
      _1622: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._1622(f,arguments.length,x0,x1) }),
      _1623: o => {
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
      _1624: o => [o],
      _1625: (o0, o1) => [o0, o1],
      _1626: (o0, o1, o2) => [o0, o1, o2],
      _1627: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      _1628: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      _1629: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1630: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1631: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1632: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1633: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1634: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1635: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1636: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1637: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1638: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1639: x0 => new ArrayBuffer(x0),
      _1640: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      _1642: x0 => x0.index,
      _1644: x0 => x0.flags,
      _1645: x0 => x0.multiline,
      _1646: x0 => x0.ignoreCase,
      _1647: x0 => x0.unicode,
      _1648: x0 => x0.dotAll,
      _1649: (x0,x1) => { x0.lastIndex = x1 },
      _1650: (o, p) => p in o,
      _1651: (o, p) => o[p],
      _1687: (x0,x1,x2) => globalThis.google.maps.event.addListener(x0,x1,x2),
      _1688: x0 => x0.remove(),
      _2060: x0 => x0.overlayMapTypes,
      _2062: x0 => x0.getBounds(),
      _2063: x0 => x0.getCenter(),
      _2067: x0 => x0.getHeading(),
      _2072: x0 => x0.getProjection(),
      _2075: x0 => x0.getTilt(),
      _2077: x0 => x0.getZoom(),
      _2082: (x0,x1) => x0.setHeading(x1),
      _2085: (x0,x1) => x0.setOptions(x1),
      _2088: (x0,x1) => x0.setTilt(x1),
      _2090: (x0,x1) => x0.setZoom(x1),
      _2091: (module,f) => finalizeWrapper(f, function() { return module.exports._2091(f,arguments.length) }),
      _2093: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2093(f,arguments.length,x0) }),
      _2100: (module,f) => finalizeWrapper(f, function() { return module.exports._2100(f,arguments.length) }),
      _2109: (module,f) => finalizeWrapper(f, function() { return module.exports._2109(f,arguments.length) }),
      _2112: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2112(f,arguments.length,x0) }),
      _2113: x0 => x0.latLng,
      _2159: x0 => x0.latLng,
      _2166: (x0,x1) => { x0.cameraControl = x1 },
      _2170: (x0,x1) => { x0.center = x1 },
      _2188: (x0,x1) => { x0.fullscreenControl = x1 },
      _2191: (x0,x1) => { x0.gestureHandling = x1 },
      _2204: (x0,x1) => { x0.mapId = x1 },
      _2206: (x0,x1) => { x0.mapTypeControl = x1 },
      _2210: (x0,x1) => { x0.mapTypeId = x1 },
      _2212: (x0,x1) => { x0.maxZoom = x1 },
      _2214: (x0,x1) => { x0.minZoom = x1 },
      _2225: x0 => x0.rotateControl,
      _2226: (x0,x1) => { x0.rotateControl = x1 },
      _2238: (x0,x1) => { x0.streetViewControl = x1 },
      _2241: (x0,x1) => { x0.styles = x1 },
      _2244: (x0,x1) => { x0.tilt = x1 },
      _2248: (x0,x1) => { x0.zoom = x1 },
      _2250: (x0,x1) => { x0.zoomControl = x1 },
      _2258: () => globalThis.google.maps.MapTypeId.HYBRID,
      _2259: () => globalThis.google.maps.MapTypeId.ROADMAP,
      _2260: () => globalThis.google.maps.MapTypeId.SATELLITE,
      _2261: () => globalThis.google.maps.MapTypeId.TERRAIN,
      _2266: (x0,x1) => { x0.stylers = x1 },
      _2268: (x0,x1) => { x0.elementType = x1 },
      _2270: (x0,x1) => { x0.featureType = x1 },
      _2363: (module,f) => finalizeWrapper(f, function(x0,x1,x2) { return module.exports._2363(f,arguments.length,x0,x1,x2) }),
      _2364: (x0,x1,x2) => ({map: x0,markers: x1,onClusterClick: x2}),
      _2375: x0 => new markerClusterer.MarkerClusterer(x0),
      _2969: x0 => x0.lat(),
      _2970: x0 => x0.lng(),
      _2998: x0 => x0.getNorthEast(),
      _2999: x0 => x0.getSouthWest(),
      _3030: x0 => x0.x,
      _3032: x0 => x0.y,
      _3968: (x0,x1) => x0.setContent(x1),
      _3993: x0 => x0.content,
      _3994: (x0,x1) => { x0.content = x1 },
      _4010: (x0,x1) => { x0.zIndex = x1 },
      _4078: (x0,x1,x2) => x0.fromLatLngToPoint(x1,x2),
      _4079: (x0,x1) => x0.fromLatLngToPoint(x1),
      _4081: (x0,x1,x2) => x0.fromPointToLatLng(x1,x2),
      _4114: (x0,x1) => { x0.url = x1 },
      _4115: (x0,x1) => { x0.anchor = x1 },
      _4122: (x0,x1) => { x0.scaledSize = x1 },
      _4124: (x0,x1) => { x0.size = x1 },
      _4132: x0 => x0.getMap(),
      _4145: (x0,x1) => x0.setMap(x1),
      _4147: (x0,x1) => x0.setOptions(x1),
      _4148: (x0,x1) => x0.setPosition(x1),
      _4151: (x0,x1) => x0.setVisible(x1),
      _4154: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._4154(f,arguments.length,x0) }),
      _4159: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._4159(f,arguments.length,x0) }),
      _4160: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._4160(f,arguments.length,x0) }),
      _4162: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._4162(f,arguments.length,x0) }),
      _4200: (x0,x1) => { x0.draggable = x1 },
      _4202: (x0,x1) => { x0.icon = x1 },
      _4208: (x0,x1) => { x0.opacity = x1 },
      _4212: (x0,x1) => { x0.position = x1 },
      _4216: (x0,x1) => { x0.title = x1 },
      _4218: (x0,x1) => { x0.visible = x1 },
      _4220: (x0,x1) => { x0.zIndex = x1 },
      _4284: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._4284(f,arguments.length,x0) }),
      _4285: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._4285(f,arguments.length,x0) }),
      _4292: () => new AbortController(),
      _4293: x0 => x0.abort(),
      _4294: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      _4295: (x0,x1) => globalThis.fetch(x0,x1),
      _4296: (x0,x1) => x0.get(x1),
      _4297: (module,f) => finalizeWrapper(f, function(x0,x1,x2) { return module.exports._4297(f,arguments.length,x0,x1,x2) }),
      _4298: (x0,x1) => x0.forEach(x1),
      _4299: x0 => x0.getReader(),
      _4300: x0 => x0.cancel(),
      _4301: x0 => x0.read(),
      _4302: (x0,x1) => x0.createImageBitmap(x1),
      _4315: x0 => x0.trustedTypes,
      _4316: (x0,x1) => { x0.innerHTML = x1 },
      _4317: (x0,x1) => { x0.innerHTML = x1 },
      _4318: o => o instanceof Array,
      _4322: a => a.pop(),
      _4323: (a, i) => a.splice(i, 1),
      _4324: (a, s) => a.join(s),
      _4325: (a, s, e) => a.slice(s, e),
      _4327: (a, b) => a == b ? 0 : (a > b ? 1 : -1),
      _4328: a => a.length,
      _4330: (a, i) => a[i],
      _4331: (a, i, v) => a[i] = v,
      _4333: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      _4334: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      _4336: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      _4337: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      _4338: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      _4339: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      _4340: o => o instanceof Uint8ClampedArray,
      _4341: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      _4342: o => o instanceof Uint16Array,
      _4343: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      _4344: o => o instanceof Int16Array,
      _4345: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      _4346: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      _4347: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      _4348: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      _4349: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      _4351: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      _4352: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      _4353: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      _4354: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      _4355: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      _4356: (a, i) => a.push(i),
      _4357: (t, s) => t.set(s),
      _4358: l => new DataView(new ArrayBuffer(l)),
      _4359: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      _4360: o => o.byteLength,
      _4361: o => o.buffer,
      _4362: o => o.byteOffset,
      _4363: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      _4364: (b, o) => new DataView(b, o),
      _4365: (b, o, l) => new DataView(b, o, l),
      _4366: Function.prototype.call.bind(DataView.prototype.getUint8),
      _4367: Function.prototype.call.bind(DataView.prototype.setUint8),
      _4368: Function.prototype.call.bind(DataView.prototype.getInt8),
      _4369: Function.prototype.call.bind(DataView.prototype.setInt8),
      _4370: Function.prototype.call.bind(DataView.prototype.getUint16),
      _4371: Function.prototype.call.bind(DataView.prototype.setUint16),
      _4372: Function.prototype.call.bind(DataView.prototype.getInt16),
      _4373: Function.prototype.call.bind(DataView.prototype.setInt16),
      _4374: Function.prototype.call.bind(DataView.prototype.getUint32),
      _4375: Function.prototype.call.bind(DataView.prototype.setUint32),
      _4376: Function.prototype.call.bind(DataView.prototype.getInt32),
      _4377: Function.prototype.call.bind(DataView.prototype.setInt32),
      _4380: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      _4381: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      _4382: Function.prototype.call.bind(DataView.prototype.getFloat32),
      _4383: Function.prototype.call.bind(DataView.prototype.setFloat32),
      _4384: Function.prototype.call.bind(DataView.prototype.getFloat64),
      _4385: Function.prototype.call.bind(DataView.prototype.setFloat64),
      _4386: Function.prototype.call.bind(Number.prototype.toString),
      _4387: Function.prototype.call.bind(BigInt.prototype.toString),
      _4388: Function.prototype.call.bind(Number.prototype.toString),
      _4389: (d, digits) => d.toFixed(digits),
      _4396: (x0,x1,x2) => x0.toDataURL(x1,x2),
      _4498: () => globalThis.document,
      _4500: () => globalThis.console,
      _4505: (x0,x1) => { x0.height = x1 },
      _4507: (x0,x1) => { x0.width = x1 },
      _4509: (x0,x1) => { x0.pointerEvents = x1 },
      _4518: x0 => x0.style,
      _4521: x0 => x0.src,
      _4522: (x0,x1) => { x0.src = x1 },
      _4523: x0 => x0.naturalWidth,
      _4524: x0 => x0.naturalHeight,
      _4539: (x0,x1) => x0.error(x1),
      _4544: x0 => x0.status,
      _4545: (x0,x1) => { x0.responseType = x1 },
      _4547: x0 => x0.response,
      _4664: (x0,x1) => { x0.draggable = x1 },
      _4670: (x0,x1) => { x0.innerText = x1 },
      _4680: x0 => x0.style,
      _4701: (x0,x1) => { x0.onclick = x1 },
      _5037: (x0,x1) => { x0.target = x1 },
      _5064: (x0,x1) => { x0.href = x1 },
      _5112: (x0,x1) => { x0.src = x1 },
      _5123: x0 => x0.width,
      _5125: x0 => x0.height,
      _5609: (x0,x1) => { x0.accept = x1 },
      _5623: x0 => x0.files,
      _5649: (x0,x1) => { x0.multiple = x1 },
      _5667: (x0,x1) => { x0.type = x1 },
      _5962: (x0,x1) => { x0.width = x1 },
      _5964: (x0,x1) => { x0.height = x1 },
      _6384: () => globalThis.window,
      _6424: x0 => x0.document,
      _6446: x0 => x0.navigator,
      _6701: x0 => x0.isSecureContext,
      _6704: x0 => x0.crypto,
      _6708: x0 => x0.trustedTypes,
      _6709: x0 => x0.sessionStorage,
      _6710: x0 => x0.localStorage,
      _6816: x0 => x0.geolocation,
      _6821: x0 => x0.permissions,
      _6835: x0 => x0.userAgent,
      _6841: x0 => x0.onLine,
      _6868: x0 => x0.width,
      _6869: x0 => x0.height,
      _7042: x0 => x0.length,
      _8987: x0 => x0.signal,
      _9048: x0 => x0.firstChild,
      _9059: () => globalThis.document,
      _9140: x0 => x0.body,
      _9471: (x0,x1) => { x0.id = x1 },
      _9473: (x0,x1) => { x0.className = x1 },
      _9495: (x0,x1) => { x0.innerHTML = x1 },
      _9498: x0 => x0.children,
      _10817: x0 => x0.value,
      _10819: x0 => x0.done,
      _10999: x0 => x0.size,
      _11000: x0 => x0.type,
      _11007: x0 => x0.name,
      _11013: x0 => x0.length,
      _11018: x0 => x0.result,
      _11515: x0 => x0.url,
      _11517: x0 => x0.status,
      _11519: x0 => x0.statusText,
      _11520: x0 => x0.headers,
      _11521: x0 => x0.body,
      _11908: x0 => x0.state,
      _13225: x0 => x0.coords,
      _13226: x0 => x0.timestamp,
      _13228: x0 => x0.accuracy,
      _13229: x0 => x0.latitude,
      _13230: x0 => x0.longitude,
      _13231: x0 => x0.altitude,
      _13232: x0 => x0.altitudeAccuracy,
      _13233: x0 => x0.heading,
      _13234: x0 => x0.speed,
      _13235: x0 => x0.code,
      _13236: x0 => x0.message,
      _13922: (x0,x1) => { x0.display = x1 },
      _14086: (x0,x1) => { x0.height = x1 },
      _14776: (x0,x1) => { x0.width = x1 },
      _15144: x0 => x0.name,
      _15148: x0 => x0.subtle,
      _15878: (x0,x1,x2,x3,x4,x5,x6,x7) => ({hue: x0,lightness: x1,saturation: x2,gamma: x3,invert_lightness: x4,visibility: x5,color: x6,weight: x7}),

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
