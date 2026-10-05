import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
export class TopBarComponent implements OnInit {
  isLoggedIn!: boolean;
  menuItems!: MenuItem[];

  constructor(public auth: AuthService) { }



  ngOnInit() {
    this.auth.isAuthenticated$
      .subscribe(loggedInResult => this.AuthenticationStateUpdated(loggedInResult));
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
      },
      {
        label: 'Transactions',
        icon: 'pi pi-fw pi-search',
        routerLink: "/transactions",
      },
      {
        label: 'Recurring Transactions',
        icon: 'pi pi-fw pi-replay',
        routerLink: "/recurring-transactions",
      },
      {
        label: 'Categories',
        icon: 'pi pi-fw pi-pencil',
        routerLink: "/manage-categories",
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
}
