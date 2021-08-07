import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import 'rxjs/add/operator/map'; 
import { Observable } from 'rxjs';

@Injectable()
export class BillingPlanService {
  
  constructor(private http: HttpClient) { }

  listAllBillingPlans(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/listAllBillingPlans', data);
  }

  getBillingPlanDetails(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/getBillingPlanDetails', data);
  }

  editBillingPlan(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/editBillingPlan', data);
  }
  
}