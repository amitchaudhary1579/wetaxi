import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import 'rxjs/add/operator/map';

@Injectable({
  providedIn: 'root'
})
export class DriverRideService {

  constructor(private http: HttpClient) { }

  ListOfAllDriversRide(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/listAllRideHistory', data);
  }
  
  SingleListOfAllDriversRide(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/getRideDetails', data);
  }

  CancelRide(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/cancelRide', data);
  }


}
