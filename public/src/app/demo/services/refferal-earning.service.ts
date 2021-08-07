import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import 'rxjs/add/operator/map'; 

@Injectable({
  providedIn: 'root'
})
export class RefferalEarningService {

  constructor(private http: HttpClient) { }

  GetDriverReferralEarning(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/getDriverReferralEarning', data);
  }
  GetPassengerReferralEarning(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/getPassengerReferralEarning', data);
  }
  DriverRefEarningWithdraw(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/driverRefEarningWithdraw', data);
  }
  PassengerRefEarningWithdraw(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/passengerRefEarningWithdraw', data);
  }
  DriverRefEarWithdrawAll(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/driverRefEarWithdrawAll', data);
  }
  PassengerRefEarWithdrawAll(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/passengerRefEarWithdrawAll', data);
  }
}
