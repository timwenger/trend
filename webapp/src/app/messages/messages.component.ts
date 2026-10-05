import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MessageService } from '../message.service';

@Component({
    selector: 'app-messages',
    templateUrl: './messages.component.html',
    styleUrls: ['./messages.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager
})
export class MessagesComponent implements OnInit {

  // here, messageService is public because it will be bound to the component's html template
  constructor(public messageService: MessageService) { }

  ngOnInit(): void {
  }

}
