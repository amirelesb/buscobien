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
  // `loadDeferredWasm` is a JS function that takes a module name matching a
  //   wasm file produced by the dart2wasm compiler and returns the bytes to
  //   load the module. These bytes can be in either a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  // `loadDynamicModule` is a JS function that takes two string names matching,
  //   in order, a wasm file produced by the dart2wasm compiler during dynamic
  //   module compilation and a corresponding js file produced by the same
  //   compilation. It should return a JS Array containing 2 elements. The first
  //   should be the bytes for the wasm module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The second
  //   should be the result of using the JS 'import' API on the js file path.
  async instantiate(additionalImports, {loadDeferredWasm, loadDynamicModule} = {}) {
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
            _4: (o, c) => o instanceof c,
      _5: o => Object.keys(o),
      _8: (o, a) => o + a,
      _35: () => new Array(),
      _36: x0 => new Array(x0),
      _38: x0 => x0.length,
      _40: (x0,x1) => x0[x1],
      _41: (x0,x1,x2) => { x0[x1] = x2 },
      _43: x0 => new Promise(x0),
      _45: (x0,x1,x2) => new DataView(x0,x1,x2),
      _47: x0 => new Int8Array(x0),
      _48: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      _49: x0 => new Uint8Array(x0),
      _51: x0 => new Uint8ClampedArray(x0),
      _53: x0 => new Int16Array(x0),
      _55: x0 => new Uint16Array(x0),
      _57: x0 => new Int32Array(x0),
      _59: x0 => new Uint32Array(x0),
      _61: x0 => new Float32Array(x0),
      _63: x0 => new Float64Array(x0),
      _65: (x0,x1,x2) => x0.call(x1,x2),
      _70: (decoder, codeUnits) => decoder.decode(codeUnits),
      _71: () => new TextDecoder("utf-8", {fatal: true}),
      _72: () => new TextDecoder("utf-8", {fatal: false}),
      _73: (s) => +s,
      _74: x0 => new Uint8Array(x0),
      _75: (x0,x1,x2) => x0.set(x1,x2),
      _76: (x0,x1) => x0.transferFromImageBitmap(x1),
      _77: x0 => x0.arrayBuffer(),
      _78: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._78(f,arguments.length,x0) }),
      _79: x0 => new window.FinalizationRegistry(x0),
      _80: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      _81: (x0,x1) => x0.unregister(x1),
      _82: (x0,x1,x2) => x0.slice(x1,x2),
      _83: (x0,x1) => x0.decode(x1),
      _84: (x0,x1) => x0.segment(x1),
      _85: () => new TextDecoder(),
      _87: x0 => x0.buffer,
      _88: x0 => x0.wasmMemory,
      _89: () => globalThis.window._flutter_skwasmInstance,
      _90: x0 => x0.rasterStartMilliseconds,
      _91: x0 => x0.rasterEndMilliseconds,
      _92: x0 => x0.imageBitmaps,
      _196: x0 => x0.stopPropagation(),
      _197: x0 => x0.preventDefault(),
      _199: x0 => x0.remove(),
      _200: (x0,x1) => x0.append(x1),
      _201: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _246: x0 => x0.unlock(),
      _247: x0 => x0.getReader(),
      _248: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _249: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      _250: (x0,x1) => x0.item(x1),
      _251: x0 => x0.next(),
      _252: x0 => x0.now(),
      _253: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._253(f,arguments.length,x0) }),
      _254: (x0,x1) => x0.addListener(x1),
      _255: (x0,x1) => x0.removeListener(x1),
      _256: (x0,x1) => x0.matchMedia(x1),
      _257: (x0,x1) => x0.revokeObjectURL(x1),
      _258: x0 => x0.close(),
      _259: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      _260: x0 => new window.ImageDecoder(x0),
      _261: x0 => ({frameIndex: x0}),
      _262: (x0,x1) => x0.decode(x1),
      _263: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._263(f,arguments.length,x0) }),
      _264: (x0,x1) => x0.getModifierState(x1),
      _265: (x0,x1) => x0.removeProperty(x1),
      _266: (x0,x1) => x0.prepend(x1),
      _267: x0 => new Intl.Locale(x0),
      _268: x0 => x0.disconnect(),
      _269: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._269(f,arguments.length,x0) }),
      _270: (x0,x1) => x0.getAttribute(x1),
      _271: (x0,x1) => x0.contains(x1),
      _272: (x0,x1) => x0.querySelector(x1),
      _273: x0 => x0.blur(),
      _274: x0 => x0.hasFocus(),
      _275: (x0,x1,x2) => x0.insertBefore(x1,x2),
      _276: (x0,x1) => x0.hasAttribute(x1),
      _277: (x0,x1) => x0.getModifierState(x1),
      _278: (x0,x1) => x0.createTextNode(x1),
      _279: (x0,x1) => x0.appendChild(x1),
      _280: (x0,x1) => x0.removeAttribute(x1),
      _281: x0 => x0.getBoundingClientRect(),
      _282: (x0,x1) => x0.observe(x1),
      _283: x0 => x0.disconnect(),
      _284: (x0,x1) => x0.closest(x1),
      _707: () => globalThis.window.flutterConfiguration,
      _709: x0 => x0.assetBase,
      _714: x0 => x0.canvasKitMaximumSurfaces,
      _715: x0 => x0.debugShowSemanticsNodes,
      _716: x0 => x0.hostElement,
      _717: x0 => x0.multiViewEnabled,
      _718: x0 => x0.nonce,
      _720: x0 => x0.fontFallbackBaseUrl,
      _730: x0 => x0.console,
      _731: x0 => x0.devicePixelRatio,
      _732: x0 => x0.document,
      _733: x0 => x0.history,
      _734: x0 => x0.innerHeight,
      _735: x0 => x0.innerWidth,
      _736: x0 => x0.location,
      _737: x0 => x0.navigator,
      _738: x0 => x0.visualViewport,
      _739: x0 => x0.performance,
      _741: x0 => x0.URL,
      _743: (x0,x1) => x0.getComputedStyle(x1),
      _744: x0 => x0.screen,
      _745: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._745(f,arguments.length,x0) }),
      _746: (x0,x1) => x0.requestAnimationFrame(x1),
      _751: (x0,x1) => x0.warn(x1),
      _753: (x0,x1) => x0.debug(x1),
      _754: x0 => globalThis.parseFloat(x0),
      _755: () => globalThis.window,
      _756: () => globalThis.Intl,
      _757: () => globalThis.Symbol,
      _758: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      _760: x0 => x0.clipboard,
      _761: x0 => x0.maxTouchPoints,
      _762: x0 => x0.vendor,
      _763: x0 => x0.language,
      _764: x0 => x0.platform,
      _765: x0 => x0.userAgent,
      _766: (x0,x1) => x0.vibrate(x1),
      _767: x0 => x0.languages,
      _768: x0 => x0.documentElement,
      _769: (x0,x1) => x0.querySelector(x1),
      _772: (x0,x1) => x0.createElement(x1),
      _775: (x0,x1) => x0.createEvent(x1),
      _776: x0 => x0.activeElement,
      _779: x0 => x0.head,
      _780: x0 => x0.body,
      _782: (x0,x1) => { x0.title = x1 },
      _785: x0 => x0.visibilityState,
      _786: () => globalThis.document,
      _787: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._787(f,arguments.length,x0) }),
      _788: (x0,x1) => x0.dispatchEvent(x1),
      _796: x0 => x0.target,
      _798: x0 => x0.timeStamp,
      _799: x0 => x0.type,
      _801: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      _807: x0 => x0.baseURI,
      _808: x0 => x0.firstChild,
      _812: x0 => x0.parentElement,
      _814: (x0,x1) => { x0.textContent = x1 },
      _815: x0 => x0.parentNode,
      _816: x0 => x0.nextSibling,
      _817: (x0,x1) => x0.removeChild(x1),
      _818: x0 => x0.isConnected,
      _826: x0 => x0.clientHeight,
      _827: x0 => x0.clientWidth,
      _828: x0 => x0.offsetHeight,
      _829: x0 => x0.offsetWidth,
      _830: x0 => x0.id,
      _831: (x0,x1) => { x0.id = x1 },
      _834: (x0,x1) => { x0.spellcheck = x1 },
      _835: x0 => x0.tagName,
      _836: x0 => x0.style,
      _838: (x0,x1) => x0.querySelectorAll(x1),
      _839: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _840: (x0,x1) => { x0.tabIndex = x1 },
      _841: x0 => x0.tabIndex,
      _842: (x0,x1) => x0.focus(x1),
      _843: x0 => x0.scrollTop,
      _844: (x0,x1) => { x0.scrollTop = x1 },
      _845: x0 => x0.scrollLeft,
      _846: (x0,x1) => { x0.scrollLeft = x1 },
      _847: x0 => x0.classList,
      _849: (x0,x1) => { x0.className = x1 },
      _851: (x0,x1) => x0.getElementsByClassName(x1),
      _852: x0 => x0.click(),
      _853: (x0,x1) => x0.attachShadow(x1),
      _856: x0 => x0.computedStyleMap(),
      _857: (x0,x1) => x0.get(x1),
      _863: (x0,x1) => x0.getPropertyValue(x1),
      _864: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      _865: x0 => x0.offsetLeft,
      _866: x0 => x0.offsetTop,
      _867: x0 => x0.offsetParent,
      _869: (x0,x1) => { x0.name = x1 },
      _870: x0 => x0.content,
      _871: (x0,x1) => { x0.content = x1 },
      _875: (x0,x1) => { x0.src = x1 },
      _876: x0 => x0.naturalWidth,
      _877: x0 => x0.naturalHeight,
      _881: (x0,x1) => { x0.crossOrigin = x1 },
      _883: (x0,x1) => { x0.decoding = x1 },
      _884: x0 => x0.decode(),
      _889: (x0,x1) => { x0.nonce = x1 },
      _894: (x0,x1) => { x0.width = x1 },
      _896: (x0,x1) => { x0.height = x1 },
      _899: (x0,x1) => x0.getContext(x1),
      _960: x0 => x0.width,
      _961: x0 => x0.height,
      _963: (x0,x1) => x0.fetch(x1),
      _964: x0 => x0.status,
      _966: x0 => x0.body,
      _967: x0 => x0.arrayBuffer(),
      _970: x0 => x0.read(),
      _971: x0 => x0.value,
      _972: x0 => x0.done,
      _979: x0 => x0.name,
      _980: x0 => x0.x,
      _981: x0 => x0.y,
      _984: x0 => x0.top,
      _985: x0 => x0.right,
      _986: x0 => x0.bottom,
      _987: x0 => x0.left,
      _997: x0 => x0.height,
      _998: x0 => x0.width,
      _999: x0 => x0.scale,
      _1000: (x0,x1) => { x0.value = x1 },
      _1003: (x0,x1) => { x0.placeholder = x1 },
      _1005: (x0,x1) => { x0.name = x1 },
      _1006: x0 => x0.selectionDirection,
      _1007: x0 => x0.selectionStart,
      _1008: x0 => x0.selectionEnd,
      _1011: x0 => x0.value,
      _1013: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _1014: x0 => x0.readText(),
      _1015: (x0,x1) => x0.writeText(x1),
      _1017: x0 => x0.altKey,
      _1018: x0 => x0.code,
      _1019: x0 => x0.ctrlKey,
      _1020: x0 => x0.key,
      _1021: x0 => x0.keyCode,
      _1022: x0 => x0.location,
      _1023: x0 => x0.metaKey,
      _1024: x0 => x0.repeat,
      _1025: x0 => x0.shiftKey,
      _1026: x0 => x0.isComposing,
      _1028: x0 => x0.state,
      _1029: (x0,x1) => x0.go(x1),
      _1031: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      _1032: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      _1033: x0 => x0.pathname,
      _1034: x0 => x0.search,
      _1035: x0 => x0.hash,
      _1039: x0 => x0.state,
      _1042: (x0,x1) => x0.createObjectURL(x1),
      _1044: x0 => new Blob(x0),
      _1046: x0 => new MutationObserver(x0),
      _1047: (x0,x1,x2) => x0.observe(x1,x2),
      _1048: f => finalizeWrapper(f, function(x0,x1) { return dartInstance.exports._1048(f,arguments.length,x0,x1) }),
      _1051: x0 => x0.attributeName,
      _1052: x0 => x0.type,
      _1053: x0 => x0.matches,
      _1054: x0 => x0.matches,
      _1058: x0 => x0.relatedTarget,
      _1060: x0 => x0.clientX,
      _1061: x0 => x0.clientY,
      _1062: x0 => x0.offsetX,
      _1063: x0 => x0.offsetY,
      _1066: x0 => x0.button,
      _1067: x0 => x0.buttons,
      _1068: x0 => x0.ctrlKey,
      _1072: x0 => x0.pointerId,
      _1073: x0 => x0.pointerType,
      _1074: x0 => x0.pressure,
      _1075: x0 => x0.tiltX,
      _1076: x0 => x0.tiltY,
      _1077: x0 => x0.getCoalescedEvents(),
      _1080: x0 => x0.deltaX,
      _1081: x0 => x0.deltaY,
      _1082: x0 => x0.wheelDeltaX,
      _1083: x0 => x0.wheelDeltaY,
      _1084: x0 => x0.deltaMode,
      _1091: x0 => x0.changedTouches,
      _1094: x0 => x0.clientX,
      _1095: x0 => x0.clientY,
      _1098: x0 => x0.data,
      _1101: (x0,x1) => { x0.disabled = x1 },
      _1103: (x0,x1) => { x0.type = x1 },
      _1104: (x0,x1) => { x0.max = x1 },
      _1105: (x0,x1) => { x0.min = x1 },
      _1106: x0 => x0.value,
      _1107: (x0,x1) => { x0.value = x1 },
      _1108: x0 => x0.disabled,
      _1109: (x0,x1) => { x0.disabled = x1 },
      _1111: (x0,x1) => { x0.placeholder = x1 },
      _1112: (x0,x1) => { x0.name = x1 },
      _1115: (x0,x1) => { x0.autocomplete = x1 },
      _1116: x0 => x0.selectionDirection,
      _1117: x0 => x0.selectionStart,
      _1119: x0 => x0.selectionEnd,
      _1122: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _1123: (x0,x1) => x0.add(x1),
      _1126: (x0,x1) => { x0.noValidate = x1 },
      _1127: (x0,x1) => { x0.method = x1 },
      _1128: (x0,x1) => { x0.action = x1 },
      _1129: (x0,x1) => new OffscreenCanvas(x0,x1),
      _1135: (x0,x1) => x0.getContext(x1),
      _1137: x0 => x0.convertToBlob(),
      _1154: x0 => x0.orientation,
      _1155: x0 => x0.width,
      _1156: x0 => x0.height,
      _1157: (x0,x1) => x0.lock(x1),
      _1176: x0 => new ResizeObserver(x0),
      _1179: f => finalizeWrapper(f, function(x0,x1) { return dartInstance.exports._1179(f,arguments.length,x0,x1) }),
      _1187: x0 => x0.length,
      _1188: x0 => x0.iterator,
      _1189: x0 => x0.Segmenter,
      _1190: x0 => x0.v8BreakIterator,
      _1191: (x0,x1) => new Intl.Segmenter(x0,x1),
      _1194: x0 => x0.language,
      _1195: x0 => x0.script,
      _1196: x0 => x0.region,
      _1214: x0 => x0.done,
      _1215: x0 => x0.value,
      _1216: x0 => x0.index,
      _1220: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      _1221: (x0,x1) => x0.adoptText(x1),
      _1222: x0 => x0.first(),
      _1223: x0 => x0.next(),
      _1224: x0 => x0.current(),
      _1238: x0 => x0.hostElement,
      _1239: x0 => x0.viewConstraints,
      _1242: x0 => x0.maxHeight,
      _1243: x0 => x0.maxWidth,
      _1244: x0 => x0.minHeight,
      _1245: x0 => x0.minWidth,
      _1246: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1246(f,arguments.length,x0) }),
      _1247: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1247(f,arguments.length,x0) }),
      _1248: (x0,x1) => ({addView: x0,removeView: x1}),
      _1251: x0 => x0.loader,
      _1252: () => globalThis._flutter,
      _1253: (x0,x1) => x0.didCreateEngineInitializer(x1),
      _1254: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1254(f,arguments.length,x0) }),
      _1255: f => finalizeWrapper(f, function() { return dartInstance.exports._1255(f,arguments.length) }),
      _1256: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      _1259: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1259(f,arguments.length,x0) }),
      _1260: x0 => ({runApp: x0}),
      _1262: f => finalizeWrapper(f, function(x0,x1) { return dartInstance.exports._1262(f,arguments.length,x0,x1) }),
      _1263: x0 => x0.length,
      _1264: () => globalThis.window.ImageDecoder,
      _1265: x0 => x0.tracks,
      _1267: x0 => x0.completed,
      _1269: x0 => x0.image,
      _1275: x0 => x0.displayWidth,
      _1276: x0 => x0.displayHeight,
      _1277: x0 => x0.duration,
      _1280: x0 => x0.ready,
      _1281: x0 => x0.selectedTrack,
      _1282: x0 => x0.repetitionCount,
      _1283: x0 => x0.frameCount,
      _1338: (x0,x1) => x0.createElement(x1),
      _1344: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _1345: x0 => x0.onAdd(),
      _1346: (x0,x1) => x0.clearMarkers(x1),
      _1347: x0 => x0.onRemove(),
      _1351: (x0,x1) => new google.maps.Map(x0,x1),
      _1353: (x0,x1,x2) => x0.set(x1,x2),
      _1354: () => ({}),
      _1357: x0 => x0.close(),
      _1358: (x0,x1,x2) => x0.open(x1,x2),
      _1359: x0 => new google.maps.InfoWindow(x0),
      _1360: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1360(f,arguments.length,x0) }),
      _1361: x0 => new google.maps.Marker(x0),
      _1363: (x0,x1) => new google.maps.Size(x0,x1),
      _1364: (x0,x1) => x0.createElement(x1),
      _1365: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _1366: x0 => new Blob(x0),
      _1367: x0 => globalThis.URL.createObjectURL(x0),
      _1375: () => ({}),
      _1378: (x0,x1) => new google.maps.LatLng(x0,x1),
      _1379: () => ({}),
      _1380: (x0,x1) => new google.maps.LatLngBounds(x0,x1),
      _1381: (x0,x1) => x0.appendChild(x1),
      _1382: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1382(f,arguments.length,x0) }),
      _1383: x0 => ({createHTML: x0}),
      _1384: (x0,x1,x2) => x0.createPolicy(x1,x2),
      _1385: (x0,x1) => x0.createHTML(x1),
      _1386: () => ({}),
      _1387: (x0,x1) => new google.maps.Point(x0,x1),
      _1388: () => ({}),
      _1389: () => ({}),
      _1395: (x0,x1) => x0.panTo(x1),
      _1396: (x0,x1,x2) => x0.fitBounds(x1,x2),
      _1397: (x0,x1,x2) => x0.panBy(x1,x2),
      _1399: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _1400: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      _1406: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _1407: (x0,x1) => x0.append(x1),
      _1408: x0 => ({type: x0}),
      _1409: (x0,x1) => new Blob(x0,x1),
      _1410: (x0,x1) => x0.getElementById(x1),
      _1411: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      _1412: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1412(f,arguments.length,x0) }),
      _1413: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _1414: x0 => x0.remove(),
      _1415: x0 => x0.click(),
      _1418: (x0,x1) => x0.getContext(x1),
      _1424: () => new FileReader(),
      _1425: (x0,x1) => x0.readAsArrayBuffer(x1),
      _1430: x0 => x0.decode(),
      _1431: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _1432: (x0,x1,x2) => x0.setRequestHeader(x1,x2),
      _1433: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1433(f,arguments.length,x0) }),
      _1434: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1434(f,arguments.length,x0) }),
      _1435: x0 => x0.send(),
      _1436: () => new XMLHttpRequest(),
      _1437: (x0,x1) => x0.query(x1),
      _1438: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1438(f,arguments.length,x0) }),
      _1439: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1439(f,arguments.length,x0) }),
      _1440: (x0,x1,x2) => ({enableHighAccuracy: x0,timeout: x1,maximumAge: x2}),
      _1441: (x0,x1,x2,x3) => x0.getCurrentPosition(x1,x2,x3),
      _1446: (x0,x1) => x0.getItem(x1),
      _1447: (x0,x1) => x0.removeItem(x1),
      _1449: (x0,x1,x2,x3,x4) => x0.clearRect(x1,x2,x3,x4),
      _1450: (x0,x1,x2,x3,x4,x5) => x0.drawImage(x1,x2,x3,x4,x5),
      _1451: x0 => x0.close(),
      _1452: (x0,x1) => x0.querySelector(x1),
      _1453: (x0,x1) => x0.item(x1),
      _1455: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1455(f,arguments.length,x0) }),
      _1456: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1456(f,arguments.length,x0) }),
      _1457: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1457(f,arguments.length,x0) }),
      _1458: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1458(f,arguments.length,x0) }),
      _1459: (x0,x1) => x0.removeChild(x1),
      _1464: Date.now,
      _1466: s => new Date(s * 1000).getTimezoneOffset() * 60,
      _1467: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      _1468: () => {
        let stackString = new Error().stack.toString();
        let frames = stackString.split('\n');
        let drop = 2;
        if (frames[0] === 'Error') {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      _1469: () => typeof dartUseDateNowForTicks !== "undefined",
      _1470: () => 1000 * performance.now(),
      _1471: () => Date.now(),
      _1472: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      _1473: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      _1474: () => new WeakMap(),
      _1475: (map, o) => map.get(o),
      _1476: (map, o, v) => map.set(o, v),
      _1477: x0 => new WeakRef(x0),
      _1478: x0 => x0.deref(),
      _1485: () => globalThis.WeakRef,
      _1489: s => JSON.stringify(s),
      _1490: s => printToConsole(s),
      _1491: (o, p, r) => o.replaceAll(p, () => r),
      _1493: Function.prototype.call.bind(String.prototype.toLowerCase),
      _1494: s => s.toUpperCase(),
      _1495: s => s.trim(),
      _1496: s => s.trimLeft(),
      _1497: s => s.trimRight(),
      _1498: (string, times) => string.repeat(times),
      _1499: Function.prototype.call.bind(String.prototype.indexOf),
      _1500: (s, p, i) => s.lastIndexOf(p, i),
      _1501: (string, token) => string.split(token),
      _1502: Object.is,
      _1503: o => o instanceof Array,
      _1504: (a, i) => a.push(i),
      _1508: a => a.pop(),
      _1509: (a, i) => a.splice(i, 1),
      _1510: (a, s) => a.join(s),
      _1511: (a, s, e) => a.slice(s, e),
      _1513: (a, b) => a == b ? 0 : (a > b ? 1 : -1),
      _1514: a => a.length,
      _1516: (a, i) => a[i],
      _1517: (a, i, v) => a[i] = v,
      _1519: o => {
        if (o instanceof ArrayBuffer) return 0;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 1;
        }
        return 2;
      },
      _1520: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      _1522: o => o instanceof Uint8Array,
      _1523: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      _1524: o => o instanceof Int8Array,
      _1525: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      _1526: o => o instanceof Uint8ClampedArray,
      _1527: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      _1528: o => o instanceof Uint16Array,
      _1529: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      _1530: o => o instanceof Int16Array,
      _1531: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      _1532: o => o instanceof Uint32Array,
      _1533: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      _1534: o => o instanceof Int32Array,
      _1535: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      _1537: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      _1538: o => o instanceof Float32Array,
      _1539: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      _1540: o => o instanceof Float64Array,
      _1541: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      _1542: (t, s) => t.set(s),
      _1543: l => new DataView(new ArrayBuffer(l)),
      _1544: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      _1545: o => o.byteLength,
      _1546: o => o.buffer,
      _1547: o => o.byteOffset,
      _1548: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      _1549: (b, o) => new DataView(b, o),
      _1550: (b, o, l) => new DataView(b, o, l),
      _1551: Function.prototype.call.bind(DataView.prototype.getUint8),
      _1552: Function.prototype.call.bind(DataView.prototype.setUint8),
      _1553: Function.prototype.call.bind(DataView.prototype.getInt8),
      _1554: Function.prototype.call.bind(DataView.prototype.setInt8),
      _1555: Function.prototype.call.bind(DataView.prototype.getUint16),
      _1556: Function.prototype.call.bind(DataView.prototype.setUint16),
      _1557: Function.prototype.call.bind(DataView.prototype.getInt16),
      _1558: Function.prototype.call.bind(DataView.prototype.setInt16),
      _1559: Function.prototype.call.bind(DataView.prototype.getUint32),
      _1560: Function.prototype.call.bind(DataView.prototype.setUint32),
      _1561: Function.prototype.call.bind(DataView.prototype.getInt32),
      _1562: Function.prototype.call.bind(DataView.prototype.setInt32),
      _1565: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      _1566: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      _1567: Function.prototype.call.bind(DataView.prototype.getFloat32),
      _1568: Function.prototype.call.bind(DataView.prototype.setFloat32),
      _1569: Function.prototype.call.bind(DataView.prototype.getFloat64),
      _1570: Function.prototype.call.bind(DataView.prototype.setFloat64),
      _1583: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      _1584: (handle) => clearTimeout(handle),
      _1585: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      _1586: (handle) => clearInterval(handle),
      _1587: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      _1588: () => Date.now(),
      _1589: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      _1590: (x0,x1) => x0.exec(x1),
      _1591: (x0,x1) => x0.test(x1),
      _1592: x0 => x0.pop(),
      _1594: o => o === undefined,
      _1596: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      _1598: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      _1599: o => o instanceof RegExp,
      _1600: (l, r) => l === r,
      _1601: o => o,
      _1602: o => o,
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
      _1621: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1621(f,arguments.length,x0) }),
      _1622: f => finalizeWrapper(f, function(x0,x1) { return dartInstance.exports._1622(f,arguments.length,x0,x1) }),
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
      _1628: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1629: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1630: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1631: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1632: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1633: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1634: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1635: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1636: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1637: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1638: x0 => new ArrayBuffer(x0),
      _1639: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      _1641: x0 => x0.index,
      _1643: x0 => x0.flags,
      _1644: x0 => x0.multiline,
      _1645: x0 => x0.ignoreCase,
      _1646: x0 => x0.unicode,
      _1647: x0 => x0.dotAll,
      _1648: (x0,x1) => { x0.lastIndex = x1 },
      _1649: (o, p) => p in o,
      _1650: (o, p) => o[p],
      _1686: (x0,x1,x2) => globalThis.google.maps.event.addListener(x0,x1,x2),
      _1687: x0 => x0.remove(),
      _2061: x0 => x0.getBounds(),
      _2062: x0 => x0.getCenter(),
      _2066: x0 => x0.getHeading(),
      _2071: x0 => x0.getProjection(),
      _2074: x0 => x0.getTilt(),
      _2076: x0 => x0.getZoom(),
      _2081: (x0,x1) => x0.setHeading(x1),
      _2084: (x0,x1) => x0.setOptions(x1),
      _2087: (x0,x1) => x0.setTilt(x1),
      _2089: (x0,x1) => x0.setZoom(x1),
      _2090: f => finalizeWrapper(f, function() { return dartInstance.exports._2090(f,arguments.length) }),
      _2092: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._2092(f,arguments.length,x0) }),
      _2099: f => finalizeWrapper(f, function() { return dartInstance.exports._2099(f,arguments.length) }),
      _2108: f => finalizeWrapper(f, function() { return dartInstance.exports._2108(f,arguments.length) }),
      _2111: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._2111(f,arguments.length,x0) }),
      _2112: x0 => x0.latLng,
      _2158: x0 => x0.latLng,
      _2165: (x0,x1) => { x0.cameraControl = x1 },
      _2169: (x0,x1) => { x0.center = x1 },
      _2187: (x0,x1) => { x0.fullscreenControl = x1 },
      _2190: (x0,x1) => { x0.gestureHandling = x1 },
      _2203: (x0,x1) => { x0.mapId = x1 },
      _2205: (x0,x1) => { x0.mapTypeControl = x1 },
      _2209: (x0,x1) => { x0.mapTypeId = x1 },
      _2211: (x0,x1) => { x0.maxZoom = x1 },
      _2213: (x0,x1) => { x0.minZoom = x1 },
      _2224: x0 => x0.rotateControl,
      _2225: (x0,x1) => { x0.rotateControl = x1 },
      _2237: (x0,x1) => { x0.streetViewControl = x1 },
      _2240: (x0,x1) => { x0.styles = x1 },
      _2243: (x0,x1) => { x0.tilt = x1 },
      _2247: (x0,x1) => { x0.zoom = x1 },
      _2249: (x0,x1) => { x0.zoomControl = x1 },
      _2257: () => globalThis.google.maps.MapTypeId.HYBRID,
      _2258: () => globalThis.google.maps.MapTypeId.ROADMAP,
      _2259: () => globalThis.google.maps.MapTypeId.SATELLITE,
      _2260: () => globalThis.google.maps.MapTypeId.TERRAIN,
      _2265: (x0,x1) => { x0.stylers = x1 },
      _2267: (x0,x1) => { x0.elementType = x1 },
      _2269: (x0,x1) => { x0.featureType = x1 },
      _2362: f => finalizeWrapper(f, function(x0,x1,x2) { return dartInstance.exports._2362(f,arguments.length,x0,x1,x2) }),
      _2363: (x0,x1,x2) => ({map: x0,markers: x1,onClusterClick: x2}),
      _2374: x0 => new markerClusterer.MarkerClusterer(x0),
      _2968: x0 => x0.lat(),
      _2969: x0 => x0.lng(),
      _2997: x0 => x0.getNorthEast(),
      _2998: x0 => x0.getSouthWest(),
      _3029: x0 => x0.x,
      _3031: x0 => x0.y,
      _3967: (x0,x1) => x0.setContent(x1),
      _3992: x0 => x0.content,
      _3993: (x0,x1) => { x0.content = x1 },
      _4009: (x0,x1) => { x0.zIndex = x1 },
      _4077: (x0,x1,x2) => x0.fromLatLngToPoint(x1,x2),
      _4078: (x0,x1) => x0.fromLatLngToPoint(x1),
      _4080: (x0,x1,x2) => x0.fromPointToLatLng(x1,x2),
      _4113: (x0,x1) => { x0.url = x1 },
      _4114: (x0,x1) => { x0.anchor = x1 },
      _4121: (x0,x1) => { x0.scaledSize = x1 },
      _4123: (x0,x1) => { x0.size = x1 },
      _4131: x0 => x0.getMap(),
      _4144: (x0,x1) => x0.setMap(x1),
      _4146: (x0,x1) => x0.setOptions(x1),
      _4147: (x0,x1) => x0.setPosition(x1),
      _4150: (x0,x1) => x0.setVisible(x1),
      _4153: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._4153(f,arguments.length,x0) }),
      _4158: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._4158(f,arguments.length,x0) }),
      _4159: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._4159(f,arguments.length,x0) }),
      _4161: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._4161(f,arguments.length,x0) }),
      _4199: (x0,x1) => { x0.draggable = x1 },
      _4201: (x0,x1) => { x0.icon = x1 },
      _4207: (x0,x1) => { x0.opacity = x1 },
      _4211: (x0,x1) => { x0.position = x1 },
      _4215: (x0,x1) => { x0.title = x1 },
      _4217: (x0,x1) => { x0.visible = x1 },
      _4219: (x0,x1) => { x0.zIndex = x1 },
      _4283: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._4283(f,arguments.length,x0) }),
      _4284: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._4284(f,arguments.length,x0) }),
      _4291: () => new AbortController(),
      _4292: x0 => x0.abort(),
      _4293: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      _4294: (x0,x1) => globalThis.fetch(x0,x1),
      _4295: (x0,x1) => x0.get(x1),
      _4296: f => finalizeWrapper(f, function(x0,x1,x2) { return dartInstance.exports._4296(f,arguments.length,x0,x1,x2) }),
      _4297: (x0,x1) => x0.forEach(x1),
      _4298: x0 => x0.getReader(),
      _4299: x0 => x0.cancel(),
      _4300: x0 => x0.read(),
      _4301: (x0,x1) => x0.createImageBitmap(x1),
      _4302: (x0,x1) => x0.key(x1),
      _4315: x0 => x0.trustedTypes,
      _4316: (x0,x1) => { x0.innerHTML = x1 },
      _4317: (x0,x1) => { x0.innerHTML = x1 },
      _4318: x0 => x0.random(),
      _4319: (x0,x1) => x0.getRandomValues(x1),
      _4320: () => globalThis.crypto,
      _4321: () => globalThis.Math,
      _4325: (x0,x1,x2) => x0.toDataURL(x1,x2),
      _4329: Function.prototype.call.bind(Number.prototype.toString),
      _4330: Function.prototype.call.bind(BigInt.prototype.toString),
      _4331: Function.prototype.call.bind(Number.prototype.toString),
      _4332: (d, digits) => d.toFixed(digits),
      _4434: () => globalThis.document,
      _4440: (x0,x1) => { x0.height = x1 },
      _4442: (x0,x1) => { x0.width = x1 },
      _4451: x0 => x0.style,
      _4454: x0 => x0.src,
      _4455: (x0,x1) => { x0.src = x1 },
      _4456: x0 => x0.naturalWidth,
      _4457: x0 => x0.naturalHeight,
      _4473: x0 => x0.status,
      _4474: (x0,x1) => { x0.responseType = x1 },
      _4476: x0 => x0.response,
      _4593: (x0,x1) => { x0.draggable = x1 },
      _4599: (x0,x1) => { x0.innerText = x1 },
      _4609: x0 => x0.style,
      _4630: (x0,x1) => { x0.onclick = x1 },
      _4966: (x0,x1) => { x0.target = x1 },
      _4993: (x0,x1) => { x0.href = x1 },
      _5041: (x0,x1) => { x0.src = x1 },
      _5052: x0 => x0.width,
      _5054: x0 => x0.height,
      _5538: (x0,x1) => { x0.accept = x1 },
      _5552: x0 => x0.files,
      _5578: (x0,x1) => { x0.multiple = x1 },
      _5596: (x0,x1) => { x0.type = x1 },
      _5892: (x0,x1) => { x0.width = x1 },
      _5894: (x0,x1) => { x0.height = x1 },
      _6314: () => globalThis.window,
      _6354: x0 => x0.document,
      _6376: x0 => x0.navigator,
      _6638: x0 => x0.trustedTypes,
      _6640: x0 => x0.localStorage,
      _6746: x0 => x0.geolocation,
      _6751: x0 => x0.permissions,
      _6765: x0 => x0.userAgent,
      _6771: x0 => x0.onLine,
      _6798: x0 => x0.width,
      _6799: x0 => x0.height,
      _6972: x0 => x0.length,
      _8917: x0 => x0.signal,
      _8978: x0 => x0.firstChild,
      _8989: () => globalThis.document,
      _9070: x0 => x0.body,
      _9402: (x0,x1) => { x0.id = x1 },
      _9404: (x0,x1) => { x0.className = x1 },
      _9426: (x0,x1) => { x0.innerHTML = x1 },
      _9429: x0 => x0.children,
      _10748: x0 => x0.value,
      _10750: x0 => x0.done,
      _10930: x0 => x0.size,
      _10931: x0 => x0.type,
      _10938: x0 => x0.name,
      _10944: x0 => x0.length,
      _10949: x0 => x0.result,
      _11446: x0 => x0.url,
      _11448: x0 => x0.status,
      _11450: x0 => x0.statusText,
      _11451: x0 => x0.headers,
      _11452: x0 => x0.body,
      _11839: x0 => x0.state,
      _13156: x0 => x0.coords,
      _13157: x0 => x0.timestamp,
      _13159: x0 => x0.accuracy,
      _13160: x0 => x0.latitude,
      _13161: x0 => x0.longitude,
      _13162: x0 => x0.altitude,
      _13163: x0 => x0.altitudeAccuracy,
      _13164: x0 => x0.heading,
      _13165: x0 => x0.speed,
      _13166: x0 => x0.code,
      _13167: x0 => x0.message,
      _13853: (x0,x1) => { x0.display = x1 },
      _14017: (x0,x1) => { x0.height = x1 },
      _14707: (x0,x1) => { x0.width = x1 },
      _15075: x0 => x0.name,
      _15817: (x0,x1,x2,x3,x4,x5,x6,x7) => ({hue: x0,lightness: x1,saturation: x2,gamma: x3,invert_lightness: x4,visibility: x5,color: x6,weight: x7}),

    };

    const baseImports = {
      dart2wasm: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      S: new Proxy({}, { get(_, prop) { return prop; } }),

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
