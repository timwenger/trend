import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { RadioButton } from 'primeng/radiobutton';

import { ManageCategoriesComponent } from './manage-categories.component';

describe('ManageCategoriesComponent', () => {
  let component: ManageCategoriesComponent;
  let fixture: ComponentFixture<ManageCategoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageCategoriesComponent ],
      imports: [ ReactiveFormsModule, FormsModule, RadioButton ],
      providers: [ ConfirmationService ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
