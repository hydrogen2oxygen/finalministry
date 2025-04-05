import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreachersComponent } from './preachers.component';

describe('PreachersComponent', () => {
  let component: PreachersComponent;
  let fixture: ComponentFixture<PreachersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PreachersComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreachersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
