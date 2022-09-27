import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoCategoriesComponent } from './no-categories.component';

describe('NoCategoriesComponent', () => {
  let component: NoCategoriesComponent;
  let fixture: ComponentFixture<NoCategoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NoCategoriesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
