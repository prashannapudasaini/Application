import React, { useEffect, useRef, useImperativeHandle } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export interface MapComponentProps {
  mapRef: any;
  hubs: { name?: string; latitude: number; longitude: number }[];
  maxRadiusKm: number;
  userLocation: { latitude: number; longitude: number } | null;
  onPress: (lat: number, lng: number) => void;
}

export default function MapComponent({
  mapRef,
  hubs,
  maxRadiusKm,
  userLocation,
  onPress,
}: MapComponentProps) {
  const webviewRef = useRef<WebView>(null);

  // Hook up the parent's mapRef so it can still call animateToRegion
  useImperativeHandle(mapRef, () => ({
    animateToRegion: (region: any, duration: number = 1000) => {
      webviewRef.current?.injectJavaScript(`
        if (typeof map !== 'undefined') {
           map.flyTo([${region.latitude}, ${region.longitude}], 15, { duration: ${duration / 1000} });
        }
        true;
      `);
    }
  }));

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { padding: 0; margin: 0; background-color: #f3f4f6; }
    html, body, #map { height: 100%; width: 100vw; }
    /* Hide Leaflet watermark to keep it clean on mobile */
    .leaflet-control-attribution { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([27.685, 85.305], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var userMarker = null;

    // Draw Hubs & Delivery Zones
    ${hubs.map(hub => `
      L.circle([${hub.latitude}, ${hub.longitude}], {
        color: 'rgba(16, 185, 129, 0.9)',
        fillColor: 'rgba(16, 185, 129, 0.15)',
        fillOpacity: 1,
        weight: 3,
        radius: ${maxRadiusKm * 1000}
      }).addTo(map);
      
      // Hub icon
      var hubIcon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div style='background-color:#10B981;width:24px;height:24px;border-radius:12px;border:2px solid white;display:flex;justify-content:center;align-items:center;box-shadow:0 2px 4px rgba(0,0,0,0.3);font-size:12px;'>🐄</div>",
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([${hub.latitude}, ${hub.longitude}], {icon: hubIcon}).addTo(map);
    `).join('\n')}

    map.on('click', function(e) {
       window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ON_PRESS', lat: e.latlng.lat, lng: e.latlng.lng }));
    });

    function updateUserLocation(lat, lng) {
       if (userMarker) {
          userMarker.setLatLng([lat, lng]);
       } else {
          var redIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });
          userMarker = L.marker([lat, lng], {icon: redIcon}).addTo(map);
       }
    }
  </script>
</body>
</html>
  `;

  useEffect(() => {
    if (userLocation && webviewRef.current) {
       webviewRef.current.injectJavaScript(`
         if (typeof updateUserLocation === 'function') {
           updateUserLocation(${userLocation.latitude}, ${userLocation.longitude});
         }
         true;
       `);
    }
  }, [userLocation]);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={(event) => {
           try {
             const data = JSON.parse(event.nativeEvent.data);
             if (data.type === 'ON_PRESS') {
               onPress(data.lat, data.lng);
             }
           } catch (e) {}
        }}
        javaScriptEnabled={true}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
