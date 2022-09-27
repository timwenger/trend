import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-no-categories',
  templateUrl: './no-categories.component.html',
  styleUrls: ['./no-categories.component.css']
})
export class NoCategoriesComponent implements OnInit {

  @Input() visible: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

}
