import { Component, OnInit, OnDestroy } from '@angular/core';
import { BusTimesService } from '../../services/api-service.service';
import {
  BusStop,
  LatLong,
  LatLongService,
} from '../../services/lat-long-service';
import { formatNumber } from '@angular/common';

declare const OpenLayers: any;
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
})
export class Tab1Page implements OnInit, OnDestroy {
  fromProjection = new OpenLayers.Projection('EPSG:4326'); // transform from WGS 1984
  toProjection = new OpenLayers.Projection('EPSG:900913'); // to Spherical Mercator Projection
  stops: BusStop[] = [];
  currentLocation: LatLong | undefined;
  map: any = undefined;
  markers: any = undefined;
  iconSize = new OpenLayers.Size(28, 28);

  iconOffset = new OpenLayers.Pixel(-(this.iconSize.w / 2), -this.iconSize.h);
  constructor(
    private latLongService: LatLongService,
    private busService: BusTimesService
  ) {}
  interval: any = null;
  ngOnInit(): void {
    this.latLongService.getLatLong().subscribe((d: LatLong) => {
      if (!d) {
        return;
      }
      this.currentLocation = d;

      const map = new OpenLayers.Map('Map', { numZoomLevels: -1, zoom: 14 });
      map.addLayer(new OpenLayers.Layer.OSM());
      this.map = map;

      const lonLat = new OpenLayers.LonLat(d.lng, d.lat).transform(
        this.fromProjection,
        this.toProjection
      );

      const markers = new OpenLayers.Layer.Markers('Markers');

      this.markers = markers;

      this.interval = setInterval(() => {
        if (!this.currentLocation) {
          clearInterval(this.interval);
          return;
        }
        this.addBuses();
      }, 20000);
      const addStops = (latlng: LatLong) => {
        this.latLongService.nearest(latlng, 1).then((e: BusStop[]) => {
          const iconSize = new OpenLayers.Size(25, 30);

          const iconOffset = new OpenLayers.Pixel(
            -(iconSize.w / 2),
            -iconSize.h
          );
          const Stopicon = new OpenLayers.Icon(
            '/assets/icon/bus-stop.png',
            iconSize,
            iconOffset
          );

          e.forEach((stop) => {
            const lonLat = new OpenLayers.LonLat(
              stop.stop_lon,
              stop.stop_lat
            ).transform(this.fromProjection, this.toProjection);
            const clickEvent = (evt: any) => {
              const popup = new OpenLayers.Popup(
                'bus_marker',
                lonLat,
                new OpenLayers.Size(100, 50),
                `${stop.stop_name} :  ${stop.stop_code}`,
                true
              );
              map.addPopup(popup);
            };
            const marker = new OpenLayers.Marker(lonLat, Stopicon.clone());
            marker.events.register('touchend', marker, clickEvent);
            marker.events.register('click', marker, clickEvent);

            markers.addMarker(marker);
          });
        });
      };
      // addStops(d);

      map.addLayer(markers);
      map.setCenter(lonLat, 14);

      map.events.register('moveend', map, (evt: any) => {
        this.addBuses();
      });
      this.map.setCenter(this.toLongLat(d), 14);
    });

    // map.zoomToMaxExtent();
  }
  addMe(latlng: LatLong) {
    const me = new OpenLayers.Icon(
      '/assets/icon/location.png',
      this.iconSize,
      this.iconOffset
    );
    const markerMe = new OpenLayers.Marker(this.toLongLat(latlng), me.clone());
    this.markers.addMarker(markerMe);
  }
  addBuses() {
    if (!this.markers) {
      return;
    }
    if (!this.map) {
      return;
    }

    this.markers.clearMarkers();
    const busicon = new OpenLayers.Icon(
      '/assets/js/img/dublin-bus.png',
      this.iconSize,
      this.iconOffset
    );

    const bounds = this.map
      .getExtent()
      .transform(this.toProjection, this.fromProjection);

    this.busService
      .getBusTimes(
        { lat: bounds.bottom, lng: bounds.left },
        { lat: bounds.top, lng: bounds.right }
      )
      .subscribe((buses: any) => {
        buses.forEach((bus: any) => {
          if (!bus.coordinates) {
            return;
          }
          const lonLat = new OpenLayers.LonLat(
            bus.coordinates[0],
            bus.coordinates[1]
          ).transform(this.fromProjection, this.toProjection);

          let fromMe: string = '';
          if (this.currentLocation) {
            fromMe = `<strong>${formatNumber(
              this.latLongService.calcDist(this.currentLocation, {
                lat: bus.coordinates[1],
                lng: bus.coordinates[0],
              }),
              'en-ie',
              '0.1-2'
            )}</strong> kms from you`;
          }
          const marker = new OpenLayers.Marker(lonLat, busicon.clone());
          const clickEvent = (evt: any) => {
            this.map.popups.forEach((popup: any) => {
              popup.destroy();
            });
            const popup = new OpenLayers.Popup(
              'bus_marker',
              lonLat,
              new OpenLayers.Size(100, 50),
              `Bus ${bus['service']['line_name']} Towards ${bus['destination']}
              <br>${fromMe}`,
              true
            );
            this.map.addPopup(popup);
          };
          marker.events.register('touchend', marker, clickEvent);
          marker.events.register('click', marker, clickEvent);

          this.markers.addMarker(marker);
        });
        if (this.currentLocation) {
          this.addMe(this.currentLocation);
        }
        // this.map.setCenter(this.toLongLat(latlng), 14);
      });
  }
  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  toLongLat(latlng: LatLong) {
    return new OpenLayers.LonLat(latlng.lng, latlng.lat).transform(
      this.fromProjection,
      this.toProjection
    );
  }

  searchStop(event: any) {
    if (!this.currentLocation) {
      return;
    }
    if (!event) {
      this.stops = [];
    }
    const query = event.target.value.toLowerCase();

    this.stops = this.latLongService.getStops(this.currentLocation, query);
  }
  setCenter(latLng: LatLong) {
    this.map.setCenter(this.toLongLat(latLng), 14);
  }
  selectStop(stop: BusStop) {
    this.currentLocation = { lat: stop.stop_lat, lng: stop.stop_lon };
    this.setCenter(this.currentLocation);
    this.stops = [];
  }
}
