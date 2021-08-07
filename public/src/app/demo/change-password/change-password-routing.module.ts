import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ChangePasswordComponent } from './change-password.component';
import { NgxPermissionsGuard } from 'ngx-permissions';

const routes: Routes = [
  {
    path: '',
    component: ChangePasswordComponent,
    canActivate: [NgxPermissionsGuard],
     data: {
       permissions: {
         only: 'CHANGE_PASS'
       }
     }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChangePasswordRoutingModule { }
