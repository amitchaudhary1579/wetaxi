import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import 'rxjs/add/operator/map';
import { NgxPermissionsService } from 'ngx-permissions';
@Injectable()
export class AuthService {
  authParams: object;
  authToken: string;

  constructor(
    private http: HttpClient,
    private permissionsService: NgxPermissionsService
  ) { }

  doLogin(loginData: object) {
    return this.http.post<any>(environment.apiUrl + 'auth/login', loginData).map(response => {
      if (response.status_code == 200) {
        if (response.data.type == "operator") {
          this.authParams = {
            'admin_id': response.data._id,
            'email': response.data.email,
            'first_name': response.data.first_name,
            'last_name': response.data.last_name,
            'type': response.data.type,
            'chnagePassordPer': response.data.canChangePassword
          };
        } else {
          this.authParams = {
            'admin_id': response.data._id,
            'email': response.data.email,
            'first_name': response.data.first_name,
            'last_name': response.data.last_name,
            'type': response.data.type,
            'chnagePassordPer': true
          };
        }
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('adminData', JSON.stringify(this.authParams));

        if (response.data.type == 'admin') {
          this.permissionsService.loadPermissions(environment.adminPermission);
        } else {
          this.permissionsService.loadPermissions(environment.operatorPermission);
        }
      }
      return response;
    });
  }

  doLogout() {
    this.clearDataTableData("");
    localStorage.removeItem('access_token');
    localStorage.removeItem('adminData');
  }

  getDashboardData() {
    return this.http.get<any>(environment.apiUrl + 'api/getDashboardData');
  }

  getIncomeRelatedData() {
    return this.http.get<any>(environment.apiUrl + 'api/getIncomeRelatedData');
  }

  getDashboardMapData() {
    return this.http.get<any>(environment.apiUrl + 'api/getDashboardMapData');
  }

  getTopTenDriverAndPassengerData() {
    return this.http.get<any>(environment.apiUrl + 'api/getTopTenDriverAndPassengerData');
  }

  clearDataTableData(module: any) {
    if (module != "DataTables_passenger_management") {
      localStorage.removeItem("DataTables_passenger_management");
    }
    if (module != "DataTables_driver_management") {
      localStorage.removeItem("DataTables_driver_management");
    }
    if (module != "DataTables_vehicle_management") {
      localStorage.removeItem("DataTables_vehicle_management");
    }
    if (module != "DataTables_help_center_management") {
      localStorage.removeItem("DataTables_help_center_management");
    }
    if (module != "DataTables_emergency_management") {
      localStorage.removeItem("DataTables_emergency_management");
    }
    if (module != "DataTables_billing_plan_management") {
      localStorage.removeItem("DataTables_billing_plan_management");
    }
    if (module != "DataTables_operator_management") {
      localStorage.removeItem("DataTables_operator_management");
    }
    if (module != "DataTables_credit_management") {
      localStorage.removeItem("DataTables_credit_management");
    }
    if (module != "DataTables_heirarchy_management") {
      localStorage.removeItem("DataTables_heirarchy_management");
    }
  }

}