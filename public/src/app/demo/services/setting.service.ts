import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import 'rxjs/add/operator/map';
@Injectable({
  providedIn: 'root'
})
export class SettingService {

  constructor(private http: HttpClient) { }

  UpdateAdminFee(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/updateAdminFee', data);
  }

  GetAdminFee(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/getSystemSettings', data);
  }

  UpdateDriverMinimumBalance(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/updateDriverMinimumBalance', data);
  }

  GetCMSData() {
    return this.http.get<any>(environment.apiUrl + 'auth/getCMSData');
  }

  UpdateTermAndConditionData(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/updateTermAndConditionData', data);
  }

  UpdateAppVersion(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/updateAppVersion', data);
  }

  UpdateFbUrl(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/updatefbUrl', data);
  }

  DriverVersionUpdate(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/driverVersionUpdate', data);
  }
  PassengerVersionUpdate(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/passengerVersionUpdate', data);
  }

}
