import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListVehicleComponent } from './list-vehicle/list-vehicle.component';
import { AddVehicleComponent } from './add-vehicle/add-vehicle.component';
import { ViewVehicleComponent } from './view-vehicle/view-vehicle.component';
import { NgxPermissionsGuard } from 'ngx-permissions';

const routes: Routes = [
  {
    path: 'list-vehicle',
    component: ListVehicleComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'VEHICLE'
      }
    }
  },
  {
    path: 'add-vehicle',
    component: AddVehicleComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'VEHICLE'
      }
    }
  },
  {
    path: 'view-vehicle/:vehicle_id',
    component: ViewVehicleComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'VEHICLE'
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VehicleRoutingModule { }
