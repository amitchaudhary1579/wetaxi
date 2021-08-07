import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListCreditComponent } from './list-credit/list-credit.component';
import { ViewCreditComponent } from './view-credit/view-credit.component';
import { NgxPermissionsGuard } from 'ngx-permissions';

const routes: Routes = [
  {
    path: 'list-credit',
    component: ListCreditComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'CREDIT'
      }
    }
  },
  {
    path: 'view-credit/:driver_id',
    component: ViewCreditComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'CREDIT'
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CreditRoutingModule { }
