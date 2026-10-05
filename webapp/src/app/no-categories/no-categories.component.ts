import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Bind } from 'primeng/bind';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-no-categories',
    templateUrl: './no-categories.component.html',
    styleUrls: ['./no-categories.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [Bind, Card, Button, RouterLink]
})
export class NoCategoriesComponent implements OnInit {

  @Input() visible: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

}
