import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NgxPermissionsGuard } from 'ngx-permissions';
import { ActionLogsComponent } from './action-logs.component';

const routes: Routes = [
  {
    path: 'list-action-log',
    component: ActionLogsComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'ACTION_LOGS'
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActionLogsRoutingModule { }
