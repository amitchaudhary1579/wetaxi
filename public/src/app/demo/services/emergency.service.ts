import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import 'rxjs/add/operator/map'; 
import { Observable } from 'rxjs';

@Injectable()
export class EmergencyService {
  
  constructor(private http: HttpClient) { }

  AddEmergency(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/AddEmergency', data);
  }

  ListOfAllEmergencies(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/ListOfAllEmergencies', data);
  }

  getEmergencyDetails(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/getEmergencyDetails', data);
  }

  editEmergency(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/editEmergency', data);
  }

  deleteEmergency(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/deleteEmergency', data);
  }
  
}