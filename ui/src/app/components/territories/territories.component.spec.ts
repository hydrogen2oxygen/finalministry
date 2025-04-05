import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerritoriesComponent } from './territories.component';

describe('TerritoriesComponent', () => {
  let component: TerritoriesComponent;
  let fixture: ComponentFixture<TerritoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TerritoriesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TerritoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
