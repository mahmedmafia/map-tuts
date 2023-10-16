import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolygonGeoJsonComponent } from './polygon-geo-json.component';

describe('PolygonGeoJsonComponent', () => {
  let component: PolygonGeoJsonComponent;
  let fixture: ComponentFixture<PolygonGeoJsonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PolygonGeoJsonComponent]
    });
    fixture = TestBed.createComponent(PolygonGeoJsonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
