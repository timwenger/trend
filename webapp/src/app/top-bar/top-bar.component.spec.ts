import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '@auth0/auth0-angular';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { TopBarComponent } from './top-bar.component';

describe('TopBarComponent', () => {
  let component: TopBarComponent;
  let fixture: ComponentFixture<TopBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopBarComponent],
      providers: [
        { provide: AuthService, useValue: { isAuthenticated$: of(true) } },
        provideRouter([]),
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    fixture = TestBed.createComponent(TopBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses exact route matching for navigation items', () => {
    const navigationItems = component.menuItems.filter(item => item.routerLink);

    expect(navigationItems.every(item => item.routerLinkActiveOptions?.exact)).toBe(true);
  });

  it('closes the mobile menu when touching outside it', () => {
    const hide = vi.fn();
    component['menubar'] = { mobileActive: true, hide } as never;
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    const event = new TouchEvent('touchstart');
    Object.defineProperty(event, 'target', { value: outside });

    component.onDocumentTouchStart(event);

    expect(component['menubar'].mobileActive).toBe(false);
    expect(hide).toHaveBeenCalledWith(event);
    outside.remove();
  });
});
