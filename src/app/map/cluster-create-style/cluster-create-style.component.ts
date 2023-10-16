import { AfterViewChecked, AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Map } from 'mapbox-gl';
import * as mapboxgl from 'mapbox-gl';
import { MapComponent } from 'ngx-mapbox-gl';
import { eathquackes } from 'src/assets/earthquackes';

@Component({
  selector: 'app-cluster-create-style',
  templateUrl: './cluster-create-style.component.html',
  styleUrls: ['../examples.scss']

})
export class ClusterCreateStyleComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    if(!this.map) return;
    this.map.on('mouseenter', 'clusters', () => {
      this.map.getCanvas().style.cursor = 'pointer';
      console.log('fck u');
    });
    this.map.on('mouseleave', 'clusters', () => {
      this.map.getCanvas().style.cursor = '';
    });
  }


  earthquackes = eathquackes;
  map!: mapboxgl.Map;
  onClickCluster(e: any) {
    console.log(this.map);
    const features: any = this.map?.queryRenderedFeatures(e.point, {
      layers: ['clusters']
    });
    if (!features || !features.length) return;
    const clusterId = features[0].properties!.cluster_id;
    console.log("🚀 ~ file: cluster-create-style.component.ts:27 ~ ClusterCreateStyleComponent ~ onClickCluster ~ clusterId:", clusterId);
    (this.map?.getSource('earthquakes') as any).getClusterExpansionZoom(
      clusterId,
      (err: any, zoom: any) => {
        if (err) return;

        this.map?.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom
        });
      }
    );
  }
  onClickUnClustered(e: any) {
    console.log(e.features[0]);
    const coordinates = e.features[0].geometry.coordinates.slice();
    const mag = e.features[0].properties.mag;
    const tsunami =
      e.features[0].properties.tsunami === 1 ? 'yes' : 'no';

    // Ensure that if the map is zoomed out such that
    // multiple copies of the feature are visible, the
    // popup appears over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(
        `magnitude: ${mag}<br>Was there a tsunami?: ${tsunami}`
      )
      .addTo(this.map!);
  }
}
