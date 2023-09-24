import { Component, OnInit, OnDestroy } from '@angular/core';
import { BusTimesService } from '../../services/api-service.service';
import {
  BusStop,
  LatLong,
  LatLongService,
} from '../../services/lat-long-service';

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
  iconSize = new OpenLayers.Size(45, 50);

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

      const map = new OpenLayers.Map('Map', { numZoomLevels: -1 });
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
        this.addBuses(this.currentLocation);
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
              console.log(evt);
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
      this.addBuses(d);
      map.addLayer(markers);
      map.setCenter(lonLat, 15);
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
  addBuses(latlng: LatLong) {
    if (!this.markers) {
      return;
    }
    if (!this.map) {
      return;
    }

    const min: LatLong = {
      lat: latlng.lat - 0.03,
      lng: latlng.lng > 0 ? latlng.lng - 0.04 : latlng.lng + 0.04,
    };

    this.markers.clearMarkers();
    const busicon = new OpenLayers.Icon(
      '/assets/js/img/dublin-bus.png',
      this.iconSize,
      this.iconOffset
    );
    this.busService.getBusTimes(latlng, min).subscribe((buses: any) => {
      buses.forEach((bus: any) => {
        if (!bus.coordinates) {
          return;
        }
        const lonLat = new OpenLayers.LonLat(
          bus.coordinates[0],
          bus.coordinates[1]
        ).transform(this.fromProjection, this.toProjection);
        const marker = new OpenLayers.Marker(lonLat, busicon.clone());
        const clickEvent = (evt: any) => {
          console.log(evt);
          const popup = new OpenLayers.Popup(
            'bus_marker',
            lonLat,
            new OpenLayers.Size(100, 50),
            `Bus ${bus['service']['line_name']} Towards ${bus['destination']}`,
            true
          );
          this.map.addPopup(popup);
        };
        marker.events.register('touchend', marker, clickEvent);
        marker.events.register('click', marker, clickEvent);

        this.markers.addMarker(marker);
      });
      this.addMe(latlng);
      this.map.setCenter(this.toLongLat(latlng), 17);
      console.log(this.map.markers);
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
    const query = event.target.value.toLowerCase();
    if (query && query.length > 2) {
      this.stops = this.latLongService.getStops(this.currentLocation, query);
    }
  }
  selectStop(stop: BusStop) {
    this.currentLocation = { lat: stop.stop_lat, lng: stop.stop_lon };
    this.addBuses(this.currentLocation);
    this.stops = [];
  }
}
