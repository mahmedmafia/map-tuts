import { Component } from '@angular/core';
import { Map } from 'mapbox-gl';

@Component({
  selector: 'app-polygon-geo-json',
  templateUrl: './polygon-geo-json.component.html',
  styleUrls: ['../examples.scss']
})
export class PolygonGeoJsonComponent {
  map!: Map
}
