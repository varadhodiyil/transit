import { Component, OnInit, OnDestroy } from '@angular/core';
import { BusTimesService } from 'src/app/services/api-service.service';
import { LatLong, LatLongService } from 'src/app/services/lat-long-service';

declare const OpenLayers: any;
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
})
export class Tab1Page implements OnInit, OnDestroy {
  constructor(
    private latLongService: LatLongService,
    private busService: BusTimesService
  ) {}
  interval: any = null;
  ngOnInit(): void {
    this.latLongService.getLatLong().subscribe((d: LatLong) => {
      const min: LatLong = {
        lat: d.lat - 0.03,
        lng: d.lng > 0 ? d.lng - 0.04 : d.lng + 0.04,
      };

      const map = new OpenLayers.Map('Map', { numZoomLevels: -1 });
      map.addLayer(new OpenLayers.Layer.OSM());
      const fromProjection = new OpenLayers.Projection('EPSG:4326'); // transform from WGS 1984
      const toProjection = new OpenLayers.Projection('EPSG:900913'); // to Spherical Mercator Projection

      const lonLat = new OpenLayers.LonLat(d.lng, d.lat).transform(
        fromProjection,
        toProjection
      );

      var iconSize = new OpenLayers.Size(45, 50);

      var iconOffset = new OpenLayers.Pixel(-(iconSize.w / 2), -iconSize.h);

      const busicon = new OpenLayers.Icon(
        '/assets/js/img/dublin-bus.png',
        iconSize,
        iconOffset
      );
      const me = new OpenLayers.Icon(
        '/assets/madhan_1.png',
        iconSize,
        iconOffset
      );

      const markers = new OpenLayers.Layer.Markers('Markers');

      const marker = new OpenLayers.Marker(lonLat, me.clone());
      markers.addMarker(marker);
      map.addLayer(markers);

      map.setCenter(lonLat, 15);

      const addBuses = () => {
        this.busService.getBusTimes(d, min).subscribe((buses: any) => {
          buses.forEach((bus: any) => {
            if (!bus.coordinates) {
              return;
            }
            const lonLat = new OpenLayers.LonLat(
              bus.coordinates[0],
              bus.coordinates[1]
            ).transform(fromProjection, toProjection);
            const marker = new OpenLayers.Marker(lonLat, busicon.clone());

            marker.events.register('click', marker, (evt: any) => {
              const popup = new OpenLayers.Popup(
                'chicken',
                lonLat,
                new OpenLayers.Size(200, 50),
                `Bus ${bus['service']['line_name']} Towards ${bus['destination']}`,
                true
              );
              map.addPopup(popup);
            });

            markers.addMarker(marker);
          });
        });
      };
      addBuses();
      this.interval = setInterval(() => {
        addBuses();
      }, 20000);
    });

    // map.zoomToMaxExtent();
  }
  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
