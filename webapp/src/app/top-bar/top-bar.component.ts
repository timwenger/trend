import { AfterViewInit, Component, OnDestroy, OnInit, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AuthService } from '@auth0/auth0-angular';
import { Bind } from 'primeng/bind';
import { Menubar } from 'primeng/menubar';
import { Ripple } from 'primeng/ripple';
import { ButtonDirective, ButtonIcon, ButtonLabel } from 'primeng/button';

@Component({
    selector: 'app-top-bar',
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [Bind, Menubar, Ripple, ButtonDirective, ButtonIcon, ButtonLabel]
})
export class TopBarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('menubar') private menubar!: Menubar;

  isLoggedIn!: boolean;
  menuItems!: MenuItem[];
  private readonly captureDocumentTouchStart = (event: TouchEvent): void =>
    this.onDocumentTouchStart(event);

  constructor(
    public auth: AuthService,
    private elementRef: ElementRef<HTMLElement>,
  ) { }



  ngOnInit() {
    this.auth.isAuthenticated$
      .subscribe(loggedInResult => this.AuthenticationStateUpdated(loggedInResult));
  }

  ngAfterViewInit(): void {
    document.addEventListener('touchstart', this.captureDocumentTouchStart, true);
  }

  ngOnDestroy(): void {
    document.removeEventListener('touchstart', this.captureDocumentTouchStart, true);
  }

  private AuthenticationStateUpdated(loggedInResult: boolean): void {
    this.isLoggedIn = loggedInResult;
    this.menuItems = this.getMenuItemsArray();
  }

  private getMenuItemsArray(): MenuItem[] {
    if (!this.isLoggedIn)
      return [];

    return [
      {
        label: 'Trends',
        icon: 'pi pi-fw pi-chart-line',
        routerLink: "/trends",
        routerLinkActiveOptions: { exact: true },
      },
      {
        label: 'Transactions',
        icon: 'pi pi-fw pi-search',
        routerLink: "/transactions",
        routerLinkActiveOptions: { exact: true },
      },
      {
        label: 'Recurring Transactions',
        icon: 'pi pi-fw pi-replay',
        routerLink: "/recurring-transactions",
        routerLinkActiveOptions: { exact: true },
      },
      {
        label: 'Categories',
        icon: 'pi pi-fw pi-pencil',
        routerLink: "/manage-categories",
        routerLinkActiveOptions: { exact: true },
      },
      {
        label: 'Logout',
        icon: 'pi pi-power-off',
        command: () => this.logout(),
      },
    ];
  }

  public login(): void {
    this.auth.loginWithRedirect();
  }

  public logout(): void {
    this.auth.logout();
  }

  onDocumentTouchStart(event: TouchEvent): void {
    const menuButton = this.elementRef.nativeElement.querySelector('.p-menubar-button');
    if (!this.menubar?.mobileActive && menuButton?.getAttribute('aria-expanded') !== 'true') {
      return;
    }

    const target = event.target as Node | null;
    const menuList = this.elementRef.nativeElement.querySelector('.p-menubar-root-list');
    if (target && (menuButton?.contains(target) || menuList?.contains(target))) {
      return;
    }

    this.menubar.mobileActive = false;
    this.menubar.hide(event);
  }
}
