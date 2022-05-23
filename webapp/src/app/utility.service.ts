import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  constructor() { }

  getShortDate(dateStr:string){
    let d = new Date(Date.parse(dateStr));
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
  }

  getLocalIsoDateTime(date: Date){
    let timeZoneOffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    return (new Date(date.getTime() - timeZoneOffset)).toISOString().slice(0, -1)
  }
}
