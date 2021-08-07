import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import 'rxjs/add/operator/map'; 

@Injectable()
export class OperatorService {
  
  constructor(private http: HttpClient) { }

  listAllOperators(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/listAllOperators', data);
  }

  addOperator(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/addOperator', data);
  }

  changePasswordStatus(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/changePasswordStatus', data);
  }

  getOperatorDetails(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/getOperatorDetails', data);
  }

  editOperator(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/editOperator', data);
  }

  activeInactiveOperator(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/activeInactiveOperator', data);
  }

  deleteOperator(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/deleteOperator', data);
  }
  
}