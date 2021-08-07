import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import 'rxjs/add/operator/map'; 

@Injectable({
  providedIn: 'root'
})
export class RefferalHierarchyService {

  constructor(private http: HttpClient) { }

  ListAllDriverReferrals(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/listAllDriverReferral', data);
  }
  GetDriverReferralDetails(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/getDriverReferralDetails', data);
  }
  ListDriverReferralByLevel(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/listDriverReferralByLevel', data);
  }
  ListPassengerReferralByLevel(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/listPassengerReferralByLevel', data);
  }
  GetPassengerReferralDetails(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/getPassengerReferralDetails', data);
  }
  ListAllPassengerReferrals(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/listAllPassengerReferral', data);
  }
}
