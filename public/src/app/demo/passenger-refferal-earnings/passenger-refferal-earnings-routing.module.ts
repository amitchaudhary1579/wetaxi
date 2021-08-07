import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListPassengerRefferalEarningsComponent } from './list-passenger-refferal-earnings/list-passenger-refferal-earnings.component';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { ViewPassengerRefferalEarningsComponent } from './view-passenger-refferal-earnings/view-passenger-refferal-earnings.component';

const routes: Routes = [
  {
    path: 'list-passenger-refferal-earnings',
    component: ListPassengerRefferalEarningsComponent,
    canActivate: [NgxPermissionsGuard],
     data: {
       permissions: {
         only: 'REFFERAL_EARNING'
       }
     }
  },
  {
    path: 'view-passenger-refferal-earnings/:passenger_id',
    component: ViewPassengerRefferalEarningsComponent,
    canActivate: [NgxPermissionsGuard],
     data: {
       permissions: {
         only: 'REFFERAL_EARNING'
       }
     }
  },
  // {
  //   path: 'single-view-passenger-ride/:passenger_id',
  //   component: SingleViewPassengerRideComponent,
  //   canActivate: [NgxPermissionsGuard],
  //    data: {
  //      permissions: {
  //        only: 'RIDES_HISTORY'
  //      }
  //    }
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PassengerRefferalEarningsRoutingModule { }
