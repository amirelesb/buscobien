'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"assets/AssetManifest.bin": "3b7ffe4bcad3a228714fe5b917d821ac",
"assets/AssetManifest.bin.json": "e58b0b1283c4bfbafba22b18154fce2f",
"assets/assets/aviso_privacidad.pdf": "e94ea488bca56fc1e21eccb4673370fe",
"assets/assets/icon/app_icon.ico": "57bc99d60fa76fef2714cf3156b5c752",
"assets/assets/images/casa_comedor.jpeg": "1a796439f1487ef2a5684c59ec1015a3",
"assets/assets/images/casa_cuerna.jpeg": "267e29177c5e7263bd86d8678a542d36",
"assets/assets/images/casa_estudio.jpeg": "4015bc98f421da1f605219dbd6e2bb2e",
"assets/assets/images/casa_estudio2.jpg": "625908159732d89f31b621acf4a95f51",
"assets/assets/images/casa_jardin.jpeg": "fd231ef407d3ebab7e6937f0f9ac12de",
"assets/assets/images/casa_panoramica.jpg": "fc982540d9e1a69f7b6bde8fcaff45f8",
"assets/assets/images/casa_pasillo.jpeg": "e5d6c4a62e5a1973cb1a376e4fb2be15",
"assets/assets/images/fondo_opcion_1.jpg": "2f00bc6a8ae9d49fffc14620fac0b694",
"assets/assets/images/fondo_opcion_2.jpg": "9c478ea88acc4d100c78235b00aeef04",
"assets/assets/images/fondo_opcion_3.jpg": "c54cee5f6ceaac68391d4d90b1b4aac4",
"assets/assets/images/fondo_opcion_4.jpg": "352c07284bf8f2835ca9bfdcaaa570f1",
"assets/assets/images/fondo_opcion_5.jpg": "d1f1e54dc01afb88bb9804dd1f8f12cd",
"assets/assets/images/fondo_opcion_6.jpg": "957593324010fc8e5d8681fa4376cfb7",
"assets/assets/images/fondo_opcion_7.jpg": "159f500c29816537ae854a99b85be97c",
"assets/assets/images/fondo_opcion_8.jpg": "f3d8afc075a1556915119c79533d8bbf",
"assets/assets/images/fondo_opcion_9.jpg": "457b1e17bba4ff2ccc7e8d75cbf64092",
"assets/assets/images/logobuscobientazul.png": "495fa4b5c69945cbead0049ea004a1b2",
"assets/assets/images/logobuscobientblanco.png": "69acc0be75ef3bda5398e5378745de6f",
"assets/assets/images/nombrebuscobientazul.png": "2b35fc5f30753862457ef98e9c5bdcb6",
"assets/assets/images/nombrebuscobientblanco.png": "952fbc1d1cf7234beb11da8ea55759f9",
"assets/assets/terminos_condiciones.pdf": "57266fb1da0d1a8a418ef78842bf2418",
"assets/FontManifest.json": "733e592cf5e4007366442434ccbbfa6a",
"assets/fonts/Comfortaa-Bold.ttf": "281df342e6f73c20ebc6526f130e00b3",
"assets/fonts/Comfortaa-Light.ttf": "d30cea8a3c38eee6a405049e1d8c7c2f",
"assets/fonts/Comfortaa-Medium.ttf": "1a7bfac2b8d70a2726a281786c3894cd",
"assets/fonts/Comfortaa-Regular.ttf": "53f695dbfc6f703f86ed88bddde527b6",
"assets/fonts/Comfortaa-SemiBold.ttf": "50c5468a51006a4b81d223cc28aa1790",
"assets/fonts/MaterialIcons-Regular.otf": "e6c801fea9eb78d2e6e573242432e8fb",
"assets/fonts/Urbanist-Bold.ttf": "1ffe51e22e7841c65481a727515e2198",
"assets/fonts/Urbanist-Light.ttf": "46ffc15bcd0fb7da54fc241cb43ece28",
"assets/fonts/Urbanist-Medium.ttf": "9ffbd4b23b829ddd499aaf5eb925a86c",
"assets/fonts/Urbanist-Regular.ttf": "4c1ae1074c39cca3b3fd7a788b5afd96",
"assets/fonts/Urbanist-SemiBold.ttf": "ae731014b8aa4267df78b8e854d006ef",
"assets/NOTICES": "9af269e99d527561389afe28fc21cf04",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "33b7d9392238c04c131b6ce224e13711",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"assets/shaders/stretch_effect.frag": "40d68efbbf360632f614c731219e95f0",
"canvaskit/canvaskit.js": "8331fe38e66b3a898c4f37648aaf7ee2",
"canvaskit/canvaskit.js.symbols": "a3c9f77715b642d0437d9c275caba91e",
"canvaskit/canvaskit.wasm": "9b6a7830bf26959b200594729d73538e",
"canvaskit/chromium/canvaskit.js": "a80c765aaa8af8645c9fb1aae53f9abf",
"canvaskit/chromium/canvaskit.js.symbols": "e2d09f0e434bc118bf67dae526737d07",
"canvaskit/chromium/canvaskit.wasm": "a726e3f75a84fcdf495a15817c63a35d",
"canvaskit/skwasm.js": "8060d46e9a4901ca9991edd3a26be4f0",
"canvaskit/skwasm.js.symbols": "3a4aadf4e8141f284bd524976b1d6bdc",
"canvaskit/skwasm.wasm": "7e5f3afdd3b0747a1fd4517cea239898",
"canvaskit/skwasm_heavy.js": "740d43a6b8240ef9e23eed8c48840da4",
"canvaskit/skwasm_heavy.js.symbols": "0755b4fb399918388d71b59ad390b055",
"canvaskit/skwasm_heavy.wasm": "b0be7910760d205ea4e011458df6ee01",
"favicon.ico": "57bc99d60fa76fef2714cf3156b5c752",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"flutter.js": "24bc71911b75b5f8135c949e27a2984e",
"flutter_bootstrap.js": "3fcfbc294d97fcdc4acee250079c9691",
"icons/android-chrome-192x192.png": "8337ff912f3e3f8087a478c5cf1f9a3c",
"icons/android-chrome-512x512.png": "bf79eaa3800fca4240f07a205db88e03",
"icons/apple-touch-icon.png": "43c1aa91bc6e82770ff4f599f2b08ac8",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"index.html": "b09fccea87c1a0cb49635ca14ea36082",
"/": "b09fccea87c1a0cb49635ca14ea36082",
"logo.png": "8337ff912f3e3f8087a478c5cf1f9a3c",
"main.dart.js": "a526c08f40d18c384dfe7f171d296235",
"main.dart.mjs": "18af1a4bc1131fce19821484749f088b",
"main.dart.wasm": "f0dfd246b5ebf7a34f7cc3a2dc10b500",
"manifest.json": "cb628d9b92912ed4b52c9dab404338ad",
"version.json": "e199479ec81917783dfd705a11730804"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"main.dart.wasm",
"main.dart.mjs",
"index.html",
"flutter_bootstrap.js",
"assets/AssetManifest.bin.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
