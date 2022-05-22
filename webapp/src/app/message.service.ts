import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  messages: string[] = [];
  msgNum: number = 1;

  add(message: string) {
    this.messages.push(this.msgNum + '. ' + message);
    this.msgNum++;
  }

  clear() {
    this.messages = [];
  }
}