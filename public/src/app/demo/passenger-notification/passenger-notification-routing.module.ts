import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListPassengerNotificationComponent } from './list-passenger-notification/list-passenger-notification.component';
import { NgxPermissionsGuard } from 'ngx-permissions';

const routes: Routes = [
  {
    path: 'list-passenger-notification',
    component: ListPassengerNotificationComponent,
    canActivate: [NgxPermissionsGuard],
     data: {
       permissions: {
         only: 'NOTIFY'
       }
     }
  },
  // {
  //   path: 'view-passenger-refferal-earnings/:passenger_id',
  //   component: ViewPassengerRefferalEarningsComponent,
  //   canActivate: [NgxPermissionsGuard],
  //    data: {
  //      permissions: {
  //        only: 'REFFERAL_EARNING'
  //      }
  //    }
  // },
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
export class PassengerNotificationRoutingModule { }
