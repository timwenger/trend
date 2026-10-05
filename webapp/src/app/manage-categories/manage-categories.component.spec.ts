import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConfirmationService } from 'primeng/api';

import { ApiService } from '../api.service';
import { ManageCategoriesComponent } from './manage-categories.component';

describe('ManageCategoriesComponent', () => {
  let component: ManageCategoriesComponent;
  let fixture: ComponentFixture<ManageCategoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageCategoriesComponent],
      providers: [
        ConfirmationService,
        {
          provide: ApiService,
          useValue: {
            getCategories: () => of([]),
            getCategoryLastUsedDates: () => of({}),
          },
        },
      ]
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
