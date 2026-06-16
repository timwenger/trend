import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-no-categories',
    templateUrl: './no-categories.component.html',
    styleUrls: ['./no-categories.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class NoCategoriesComponent implements OnInit {

  @Input() visible: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

}
