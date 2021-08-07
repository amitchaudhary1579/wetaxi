import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import 'rxjs/add/operator/map'; 
import { Observable } from 'rxjs';

@Injectable()
export class HelpCenterService {
  
  constructor(private http: HttpClient) { }

  ListOfAllHelpCenters(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/listAllHelpCenters', data);
  }

  getHelpCenterDetails(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/getHelpCenterDetails', data);
  }

  addHelpCenterDetails(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/addHelpCenter', data);
  }

  editHelpCenter(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/editHelpCenter', data);
  }
  
  deleteHelpCenter(data: any) {
    return this.http.post<any>(environment.apiUrl + 'api/deleteHelpCenter', data);
  }
}