import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { environment } from 'src/environments/environment';
import { NgxPermissionsService } from 'ngx-permissions';
@Injectable()
export class UserAuth implements CanActivate {

    constructor(
        private router: Router,
        private permissionsService: NgxPermissionsService
    ) { }

    canActivate() {
        if (localStorage.getItem('adminData')) {
            let adminData = JSON.parse(localStorage.getItem("adminData"));
            if(adminData.type == 'admin') {
                this.permissionsService.loadPermissions(environment.adminPermission);
            } else {
                this.permissionsService.loadPermissions(environment.operatorPermission);
            }
           return true;
        }
        this.router.navigate(['/login']);
        return false;
    }
}