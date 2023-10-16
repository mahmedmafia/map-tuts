import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NormalMapComponent } from './normal-map/normal-map.component';
import { ClusterCreateStyleComponent } from './cluster-create-style/cluster-create-style.component';
import { RouterModule, Routes } from '@angular/router';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { MapBoxToken } from 'environment';
import { PolygonGeoJsonComponent } from './polygon-geo-json/polygon-geo-json.component';
import { ClusterHtmlPropsComponent } from './cluster-html-props/cluster-html-props.component';

const routes: Routes = [
  { path: "", pathMatch: 'full', component: NormalMapComponent },
  { path: "clusterStyle", component: ClusterCreateStyleComponent },
  { path: "polygo-geoJson", component: PolygonGeoJsonComponent },
  { path: "cluster-html-props", component: ClusterHtmlPropsComponent },



];


@NgModule({
  declarations: [
    NormalMapComponent,
    ClusterCreateStyleComponent,
    PolygonGeoJsonComponent,
    ClusterHtmlPropsComponent
  ],
  imports: [
    CommonModule,
    NgxMapboxGLModule.withConfig({
      accessToken: MapBoxToken,
    }),
    RouterModule.forChild(routes)
  ]
})
export class MapModule { }
