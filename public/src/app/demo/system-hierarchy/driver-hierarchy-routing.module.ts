import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DriverHierarchyComponent } from './driver-hierarchy/driver-hierarchy.component';
// import { SingleDriverRewardsComponent } from './single-driver-rewards/single-driver-rewards.component';
// import { ViewDriverRewardsComponent } from './view-driver-rewards/view-driver-rewards.component';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { ViewDriverHierarchyComponent } from './view-driver-hierarchy/view-driver-hierarchy.component';
import { OneDriverHierarchyComponent } from './one-driver-hierarchy/one-driver-hierarchy.component';


const routes: Routes = [
  {
    path: 'driver-hierarchy',
    component: DriverHierarchyComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'HIERARCHY_HISTORY'
      }
    }
  },
  {
    path: 'one-driver-hierarchy/:driver_id',
    component: OneDriverHierarchyComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'HIERARCHY_HISTORY'
      }
    }
  },
  {
    path: 'view-driver-hierarchy/:driver_id',
    component: ViewDriverHierarchyComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'RIDES_HISTORY'
      }
    }
  },
  // {
  //   path: 'add-driver-reward/:driver_id',
  //   component: AddRewardComponent,
  //   canActivate: [NgxPermissionsGuard],
  //   data: {
  //     permissions: {
  //       only: 'RIDES_HISTORY'
  //     }
  //   }
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DriverHierarchyRoutingModule { }
