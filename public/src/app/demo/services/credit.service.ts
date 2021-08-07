import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import 'rxjs/add/operator/map';

@Injectable()
export class CreditService {
  
  constructor(private http: HttpClient) { }

  ListOfAllDrivers(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/ListOfAllDrivers', data);
  }

  listAllCredits(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/listAllCredits', data);
  }

  getDriverCreditDetails(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/getDriverCreditDetails', data);
  }

  getDriverDetails(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/getDriverDetails', data);
  }

  getDriverList() {
    let data = {};
    return this.http.post<any>(environment.apiUrl + 'api/getDriverList', data);
  }

  addCredit(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/addCredit', data);
  }
  
}