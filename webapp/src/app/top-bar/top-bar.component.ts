import { Component, OnInit } from '@angular/core';
import {MenuItem} from 'primeng/api';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent implements OnInit {

  constructor() { }

  items!: MenuItem[];

    ngOnInit() {
        this.items = [
            {
                label: 'Find Transactions',
                routerLink: "/transactions",
            },
            {
                label: 'Add a Transaction',
                icon: 'pi pi-fw pi-pencil',
                routerLink: "/add-transaction",
            }
        ];
    }

}
