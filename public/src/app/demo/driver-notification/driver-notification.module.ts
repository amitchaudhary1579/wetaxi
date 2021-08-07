import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NgxLoadingModule } from 'ngx-loading';
import { InputTrimModule } from 'ng2-trim-directive';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { FileValidator } from '../helper/file-input.validator';
import { SelectModule } from 'ng-select';
import { DriverNotificationRoutingModule } from './driver-notification-routing.module';
import { ListDriverNotificationComponent } from './list-driver-notification/list-driver-notification.component';

@NgModule({
  imports: [
    CommonModule,
    DriverNotificationRoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgbDropdownModule,
    NgxLoadingModule,
    InputTrimModule,
    NgbDatepickerModule,
    SelectModule
  ],
  declarations: [ ListDriverNotificationComponent],
  providers: [ FileValidator ]
})

export class DriverNotificationModule { }
