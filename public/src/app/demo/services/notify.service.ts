import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import 'rxjs/add/operator/map';
@Injectable({
  providedIn: 'root'
})
export class NotifyService {

  constructor(private http: HttpClient) { }

  SendNotificationToDriver(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/sendNotificationToDriver', data);
  }

  SendNotificationToPassenger(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/sendNotificationToPassenger', data);
  }

  changePassword(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/changePassword', data);
  }

  ListOfAllNotificationLogs(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/ListOfAllNotificationLogs', data);
  }

  getNotificationLogsUserList(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/getNotificationLogsUserList', data);
  }

  sendNotificationFromNotificationLogs(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/sendNotificationFromNotificationLogs', data);
  }

}
