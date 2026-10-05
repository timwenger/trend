import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TopBarComponent } from './top-bar/top-bar.component';
import { MessagesComponent } from './messages/messages.component';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [TopBarComponent, MessagesComponent, RouterOutlet]
})
export class AppComponent implements OnInit{
  constructor(private title:Title){}
  ngOnInit(): void {
    this.title.setTitle('Trend');
  }

}