import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import 'rxjs/add/operator/map'; 

@Injectable()
export class PassengerService {
  constructor(private http: HttpClient) { }

  ListOfAllPassengers(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/ListOfAllPassengers', data);
  }

  getAllCountries() {
    let data = {};
    return this.http.post<any>(environment.apiUrl + 'api/getAllCountries', data);
  }

  addPassenger(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/addPassenger', data);
  }

  getPassengerDetails(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/getPassengerDetails', data);
  }

  editPassenger(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/editPassenger', data);
  }

  blockUnblockPassenger(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/blockUnblockPassenger', data);
  }

  deletePassenger(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/deletePassenger', data);
  }

  
}