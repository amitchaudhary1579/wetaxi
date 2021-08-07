import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import 'rxjs/add/operator/map'; 
import { Observable } from 'rxjs';

@Injectable()
export class VehicleService {
  
  constructor(private http: HttpClient) { }

  ListOfAllVehicles(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/listAllVehicleTypes', data);
  }

  addVehicleType(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/addVehicleType', data);
  }

  getVehicleDetails(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/getVehicleTypeById', data);
  }

  editVehicleType(data: any) {
    return this.http.put<any>(environment.apiUrl + 'api/editVehicleType', data);
  }

  deleteVehicleType(data) : Observable<any>  {
    let options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      body: data,
    };
    return this.http.delete(environment.apiUrl + 'api/deleteVehicleType', options);
  }

  activeInactiveVehicle(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/activeInactiveVehicleType', data);
  }
  
}