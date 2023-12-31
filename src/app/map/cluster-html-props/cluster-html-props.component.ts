import { AfterContentInit, AfterViewChecked, AfterViewInit, Component, OnInit } from '@angular/core';
import { MapBoxToken } from 'environment';
import * as mapboxgl from 'mapbox-gl';
import { Map } from 'mapbox-gl';
import { eathquackes } from 'src/assets/earthquackes';

@Component({
  selector: 'app-cluster-html-props',
  templateUrl: './cluster-html-props.component.html',
  styleUrls: ['../examples.scss']
})
export class ClusterHtmlPropsComponent implements OnInit {
  mapO: mapboxgl.Map | undefined;
  x: mapboxgl.Map | undefined;

  ngOnInit(): void {
    this.mapO = new mapboxgl.Map({
      accessToken: MapBoxToken,
      container: 'map',
      zoom: 5,
      center: [-68.137343, 45.137451],
      style: 'mapbox://styles/mapbox/light-v11',
      projection: { name: 'mercator' }
    });
    let map = this.mapO;
    map.addControl(new mapboxgl.NavigationControl());

    // filters for classifying earthquakes into five categories based on magnitude
    const mag1 = ['<', ['get', 'mag'], 2];
    const mag2 = ['all', ['>=', ['get', 'mag'], 2], ['<', ['get', 'mag'], 3]];
    const mag3 = ['all', ['>=', ['get', 'mag'], 3], ['<', ['get', 'mag'], 4]];
    const mag4 = ['all', ['>=', ['get', 'mag'], 4], ['<', ['get', 'mag'], 5]];
    const mag5 = ['>=', ['get', 'mag'], 5];

    // colors to use for the categories
    const colors = ['#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c'];

    map.on('load', () => {
      // add a clustered GeoJSON source for a sample set of earthquakes
      map.addSource('earthquakes', {
        'type': 'geojson',
        'data': 'https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson',
        'cluster': true,
        'clusterRadius': 80,
        'clusterProperties': {
          // keep separate counts for each magnitude category in a cluster
          'mag1': ['+', ['case', mag1, 1, 0]],
          'mag2': ['+', ['case', mag2, 1, 0]],
          'mag3': ['+', ['case', mag3, 1, 0]],
          'mag4': ['+', ['case', mag4, 1, 0]],
          'mag5': ['+', ['case', mag5, 1, 0]]
        }
      });
      // circle and symbol layers for rendering individual earthquakes (unclustered points)
      map.addLayer({
        'id': 'earthquake_circle',
        'type': 'circle',
        'source': 'earthquakes',
        'filter': ['!=', 'cluster', true],
        'paint': {
          'circle-color': [
            'case',
            mag1,
            colors[0],
            mag2,
            colors[1],
            mag3,
            colors[2],
            mag4,
            colors[3],
            colors[4]
          ],
          'circle-opacity': 0.6,
          'circle-radius': 12
        }
      });
      map.addLayer({
        'id': 'earthquake_label',
        'type': 'symbol',
        'source': 'earthquakes',
        'filter': ['!=', 'cluster', true],
        'layout': {
          'text-field': [
            'number-format',
            ['get', 'mag'],
            { 'min-fraction-digits': 1, 'max-fraction-digits': 1 }
          ],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 10
        },
        'paint': {
          'text-color': [
            'case',
            ['<', ['get', 'mag'], 3],
            'black',
            'white'
          ]
        }
      });

      // objects for caching and keeping track of HTML marker objects (for performance)
      const markers: { [key: string]: any } = {};
      let markersOnScreen: { [key: string]: any } = {};
      function updateMarkers() {
        const newMarkers: any = {};
        const features: any = map.querySourceFeatures('earthquakes');

        // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
        // and add it to the map if it's not there already
        for (const feature of features) {
          const coords = feature.geometry.coordinates;
          const props = feature.properties;
          if (!props.cluster) continue;
          const id = props.cluster_id;

          let marker = markers[id];
          if (!marker) {
            const el: any = createDonutChart(props);
            marker = markers[id] = new mapboxgl.Marker({
              element: el
            }).setLngLat(coords);
          }
          newMarkers[id] = marker;

          if (!markersOnScreen[id]) marker.addTo(map);
        }
        // for every marker we've added previously, remove those that are no longer visible
        for (const id in markersOnScreen) {
          if (!newMarkers[id]) markersOnScreen[id].remove();
        }
        markersOnScreen = newMarkers;
      }

      // after the GeoJSON data is loaded, update markers on the screen on every frame
      map.on('render', () => {
        if (!map.isSourceLoaded('earthquakes')) return;
        updateMarkers();
      });
    });

    // code for creating an SVG donut chart from feature properties
    function createDonutChart(props: any) {
      const offsets = [];
      const counts = [
        props.mag1,
        props.mag2,
        props.mag3,
        props.mag4,
        props.mag5
      ];
      let total = 0;
      for (const count of counts) {
        offsets.push(total);
        total += count;
      }
      const fontSize =
        total >= 1000 ? 22 : total >= 100 ? 20 : total >= 10 ? 18 : 16;
      const r =
        total >= 1000 ? 50 : total >= 100 ? 32 : total >= 10 ? 24 : 18;
      const r0 = Math.round(r * 0.6);
      const w = r * 2;

      let html = `<div>
      <svg width="${w}" height="${w}" viewbox="0 0 ${w} ${w}" text-anchor="middle" style="font: ${fontSize}px sans-serif; display: block">`;

      for (let i = 0; i < counts.length; i++) {
        html += donutSegment(
          offsets[i] / total,
          (offsets[i] + counts[i]) / total,
          r,
          r0,
          colors[i]
        );
      }
      html += `<circle cx="${r}" cy="${r}" r="${r0}" fill="white" />
      <text dominant-baseline="central" transform="translate(${r}, ${r})">
      ${total.toLocaleString()}
      </text>
      </svg>
      </div>`;

      const el = document.createElement('div');
      el.innerHTML = html;
      return el.firstChild;
    }

    function donutSegment(start: any, end: any, r: any, r0: any, color: any) {
      if (end - start === 1) end -= 0.00001;
      const a0 = 2 * Math.PI * (start - 0.25);
      const a1 = 2 * Math.PI * (end - 0.25);
      const x0 = Math.cos(a0),
        y0 = Math.sin(a0);
      const x1 = Math.cos(a1),
        y1 = Math.sin(a1);
      const largeArc = end - start > 0.5 ? 1 : 0;

      // draw an SVG path
      return `<path d="M ${r + r0 * x0} ${r + r0 * y0} L ${r + r * x0} ${r + r * y0
        } A ${r} ${r} 0 ${largeArc} 1 ${r + r * x1} ${r + r * y1} L ${r + r0 * x1
        } ${r + r0 * y1} A ${r0} ${r0} 0 ${largeArc} 0 ${r + r0 * x0} ${r + r0 * y0
        }" fill="${color}" />`;
    }
  }
  map!: mapboxgl.Map
  earthQuackes = eathquackes;
  mag1 = ['<', ['get', 'mag'], 2];
  mag2 = ['all', ['>=', ['get', 'mag'], 2], ['<', ['get', 'mag'], 3]];
  mag3 = ['all', ['>=', ['get', 'mag'], 3], ['<', ['get', 'mag'], 4]];
  mag4 = ['all', ['>=', ['get', 'mag'], 4], ['<', ['get', 'mag'], 5]];
  mag5 = ['>=', ['get', 'mag'], 5];

  colors = ['#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c'];
  markers: { [key: string]: any } = {};
  markersOnScreen: { [key: string]: any } = {};

  // updateMarkers() {
  //   const newMarkers: any = {};
  //   const features: any = this.map.querySourceFeatures('earthquakes');

  //   // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
  //   // and add it to the map if it's not there already
  //   for (const feature of features) {
  //     const coords = feature.geometry.coordinates;
  //     const props = feature.properties;
  //     if (!props.cluster) continue;
  //     const id = props.cluster_id;

  //     let marker = this.markers[id];
  //     if (!marker) {
  //       const el: any = this.createDonutChart(props);
  //       marker = this.markers[id] = new mapboxgl.Marker({
  //         element: el
  //       }).setLngLat(coords);
  //     }
  //     newMarkers[id] = marker;

  //     if (!this.markersOnScreen[id]) marker.addTo(this.map);
  //   }
  //   // for every marker we've added previously, remove those that are no longer visible
  //   for (const id in this.markersOnScreen) {
  //     if (!newMarkers[id]) this.markersOnScreen[id].remove();
  //   }
  //   this.markersOnScreen = newMarkers;
  // }
  // // code for creating an SVG donut chart from feature properties
  // createDonutChart(props: any) {
  //   const offsets = [];
  //   const counts = [
  //     props.mag1,
  //     props.mag2,
  //     props.mag3,
  //     props.mag4,
  //     props.mag5
  //   ];
  //   let total = 0;
  //   for (const count of counts) {
  //     offsets.push(total);
  //     total += count;
  //   }
  //   const fontSize =
  //     total >= 1000 ? 22 : total >= 100 ? 20 : total >= 10 ? 18 : 16;
  //   const r =
  //     total >= 1000 ? 50 : total >= 100 ? 32 : total >= 10 ? 24 : 18;
  //   const r0 = Math.round(r * 0.6);
  //   const w = r * 2;

  //   let html = `<div>
  // <svg width="${w}" height="${w}" viewbox="0 0 ${w} ${w}" text-anchor="middle" style="font: ${fontSize}px sans-serif; display: block">`;

  //   for (let i = 0; i < counts.length; i++) {
  //     html += this.donutSegment(
  //       offsets[i] / total,
  //       (offsets[i] + counts[i]) / total,
  //       r,
  //       r0,
  //       this.colors[i]
  //     );
  //   }
  //   html += `<circle cx="${r}" cy="${r}" r="${r0}" fill="white" />
  // <text dominant-baseline="central" transform="translate(${r}, ${r})">
  // ${total.toLocaleString()}
  // </text>
  // </svg>
  // </div>`;

  //   const el = document.createElement('div');
  //   el.innerHTML = html;
  //   return el.firstChild;
  // }

  // donutSegment(start: number, end: number, r: number, r0: number, color: string) {
  //   if (end - start === 1) end -= 0.00001;
  //   const a0 = 2 * Math.PI * (start - 0.25);
  //   const a1 = 2 * Math.PI * (end - 0.25);
  //   const x0 = Math.cos(a0),
  //     y0 = Math.sin(a0);
  //   const x1 = Math.cos(a1),
  //     y1 = Math.sin(a1);
  //   const largeArc = end - start > 0.5 ? 1 : 0;

  //   // draw an SVG path
  //   return `<path d="M ${r + r0 * x0} ${r + r0 * y0} L ${r + r * x0} ${r + r * y0
  //     } A ${r} ${r} 0 ${largeArc} 1 ${r + r * x1} ${r + r * y1} L ${r + r0 * x1
  //     } ${r + r0 * y1} A ${r0} ${r0} 0 ${largeArc} 0 ${r + r0 * x0} ${r + r0 * y0
  //     }" fill="${color}" />`;
  // }
}
