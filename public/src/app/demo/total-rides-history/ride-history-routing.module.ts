import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RidesHistoryComponent } from './rides-history/rides-history.component';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { ViewRidesHistoryComponent } from './view-rides-history/view-rides-history.component';


const routes: Routes = [
  {
    path: 'ride-history',
    component: RidesHistoryComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'RIDES_HISTORY'
      }
    }
  },
  {
    path: 'view-ride-history/:driver_id',
    component: ViewRidesHistoryComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'RIDES_HISTORY'
      }
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RideHistoryRoutingModule { }
