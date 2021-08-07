import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListHelpcenterComponent } from './list-help-center/list-help-center.component';
import { ViewHelpcenterComponent } from './view-help-center/view-help-center.component';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { AddHelpCenterComponent } from './add-help-center/add-help-center.component';
const routes: Routes = [
  {
    path: 'list-help-center',
    component: ListHelpcenterComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'HELP_CENTER'
      }
    }
  },
  {
    path: 'view-help-center/:help_center_id',
    component: ViewHelpcenterComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'HELP_CENTER'
      }
    }
  },
  {
    path: 'add-help-center',
    component: AddHelpCenterComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'HELP_CENTER'
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HelpcenterRoutingModule { }
