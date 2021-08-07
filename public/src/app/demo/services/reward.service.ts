import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import 'rxjs/add/operator/map';
@Injectable({
  providedIn: 'root'
})
export class RewardService {

  constructor(private http: HttpClient) { }

  ListOfAllDriversReward(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/listDriverReward', data);
  }
  ListOfAllPassangerReward(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/listPassengerReward', data);
  }

  AddDriversReward(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/addReward', data);
  }
  IsRewardRecive(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/receiveReward', data);
  }
}
