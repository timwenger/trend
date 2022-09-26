import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
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
        label: 'Find Transactions',
        routerLink: "/transactions",
      },
      {
        label: 'Add a Transaction',
        icon: 'pi pi-fw pi-pencil',
        routerLink: "/add-transaction",
      },
      {
        label: 'Manage Categories',
        icon: 'pi pi-fw pi-pencil',
        routerLink: "/manage-categories",
      }
    ];
  }

  public login(): void {
    this.auth.loginWithRedirect();
  }

  public logout(): void {
    this.auth.logout();
  }
}
