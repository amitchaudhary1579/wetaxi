import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import 'rxjs/add/operator/map'; 

@Injectable()
export class DriverService {
  constructor(private http: HttpClient) { }

  ListOfAllDrivers(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/ListOfAllDrivers', data);
  }

  getAllCountries() {
    let data = {};
    return this.http.post<any>(environment.apiUrl + 'api/getAllCountries', data);
  }

  getAllVehicleTypes() {
    let data = {};
    return this.http.post<any>(environment.apiUrl + 'api/getAllVehicleTypes', data);
  }

  addDriver(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/addDriver', data);
  }

  getDriverDetails(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/getDriverDetails', data);
  }

  editDriver(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/editDriver', data);
  }

  blockUnblockDriver(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/blockUnblockDriver', data);
  }

  verifyUnverifyDriver(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/verifyUnverifyDriver', data);
  }

  deleteDriver(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/deleteDriver', data);
  }

  getAllBillingPlans() {
    let data = {};
    return this.http.post<any>(environment.apiUrl + 'api/listAllBillingPlans', data);
  }

  updateBillingPlan(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/updateBillingPlan', data);
  }

  
}